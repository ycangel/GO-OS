import { validateEvidence, type EvidenceRecord } from "./evidence-persistence";

export function validateEvidenceSubmission(record: EvidenceRecord) {
  validateEvidence(record);

  return {
    accepted: true,
    learningSignal:
      Boolean(record.contradicts?.length) || record.confidence < 50,
  };
}
