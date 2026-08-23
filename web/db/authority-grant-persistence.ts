import {
  canPerformAction,
  parseAuthorityGrant,
  type AuthorityAction,
  type AuthorityGrant,
} from "./authority-grants";

/**
 * Persistence boundary for Constitutional Runtime authority grants.
 *
 * This adapter intentionally defines the contract before database migration.
 * Runtime actions must depend on this boundary rather than directly coupling
 * themselves to storage implementation details.
 */
export interface AuthorityGrantRepository {
  getActiveGrant(actorId: string, action: AuthorityAction): Promise<unknown | null>;
  revokeGrant(grantId: string, reason: string): Promise<void>;
  saveGrant(grant: AuthorityGrant): Promise<void>;
}

export async function requireAuthority(
  repository: AuthorityGrantRepository,
  actorId: string,
  action: AuthorityAction,
  target: string,
  resourceRisk: "low" | "medium" | "high",
  resourceExposure: number,
  tool: string,
  reversibility:
    | "reversible_only"
    | "costly_to_reverse_allowed"
    | "irreversible_allowed",
): Promise<AuthorityGrant> {
  const candidate = await repository.getActiveGrant(actorId, action);
  const grant = parseAuthorityGrant(candidate);

  if (
    !grant ||
    !canPerformAction(grant, {
      actor: actorId,
      action,
      target,
      resourceRisk,
      resourceExposure,
      tool,
      reversibility,
      requestedBy: "authority-grant-repository",
    })
  ) {
    throw new Error(
      `Authority denied: actor ${actorId} has no valid grant for ${action}`,
    );
  }

  return grant;
}
