export type EvolutionProposal = {
  sourceLearningId: string;
  target: string;
  changeType: string;
  currentState: string;
  proposedState: string;
  rationale: string;
  evidenceRefs: string[];
  riskAssessment: string;
  reversibility: "reversible" | "partially_reversible" | "irreversible";
  authorityRequired: string;
  approvalStatus: "pending" | "approved" | "rejected";
};

export function createEvolutionProposal(input: EvolutionProposal) {
  return {
    ...input,
    createdAt: new Date().toISOString(),
  };
}
