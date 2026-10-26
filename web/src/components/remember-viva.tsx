"use client";

import { useEffect } from "react";
import { recordRecent, type RecentBand } from "@/lib/recent";

export function RememberViva({
  sessionId,
  slug,
  filePath,
  language,
  createdAt,
  band,
  score,
}: {
  sessionId: string;
  slug: string;
  filePath: string;
  language: string;
  createdAt: string;
  band: RecentBand;
  score: number;
}) {
  useEffect(() => {
    recordRecent({
      id: sessionId,
      slug,
      filePath,
      language,
      createdAt,
      band,
      score: Math.round(score * 10) / 10,
    });
  }, [sessionId, slug, filePath, language, createdAt, band, score]);

  return null;
}
