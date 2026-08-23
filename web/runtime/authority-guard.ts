import { and, eq } from "drizzle-orm";
import {
  findUnambiguousActiveGrant,
  hasUnambiguousAuthority,
  parseAuthorityGrant,
  type AuthorityAction,
  type AuthorityCheckRequest,
  type AuthorityGrant,
} from "../db/authority-grants";
import { getDb } from "../db";
import { authorityGrants, missionMemberships } from "../db/schema";

export type { AuthorityAction } from "../db/authority-grants";

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
  const valid = hasUnambiguousAuthority(grants, request);

  return valid
    ? { allowed: true, reason: "Valid authority grant found" }
    : {
        allowed: false,
        reason: "No single unambiguous authority boundary permits this organizational action",
      };
}

/**
 * Resolve current persisted grants and fail closed when authority state cannot
 * be read. Authentication is handled by the caller; this function answers only
 * whether the authenticated actor may perform the organizational mutation.
 */
export async function requireAuthority(
  request: AuthorityCheckRequest,
): Promise<AuthorityDecision> {
  try {
    const db = getDb();
    const rows = await db
      .select()
      .from(authorityGrants)
      .where(eq(authorityGrants.grantee, request.actor));

    const grants = rows.map(parseAuthorityGrant);
    if (grants.some((grant) => grant === null)) {
      return {
        allowed: false,
        reason: "Authority state is malformed; organizational mutation denied",
      };
    }

    const decision = authorize(grants as AuthorityGrant[], request);
    if (!decision.allowed) return decision;

    const grant = findUnambiguousActiveGrant(grants, request.actor);
    if (!grant) {
      return {
        allowed: false,
        reason: "No single active authority grant can be enforced",
      };
    }
    if (grant.resourceRights.missionMembershipRequired === true) {
      const actorMatch = /^member:(\d+)$/.exec(request.actor);
      const targetMatch = /^mission:(\d+)$/.exec(request.target);
      if (!actorMatch || !targetMatch) {
        return {
          allowed: false,
          reason: "Mission-scoped authority requires a member actor and mission target",
        };
      }

      const predicates = [
        eq(missionMemberships.memberId, Number(actorMatch[1])),
        eq(missionMemberships.missionId, Number(targetMatch[1])),
        eq(missionMemberships.status, "active"),
      ];
      if (["create_evidence", "create_exception"].includes(request.action)) {
        predicates.push(eq(missionMemberships.canRecord, true));
      }

      const [membership] = await db
        .select({ id: missionMemberships.id })
        .from(missionMemberships)
        .where(and(...predicates))
        .limit(1);
      if (!membership) {
        return {
          allowed: false,
          reason: "No active mission membership permits this target",
        };
      }
    }

    return decision;
  } catch {
    return {
      allowed: false,
      reason: "Authority state is unavailable; organizational mutation denied",
    };
  }
}

export function isAuthorityAction(value: string): value is AuthorityAction {
  const canonical = [
    "create_evidence",
    "create_exception",
    "create_cognitive_event",
    "create_deliberation_session",
    "create_learning_record",
    "create_evolution_proposal",
    "approve_evolution_proposal",
    "apply_evolution_proposal",
    "create_cognitive_commit",
    "create_cognitive_version",
    "update_mission",
    "execute_action",
  ];
  return canonical.includes(value) || /^custom:[a-z0-9][a-z0-9_:.-]*$/.test(value);
}
