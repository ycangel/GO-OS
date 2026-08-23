import { requireAuthority, type AuthorityAction } from "./authority-guard";

/**
 * Constitutional mutation boundary.
 *
 * All organizational state changes should pass through this layer before
 * persistence. Authentication identifies an actor; Authority determines
 * whether the actor may change organizational state.
 */
export async function authorizeOrganizationalMutation(input: {
  actor: string;
  action: AuthorityAction;
  target: string;
  metadata?: Record<string, unknown>;
}) {
  return requireAuthority({
    actor: input.actor,
    action: input.action,
    target: input.target,
    metadata: input.metadata,
  });
}

export const mutationActions = {
  createEvidence: "create_evidence",
  createException: "create_exception",
  createEvolutionProposal: "create_evolution_proposal",
  updateMission: "update_mission",
} as const;
