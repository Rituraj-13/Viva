import type {
  Axis,
  AxisKey,
  Evaluation,
  Report,
  ReportCopy,
  SessionData,
  Turn,
} from "./types";
import { clamp } from "./utils";

const AXIS_LABELS: Record<AxisKey, string> = {
  correctness: "Correctness",
  depth: "Depth",
  ownership: "Ownership",
  clarity: "Clarity",
};

const AXIS_ORDER: AxisKey[] = ["correctness", "depth", "ownership", "clarity"];

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

function average(nums: number[]) {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function evaluated(session: SessionData) {
  return session.turns.filter((t): t is Turn & { evaluation: Evaluation } =>
    Boolean(t.evaluation),
  );
}

export function readinessScore(axes: Axis[]) {
  const byKey = Object.fromEntries(axes.map((a) => [a.key, a.score])) as Record<
    AxisKey,
    number
  >;
  return (
    0.35 * (byKey.correctness ?? 0) +
    0.25 * (byKey.depth ?? 0) +
    0.25 * (byKey.ownership ?? 0) +
    0.15 * (byKey.clarity ?? 0)
  );
}

export function bandFor(score: number): Report["band"] {
  if (score >= 3) return "ready";
  if (score >= 2.4) return "almost";
  return "not_yet";
}

function buildAxes(session: SessionData): Axis[] {
  const turns = evaluated(session);
  const usedGaps = new Set<string>();
  return AXIS_ORDER.map((key) => {
    const scores = turns.map((t) => t.evaluation[key]);
    const score = round1(average(scores));
    const sorted = [...turns].sort(
      (a, b) => b.evaluation[key] - a.evaluation[key],
    );
    const best = sorted[0];
    const question = best
      ? session.questions.find((q) => q.id === best.questionId)
      : undefined;
    const quote = best?.evaluation.quote?.trim() ?? "";
    const weakest = [...turns].sort(
      (a, b) => a.evaluation[key] - b.evaluation[key],
    )[0];
    let gap =
      weakest?.evaluation.axisGaps?.[key]?.trim() ||
      weakest?.evaluation.missing.find((m) => m.trim().length > 0);
    const axisGuidance: Record<AxisKey, string> = {
      correctness:
        "Separate what the code actually guarantees from what the framework or API appears to do.",
      depth:
        "Explain the mechanism, trade-off, and failure path behind the answer.",
      ownership:
        "Name why this design was chosen, what would break if it changed, and how you would test it.",
      clarity:
        "Structure the explanation around the relevant control flow instead of listing surface details.",
    };

    if (gap && usedGaps.has(gap.toLowerCase())) {
      gap = axisGuidance[key];
    }
    if (gap) usedGaps.add(gap.toLowerCase());

    return {
      key,
      label: AXIS_LABELS[key],
      score,
      evidenceQuote: quote,
      line: question?.focusStart ?? 1,
      note:
        score >= 3
          ? "Consistent evidence across the session."
          : gap
            ? friendlyImprovement(key, gap)
            : friendlyImprovement(key, axisGuidance[key]),
    };
  });
}

function friendlyImprovement(key: AxisKey, gap: string) {
  const starts = {
    correctness: "To strengthen correctness, focus on understanding the following",
    depth: "To build more depth, focus on understanding the following",
    ownership: "To show more ownership, focus on understanding the following",
    clarity: "To make your explanation clearer, focus on understanding the following",
  };
  return `${starts[key]} ${gap.replace(/^(gap|focus):\s*/i, "").replace(/[.!?]+$/, "")}.`;
}

function strongestAndWeakest(axes: Axis[]) {
  const sorted = [...axes].sort((a, b) => b.score - a.score);
  return { strongest: sorted[0], weakest: sorted[sorted.length - 1] };
}

type EvaluatedTurn = Turn & { evaluation: Evaluation };

function isConfidentButWrong(turn: EvaluatedTurn) {
  const reason = turn.evaluation.followUpReason?.trim() ?? "";
  const describesOmission =
    /\b(omit|omitted|omits|miss|missed|misses|fail(?:ed|s)? to mention|didn't mention|did not mention|doesn't mention|does not mention|overlook|overlooked|forgot|forgotten|never mentions?)\b/i.test(
      reason,
    );

  return (
    turn.evaluation.confidence >= 3 &&
    turn.evaluation.correctness <= 1 &&
    turn.evaluation.quoteIsStrength === false &&
    turn.evaluation.quote.trim().length > 0 &&
    reason.length > 0 &&
    !describesOmission
  );
}

function isQuietlyRight(turn: EvaluatedTurn) {
  return (
    turn.evaluation.confidence <= 1 &&
    turn.evaluation.correctness >= 3 &&
    turn.evaluation.quoteIsStrength === true &&
    turn.evaluation.quote.trim().length > 0
  );
}

function improvementAreas(axes: Axis[]) {
  return axes
    .filter((axis) => axis.score < 3)
    .sort((a, b) => a.score - b.score)
    .slice(0, 3)
    .map((axis) => `${axis.label}: ${axis.note.replace(/^Gap:\s*/i, "")}`);
}

function templateNextQuestions(session: SessionData) {
  const latestByQuestion = new Map<string, EvaluatedTurn>();
  for (const turn of evaluated(session)) {
    latestByQuestion.set(turn.questionId, turn);
  }

  const weak = [...latestByQuestion.values()]
    .filter((t) => t.evaluation.correctness < 3)
    .sort((a, b) => a.evaluation.correctness - b.evaluation.correctness);

  const questions: string[] = [];
  for (const turn of weak) {
    const followUp = turn.evaluation.followUp?.trim();
    if (followUp && !questions.includes(followUp)) {
      questions.push(followUp);
    } else {
      const q = session.questions.find((item) => item.id === turn.questionId);
      if (!q) continue;
      const missing = turn.evaluation.missing[0];
      const question = missing
        ? `At line ${q.focusStart}: ${missing
            .replace(
              /^(did not|didn't|does not|doesn't|failed to|omitted to|omitted|missed)\s+(mention|explain|cover|address|note|include)?\s*/i,
              "",
            )
            .replace(/[.!?]+$/, "")}.`
        : `What would you test first to prove your answer at line ${q.focusStart}?`;
      if (!questions.includes(question)) questions.push(question);
    }
    if (questions.length === 3) break;
  }

  const fallbacks = [
    "What would you change first if this had to handle 10× the traffic?",
    "Which line would you delete first, and what breaks?",
    "What is the one assumption you would write down before shipping this?",
  ];
  for (const fallback of fallbacks) {
    if (questions.length >= 3) break;
    if (!questions.includes(fallback)) questions.push(fallback);
  }
  return questions.slice(0, 3);
}

function templateCopy(session: SessionData, axes: Axis[]): ReportCopy {
  const { strongest, weakest } = strongestAndWeakest(axes);
  const turns = evaluated(session);
  const cbw = turns.find(isConfidentButWrong);
  const quiet = turns.find(isQuietlyRight);
  const cbwQuestion = cbw
    ? session.questions.find((q) => q.id === cbw.questionId)
    : undefined;
  const quietQuestion = quiet
    ? session.questions.find((q) => q.id === quiet.questionId)
    : undefined;
  const score = readinessScore(axes);
  const band = bandFor(score);

  let headline = "Knows the code. The gaps are specific.";
  if (band === "ready") headline = "Can explain the code and defend the choices.";
  if (band === "almost")
    headline = `The reasoning is real. ${weakest.label} is the gap.`;
  if (band === "not_yet")
    headline = `The happy path is there. ${weakest.label} isn't yet.`;
  if (cbw) headline = "Sounds certain. The code disagrees.";

  const parts = [
    `Across ${turns.length} graded turn${turns.length === 1 ? "" : "s"}, the strongest signal was ${strongest.label.toLowerCase()} (${strongest.score}/4). The clearest gap was ${weakest.label.toLowerCase()} (${weakest.score}/4).`,
  ];
  if (cbw && cbwQuestion) {
    parts.push(
      `At question ${cbwQuestion.index + 1}, the answer was confident but wrong: ${cbw.evaluation.followUpReason ?? cbw.evaluation.missing[0] ?? "the code says otherwise."}`,
    );
  }
  if (quiet && quietQuestion && !cbw) {
    parts.push(
      `At question ${quietQuestion.index + 1}, the answer was quiet but correct — confidence undersold the reasoning.`,
    );
  }
  if (!cbw && !quiet) {
    parts.push(
      "The next step is one more pass over the failure path, not more happy-path polish.",
    );
  }

  return {
    headline,
    summary: parts.join(" "),
    improvementAreas: improvementAreas(axes),
    nextQuestions: templateNextQuestions(session),
  };
}

export function computeReport(session: SessionData, copy?: ReportCopy): Report {
  const axes = buildAxes(session);
  const score = readinessScore(axes);
  const band = bandFor(score);
  const turns = evaluated(session);

  const cbw = turns.find(isConfidentButWrong);
  const quiet = turns.find(isQuietlyRight);
  const best = [...turns]
    .filter((t) => t.evaluation.quote.trim().length > 0)
    .sort(
      (a, b) =>
        b.evaluation.correctness - a.evaluation.correctness ||
        b.evaluation.depth - a.evaluation.depth ||
        b.answer.length - a.answer.length,
    )[0];

  const indexOf = (turn: Turn) =>
    session.questions.find((q) => q.id === turn.questionId)?.index ?? 0;

  const generated = copy ?? templateCopy(session, axes);

  return {
    band,
    headline: generated.headline,
    summary: generated.summary,
    axes,
    confidentButWrong: cbw
      ? {
          questionIndex: indexOf(cbw),
          quote: cbw.evaluation.quote,
          why:
            cbw.evaluation.followUpReason ??
            cbw.evaluation.missing[0] ??
            "The answer stated something the code contradicts.",
        }
      : null,
    quietlyRight: quiet
      ? {
          questionIndex: indexOf(quiet),
          quote: quiet.evaluation.quote,
        }
      : null,
    bestMoment: best
      ? {
          questionIndex: indexOf(best),
          quote: best.evaluation.quote,
        }
      : null,
    improvementAreas:
      generated.improvementAreas?.slice(0, 3) ?? improvementAreas(axes),
    nextQuestions: generated.nextQuestions.slice(0, 3),
    createdAt: new Date().toISOString(),
  };
}

export function scoreToPercent(score: number) {
  return Math.round(clamp(score / 4, 0, 1) * 100);
}
