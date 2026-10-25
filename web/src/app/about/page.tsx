import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Kicker, Stamp, buttonClass } from "@/components/ui";
import { RUNG_LABELS, RUNGS } from "@/lib/types";

export const metadata: Metadata = {
  title: "Method & limits",
  description:
    "How Viva designs the five-question ladder, grades an answer, uses Wispr Flow, and stays honest about what it can’t do.",
};

const rungAsks: Record<string, { asks: string; weak: string }> = {
  comprehension: {
    asks: "What does this file promise, and where does that promise stop?",
    weak: "Restates the code line by line without naming the contract.",
  },
  decision: {
    asks: "Which choice most shapes the file, and what alternative did it beat?",
    weak: "Says “it depends” or names a library without a trade-off.",
  },
  failure: {
    asks: "What breaks first: bad input, an outage, a race, or a retry storm?",
    weak: "Says “it throws” and stops before the caller or the user.",
  },
  change: {
    asks: "A concrete change — load, a new requirement, an edge case. What moves?",
    weak: "Adds a queue and calls it scalable without saying what stays.",
  },
  ownership: {
    asks: "One specific line: why is it there, what breaks if it goes, how would you test it?",
    weak: "Calls it a convention; can’t name the consequence of deleting it.",
  },
};

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-[1020px] px-5 py-10 md:px-8 md:py-14">
      <div className="max-w-3xl">
        <Kicker>Method &amp; limits</Kicker>
        <h1 className="mt-4 font-serif text-[clamp(2.6rem,6vw,4.8rem)] leading-[0.93] tracking-[-0.05em]">
          A fair exam,
          <br />
          <span className="italic text-red">not a trick.</span>
        </h1>
        <p className="mt-5 text-base leading-relaxed text-ink-soft md:text-lg">
          Viva is built around a simple observation: shipping code and owning code
          are different skills. The exam asks you to explain the choices, the
          failure path, and the one line you’d defend in review.
        </p>
      </div>

      <section className="mt-12">
        <Kicker>The premise</Kicker>
        <div className="prose-viva mt-4 max-w-3xl">
          <p>
            Most code assessments test whether you can produce code under
            artificial constraints. Viva tests whether you can{" "}
            <strong>explain code you already wrote</strong> — out loud, without
            editing it, while someone follows up. That is closer to a code review,
            an incident, or the moment a teammate asks “why is this here?”
          </p>
          <p>
            The examiner has the file, the line numbers, and a private list of
            expected points. It never shows you those points during the exam. It
            quotes your exact words in the report. If the quote isn’t in your
            answer, it doesn’t ship.
          </p>
        </div>
      </section>

      <section className="mt-12">
        <Kicker>The ladder</Kicker>
        <h2 className="mt-3 font-serif text-3xl tracking-[-0.04em] md:text-4xl">
          Five rungs, in order.
        </h2>
        <div className="mt-5 overflow-x-auto border border-rule">
          <table className="w-full min-w-[680px] border-collapse text-left">
            <thead>
              <tr className="border-b border-rule bg-paper-deep/40">
                <th className="px-4 py-3 font-mono text-[9px] uppercase tracking-[0.1em] text-ink-soft">
                  Rung
                </th>
                <th className="px-4 py-3 font-mono text-[9px] uppercase tracking-[0.1em] text-ink-soft">
                  What it asks
                </th>
                <th className="px-4 py-3 font-mono text-[9px] uppercase tracking-[0.1em] text-ink-soft">
                  A weak answer
                </th>
              </tr>
            </thead>
            <tbody>
              {RUNGS.map((rung, index) => (
                <tr key={rung} className="border-b border-rule last:border-b-0">
                  <td className="whitespace-nowrap px-4 py-4 align-top">
                    <span className="font-mono text-[10px] text-red">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="ml-2 font-mono text-[10px] uppercase tracking-[0.08em]">
                      {RUNG_LABELS[rung]}
                    </span>
                  </td>
                  <td className="px-4 py-4 align-top text-sm leading-relaxed text-ink">
                    {rungAsks[rung].asks}
                  </td>
                  <td className="px-4 py-4 align-top text-sm leading-relaxed text-ink-soft">
                    {rungAsks[rung].weak}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-ink-soft">
          The ladder is generated from the file, then validated: exactly five
          questions, each anchored to a real line range. A weak answer triggers one
          adaptive probe, capped at two probes per rung and eight turns per session.
          The probe is not a penalty; it is the exam doing its job.
        </p>
      </section>

      <section className="mt-12">
        <Kicker>Scoring</Kicker>
        <h2 className="mt-3 font-serif text-3xl tracking-[-0.04em] md:text-4xl">
          Evidence first. Numbers second.
        </h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div className="paper-card p-5">
            <p className="mono-label text-red">The four axes</p>
            <ul className="mt-3 space-y-3 text-sm leading-relaxed text-ink-soft">
              <li>
                <strong className="text-ink">Correctness.</strong> Does the answer
                match the code and the runtime?
              </li>
              <li>
                <strong className="text-ink">Depth.</strong> Does it explain the
                mechanism, not just the API?
              </li>
              <li>
                <strong className="text-ink">Ownership.</strong> Can the candidate
                defend a specific line and its consequence?
              </li>
              <li>
                <strong className="text-ink">Clarity.</strong> Is the reasoning
                ordered enough to follow? Not grammar, not accent.
              </li>
            </ul>
          </div>
          <div className="paper-card p-5">
            <p className="mono-label text-red">The formula</p>
            <p className="mt-3 font-mono text-[11px] leading-relaxed text-ink">
              readiness =
              <br />
              0.35 × correctness
              <br />
              + 0.25 × depth
              <br />
              + 0.25 × ownership
              <br />
              + 0.15 × clarity
            </p>
            <div className="mt-4 space-y-1 font-mono text-[10px] uppercase tracking-[0.08em] text-ink-soft">
              <p>Ready ≥ 3.0</p>
              <p>Almost ≥ 2.4</p>
              <p>Not yet &lt; 2.4</p>
            </div>
            <p className="mt-4 border-t border-rule pt-3 text-[11px] leading-relaxed text-ink-soft">
              Confidence is scored separately. It never adds to readiness. It is
              only used to flag a confident-but-wrong answer and a quietly-right
              one.
            </p>
          </div>
        </div>
      </section>

      <section className="mt-12">
        <Kicker>Wispr Flow</Kicker>
        <h2 className="mt-3 font-serif text-3xl tracking-[-0.04em] md:text-4xl">
          The microphone is Flow’s job.
        </h2>
        <div className="prose-viva mt-4 max-w-3xl">
          <p>
            Viva does not request microphone access, record audio, or run a speech
            model. The answer composer is a plain textarea.{" "}
            <strong>Wispr Flow types into whatever input is focused</strong>, so a
            spoken answer arrives as text — rambling, self-correcting, and in the
            candidate’s own words.
          </p>
          <p>
            That constraint is deliberate. It keeps the app small, keeps audio off
            the server, and lets the candidate switch to the keyboard without
            changing the exam. The report quotes the transcript, not a recording.
          </p>
        </div>
      </section>

      <section className="mt-12">
        <Kicker>What it doesn’t do</Kicker>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {[
            [
              "It is not a hiring verdict.",
              "A report is a signal for a human conversation. It is not a score to auto-reject on.",
            ],
            [
              "It is not a LeetCode test.",
              "There is no hidden puzzle. The questions are about the file in front of you.",
            ],
            [
              "It does not read private repos.",
              "Only public GitHub files or code you paste. No OAuth, no repo write access.",
            ],
            [
              "It does not record audio.",
              "Flow handles dictation at the OS level; Viva only sees the text.",
            ],
          ].map(([title, body]) => (
            <div key={title} className="border border-rule bg-cream p-4">
              <p className="font-serif text-lg leading-snug tracking-[-0.02em]">
                {title}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <Kicker>Privacy &amp; providers</Kicker>
        <div className="prose-viva mt-4 max-w-3xl">
          <p>
            There are no accounts. An anonymous cookie owns your sessions; a delete
            button removes the session and its report. Public code and pasted code
            are sent to the grading model. Free-tier providers may use prompts to
            improve their products, so{" "}
            <strong>don’t paste code you can’t share</strong>. This is a hackathon
            build, not a confidential review tool.
          </p>
          <p>
            The live grader uses Groq’s free tier as the primary model, with Gemini
            as a fallback after a latency bake-off. Both passed the same
            three-answer quality gate. Every quote is validated as an exact
            substring; every score is computed in code, not by the model.
          </p>
        </div>
      </section>

      <section className="mt-12 flex flex-col items-start justify-between gap-5 border-t border-rule pt-8 md:flex-row md:items-center">
        <div>
          <Stamp>See it work</Stamp>
          <h2 className="mt-4 font-serif text-3xl leading-none tracking-[-0.04em]">
            Watch a replay, then run your own.
          </h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/demo" className={buttonClass("secondary")}>
            Watch a replay
          </Link>
          <Link href="/new" className={buttonClass("primary")}>
            Run a viva
            <ArrowRight size={14} />
          </Link>
        </div>
      </section>
    </main>
  );
}
