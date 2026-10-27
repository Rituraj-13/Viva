"use client";

import { Check, Copy } from "lucide-react";
import { useState, useSyncExternalStore } from "react";

const subscribe = () => () => {};

export function ShareLink({ slug }: { slug: string }) {
  const origin = useSyncExternalStore(
    subscribe,
    () => window.location.origin,
    () => "",
  );
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const path = `/r/${slug}`;
  const url = origin ? `${origin}${path}` : path;

  async function copy() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${path}`);
      setCopied(true);
      setError(null);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setError("Clipboard was blocked. Select the link and copy it manually.");
    }
  }

  return (
    <div className="mt-6 border border-rule bg-paper-deep/35 px-4 py-3">
      <div className="flex flex-col gap-1.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-3">
        <span className="mono-label shrink-0 text-ink-soft">Share link</span>
        <a
          href={path}
          target="_blank"
          rel="noreferrer"
          className="min-w-0 break-all font-mono text-[11px] text-ink underline decoration-rule underline-offset-4 hover:text-red hover:decoration-red"
        >
          {url}
        </a>
        <button
          type="button"
          onClick={copy}
          className="inline-flex w-fit items-center gap-1 font-mono text-[9px] uppercase tracking-[0.08em] text-red underline decoration-red/30 underline-offset-4 hover:decoration-red"
        >
          {copied ? <Check size={11} /> : <Copy size={11} />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <p className="mt-1.5 text-[11px] leading-relaxed text-ink-soft">
        Anyone with this link can read the report. The live session stays
        private.
      </p>
      {error && (
        <p className="mt-1 text-[11px] leading-relaxed text-red">{error}</p>
      )}
    </div>
  );
}
