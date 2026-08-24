import { z } from "zod";

const canonicalAuthorityActions = [
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
] as const;

export type AuthorityAction =
  | "create_evidence"
  | "create_exception"
  | "create_cognitive_event"
  | "create_deliberation_session"
  | "create_learning_record"
  | "create_evolution_proposal"
  | "approve_evolution_proposal"
  | "apply_evolution_proposal"
  | "create_cognitive_commit"
  | "create_cognitive_version"
  | "update_mission"
  | "execute_action"
  | `custom:${string}`;

export interface AuthorityLimits {
  maxResourceExposure?: number;
  maxRiskClass?: "low" | "medium" | "high";
  allowedTools?: string[];
  toolActionScopes?: Record<string, AuthorityAction[]>;
}

export interface AuthorityResourceRights {
  missionMembershipRequired?: boolean;
  allowedTargets?: string[];
  allowedTargetPrefixes?: string[];
  [key: string]: unknown;
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
  revision: number;
  grantor: string;
  grantee: string;
  accountableHuman: string;
  scope: string;
  allowedActions: AuthorityAction[];
  prohibitedActions: AuthorityAction[];
  resourceRights: AuthorityResourceRights;
  limits: AuthorityLimits;
  reversibilityCeiling:
    | "reversible_only"
    | "costly_to_reverse_allowed"
    | "irreversible_allowed";
  evidenceObligations: string[];
  escalation: string[];
  conflictRules: string[];
  validFrom?: string | null;
  expiresAt?: string | null;
  revokedAt?: string | null;
  selfExpansionAllowed: false;
}

export interface AuthorityCheckRequest {
  actor: string;
  action: AuthorityAction;
  target: string;
  resourceRisk: "low" | "medium" | "high";
  resourceExposure: number;
  tool: string;
  reversibility:
    | "reversible_only"
    | "costly_to_reverse_allowed"
    | "irreversible_allowed";
  requestedBy?: string;
  metadata?: Record<string, unknown>;
}

const authorityActionSchema = z.union([
  z.enum(canonicalAuthorityActions),
  z.string().regex(/^custom:[a-z0-9][a-z0-9_:.-]*$/),
]);

const dateTimeSchema = z
  .string()
  .regex(
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/,
    "Expected an RFC 3339 date-time with timezone",
  )
  .refine((value) => Number.isFinite(Date.parse(value)), "Invalid date-time");

export const authorityGrantSchema = z
  .object({
    id: z.string().min(1),
    revision: z.number().int().positive(),
    grantor: z.string().min(1),
    grantee: z.string().min(1),
    accountableHuman: z.string().min(1),
    scope: z.string().min(1),
    allowedActions: z.array(authorityActionSchema).min(1),
    prohibitedActions: z.array(authorityActionSchema).min(1),
    resourceRights: z
      .object({
        missionMembershipRequired: z.boolean().optional(),
        allowedTargets: z.array(z.string().min(1)).min(1).optional(),
        allowedTargetPrefixes: z.array(z.string().min(1)).min(1).optional(),
      })
      .passthrough()
      .refine(
        (rights) =>
          Boolean(rights.allowedTargets?.length || rights.allowedTargetPrefixes?.length),
        "At least one explicit target or target prefix is required",
      ),
    limits: z
      .object({
        maxResourceExposure: z.number().finite().nonnegative().optional(),
        maxRiskClass: z.enum(["low", "medium", "high"]).optional(),
        allowedTools: z.array(z.string()).optional(),
        toolActionScopes: z
          .record(z.string().min(1), z.array(authorityActionSchema).min(1))
          .optional(),
      })
      .passthrough(),
    reversibilityCeiling: z.enum([
      "reversible_only",
      "costly_to_reverse_allowed",
      "irreversible_allowed",
    ]),
    evidenceObligations: z.array(z.string().min(1)).min(1),
    escalation: z.array(z.string().min(1)).min(1),
    conflictRules: z.array(z.string().min(1)),
    validFrom: dateTimeSchema.nullish(),
    expiresAt: dateTimeSchema.nullish(),
    revokedAt: dateTimeSchema.nullish(),
    selfExpansionAllowed: z.literal(false),
  })
  .passthrough();

