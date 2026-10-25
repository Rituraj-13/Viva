import type { Metadata } from "next";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { ReplayClient } from "@/components/replay-client";
import { getSeed } from "@/fixtures/seeds";
import { highlightCode } from "@/lib/highlight";

export const instant = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ seed: string }>;
}): Promise<Metadata> {
  const { seed: id } = await params;
  const seed = getSeed(id);
  if (!seed) return { title: "Replay not found" };
  return {
    title: `${seed.title} — replay`,
    description: seed.subtitle,
  };
}

export default async function ReplayPage({
  params,
}: {
  params: Promise<{ seed: string }>;
}) {
  const { seed: id } = await params;
  const seed = getSeed(id);
  if (!seed) notFound();

  await connection();
  const html = await highlightCode(seed.code, seed.language);
  return <ReplayClient seed={seed} html={html} />;
}
