import {
  ArrowRight,
  GitBranch,
  Mic,
  Timer,
} from "lucide-react";
import Link from "next/link";
import { ProofStrip } from "@/components/proof-strip";
import { RecentVivas } from "@/components/recent-vivas";
import { seeds } from "@/fixtures/seeds";
import { RUNG_LABELS, RUNGS } from "@/lib/types";
import { Badge, Kicker, Stamp, buttonClass } from "@/components/ui";

const rungCopy: Record<string, string> = {
  comprehension: "What it does, and where the responsibility ends.",
  decision: "The choice that shapes the file, and the alternative it beat.",
  failure: "The first real failure: bad input, an outage, a race.",
  change: "A concrete change under load, or a new requirement.",
  ownership: "One line you should be able to defend without the diff.",
};

function SampleReportCard() {
  const sample = seeds.find((seed) => seed.id === "auth") ?? seeds[0];
  const report = sample.report;

  return (
    <div className="paper-card relative rotate-[1.1deg] p-5 sm:p-6">
      <div className="flex items-center justify-between border-b border-rule pb-3">
        <span className="mono-label text-ink-soft">Viva / report</span>
        <span className="mono-label text-ink-soft">{sample.repoLabel}</span>
      </div>

      <div className="mt-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <Stamp>Confident but wrong</Stamp>
          <h2 className="mt-4 font-serif text-[clamp(1.45rem,3vw,2.2rem)] leading-[1.02] tracking-[-0.04em]">
            {report.headline}
          </h2>
        </div>
        <div className="hidden shrink-0 text-right sm:block">
          <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-ink-soft">
            Readiness
          </p>
          <p className="font-serif text-5xl leading-none tracking-[-0.05em]">
            2.9
            <span className="ml-0.5 font-sans text-xs text-ink-soft">/4</span>
          </p>
        </div>
      </div>

      <div className="mt-5 border-l-2 border-red bg-red/[0.04] p-3.5">
        <p className="mono-label text-red">Question 03 · failure</p>
        <p className="mt-2 font-serif text-lg italic leading-snug">
          “{report.confidentButWrong?.quote}”
        </p>
        <p className="mt-2 text-[11px] leading-relaxed text-ink-soft">
          {report.confidentButWrong?.why}
        </p>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3">
        {report.axes.map((axis) => (
          <div key={axis.key}>
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-[8px] uppercase tracking-[0.1em] text-ink-soft">
                {axis.label}
              </span>
              <span className="font-mono text-[9px] text-ink">
                {axis.score.toFixed(1)}
              </span>
            </div>
            <div className="mt-1 h-1 w-full bg-rule/70">
              <div
                className="h-full bg-ink"
                style={{ width: `${(axis.score / 4) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 flex items-center justify-between gap-3 border-t border-rule pt-3">
        <span className="font-mono text-[9px] uppercase tracking-[0.08em] text-ink-soft">
          Scripted replay · 6 graded turns
        </span>
        <Link
          href={`/demo/${sample.id}`}
          className="font-mono text-[9px] uppercase tracking-[0.08em] text-red underline decoration-red/30 underline-offset-4"
        >
          Full replay →
        </Link>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <main>
      <section className="relative overflow-hidden border-b border-rule">
        <div className="pointer-events-none absolute inset-0 ruled opacity-30" />
        <div className="relative mx-auto grid max-w-[1180px] gap-12 px-5 py-14 md:px-8 md:py-20 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:gap-14">
          <div className="rise">
            <div className="flex flex-wrap items-center gap-3">
              <Badge tone="red">
                <span className="h-1.5 w-1.5 rounded-full bg-red live-dot" />
                Voice-first code exams
              </Badge>
              <span className="mono-label text-ink-soft">
                No signup · five questions
              </span>
              <Link
                href="/pitch"
                className="font-mono text-[9px] uppercase tracking-[0.09em] text-red underline decoration-red/30 underline-offset-4 hover:decoration-red"
              >
                Judging? Start here
              </Link>
            </div>

            <h1 className="mt-7 font-serif text-[clamp(3.2rem,7.4vw,6.2rem)] leading-[0.88] tracking-[-0.058em]">
              If you can build it,
              <br />
              <span className="italic text-red">can you speak it?</span>
            </h1>

            <p className="mt-7 max-w-xl text-[1.05rem] leading-relaxed text-ink-soft md:text-lg">
              Viva gives your code a five-question oral exam. Paste a file, answer
              out loud with Wispr Flow, and get a report that quotes the moment you
              understood it — or confidently didn’t.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/new" className={buttonClass("primary")}>
                Run a viva
                <ArrowRight size={14} />
              </Link>
              <Link href="/demo" className={buttonClass("secondary")}>
                Watch a replay
              </Link>
            </div>

            <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 font-mono text-[9px] uppercase tracking-[0.09em] text-ink-soft">
              <span className="inline-flex items-center gap-1.5">
                <GitBranch size={11} />
                Public repo or paste
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Mic size={11} />
                Voice or keyboard
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Timer size={11} />
                About six minutes
              </span>
            </div>
          </div>

          <div className="relative rise rise-2">
            <div className="absolute -left-3 -top-3 z-10 hidden rotate-[-4deg] border border-ink bg-paper px-2 py-1 font-mono text-[9px] uppercase tracking-[0.12em] md:block">
              Exhibit A
            </div>
            <SampleReportCard />
            <p className="mt-3 text-center font-mono text-[9px] uppercase tracking-[0.08em] text-ink-soft">
              A real scripted session · not a mock-up
            </p>
          </div>
        </div>
      </section>

      <section className="border-b border-rule bg-cream/55">
        <div className="mx-auto grid max-w-[1180px] grid-cols-2 divide-x divide-rule px-5 md:grid-cols-4 md:px-8">
          {[
            ["5", "rungs per exam"],
            ["8", "turn cap"],
            ["~6", "minutes"],
            ["0", "audio stored"],
          ].map(([value, label]) => (
            <div key={label} className="px-4 py-5 first:pl-0 md:px-6">
              <p className="font-serif text-3xl leading-none tracking-[-0.04em]">
                {value}
              </p>
              <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.1em] text-ink-soft">
                {label}
              </p>
            </div>
          ))}
        </div>
      </section>

      <ProofStrip />
      <RecentVivas />

      <section id="how" className="mx-auto max-w-[1180px] px-5 py-16 md:px-8 md:py-20">
        <div className="max-w-2xl">
          <Kicker>The loop</Kicker>
          <h2 className="mt-4 font-serif text-4xl leading-[0.98] tracking-[-0.045em] md:text-5xl">
            An exam that follows the code.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-ink-soft md:text-lg">
            The questions are generated from the file, anchored to line ranges, and
            adapted when an answer is thin. No generic LeetCode, no trivia.
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {[
            {
              n: "01",
              title: "Bring the file",
              body: "Pick a public GitHub file or paste a module. One real decision, one failure path, 30–250 lines.",
            },
            {
              n: "02",
              title: "Answer out loud",
              body: "Five rungs: comprehension, decision, failure, change, ownership. One adaptive probe per weak answer.",
            },
            {
              n: "03",
              title: "Get the receipts",
              body: "A deterministic report with exact quotes, line numbers, a confident-but-wrong flag, and the next questions.",
            },
          ].map((step) => (
            <div key={step.n} className="paper-card flex flex-col p-5">
              <span className="font-mono text-[10px] text-red">{step.n}</span>
              <h3 className="mt-4 font-serif text-2xl tracking-[-0.03em]">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-ink text-cream">
        <div className="mx-auto grid max-w-[1180px] gap-10 px-5 py-16 md:px-8 md:py-20 lg:grid-cols-[0.82fr_1.18fr]">
          <div>
            <Kicker>The ladder</Kicker>
            <h2 className="mt-4 font-serif text-4xl leading-[0.98] tracking-[-0.045em] md:text-5xl">
              Five questions.
              <br />
              One story.
            </h2>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-cream/60">
              Every rung asks for something different. The exam stops at eight
              turns — enough to find the edge, not enough to turn into an
              interrogation.
            </p>
          </div>

          <div className="border-y border-cream/15">
            {RUNGS.map((rung, index) => (
              <div
                key={rung}
                className="grid grid-cols-[auto_1fr] gap-4 border-b border-cream/15 py-4 last:border-b-0 md:gap-6"
              >
                <span className="pt-0.5 font-mono text-[10px] text-red">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-cream">
                    {RUNG_LABELS[rung]}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-cream/55">
                    {rungCopy[rung]}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1180px] px-5 py-16 md:px-8 md:py-20">
        <div className="grid gap-10 lg:grid-cols-[1fr_0.92fr] lg:items-center">
          <div>
            <Kicker>Built with Wispr Flow</Kicker>
            <h2 className="mt-4 max-w-lg font-serif text-4xl leading-[0.98] tracking-[-0.045em] md:text-5xl">
              Talk like you’re at the whiteboard.
            </h2>
            <div className="prose-viva mt-5 max-w-lg">
              <p>
                Viva doesn’t record audio or ask for microphone access. The answer
                box is a plain textarea; <strong>Wispr Flow types into whatever is
                focused</strong>.
              </p>
              <p>
                That means you can think out loud, self-correct mid-sentence, and
                point at a line while you speak. The transcript is the answer. No
                voice notes, no transcription pipeline, no fake waveform.
              </p>
            </div>
            <Link
              href="/demo"
              className="mt-6 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.09em] text-red underline decoration-red/30 underline-offset-4 hover:decoration-red"
            >
              Watch a spoken answer
              <ArrowRight size={12} />
            </Link>
          </div>

          <div className="paper-card p-5">
            <div className="flex items-center justify-between gap-3">
              <span className="mono-label text-ink-soft">Answer composer</span>
              <Badge tone="red">
                <Mic size={10} />
                Wispr Flow
              </Badge>
            </div>
            <div className="mt-3 border border-rule bg-paper/60 p-4 font-sans text-lg leading-relaxed">
              “The catch catches it and returns{" "}
              <span className="bg-red/10 underline decoration-red/40">
                invalid_token
              </span>
              . That’s correct because we couldn’t authenticate the user…”
              <span className="cursor" />
            </div>
            <div className="mt-3 flex items-center justify-between gap-3 border-t border-rule pt-3">
              <span className="font-mono text-[9px] uppercase tracking-[0.08em] text-ink-soft">
                Wispr Flow is typing
              </span>
              <span className="font-mono text-[9px] uppercase tracking-[0.08em] text-ink-soft">
                Ctrl/⌘ + Enter
              </span>
            </div>
            <p className="mt-3 text-[11px] leading-relaxed text-ink-soft">
              Hold the Wispr Flow key, speak, release. Viva never sees your
              microphone — it only sees the text Wispr Flow types.
            </p>
          </div>
        </div>
      </section>

      <section className="border-y border-rule bg-cream/55">
        <div className="mx-auto max-w-[1180px] px-5 py-16 md:px-8 md:py-20">
          <div className="max-w-2xl">
            <Kicker>What it catches</Kicker>
            <h2 className="mt-4 font-serif text-4xl leading-[0.98] tracking-[-0.045em] md:text-5xl">
              The gap between shipping and owning.
            </h2>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            <div className="paper-card p-5">
              <Stamp>Confident but wrong</Stamp>
              <p className="mt-4 font-serif text-lg italic leading-snug">
                “That’s correct because we couldn’t authenticate the user, so a 401
                is the right response.”
              </p>
              <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                The answer sounds decisive. The catch turns a database outage into an
                auth failure, hides it from monitoring, and may log out a valid
                session.
              </p>
            </div>

            <div className="paper-card p-5">
              <Stamp tone="sage">Quietly right</Stamp>
              <p className="mt-4 font-serif text-lg italic leading-snug">
                “You lose all progress and the caller might think it succeeded.”
              </p>
              <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                The candidate hedges, but the transaction rollback and the
                already-incremented counter are both correct. Confidence undersold
                the reasoning.
              </p>
            </div>

            <div className="paper-card p-5">
              <Stamp tone="amber">Ownership gap</Stamp>
              <p className="mt-4 font-serif text-lg italic leading-snug">
                “I’d probably memoize it, or just not pass an unstable value.”
              </p>
              <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                The API answer is right; the timer lifecycle is missing. One probe
                exposes whether the candidate can explain what actually resets.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-[1180px] px-5 py-16 text-center md:px-8 md:py-20">
          <Stamp>No signup</Stamp>
          <h2 className="mx-auto mt-6 max-w-3xl font-serif text-[clamp(2.5rem,5.5vw,4.8rem)] leading-[0.94] tracking-[-0.05em]">
            Your code. Your voice.
            <br />
            <span className="italic text-red">Five questions.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-ink-soft">
            Bring one file you’re proud of — or one you’re not sure you can defend.
            The exam takes about six minutes. The report is the receipt.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/new" className={buttonClass("primary")}>
              Run a viva
              <ArrowRight size={14} />
            </Link>
            <Link href="/demo" className={buttonClass("secondary")}>
              Watch a replay first
            </Link>
          </div>
          <p className="mt-4 font-mono text-[9px] uppercase tracking-[0.08em] text-ink-soft">
            Public repos only · voice or keyboard · delete anytime
          </p>
        </div>
      </section>
    </main>
  );
}
