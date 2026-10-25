"use client";

import { Check, Copy, Link2, Loader2, Printer, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { buttonClass } from "@/components/ui";

export function ReportActions({
  mode,
  sessionId,
  slug,
  markdown,
}: {
  mode: "owner" | "public" | "seed";
  sessionId?: string;
  slug?: string;
  markdown: string;
}) {
  const router = useRouter();
  const [copied, setCopied] = useState<"link" | "markdown" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function copy(text: string, kind: "link" | "markdown") {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      setError(null);
      window.setTimeout(() => setCopied(null), 1800);
    } catch {
      setError("Clipboard access was blocked. Select the text and copy it manually.");
    }
  }

  async function remove() {
    if (!sessionId) return;
    const confirmed = window.confirm(
      "Delete this viva and its report? This cannot be undone.",
    );
    if (!confirmed) return;

    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/sessions/${sessionId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed.");
      router.push("/");
      router.refresh();
    } catch {
      setDeleting(false);
      setError("That deletion didn’t go through. Try again.");
    }
  }

  if (mode === "seed") {
    return (
      <div className="flex flex-wrap items-center gap-2 no-print">
        <a href="/new" className={buttonClass("primary", "sm")}>
          Run this on your code
        </a>
        <Link href="/demo" className={buttonClass("ghost", "sm")}>
          All replays
        </Link>
      </div>
    );
  }

  return (
    <div className="no-print">
      <div className="flex flex-wrap items-center gap-2">
        {slug && (
          <button
            type="button"
            className={buttonClass("ghost", "sm")}
            onClick={() =>
              copy(`${window.location.origin}/r/${slug}`, "link")
            }
          >
            {copied === "link" ? <Check size={13} /> : <Link2 size={13} />}
            {copied === "link" ? "Link copied" : "Copy link"}
          </button>
        )}
        <button
          type="button"
          className={buttonClass("ghost", "sm")}
          onClick={() => copy(markdown, "markdown")}
        >
          {copied === "markdown" ? <Check size={13} /> : <Copy size={13} />}
          {copied === "markdown" ? "Copied" : "Copy report"}
        </button>
        <button
          type="button"
          className={buttonClass("ghost", "sm")}
          onClick={() => window.print()}
        >
          <Printer size={13} />
          Print
        </button>
        {mode === "owner" && sessionId && (
          <button
            type="button"
            className="btn btn-ghost btn-sm border-red/30 text-red hover:border-red hover:bg-red hover:text-cream"
            onClick={remove}
            disabled={deleting}
            aria-busy={deleting}
          >
            {deleting ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Trash2 size={13} />
            )}
            {deleting ? "Deleting…" : "Delete"}
          </button>
        )}
      </div>
      {error && (
        <p className="mt-2 max-w-md font-mono text-[10px] leading-relaxed text-red">
          {error}
        </p>
      )}
    </div>
  );
}
