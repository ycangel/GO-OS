import {
  requireOrganizationalMutation,
  type RuntimeMutationAction,
} from "./api-constitutional-guard";

/**
 * Constitutional mutation boundary.
 *
 * All organizational state changes should pass through this layer before
 * persistence. Authentication identifies an actor; Authority determines
 * whether the actor may change organizational state.
 */
export async function authorizeOrganizationalMutation(input: {
  actor: string;
  action: RuntimeMutationAction;
  target: string;
  metadata?: Record<string, unknown>;
}) {
  return requireOrganizationalMutation(
    input.actor,
    input.action,
    input.target,
    input.metadata,
  );
}

export const mutationActions = {
  createEvidence: "create_evidence",
  createException: "create_exception",
  createEvolutionProposal: "create_evolution_proposal",
  updateMission: "update_mission",
  manageMembership: "custom:manage_membership",
} as const;
