import { z } from "zod";

/**
 * GO OS v0.3.1 Evidence Runtime foundation.
 * Evidence is treated as a belief update interface, not only a record.
 */
export const evidenceRuntimeSchema = z.object({
  observation: z.string().min(1),
  source: z.string().min(1),
  confidence: z.number().min(0).max(100).default(50),
  provenance: z.string().default("unknown"),
  contradicts: z.array(z.string()).default([]),
  alternativeInterpretations: z.array(z.string()).default([]),
  missingObservations: z.array(z.string()).default([]),
  decisionImpact: z.string().default("unknown"),
});

export type EvidenceRuntime = z.infer<typeof evidenceRuntimeSchema>;
