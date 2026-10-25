"use client";

import {
  ArrowRight,
  ChevronRight,
  Pause,
  Play,
  RotateCcw,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CodeViewer } from "@/components/code-viewer";
import { ReportView } from "@/components/report-view";
import { Badge, RungRail, Stamp, buttonClass } from "@/components/ui";
import type { Seed } from "@/fixtures/seeds";
import { RUNG_LABELS } from "@/lib/types";
import { cn } from "@/lib/utils";

type Step =
  | { kind: "question"; turnIndex: number; text: string }
  | { kind: "answer"; turnIndex: number; text: string }
  | { kind: "probe"; turnIndex: number; text: string }
  | { kind: "probeAnswer"; turnIndex: number; text: string }
  | { kind: "report"; turnIndex: number; text: string };

function buildSteps(seed: Seed): Step[] {
  const steps: Step[] = [];
  seed.turns.forEach((turn, index) => {
    steps.push({ kind: "question", turnIndex: index, text: "" });
    steps.push({ kind: "answer", turnIndex: index, text: turn.answer });
    if (turn.probe) {
      steps.push({ kind: "probe", turnIndex: index, text: turn.probe.prompt });
      steps.push({
        kind: "probeAnswer",
        turnIndex: index,
        text: turn.probe.answer,
      });
    }
  });
  steps.push({
    kind: "report",
    turnIndex: seed.turns.length - 1,
    text: "",
  });
  return steps;
}

