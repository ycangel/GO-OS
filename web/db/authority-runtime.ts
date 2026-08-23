import { z } from "zod";

/**
 * GO OS v0.3.1 Authority Runtime foundation.
 *
 * This module defines the runtime boundary for explicit authority.
 * It intentionally starts as a contract layer before wiring database
 * persistence and API enforcement.
 */

export const authorityGrantSchema = z.object({
  grantor: z.string().min(1),
  grantee: z.string().min(1),
  allowedActions: z.array(z.string()).default([]),
  prohibitedActions: z.array(z.string()).default([]),
  limits: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).default({}),
  reversibilityCeiling: z.enum(["reversible", "bounded", "irreversible"]).default("reversible"),
  expiresAt: z.string().nullable().default(null),
  revokedAt: z.string().nullable().default(null),
  selfExpansionAllowed: z.literal(false).default(false),
});

export type AuthorityGrant = z.infer<typeof authorityGrantSchema>;

export function canPerformAction(
  grant: AuthorityGrant,
  action: string,
): boolean {
  if (grant.selfExpansionAllowed !== false) {
    return false;
  }

  if (grant.prohibitedActions.includes(action)) {
    return false;
  }

  if (grant.expiresAt && new Date(grant.expiresAt) < new Date()) {
    return false;
  }

  if (grant.revokedAt) {
    return false;
  }

  return grant.allowedActions.includes(action);
}
