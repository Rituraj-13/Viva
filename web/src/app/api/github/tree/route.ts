import { connection, NextResponse } from "next/server";
import { handleRouteError, searchParam } from "@/lib/api";
import { listRepoFiles } from "@/lib/github";


export async function GET(request: Request) {
  await connection();
  try {
    const url = searchParam(request, "url");
    const listing = await listRepoFiles(url);
    return NextResponse.json(listing, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
