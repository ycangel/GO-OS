export type AuthorityAction =
  | "record_evidence"
  | "raise_exception"
  | "propose_evolution"
  | "modify_mission"
  | "execute_action";

export interface AuthorityLimits {
  maxResourceExposure?: number;
  maxRiskClass?: "low" | "medium" | "high";
  allowedTools?: string[];
}

/**
 * Runtime representation of AuthorityGrant.
 *
 * Human Sovereignty requires every autonomous action to have an explicit
 * authority boundary. This contract is intentionally stricter than a text
 * summary attached to a mission.
 */
export interface AuthorityGrant {
  id: string;
  grantor: string;
  grantee: string;
  allowedActions: AuthorityAction[];
  prohibitedActions: string[];
  limits: AuthorityLimits;
  reversibilityCeiling: "reversible" | "partially_reversible" | "irreversible";
  expiresAt?: string;
  revokedAt?: string;
  selfExpansionAllowed: false;
}

export interface AuthorityCheckRequest {
  actor: string;
  action: AuthorityAction;
  resourceRisk?: "low" | "medium" | "high";
}

export function canPerformAction(
  grant: AuthorityGrant,
  request: AuthorityCheckRequest,
): boolean {
  if (grant.grantee !== request.actor) return false;
  if (grant.revokedAt) return false;
  if (grant.expiresAt && new Date(grant.expiresAt) < new Date()) return false;
  if (grant.selfExpansionAllowed !== false) return false;
  if (!grant.allowedActions.includes(request.action)) return false;

  if (
    request.resourceRisk === "high" &&
    grant.limits.maxRiskClass !== "high"
  ) {
    return false;
  }

  return !grant.prohibitedActions.includes(request.action);
}
