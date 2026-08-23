export type EvidenceRecord = {
  missionId?: number;
  title: string;
  observation: string;
  source: string;
  provenance: string;
  confidence: number;
  reliability: string;
  contradicts?: string[];
  alternativeInterpretations?: string[];
  missingObservations?: string[];
  decisionImpact?: string;
};

export interface EvidenceRepository {
  create(record: EvidenceRecord): Promise<EvidenceRecord>;
  listByMission(missionId: number): Promise<EvidenceRecord[]>;
}

export function validateEvidence(record: EvidenceRecord) {
  if (!record.observation.trim()) throw new Error("observation-required");
  if (!record.source.trim()) throw new Error("source-required");
  if (!record.provenance.trim()) throw new Error("provenance-required");
  if (record.confidence < 0 || record.confidence > 100) {
    throw new Error("invalid-confidence");
  }
  return true;
}
