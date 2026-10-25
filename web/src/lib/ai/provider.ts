import "server-only";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createGroq } from "@ai-sdk/groq";
import { generateText, Output } from "ai";
import type { z } from "zod";
import { env } from "../env";

type Model = Parameters<typeof generateText>[0]["model"];

type Candidate = {
  name: string;
  model: Model;
  groq: boolean;
};

function candidates(): Candidate[] {
  const google = env.googleKey
    ? createGoogleGenerativeAI({ apiKey: env.googleKey })
    : null;
  const groq = env.groqKey ? createGroq({ apiKey: env.groqKey }) : null;
  const anthropic =
    env.allowClaudeFallback && env.anthropicKey
      ? createAnthropic({ apiKey: env.anthropicKey })
      : null;

  const list: Candidate[] = [];

  const addGoogle = () => {
    if (!google) return;
    list.push({
      name: `google:${env.modelSmart}`,
      model: google(env.modelSmart),
      groq: false,
    });
  };
  const addGroq = () => {
    if (!groq) return;
    list.push({
      name: `groq:${env.modelFallback}`,
      model: groq(env.modelFallback),
      groq: true,
    });
  };
  const addAnthropic = () => {
    if (!anthropic || !env.anthropicModel) return;
    list.push({
      name: `anthropic:${env.anthropicModel}`,
      model: anthropic(env.anthropicModel),
      groq: false,
    });
  };

  if (env.aiProvider === "groq") {
    addGroq();
    addGoogle();
  } else if (env.aiProvider === "anthropic") {
    addAnthropic();
    addGroq();
    addGoogle();
  } else {
    addGoogle();
    addGroq();
  }

  const seen = new Set<string>();
  return list.filter((candidate) => {
    if (seen.has(candidate.name)) return false;
    seen.add(candidate.name);
    return true;
  });
}

export function llmStatus() {
  return candidates().map((candidate) => candidate.name);
}

type GenerateOptions<T> = {
  schema: z.ZodType<T>;
  system: string;
  prompt: string;
  label: string;
  maxOutputTokens?: number;
  timeoutMs?: number;
};

export async function generateStructured<T>({
  schema,
  system,
  prompt,
  label,
  maxOutputTokens = 1600,
  timeoutMs = 25_000,
}: GenerateOptions<T>): Promise<{ object: T; provider: string } | null> {
  for (const candidate of candidates()) {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const result = await generateText({
          model: candidate.model,
          output: Output.object({ schema }),
          system,
          prompt:
            attempt === 0
              ? prompt
              : `${prompt}\n\nIMPORTANT: Return only one valid JSON object matching the schema. Do not include markdown, explanations, or trailing text. Keep every array within its stated limit.`,
          ...(candidate.groq
            ? { maxOutputTokens: Math.max(maxOutputTokens, 2000) }
            : { temperature: 0.2, maxOutputTokens }),
          ...(candidate.groq
            ? {
                providerOptions: {
                  groq: {
                    structuredOutputs: true,
                    strictJsonSchema: true,
                  },
                },
              }
            : {}),
          maxRetries: 0,
          abortSignal: AbortSignal.timeout(timeoutMs),
        });

        if (!result.output) {
          throw new Error("The model returned no structured output.");
        }

        return { object: result.output as T, provider: candidate.name };
      } catch (error) {
        const details =
          error instanceof Error
            ? {
                name: error.name,
                message: error.message,
                cause:
                  error.cause instanceof Error
                    ? error.cause.message
                    : typeof error.cause === "string"
                      ? error.cause
                      : undefined,
              }
            : { value: String(error) };
        console.warn(
          `[viva] ${label} failed via ${candidate.name} (attempt ${attempt + 1}/2)`,
          details,
        );
      }
    }
  }

  return null;
}

export { candidates };
