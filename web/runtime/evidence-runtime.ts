export type EvidenceConfidence = "low" | "medium" | "high";

export type EvidenceRuntimeRecord = {
  observation: string;
  source: string;
  provenance: string;
  confidence: EvidenceConfidence;
  reliability: "low" | "medium" | "high";
  contradicts?: string[];
  alternativeInterpretations?: string[];
  missingObservations?: string[];
  decisionImpact?: string;
};

/**
 * Evidence is not only a record of what happened.
 * It is an interface for organizational belief updates.
 */
export function validateEvidence(record: EvidenceRuntimeRecord) {
  if (!record.observation || !record.source) {
    return { valid: false, reason: "observation-and-source-required" };
  }

  if (!record.provenance) {
    return { valid: false, reason: "provenance-required" };
  }

  return { valid: true };
}
