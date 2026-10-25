import {
  MAX_TURNS,
  RUNG_LABELS,
  type PublicSession,
  type PublicTurn,
  type Question,
  type SessionData,
  type SessionState,
  type TranscriptEntry,
  type Turn,
} from "./types";

export function toPublicSession(session: SessionData): PublicSession {
  const { anonId, questions, turns, ...rest } = session;
  void anonId;

  return {
    ...rest,
    questions: questions.map(
      (q): PublicSession["questions"][number] => ({
        id: q.id,
        index: q.index,
        rung: q.rung,
        prompt: q.prompt,
        focusStart: q.focusStart,
        focusEnd: q.focusEnd,
      }),
    ),
    turns: turns.map(
      (t): PublicTurn => ({
        id: t.id,
        questionId: t.questionId,
        parentTurnId: t.parentTurnId,
        kind: t.kind,
        prompt: t.prompt,
        answer: t.answer,
        inputMode: t.inputMode,
        skipped: t.skipped,
        createdAt: t.createdAt,
      }),
    ),
  };
}

export function questionById(session: SessionData, id: string | null) {
  if (!id) return null;
  return session.questions.find((q) => q.id === id) ?? null;
}

export function turnById(session: SessionData, id: string | null) {
  if (!id) return null;
  return session.turns.find((t) => t.id === id) ?? null;
}

export function answerTurns(session: SessionData, questionId: string) {
  return session.turns.filter(
    (t) => t.kind === "answer" && t.questionId === questionId,
  );
}

export function probeTurns(session: SessionData, questionId: string) {
  return session.turns.filter(
    (t) => t.kind === "probe" && t.questionId === questionId,
  );
}

export function computeState(session: SessionData): SessionState {
  const answered = session.questions.filter((q) =>
    session.turns.some(
      (t) => t.kind === "answer" && t.questionId === q.id,
    ),
  ).length;

  const pendingProbe = session.turns.find(
    (t) => t.kind === "probe" && !t.answer.trim(),
  );
  const firstUnanswered = session.questions.find(
    (q) =>
      !session.turns.some((t) => t.kind === "answer" && t.questionId === q.id),
  );

  const done =
    !pendingProbe &&
    (session.questions.every((q) =>
      session.turns.some((t) => t.kind === "answer" && t.questionId === q.id),
    ) ||
      session.turns.length >= MAX_TURNS);

  return {
    activeQuestionId: pendingProbe?.questionId ?? firstUnanswered?.id ?? null,
    activeProbeId: pendingProbe?.id ?? null,
    answered,
    total: session.questions.length,
    turns: session.turns.length,
    done,
  };
}

export function nextQuestionAfter(
  session: SessionData,
  questionId: string,
): Question | null {
  const index = session.questions.findIndex((q) => q.id === questionId);
  if (index < 0) return null;

  for (let i = index + 1; i < session.questions.length; i += 1) {
    const q = session.questions[i];
    const hasAnswer = session.turns.some(
      (t) => t.kind === "answer" && t.questionId === q.id,
    );
    if (!hasAnswer) return q;
  }
  return null;
}

export function publicQuestion(question: Question): PublicSession["questions"][number] {
  return {
    id: question.id,
    index: question.index,
    rung: question.rung,
    prompt: question.prompt,
    focusStart: question.focusStart,
    focusEnd: question.focusEnd,
  };
}

export function publicTurn(turn: Turn): PublicTurn {
  return {
    id: turn.id,
    questionId: turn.questionId,
    parentTurnId: turn.parentTurnId,
    kind: turn.kind,
    prompt: turn.prompt,
    answer: turn.answer,
    inputMode: turn.inputMode,
    skipped: turn.skipped,
    createdAt: turn.createdAt,
  };
}

export function transcriptFor(session: SessionData) {
  return session.questions.map((q) => {
    const answers = answerTurns(session, q.id);
    const probes = probeTurns(session, q.id);
    return { question: q, answers, probes };
  });
}

export function transcriptFromSession(session: SessionData): TranscriptEntry[] {
  return session.questions.map((q) => {
    const answer = session.turns.find(
      (t) => t.kind === "answer" && t.questionId === q.id,
    );
    const probes = probeTurns(session, q.id);

    return {
      index: q.index,
      rung: RUNG_LABELS[q.rung],
      prompt: q.prompt,
      answer: answer?.answer ?? "",
      skipped: answer?.skipped,
      inputMode: answer?.inputMode,
      probes: probes.map((probe) => ({
        prompt: probe.prompt,
        answer: probe.answer,
        skipped: probe.skipped,
        inputMode: probe.inputMode,
        evaluation: probe.evaluation,
      })),
      evaluation: answer?.evaluation ?? null,
    };
  });
}
