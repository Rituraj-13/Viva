import { connection, NextResponse } from "next/server";
import { handleRouteError, searchParam } from "@/lib/api";
import { countLines } from "@/lib/code";
import { fetchRepoFile } from "@/lib/github";


export async function GET(request: Request) {
  await connection();
  try {
    const url = searchParam(request, "url");
    const path = searchParam(request, "path");
    const file = await fetchRepoFile(url, path);

    return NextResponse.json(
      {
        code: file.code,
        language: file.language,
        path: file.filePath,
        owner: file.owner,
        repo: file.repo,
        branch: file.branch,
        repoUrl: file.repoUrl,
        lineCount: countLines(file.code),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
