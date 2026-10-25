import { connection, NextResponse } from "next/server";
import { ApiError, handleRouteError, sessionForOwner } from "@/lib/api";
import { computeReport } from "@/lib/scoring";
import { saveSession } from "@/lib/store";


type Context = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Context) {
  await connection();
  try {
    const { id } = await params;
    const session = await sessionForOwner(id);

    if (session.report) {
      return NextResponse.json({ slug: session.slug, report: session.report });
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
    await saveSession(session);

    return NextResponse.json({ slug: session.slug, report });
  } catch (error) {
    return handleRouteError(error);
  }
}
