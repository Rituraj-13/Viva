export const code = `export async function retry<T>(
  fn: () => Promise<T>,
  attempts = 3,
): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (i < attempts - 1) {
        await sleep(2 ** i * 100);
      }
    }
  }
  throw lastError;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}`;

export const lineNumberedCode = code
  .split("\n")
  .map((line, i) => `${String(i + 1).padStart(3, " ")}  ${line}`)
  .join("\n");

export const question = {
  rung: "failure" as const,
  prompt:
    "The backoff is `2 ** i * 100` with no jitter and no cap. What fails first when 200 workers retry at once, and how would you know?",
  focusStart: 9,
  focusEnd: 13,
  expectedPoints: [
    "No jitter means synchronized retries — a thundering herd",
    "200 workers amplify the wave; the error rate stays high",
    "No cap means long waits if attempts increase",
    "Only retry 429/5xx/timeouts, not all 4xx",
    "Needs a retry metric or log with the attempt number",
  ],
  redFlags: [
    "Claims exponential backoff alone prevents the herd",
    "Says jitter is unnecessary",
    "No observability or error classification",
  ],
};

export type AnswerFixture = {
  id: "strong" | "partial" | "confident";
  label: string;
  expectedVerdicts: string[];
  text: string;
};

export const answers: AnswerFixture[] = [
  {
    id: "strong",
    label: "Strong",
    expectedVerdicts: ["strong"],
    text: "Without jitter, every worker that failed at the same time sleeps the same 100, 200, or 400 milliseconds and retries in lockstep, so the service gets a synchronized wave. With 200 workers that can keep the error rate high. I'd add full jitter, random between zero and the computed delay, and cap the delay. I'd also only retry 429s, 5xxs, and timeouts, not 4xx, and emit a retry counter with the attempt number so I can see the wave in metrics.",
  },
  {
    id: "partial",
    label: "Partial",
    expectedVerdicts: ["partial", "weak"],
    text: "It retries three times with exponential backoff, which is good. If 200 workers retry, it might be a lot of load. I'd probably add a random delay. The code looks fine otherwise.",
  },
  {
    id: "confident",
    label: "Confident but wrong",
    expectedVerdicts: ["weak", "partial", "off_topic"],
    text: "The exponential backoff prevents the thundering herd because the delays spread out the retries. With 200 workers, each one waits a different amount of time, so there's no spike. I'd ship it as is; the only thing I'd add is a log line.",
  },
];
