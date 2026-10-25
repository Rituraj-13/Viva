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
import { saveSession } from "@/lib/store";
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
  await connection();
  try {
    const { id } = await params;
    const session = await sessionForOwner(id);
    if (session.status === "reported") {
      throw new ApiError(
        409,
        "already_finished",
        "This viva already has a report.",
        "Open the report to review it.",
      );
    }

    const quota = await checkTurnQuota(session.anonId);
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

      const evaluated = await evaluateAnswer({
        code: session.code,
        question,
        answer,
        skipped: body.skipped,
      });

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

      const evaluated = await evaluateAnswer({
        code: session.code,
        question,
        answer,
        skipped: body.skipped,
      });

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
    }

    const next = createdProbe ? null : nextQuestionAfter(session, question.id);
    session.status = "in_progress";
    session.updatedAt = new Date().toISOString();
    await saveSession(session);

    const state = computeState(session);
    const done = !createdProbe && !next && state.done;

    return NextResponse.json({
      turn: publicTurn(turn),
      probe: createdProbe ? publicTurn(createdProbe) : null,
      nextQuestion: next ? publicQuestion(next) : null,
      state,
      done,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
