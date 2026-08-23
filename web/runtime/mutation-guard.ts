import {
  requireOrganizationalMutation,
  type RuntimeMutationAction,
} from "./api-constitutional-guard";

export type OrganizationalMutation = RuntimeMutationAction;

export interface MutationRequest {
  actor: string;
  action: OrganizationalMutation;
  target: string;
  metadata?: Record<string, unknown>;
}

/**
 * Constitutional write boundary.
 *
 * Every future organizational state mutation should pass through this layer.
 * Authentication proves identity; this layer proves organizational authority.
 */
export async function authorizeMutation(request: MutationRequest) {
  return requireOrganizationalMutation(
    request.actor,
    request.action,
    request.target,
    request.metadata,
  );
}
