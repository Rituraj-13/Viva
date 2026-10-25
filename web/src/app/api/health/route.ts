import { connection, NextResponse } from "next/server";
import { llmStatus } from "@/lib/ai/provider";
import { storeKind } from "@/lib/store";


export async function GET() {
  await connection();
  return NextResponse.json({
    ok: true,
    store: storeKind(),
    llm: llmStatus(),
    ts: new Date().toISOString(),
  });
}
