export type CognitiveEventType =
  | "evidence_conflict"
  | "exception_pattern"
  | "strategic_uncertainty"
  | "capability_gap";

export type CognitiveEventStatus =
  | "open"
  | "deliberating"
  | "resolved"
  | "converted_to_evolution";

export interface CognitiveEvent {
  id: string;
  type: CognitiveEventType;
  trigger: string;
  context: Record<string, unknown>;
  questions: string[];
  participants: {
    humans: string[];
    agents: string[];
  };
  expectedDecision: string;
  status: CognitiveEventStatus;
  createdAt: string;
}

export function createCognitiveEvent(input: Omit<CognitiveEvent, "id" | "createdAt">): CognitiveEvent {
  return {
    ...input,
    id: `ce_${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
}

export function requiresHumanDeliberation(event: CognitiveEvent): boolean {
  return (
    event.type === "evidence_conflict" ||
    event.type === "strategic_uncertainty"
  );
}
