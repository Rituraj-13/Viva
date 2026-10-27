import Link from "next/link";
import { ChevronDown } from "lucide-react";
import type { Report, TranscriptEntry } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { languageLabel } from "@/lib/code";
import { readinessScore } from "@/lib/scoring";
import { reportToMarkdown } from "@/lib/report-markdown";
import { AxisCard } from "./axis-card";
import { ReportActions } from "./report-actions";
import { ShareLink } from "./share-link";
import { Badge, Kicker, Stamp, buttonClass } from "./ui";

const bandCopy = {
  ready: {
    label: "Ready for the next round",
    stamp: "Ready for the next round",
    tone: "sage" as const,
  },
  almost: {
    label: "Almost there",
    stamp: "Almost there",
    tone: "amber" as const,
  },
  not_yet: {
    label: "Not yet",
    stamp: "Not yet",
    tone: "red" as const,
  },
};

export function ReportView({
  session,
  report,
  transcript,
  mode,
  sessionId,
  slug,
}: {
  session: {
    filePath: string;
    language: string;
    lineCount: number;
    createdAt: string;
    repoUrl?: string;
  };
  report: Report;
  transcript: TranscriptEntry[];
  mode: "owner" | "public" | "seed";
  sessionId?: string;
  slug?: string;
}) {
  const band = bandCopy[report.band];
  const readiness = readinessScore(report.axes);
  const pct = Math.max(0, Math.min(100, (readiness / 4) * 100));
  const markdown = reportToMarkdown({
    filePath: session.filePath,
    language: session.language,
    lineCount: session.lineCount,
    report,
  });
  const quietlyRight = report.quietlyRight;
  const bestMoment = report.bestMoment;
  const showQuiet = Boolean(
    quietlyRight && quietlyRight.quote.length > 0,
  );
  const showBest = Boolean(
    bestMoment &&
      bestMoment.quote.length > 0 &&
      bestMoment.quote !== quietlyRight?.quote,
  );
  const improvementAreas =
    report.improvementAreas?.length
      ? report.improvementAreas
      : report.axes
          .filter((axis) => axis.score < 3)
          .sort((a, b) => a.score - b.score)
          .slice(0, 3)
          .map((axis) => `${axis.label}: ${axis.note.replace(/^Gap:\s*/i, "")}`);

  return (
    <article className="paper-card p-5 sm:p-8 md:p-12">
      <header>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Kicker>Viva / oral exam report</Kicker>
          <Stamp tone={band.tone}>{band.stamp}</Stamp>
        </div>

        <h1 className="mt-6 max-w-4xl font-serif text-[clamp(2.2rem,5vw,4.2rem)] leading-[0.98] tracking-[-0.045em]">
          {report.headline}
        </h1>

        <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[10px] uppercase tracking-[0.08em] text-ink-soft">
          <span className="max-w-full truncate">{session.filePath}</span>
          <span className="text-rule">/</span>
          <span>{languageLabel(session.language)}</span>
          <span className="text-rule">/</span>
          <span>{session.lineCount} lines</span>
          <span className="text-rule">/</span>
          <span>{formatDate(report.createdAt || session.createdAt)}</span>
        </div>

        <p className="mt-6 max-w-3xl text-lg leading-relaxed text-ink-soft">
          {report.summary}
        </p>
      </header>

      {mode !== "seed" && slug && <ShareLink slug={slug} />}

      <section className="mt-9 grid gap-4 lg:grid-cols-[0.72fr_1.28fr]">
        <div className="paper-card-deep flex flex-col justify-between p-5">
          <div>
            <p className="mono-label text-ink-soft">Readiness</p>
            <p className="mt-2 font-serif text-[68px] leading-none tracking-[-0.07em]">
              {readiness.toFixed(1)}
              <span className="ml-1 font-sans text-lg text-ink-soft">/4</span>
            </p>
          </div>
          <div className="mt-6">
            <div className="h-2 w-full bg-rule/70">
              <div
                className="h-full bg-ink"
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between gap-2">
              <span className="mono-label text-ink-soft">{band.label}</span>
              <span className="font-mono text-[10px] text-ink-soft">
                {Math.round(pct)}%
              </span>
            </div>
            <p className="mt-3 text-[11px] leading-relaxed text-ink-soft">
              A weighted read of correctness, depth, ownership, and clarity. It is
              a signal, not a verdict.
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {report.axes.map((axis, index) => (
            <AxisCard key={axis.key} axis={axis} index={index} />
          ))}
        </div>
      </section>

      {report.confidentButWrong && (
        <section className="mt-8 border-2 border-red/60 bg-red/[0.045] p-5 md:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Stamp>Confident but wrong</Stamp>
            <span className="mono-label text-ink-soft">
              Question {String(report.confidentButWrong.questionIndex + 1).padStart(2, "0")}
            </span>
          </div>
          <blockquote className="mt-5 max-w-3xl font-serif text-2xl leading-snug tracking-[-0.02em] md:text-3xl">
            “{report.confidentButWrong.quote}”
          </blockquote>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-ink-soft">
            <strong className="font-semibold text-ink">Why it matters.</strong>{" "}
            {report.confidentButWrong.why}
          </p>
        </section>
      )}

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {showQuiet && quietlyRight && (
          <section className="border border-sage/40 bg-sage/[0.055] p-5">
            <Stamp tone="sage">Quietly right</Stamp>
            <p className="mt-4 font-serif text-xl italic leading-snug">
              “{quietlyRight.quote}”
            </p>
            <p className="mt-3 text-xs leading-relaxed text-ink-soft">
              Question {String(quietlyRight.questionIndex + 1).padStart(2, "0")}. The
              reasoning was stronger than the delivery suggested.
            </p>
          </section>
        )}

        {showBest && bestMoment && (
          <section className="border border-rule bg-cream p-5">
            <Stamp tone="sage">Best moment</Stamp>
            <p className="mt-4 font-serif text-xl italic leading-snug">
              “{bestMoment.quote}”
            </p>
            <p className="mt-3 text-xs leading-relaxed text-ink-soft">
              Question {String(bestMoment.questionIndex + 1).padStart(2, "0")}. This is
              the answer to build the next round around.
            </p>
          </section>
        )}
      </div>

      <section className="mt-10">
        <Kicker>Key improvement areas</Kicker>
        <ol className="mt-4">
          {improvementAreas.map((area, index) => (
            <li
              key={area}
              className="flex gap-4 border-t border-rule py-3 last:border-b"
            >
              <span className="mt-0.5 font-mono text-[10px] text-red">
                {String(index + 1).padStart(2, "0")}
              </span>
              <p className="text-base leading-snug md:text-lg">{area}</p>
            </li>
          ))}
        </ol>
      </section>

      {transcript.length > 0 && (
        <section className="mt-10">
          <Kicker>The transcript</Kicker>
          <div className="mt-4 border-y border-rule">
            {transcript.map((entry) => (
              <details key={entry.index} className="group border-b border-rule last:border-b-0">
                <summary className="flex items-center gap-3 py-4">
                  <span className="w-6 shrink-0 font-mono text-[10px] text-ink-soft">
                    {String(entry.index + 1).padStart(2, "0")}
                  </span>
                  <span className="hidden w-24 shrink-0 font-mono text-[9px] uppercase tracking-[0.1em] text-red sm:inline">
                    {entry.rung}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm text-ink">
                    {entry.prompt}
                  </span>
                  {entry.evaluation && (
                    <span className="hidden font-mono text-[9px] uppercase tracking-[0.08em] text-ink-soft sm:inline">
                      {entry.evaluation.verdict}
                    </span>
                  )}
                  <ChevronDown
                    size={15}
                    className="details-chevron shrink-0 text-ink-soft"
                  />
                </summary>

                <div className="pb-6 sm:pl-9">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-red sm:hidden">
                      {entry.rung}
                    </span>
                    {entry.inputMode && (
                      <Badge tone={entry.inputMode === "flow" ? "red" : "ink"}>
                        {entry.inputMode === "flow" ? "Spoken · Wispr Flow" : "Typed"}
                      </Badge>
                    )}
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                    {entry.prompt}
                  </p>
                  <div className="mt-4 border-l-2 border-ink/15 pl-4">
                    <p className="mono-label text-ink-soft">Answer</p>
                    <p className="mt-1 whitespace-pre-wrap text-base leading-relaxed">
                      {entry.answer || "Skipped."}
                    </p>
                  </div>

                  {entry.probes.map((probe, probeIndex) => (
                    <div
                      key={`${entry.index}-probe-${probeIndex}`}
                      className="mt-4 border-l-2 border-red/45 pl-4"
                    >
                      <p className="mono-label text-red">
                        {entry.probes.length > 1
                          ? `Follow-up ${probeIndex + 1}`
                          : "Follow-up"}
                      </p>
                      <p className="mt-1 font-serif text-lg leading-snug">
                        {probe.prompt}
                      </p>
                      <p className="mt-2 whitespace-pre-wrap text-base leading-relaxed">
                        {probe.answer || (probe.skipped ? "Skipped." : "No answer recorded.")}
                      </p>
                    </div>
                  ))}
                </div>
              </details>
            ))}
          </div>
        </section>
      )}

      <footer className="mt-10 border-t border-rule pt-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
          <p className="max-w-md text-xs leading-relaxed text-ink-soft">
            Viva is a signal, not a hiring verdict. Quotes are exact substrings of
            the spoken answer. The final call is human.
          </p>
          <ReportActions
            mode={mode}
            sessionId={sessionId}
            slug={slug}
            markdown={markdown}
          />
        </div>
        {mode === "seed" && (
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-rule pt-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-soft">
              Scripted replay · no microphone was used
            </p>
            <Link href="/new" className={buttonClass("primary", "sm")}>
              Run a live viva
            </Link>
          </div>
        )}
      </footer>
    </article>
  );
}
