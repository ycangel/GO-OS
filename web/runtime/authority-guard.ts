import { canPerformAction, type AuthorityCheckRequest, type AuthorityGrant } from "../db/authority-grants";

export interface AuthorityDecision {
  allowed: boolean;
  reason: string;
}

/**
 * Constitutional runtime guard.
 *
 * Every future write path should call this before changing organizational
 * state. Authentication answers "who are you"; Authority answers "are you
 * allowed to change this organization state".
 */
export function authorize(
  grants: AuthorityGrant[],
  request: AuthorityCheckRequest,
): AuthorityDecision {
  const valid = grants.some((grant) => canPerformAction(grant, request));

  return valid
    ? { allowed: true, reason: "Valid authority grant found" }
    : {
        allowed: false,
        reason: "No valid authority boundary permits this organizational action",
      };
}
