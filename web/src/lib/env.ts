type Provider = "google" | "groq" | "anthropic";

function provider(value: string | undefined): Provider {
  if (value === "google" || value === "anthropic") return value;
  return "groq";
}

function databaseUrl(value: string | undefined) {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    if (!url.protocol.startsWith("postgres")) return undefined;
    if (url.hostname === "host" || url.hostname.endsWith("example.com")) {
      return undefined;
    }
    if (url.username === "user" && url.password === "password") {
      return undefined;
    }
    return value;
  } catch {
    return undefined;
  }
}

export const env = {
  databaseUrl: databaseUrl(process.env.DATABASE_URL),
  aiProvider: provider(process.env.AI_PROVIDER),
  googleKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
  groqKey: process.env.GROQ_API_KEY,
  anthropicKey: process.env.ANTHROPIC_API_KEY,
  anthropicModel: process.env.ANTHROPIC_MODEL,
  allowClaudeFallback: process.env.ALLOW_CLAUDE_FALLBACK === "true",
  modelSmart: process.env.MODEL_SMART ?? "gemini-3.8-flash",
  modelFast: process.env.MODEL_FAST ?? "gemini-3.8-flash",
  modelFallback: process.env.MODEL_FALLBACK ?? "openai/gpt-oss-120b",
  maxSessionsPerDay: Number(process.env.MAX_SESSIONS_PER_DAY ?? 10),
  maxLiveSessionsPerDay: Number(process.env.MAX_LIVE_SESSIONS_PER_DAY ?? 20),
  maxTurnsPerHour: Number(process.env.MAX_TURNS_PER_HOUR ?? 60),
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "",
  githubToken: process.env.GITHUB_TOKEN,
  dataDir: process.env.VIVA_DATA_DIR,
};

export function llmConfigured() {
  return Boolean(env.googleKey || env.groqKey || env.anthropicKey);
}
