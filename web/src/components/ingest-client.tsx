"use client";

import {
  AlertCircle,
  ArrowRight,
  FileCode2,
  GitBranch,
  Loader2,
  Search,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Badge, buttonClass } from "@/components/ui";
import { cn } from "@/lib/utils";

type Listing = {
  owner: string;
  repo: string;
  branch: string;
  files: { path: string; size: number }[];
  truncated: boolean;
};

type FilePreview = {
  code: string;
  language: string;
  path: string;
  owner: string;
  repo: string;
  branch: string;
  repoUrl: string;
  lineCount: number;
};

type IngestError = { message: string; action?: string; code?: string } | null;

const LANGUAGES: [string, string][] = [
  ["auto", "Auto-detect from filename"],
  ["typescript", "TypeScript"],
  ["tsx", "TSX"],
  ["javascript", "JavaScript"],
  ["jsx", "JSX"],
  ["python", "Python"],
  ["go", "Go"],
  ["rust", "Rust"],
  ["java", "Java"],
  ["kotlin", "Kotlin"],
  ["ruby", "Ruby"],
  ["php", "PHP"],
  ["csharp", "C#"],
  ["cpp", "C++"],
  ["c", "C"],
  ["swift", "Swift"],
  ["sql", "SQL"],
  ["bash", "Shell"],
  ["text", "Plain text"],
];

const SAMPLE = `type Bucket = { failures: number[]; lockedUntil: number };

export class LoginThrottle {
  private buckets = new Map<string, Bucket>();

  constructor(
    private readonly windowMs = 15 * 60_000,
    private readonly maxFailures = 5,
    private readonly lockoutMs = 15 * 60_000,
    private readonly now = () => Date.now(),
  ) {}

  assertAllowed(key: string) {
    const bucket = this.buckets.get(key);
    if (!bucket) return;
    if (bucket.lockedUntil > this.now()) {
      throw new Error("Too many attempts. Try again later.");
    }
    const cutoff = this.now() - this.windowMs;
    bucket.failures = bucket.failures.filter((at) => at >= cutoff);
    if (bucket.failures.length === 0 && bucket.lockedUntil <= this.now()) {
      this.buckets.delete(key);
    }
  }

  recordFailure(key: string) {
    const bucket = this.buckets.get(key) ?? { failures: [], lockedUntil: 0 };
    const cutoff = this.now() - this.windowMs;
    bucket.failures = [...bucket.failures, this.now()].filter(
      (at) => at >= cutoff,
    );
    if (bucket.failures.length >= this.maxFailures) {
      bucket.lockedUntil = this.now() + this.lockoutMs;
    }
    this.buckets.set(key, bucket);
  }

  recordSuccess(key: string) {
    this.buckets.delete(key);
  }

  prune() {
    const cutoff = this.now() - Math.max(this.windowMs, this.lockoutMs);
    for (const [key, bucket] of this.buckets) {
      if (
        bucket.lockedUntil < this.now() &&
        bucket.failures.every((at) => at < cutoff)
      ) {
        this.buckets.delete(key);
      }
    }
  }
}`;

const STAGES = [
  "Reading the file…",
  "Finding the decisions…",
  "Writing five questions…",
  "Checking the line references…",
];

