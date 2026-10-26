import "server-only";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText, Output } from "ai";
import Groq from "groq-sdk";
import type { z } from "zod";
import { z as zod } from "zod";
import { env } from "../env";
import { elapsedMs, logLlm } from "../timing";

type Model = Parameters<typeof generateText>[0]["model"];
type Tier = "smart" | "fast";

type Candidate = {
  name: string;
  model?: Model;
  groq: boolean;
  groqModel?: string;
  groqClient?: Groq;
};

type GroqUsage = {
  queue_time?: number;
  prompt_time?: number;
  completion_time?: number;
  total_time?: number;
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
  completion_tokens_details?: { reasoning_tokens?: number };
};

type AiUsage = {
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  reasoningTokens?: number;
};

const MIN_ATTEMPT_MS = 750;
const RATE_LIMIT_COOLDOWN_MS = 30_000;
const QUOTA_COOLDOWN_MS = 10 * 60_000;
const AUTH_COOLDOWN_MS = 10 * 60_000;
const CONFIG_COOLDOWN_MS = 10 * 60_000;

// A quota-exhausted provider should not be retried on every request. This map
// is per serverless instance, which is exactly the lifetime we want.
const cooldowns = new Map<string, number>();

function candidates(tier: Tier = "smart"): Candidate[] {
  const google = env.googleKey
    ? createGoogleGenerativeAI({ apiKey: env.googleKey })
    : null;
  const groq = env.groqKey
    ? new Groq({
        apiKey: env.groqKey,
        timeout: env.groqTimeoutMs,
        maxRetries: 0,
      })
    : null;
  const anthropic =
    env.allowClaudeFallback && env.anthropicKey
      ? createAnthropic({ apiKey: env.anthropicKey })
      : null;

  const list: Candidate[] = [];

  const addGoogle = () => {
    if (!google) return;
    const model = tier === "fast" ? env.modelFast : env.modelSmart;
    list.push({
      name: `google:${model}`,
      model: google(model),
      groq: false,
    });
  };
  const addGroq = (model: string) => {
    if (!groq) return;
    list.push({
      name: `groq:${model}`,
      groq: true,
      groqModel: model,
      groqClient: groq,
    });
  };
  const addGroqTier = () => {
    // Grading is cheaper and faster on the small model. Keep the smart model
    // as a second Groq candidate so a bad model name or a model-level limit
    // degrades instead of breaking the exam.
    if (tier === "fast" && env.modelGrading !== env.modelFallback) {
      addGroq(env.modelGrading);
    }
    addGroq(env.modelFallback);
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
    addGroqTier();
    addGoogle();
  } else if (env.aiProvider === "anthropic") {
    addAnthropic();
    addGroqTier();
    addGoogle();
  } else {
    addGoogle();
    addGroqTier();
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

function secondsToMs(value: number | undefined) {
  return typeof value === "number" ? Math.round(value * 1000) : undefined;
}

function statusOf(error: unknown) {
  if (!error || typeof error !== "object") return undefined;
  const value = (error as { status?: unknown; statusCode?: unknown }).status ??
    (error as { statusCode?: unknown }).statusCode;
  return typeof value === "number" ? value : undefined;
}

function errorDetails(error: unknown) {
  if (!(error instanceof Error)) {
    return { message: String(error).slice(0, 500) };
  }
  const cause =
    error.cause instanceof Error
      ? error.cause.message
      : typeof error.cause === "string"
        ? error.cause
        : undefined;
  return {
    name: error.name,
    message: error.message.slice(0, 500),
    status: statusOf(error),
    cause: cause?.slice(0, 500),
  };
}

function cooldownFor(error: unknown) {
  const status = statusOf(error);
  if (status === 401 || status === 403) return AUTH_COOLDOWN_MS;

  const message = (
    error instanceof Error ? error.message : String(error)
  ).toLowerCase();
  if (status === 404 || /model_not_found|does not exist/.test(message)) {
    return CONFIG_COOLDOWN_MS;
  }
  if (/exceeded your current quota|quota exceeded|billing/.test(message)) {
    return QUOTA_COOLDOWN_MS;
  }
  if (/per day|\brpd\b|daily limit/.test(message)) {
    return QUOTA_COOLDOWN_MS;
  }
  if (
    status === 429 ||
    /\b429\b/.test(message) ||
    /rate limit|too many requests/.test(message)
  ) {
    return RATE_LIMIT_COOLDOWN_MS;
  }
  return null;
}

function isCoolingDown(name: string) {
  const until = cooldowns.get(name);
  if (!until) return false;
  if (Date.now() >= until) {
    cooldowns.delete(name);
    return false;
  }
  return true;
}

type GenerateOptions<T> = {
  schema: z.ZodType<T>;
  system: string;
  prompt: string;
  label: string;
  tier?: Tier;
  maxOutputTokens?: number;
  timeoutMs?: number;
  deadlineMs?: number;
};

export async function generateStructured<T>({
  schema,
  system,
  prompt,
  label,
  tier = "smart",
  maxOutputTokens = 1600,
  timeoutMs = 10_000,
  deadlineMs = env.llmDeadlineMs,
}: GenerateOptions<T>): Promise<{ object: T; provider: string } | null> {
  const startedAt = performance.now();
  const deadlineAt = Date.now() + deadlineMs;
  const available = candidates(tier);
  const cooling = available.filter((candidate) => isCoolingDown(candidate.name));
  const coolingNames = new Set(cooling.map((candidate) => candidate.name));
  const ordered = available.filter(
    (candidate) => !coolingNames.has(candidate.name),
  );

  logLlm({
    label,
    event: "start",
    tier,
    providers: ordered.map((candidate) => candidate.name),
    ...(coolingNames.size > 0
      ? { coolingDown: [...coolingNames] }
      : {}),
    deadlineMs,
    timeoutMs,
    maxOutputTokens,
  });

  if (ordered.length === 0) {
    logLlm({
      label,
      event: "all_cooling_down",
      tier,
      providers: [...coolingNames],
      ms: elapsedMs(startedAt),
    });
    return null;
  }

  for (const [index, candidate] of ordered.entries()) {
    const remaining = deadlineAt - Date.now();
    if (remaining < MIN_ATTEMPT_MS) {
      logLlm({
        label,
        event: "deadline_exceeded",
        tier,
        provider: candidate.name,
        providerAttempt: index + 1,
        remainingMs: Math.max(0, Math.round(remaining)),
      });
      break;
    }

    const attemptTimeout = Math.max(
      MIN_ATTEMPT_MS,
      Math.min(timeoutMs, remaining),
    );
    const attemptStartedAt = performance.now();

    try {
      if (candidate.groq && candidate.groqClient && candidate.groqModel) {
        const jsonSchema = zod.toJSONSchema(schema, { target: "draft-07" });
        const response = await candidate.groqClient.chat.completions.create(
          {
            model: candidate.groqModel,
            messages: [
              { role: "system", content: system },
              { role: "user", content: prompt },
            ],
            response_format: {
              type: "json_schema",
              json_schema: {
                name: label.replace(/[^a-zA-Z0-9_-]/g, "_"),
                strict: true,
                schema: jsonSchema,
              },
            },
            max_tokens: maxOutputTokens,
            ...(candidate.groqModel.includes("gpt-oss")
              ? { reasoning_effort: env.groqReasoningEffort }
              : {}),
          },
          {
            timeout: attemptTimeout,
            signal: AbortSignal.timeout(attemptTimeout),
            maxRetries: 0,
          },
        );
        const content = response.choices[0]?.message?.content;
        if (!content) throw new Error("Groq returned no structured output.");
        const object = schema.parse(JSON.parse(content)) as T;
        const usage = response.usage as unknown as GroqUsage | undefined;

        logLlm({
          label,
          event: "attempt_ok",
          provider: candidate.name,
          providerAttempt: index + 1,
          ms: elapsedMs(attemptStartedAt),
          timeoutMs: attemptTimeout,
          queueTimeMs: secondsToMs(usage?.queue_time),
          promptTimeMs: secondsToMs(usage?.prompt_time),
          completionTimeMs: secondsToMs(usage?.completion_time),
          providerTotalTimeMs: secondsToMs(usage?.total_time),
          promptTokens: usage?.prompt_tokens,
          completionTokens: usage?.completion_tokens,
          reasoningTokens: usage?.completion_tokens_details?.reasoning_tokens,
          totalTokens: usage?.total_tokens,
        });
        cooldowns.delete(candidate.name);
        return { object, provider: candidate.name };
      }

      const result = await generateText({
        model: candidate.model!,
        output: Output.object({ schema }),
        system,
        prompt,
        temperature: 0.2,
        maxOutputTokens,
        maxRetries: 0,
        abortSignal: AbortSignal.timeout(attemptTimeout),
      });

      if (!result.output) {
        throw new Error("The model returned no structured output.");
      }

      const usage = result.usage as unknown as AiUsage | undefined;
      logLlm({
        label,
        event: "attempt_ok",
        provider: candidate.name,
        providerAttempt: index + 1,
        ms: elapsedMs(attemptStartedAt),
        timeoutMs: attemptTimeout,
        promptTokens: usage?.inputTokens,
        completionTokens: usage?.outputTokens,
        reasoningTokens: usage?.reasoningTokens,
        totalTokens: usage?.totalTokens,
      });
      cooldowns.delete(candidate.name);
      return { object: result.output as T, provider: candidate.name };
    } catch (error) {
      const details = errorDetails(error);
      const cooldownMs = cooldownFor(error);
      logLlm({
        label,
        event: "attempt_failed",
        provider: candidate.name,
        providerAttempt: index + 1,
        ms: elapsedMs(attemptStartedAt),
        timeoutMs: attemptTimeout,
        deadlineRemainingMs: Math.max(0, Math.round(deadlineAt - Date.now())),
        ...(cooldownMs ? { cooldownMs } : {}),
        error: details,
      });
      if (cooldownMs) {
        cooldowns.set(candidate.name, Date.now() + cooldownMs);
      }
    }
  }

  logLlm({
    label,
    event: "all_failed",
    tier,
    providers: ordered.map((candidate) => candidate.name),
    ms: elapsedMs(startedAt),
    deadlineMs,
  });
  return null;
}

export { candidates };
