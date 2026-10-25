import type { Metadata } from "next";
import { getAnonId } from "@/lib/anon";
import { highlightCode } from "@/lib/highlight";
import { computeState, toPublicSession } from "@/lib/session";
import { getSession } from "@/lib/store";
import { notFound, redirect } from "next/navigation";
import { SessionClient } from "@/components/session-client";

export const instant = false;

export const metadata: Metadata = {
  title: "Live viva",
  robots: { index: false, follow: false },
};

export default async function SessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession(id);
  const anonId = await getAnonId();

  if (!session || !anonId || session.anonId !== anonId) {
    notFound();
  }

  if (session.report || session.status === "reported") {
    redirect(`/s/${session.id}/report`);
  }

  const html = await highlightCode(session.code, session.language);
  const state = computeState(session);

  return (
    <SessionClient
      session={toPublicSession(session)}
      html={html}
      initialState={state}
    />
  );
}
