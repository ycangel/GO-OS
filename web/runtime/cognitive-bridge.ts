import { z } from "zod";

export const candidateObjectTypes = [
  "CognitiveEvent",
  "DeliberationSession",
  "LearningRecord",
  "EvolutionProposal",
] as const;

export type CandidateObjectType = (typeof candidateObjectTypes)[number];

const referenceList = z.array(z.string().trim().min(1).max(240)).max(80);
const dateTime = z
  .string()
  .max(48)
  .refine((value) => Number.isFinite(Date.parse(value)), "Invalid date-time");

export const checkpointRequestSchema = z
  .object({
    idempotencyKey: z.string().trim().min(8).max(180),
    missionId: z.number().int().positive(),
    expectedCursor: z.number().int().nonnegative(),
    source: z.object({
      interface: z
        .string()
        .trim()
        .min(1)
        .max(80)
        .regex(/^[a-z0-9][a-z0-9_.:-]*$/),
      threadKey: z.string().trim().min(1).max(240),
      title: z.string().trim().min(1).max(180),
      captureMode: z.literal("selected_checkpoint").default("selected_checkpoint"),
      consentConfirmed: z.literal(true),
    }),
    fragments: z
      .array(
        z.object({
          clientRef: z.string().trim().min(1).max(80),
          sourceTurnRef: z.string().trim().min(1).max(180),
          speakerType: z.enum(["human", "agent", "system"]),
          speakerRef: z.string().trim().max(120).optional(),
          verbatimText: z.string().min(1).max(12_000),
          contentKind: z.enum([
            "narrative",
            "principle",
            "claim",
            "evidence",
            "decision",
            "question",
          ]),
          provenanceTrust: z.enum([
            "model_reported",
            "user_confirmed",
          ]),
          occurredAt: dateTime.optional(),
        }),
      )
      .min(1)
      .max(24),
    candidates: z
      .array(
        z.object({
          clientRef: z.string().trim().min(1).max(80),
          objectType: z.enum(candidateObjectTypes),
          payload: z.record(z.string(), z.unknown()),
          sourceFragmentRefs: z
            .array(z.string().trim().min(1).max(80))
            .max(24)
            .default([]),
        }),
      )
      .min(1)
      .max(12),
  })
  .refine(
    (value) =>
      value.candidates.every(
        (candidate) =>
          candidate.sourceFragmentRefs.length > 0 || value.fragments.length > 0,
      ),
    "Every cognitive candidate needs at least one private source anchor.",
  );

export const ratificationRequestSchema = z
  .object({
    idempotencyKey: z.string().trim().min(8).max(180),
    missionId: z.number().int().positive(),
    candidateIds: z.array(z.string().trim().min(1).max(180)).min(1).max(20),
    candidateHashes: z.record(
      z.string().trim().min(1).max(180),
      z.string().regex(/^[a-f0-9]{64}$/),
    ),
    expectedRevision: z.number().int().nonnegative(),
    decision: z.enum(["ratify", "reject"]),
    rationale: z.string().trim().min(1).max(2_000),
  })
  .refine(
    (value) => new Set(value.candidateIds).size === value.candidateIds.length,
    "Candidate IDs must be unique.",
  );

export type CheckpointRequest = z.infer<typeof checkpointRequestSchema>;
export type RatificationRequest = z.infer<typeof ratificationRequestSchema>;

export class CognitiveBridgeValidationError extends Error {}

export function assertBoundedJson(
  value: unknown,
  maxDepth = 10,
  maxNodes = 5_000,
): void {
  const stack: Array<{ value: unknown; depth: number }> = [
    { value, depth: 0 },
  ];
  let nodes = 0;
  while (stack.length) {
    const current = stack.pop()!;
    nodes += 1;
    if (nodes > maxNodes || current.depth > maxDepth) {
      throw new CognitiveBridgeValidationError(
        "The cognitive payload is too deeply nested or complex.",
      );
    }
    if (Array.isArray(current.value)) {
      for (const item of current.value) {
        stack.push({ value: item, depth: current.depth + 1 });
      }
    } else if (current.value && typeof current.value === "object") {
      for (const item of Object.values(current.value as Record<string, unknown>)) {
        stack.push({ value: item, depth: current.depth + 1 });
      }
    }
  }
}

