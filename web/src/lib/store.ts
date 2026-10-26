import "server-only";
import { neon } from "@neondatabase/serverless";
import { promises as fs } from "node:fs";
import path from "node:path";
import { env } from "./env";
import { logDb } from "./timing";
import type { SessionData } from "./types";

const sql = env.databaseUrl ? neon(env.databaseUrl) : null;

let schemaPromise: Promise<void> | null = null;

type DbDetail =
  | Record<string, unknown>
  | ((result: unknown) => Record<string, unknown>);

async function timedDb<T>(
  op: string,
  fn: () => Promise<T>,
  detail?: DbDetail,
): Promise<T> {
  const startedAt = performance.now();
  try {
    const result = await fn();
    logDb(op, startedAt, {
      ...(typeof detail === "function" ? detail(result) : detail),
      ok: true,
    });
    return result;
  } catch (error) {
    logDb(op, startedAt, {
      ...(typeof detail === "function" ? {} : detail),
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

async function ensureSchema() {
  if (!sql) return;
  if (!schemaPromise) {
    // One transaction means one HTTP round trip instead of one per statement.
    // Every statement is idempotent, so a cold serverless instance can run this
    // concurrently with another instance without racing.
    schemaPromise = timedDb(
      "ensureSchema",
      async () => {
        await sql.transaction([
          sql`
            create table if not exists viva_sessions (
              id text primary key,
              slug text not null unique,
              anon_id text not null,
              status text not null,
              data jsonb not null,
              created_at timestamptz not null default now(),
              updated_at timestamptz not null default now()
            )
          `,
          sql`create index if not exists viva_sessions_slug_idx on viva_sessions (slug)`,
          sql`create index if not exists viva_sessions_anon_idx on viva_sessions (anon_id)`,
          sql`create index if not exists viva_sessions_updated_idx on viva_sessions (updated_at)`,
          sql`create index if not exists viva_sessions_created_idx on viva_sessions (created_at)`,
          sql`create index if not exists viva_sessions_anon_created_idx on viva_sessions (anon_id, created_at)`,
          sql`
            create table if not exists viva_turns (
              id text primary key,
              session_id text not null references viva_sessions(id) on delete cascade,
              anon_id text not null,
              created_at timestamptz not null default now()
            )
          `,
          sql`create index if not exists viva_turns_session_idx on viva_turns (session_id)`,
          sql`create index if not exists viva_turns_anon_created_idx on viva_turns (anon_id, created_at)`,
        ]);
      },
      { store: "postgres" },
    ).catch((error) => {
      schemaPromise = null;
      throw error;
    });
  }
  return schemaPromise;
}

function parseData(value: unknown): SessionData | null {
  if (!value) return null;
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as SessionData;
    } catch {
      return null;
    }
  }
  return value as SessionData;
}

const dataDir = env.dataDir ?? path.join(process.cwd(), ".data");
const dataFile = path.join(dataDir, "sessions.json");

let writeWarned = false;

async function readAll(): Promise<Record<string, SessionData>> {
  // The local file store is a dev fallback. Read from disk on every call so
  // separate Next workers cannot serve a stale in-memory copy.
  return timedDb(
    "readAll:file",
    async () => {
      try {
        const raw = await fs.readFile(dataFile, "utf8");
        return JSON.parse(raw) as Record<string, SessionData>;
      } catch {
        return {};
      }
    },
    (data) => ({
      store: "file",
      sessions: Object.keys(data as Record<string, SessionData>).length,
    }),
  );
}

async function writeAll(data: Record<string, SessionData>) {
  await timedDb(
    "writeAll:file",
    async () => {
      try {
        await fs.mkdir(dataDir, { recursive: true });
        const tmp = `${dataFile}.tmp`;
        await fs.writeFile(tmp, JSON.stringify(data, null, 2), "utf8");
        await fs.rename(tmp, dataFile);
      } catch (error) {
        if (!writeWarned) {
          writeWarned = true;
          console.warn(
            "[viva] File store is not writable; writes will not persist.",
            error,
          );
        }
      }
    },
    { store: "file", sessions: Object.keys(data).length },
  );
}

export function storeKind() {
  return sql ? "postgres" : "file";
}

export async function saveSession(session: SessionData): Promise<void> {
  if (sql) {
    await ensureSchema();
    await timedDb(
      "saveSession",
      () => sql`
        insert into viva_sessions (id, slug, anon_id, status, data, created_at, updated_at)
        values (
          ${session.id},
          ${session.slug},
          ${session.anonId},
          ${session.status},
          ${JSON.stringify(session)}::jsonb,
          now(),
          now()
        )
        on conflict (id) do update set
          slug = excluded.slug,
          anon_id = excluded.anon_id,
          status = excluded.status,
          data = excluded.data,
          updated_at = now()
      `,
      { store: "postgres" },
    );
    return;
  }

  const all = await readAll();
  all[session.id] = session;
  await writeAll(all);
}

export async function getSession(id: string): Promise<SessionData | null> {
  if (sql) {
    await ensureSchema();
    const rows = await timedDb(
      "getSession",
      () => sql`select data from viva_sessions where id = ${id} limit 1`,
      (result) => ({
        store: "postgres",
        rows: (result as unknown[]).length,
      }),
    );
    return parseData(rows[0]?.data);
  }
  const all = await readAll();
  return all[id] ?? null;
}

export async function getSessionBySlug(
  slug: string,
): Promise<SessionData | null> {
  if (sql) {
    await ensureSchema();
    const rows = await timedDb(
      "getSessionBySlug",
      () => sql`select data from viva_sessions where slug = ${slug} limit 1`,
      (result) => ({
        store: "postgres",
        rows: (result as unknown[]).length,
      }),
    );
    return parseData(rows[0]?.data);
  }
  const all = await readAll();
  return Object.values(all).find((s) => s.slug === slug) ?? null;
}

export async function listSessions(): Promise<SessionData[]> {
  if (sql) {
    await ensureSchema();
    const rows = await timedDb(
      "listSessions",
      () => sql`select data from viva_sessions order by updated_at desc limit 500`,
      (result) => ({
        store: "postgres",
        rows: (result as unknown[]).length,
      }),
    );
    return rows
      .map((row) => parseData(row.data))
      .filter((s): s is SessionData => Boolean(s));
  }
  const all = await readAll();
  return Object.values(all).sort((a, b) =>
    b.updatedAt.localeCompare(a.updatedAt),
  );
}

export async function deleteSession(id: string): Promise<void> {
  if (sql) {
    await ensureSchema();
    await timedDb(
      "deleteSession",
      () => sql`delete from viva_sessions where id = ${id}`,
      { store: "postgres" },
    );
    return;
  }
  const all = await readAll();
  delete all[id];
  await writeAll(all);
}

export type RecentSessionCounts = { mine: number; total: number };

export async function countRecentSessions(
  anonId: string,
  windowMs: number,
): Promise<RecentSessionCounts> {
  if (sql) {
    await ensureSchema();
    const cutoff = new Date(Date.now() - windowMs).toISOString();
    const rows = await timedDb(
      "countRecentSessions",
      () => sql`
        select
          (
            select count(*)::int
            from viva_sessions
            where anon_id = ${anonId}
              and created_at > ${cutoff}::timestamptz
          ) as mine,
          (
            select count(*)::int
            from viva_sessions
            where created_at > ${cutoff}::timestamptz
          ) as total
      `,
      { store: "postgres" },
    );
    return {
      mine: Number(rows[0]?.mine ?? 0),
      total: Number(rows[0]?.total ?? 0),
    };
  }

  const all = await readAll();
  const cutoff = Date.now() - windowMs;
  const recent = Object.values(all).filter((session) => {
    const created = Date.parse(session.createdAt);
    return Number.isFinite(created) && created > cutoff;
  });
  return {
    mine: recent.filter((session) => session.anonId === anonId).length,
    total: recent.length,
  };
}

export async function countRecentTurns(
  anonId: string,
  windowMs: number,
): Promise<number> {
  if (sql) {
    await ensureSchema();
    const cutoff = new Date(Date.now() - windowMs).toISOString();
    const rows = await timedDb(
      "countRecentTurns",
      () => sql`
        select count(*)::int as count
        from viva_turns
        where anon_id = ${anonId}
          and created_at > ${cutoff}::timestamptz
      `,
      { store: "postgres" },
    );
    return Number(rows[0]?.count ?? 0);
  }

  const all = await readAll();
  const cutoff = Date.now() - windowMs;
  let turns = 0;
  for (const session of Object.values(all)) {
    if (session.anonId !== anonId) continue;
    for (const turn of session.turns) {
      const created = Date.parse(turn.createdAt);
      if (Number.isFinite(created) && created > cutoff) turns += 1;
    }
  }
  return turns;
}

export type TurnUsage = {
  turnId: string;
  sessionId: string;
  anonId: string;
  createdAt: string;
};

export async function recordTurnUsage(turn: TurnUsage): Promise<void> {
  if (!sql) return;
  try {
    await ensureSchema();
    await timedDb(
      "recordTurnUsage",
      () => sql`
        insert into viva_turns (id, session_id, anon_id, created_at)
        values (
          ${turn.turnId},
          ${turn.sessionId},
          ${turn.anonId},
          ${turn.createdAt}::timestamptz
        )
        on conflict (id) do nothing
      `,
      { store: "postgres" },
    );
  } catch (error) {
    console.warn("[viva][db] turn usage was not recorded", {
      turnId: turn.turnId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
