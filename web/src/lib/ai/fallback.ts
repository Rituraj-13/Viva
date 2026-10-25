import type { Evaluation, FocusRegion, Question } from "../types";
import { clamp } from "../utils";
import { countLines, firstMeaningfulLine, lineMatching } from "../code";
import { RUNGS } from "../types";

const STOP_WORDS = new Set([
  "the",
  "and",
  "for",
  "that",
  "this",
  "with",
  "from",
  "into",
  "your",
  "you",
  "are",
  "was",
  "were",
  "have",
  "has",
  "had",
  "not",
  "but",
  "what",
  "when",
  "where",
  "which",
  "how",
  "why",
  "its",
  "it's",
  "they",
  "them",
  "their",
  "there",
  "here",
  "about",
  "would",
  "could",
  "should",
  "will",
  "can",
  "may",
  "might",
  "must",
  "just",
  "then",
  "than",
  "also",
  "more",
  "most",
  "some",
  "any",
  "all",
  "each",
  "every",
  "one",
  "two",
  "use",
  "uses",
  "used",
  "using",
  "make",
  "makes",
  "made",
  "get",
  "gets",
  "got",
  "does",
  "did",
  "doing",
  "line",
  "lines",
  "code",
  "file",
]);

export function keywords(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9_\s]/g, " ")
    .split(/\s+/)
    .map((word) => word.replace(/(ing|ed|es|s)$/i, ""))
    .filter((word) => word.length > 2 && !STOP_WORDS.has(word));
}

function range(start: number, end: number, n: number): FocusRegion {
  const s = clamp(Math.round(start), 1, Math.max(1, n));
  const e = clamp(Math.round(end), s, Math.max(1, n));
  return { start: s, end: e, label: "Focus" };
}

function findLine(code: string, pattern: RegExp, fallback: number) {
  return lineMatching(code, pattern, fallback);
}

export function fallbackSummary(code: string, language: string) {
  const first = firstMeaningfulLine(code);
  const lines = countLines(code);
  const hint = first.length > 4 && first.length < 110 ? ` It starts with \`${first}\`.` : "";
  return `A ${language} file of ${lines} lines. The exam focuses on the core path, a failure boundary, and one ownership decision.${hint}`;
}

