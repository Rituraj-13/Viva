import {
  ArrowRight,
  Check,
  ExternalLink,
  Mic,
  Quote,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Badge, Kicker, Stamp, buttonClass } from "@/components/ui";
import { demoAsset, flowUsage, reportAsset } from "@/lib/showcase";

export const metadata: Metadata = {
  title: "Flow build log",
  description:
    "What Viva dictated with Wispr Flow, what changed because it was spoken, and what shipped. Includes the Flow usage card.",
};

const entries = [
  {
    n: "01",
    title: "Start with the freeze, not the feature",
    said: "I can ship a file with AI faster than I can explain the retry path to a reviewer. Build the rehearsal, not another code explainer.",
    shipped:
      "Viva reads one file and asks five questions in the order a reviewer would: what it does, the decision that shaped it, what breaks first, what changes under load, and the one line you should be able to defend. The output is a scorecard, not a summary.",
  },
  {
    n: "02",
    title: "Five rungs. One probe.",
    said: "Five rungs, one probe. If an answer is thin, quote it back and ask once. Then move on.",
    shipped:
      "The ladder is generated from the file and validated to exactly five questions, each anchored to a real line range. A weak answer triggers one adaptive probe, capped at two probes per rung and eight turns per session.",
  },
  {
    n: "03",
    title: "Receipts, not vibes",
    said: "Score the answer against the file. Every quote has to exist in the transcript, word for word. The model is not the judge.",
    shipped:
      "The model extracts evidence; code computes the four axes and the readiness score. Quotes are validated as exact substrings. The report shows the quote, the line, and the gap — not a confidence score with no source.",
  },
  {
    n: "04",
    title: "Confidence never raises the score",
    said: "Confidence should never raise the score. It should only flag the answer that sounds sure and is wrong.",
    shipped:
      "Confidence is scored separately and never added to readiness. A high-confidence, low-correctness answer becomes “confident but wrong”; the inverse becomes “quietly right.” Both are quoted with the exact words that triggered the flag.",
  },
  {
    n: "05",
    title: "No fake waveform",
    said: "Do not fake a waveform. Flow is the microphone. Viva should only see the text.",
    shipped:
      "The answer composer is a plain textarea. Wispr Flow types into whatever is focused; the candidate can edit the text before sending it. No microphone permission, no audio recording, no speech model on the server.",
  },
  {
    n: "06",
    title: "Flow carried the talking. I typed the code.",
    said: "I'll dictate the spec, the rubric, the probe rule, the page copy, and the demo script. I'll type the code.",
    shipped:
      "That is the honest split. Flow handled the thinking-out-loud parts of the build; the editor handled the implementation. The quotes here are lightly cleaned from those dictations — the decisions and outcomes are the ones in the repo.",
  },
];

