import { nanoid } from "nanoid";
import { connection, NextResponse } from "next/server";
import { z } from "zod";
import { evaluateAnswer } from "@/lib/ai/evaluate";
import {
  ApiError,
  handleRouteError,
  parseBody,
  sessionForOwner,
} from "@/lib/api";
import { checkTurnQuota } from "@/lib/rate-limit";
import {
  computeState,
  nextQuestionAfter,
  publicQuestion,
  publicTurn,
} from "@/lib/session";
import { recordTurnUsage, saveSession } from "@/lib/store";
import { elapsedMs, logApi, serverTiming } from "@/lib/timing";
import { MAX_TURNS, type Turn } from "@/lib/types";


type Context = { params: Promise<{ id: string }> };

const Body = z.object({
  questionId: z.string().min(1).max(80),
  turnId: z.string().min(1).max(80).nullable().optional(),
  text: z.string().max(8000).default(""),
  inputMode: z.enum(["flow", "typed", "web_speech"]).default("flow"),
  skipped: z.boolean().default(false),
});

export async function POST(request: Request, { params }: Context) {
  const startedAt = performance.now();
  let llmMs: number | undefined;
  let dbMs = 0;
  let evaluationModel: string | undefined;

  try {
    await connection();
    const { id } = await params;
    const sessionStartedAt = performance.now();
    const session = await sessionForOwner(id);
    dbMs += elapsedMs(sessionStartedAt);
    if (session.status === "reported") {
      throw new ApiError(
        409,
        "already_finished",
        "This viva already has a report.",
        "Open the report to review it.",
      );
    }

    const quotaStartedAt = performance.now();
    const quota = await checkTurnQuota(session.anonId);
    dbMs += elapsedMs(quotaStartedAt);
    if (!quota.ok) {
      throw new ApiError(429, quota.code, quota.message, quota.action);
    }

    const body = await parseBody(request, Body);
    if (!body.turnId && session.turns.length >= MAX_TURNS) {
      throw new ApiError(
        409,
        "turn_limit",
        "This viva has reached its eight-turn limit.",
        "Finish the viva to build the report.",
      );
    }

    const question = session.questions.find((q) => q.id === body.questionId);
    if (!question) {
      throw new ApiError(
        404,
        "question_not_found",
        "That question is not part of this viva.",
        "Reload the session.",
      );
    }

    const answer = body.skipped ? "" : body.text.trim();
    if (!body.skipped && answer.length < 2) {
      throw new ApiError(
        400,
        "empty_answer",
        "Add an answer, or skip the question.",
        "Speak or type at least a sentence.",
      );
    }

    let turn: Turn;
    let createdProbe: Turn | null = null;
    const newTurns: Turn[] = [];

    if (body.turnId) {
      const probe = session.turns.find((t) => t.id === body.turnId);
      if (
        !probe ||
        probe.kind !== "probe" ||
        probe.questionId !== question.id
      ) {
        throw new ApiError(
          409,
          "invalid_probe",
          "That follow-up is no longer open.",
          "Reload the session and answer the current question.",
        );
      }
      if (probe.answer.trim().length > 0) {
        throw new ApiError(
          409,
          "already_answered",
          "That follow-up has already been answered.",
          "Reload the session to continue.",
        );
      }

      const llmStartedAt = performance.now();
      const evaluated = await evaluateAnswer({
        code: session.code,
        question,
        answer,
        skipped: body.skipped,
      });
      llmMs = elapsedMs(llmStartedAt);
      evaluationModel = evaluated.model;

      probe.answer = answer;
      probe.inputMode = body.inputMode;
      probe.skipped = body.skipped;
      probe.evaluation = evaluated.evaluation;
      turn = probe;
    } else {
      const existing = session.turns.find(
        (t) => t.kind === "answer" && t.questionId === question.id,
      );
      if (existing) {
        throw new ApiError(
          409,
          "already_answered",
          "That question already has an answer.",
          "Reload the session to continue.",
        );
      }

      const llmStartedAt = performance.now();
      const evaluated = await evaluateAnswer({
        code: session.code,
        question,
        answer,
        skipped: body.skipped,
      });
      llmMs = elapsedMs(llmStartedAt);
      evaluationModel = evaluated.model;

      turn = {
        id: nanoid(12),
        questionId: question.id,
        parentTurnId: null,
        kind: "answer",
        prompt: question.prompt,
        answer,
        inputMode: body.inputMode,
        skipped: body.skipped,
        evaluation: evaluated.evaluation,
        createdAt: new Date().toISOString(),
      };
      session.turns.push(turn);
      newTurns.push(turn);
    }

    const probeCount = session.turns.filter(
      (t) => t.kind === "probe" && t.questionId === question.id,
    ).length;

    // Reserve one turn for every remaining rung, so probes can never crowd out
    // the five main questions.
    const remainingMainAnswers = session.questions.filter(
      (q) =>
        !session.turns.some(
          (t) => t.kind === "answer" && t.questionId === q.id,
        ),
    ).length;

    if (
      !body.skipped &&
      turn.evaluation?.followUp &&
      probeCount < 2 &&
      session.turns.length + 1 + remainingMainAnswers <= MAX_TURNS
    ) {
      createdProbe = {
        id: nanoid(12),
        questionId: question.id,
        parentTurnId: turn.id,
        kind: "probe",
        prompt: turn.evaluation.followUp,
        answer: "",
        inputMode: body.inputMode,
        evaluation: null,
        createdAt: new Date().toISOString(),
      };
      session.turns.push(createdProbe);
      newTurns.push(createdProbe);
    }

    const next = createdProbe ? null : nextQuestionAfter(session, question.id);
    session.status = "in_progress";
    session.updatedAt = new Date().toISOString();

    const saveStartedAt = performance.now();
    await saveSession(session);
    dbMs += elapsedMs(saveStartedAt);

    if (newTurns.length > 0) {
      const usageStartedAt = performance.now();
      await Promise.all(
        newTurns.map((newTurn) =>
          recordTurnUsage({
            turnId: newTurn.id,
            sessionId: session.id,
            anonId: session.anonId,
            createdAt: newTurn.createdAt,
          }),
        ),
      );
      dbMs += elapsedMs(usageStartedAt);
    }

    const state = computeState(session);
    const done = !createdProbe && !next && state.done;

    logApi("POST /api/sessions/:id/turns", startedAt, {
      status: 200,
      dbMs,
      llmMs,
      model: evaluationModel,
      probe: Boolean(createdProbe),
      done,
      skipped: body.skipped,
      turns: session.turns.length,
    });

    return NextResponse.json(
      {
        turn: publicTurn(turn),
        probe: createdProbe ? publicTurn(createdProbe) : null,
        nextQuestion: next ? publicQuestion(next) : null,
        state,
        done,
      },
      {
        headers: {
          "Server-Timing": serverTiming({
            db: dbMs,
            llm: llmMs,
            total: elapsedMs(startedAt),
          }),
        },
      },
    );
  } catch (error) {
    const response = handleRouteError(error);
    response.headers.set(
      "Server-Timing",
      serverTiming({
        db: dbMs,
        llm: llmMs,
        total: elapsedMs(startedAt),
      }),
    );
    logApi("POST /api/sessions/:id/turns", startedAt, {
      status: response.status,
      dbMs,
      llmMs,
      model: evaluationModel,
      error: error instanceof Error ? error.message : String(error),
    });
    return response;
  }
}