export function fallbackLadder(code: string, language: string): {
  summary: string;
  focusRegions: FocusRegion[];
  questions: Question[];
} {
  const n = countLines(code);
  const fnLine = findLine(
    code,
    /^\s*(export\s+)?(async\s+)?(function|def|class|const\s+\w+\s*=\s*(async\s*)?\()/,
    Math.max(1, Math.floor(n * 0.2)),
  );
  const riskyLine = findLine(
    code,
    /\b(catch|throw|except|raise|finally|if\s*\(|if\s+|return\s+res\.status|rollback|retry)\b/,
    Math.max(1, Math.floor(n * 0.55)),
  );
  const ownershipLine = findLine(
    code,
    /\b(await|return|yield|clearTimeout|abort|commit|verify|lock|sleep|setTimeout|next\()\b/,
    Math.max(1, Math.floor(n * 0.7)),
  );

  const ranges = [
    range(1, Math.min(n, 18), n),
    range(fnLine - 3, fnLine + 12, n),
    range(riskyLine - 4, riskyLine + 8, n),
    range(n - 14, n, n),
    range(ownershipLine - 2, ownershipLine + 7, n),
  ];

  const prompts = [
    "In two sentences, what is this file responsible for, and where does that responsibility stop?",
    "Point to the choice that most shapes this file. Why is it structured that way instead of the obvious alternative?",
    "What breaks first here: bad input, a partial outage, or a retry storm? Walk me through the failure path.",
    "If this had to handle ten times the traffic, what changes and what stays the same?",
    "Pick the least obvious non-trivial line in this range. Why is it there, and what breaks if we delete it?",
  ];

  const expectedByRung = [
    ["the file's main responsibility", "the boundary of that responsibility", "a concrete input or output"],
    ["the named choice", "the alternative it replaces", "the trade-off it buys"],
    ["the first failure mode", "how it surfaces to the caller", "how the code detects or contains it"],
    ["what changes under load", "what stays the same", "the new risk the change introduces"],
    ["the line's purpose", "the consequence of deleting it", "a test or guard that would catch a regression"],
  ];

  const redFlags = [
    "restates the code without explaining",
    "claims certainty without a line reference",
    "confuses a failure mode with a syntax issue",
    "describes a generic best practice that does not apply here",
  ];

  const questions: Question[] = prompts.map((prompt, index) => ({
    id: `fallback-${index + 1}`,
    index,
    rung: RUNGS[index],
    prompt,
    focusStart: ranges[index].start,
    focusEnd: ranges[index].end,
    expectedPoints: expectedByRung[index],
    redFlags,
    whyThisQuestion: `Fallback question ${index + 1}: targets a ${RUNGS[index]} boundary in the file.`,
  }));

  return {
    summary: fallbackSummary(code, language),
    focusRegions: ranges.map((r, i) => ({ ...r, label: RUNGS[i] })),
    questions,
  };
}

export function pickQuote(answer: string): string {
  const cleaned = answer.replace(/\s+/g, " ").trim();
  if (!cleaned) return "";
  const sentences = cleaned
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.split(/\s+/).length >= 3);
  const candidates = sentences.length > 0 ? sentences : [cleaned];
  const hedge = /\b(i think|probably|maybe|not sure|i guess|might|kind of|sort of)\b/i;
  const absolute = /\b(definitely|always|never|obviously|correct|clearly|guaranteed)\b/i;

  const scored = candidates.map((sentence) => ({
    sentence,
    score:
      (hedge.test(sentence) ? 2 : 0) +
      (absolute.test(sentence) ? 2 : 0) +
      Math.min(1, sentence.split(/\s+/).length / 30),
  }));
  scored.sort((a, b) => b.score - a.score);

  const words = scored[0].sentence.split(/\s+/).slice(0, 25).join(" ");
  return words;
}

export function heuristicEvaluation(
  answer: string,
  question: Question,
  skipped = false,
): Evaluation {
  const cleaned = answer.replace(/\s+/g, " ").trim();
  const wordCount = cleaned ? cleaned.split(/\s+/).length : 0;
  const quote = skipped ? "" : pickQuote(cleaned);

  if (!cleaned || wordCount < 4) {
    return {
      verdict: "off_topic",
      correctness: 0,
      depth: 0,
      ownership: 0,
      clarity: 0,
      confidence: 2,
      quote,
      quoteIsStrength: false,
      missing: question.expectedPoints.slice(0, 3),
      axisGaps: {
        correctness: "Build a basic explanation of what this code guarantees and which routes or states it affects.",
        depth: "Practice tracing the mechanism step by step, including what happens when the expected path fails.",
        ownership: "Practice explaining why this design was chosen, what would break if it changed, and how you would test it.",
        clarity: "Start with the main responsibility, then explain the relevant lines in execution order.",
      },
      followUp: skipped
        ? null
        : `You didn't get to an answer. Pick one line in ${question.focusStart}–${question.focusEnd} and walk me through what it does.`,
      followUpReason: "No substantive answer to grade.",
    };
  }

  const expectedKeywords = [...new Set(question.expectedPoints.flatMap(keywords))];
  const answerKeywords = new Set(keywords(cleaned));
  const matched = expectedKeywords.filter((word) => answerKeywords.has(word));
  const missingPoints = question.expectedPoints.filter(
    (point) => !keywords(point).some((word) => answerKeywords.has(word)),
  );

  const hasBecause = /\b(because|so that|therefore|which means|the reason)\b/i.test(cleaned);
  const refsLine = /\bline\s+\d+|:\d+|\bL\d+\b/i.test(cleaned);
  const owns = /\b(i|we|my|our|i'd|i would|i chose|i built|i'd add)\b/i.test(cleaned);

  const hedges = (
    cleaned.match(/\b(i think|probably|maybe|not sure|i guess|might|kind of|sort of)\b/gi) ?? []
  ).length;
  const absolutes = (
    cleaned.match(/\b(definitely|always|never|obviously|correct|clearly|guaranteed)\b/gi) ?? []
  ).length;

  let correctness = clamp(1 + Math.floor(matched.length / 2), 0, 4);
  if (matched.length >= 4 && wordCount >= 25) correctness = 4;
  if (question.redFlags.some((flag) => keywords(flag).every((word) => answerKeywords.has(word)))) {
    correctness = Math.max(0, correctness - 1);
  }

  const depth = clamp(
    1 +
      Math.floor(matched.length / 2) +
      (wordCount > 50 ? 1 : 0) +
      (hasBecause ? 1 : 0),
    0,
    4,
  );
  const ownership = clamp(2 + (owns ? 1 : 0) + (refsLine ? 1 : 0), 0, 4);
  const clarity = clamp(
    (wordCount < 10 ? 1 : wordCount < 30 ? 2 : 3) + (hasBecause ? 1 : 0),
    0,
    4,
  );
  const confidence =
    correctness <= 1
      ? 2
      : hedges > 0 && absolutes === 0
        ? 2
        : absolutes > 0
          ? 4
          : 3;

  const verdict =
    correctness >= 3 && depth >= 2
      ? "strong"
      : correctness >= 2
        ? "partial"
        : "weak";

  const target =
    missingPoints[0] ??
    question.expectedPoints[question.expectedPoints.length - 1] ??
    "the failure path";

  const followUp =
    verdict === "strong"
      ? null
      : quote
        ? `You said “${quote}”. Walk me through ${target} at line ${question.focusStart}.`
        : `Let's stay at line ${question.focusStart}. Walk me through ${target}.`;

  return {
    verdict,
    correctness,
    depth,
    ownership,
    clarity,
    confidence,
    quote,
    quoteIsStrength: verdict === "strong",
    missing: missingPoints.slice(0, 3),
    axisGaps: {
      correctness: missingPoints[0] ?? "Be more precise about what the code guarantees.",
      depth: missingPoints[1] ?? "Explain the mechanism and the failure path behind the answer.",
      ownership: "Explain why this design was chosen and how you would test it.",
      clarity: "Organize the explanation around the relevant control flow.",
    },
    followUp,
    followUpReason: verdict === "strong" ? null : `Targets the weakest claim: ${target}`,
  };
}
