"use client";

import { ArrowRight, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Badge, Kicker } from "@/components/ui";
import {
  clearRecent,
  readRecent,
  subscribeRecent,
  type RecentBand,
  type RecentViva,
} from "@/lib/recent";
import { formatDate } from "@/lib/utils";

const bandCopy: Record<RecentBand, { label: string; tone: "sage" | "amber" | "red" }> =
  {
    ready: { label: "Ready", tone: "sage" },
    almost: { label: "Almost there", tone: "amber" },
    not_yet: { label: "Not yet", tone: "red" },
  };

export function RecentVivas() {
  const [items, setItems] = useState<RecentViva[] | null>(null);

  useEffect(() => {
    const sync = () => setItems(readRecent());
    sync();
    return subscribeRecent(sync);
  }, []);

  if (!items || items.length === 0) return null;

  return (
    <section className="border-b border-rule bg-cream/35">
      <div className="mx-auto max-w-[1180px] px-5 py-10 md:px-8 md:py-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Kicker>This browser</Kicker>
            <h2 className="mt-3 font-serif text-3xl leading-none tracking-[-0.04em] md:text-4xl">
              Pick up where you left off.
            </h2>
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-ink-soft">
              Recent vivas are stored locally in this browser. No account, no
              server history.
            </p>
          </div>
          <button
            type="button"
            onClick={clearRecent}
            className="inline-flex items-center gap-1.5 border border-rule px-2.5 py-2 font-mono text-[9px] uppercase tracking-[0.08em] text-ink-soft transition-colors hover:border-ink hover:text-ink"
          >
            <Trash2 size={11} />
            Clear
          </button>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => {
            const band = item.band ? bandCopy[item.band] : null;
            const href = item.band
              ? `/s/${item.id}/report`
              : `/s/${item.id}`;

            return (
              <Link
                key={item.id}
                href={href}
                className="paper-card group flex flex-col p-4 transition-transform duration-200 hover:-translate-y-0.5 hover:border-ink"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="truncate font-mono text-[10px] text-ink">
                    {item.filePath}
                  </span>
                  {band ? (
                    <Badge tone={band.tone}>{band.label}</Badge>
                  ) : (
                    <Badge tone="ink">In progress</Badge>
                  )}
                </div>

                <div className="mt-4 flex items-end justify-between gap-3">
                  <div>
                    <p className="font-mono text-[9px] uppercase tracking-[0.08em] text-ink-soft">
                      {item.language} · {formatDate(item.createdAt)}
                    </p>
                    <p className="mt-1 font-serif text-2xl leading-none tracking-[-0.04em]">
                      {item.score !== undefined ? item.score.toFixed(1) : "—"}
                      <span className="ml-0.5 font-sans text-[11px] text-ink-soft">
                        /4
                      </span>
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-[0.08em] text-red">
                    {item.band ? "Report" : "Continue"}
                    <ArrowRight
                      size={11}
                      className="transition-transform group-hover:translate-x-0.5"
                    />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