export function IngestClient() {
  const router = useRouter();
  const [tab, setTab] = useState<"github" | "paste">("github");
  const [repoUrl, setRepoUrl] = useState("");
  const [listing, setListing] = useState<Listing | null>(null);
  const [treeLoading, setTreeLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [file, setFile] = useState<FilePreview | null>(null);
  const [fileLoading, setFileLoading] = useState(false);

  const [pasteCode, setPasteCode] = useState("");
  const [pasteLabel, setPasteLabel] = useState("snippet.ts");
  const [pasteLanguage, setPasteLanguage] = useState("auto");

  const [error, setError] = useState<IngestError>(null);
  const [creating, setCreating] = useState(false);
  const [stage, setStage] = useState(0);

  const filtered = useMemo(() => {
    if (!listing) return [];
    const needle = query.trim().toLowerCase();
    return listing.files
      .filter((item) => (needle ? item.path.toLowerCase().includes(needle) : true))
      .slice(0, 250);
  }, [listing, query]);

  const pasteLines = pasteCode ? pasteCode.split("\n").length : 0;
  const canCreate =
    tab === "github"
      ? Boolean(selectedPath && file && !fileLoading)
      : pasteCode.trim().length >= 20 && pasteCode.length <= 18000;

  async function loadTree() {
    const url = repoUrl.trim();
    if (!url) {
      setError({
        message: "Paste a public GitHub repository URL first.",
        action: "For example: https://github.com/owner/repo",
      });
      return;
    }

    setTreeLoading(true);
    setError(null);
    setListing(null);
    setFile(null);
    setSelectedPath(null);
    setQuery("");

    try {
      const res = await fetch(`/api/github/tree?url=${encodeURIComponent(url)}`);
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError({
          message: data?.error?.message ?? "That repository could not be read.",
          action: data?.error?.action,
          code: data?.error?.code,
        });
        return;
      }
      setListing(data as Listing);
    } catch {
      setError({
        message: "The GitHub request failed.",
        action: "Check your connection, or paste the file directly.",
      });
    } finally {
      setTreeLoading(false);
    }
  }

  async function selectFile(path: string) {
    setSelectedPath(path);
    setFile(null);
    setFileLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/github/file?url=${encodeURIComponent(repoUrl)}&path=${encodeURIComponent(path)}`,
      );
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError({
          message: data?.error?.message ?? "That file could not be read.",
          action: data?.error?.action,
          code: data?.error?.code,
        });
        setSelectedPath(null);
        return;
      }
      setFile(data as FilePreview);
    } catch {
      setError({
        message: "The file request failed.",
        action: "Try again, or paste the code directly.",
      });
      setSelectedPath(null);
    } finally {
      setFileLoading(false);
    }
  }

  function useSample() {
    setTab("paste");
    setPasteCode(SAMPLE);
    setPasteLabel("login-throttle.ts");
    setPasteLanguage("typescript");
    setError(null);
  }

  async function create() {
    if (creating) return;

    let body:
      | { source: "paste"; code: string; language: string; label: string }
      | { source: "github"; repoUrl: string; filePath: string };

    if (tab === "github") {
      if (!selectedPath) {
        setError({
          message: "Choose a file first.",
          action: "Browse the repository and pick one code file.",
        });
        return;
      }
      body = { source: "github", repoUrl: repoUrl.trim(), filePath: selectedPath };
    } else {
      if (pasteCode.trim().length < 20) {
        setError({
          message: "There isn’t enough code yet.",
          action: "Paste at least a handful of real lines.",
        });
        return;
      }
      body = {
        source: "paste",
        code: pasteCode.trim(),
        language: pasteLanguage,
        label: pasteLabel.trim() || "snippet.ts",
      };
    }

    setCreating(true);
    setStage(0);
    setError(null);
    let succeeded = false;
    const timer = window.setInterval(() => {
      setStage((value) => Math.min(value + 1, STAGES.length - 1));
    }, 2600);

    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError({
          message: data?.error?.message ?? "The exam could not be built.",
          action: data?.error?.action,
          code: data?.error?.code,
        });
        return;
      }

      succeeded = true;
      router.push(`/s/${data.session.id}`);
    } catch {
      setError({
        message: "The connection dropped while building the exam.",
        action: "Try again in a moment.",
      });
    } finally {
      window.clearInterval(timer);
      if (!succeeded) setCreating(false);
    }
  }

  return (
    <>
      {creating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 p-4 backdrop-blur-[2px]">
          <div className="paper-card w-full max-w-md p-6 sm:p-8">
            <div className="flex items-center justify-between gap-3">
              <span className="mono-label text-red">Building the exam</span>
              <Sparkles size={16} className="text-red" />
            </div>
            <h2 className="mt-5 font-serif text-3xl leading-none tracking-[-0.03em]">
              {STAGES[stage]}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-ink-soft">
              One model call reads the file and writes the ladder. Then the code
              stays here — the questions are anchored to its lines.
            </p>
            <div className="mt-5 h-1.5 w-full bg-rule/70">
              <div
                className="h-full bg-red transition-[width] duration-500"
                style={{ width: `${((stage + 1) / STAGES.length) * 100}%` }}
              />
            </div>
            <p className="mt-3 font-mono text-[9px] uppercase tracking-[0.08em] text-ink-soft">
              This usually takes 5–25 seconds. Don’t close the tab.
            </p>
          </div>
        </div>
      )}

      <div className="paper-card p-5 sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex border border-rule bg-paper/50 p-0.5">
            <button
              type="button"
              onClick={() => {
                setTab("github");
                setError(null);
              }}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-2 font-mono text-[9px] uppercase tracking-[0.08em] transition-colors",
                tab === "github"
                  ? "bg-ink text-cream"
                  : "text-ink-soft hover:text-ink",
              )}
            >
              <GitBranch size={12} />
              GitHub repo
            </button>
            <button
              type="button"
              onClick={() => {
                setTab("paste");
                setError(null);
              }}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-2 font-mono text-[9px] uppercase tracking-[0.08em] transition-colors",
                tab === "paste"
                  ? "bg-ink text-cream"
                  : "text-ink-soft hover:text-ink",
              )}
            >
              <FileCode2 size={12} />
              Paste code
            </button>
          </div>
          <span className="font-mono text-[9px] uppercase tracking-[0.08em] text-ink-soft">
            Public files only · no login
          </span>
        </div>

        {tab === "github" ? (
          <div className="mt-6">
            <label
              htmlFor="repo-url"
              className="mono-label text-ink-soft"
            >
              Public repository URL
            </label>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
              <input
                id="repo-url"
                value={repoUrl}
                onChange={(event) => setRepoUrl(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") void loadTree();
                }}
                placeholder="https://github.com/owner/repo"
                className="w-full border border-rule bg-cream px-3 py-2.5 font-mono text-[12px] text-ink outline-none transition-colors placeholder:text-ink-soft/45 focus:border-ink"
                autoComplete="off"
                spellCheck={false}
              />
              <button
                type="button"
                onClick={loadTree}
                disabled={treeLoading}
                className={buttonClass("secondary", "sm")}
              >
                {treeLoading ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Search size={13} />
                )}
                {treeLoading ? "Reading…" : "Browse files"}
              </button>
            </div>

            {listing && (
              <div className="mt-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-soft">
                    {listing.owner}/{listing.repo} · {listing.branch} ·{" "}
                    {listing.files.length} code files
                  </p>
                  {listing.truncated && (
                    <Badge tone="amber">Showing the first 400</Badge>
                  )}
                </div>

                <div className="mt-3 border border-rule">
                  <div className="flex items-center gap-2 border-b border-rule bg-paper-deep/40 px-3 py-2">
                    <Search size={12} className="text-ink-soft" />
                    <input
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="Filter by path…"
                      className="w-full bg-transparent font-mono text-[11px] text-ink outline-none placeholder:text-ink-soft/45"
                      aria-label="Filter repository files"
                    />
                  </div>
                  <div className="max-h-[260px] overflow-auto">
                    {filtered.length === 0 ? (
                      <p className="p-4 text-sm text-ink-soft">
                        No code files match that filter.
                      </p>
                    ) : (
                      filtered.map((item) => (
                        <button
                          key={item.path}
                          type="button"
                          onClick={() => selectFile(item.path)}
                          className={cn(
                            "flex w-full items-center gap-2 border-b border-rule/60 px-3 py-2 text-left transition-colors last:border-b-0",
                            selectedPath === item.path
                              ? "bg-ink text-cream"
                              : "hover:bg-paper-deep/40",
                          )}
                        >
                          <FileCode2
                            size={12}
                            className={cn(
                              "shrink-0",
                              selectedPath === item.path
                                ? "text-cream/60"
                                : "text-ink-soft/60",
                            )}
                          />
                          <span className="min-w-0 flex-1 truncate font-mono text-[11px]">
                            {item.path}
                          </span>
                          <span
                            className={cn(
                              "shrink-0 font-mono text-[9px]",
                              selectedPath === item.path
                                ? "text-cream/50"
                                : "text-ink-soft/60",
                            )}
                          >
                            {Math.max(1, Math.round(item.size / 1024))} KB
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                </div>

                {fileLoading && (
                  <div className="mt-4 flex items-center gap-2 border border-rule bg-cream px-4 py-6 font-mono text-[10px] uppercase tracking-[0.08em] text-ink-soft">
                    <Loader2 size={13} className="animate-spin text-red" />
                    Reading the selected file…
                  </div>
                )}

                {file && (
                  <div className="mt-4 border border-rule">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-rule bg-paper-deep/40 px-3 py-2">
                      <span className="truncate font-mono text-[10px] text-ink">
                        {file.path}
                      </span>
                      <span className="font-mono text-[9px] uppercase tracking-[0.08em] text-ink-soft">
                        {file.lineCount} lines · {file.language}
                      </span>
                    </div>
                    <pre className="max-h-[190px] overflow-auto bg-cream p-3 font-mono text-[10px] leading-relaxed text-ink-soft">
                      {file.code.split("\n").slice(0, 20).join("\n")}
                      {file.lineCount > 20 ? "\n…" : ""}
                    </pre>
                  </div>
                )}
              </div>
            )}

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-rule pt-4">
              <p className="max-w-sm text-[11px] leading-relaxed text-ink-soft">
                Files under 300 lines make the sharpest exam. GitHub’s public API
                is rate-limited; paste the code if it asks you to slow down.
              </p>
              <button
                type="button"
                onClick={create}
                disabled={!canCreate || creating}
                aria-busy={creating}
                className={buttonClass("primary", "sm")}
              >
                {creating ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    Building…
                  </>
                ) : (
                  <>
                    Build the exam
                    <ArrowRight size={13} />
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-6">
            <div className="grid gap-3 sm:grid-cols-[1fr_0.9fr]">
              <div>
                <label htmlFor="file-label" className="mono-label text-ink-soft">
                  File label
                </label>
                <input
                  id="file-label"
                  value={pasteLabel}
                  onChange={(event) => setPasteLabel(event.target.value)}
                  placeholder="src/hooks/useDebouncedValue.ts"
                  className="mt-2 w-full border border-rule bg-cream px-3 py-2.5 font-mono text-[12px] text-ink outline-none transition-colors placeholder:text-ink-soft/45 focus:border-ink"
                  spellCheck={false}
                />
              </div>
              <div>
                <label htmlFor="file-language" className="mono-label text-ink-soft">
                  Language
                </label>
                <select
                  id="file-language"
                  value={pasteLanguage}
                  onChange={(event) => setPasteLanguage(event.target.value)}
                  className="mt-2 w-full border border-rule bg-cream px-3 py-2.5 font-mono text-[12px] text-ink outline-none transition-colors focus:border-ink"
                >
                  {LANGUAGES.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between gap-2">
              <label htmlFor="code" className="mono-label text-ink-soft">
                Code
              </label>
              <button
                type="button"
                onClick={useSample}
                className="font-mono text-[9px] uppercase tracking-[0.08em] text-red underline decoration-red/30 underline-offset-4 hover:decoration-red"
              >
                Use a sample file
              </button>
            </div>
            <textarea
              id="code"
              value={pasteCode}
              onChange={(event) => setPasteCode(event.target.value)}
              rows={15}
              maxLength={18000}
              spellCheck={false}
              placeholder={`Paste a function, a hook, a route, or a small module.\n\nAround 30–250 lines is the sweet spot.`}
              className="mt-2 w-full resize-y border border-rule bg-cream px-4 py-3 font-mono text-[12px] leading-relaxed text-ink outline-none transition-colors placeholder:text-ink-soft/40 focus:border-ink"
            />

            <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
              <p className="font-mono text-[9px] uppercase tracking-[0.08em] text-ink-soft">
                {pasteLines} lines · {pasteCode.length}/18000 chars
              </p>
              <p className="text-[11px] text-ink-soft">
                The code anchors the questions; the report quotes your answers,
                not the source.
              </p>
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-rule pt-4">
              <p className="max-w-sm text-[11px] leading-relaxed text-ink-soft">
                Pick a file where the decisions are yours: a hook, a middleware,
                an ingest path, a state machine.
              </p>
              <button
                type="button"
                onClick={create}
                disabled={!canCreate || creating}
                aria-busy={creating}
                className={buttonClass("primary", "sm")}
              >
                {creating ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    Building…
                  </>
                ) : (
                  <>
                    Build the exam
                    <ArrowRight size={13} />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-5 flex gap-2 border border-red/35 bg-red/[0.04] p-3">
            <AlertCircle size={15} className="mt-0.5 shrink-0 text-red" />
            <div>
              <p className="text-sm text-ink">{error.message}</p>
              {error.action && (
                <p className="mt-1 text-xs leading-relaxed text-ink-soft">
                  {error.action}
                </p>
              )}
              {(error.code?.includes("limit") ||
                error.code === "too_thin" ||
                error.code === "not_found") && (
                <Link
                  href="/demo"
                  className="mt-2 inline-block font-mono text-[9px] uppercase tracking-[0.08em] text-red underline decoration-red/30 underline-offset-4"
                >
                  Watch a replay instead →
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
