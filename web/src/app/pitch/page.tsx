import {
  ArrowRight,
  Check,
  ExternalLink,
  GraduationCap,
  Minus,
  Plug,
  Quote,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Badge, Kicker, Stamp, buttonClass } from "@/components/ui";
import { demoAsset, reportAsset } from "@/lib/showcase";

export const metadata: Metadata = {
  title: "Judge brief",
  description:
    "The problem, the solution, the USPs, the evidence, and the honest limits behind Viva — the oral exam for code.",
};

type Mark = "yes" | "partial" | "no";

function MarkIcon({ value }: { value: Mark }) {
  if (value === "yes") {
    return (
      <span className="inline-flex items-center gap-1.5 text-sage">
        <Check size={13} />
        <span className="sr-only">Yes</span>
      </span>
    );
  }
  if (value === "partial") {
    return (
      <span className="inline-flex items-center gap-1.5 text-amber">
        <Minus size={13} />
        <span className="sr-only">Partial</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-red">
      <X size={13} />
      <span className="sr-only">No</span>
    </span>
  );
}

const usps = [
  {
    title: "The file is the syllabus",
    body: "Every question is generated from the code and anchored to a real line range. There is no generic LeetCode prompt and no trivia round.",
  },
  {
    title: "The model grades; code owns the score",
    body: "Readiness is a fixed formula, not a model vibe. Every quote in the report is validated as an exact substring of the answer.",
  },
  {
    title: "One probe, then move on",
    body: "A weak answer gets one targeted follow-up. The exam is capped at eight turns, so it finds the edge without becoming an interrogation.",
  },
  {
    title: "Confidence never raises the score",
    body: "Delivery confidence is scored separately. It only flags the dangerous gap: the answer that sounds certain and is wrong.",
  },
  {
    title: "Wispr Flow is the microphone, not a feature",
    body: "The composer is a plain textarea. Viva requests no microphone permission, records no audio, and runs no speech model.",
  },
  {
    title: "The demo survives a rate limit",
    body: "Three token-free replays run the full exam and report without a model call. The product is still judgeable if a free-tier provider is throttled.",
  },
];

const beforeAfter: Array<[string, string]> = [
  [
    "You guess what a reviewer will ask.",
    "Five questions generated from the file, anchored to real lines.",
  ],
  [
    "You rehearse silently and edit the answer in your head.",
    "You say it out loud; Wispr Flow types it; the hedges stay in the transcript.",
  ],
  [
    "Feedback is “good job,” silence, or a rejection email.",
    "An exact quote, a line, an axis score, and the gap to fix.",
  ],
  [
    "You find out in the interview or the incident call.",
    "You find out in six minutes, privately, before it costs anything.",
  ],
];

const comparison: Array<{
  label: string;
  file: Mark;
  spoken: Mark;
  deterministic: Mark;
  quotes: Mark;
}> = [
  {
    label: "Viva",
    file: "yes",
    spoken: "yes",
    deterministic: "yes",
    quotes: "yes",
  },
  {
    label: "ChatGPT voice mock interview",
    file: "partial",
    spoken: "yes",
    deterministic: "no",
    quotes: "no",
  },
  {
    label: "LeetCode-style practice",
    file: "no",
    spoken: "no",
    deterministic: "yes",
    quotes: "no",
  },
  {
    label: "Code explainer / summarizer",
    file: "yes",
    spoken: "no",
    deterministic: "no",
    quotes: "partial",
  },
];

export default function PitchPage() {
  const demo = demoAsset();
  const report = reportAsset();

  return (
    <main>
      <section className="relative overflow-hidden border-b border-rule">
        <div className="pointer-events-none absolute inset-0 ruled opacity-25" />
        <div className="relative mx-auto max-w-[1180px] px-5 py-12 md:px-8 md:py-16">
          <div className="max-w-3xl">
            <Kicker>Judge brief · Builders track</Kicker>
            <h1 className="mt-4 font-serif text-[clamp(2.8rem,6.5vw,5.4rem)] leading-[0.92] tracking-[-0.055em]">
              AI writes the code.
              <br />
              <span className="italic text-red">Can you defend it?</span>
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-ink-soft md:text-lg">
              Viva is the oral exam for code. Paste one file, answer five
              questions out loud with Wispr Flow, and get a report that quotes
              the moment you understood it — or confidently didn’t.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-2">
              <Badge tone="red">No signup</Badge>
              <Badge>Five questions</Badge>
              <Badge>About six minutes</Badge>
              <Badge>0 audio stored</Badge>
            </div>

            <div className="mt-7 flex flex-wrap gap-2">
              <Link href="/new?sample=1" className={buttonClass("primary")}>
                Start the sample exam
                <ArrowRight size={14} />
              </Link>
              <Link href={demo.href} className={buttonClass("secondary")}>
                {demo.real ? "Watch the 2-min demo" : "Watch a replay"}
              </Link>
              <Link href="/build" className={buttonClass("ghost")}>
                Wispr Flow build log
              </Link>
            </div>

            <p className="mt-4 font-mono text-[9px] uppercase leading-relaxed tracking-[0.08em] text-ink-soft">
              The sample is preloaded — first question in under a minute. It
              makes one real model call; the replays use no microphone and no
              model call.
            </p>
            <p className="mt-2 font-mono text-[9px] uppercase leading-relaxed tracking-[0.08em] text-ink-soft">
              Built solo for the Builders track. The live app is the proof; the
              limits are on the method page.
            </p>
          </div>
        </div>
      </section>

      <section className="border-b border-rule bg-paper-deep/25">
        <div className="mx-auto grid max-w-[1180px] gap-4 px-5 py-8 md:grid-cols-3 md:px-8">
          {[
            {
              n: "01",
              title: "Try the sample",
              body: "A login throttle is preloaded. Press Build the exam, then answer one question.",
              href: "/new?sample=1",
            },
            {
              n: "02",
              title: report.real ? "Read a real report" : "Read a report",
              body: "Exact quotes, line numbers, four axes, and the confident-but-wrong flag.",
              href: report.href,
            },
            {
              n: "03",
              title: "Check the build log",
              body: "What was dictated, what changed because it was spoken, and the voice receipt.",
              href: "/build",
            },
          ].map((item) => (
            <Link
              key={item.n}
              href={item.href}
              className="group flex gap-4 border border-rule bg-cream/60 p-4 transition-colors hover:border-ink"
            >
              <span className="font-mono text-[10px] text-red">{item.n}</span>
              <div>
                <p className="font-serif text-xl leading-tight tracking-[-0.03em] group-hover:text-red">
                  {item.title}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-ink-soft">
                  {item.body}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1180px] px-5 py-14 md:px-8 md:py-18">
        <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
          <div>
            <Kicker>The problem</Kicker>
            <h2 className="mt-3 font-serif text-4xl leading-[0.98] tracking-[-0.045em] md:text-5xl">
              Writing code got cheap.
              <br />
              <span className="italic text-red">Explaining it did not.</span>
            </h2>
            <div className="prose-viva mt-5 max-w-2xl">
              <p>
                The interview, the promotion review, the incident call, and the
                AI-assisted code review all test the same skill: can you explain
                what you built, why you chose it, what breaks first, and what you
                would change?
              </p>
              <p>
                Typing makes that too easy. You can edit, delete the hedge, and
                paste a polished answer. Speaking exposes the real thing: whether
                you can make a claim, hold it under a follow-up, and stay honest
                about the failure path.
              </p>
              <p>
                The cost is not abstract: a rejected interview, a review that
                stalls, or an incident call where the author cannot explain the
                failure path. The feedback usually arrives after the decision.
              </p>
            </div>

            <div className="mt-6 border-l-2 border-red/50 pl-4">
              <p className="mono-label text-red">The gap, in one line</p>
              <p className="mt-2 font-serif text-xl italic leading-snug">
                “The review does not ask if you can write it. It asks why it
                exists, what breaks, and what you would change.”
              </p>
            </div>
          </div>

          <aside className="paper-card p-5">
            <div className="flex items-center justify-between gap-3">
              <span className="mono-label text-ink-soft">Why now</span>
              <ExternalLink size={13} className="text-ink-soft" />
            </div>
            <div className="mt-4 space-y-4">
              <div>
                <p className="font-serif text-4xl leading-none tracking-[-0.04em]">
                  84%
                </p>
                <p className="mt-1 text-sm leading-relaxed text-ink-soft">
                  of developers use or plan to use AI tools in their workflow.
                </p>
              </div>
              <div className="border-t border-rule pt-4">
                <p className="font-serif text-4xl leading-none tracking-[-0.04em]">
                  45%
                </p>
                <p className="mt-1 text-sm leading-relaxed text-ink-soft">
                  say debugging AI-generated code is more time-consuming.
                </p>
              </div>
              <div className="border-t border-rule pt-4">
                <p className="font-serif text-4xl leading-none tracking-[-0.04em]">
                  66%
                </p>
                <p className="mt-1 text-sm leading-relaxed text-ink-soft">
                  hit “almost right, but not quite” as their top AI frustration.
                </p>
              </div>
            </div>
            <a
              href="https://survey.stackoverflow.co/2025/ai"
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex items-center gap-1.5 border-t border-rule pt-4 font-mono text-[9px] uppercase tracking-[0.08em] text-ink-soft underline decoration-rule underline-offset-4 hover:text-red"
            >
              Stack Overflow Developer Survey 2025
              <ExternalLink size={10} />
            </a>
          </aside>
        </div>
      </section>

      <section className="border-y border-rule bg-cream/55">
        <div className="mx-auto max-w-[1180px] px-5 py-14 md:px-8 md:py-18">
          <div className="max-w-2xl">
            <Kicker>The solution</Kicker>
            <h2 className="mt-3 font-serif text-4xl leading-[0.98] tracking-[-0.045em] md:text-5xl">
              One file. Five questions.
              <br />
              <span className="italic text-red">Six minutes.</span>
            </h2>
            <p className="mt-4 text-base leading-relaxed text-ink-soft">
              Not a summary. Not a quiz. A rehearsal of the conversation that
              decides whether the work survives review.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              {
                n: "01",
                title: "Bring the file",
                body: "Pick a public GitHub file or paste a module. The code stays visible for the whole exam.",
              },
              {
                n: "02",
                title: "Answer out loud",
                body: "Wispr Flow types into the composer. The five rungs follow the story a reviewer would ask for.",
              },
              {
                n: "03",
                title: "Get the receipts",
                body: "A report with exact quotes, line numbers, four axis scores, and the next questions to practice.",
              },
            ].map((step) => (
              <div key={step.n} className="paper-card flex flex-col p-5">
                <span className="font-mono text-[10px] text-red">{step.n}</span>
                <h3 className="mt-4 font-serif text-2xl tracking-[-0.03em]">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                  {step.body}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-8 grid gap-4 border-t border-rule pt-6 md:grid-cols-3">
            {[
              {
                label: "The interview",
                body: "A developer with an interview in 30 minutes who wants to know whether they can defend the file on screen.",
              },
              {
                label: "The AI builder",
                body: "Someone shipping with AI who needs to explain the generated code in review, not just paste it.",
              },
              {
                label: "The program",
                body: "A bootcamp or engineering lead who wants a fast, consistent oral signal before a deeper review.",
              },
            ].map((persona) => (
              <div key={persona.label}>
                <p className="mono-label text-red">{persona.label}</p>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                  {persona.body}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-[9px] uppercase tracking-[0.09em] text-ink-soft">
            <span>Comprehension → decision → failure → change → ownership</span>
            <Link
              href="/about"
              className="inline-flex items-center gap-1 text-red underline decoration-red/30 underline-offset-4 hover:decoration-red"
            >
              Read the method
              <ArrowRight size={10} />
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1180px] px-5 py-14 md:px-8 md:py-18">
        <div className="max-w-2xl">
          <Kicker>What is hard to copy</Kicker>
          <h2 className="mt-3 font-serif text-4xl leading-[0.98] tracking-[-0.045em] md:text-5xl">
            The report is the product.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-ink-soft">
            A model can ask good questions. The defensible part is what happens
            after the answer: the evidence, the fixed scoring, and the discipline
            to stop.
          </p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {usps.map((usp, index) => (
            <div key={usp.title} className="paper-card p-5">
              <div className="flex items-center justify-between gap-3">
                <span className="mono-label text-red">
                  USP {String(index + 1).padStart(2, "0")}
                </span>
                <ShieldCheck size={15} className="text-ink-soft" />
              </div>
              <h3 className="mt-3 font-serif text-2xl leading-tight tracking-[-0.03em]">
                {usp.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                {usp.body}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <Link href={report.href} className={buttonClass("secondary", "sm")}>
            See the evidence in a report
            <ArrowRight size={12} />
          </Link>
          <Link href="/demo/auth" className={buttonClass("ghost", "sm")}>
            Watch the confident-but-wrong moment
          </Link>
        </div>
      </section>

      <section className="border-y border-rule bg-ink text-cream">
        <div className="mx-auto max-w-[1180px] px-5 py-14 md:px-8 md:py-18">
          <div className="max-w-2xl">
            <Kicker>The change</Kicker>
            <h2 className="mt-3 font-serif text-4xl leading-[0.98] tracking-[-0.045em] md:text-5xl">
              Before Viva, the feedback
              <br />
              arrives too late.
            </h2>
          </div>

          <div className="mt-8 space-y-3 md:hidden">
            {beforeAfter.map(([before, after]) => (
              <div key={before} className="border border-cream/15 p-4">
                <p className="mono-label text-cream/45">Before</p>
                <p className="mt-1 text-sm leading-relaxed text-cream/55">
                  {before}
                </p>
                <p className="mono-label mt-4 text-red">With Viva</p>
                <p className="mt-1 text-sm leading-relaxed text-cream">
                  {after}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-8 hidden overflow-x-auto border border-cream/15 md:block">
            <table className="w-full min-w-[680px] border-collapse text-left">
              <thead>
                <tr className="border-b border-cream/15">
                  <th className="px-4 py-3 font-mono text-[9px] uppercase tracking-[0.1em] text-cream/50">
                    Before
                  </th>
                  <th className="px-4 py-3 font-mono text-[9px] uppercase tracking-[0.1em] text-red">
                    With Viva
                  </th>
                </tr>
              </thead>
              <tbody>
                {beforeAfter.map(([before, after]) => (
                  <tr
                    key={before}
                    className="border-b border-cream/10 last:border-b-0"
                  >
                    <td className="px-4 py-4 align-top text-sm leading-relaxed text-cream/55">
                      {before}
                    </td>
                    <td className="px-4 py-4 align-top text-sm leading-relaxed text-cream">
                      {after}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1180px] px-5 py-14 md:px-8 md:py-18">
        <div className="max-w-2xl">
          <Kicker>The category</Kicker>
          <h2 className="mt-3 font-serif text-4xl leading-[0.98] tracking-[-0.045em] md:text-5xl">
            A rehearsal, not a verdict.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-ink-soft">
            Other tools can ask questions or explain code. Viva is the narrow
            intersection: your file, your spoken answer, a deterministic report.
          </p>
        </div>

        <div className="mt-8 space-y-3 md:hidden">
          {comparison.map((row) => (
            <div key={row.label} className="border border-rule bg-cream/50 p-4">
              <p className="font-serif text-xl leading-tight tracking-[-0.03em]">
                {row.label}
              </p>
              <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2">
                <div className="flex items-center justify-between gap-2 border-t border-rule pt-2">
                  <dt className="font-mono text-[9px] uppercase tracking-[0.08em] text-ink-soft">
                    File-grounded
                  </dt>
                  <dd>
                    <MarkIcon value={row.file} />
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-2 border-t border-rule pt-2">
                  <dt className="font-mono text-[9px] uppercase tracking-[0.08em] text-ink-soft">
                    Spoken
                  </dt>
                  <dd>
                    <MarkIcon value={row.spoken} />
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-2 border-t border-rule pt-2">
                  <dt className="font-mono text-[9px] uppercase tracking-[0.08em] text-ink-soft">
                    Fixed score
                  </dt>
                  <dd>
                    <MarkIcon value={row.deterministic} />
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-2 border-t border-rule pt-2">
                  <dt className="font-mono text-[9px] uppercase tracking-[0.08em] text-ink-soft">
                    Exact quotes
                  </dt>
                  <dd>
                    <MarkIcon value={row.quotes} />
                  </dd>
                </div>
              </dl>
            </div>
          ))}
        </div>

        <div className="mt-8 hidden overflow-x-auto border border-rule md:block">
          <table className="w-full min-w-[720px] border-collapse text-left">
            <thead>
              <tr className="border-b border-rule bg-paper-deep/40">
                <th className="px-4 py-3 font-mono text-[9px] uppercase tracking-[0.1em] text-ink-soft">
                  Tool
                </th>
                <th className="px-4 py-3 font-mono text-[9px] uppercase tracking-[0.1em] text-ink-soft">
                  Grounded in your file
                </th>
                <th className="px-4 py-3 font-mono text-[9px] uppercase tracking-[0.1em] text-ink-soft">
                  Spoken answers
                </th>
                <th className="px-4 py-3 font-mono text-[9px] uppercase tracking-[0.1em] text-ink-soft">
                  Deterministic score
                </th>
                <th className="px-4 py-3 font-mono text-[9px] uppercase tracking-[0.1em] text-ink-soft">
                  Exact-quote evidence
                </th>
              </tr>
            </thead>
            <tbody>
              {comparison.map((row) => (
                <tr
                  key={row.label}
                  className="border-b border-rule last:border-b-0"
                >
                  <td className="px-4 py-4 align-top text-sm font-medium">
                    {row.label}
                  </td>
                  <td className="px-4 py-4 align-top">
                    <MarkIcon value={row.file} />
                  </td>
                  <td className="px-4 py-4 align-top">
                    <MarkIcon value={row.spoken} />
                  </td>
                  <td className="px-4 py-4 align-top">
                    <MarkIcon value={row.deterministic} />
                  </td>
                  <td className="px-4 py-4 align-top">
                    <MarkIcon value={row.quotes} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-ink-soft">
          ChatGPT can run a mock interview. LeetCode can test an algorithm. A
          code explainer can summarise a file. None of them grade your spoken
          reasoning against your own code with quotes that must exist in the
          transcript.
        </p>
      </section>

      <section className="border-y border-rule bg-cream/55">
        <div className="mx-auto max-w-[1180px] px-5 py-14 md:px-8 md:py-18">
          <div className="max-w-2xl">
            <Kicker>Who pays · hypothesis</Kicker>
            <h2 className="mt-3 font-serif text-4xl leading-[0.98] tracking-[-0.045em] md:text-5xl">
              Start with the cohorts
              <br />
              already running mock interviews.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-ink-soft">
              No traction claimed. This is the wedge we would test first, not a
              revenue chart.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              {
                icon: GraduationCap,
                label: "Beachhead",
                title: "Bootcamps & capstone courses",
                body: "They already pay for interview prep. A cohort license gives every student a repeatable rehearsal and gives instructors a signal before the demo day.",
              },
              {
                icon: Plug,
                label: "Second",
                title: "Interview-prep platforms",
                body: "White-label or API. Distribution without consumer acquisition spend, and a reason for the platform to keep the oral practice inside its product.",
              },
              {
                icon: Users,
                label: "Later",
                title: "Teams shipping AI code",
                body: "A “defend this diff” mode for review readiness. The same loop, pointed at the generated code a team is about to merge.",
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="paper-card p-5">
                  <div className="flex items-center justify-between gap-3">
                    <span className="mono-label text-red">{item.label}</span>
                    <Icon size={16} className="text-ink-soft" />
                  </div>
                  <h3 className="mt-3 font-serif text-2xl leading-tight tracking-[-0.03em]">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                    {item.body}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="border border-rule bg-paper/60 p-5">
              <p className="mono-label text-ink-soft">Model</p>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                Free individual tier for practice. Per-seat cohort license per
                term for programs. Usage-based API for platforms. The exam is
                cheap to run because the file excerpt is small and the report is
                assembled in code.
              </p>
            </div>
            <div className="border border-rule bg-paper/60 p-5">
              <p className="mono-label text-ink-soft">Why now</p>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                84% of developers use or plan to use AI tools. The scarce skill
                is no longer generation; it is understanding and defending what
                was generated, under follow-up, in front of another person.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1180px] px-5 py-14 md:px-8 md:py-18">
        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <div className="paper-card p-5">
            <Stamp>What it is not</Stamp>
            <ul className="mt-4 space-y-2.5 text-sm leading-relaxed text-ink-soft">
              {[
                "Not a hiring verdict. A report is a signal for a human conversation.",
                "Not a whole-repo scanner. One file, so the questions can stay specific.",
                "Not an audio recorder. Wispr Flow handles dictation; Viva only sees text.",
                "Not a LeetCode clone. There is no hidden puzzle, only your code.",
              ].map((item) => (
                <li key={item} className="flex gap-2.5">
                  <Check size={13} className="mt-0.5 shrink-0 text-sage" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="paper-card p-5">
            <Stamp>What we would build next</Stamp>
            <ul className="mt-4 space-y-2.5 text-sm leading-relaxed text-ink-soft">
              {[
                "Whole-repo exams with the same evidence standard.",
                "Team rubrics and a candidate-owned practice history.",
                "A “defend this diff” mode for pull requests.",
                "A cohort dashboard for instructors, not a leaderboard.",
              ].map((item) => (
                <li key={item} className="flex gap-2.5">
                  <ArrowRight size={13} className="mt-0.5 shrink-0 text-red" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="border-t border-rule bg-paper-deep/25">
        <div className="mx-auto flex max-w-[1180px] flex-col items-start justify-between gap-6 px-5 py-12 md:flex-row md:items-center md:px-8">
          <div>
            <div className="flex items-center gap-2">
              <Quote size={14} className="text-red" />
              <span className="mono-label text-ink-soft">Judge it in 60 seconds</span>
            </div>
            <h2 className="mt-4 font-serif text-3xl leading-none tracking-[-0.04em] md:text-4xl">
              Don’t take the pitch’s word for it.
            </h2>
            <p className="mt-2 max-w-lg text-sm leading-relaxed text-ink-soft">
              The sample is preloaded. The report is real. The build log is the
              part the demo can’t show.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/new?sample=1" className={buttonClass("primary")}>
              Try the sample exam
              <ArrowRight size={14} />
            </Link>
            <Link href={demo.href} className={buttonClass("secondary")}>
              {demo.real ? "Watch the 2-min demo" : "Watch the demo"}
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