export function ReplayClient({ seed, html }: { seed: Seed; html: string }) {
  const steps = useMemo(() => buildSteps(seed), [seed]);
  const [stepIndex, setStepIndex] = useState(0);
  const [typed, setTyped] = useState("");
  const [playing, setPlaying] = useState(true);
  const [showReport, setShowReport] = useState(false);

  const current = steps[stepIndex];
  const currentTurn = seed.turns[current?.turnIndex ?? 0];
  const currentQuestion = seed.questions[currentTurn?.questionIndex ?? 0];

  useEffect(() => {
    if (!playing || showReport || !current) return;

    if (current.kind === "report") {
      const timer = window.setTimeout(() => {
        setShowReport(true);
        setPlaying(false);
      }, 700);
      return () => window.clearTimeout(timer);
    }

    if (current.kind === "question") {
      const timer = window.setTimeout(() => {
        setStepIndex((index) => Math.min(index + 1, steps.length - 1));
        setTyped("");
      }, 1100);
      return () => window.clearTimeout(timer);
    }

    if (typed.length < current.text.length) {
      const remaining = current.text.length - typed.length;
      const chunk = remaining > 160 ? 4 : 2;
      const timer = window.setTimeout(() => {
        setTyped(current.text.slice(0, typed.length + chunk));
      }, current.kind === "probe" ? 9 : 13);
      return () => window.clearTimeout(timer);
    }

    const timer = window.setTimeout(
      () => {
        setStepIndex((index) => Math.min(index + 1, steps.length - 1));
        setTyped("");
      },
      current.kind === "probe" ? 850 : 1350,
    );
    return () => window.clearTimeout(timer);
  }, [playing, showReport, current, typed, steps.length]);

  useEffect(() => {
    if (showReport) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [showReport]);

  function nextStep() {
    setStepIndex((index) => Math.min(index + 1, steps.length - 1));
    setTyped("");
  }

  function restart() {
    setStepIndex(0);
    setTyped("");
    setShowReport(false);
    setPlaying(true);
  }

  function skipToReport() {
    setStepIndex(steps.length - 1);
    setTyped("");
    setShowReport(true);
    setPlaying(false);
  }

  const transcript = useMemo(
    () =>
      seed.turns.map((turn) => {
        const question = seed.questions[turn.questionIndex];
        return {
          index: question.index,
          rung: RUNG_LABELS[question.rung],
          prompt: question.prompt,
          answer: turn.answer,
          inputMode: "flow",
          probes: turn.probe
            ? [
                {
                  prompt: turn.probe.prompt,
                  answer: turn.probe.answer,
                  inputMode: "flow",
                  evaluation: turn.probe.evaluation,
                },
              ]
            : [],
          evaluation: turn.evaluation,
        };
      }),
    [seed],
  );

  if (showReport) {
    return (
      <main className="mx-auto max-w-[1020px] px-4 py-6 sm:px-5 md:py-10">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <Stamp tone="red">Scripted replay</Stamp>
            <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-soft">
              {seed.repoLabel} / {seed.filePath}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={restart}
              className={buttonClass("ghost", "sm")}
            >
              <RotateCcw size={13} />
              Replay
            </button>
            <Link href="/new" className={buttonClass("primary", "sm")}>
              Run it live
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>

        <ReportView
          session={{
            filePath: seed.filePath,
            language: seed.language,
            lineCount: seed.code.split("\n").length,
            createdAt: seed.report.createdAt,
          }}
          report={seed.report}
          transcript={transcript}
          mode="seed"
        />
      </main>
    );
  }

  if (!current || !currentTurn || !currentQuestion) return null;

  const isAnswer = current.kind === "answer" || current.kind === "probeAnswer";
  const isProbe = current.kind === "probe";
  const isTyping = current.text.length > 0 && typed.length < current.text.length;
  const progress = ((stepIndex + 1) / steps.length) * 100;

  return (
    <main className="mx-auto max-w-[1320px] px-4 pb-12 pt-0 sm:px-5 md:px-8">
      <div className="border-b border-rule bg-ink text-cream">
        <div className="mx-auto flex max-w-[1320px] flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2.5 sm:px-5 md:px-8">
          <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-cream/55">
            Scripted replay
          </span>
          <span className="hidden font-mono text-[9px] text-cream/25 sm:inline">
            /
          </span>
          <span className="hidden text-[11px] text-cream/65 sm:inline">
            No microphone needed. The live path is one click away.
          </span>
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPlaying((value) => !value)}
              className="inline-flex items-center gap-1.5 border border-cream/20 px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.08em] text-cream/80 transition-colors hover:border-cream/50 hover:text-cream"
            >
              {playing ? <Pause size={11} /> : <Play size={11} />}
              {playing ? "Pause" : "Play"}
            </button>
            <Link
              href="/new"
              className="inline-flex items-center gap-1.5 bg-cream px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.08em] text-ink transition-colors hover:bg-red hover:text-cream"
            >
              Run it live
              <ArrowRight size={11} />
            </Link>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 py-4">
        <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-red">
          Replay
        </span>
        <span className="font-mono text-[10px] text-rule">/</span>
        <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-ink-soft">
          {seed.repoLabel}
        </span>
        <span className="hidden font-mono text-[10px] text-rule sm:inline">/</span>
        <span className="max-w-[46vw] truncate font-mono text-[10px] text-ink-soft">
          {seed.filePath}
        </span>
        <div className="ml-auto flex items-center gap-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-soft">
            Question {currentQuestion.index + 1} of {seed.questions.length}
          </span>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="order-2 lg:order-1 lg:sticky lg:top-[84px] lg:self-start">
          <CodeViewer
            html={html}
            filePath={seed.filePath}
            language={seed.language}
            focusStart={currentQuestion.focusStart}
            focusEnd={currentQuestion.focusEnd}
          />
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <p className="text-[11px] leading-relaxed text-ink-soft">
              The evidence window moves with the question. The rest is context.
            </p>
            <span className="font-mono text-[9px] uppercase tracking-[0.08em] text-ink-soft">
              {seed.report.band === "ready"
                ? "A clean pass"
                : seed.report.band === "almost"
                  ? "A near-miss"
                  : "A gap worth seeing"}
            </span>
          </div>
        </div>

        <div className="order-1 lg:order-2">
          <RungRail
            activeIndex={currentQuestion.index}
            probe={
              Boolean(currentTurn.probe) &&
              (isProbe || current.kind === "probeAnswer")
            }
          />

          <div className="paper-card relative mt-4 overflow-hidden p-5 sm:p-7">
            <div className="absolute inset-x-0 top-0 h-[2px] bg-rule/60">
              <div
                className="h-full bg-red transition-[width] duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="mono-label text-red">
                  Rung {String(currentQuestion.index + 1).padStart(2, "0")} /{" "}
                  {RUNG_LABELS[currentQuestion.rung]}
                </p>
                <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.08em] text-ink-soft">
                  {isProbe || current.kind === "probeAnswer"
                    ? "The examiner follows up"
                    : "The examiner asks"}
                </p>
              </div>
              <Badge>
                Lines {currentQuestion.focusStart}–{currentQuestion.focusEnd}
              </Badge>
            </div>

            <h1 className="mt-4 font-serif text-[clamp(1.65rem,3.2vw,2.55rem)] leading-[1.04] tracking-[-0.035em]">
              {currentQuestion.prompt}
            </h1>

            {current.kind === "question" && (
              <div className="mt-6 flex items-center gap-2 border-t border-rule pt-5 font-mono text-[10px] uppercase tracking-[0.08em] text-ink-soft">
                <span className="h-1.5 w-1.5 rounded-full bg-red live-dot" />
                Listening for the answer…
              </div>
            )}

            {isAnswer && (
              <div className="mt-5 border-t border-rule pt-5" aria-live="polite">
                <div className="flex items-center gap-2">
                  <span className="mono-label text-ink-soft">Candidate</span>
                  <Badge tone="red">Spoken · Flow</Badge>
                </div>
                <p className="mt-3 min-h-[4.5rem] whitespace-pre-wrap font-sans text-[17px] leading-relaxed">
                  {typed}
                  {isTyping && <span className="cursor" />}
                </p>
              </div>
            )}

            {isProbe && (
              <div className="mt-5 border-l-2 border-red bg-red/[0.035] p-4">
                <p className="mono-label text-red">Follow-up</p>
                <p className="mt-2 min-h-[3rem] whitespace-pre-wrap font-serif text-xl leading-snug">
                  {typed}
                  {isTyping && <span className="cursor" />}
                </p>
              </div>
            )}

            {(current.kind === "answer" || current.kind === "probeAnswer") &&
              currentTurn.probe &&
              current.kind === "probeAnswer" && (
                <div className="mt-3 border-l-2 border-red/30 pl-3">
                  <p className="mono-label text-ink-soft">The follow-up</p>
                  <p className="mt-1 font-serif text-sm leading-snug text-ink-soft">
                    {currentTurn.probe.prompt}
                  </p>
                </div>
              )}

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-rule pt-4">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPlaying((value) => !value)}
                  className={buttonClass("ghost", "sm")}
                >
                  {playing ? <Pause size={12} /> : <Play size={12} />}
                  {playing ? "Pause" : "Play"}
                </button>
                <button
                  type="button"
                  onClick={nextStep}
                  className={buttonClass("ghost", "sm")}
                >
                  Next
                  <ChevronRight size={12} />
                </button>
                <button
                  type="button"
                  onClick={restart}
                  className={buttonClass("ghost", "sm")}
                  aria-label="Restart replay"
                >
                  <RotateCcw size={12} />
                </button>
              </div>
              <button
                type="button"
                onClick={skipToReport}
                className={cn(
                  "font-mono text-[9px] uppercase tracking-[0.08em] text-red underline decoration-red/30 underline-offset-4 hover:decoration-red",
                )}
              >
                Skip to report
                <ArrowRight size={11} className="ml-1 inline" />
              </button>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 px-1">
            <p className="text-[11px] leading-relaxed text-ink-soft">
              {seed.report.band === "almost"
                ? "Watch for the moment the answer sounds certain and the code disagrees."
                : "Watch how the candidate hedges — and where the reasoning is still right."}
            </p>
            <span className="font-mono text-[9px] uppercase tracking-[0.08em] text-ink-soft">
              {seed.turns.length} answers · scripted
            </span>
          </div>
        </div>
      </div>
    </main>
  );
}
