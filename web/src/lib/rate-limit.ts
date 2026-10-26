import { env } from "./env";
import { countRecentSessions, countRecentTurns } from "./store";
import type { SessionData } from "./types";

export type QuotaResult =
  | { ok: true }
  | { ok: false; code: string; message: string; action: string };

const DAY = 24 * 60 * 60 * 1000;
const HOUR = 60 * 60 * 1000;

export async function checkSessionQuota(anonId: string): Promise<QuotaResult> {
  const { mine, total } = await countRecentSessions(anonId, DAY);

  if (mine >= env.maxSessionsPerDay) {
    return {
      ok: false,
      code: "session_limit",
      message: `You’ve used today’s ${env.maxSessionsPerDay} free vivas.`,
      action: "Try again tomorrow, or watch one of the scripted replays.",
    };
  }

  if (total >= env.maxLiveSessionsPerDay) {
    return {
      ok: false,
      code: "global_limit",
      message: "Today’s live-session budget is full.",
      action: "The scripted replays are always open. Try again tomorrow.",
    };
  }

  return { ok: true };
}

export async function checkTurnQuota(anonId: string): Promise<QuotaResult> {
  const turns = await countRecentTurns(anonId, HOUR);

  if (turns >= env.maxTurnsPerHour) {
    return {
      ok: false,
      code: "turn_limit",
      message: "You’ve reached the hourly answer limit.",
      action: "Take a short break, then continue the same viva.",
    };
  }

  return { ok: true };
}

export function countTurns(session: SessionData) {
  return session.turns.length;
}
