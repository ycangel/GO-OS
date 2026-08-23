export type EvidenceSubmission = {
  observation: string;
  source: string;
  provenance?: string;
  confidence?: number;
  reliability?: string;
};

export type EvidenceValidationResult =
  | { allowed: true; learningSignal: boolean; reason: string }
  | { allowed: false; reason: string };

/**
 * Evidence is not only data storage. It is an organizational belief update
 * candidate and must satisfy minimum epistemic requirements.
 */
export function validateEvidenceSubmission(
  evidence: EvidenceSubmission,
): EvidenceValidationResult {
  if (!evidence.observation?.trim()) {
    return { allowed: false, reason: "observation-required" };
  }

  if (!evidence.source?.trim()) {
    return { allowed: false, reason: "source-required" };
  }

  if (!evidence.provenance?.trim()) {
    return { allowed: false, reason: "provenance-required" };
  }

  const confidence = evidence.confidence ?? 50;
  return {
    allowed: true,
    learningSignal: confidence < 50,
    reason: "evidence-accepted",
  };
}
