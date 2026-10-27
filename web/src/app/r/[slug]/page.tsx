import type { Metadata } from "next";
import { connection } from "next/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ReportView } from "@/components/report-view";
import { refreshReportEvidence } from "@/lib/scoring";
import { transcriptFromSession } from "@/lib/session";
import { getSessionBySlug } from "@/lib/store";

export const instant = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  await connection();
  const { slug } = await params;
  const session = await getSessionBySlug(slug);
  if (!session?.report) return { title: "Report not found" };
  const report = refreshReportEvidence(session, session.report);

  const image = {
    url: `/r/${slug}/opengraph-image`,
    width: 1200,
    height: 630,
    alt: `Viva report: ${report.headline}`,
  };

  return {
    title: report.headline,
    description: report.summary,
    robots: { index: false, follow: false },
    openGraph: {
      title: report.headline,
      description: report.summary,
      type: "article",
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title: report.headline,
      description: report.summary,
      images: [image.url],
    },
  };
}

export default async function PublicReportPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await connection();
  const { slug } = await params;
  const session = await getSessionBySlug(slug);

  if (!session?.report) {
    notFound();
  }

  const report = refreshReportEvidence(session, session.report);
  const transcript = transcriptFromSession(session);

  return (
    <main className="report-page mx-auto max-w-[1020px] px-4 pb-16 pt-5 sm:px-5 md:pt-8">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 no-print">
        <Link
          href="/"
          className="font-mono text-[9px] uppercase tracking-[0.1em] text-ink-soft transition-colors hover:text-ink"
        >
          ← Viva
        </Link>
        <div className="flex items-center gap-3">
          <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-ink-soft">
            Shared report · read-only
          </span>
          <Link
            href="/new"
            className="font-mono text-[9px] uppercase tracking-[0.1em] text-red underline decoration-red/30 underline-offset-4"
          >
            Run your own →
          </Link>
        </div>
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
        mode="public"
        slug={session.slug}
      />
    </main>
  );
}
