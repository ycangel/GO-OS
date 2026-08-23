export type EvolutionLoopStatus = "detected" | "proposed" | "approved" | "applied" | "learned";

export interface EvolutionLoop {
  sourceExceptionId?: string;
  sourceLearningId?: string;
  proposalId?: string;
  status: EvolutionLoopStatus;
  humanApprovalRequired: boolean;
}

export function createEvolutionLoop(input: Partial<EvolutionLoop>): EvolutionLoop {
  return {
    status: input.status ?? "detected",
    humanApprovalRequired: true,
    ...input,
  };
}
