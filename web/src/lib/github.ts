import "server-only";
import {
  countLines,
  isCodeFile,
  languageFromPath,
} from "./code";
import { env } from "./env";

const MAX_LINES = 300;
const MAX_CHARS = 18_000;

export class GithubError extends Error {
  status: number;
  code: string;
  action: string;

  constructor(status: number, code: string, message: string, action: string) {
    super(message);
    this.name = "GithubError";
    this.status = status;
    this.code = code;
    this.action = action;
  }
}

type RepoMeta = {
  default_branch: string;
  full_name: string;
  private: boolean;
  size: number;
};

type TreeItem = {
  path: string;
  type: "blob" | "tree" | "commit";
  size?: number;
};

type TreeResponse = {
  tree: TreeItem[];
  truncated?: boolean;
};

type ContentResponse = {
  type: string;
  encoding?: string;
  content?: string;
  size?: number;
  path: string;
};

export type ParsedRepo = {
  owner: string;
  repo: string;
  branch?: string;
  path?: string;
  canonical: string;
};

export type RepoFile = {
  path: string;
  size: number;
};

export type RepoListing = {
  owner: string;
  repo: string;
  branch: string;
  files: RepoFile[];
  truncated: boolean;
};

export type RepoSource = {
  owner: string;
  repo: string;
  branch: string;
  filePath: string;
  language: string;
  code: string;
  repoUrl: string;
};

const EXCLUDED = [
  "node_modules/",
  ".next/",
  "dist/",
  "build/",
  "vendor/",
  "coverage/",
  ".git/",
  "package-lock.json",
  "pnpm-lock.yaml",
  "yarn.lock",
  ".min.",
  ".d.ts",
  "__tests__/",
  "__mocks__/",
  ".test.",
  ".spec.",
  "test/",
  "tests/",
  "fixtures/",
  "generated/",
];

function isExcluded(path: string) {
  const lower = path.toLowerCase();
  return EXCLUDED.some((part) => lower.includes(part));
}

export function parseRepoUrl(input: string): ParsedRepo {
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    throw new GithubError(
      400,
      "invalid_url",
      "That doesn’t look like a GitHub URL.",
      "Paste a full URL, for example https://github.com/owner/repo.",
    );
  }

  if (url.hostname !== "github.com" && url.hostname !== "www.github.com") {
    throw new GithubError(
      400,
      "invalid_host",
      "Only public github.com repositories are supported.",
      "Paste a github.com repository URL.",
    );
  }

  const parts = url.pathname.split("/").filter(Boolean);
  if (parts.length < 2) {
    throw new GithubError(
      400,
      "missing_repo",
      "The URL is missing a repository name.",
      "Use https://github.com/owner/repo.",
    );
  }

  const owner = parts[0];
  const repo = parts[1].replace(/\.git$/, "");
  if (!/^[A-Za-z0-9_.-]+$/.test(owner) || !/^[A-Za-z0-9_.-]+$/.test(repo)) {
    throw new GithubError(
      400,
      "invalid_repo",
      "That repository name contains unsupported characters.",
      "Check the URL and try again.",
    );
  }

  let branch: string | undefined;
  let filePath: string | undefined;
  if ((parts[2] === "tree" || parts[2] === "blob") && parts[3]) {
    branch = decodeURIComponent(parts[3]);
    filePath = parts.slice(4).join("/") || undefined;
  }

  return {
    owner,
    repo,
    branch,
    path: filePath,
    canonical: `https://github.com/${owner}/${repo}`,
  };
}

async function githubFetch<T>(path: string): Promise<T> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "viva-oral-exam",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (env.githubToken) headers.Authorization = `Bearer ${env.githubToken}`;

  const res = await fetch(`https://api.github.com${path}`, {
    headers,
    cache: "no-store",
  });

  if (!res.ok) {
    const remaining = res.headers.get("x-ratelimit-remaining");
    if (res.status === 404) {
      throw new GithubError(
        404,
        "not_found",
        "That repository or file is not public.",
        "Check the URL, or paste the code directly instead.",
      );
    }
    if (res.status === 403 || res.status === 429 || remaining === "0") {
      throw new GithubError(
        429,
        "github_rate_limit",
        "GitHub’s public API is rate-limiting this server.",
        "Wait a few minutes, or paste the file directly.",
      );
    }
    throw new GithubError(
      res.status >= 500 ? 502 : 400,
      "github_error",
      "GitHub returned an unexpected error.",
      "Try again, or paste the code directly.",
    );
  }

  return (await res.json()) as T;
}

export async function listRepoFiles(input: string): Promise<RepoListing> {
  const parsed = parseRepoUrl(input);
  const repo = await githubFetch<RepoMeta>(
    `/repos/${parsed.owner}/${parsed.repo}`,
  );

  if (repo.private) {
    throw new GithubError(
      403,
      "private_repo",
      "That repository is private.",
      "Only public repositories can be read. Paste the file directly instead.",
    );
  }

  const branch = parsed.branch || repo.default_branch;
  const tree = await githubFetch<TreeResponse>(
    `/repos/${parsed.owner}/${parsed.repo}/git/trees/${encodeURIComponent(branch)}?recursive=1`,
  );

  const files = tree.tree
    .filter(
      (item) =>
        item.type === "blob" && isCodeFile(item.path) && !isExcluded(item.path),
    )
    .map((item) => ({ path: item.path, size: item.size ?? 0 }))
    .sort((a, b) => a.path.localeCompare(b.path));

  return {
    owner: parsed.owner,
    repo: parsed.repo,
    branch,
    files: files.slice(0, 400),
    truncated: files.length > 400 || Boolean(tree.truncated),
  };
}

export async function fetchRepoFile(
  input: string,
  filePath: string,
): Promise<RepoSource> {
  const parsed = parseRepoUrl(input);
  if (!filePath || filePath.includes("..")) {
    throw new GithubError(
      400,
      "invalid_path",
      "That file path is not valid.",
      "Choose a file from the repository.",
    );
  }

  const repo = await githubFetch<RepoMeta>(
    `/repos/${parsed.owner}/${parsed.repo}`,
  );
  const branch = parsed.branch || repo.default_branch;
  const encodedPath = filePath
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");

  const content = await githubFetch<ContentResponse | ContentResponse[]>(
    `/repos/${parsed.owner}/${parsed.repo}/contents/${encodedPath}?ref=${encodeURIComponent(branch)}`,
  );

  if (Array.isArray(content) || content.type !== "file" || !content.content) {
    throw new GithubError(
      400,
      "not_a_file",
      "That path is a folder, not a file.",
      "Choose a single code file.",
    );
  }

  const code = Buffer.from(content.content, "base64")
    .toString("utf8")
    .replace(/^\uFEFF/, "");

  if (countLines(code) > MAX_LINES || code.length > MAX_CHARS) {
    throw new GithubError(
      413,
      "too_large",
      `That file is too large for a focused exam (${countLines(code)} lines).`,
      `Choose a file under ${MAX_LINES} lines. Smaller files make better vivas.`,
    );
  }

  return {
    owner: parsed.owner,
    repo: parsed.repo,
    branch,
    filePath,
    language: languageFromPath(filePath),
    code,
    repoUrl: parsed.canonical,
  };
}

export const GITHUB_FILE_LIMITS = { maxLines: MAX_LINES, maxChars: MAX_CHARS };
