"use client";

import { useEffect, useRef } from "react";
import { languageLabel } from "@/lib/code";
import { cn } from "@/lib/utils";

export function CodeViewer({
  html,
  filePath,
  language,
  focusStart,
  focusEnd,
  className,
}: {
  html: string;
  filePath: string;
  language: string;
  focusStart: number;
  focusEnd: number;
  className?: string;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = scrollRef.current;
    if (!root) return;

    const lines = root.querySelectorAll<HTMLElement>(".line");
    lines.forEach((line) => {
      const number = Number(line.dataset.line);
      line.classList.toggle(
        "is-focus",
        Number.isFinite(number) && number >= focusStart && number <= focusEnd,
      );
    });

    const target = root.querySelector<HTMLElement>(
      `[data-line="${Math.max(1, focusStart)}"]`,
    );
    if (!target) return;

    const top = target.offsetTop;
    const visibleBottom = root.scrollTop + root.clientHeight - 80;
    if (top < root.scrollTop || top > visibleBottom) {
      root.scrollTo({
        top: Math.max(0, top - root.clientHeight / 3),
        behavior: "smooth",
      });
    }
  }, [html, focusStart, focusEnd]);

  return (
    <div className={cn("code-shell", className)}>
      <div className="code-head">
        <span className="truncate">{filePath}</span>
        <span className="shrink-0 text-ink-soft">{languageLabel(language)}</span>
      </div>
      <div
        ref={scrollRef}
        className="code-view max-h-[38vh] lg:max-h-[calc(100vh-260px)]"
        dangerouslySetInnerHTML={{ __html: html }}
        aria-label={`Source code for ${filePath}`}
      />
      <div className="code-foot">
        <span>Focus {focusStart}–{focusEnd}</span>
        <span>{focusEnd - focusStart + 1} lines</span>
      </div>
    </div>
  );
}
