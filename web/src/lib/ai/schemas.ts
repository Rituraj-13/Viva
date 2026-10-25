import { z } from "zod";
import { RUNGS } from "../types";

export const LadderQuestionSchema = z.object({
  rung: z.enum(RUNGS),
  prompt: z.string().min(10).max(600),
  focusStart: z.number().int().min(1),
  focusEnd: z.number().int().min(1),
  expectedPoints: z.array(z.string().min(3).max(300)).min(1).max(6),
  redFlags: z.array(z.string().min(3).max(300)).max(5),
  whyThisQuestion: z.string().min(5).max(400),
});

export const LadderSchema = z.object({
  tooThin: z.boolean(),
  summary: z.string().min(1).max(600),
  focusRegions: z
    .array(
      z.object({
        start: z.number().int().min(1),
        end: z.number().int().min(1),
        label: z.string().min(2).max(120),
      }),
    )
    .max(5),
  questions: z.array(LadderQuestionSchema).max(5),
});

export const EvaluationSchema = z.object({
  verdict: z.enum(["strong", "partial", "weak", "off_topic"]),
  correctness: z.number().int().min(0).max(4),
  depth: z.number().int().min(0).max(4),
  ownership: z.number().int().min(0).max(4),
  clarity: z.number().int().min(0).max(4),
  confidence: z.number().int().min(0).max(4),
  quote: z.string().max(400),
  quoteIsStrength: z.boolean(),
  missing: z.array(z.string().max(300)).max(4),
  followUp: z.string().max(500).nullable(),
  followUpReason: z.string().max(300).nullable(),
});

export const ReportCopySchema = z.object({
  headline: z.string().min(5).max(180),
  summary: z.string().min(20).max(900),
  nextQuestions: z.array(z.string().min(5).max(300)).min(1).max(3),
});
