import { ArrowRight, Mic, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { IngestClient } from "@/components/ingest-client";
import { Badge, Kicker, Stamp, buttonClass } from "@/components/ui";
import { RUNG_LABELS, RUNGS } from "@/lib/types";

export const metadata: Metadata = {
  title: "New viva",
  description:
    "Bring a public GitHub file or paste code. Viva writes a five-question oral exam anchored to the file.",
};

export default function NewVivaPage() {
  return (
    <main className="mx-auto max-w-[1180px] px-5 py-10 md:px-8 md:py-14">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div className="max-w-2xl">
          <Kicker>New viva</Kicker>
          <h1 className="mt-4 font-serif text-[clamp(2.6rem,6vw,4.8rem)] leading-[0.93] tracking-[-0.05em]">
            Bring a file.
            <br />
            <span className="italic text-red">Take the exam.</span>
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-ink-soft md:text-lg">
            One file, five questions, about six minutes. The questions are anchored
            to the lines you’ll be asked to defend.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge tone="red">
            <Mic size={10} />
            Flow or keyboard
          </Badge>
          <Badge>
            <ShieldCheck size={10} />
            No signup
          </Badge>
        </div>
      </div>

      <div className="mt-9 grid gap-5 lg:grid-cols-[minmax(0,1fr)_330px]">
        <IngestClient />

        <aside className="space-y-4">
          <div className="paper-card p-5">
            <p className="mono-label text-red">A good file has</p>
            <ul className="mt-3 space-y-3">
              {[
                "One real decision you made — not boilerplate.",
                "One failure path: an outage, bad input, a race, a retry.",
                "Enough lines to point at: 30–250 is the sweet spot.",
              ].map((item, index) => (
                <li key={item} className="flex gap-3 text-sm leading-relaxed">
                  <span className="font-mono text-[10px] text-red">
                    0{index + 1}
                  </span>
                  <span className="text-ink-soft">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="paper-card p-5">
            <p className="mono-label text-red">The five rungs</p>
            <ul className="mt-3 space-y-2.5">
              {RUNGS.map((rung, index) => (
                <li key={rung} className="flex items-baseline gap-3">
                  <span className="font-mono text-[9px] text-ink-soft">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink">
                    {RUNG_LABELS[rung]}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-4 border-t border-rule pt-3 text-[11px] leading-relaxed text-ink-soft">
              One adaptive probe per weak answer. Max two probes per rung, eight
              turns per session.
            </p>
          </div>

          <div className="border border-rule bg-paper-deep/35 p-5">
            <p className="mono-label text-ink-soft">No microphone permission</p>
            <p className="mt-2 text-[11px] leading-relaxed text-ink-soft">
              Viva doesn’t record audio. Wispr Flow types into the focused answer
              box, exactly like a keyboard. The transcript is the answer.
            </p>
          </div>

          <div className="flex flex-col items-start gap-3 border-t border-rule pt-5">
            <Stamp>Not sure yet?</Stamp>
            <p className="text-sm leading-relaxed text-ink-soft">
              Watch a replay first, or use the retry sample inside the paste tab.
            </p>
            <Link href="/demo" className={buttonClass("ghost", "sm")}>
              Watch a replay
              <ArrowRight size={12} />
            </Link>
          </div>
        </aside>
      </div>
    </main>
  );
}
