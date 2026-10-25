import { nanoid } from "nanoid";
import { connection, NextResponse } from "next/server";
import { z } from "zod";
import { ensureAnonId } from "@/lib/anon";
import { buildLadder } from "@/lib/ai/ladder";
import { ApiError, handleRouteError, parseBody } from "@/lib/api";
import { countLines, languageFromPath } from "@/lib/code";
import { fetchRepoFile, GITHUB_FILE_LIMITS } from "@/lib/github";
import { checkSessionQuota } from "@/lib/rate-limit";
import { saveSession } from "@/lib/store";
import { toPublicSession } from "@/lib/session";
import type { SessionData } from "@/lib/types";


const Body = z.discriminatedUnion("source", [
  z.object({
    source: z.literal("paste"),
    code: z.string().min(20).max(GITHUB_FILE_LIMITS.maxChars),
    language: z.string().max(40).default("text"),
    label: z.string().max(120).default("snippet.ts"),
  }),
  z.object({
    source: z.literal("github"),
    repoUrl: z.string().min(10).max(500),
    filePath: z.string().min(1).max(400),
  }),
]);

export async function POST(request: Request) {
  await connection();
  try {
    const anonId = await ensureAnonId();
    const quota = await checkSessionQuota(anonId);
    if (!quota.ok) {
      throw new ApiError(429, quota.code, quota.message, quota.action);
    }

    const body = await parseBody(request, Body);

    let code: string;
    let language: string;
    let filePath: string;
    let repoUrl: string | undefined;
    let repoOwner: string | undefined;
    let repoName: string | undefined;

    if (body.source === "github") {
      const file = await fetchRepoFile(body.repoUrl, body.filePath);
      code = file.code;
      language = file.language;
      filePath = file.filePath;
      repoUrl = file.repoUrl;
      repoOwner = file.owner;
      repoName = file.repo;
    } else {
      code = body.code.replace(/^\uFEFF/, "");
      filePath = body.label.trim() || "snippet.ts";
      language =
        body.language === "auto" || body.language === "text"
          ? languageFromPath(filePath)
          : body.language;
    }

    const lineCount = countLines(code);
    if (lineCount > GITHUB_FILE_LIMITS.maxLines) {
      throw new ApiError(
        413,
        "too_large",
        `That file is ${lineCount} lines. The exam focuses on files under ${GITHUB_FILE_LIMITS.maxLines}.`,
        "Paste the most important section, or choose a smaller file.",
      );
    }

    const meaningfulLines = code
      .split("\n")
      .filter(
        (line) =>
          line.trim().length > 0 &&
          !/^\s*(\/\/|#|\/\*|\*|--)/.test(line),
      ).length;

    if (meaningfulLines < 6) {
      throw new ApiError(
        422,
        "too_thin",
        "There isn’t enough code here for a five-question viva.",
        "Paste at least a handful of real lines, or choose a larger file.",
      );
    }

    const ladder = await buildLadder(code, language, filePath);
    if (ladder.tooThin) {
      throw new ApiError(
        422,
        "too_thin",
        ladder.summary || "This file is too thin to support a focused exam.",
        "Choose a file with a real decision, a failure path, and something to own.",
      );
    }

    const now = new Date().toISOString();
    const session: SessionData = {
      id: crypto.randomUUID(),
      slug: nanoid(21),
      anonId,
      source: body.source,
      repoUrl,
      repoOwner,
      repoName,
      filePath,
      language,
      code,
      lineCount,
      status: "ready",
      summary: ladder.summary,
      focusRegions: ladder.focusRegions,
      questions: ladder.questions,
      turns: [],
      model: ladder.model,
      createdAt: now,
      updatedAt: now,
    };

    await saveSession(session);

    return NextResponse.json(
      { session: toPublicSession(session), model: ladder.model },
      { status: 201 },
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
