import { connection, NextResponse } from "next/server";
import { handleRouteError } from "@/lib/api";
import { toPublicSession } from "@/lib/session";
import { getSessionBySlug } from "@/lib/store";


type Context = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, { params }: Context) {
  await connection();
  try {
    const { slug } = await params;
    const session = await getSessionBySlug(slug);
    if (!session?.report) {
      return NextResponse.json(
        {
          error: {
            code: "not_found",
            message: "That report does not exist.",
            action: "Run a viva to create one.",
          },
        },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { session: toPublicSession(session), report: session.report },
      {
        headers: {
          "Cache-Control": "no-store",
          "X-Robots-Tag": "noindex",
        },
      },
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
