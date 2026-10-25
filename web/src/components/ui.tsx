import type { Rung } from "@/lib/types";
import { RUNG_LABELS, RUNGS } from "@/lib/types";
import { cn } from "@/lib/utils";

export function buttonClass(
  variant: "primary" | "secondary" | "ghost" = "primary",
  size: "sm" | "md" = "md",
) {
  return cn(
    "btn",
    variant === "primary" && "btn-primary",
    variant === "secondary" && "btn-secondary",
    variant === "ghost" && "btn-ghost",
    size === "sm" && "btn-sm",
  );
}

export function Kicker({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <span className="h-px w-6 bg-red" />
      <span className="mono-label text-red">{children}</span>
    </div>
  );
}

export function Badge({
  children,
  tone = "ink",
  className,
}: {
  children: React.ReactNode;
  tone?: "ink" | "red" | "sage" | "amber";
  className?: string;
}) {
  const tones = {
    ink: "border-ink/25 text-ink",
    red: "border-red/30 text-red",
    sage: "border-sage/35 text-sage",
    amber: "border-amber/35 text-amber",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 border px-2 py-1 font-mono text-[9px] uppercase tracking-[0.14em]",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Stamp({
  children,
  tone = "red",
  className,
}: {
  children: React.ReactNode;
  tone?: "red" | "sage" | "amber";
  className?: string;
}) {
  const tones = {
    red: "border-red text-red",
    sage: "border-sage text-sage",
    amber: "border-amber text-amber",
  };
  return (
    <span
      className={cn(
        "inline-block rotate-[-3deg] border-2 px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.18em]",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function RungRail({
  activeIndex,
  probe = false,
  compact = false,
}: {
  activeIndex: number;
  probe?: boolean;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-stretch gap-0 border border-rule bg-cream/70",
        compact && "text-[9px]",
      )}
      aria-label="Exam progress"
    >
      {RUNGS.map((rung: Rung, index) => {
        const active = index === activeIndex;
        const complete = index < activeIndex;
        return (
          <div
            key={rung}
            className={cn(
              "relative flex flex-1 flex-col gap-1 border-r border-rule px-2 py-2.5 last:border-r-0 sm:px-3",
              active && "bg-ink text-cream",
              complete && "bg-paper-deep/50",
            )}
          >
            <div className="flex items-center gap-1.5">
              <span
                className={cn(
                  "font-mono text-[9px] tabular-nums",
                  active ? "text-cream/60" : complete ? "text-sage" : "text-ink-soft/50",
                )}
              >
                {complete ? "✓" : String(index + 1).padStart(2, "0")}
              </span>
              {active && probe && (
                <span className="h-1.5 w-1.5 rounded-full bg-red live-dot" />
              )}
            </div>
            <span
              className={cn(
                "font-mono text-[8px] uppercase leading-tight tracking-[0.08em] sm:text-[9px]",
                active ? "text-cream" : complete ? "text-ink-soft" : "text-ink-soft/60",
              )}
            >
              {RUNG_LABELS[rung]}
            </span>
            {active && (
              <span className="absolute inset-x-2 bottom-0 h-[2px] bg-red sm:inset-x-3" />
            )}
          </div>
        );
      })}
    </div>
  );
}

export function EmptyRule({ className }: { className?: string }) {
  return <div className={cn("h-px w-full bg-rule", className)} />;
}