export function stableStringify(value: unknown): string {
  return JSON.stringify(sortValue(value));
}

export async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

export async function hmacSha256(secret: string, value: string): Promise<string> {
  if (secret.length < 32) {
    throw new CognitiveBridgeValidationError(
      "The private thread binding secret is unavailable.",
    );
  }
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(value),
  );
  return Array.from(new Uint8Array(signature), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

export async function deterministicPrivateId(
  prefix: string,
  ...parts: string[]
): Promise<string> {
  return `${prefix}_${(await sha256(parts.join("\u001f"))).slice(0, 32)}`;
}

export function buildCandidateCanonicalPayload(
  objectType: CandidateObjectType,
  raw: Record<string, unknown>,
  objectId: string,
  createdAt: string,
  accountableHuman: string,
  narrativeRefs: string[],
): Record<string, unknown> {
  const evidenceRefs = strings(raw.evidence_refs, "evidence_refs", 80);
  const refs = unique(narrativeRefs);
  const agents = participantAgents(raw.participants);

  if (objectType === "CognitiveEvent") {
    const eventType = requiredEnum(raw.type, "type", [
      "evidence_conflict",
      "exception_pattern",
      "strategic_uncertainty",
      "capability_gap",
    ]);
    const context = boundedContext(raw.context);
    if (!Object.keys(context).length) {
      context.bridge_boundary = "private_cognitive_checkpoint";
    }
    return {
      id: objectId,
      type: eventType,
      trigger: required(raw.trigger, "trigger", 4_000),
      context,
      evidence_refs: evidenceRefs,
      narrative_refs: refs,
      questions: requiredStrings(raw.questions, "questions", 40),
      participants: { humans: [accountableHuman], agents },
      expected_decision: required(
        raw.expected_decision,
        "expected_decision",
        4_000,
      ),
      accountable_human: accountableHuman,
      human_review_required: true,
      status: "open",
      created_at: createdAt,
    };
  }

  if (objectType === "DeliberationSession") {
    if (!evidenceRefs.length) {
      throw new CognitiveBridgeValidationError(
        "DeliberationSession requires at least one Reality Evidence reference; narrative anchors are not Evidence.",
      );
    }
    return {
      id: objectId,
      cognitive_event_ref: required(
        raw.cognitive_event_ref,
        "cognitive_event_ref",
        240,
      ),
      participants: { humans: [accountableHuman], agents },
      hypotheses: requiredStrings(raw.hypotheses, "hypotheses", 40),
      evidence_refs: evidenceRefs,
      narrative_refs: refs,
      arguments: strings(raw.arguments, "arguments", 80),
      alternative_interpretations: strings(
        raw.alternative_interpretations,
        "alternative_interpretations",
        40,
      ),
      open_questions: strings(raw.open_questions, "open_questions", 40),
      accountable_human: accountableHuman,
      decision: null,
      learning_candidate:
        optional(raw.learning_candidate, 6_000) ?? null,
      status: "deliberating",
      created_at: createdAt,
    };
  }

  if (objectType === "LearningRecord") {
    if (!evidenceRefs.length) {
      throw new CognitiveBridgeValidationError(
        "LearningRecord requires at least one Reality Evidence reference; a participant statement alone is not Evidence.",
      );
    }
    return {
      id: objectId,
      source_type: requiredEnum(raw.source_type, "source_type", [
        "deliberation",
        "evidence",
        "exception",
        "mission",
      ]),
      source_ref: required(raw.source_ref, "source_ref", 240),
      learning_statement: required(
        raw.learning_statement,
        "learning_statement",
        6_000,
      ),
      claim_type: requiredEnum(raw.claim_type, "claim_type", [
        "observed_pattern",
        "inference",
        "hypothesis",
        "validated_learning",
      ]),
      changed_belief: optional(raw.changed_belief, 6_000) ?? null,
      capability_impact: optional(raw.capability_impact, 6_000) ?? null,
      reusable_pattern: optional(raw.reusable_pattern, 6_000) ?? null,
      evidence_refs: evidenceRefs,
      narrative_refs: refs,
      counter_evidence_refs: strings(
        raw.counter_evidence_refs,
        "counter_evidence_refs",
        80,
      ),
      validation_status: "candidate",
      accountable_human: accountableHuman,
      created_by: "GO Society Cognitive Bridge",
      created_at: createdAt,
    };
  }

  if (!evidenceRefs.length) {
    throw new CognitiveBridgeValidationError(
      "EvolutionProposal requires at least one Reality Evidence reference; narrative meaning remains a separate source anchor.",
    );
  }
  return {
    id: objectId,
    source_learning_ref: required(
      raw.source_learning_ref,
      "source_learning_ref",
      240,
    ),
    target: required(raw.target, "target", 500),
    change_type: requiredEnum(raw.change_type, "change_type", [
      "mission",
      "authority",
      "policy",
      "capability",
      "architecture",
      "strategy",
      "memory",
      "constitution",
    ]),
    current_state: required(raw.current_state, "current_state", 6_000),
    proposed_state: required(raw.proposed_state, "proposed_state", 6_000),
    rationale: required(raw.rationale, "rationale", 6_000),
    evidence_refs: evidenceRefs,
    narrative_refs: refs,
    counter_evidence_refs: strings(
      raw.counter_evidence_refs,
      "counter_evidence_refs",
      80,
    ),
    disconfirming_conditions: requiredStrings(
      raw.disconfirming_conditions,
      "disconfirming_conditions",
      40,
    ),
    risk_class: requiredEnum(raw.risk_class, "risk_class", [
      "low",
      "medium",
      "high",
      "critical",
    ]),
    reversibility: requiredEnum(raw.reversibility, "reversibility", [
      "reversible",
      "partially_reversible",
      "irreversible",
    ]),
    authority_ref: required(raw.authority_ref, "authority_ref", 240),
    accountable_human: accountableHuman,
    is_candidate: true,
    approval_status: "pending_human_review",
    decision_owner: null,
    decision_owner_type: null,
    decision_rationale: null,
    decided_at: null,
    created_at: createdAt,
  };
}

export function buildRatifiedObjectPayload(
  objectType: CandidateObjectType,
  candidatePayload: Record<string, unknown>,
  ratifiedId: string,
  candidateId: string,
  accountableHuman: string,
  decisionOwner: string,
  rationale: string,
  decidedAt: string,
  referenceMap: Map<string, string> = new Map(),
): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    ...(rewriteObjectReferences(candidatePayload, referenceMap) as Record<
      string,
      unknown
    >),
    id: ratifiedId,
    source_candidate_ref: candidateId,
    accountable_human: accountableHuman,
    ratified_by: decisionOwner,
    ratified_at: decidedAt,
  };

  if (objectType === "CognitiveEvent") {
    payload.status = "resolved";
    payload.resolved_at = decidedAt;
    payload.decision = {
      summary: rationale,
      decision_owner: decisionOwner,
    };
  } else if (objectType === "DeliberationSession") {
    payload.status = "resolved";
    payload.resolved_at = decidedAt;
    payload.decision = {
      summary: rationale,
      decision_owner: decisionOwner,
      rationale,
    };
  } else if (objectType === "EvolutionProposal") {
    payload.approval_status = "approved";
    payload.decision_owner = decisionOwner;
    payload.decision_owner_type = "human";
    payload.decision_rationale = rationale;
    payload.decided_at = decidedAt;
  } else if (objectType === "LearningRecord") {
    payload.validation_status = "observed";
  }

  return payload;
}

