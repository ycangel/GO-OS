export type DeliberationStatus = "open" | "deliberating" | "resolved";

export interface DeliberationSession {
  id: string;
  cognitiveEventId: string;
  participants: {
    humans: string[];
    agents: string[];
  };
  hypotheses: string[];
  arguments: string[];
  evidenceRefs: string[];
  decision?: string;
  learning?: string;
  status: DeliberationStatus;
}

/**
 * Human-AI organizational reasoning loop.
 *
 * Deliberation does not replace human judgment.
 * It creates a structured space where humans and AI can update shared understanding.
 */
export function createDeliberationSession(
  input: Omit<DeliberationSession, "status">,
): DeliberationSession {
  return {
    ...input,
    status: "open",
  };
}
