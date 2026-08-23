export type LearningRecord = {
  id: string;
  sourceType: "deliberation" | "evidence" | "exception" | "mission";
  sourceId: string;
  insight: string;
  changedBelief?: string;
  capabilityImpact?: string;
  reusablePattern?: string;
  createdAt: string;
};

export function createLearningRecord(input: Omit<LearningRecord, "id" | "createdAt">): LearningRecord {
  return {
    ...input,
    id: `learning-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
}

export function promoteLearningToCapability(record: LearningRecord) {
  return {
    capabilityCandidate: true,
    sourceLearning: record.id,
    suggestedCapability: record.reusablePattern ?? record.insight,
  };
}
