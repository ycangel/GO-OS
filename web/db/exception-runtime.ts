import { z } from "zod";

/**
 * GO OS v0.3.1 Exception Runtime foundation.
 * Exceptions become inputs for organizational learning.
 */
export const exceptionRuntimeSchema = z.object({
  title: z.string().min(1),
  context: z.string().min(1),
  severity: z.enum(["low", "medium", "high", "critical"]).default("medium"),
  recurrenceKey: z.string().nullable().default(null),
  recurrenceCount: z.number().int().nonnegative().default(1),
  structuralReviewRequired: z.boolean().default(false),
  learningTarget: z.string().nullable().default(null),
  disposition: z.enum([
    "open",
    "accepted",
    "resolved",
    "converted_to_capability",
    "policy_updated",
  ]).default("open"),
});

export type ExceptionRuntime = z.infer<typeof exceptionRuntimeSchema>;
