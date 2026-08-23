import { requireAuthority } from "./authority-guard";

export type RuntimeMutationAction =
  | "create_evidence"
  | "create_exception"
  | "create_evolution_proposal"
  | "update_mission"
  | "custom:manage_membership";

const mutationContext: Record<
  RuntimeMutationAction,
  {
    resourceRisk: "low" | "medium" | "high";
    resourceExposure: number;
    reversibility:
      | "reversible_only"
      | "costly_to_reverse_allowed"
      | "irreversible_allowed";
  }
> = {
  create_evidence: {
    resourceRisk: "low",
    resourceExposure: 1,
    reversibility: "reversible_only",
  },
  create_exception: {
    resourceRisk: "low",
    resourceExposure: 1,
    reversibility: "reversible_only",
  },
  create_evolution_proposal: {
    resourceRisk: "medium",
    resourceExposure: 1,
    reversibility: "reversible_only",
  },
  update_mission: {
    resourceRisk: "high",
    resourceExposure: 1,
    reversibility: "costly_to_reverse_allowed",
  },
  "custom:manage_membership": {
    resourceRisk: "high",
    resourceExposure: 1,
    reversibility: "reversible_only",
  },
};

export async function requireOrganizationalMutation(
  actor: string,
  action: RuntimeMutationAction,
  target: string,
  metadata?: Record<string, unknown>,
) {
  const context = mutationContext[action];
  return requireAuthority({
    actor,
    action,
    target,
    resourceRisk: context.resourceRisk,
    resourceExposure: context.resourceExposure,
    tool: "web-runtime",
    reversibility: context.reversibility,
    requestedBy: "runtime-api",
    metadata,
  });
}
