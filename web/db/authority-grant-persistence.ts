import type { AuthorityGrant } from "../runtime/authority-runtime";

/**
 * Persistence boundary for Constitutional Runtime authority grants.
 *
 * This adapter intentionally defines the contract before database migration.
 * Runtime actions must depend on this boundary rather than directly coupling
 * themselves to storage implementation details.
 */
export interface AuthorityGrantRepository {
  getActiveGrant(actorId: string, action: string): Promise<AuthorityGrant | null>;
  revokeGrant(grantId: string, reason: string): Promise<void>;
  saveGrant(grant: AuthorityGrant): Promise<void>;
}

export async function requireAuthority(
  repository: AuthorityGrantRepository,
  actorId: string,
  action: string,
): Promise<AuthorityGrant> {
  const grant = await repository.getActiveGrant(actorId, action);

  if (!grant) {
    throw new Error(
      `Authority denied: actor ${actorId} has no valid grant for ${action}`,
    );
  }

  if (!grant.selfExpansionAllowed && action === "modify_authority") {
    throw new Error(
      "Authority denied: actors cannot expand their own authority boundary",
    );
  }

  return grant;
}