export type RatifiedObject = {
  id: string;
  objectType: CandidateObjectType;
  payload: Record<string, unknown>;
};

export function buildCognitiveCommitPayload(input: {
  id: string;
  previousVersionRef: string | null;
  newVersionRef: string;
  evidenceRefs: string[];
  deliberationRefs: string[];
  evolutionProposalRefs: string[];
  decisionOwner: string;
  summary: string;
  createdAt: string;
  candidateRefs: string[];
  narrativeRefs: string[];
}): Record<string, unknown> {
  if (!input.evidenceRefs.length || !input.deliberationRefs.length) {
    throw new CognitiveBridgeValidationError(
      "A CognitiveCommit needs both Reality Evidence and a DeliberationSession.",
    );
  }
  return {
    id: input.id,
    trigger: "Human ratification of a private Cognitive Bridge checkpoint",
    previous_version_ref: input.previousVersionRef,
    new_version_ref: input.newVersionRef,
    evidence_refs: unique(input.evidenceRefs),
    deliberation_refs: unique(input.deliberationRefs),
    evolution_proposal_refs: unique(input.evolutionProposalRefs),
    decision_owner: input.decisionOwner,
    decision_owner_type: "human",
    summary: input.summary,
    created_at: input.createdAt,
    candidate_refs: unique(input.candidateRefs),
    narrative_refs: unique(input.narrativeRefs),
  };
}