export function parseAuthorityGrant(value: unknown): AuthorityGrant | null {
  const result = authorityGrantSchema.safeParse(value);
  return result.success ? (result.data as AuthorityGrant) : null;
}

export function canPerformAction(
  candidate: unknown,
  request: AuthorityCheckRequest,
): boolean {
  const grant = parseAuthorityGrant(candidate);
  if (!grant) return false;
  if (!isGrantActiveForActor(grant, request.actor)) return false;
  if (!grant.allowedActions.includes(request.action)) return false;

  const targetAllowed =
    grant.resourceRights.allowedTargets?.includes(request.target) === true ||
    grant.resourceRights.allowedTargetPrefixes?.some((prefix) =>
      request.target.startsWith(prefix),
    ) === true;
  if (!targetAllowed) return false;

  const riskRank = { low: 0, medium: 1, high: 2 } as const;
  const ceiling = grant.limits.maxRiskClass;
  if (!ceiling || riskRank[request.resourceRisk] > riskRank[ceiling]) {
    return false;
  }

  const exposureCeiling = grant.limits.maxResourceExposure;
  if (
    !Number.isFinite(request.resourceExposure) ||
    request.resourceExposure < 0 ||
    exposureCeiling == null ||
    request.resourceExposure > exposureCeiling
  ) {
    return false;
  }

  if (!grant.limits.allowedTools?.includes(request.tool)) return false;
  if (
    request.tool !== "web-runtime" &&
    !grant.limits.toolActionScopes?.[request.tool]?.includes(request.action)
  ) {
    return false;
  }

  const reversibilityRank = {
    reversible_only: 0,
    costly_to_reverse_allowed: 1,
    irreversible_allowed: 2,
  } as const;
  if (
    reversibilityRank[request.reversibility] >
    reversibilityRank[grant.reversibilityCeiling]
  ) {
    return false;
  }

  return !grant.prohibitedActions.includes(request.action);
}

export function isGrantActiveForActor(
  candidate: unknown,
  actor: string,
  now = Date.now(),
): boolean {
  const grant = parseAuthorityGrant(candidate);
  if (!grant) return false;
  if (grant.grantee !== actor) return false;
  if (grant.revokedAt != null) return false;
  if (grant.selfExpansionAllowed !== false) return false;

  if (grant.validFrom != null) {
    const validFrom = Date.parse(grant.validFrom);
    if (!Number.isFinite(validFrom) || validFrom > now) return false;
  }
  if (grant.expiresAt != null) {
    const expiresAt = Date.parse(grant.expiresAt);
    if (!Number.isFinite(expiresAt) || expiresAt <= now) return false;
  }

  return true;
}

/**
 * The alpha runtime has no safe grant-merging algorithm. Until one exists,
 * more than one active grant for an actor is ambiguous and must fail closed
 * instead of letting any permissive grant win.
 */
export function hasUnambiguousAuthority(
  grants: unknown[],
  request: AuthorityCheckRequest,
): boolean {
  const activeGrant = findUnambiguousActiveGrant(grants, request.actor);
  return activeGrant !== null && canPerformAction(activeGrant, request);
}

export function findUnambiguousActiveGrant(
  grants: unknown[],
  actor: string,
): AuthorityGrant | null {
  const parsedGrants = grants.map(parseAuthorityGrant);
  if (parsedGrants.some((grant) => grant === null)) return null;

  const activeGrants = parsedGrants.filter(
    (grant): grant is AuthorityGrant =>
      grant !== null && isGrantActiveForActor(grant, actor),
  );
  return activeGrants.length === 1 ? activeGrants[0] : null;
}
