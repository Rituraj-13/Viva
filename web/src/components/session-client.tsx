"use client";

import {
  AlertCircle,
  ArrowRight,
  ChevronDown,
  Keyboard,
  Loader2,
  Mic,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { CodeViewer } from "@/components/code-viewer";
import { Badge, RungRail, Stamp, buttonClass } from "@/components/ui";
import { RUNG_LABELS, type PublicSession, type SessionState } from "@/lib/types";
import { cn } from "@/lib/utils";

type ErrorState = { message: string; action?: string } | null;

export function SessionClient({
  session,
  html,
  initialState,
}: {
  session: PublicSession;
  html: string;
  initialState: SessionState;
}) {
  const router = useRouter();
  const [questions] = useState(session.questions);
  const [turns, setTurns] = useState(session.turns);
  const [activeQuestionId, setActiveQuestionId] = useState(
    initialState.activeQuestionId,
  );
  const [activeProbeId, setActiveProbeId] = useState(initialState.activeProbeId);
  const [done, setDone] = useState(initialState.done);
  const [inputMode, setInputMode] = useState<"flow" | "typed">("flow");
  const [loading, setLoading] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [error, setError] = useState<ErrorState>(null);
  const [charCount, setCharCount] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const activeQuestion =
    questions.find((q) => q.id === activeQuestionId) ?? null;
  const activeProbe =
    turns.find((t) => t.id === activeProbeId && t.kind === "probe") ?? null;
  const answered = questions.filter((q) =>
    turns.some((t) => t.kind === "answer" && t.questionId === q.id),
  ).length;

  const focusStart = activeQuestion?.focusStart ?? 1;
  const focusEnd = activeQuestion?.focusEnd ?? 1;
  const activeIndex = activeQuestion?.index ?? Math.max(0, questions.length - 1);

  const draftKey = `viva-draft:${session.id}:${activeQuestionId ?? "done"}:${
    activeProbeId ?? "main"
  }`;

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    let stored = "";
    try {
      stored = window.sessionStorage.getItem(draftKey) ?? "";
    } catch {
      stored = "";
    }
    el.value = stored;
    setCharCount(stored.length);
    el.focus();
  }, [draftKey]);

  const previousAnswer = useMemo(() => {
    if (!activeProbe || !activeQuestion) return null;
    return (
      turns.find(
        (t) => t.kind === "answer" && t.questionId === activeQuestion.id,
      ) ?? null
    );
  }, [activeProbe, activeQuestion, turns]);

  function handleInput(event: React.FormEvent<HTMLTextAreaElement>) {
    const value = event.currentTarget.value;
    setCharCount(value.length);
    if (error) setError(null);
    try {
      window.sessionStorage.setItem(draftKey, value);
    } catch {
      // Draft persistence is a convenience; ignore storage failures.
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      void submit(false);
    }
    if (event.altKey && event.key.toLowerCase() === "s") {
      event.preventDefault();
      void submit(true);
    }
  }

  async function submit(skip: boolean) {
    if (!activeQuestion || loading || finishing) return;
    const text = skip ? "" : (textareaRef.current?.value ?? "").trim();
    if (!skip && text.length < 2) {
      setError({
        message: "The examiner needs an answer — or you can skip the question.",
        action: "Speak or type at least a sentence.",
      });
      textareaRef.current?.focus();
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/sessions/${session.id}/turns`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: activeQuestion.id,
          turnId: activeProbeId ?? undefined,
          text,
          inputMode,
          skipped: skip,
        }),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError({
          message: data?.error?.message ?? "That answer could not be graded.",
          action: data?.error?.action,
        });
        setLoading(false);
        return;
      }

      if (data.turn) {
        setTurns((prev) => {
          const next = prev.filter((t) => t.id !== data.turn.id);
          next.push(data.turn);
          if (data.probe) next.push(data.probe);
          return next;
        });
      }

      const nextState: SessionState | undefined = data.state;
      setActiveQuestionId(nextState?.activeQuestionId ?? null);
      setActiveProbeId(nextState?.activeProbeId ?? null);
      setDone(Boolean(data.done || nextState?.done));

      if (textareaRef.current) textareaRef.current.value = "";
      setCharCount(0);
      try {
        window.sessionStorage.removeItem(draftKey);
      } catch {
        // Ignore storage failures.
      }
      setLoading(false);
    } catch {
      setError({
        message: "The connection dropped before the answer was saved.",
        action: "Try submitting again — your draft is still here.",
      });
      setLoading(false);
    }
  }

  async function finish() {
    if (finishing || loading) return;
    if (answered === 0) {
      setError({
        message: "There are no answers to grade yet.",
        action: "Answer at least one question first.",
      });
      return;
    }

    setFinishing(true);
    setError(null);
    try {
      const res = await fetch(`/api/sessions/${session.id}/finish`, {
        method: "POST",
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError({
          message: data?.error?.message ?? "The report could not be built.",
          action: data?.error?.action,
        });
        setFinishing(false);
        return;
      }
      router.push(`/s/${session.id}/report`);
    } catch {
      setError({
        message: "The connection dropped while building the report.",
        action: "Try again in a moment.",
      });
      setFinishing(false);
    }
  }

  return (
    <main className="mx-auto max-w-[1320px] px-4 pb-16 pt-4 sm:px-5 md:px-8">
      <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-red live-dot" />
          <span className="mono-label text-red">Live viva</span>
        </span>
        <span className="hidden font-mono text-[10px] text-rule sm:inline">/</span>
        <span className="max-w-[42vw] truncate font-mono text-[10px] uppercase tracking-[0.06em] text-ink-soft">
          {session.filePath}
        </span>
        <div className="ml-auto flex items-center gap-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-soft">
            {answered}/{questions.length}
          </span>
          {answered >= 3 && !done && (
            <button
              type="button"
              onClick={finish}
              disabled={finishing}
              className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-soft underline decoration-rule underline-offset-4 hover:text-red"
            >
              Finish early
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="order-2 lg:order-1 lg:sticky lg:top-[84px] lg:self-start">
          <CodeViewer
            html={html}
            filePath={session.filePath}
            language={session.language}
            focusStart={focusStart}
            focusEnd={focusEnd}
          />
          <p className="mt-2 max-w-lg text-[11px] leading-relaxed text-ink-soft">
            The examiner highlights the evidence window. The rest of the file is
            context — you can scroll it.
          </p>
        </div>

        <div className="order-1 lg:order-2">
          <RungRail activeIndex={activeIndex} probe={Boolean(activeProbe)} />

          <div className="paper-card mt-4 p-5 sm:p-7">
            {activeQuestion && !done ? (
              <>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="mono-label text-red">
                      Rung {String(activeQuestion.index + 1).padStart(2, "0")} /{" "}
                      {RUNG_LABELS[activeQuestion.rung]}
                    </p>
                    <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.08em] text-ink-soft">
                      Question {activeQuestion.index + 1} of {questions.length}
                    </p>
                  </div>
                  <Badge>
                    Lines {activeQuestion.focusStart}–{activeQuestion.focusEnd}
                  </Badge>
                </div>

                <h1 className="mt-4 font-serif text-[clamp(1.65rem,3.2vw,2.55rem)] leading-[1.04] tracking-[-0.035em]">
                  {activeQuestion.prompt}
                </h1>

                {activeProbe ? (
                  <div className="mt-4 border-l-2 border-red bg-red/[0.035] p-4">
                    <p className="mono-label text-red">The examiner follows up</p>
                    <p className="mt-2 font-serif text-xl leading-snug">
                      {activeProbe.prompt}
                    </p>
                    {previousAnswer && (
                      <details className="mt-3">
                        <summary className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.08em] text-ink-soft hover:text-ink">
                          <ChevronDown
                            size={12}
                            className="details-chevron"
                          />
                          Your first answer
                        </summary>
                        <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                          {previousAnswer.answer || "Skipped."}
                        </p>
                      </details>
                    )}
                  </div>
                ) : (
                  <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-soft">
                    Answer out loud. Point to a line. Name the trade-off. Say what
                    breaks — not what the code “looks like.”
                  </p>
                )}

                <div className="mt-6 border-t border-rule pt-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="inline-flex border border-rule bg-paper/50 p-0.5">
                      <button
                        type="button"
                        onClick={() => setInputMode("flow")}
                        className={cn(
                          "inline-flex items-center gap-1.5 px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.09em] transition-colors",
                          inputMode === "flow"
                            ? "bg-ink text-cream"
                            : "text-ink-soft hover:text-ink",
                        )}
                        aria-pressed={inputMode === "flow"}
                      >
                        <Mic size={11} />
                        Flow
                      </button>
                      <button
                        type="button"
                        onClick={() => setInputMode("typed")}
                        className={cn(
                          "inline-flex items-center gap-1.5 px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.09em] transition-colors",
                          inputMode === "typed"
                            ? "bg-ink text-cream"
                            : "text-ink-soft hover:text-ink",
                        )}
                        aria-pressed={inputMode === "typed"}
                      >
                        <Keyboard size={11} />
                        Typed
                      </button>
                    </div>
                    <span className="font-mono text-[9px] uppercase tracking-[0.08em] text-ink-soft">
                      {inputMode === "flow"
                        ? "Wispr Flow types into this box"
                        : "Keyboard answer"}
                    </span>
                  </div>

                  <textarea
                    key={draftKey}
                    ref={textareaRef}
                    onInput={handleInput}
                    onKeyDown={handleKeyDown}
                    rows={6}
                    maxLength={8000}
                    spellCheck={false}
                    placeholder={
                      activeProbe
                        ? "Answer the follow-up. Keep it concrete."
                        : "Start with what it does. Then point to the line that matters."
                    }
                    className="mt-3 w-full resize-y border border-rule bg-cream px-4 py-3.5 font-sans text-[17px] leading-relaxed text-ink outline-none transition-colors placeholder:text-ink-soft/45 focus:border-ink"
                    aria-label="Your spoken answer"
                  />

                  {loading && (
                    <div className="mt-3 flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.08em] text-ink-soft">
                      <span className="h-1.5 w-1.5 rounded-full bg-red live-dot" />
                      The examiner is deciding whether to probe…
                    </div>
                  )}

                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                    <p className="font-mono text-[9px] uppercase tracking-[0.07em] text-ink-soft">
                      {charCount} chars · Ctrl/⌘ + Enter · Alt + S to skip
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => submit(true)}
                        disabled={loading}
                        className={buttonClass("ghost", "sm")}
                      >
                        Skip
                      </button>
                      <button
                        type="button"
                        onClick={() => submit(false)}
                        disabled={loading}
                        className={buttonClass("primary", "sm")}
                      >
                        {loading ? (
                          <>
                            <Loader2 size={13} className="animate-spin" />
                            Grading…
                          </>
                        ) : (
                          <>
                            Submit answer
                            <ArrowRight size={13} />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="py-2 text-center">
                <Stamp tone="sage">Session complete</Stamp>
                <h2 className="mt-5 font-serif text-4xl leading-none tracking-[-0.04em]">
                  That’s all five.
                </h2>
                <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-ink-soft">
                  Your report is built from the answers, the probes, and the exact
                  lines you defended — not from a vibe check.
                </p>
                <button
                  type="button"
                  onClick={finish}
                  disabled={finishing}
                  className={cn(buttonClass("primary"), "mt-6")}
                >
                  {finishing ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Writing the closing note…
                    </>
                  ) : (
                    <>
                      Build my report
                      <ArrowRight size={14} />
                    </>
                  )}
                </button>
                {finishing && (
                  <p className="mt-3 font-mono text-[9px] uppercase tracking-[0.08em] text-ink-soft">
                    This can take a few seconds. Don’t close the tab.
                  </p>
                )}
              </div>
            )}

            {error && (
              <div className="mt-5 flex gap-2 border border-red/35 bg-red/[0.04] p-3">
                <AlertCircle size={15} className="mt-0.5 shrink-0 text-red" />
                <div>
                  <p className="text-sm text-ink">{error.message}</p>
                  {error.action && (
                    <p className="mt-1 text-xs text-ink-soft">{error.action}</p>
                  )}
                </div>
              </div>
            )}
          </div>

          <p className="mt-3 px-1 text-[11px] leading-relaxed text-ink-soft">
            Viva never shows you the expected answer during the exam. The report
            quotes your words and points back to the code.
          </p>
        </div>
      </div>
    </main>
  );
}