export function buildCognitiveVersionPayload(input: {
  id: string;
  missionId: number;
  revision: number;
  previousVersionRef: string | null;
  previousPayload: Record<string, unknown> | null;
  commitRef: string;
  ratifiedObjects: RatifiedObject[];
  accountableHuman: string;
  decisionOwner: string;
  createdAt: string;
  threadRef: string;
  decisionSummary: string;
  candidateRefs: string[];
}): Record<string, unknown> {
  const previous = input.previousPayload ?? {};
  const evidenceRefs = unique([
    ...strings(previous.evidence_refs, "evidence_refs", 200),
    ...input.ratifiedObjects.flatMap((item) =>
      strings(item.payload.evidence_refs, "evidence_refs", 100),
    ),
  ]);
  const narrativeRefs = unique([
    ...strings(previous.narrative_refs, "narrative_refs", 200),
    ...input.ratifiedObjects.flatMap((item) =>
      strings(item.payload.narrative_refs, "narrative_refs", 100),
    ),
  ]);
  const learningRecords = input.ratifiedObjects.filter(
    (item) => item.objectType === "LearningRecord",
  );
  const deliberations = input.ratifiedObjects.filter(
    (item) => item.objectType === "DeliberationSession",
  );
  const evolutionProposals = input.ratifiedObjects.filter(
    (item) => item.objectType === "EvolutionProposal",
  );
  const reasoningPatterns = unique([
    ...strings(previous.reasoning_patterns, "reasoning_patterns", 200),
    ...learningRecords.map((item) =>
      required(item.payload.learning_statement, "learning_statement", 6_000),
    ),
    ...deliberations
      .map((item) => optional(item.payload.learning_candidate, 6_000))
      .filter((item): item is string => Boolean(item)),
  ]);
  const decisions = [
    ...records(previous.decisions),
    {
      summary: input.decisionSummary,
      decision_owner: input.decisionOwner,
      evidence_refs: evidenceRefs,
      candidate_refs: unique(input.candidateRefs),
      commit_ref: input.commitRef,
      decided_at: input.createdAt,
    },
    ...evolutionProposals.map((item) => ({
      summary: required(item.payload.proposed_state, "proposed_state", 6_000),
      decision_owner: input.decisionOwner,
      evidence_refs: strings(item.payload.evidence_refs, "evidence_refs", 100),
      evolution_proposal_ref: item.id,
    })),
  ];
  const openQuestions = unique([
    ...strings(previous.open_questions, "open_questions", 200),
    ...deliberations.flatMap((item) =>
      strings(item.payload.open_questions, "open_questions", 100),
    ),
  ]);

  return {
    id: input.id,
    version: `go-society-cognition/${input.missionId}.${input.revision}`,
    status: "ratified",
    previous_version_ref: input.previousVersionRef,
    beliefs: records(previous.beliefs),
    assumptions: strings(previous.assumptions, "assumptions", 200),
    decisions,
    reasoning_patterns: reasoningPatterns,
    open_questions: openQuestions,
    evidence_refs: evidenceRefs,
    learning_record_refs: unique([
      ...strings(previous.learning_record_refs, "learning_record_refs", 200),
      ...learningRecords.map((item) => item.id),
    ]),
    commit_ref: input.commitRef,
    narrative_refs: narrativeRefs,
    ratified_object_refs: input.ratifiedObjects.map((item) => item.id),
    source_thread_refs: unique([
      ...strings(previous.source_thread_refs, "source_thread_refs", 200),
      input.threadRef,
    ]),
    accountable_human: input.accountableHuman,
    created_at: input.createdAt,
  };
}

