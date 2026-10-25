import "server-only";
import type { Report, ReportCopy, SessionData } from "../types";
import { generateStructured } from "./provider";
import { ReportCopySchema } from "./schemas";

const SYSTEM = `You are Viva, writing the closing note of an oral code exam. The scores and evidence are already computed; do not change them. Write like a senior engineer who is direct, specific, and fair.

Return:
- headline: one sentence, under 18 words, about what this session showed. No names. No "candidate".
- summary: 2-3 sentences. Reference the strongest axis and the clearest gap. If there is a confident-but-wrong moment, name the question number and the exact gap. If the answer was quietly right, say so. No praise padding.
- nextQuestions: exactly 3 short follow-up questions for the next session, each anchored to a line or a failure mode.

Do not mention scores, bands, models, prompts, or the mechanics of the exam. Do not invent quotes. Use only the evidence provided.`;

function turnsForPrompt(session: SessionData) {
  return session.turns
    .filter((turn) => turn.evaluation)
    .map((turn) => {
      const question = session.questions.find((q) => q.id === turn.questionId);
      const evaluation = turn.evaluation!;
      return {
        question: question?.index ?? 0,
        rung: question?.rung ?? "unknown",
        kind: turn.kind,
        answer: turn.answer,
        verdict: evaluation.verdict,
        correctness: evaluation.correctness,
        depth: evaluation.depth,
        ownership: evaluation.ownership,
        clarity: evaluation.clarity,
        confidence: evaluation.confidence,
        quote: evaluation.quote,
        missing: evaluation.missing,
      };
    });
}

export async function generateReportCopy(
  session: SessionData,
  report: Report,
): Promise<ReportCopy | null> {
  const result = await generateStructured({
    schema: ReportCopySchema,
    system: SYSTEM,
    label: "report",
    maxOutputTokens: 1200,
    timeoutMs: 25_000,
    prompt: JSON.stringify(
      {
        file: session.filePath,
        language: session.language,
        summaryOfCode: session.summary,
        band: report.band,
        axes: report.axes,
        confidentButWrong: report.confidentButWrong,
        quietlyRight: report.quietlyRight,
        bestMoment: report.bestMoment,
        turns: turnsForPrompt(session),
      },
      null,
      2,
    ),
  });

  if (!result) return null;

  const copy = result.object;
  const nextQuestions = [...new Set(copy.nextQuestions.map((q) => q.trim()).filter(Boolean))];
  while (nextQuestions.length < 3) {
    const fallback = report.nextQuestions[nextQuestions.length];
    if (!fallback) break;
    nextQuestions.push(fallback);
  }

  return {
    headline: copy.headline.trim(),
    summary: copy.summary.trim(),
    nextQuestions: nextQuestions.slice(0, 3),
  };
}
