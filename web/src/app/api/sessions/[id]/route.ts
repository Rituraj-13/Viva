import { connection, NextResponse } from "next/server";
import { handleRouteError, sessionForOwner } from "@/lib/api";
import { refreshReportEvidence } from "@/lib/scoring";
import { computeState, toPublicSession } from "@/lib/session";
import { deleteSession } from "@/lib/store";


type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Context) {
  await connection();
  try {
    const { id } = await params;
    const session = await sessionForOwner(id);
    const report = session.report
      ? refreshReportEvidence(session, session.report)
      : undefined;
    return NextResponse.json({
      session: report
        ? { ...toPublicSession(session), report }
        : toPublicSession(session),
      state: computeState(session),
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(_request: Request, { params }: Context) {
  await connection();
  try {
    const { id } = await params;
    await sessionForOwner(id);
    await deleteSession(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
