import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ReportView } from "@/components/report-view";
import { RememberViva } from "@/components/remember-viva";
import { getAnonId } from "@/lib/anon";
import { readinessScore, refreshReportEvidence } from "@/lib/scoring";
import { transcriptFromSession } from "@/lib/session";
import { getSession } from "@/lib/store";

export const instant = false;

export const metadata: Metadata = {
  title: "Viva report",
  robots: { index: false, follow: false },
};

export default async function ReportPage({
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

  if (!session.report) {
    redirect(`/s/${session.id}`);
  }

  const transcript = transcriptFromSession(session);
  const report = refreshReportEvidence(session, session.report);
  const readiness = readinessScore(report.axes);

  return (
    <main className="report-page mx-auto max-w-[1020px] px-4 pb-16 pt-5 sm:px-5 md:pt-8">
      <RememberViva
        sessionId={session.id}
        slug={session.slug}
        filePath={session.filePath}
        language={session.language}
        createdAt={session.createdAt}
        band={report.band}
        score={readiness}
      />
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 no-print">
        <Link
          href="/"
          className="font-mono text-[9px] uppercase tracking-[0.1em] text-ink-soft transition-colors hover:text-ink"
        >
          ← Viva
        </Link>
        <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-ink-soft">
          Session report · private to this browser
        </span>
      </div>

      <ReportView
        session={{
          filePath: session.filePath,
          language: session.language,
          lineCount: session.lineCount,
          createdAt: session.createdAt,
          repoUrl: session.repoUrl,
        }}
        report={report}
        transcript={transcript}
        mode="owner"
        sessionId={session.id}
        slug={session.slug}
      />
    </main>
  );
}