export function cognitiveDependencyRefs(
  objectType: CandidateObjectType,
  payload: Record<string, unknown>,
): string[] {
  if (
    objectType === "LearningRecord" &&
    payload.source_type !== "deliberation"
  ) {
    return [];
  }
  const keys = {
    CognitiveEvent: [],
    DeliberationSession: ["cognitive_event_ref"],
    LearningRecord: ["source_ref"],
    EvolutionProposal: ["source_learning_ref"],
  }[objectType];
  return keys
    .map((key) => payload[key])
    .filter((value): value is string => typeof value === "string");
}

function rewriteObjectReferences(value: unknown, references: Map<string, string>): unknown {
  if (typeof value === "string") return references.get(value) ?? value;
  if (Array.isArray(value)) {
    return value.map((item) => rewriteObjectReferences(item, references));
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [
        key,
        rewriteObjectReferences(item, references),
      ]),
    );
  }
  return value;
}

export function objectSummary(
  objectType: CandidateObjectType,
  payload: Record<string, unknown>,
): string {
  const key = {
    CognitiveEvent: "trigger",
    DeliberationSession: "learning_candidate",
    LearningRecord: "learning_statement",
    EvolutionProposal: "proposed_state",
  }[objectType];
  return optional(payload[key], 6_000) ?? objectType;
}

export function collectRefs(
  objects: Array<{ payload: Record<string, unknown> }>,
  key: string,
): string[] {
  return unique(objects.flatMap((item) => strings(item.payload[key], key, 200)));
}

function sortValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, item]) => [key, sortValue(item)]),
    );
  }
  return value;
}

function required(value: unknown, key: string, maxLength: number): string {
  const parsed = z.string().trim().min(1).max(maxLength).safeParse(value);
  if (!parsed.success) {
    throw new CognitiveBridgeValidationError(`${key} is required.`);
  }
  return parsed.data;
}

function optional(value: unknown, maxLength: number): string | undefined {
  if (value == null || value === "") return undefined;
  const parsed = z.string().trim().min(1).max(maxLength).safeParse(value);
  if (!parsed.success) {
    throw new CognitiveBridgeValidationError("A cognitive field is invalid.");
  }
  return parsed.data;
}

function requiredStrings(value: unknown, key: string, maxItems: number): string[] {
  const result = strings(value, key, maxItems);
  if (!result.length) {
    throw new CognitiveBridgeValidationError(`${key} needs at least one item.`);
  }
  return result;
}

function strings(value: unknown, key: string, maxItems: number): string[] {
  if (value == null) return [];
  const parsed = referenceList.max(maxItems).safeParse(value);
  if (!parsed.success) {
    throw new CognitiveBridgeValidationError(`${key} must be a list of strings.`);
  }
  return unique(parsed.data);
}

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return { ...(value as Record<string, unknown>) };
}

function records(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is Record<string, unknown> =>
      Boolean(item) && typeof item === "object" && !Array.isArray(item),
  );
}

function boundedContext(value: unknown): Record<string, unknown> {
  const input = record(value);
  const entries = Object.entries(input);
  if (entries.length > 24) {
    throw new CognitiveBridgeValidationError("context has too many fields.");
  }
  return Object.fromEntries(
    entries.map(([key, item]) => {
      if (!/^[a-z][a-z0-9_.:-]{0,79}$/i.test(key)) {
        throw new CognitiveBridgeValidationError("A context field name is invalid.");
      }
      if (typeof item === "string") return [key, required(item, key, 2_000)];
      if (typeof item === "number" && Number.isFinite(item)) return [key, item];
      if (typeof item === "boolean" || item === null) return [key, item];
      if (Array.isArray(item)) return [key, strings(item, key, 40)];
      throw new CognitiveBridgeValidationError(
        `context.${key} must be a bounded scalar or string list.`,
      );
    }),
  );
}

function requiredEnum<const T extends readonly string[]>(
  value: unknown,
  key: string,
  choices: T,
): T[number] {
  if (typeof value !== "string" || !choices.includes(value)) {
    throw new CognitiveBridgeValidationError(`${key} is invalid.`);
  }
  return value as T[number];
}

function participantAgents(value: unknown): string[] {
  const participants = record(value);
  const agents = strings(participants.agents, "participants.agents", 20);
  return agents.length ? agents : ["GO Society Cognitive Bridge"];
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}
