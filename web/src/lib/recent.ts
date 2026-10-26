export type RecentBand = "ready" | "almost" | "not_yet";

export type RecentViva = {
  id: string;
  slug: string;
  filePath: string;
  language: string;
  createdAt: string;
  band?: RecentBand;
  score?: number;
  savedAt: string;
};

const KEY = "viva:recent:v1";
const EVENT = "viva:recent";
const MAX = 6;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isRecent(value: unknown): value is RecentViva {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === "string" &&
    typeof value.slug === "string" &&
    typeof value.filePath === "string" &&
    typeof value.language === "string" &&
    typeof value.createdAt === "string" &&
    typeof value.savedAt === "string" &&
    (value.band === undefined ||
      value.band === "ready" ||
      value.band === "almost" ||
      value.band === "not_yet") &&
    (value.score === undefined || typeof value.score === "number")
  );
}

export function readRecent(): RecentViva[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isRecent).slice(0, MAX);
  } catch {
    return [];
  }
}

function writeRecent(items: RecentViva[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(items.slice(0, MAX)));
  } catch {
    // Storage can be full or disabled. The exam still works without it.
  }
  window.dispatchEvent(new Event(EVENT));
}

export function recordRecent(viva: Omit<RecentViva, "savedAt">) {
  if (typeof window === "undefined") return;
  const next: RecentViva = { ...viva, savedAt: new Date().toISOString() };
  writeRecent([next, ...readRecent().filter((item) => item.id !== viva.id)]);
}

export function clearRecent() {
  writeRecent([]);
}

export function subscribeRecent(listener: () => void) {
  if (typeof window === "undefined") return () => {};
  const handler = () => listener();
  window.addEventListener(EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}
