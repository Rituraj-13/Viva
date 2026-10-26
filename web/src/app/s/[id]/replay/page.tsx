import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ReplayClient } from "@/components/replay-client";
import type { Seed, SeedProbe, SeedTurn } from "@/fixtures/seeds";
import { getAnonId } from "@/lib/anon";
import { highlightCode } from "@/lib/highlight";
import { getSession } from "@/lib/store";

export const instant = false;

export const metadata: Metadata = {
  title: "Viva replay",
  robots: { index: false, follow: false },
};

export default async function ReplayPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [session, anonId] = await Promise.all([getSession(id), getAnonId()]);

  if (!session || !anonId || session.anonId !== anonId || !session.report) {
    notFound();
  }

  const turns: SeedTurn[] = session.questions.flatMap((question) => {
    const answer = session.turns.find(
      (turn) => turn.kind === "answer" && turn.questionId === question.id,
    );
    if (!answer?.evaluation) return [];

    const probe = session.turns.find(
      (turn) =>
        turn.kind === "probe" &&
        turn.questionId === question.id &&
        turn.evaluation,
    );
    const seedProbe: SeedProbe | undefined = probe?.evaluation
      ? {
          prompt: probe.prompt,
          answer: probe.answer,
          evaluation: probe.evaluation,
        }
      : undefined;

    return [
      {
        questionId: question.id,
        questionIndex: question.index,
        answer: answer.answer,
        inputMode: "flow",
        evaluation: answer.evaluation,
        ...(seedProbe ? { probe: seedProbe } : {}),
      },
    ];
  });

  const replay: Seed = {
    id: session.id,
    title: "Your viva",
    subtitle: "A replay of your completed oral exam.",
    band: session.report.band,
    language: session.language,
    filePath: session.filePath,
    repoLabel:
      session.repoOwner && session.repoName
        ? `${session.repoOwner}/${session.repoName}`
        : "Pasted code",
    code: session.code,
    summary: session.summary,
    focusRegions: session.focusRegions,
    questions: session.questions,
    turns,
    report: session.report,
  };

  const html = await highlightCode(session.code, session.language);
  return <ReplayClient seed={replay} html={html} />;
}
