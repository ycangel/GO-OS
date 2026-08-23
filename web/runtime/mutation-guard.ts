import { requireAuthority } from "./authority-guard";

export type OrganizationalMutation =
  | "create_evidence"
  | "create_exception"
  | "create_evolution_proposal"
  | "update_mission";

export interface MutationRequest {
  actor: string;
  action: OrganizationalMutation;
}

/**
 * Constitutional write boundary.
 *
 * Every future organizational state mutation should pass through this layer.
 * Authentication proves identity; this layer proves organizational authority.
 */
export async function authorizeMutation(request: MutationRequest) {
  return requireAuthority({
    actor: request.actor,
    action: request.action,
  });
}
