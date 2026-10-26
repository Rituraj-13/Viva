import "server-only";

export function elapsedMs(startedAt: number): number {
  return Math.round((performance.now() - startedAt) * 10) / 10;
}

export function logDb(
  op: string,
  startedAt: number,
  extra: Record<string, unknown> = {},
) {
  console.info("[viva][db]", {
    op,
    ms: elapsedMs(startedAt),
    ...extra,
  });
}

export function logLlm(event: Record<string, unknown>) {
  console.info("[viva][llm]", event);
}

export function logApi(
  route: string,
  startedAt: number,
  extra: Record<string, unknown> = {},
) {
  console.info("[viva][api]", {
    route,
    totalMs: elapsedMs(startedAt),
    ...extra,
  });
}

export function serverTiming(
  entries: Record<string, number | undefined>,
): string {
  return Object.entries(entries)
    .filter(
      (entry): entry is [string, number] =>
        typeof entry[1] === "number" && Number.isFinite(entry[1]),
    )
    .map(([name, ms]) => `${name};dur=${Math.round(ms)}`)
    .join(", ");
}
