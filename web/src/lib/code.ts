export const CODE_EXTENSIONS = new Set([
  "ts",
  "tsx",
  "js",
  "jsx",
  "mjs",
  "cjs",
  "py",
  "go",
  "rs",
  "java",
  "kt",
  "kts",
  "rb",
  "php",
  "cs",
  "cpp",
  "cc",
  "c",
  "h",
  "hpp",
  "swift",
  "scala",
  "sql",
  "sh",
  "bash",
  "lua",
  "ex",
  "exs",
  "clj",
  "dart",
]);

const LANG_BY_EXT: Record<string, string> = {
  ts: "typescript",
  tsx: "tsx",
  js: "javascript",
  jsx: "jsx",
  mjs: "javascript",
  cjs: "javascript",
  py: "python",
  go: "go",
  rs: "rust",
  java: "java",
  kt: "kotlin",
  rb: "ruby",
  php: "php",
  cs: "csharp",
  cpp: "cpp",
  cc: "cpp",
  c: "c",
  h: "c",
  hpp: "cpp",
  swift: "swift",
  scala: "scala",
  sql: "sql",
  sh: "bash",
  bash: "bash",
  lua: "lua",
  ex: "elixir",
  exs: "elixir",
  clj: "clojure",
  dart: "dart",
};

const SHIKI_LANG: Record<string, string> = {
  typescript: "ts",
  tsx: "tsx",
  javascript: "js",
  jsx: "jsx",
  python: "python",
  go: "go",
  rust: "rust",
  java: "java",
  kotlin: "kotlin",
  ruby: "ruby",
  php: "php",
  csharp: "csharp",
  cpp: "cpp",
  c: "c",
  swift: "swift",
  scala: "scala",
  sql: "sql",
  bash: "bash",
  lua: "lua",
  elixir: "elixir",
  clojure: "clojure",
  dart: "dart",
};

export function extensionOf(path: string) {
  return path.split(".").pop()?.toLowerCase() ?? "";
}

export function isCodeFile(path: string) {
  return CODE_EXTENSIONS.has(extensionOf(path));
}

export function languageFromPath(path: string) {
  return LANG_BY_EXT[extensionOf(path)] ?? "text";
}

export function shikiLanguage(language: string) {
  return SHIKI_LANG[language] ?? "text";
}

export function countLines(code: string) {
  return code.split("\n").length;
}

export function lineNumbered(code: string) {
  return code
    .split("\n")
    .map((line, i) => `${String(i + 1).padStart(3, " ")}  ${line}`)
    .join("\n");
}

export function lineNumberedRange(code: string, start: number, end: number) {
  const lines = code.split("\n");
  const from = Math.max(1, Math.min(start, lines.length));
  const to = Math.max(from, Math.min(end, lines.length));
  return lines
    .slice(from - 1, to)
    .map((line, i) => `${String(from + i).padStart(3, " ")}  ${line}`)
    .join("\n");
}

export function languageLabel(language: string) {
  const labels: Record<string, string> = {
    typescript: "TypeScript",
    tsx: "TSX",
    javascript: "JavaScript",
    jsx: "JSX",
    python: "Python",
    go: "Go",
    rust: "Rust",
    java: "Java",
    kotlin: "Kotlin",
    ruby: "Ruby",
    php: "PHP",
    csharp: "C#",
    cpp: "C++",
    c: "C",
    swift: "Swift",
    scala: "Scala",
    sql: "SQL",
    bash: "Shell",
    text: "Code",
  };
  return labels[language] ?? language;
}

export function firstMeaningfulLine(code: string) {
  return (
    code
      .split("\n")
      .map((line) => line.trim())
      .find((line) => line.length > 0 && !line.startsWith("//") && !line.startsWith("#")) ??
    ""
  );
}

export function lineMatching(code: string, pattern: RegExp, fallback: number) {
  const lines = code.split("\n");
  const idx = lines.findIndex((line) => pattern.test(line));
  return idx >= 0 ? idx + 1 : fallback;
}
