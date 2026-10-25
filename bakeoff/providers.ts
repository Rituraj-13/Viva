import { anthropic } from "@ai-sdk/anthropic";
import { google } from "@ai-sdk/google";
import { groq } from "@ai-sdk/groq";

export type Provider = "google" | "groq" | "anthropic";

export function getModel(provider: Provider) {
  switch (provider) {
    case "google":
      return google(
        process.env.BAKEOFF_GOOGLE_MODEL ??
          process.env.MODEL_SMART ??
          "gemini-3.8-flash",
      );
    case "groq":
      return groq(
        process.env.BAKEOFF_GROQ_MODEL ??
          process.env.MODEL_FALLBACK ??
          "openai/gpt-oss-120b",
      );
    case "anthropic": {
      const model =
        process.env.BAKEOFF_CLAUDE_MODEL ?? process.env.ANTHROPIC_MODEL;
      if (!model) {
        throw new Error(
          "Set ANTHROPIC_MODEL or BAKEOFF_CLAUDE_MODEL to include Claude.",
        );
      }
      return anthropic(model);
    }
  }
}

/** GPT-OSS on Groq rejects some sampling settings; keep its call minimal. */
export function settingsFor(provider: Provider) {
  if (provider === "groq") return { maxOutputTokens: 2000, maxRetries: 1 };
  return { temperature: 0.2, maxOutputTokens: 1600, maxRetries: 1 };
}
