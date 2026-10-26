import "server-only";

function trimmed(value: string | undefined) {
  const next = value?.trim();
  return next ? next : undefined;
}

export function demoAsset() {
  const url = trimmed(process.env.DEMO_VIDEO_URL);
  return url
    ? { href: url, external: true, real: true }
    : { href: "/demo", external: false, real: false };
}

export function reportAsset() {
  const slug = trimmed(process.env.FEATURED_REPORT_SLUG);
  return slug
    ? { href: `/r/${slug}`, external: false, real: true }
    : { href: "/demo/auth", external: false, real: false };
}

export function flowUsage() {
  return {
    cardUrl: trimmed(process.env.FLOW_USAGE_CARD_URL),
    words: trimmed(process.env.FLOW_WORDS_DICTATED),
    timeSaved: trimmed(process.env.FLOW_TIME_SAVED),
  };
}
