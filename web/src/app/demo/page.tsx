import { ArrowRight, Mic } from "lucide-react";
import Link from "next/link";
import { seeds } from "@/fixtures/seeds";
import { Badge, Kicker, Stamp, buttonClass } from "@/components/ui";

const bandCopy = {
  ready: { label: "Ready", tone: "sage" as const },
  almost: { label: "Almost there", tone: "amber" as const },
  not_yet: { label: "Not yet", tone: "red" as const },
};

export default function DemoPage() {
  return (
    <main className="mx-auto max-w-[1180px] px-5 py-10 md:px-8 md:py-14">
      <div className="max-w-3xl">
        <Kicker>Scripted replays</Kicker>
        <h1 className="mt-4 font-serif text-[clamp(2.6rem,6vw,4.8rem)] leading-[0.93] tracking-[-0.05em]">
          Watch the exam
          <br />
          <span className="italic text-red">before you take it.</span>
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-ink-soft md:text-lg">
          Three real exam rhythms, replayed at reading speed. No microphone, no
          login, no API keys. The live path is one click away when you’re ready.
        </p>
      </div>

      <div className="mt-7 flex flex-wrap items-center gap-2">
        <Badge tone="red">
          <Mic size={10} />
          No mic needed
        </Badge>
        <Badge>No login</Badge>
        <Badge>~90 seconds each</Badge>
        <span className="font-mono text-[9px] uppercase tracking-[0.08em] text-ink-soft">
          The code is real; the sessions are authored
        </span>
      </div>

      <div className="mt-9 grid gap-4 lg:grid-cols-3">
        {seeds.map((seed) => {
          const band = bandCopy[seed.report.band];
          const quote =
            seed.report.confidentButWrong?.quote ??
            seed.report.bestMoment?.quote ??
            seed.report.axes[0]?.evidenceQuote;
          const quoteLabel = seed.report.confidentButWrong
            ? "The tell"
            : seed.report.quietlyRight
              ? "The quiet win"
              : "The evidence";

          return (
            <Link
              key={seed.id}
              href={`/demo/${seed.id}`}
              className="paper-card group flex flex-col p-5 transition-transform duration-200 hover:-translate-y-1 hover:border-ink"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Badge tone={band.tone}>{band.label}</Badge>
                <span className="font-mono text-[9px] uppercase tracking-[0.08em] text-ink-soft">
                  {seed.language}
                </span>
              </div>

              <h2 className="mt-5 font-serif text-3xl leading-[0.98] tracking-[-0.04em] group-hover:text-red">
                {seed.title}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                {seed.subtitle}
              </p>

              <p className="mt-4 truncate font-mono text-[9px] uppercase tracking-[0.06em] text-ink-soft">
                {seed.repoLabel} / {seed.filePath}
              </p>

              <div className="mt-5 border-l-2 border-red/50 pl-3">
                <p className="mono-label text-red">{quoteLabel}</p>
                <p className="mt-2 font-serif text-base italic leading-snug">
                  “{quote}”
                </p>
              </div>

              <div className="mt-auto flex items-center justify-between gap-3 border-t border-rule pt-4">
                <span className="font-mono text-[9px] uppercase tracking-[0.08em] text-ink-soft">
                  {seed.questions.length} questions · {seed.turns.length} answers
                </span>
                <span className="inline-flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.08em] text-red">
                  Watch
                  <ArrowRight
                    size={11}
                    className="transition-transform group-hover:translate-x-0.5"
                  />
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      <section className="mt-12 flex flex-col items-start justify-between gap-5 border-t border-rule pt-8 md:flex-row md:items-center">
        <div>
          <Stamp>Your turn</Stamp>
          <h2 className="mt-4 font-serif text-3xl leading-none tracking-[-0.04em]">
            Bring a file you can defend.
          </h2>
          <p className="mt-2 max-w-lg text-sm leading-relaxed text-ink-soft">
            Public GitHub or paste. Five questions, one adaptive probe, a report
            with exact quotes.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/new" className={buttonClass("primary")}>
            Run a live viva
            <ArrowRight size={14} />
          </Link>
          <Link href="/build" className={buttonClass("secondary")}>
            Wispr Flow build log
          </Link>
        </div>
      </section>

      <p className="mt-8 max-w-2xl text-[11px] leading-relaxed text-ink-soft">
        These replays are authored to show the range of the exam: a strong session
        with one gap, a confident answer that misses the failure path, and a quiet
        candidate who is right. Live sessions are graded by the model and scored
        deterministically.
      </p>
    </main>
  );
}
