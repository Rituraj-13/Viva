import type { Axis } from "@/lib/types";
import { cn } from "@/lib/utils";

const toneByScore = (score: number) => {
  if (score >= 3) return "bg-sage";
  if (score >= 2) return "bg-amber";
  return "bg-red";
};

export function AxisCard({ axis, index }: { axis: Axis; index: number }) {
  const pct = Math.max(0, Math.min(100, (axis.score / 4) * 100));

  return (
    <div className="paper-card flex h-full flex-col p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="mono-label text-ink-soft">
            {String(index + 1).padStart(2, "0")} / {axis.label}
          </p>
        </div>
        <p className="font-serif text-2xl leading-none tracking-[-0.04em]">
          {axis.score.toFixed(1)}
          <span className="ml-0.5 font-sans text-[10px] text-ink-soft">/4</span>
        </p>
      </div>

      <div className="mt-3 h-1.5 w-full overflow-hidden bg-rule/60">
        <div
          className={cn("h-full transition-[width] duration-700", toneByScore(axis.score))}
          style={{ width: `${pct}%` }}
        />
      </div>

      <blockquote className="mt-3 border-l border-rule pl-3 font-serif text-[13px] italic leading-snug text-ink-soft">
        {axis.evidenceQuote ? `“${axis.evidenceQuote}”` : "No answer recorded."}
      </blockquote>

      <div className="mt-auto flex items-center justify-between gap-2 pt-3">
        <p className="text-[11px] leading-snug text-ink-soft">{axis.note}</p>
        <span className="shrink-0 font-mono text-[9px] text-ink-soft/70">
          L{axis.line}
        </span>
      </div>
    </div>
  );
}
