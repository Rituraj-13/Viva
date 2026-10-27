import { connection, NextResponse } from "next/server";
import { ApiError, handleRouteError, sessionForOwner } from "@/lib/api";
import { computeReport, refreshReportEvidence } from "@/lib/scoring";
import { saveSession } from "@/lib/store";
import { elapsedMs, logApi, serverTiming } from "@/lib/timing";

type Context = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Context) {
  const startedAt = performance.now();
  let dbMs = 0;

  try {
    await connection();
    const { id } = await params;
    const sessionStartedAt = performance.now();
    const session = await sessionForOwner(id);
    dbMs += elapsedMs(sessionStartedAt);

    if (session.report) {
      const report = refreshReportEvidence(session, session.report);
      logApi("POST /api/sessions/:id/finish", startedAt, {
        status: 200,
        dbMs,
        cached: true,
      });
      return NextResponse.json(
        { slug: session.slug, report },
        {
          headers: {
            "Server-Timing": serverTiming({
              db: dbMs,
              total: elapsedMs(startedAt),
            }),
          },
        },
      );
    }

    const graded = session.turns.filter((t) => t.evaluation);
    if (graded.length === 0) {
      throw new ApiError(
        400,
        "no_answers",
        "There are no answers to grade yet.",
        "Answer at least one question first.",
      );
    }

    const report = computeReport(session);

    session.report = report;
    session.status = "reported";
    session.updatedAt = new Date().toISOString();

    const saveStartedAt = performance.now();
    await saveSession(session);
    dbMs += elapsedMs(saveStartedAt);

    logApi("POST /api/sessions/:id/finish", startedAt, {
      status: 200,
      dbMs,
      cached: false,
    });

    return NextResponse.json(
      { slug: session.slug, report },
      {
        headers: {
          "Server-Timing": serverTiming({
            db: dbMs,
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
        total: elapsedMs(startedAt),
      }),
    );
    logApi("POST /api/sessions/:id/finish", startedAt, {
      status: response.status,
      dbMs,
      error: error instanceof Error ? error.message : String(error),
    });
    return response;
  }
}
