import { requireAuthority } from "./authority-guard";

export type RuntimeMutationAction =
  | "create_evidence"
  | "create_exception"
  | "create_cognitive_event"
  | "create_deliberation_session"
  | "create_learning_record"
  | "create_evolution_proposal"
  | "approve_evolution_proposal"
  | "create_cognitive_commit"
  | "create_cognitive_version"
  | "update_mission"
  | "custom:read_cognitive_context"
  | "custom:capture_cognitive_source"
  | "custom:review_cognition"
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
  create_cognitive_event: {
    resourceRisk: "low",
    resourceExposure: 1,
    reversibility: "reversible_only",
  },
  create_deliberation_session: {
    resourceRisk: "low",
    resourceExposure: 1,
    reversibility: "reversible_only",
  },
  create_learning_record: {
    resourceRisk: "medium",
    resourceExposure: 1,
    reversibility: "reversible_only",
  },
  create_evolution_proposal: {
    resourceRisk: "medium",
    resourceExposure: 1,
    reversibility: "reversible_only",
  },
  approve_evolution_proposal: {
    resourceRisk: "high",
    resourceExposure: 1,
    reversibility: "costly_to_reverse_allowed",
  },
  create_cognitive_commit: {
    resourceRisk: "high",
    resourceExposure: 1,
    reversibility: "costly_to_reverse_allowed",
  },
  create_cognitive_version: {
    resourceRisk: "high",
    resourceExposure: 1,
    reversibility: "costly_to_reverse_allowed",
  },
  update_mission: {
    resourceRisk: "high",
    resourceExposure: 1,
    reversibility: "costly_to_reverse_allowed",
  },
  "custom:read_cognitive_context": {
    resourceRisk: "low",
    resourceExposure: 0,
    reversibility: "reversible_only",
  },
  "custom:capture_cognitive_source": {
    resourceRisk: "low",
    resourceExposure: 1,
    reversibility: "reversible_only",
  },
  "custom:review_cognition": {
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

export function runtimeMutationContext(action: RuntimeMutationAction) {
  return mutationContext[action];
}

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