export default function BuildPage() {
  const { cardUrl, words, timeSaved } = flowUsage();
  const demo = demoAsset();
  const report = reportAsset();

  return (
    <main className="mx-auto max-w-[1180px] px-5 py-10 md:px-8 md:py-14">
      <div className="max-w-3xl">
        <Kicker>Flow build log</Kicker>
        <h1 className="mt-4 font-serif text-[clamp(2.6rem,6vw,4.8rem)] leading-[0.93] tracking-[-0.05em]">
          Built by talking.
          <br />
          <span className="italic text-red">Graded by code.</span>
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-ink-soft md:text-lg">
          Viva is a voice-first product, but it was also built with voice. This
          is the part the demo can’t show in two minutes: what was dictated, what
          changed because it was spoken, and what actually shipped.
        </p>
      </div>

      <div className="mt-7 flex flex-wrap items-center gap-2">
        <Badge tone="red">
          <Mic size={10} />
          Wispr Flow
        </Badge>
        <Badge>No Hands · Builders track</Badge>
        <Badge>16–31 Oct 2026</Badge>
        <span className="font-mono text-[9px] uppercase tracking-[0.08em] text-ink-soft">
          Quotes are lightly cleaned from dictation
        </span>
      </div>

      <section className="mt-12 grid gap-10 lg:grid-cols-[1.45fr_0.55fr] lg:items-start">
        <div>
          <Kicker>The log</Kicker>
          <h2 className="mt-3 font-serif text-3xl tracking-[-0.04em] md:text-4xl">
            Six decisions that survived the microphone.
          </h2>

          <div className="mt-7 border-l border-rule">
            {entries.map((entry) => (
              <article
                key={entry.n}
                className="relative border-b border-rule pb-8 pl-6 last:border-b-0 last:pb-0 [&:not(:first-child)]:pt-8"
              >
                <span className="absolute -left-[17px] top-0 flex h-8 w-8 items-center justify-center border border-rule bg-paper font-mono text-[10px] text-red">
                  {entry.n}
                </span>
                <h3 className="font-serif text-2xl leading-tight tracking-[-0.03em]">
                  {entry.title}
                </h3>
                <div className="mt-4 border-l-2 border-red/50 pl-4">
                  <p className="mono-label text-red">What I said</p>
                  <p className="mt-2 font-serif text-lg italic leading-snug">
                    “{entry.said}”
                  </p>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-ink-soft">
                  {entry.shipped}
                </p>
              </article>
            ))}
          </div>
        </div>

        <aside className="lg:sticky lg:top-24">
          <div className="paper-card p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="mono-label text-ink-soft">
                Wispr Flow · usage card
              </span>
              <Badge tone="red">
                <Mic size={10} />
                Wispr Flow
              </Badge>
            </div>

            {cardUrl ? (
              <>
                {/* The card is an external screenshot provided at deploy time. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={cardUrl}
                  alt="Wispr Flow usage card for the No Hands challenge"
                  className="mt-4 w-full border border-rule"
                />
                <p className="mt-3 text-[11px] leading-relaxed text-ink-soft">
                  Flow Insights for the challenge window: words dictated and
                  time saved.
                </p>
              </>
            ) : (
              <>
                <div className="mt-4 border border-dashed border-rule bg-paper/60 p-5">
                  <p className="font-serif text-2xl leading-tight tracking-[-0.03em]">
                    Attached to the submission packet.
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                    The card is a screenshot of Flow Insights for the challenge
                    window. It travels with the submission rather than being
                    hosted at a public URL.
                  </p>
                </div>
                <p className="mt-3 font-mono text-[9px] uppercase tracking-[0.08em] text-ink-soft">
                  Screenshot attached · words dictated and time saved
                </p>
              </>
            )}

            {(words || timeSaved) && (
              <div className="mt-4 grid grid-cols-2 gap-2 border-t border-rule pt-4">
                {words && (
                  <div>
                    <p className="font-serif text-2xl leading-none tracking-[-0.04em]">
                      {words}
                    </p>
                    <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.08em] text-ink-soft">
                      Words dictated
                    </p>
                  </div>
                )}
                {timeSaved && (
                  <div>
                    <p className="font-serif text-2xl leading-none tracking-[-0.04em]">
                      {timeSaved}
                    </p>
                    <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.08em] text-ink-soft">
                      Time saved
                    </p>
                  </div>
                )}
              </div>
            )}

            <a
              href="https://wisprflow.ai"
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.08em] text-red underline decoration-red/30 underline-offset-4 hover:decoration-red"
            >
              About Wispr Flow
              <ExternalLink size={11} />
            </a>
          </div>

          <div className="mt-4 border border-rule bg-paper-deep/35 p-5">
            <Stamp>Why it matters</Stamp>
            <p className="mt-3 text-sm leading-relaxed text-ink-soft">
              The challenge is not “add a microphone.” It is “can you build the
              thing by speaking?” The exam is the same idea pointed at the user:
              the skill is explaining the code, not typing about it.
            </p>
          </div>
        </aside>
      </section>

      <section className="mt-14 border-t border-rule pt-10">
        <Kicker>Why Flow is the right input</Kicker>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            {
              title: "It matches the exam",
              body: "A viva is an oral exam. Speaking is the skill being tested, so the input should be speech — not a polished essay typed after the fact.",
            },
            {
              title: "No audio leaves the browser",
              body: "Flow handles dictation at the OS level and inserts text. Viva never requests the microphone, records audio, or runs a speech model.",
            },
            {
              title: "Edits stay editable",
              body: "Dictation is a first draft. The answer composer is a normal textarea, so the candidate can fix a name, a line number, or a half-finished thought.",
            },
          ].map((item) => (
            <div key={item.title} className="paper-card p-5">
              <Check size={16} className="text-red" />
              <h3 className="mt-4 font-serif text-2xl tracking-[-0.03em]">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12 grid gap-4 md:grid-cols-2">
        <div className="paper-card p-5">
          <Quote size={16} className="text-red" />
          <h2 className="mt-4 font-serif text-2xl tracking-[-0.03em]">
            What Flow did
          </h2>
          <ul className="mt-3 space-y-2.5 text-sm leading-relaxed text-ink-soft">
            {[
              "Dictated the problem statement and the user story.",
              "Talked through the five rungs and the one-probe rule.",
              "Read the grading rubric out loud until the wording was precise.",
              "Drafted the page copy and the two-minute demo shot list.",
            ].map((item) => (
              <li key={item} className="flex gap-2.5">
                <Check size={13} className="mt-0.5 shrink-0 text-sage" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="paper-card p-5">
          <h2 className="font-serif text-2xl tracking-[-0.03em]">
            What Flow did not do
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-ink-soft">
            Flow did not write the code, invent the scores, or replace the
            editor. It carried the thinking-out-loud parts of the build — the
            framing, the rules, the copy, and the demo. That split is the honest
            one, and it is the same split the product asks of its users.
          </p>
          <Link
            href="/about"
            className="mt-4 inline-flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.08em] text-red underline decoration-red/30 underline-offset-4 hover:decoration-red"
          >
            Read the method and limits
            <ArrowRight size={11} />
          </Link>
        </div>
      </section>

      <section className="mt-12 flex flex-col items-start justify-between gap-5 border-t border-rule pt-8 md:flex-row md:items-center">
        <div>
          <Stamp>Your turn</Stamp>
          <h2 className="mt-4 font-serif text-3xl leading-none tracking-[-0.04em]">
            Hear the exam before you take it.
          </h2>
          <p className="mt-2 max-w-lg text-sm leading-relaxed text-ink-soft">
            The sample is preloaded. Or watch the demo and read a full report
            first.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/new?sample=1" className={buttonClass("primary")}>
            Try the sample exam
            <ArrowRight size={14} />
          </Link>
          {demo.external ? (
            <a
              href={demo.href}
              target="_blank"
              rel="noreferrer"
              className={buttonClass("secondary")}
            >
              Watch the demo
              <ExternalLink size={13} />
            </a>
          ) : (
            <Link href={demo.href} className={buttonClass("secondary")}>
              Watch the demo
            </Link>
          )}
          <Link href={report.href} className={buttonClass("ghost")}>
            {report.real ? "See a real report" : "See a sample report"}
          </Link>
        </div>
      </section>
    </main>
  );
}
