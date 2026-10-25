import "server-only";
import { neon } from "@neondatabase/serverless";
import { promises as fs } from "node:fs";
import path from "node:path";
import { env } from "./env";
import type { SessionData } from "./types";

const sql = env.databaseUrl ? neon(env.databaseUrl) : null;

let schemaPromise: Promise<void> | null = null;

async function ensureSchema() {
  if (!sql) return;
  if (!schemaPromise) {
    schemaPromise = (async () => {
      await sql`
        create table if not exists viva_sessions (
          id text primary key,
          slug text not null unique,
          anon_id text not null,
          status text not null,
          data jsonb not null,
          created_at timestamptz not null default now(),
          updated_at timestamptz not null default now()
        )
      `;
      await sql`create index if not exists viva_sessions_slug_idx on viva_sessions (slug)`;
      await sql`create index if not exists viva_sessions_anon_idx on viva_sessions (anon_id)`;
      await sql`create index if not exists viva_sessions_updated_idx on viva_sessions (updated_at)`;
    })().catch((error) => {
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
  try {
    const raw = await fs.readFile(dataFile, "utf8");
    return JSON.parse(raw) as Record<string, SessionData>;
  } catch {
    return {};
  }
}

async function writeAll(data: Record<string, SessionData>) {
  try {
    await fs.mkdir(dataDir, { recursive: true });
    const tmp = `${dataFile}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(data, null, 2), "utf8");
    await fs.rename(tmp, dataFile);
  } catch (error) {
    if (!writeWarned) {
      writeWarned = true;
      console.warn("[viva] File store is not writable; writes will not persist.", error);
    }
  }
}

export function storeKind() {
  return sql ? "postgres" : "file";
}

export async function saveSession(session: SessionData): Promise<void> {
  if (sql) {
    await ensureSchema();
    await sql`
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
    `;
    return;
  }

  const all = await readAll();
  all[session.id] = session;
  await writeAll(all);
}

export async function getSession(id: string): Promise<SessionData | null> {
  if (sql) {
    await ensureSchema();
    const rows = await sql`select data from viva_sessions where id = ${id} limit 1`;
    return parseData(rows[0]?.data);
  }
  const all = await readAll();
  return all[id] ?? null;
}

export async function getSessionBySlug(slug: string): Promise<SessionData | null> {
  if (sql) {
    await ensureSchema();
    const rows = await sql`select data from viva_sessions where slug = ${slug} limit 1`;
    return parseData(rows[0]?.data);
  }
  const all = await readAll();
  return Object.values(all).find((s) => s.slug === slug) ?? null;
}

export async function listSessions(): Promise<SessionData[]> {
  if (sql) {
    await ensureSchema();
    const rows = await sql`select data from viva_sessions order by updated_at desc limit 500`;
    return rows
      .map((row) => parseData(row.data))
      .filter((s): s is SessionData => Boolean(s));
  }
  const all = await readAll();
  return Object.values(all).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function deleteSession(id: string): Promise<void> {
  if (sql) {
    await ensureSchema();
    await sql`delete from viva_sessions where id = ${id}`;
    return;
  }
  const all = await readAll();
  delete all[id];
  await writeAll(all);
}
