import { z } from "zod";

export const EvaluationSchema = z.object({
  verdict: z.enum(["strong", "partial", "weak", "off_topic"]),
  correctness: z.number().int().min(0).max(4),
  depth: z.number().int().min(0).max(4),
  ownership: z.number().int().min(0).max(4),
  clarity: z.number().int().min(0).max(4),
  confidence: z.number().int().min(0).max(4),
  quote: z.string().max(280),
  quoteIsStrength: z.boolean(),
  missing: z.array(z.string().max(120)).max(3),
  followUp: z.string().max(220).nullable(),
  followUpReason: z.string().max(160).nullable(),
});

export type Evaluation = z.infer<typeof EvaluationSchema>;
