import assert from "node:assert/strict";
import test from "node:test";

import {
  buildCandidateCanonicalPayload,
  buildCognitiveCommitPayload,
  buildCognitiveVersionPayload,
  buildRatifiedObjectPayload,
  CognitiveBridgeValidationError,
  hmacSha256,
  stableStringify,
} from "../runtime/cognitive-bridge.ts";

const createdAt = "2026-08-23T01:00:00.000Z";

test("stable cognitive hashes are independent of object key order", () => {
  assert.equal(
    stableStringify({ beta: 2, alpha: { y: 2, x: 1 } }),
    stableStringify({ alpha: { x: 1, y: 2 }, beta: 2 }),
  );
});

test("private thread bindings are server-keyed rather than plain hashes", async () => {
  const value = "chatgpt:private-thread";
  const left = await hmacSha256("a".repeat(32), value);
  const repeat = await hmacSha256("a".repeat(32), value);
  const right = await hmacSha256("b".repeat(32), value);

  assert.equal(left, repeat);
  assert.notEqual(left, right);
  await assert.rejects(() => hmacSha256("too-short", value));
});

test("narrative source cannot satisfy a deliberation Evidence obligation", () => {
  assert.throws(
    () =>
      buildCandidateCanonicalPayload(
        "DeliberationSession",
        {
          cognitive_event_ref: "ce_001",
          hypotheses: ["A bridge may work."],
          evidence_refs: [],
          arguments: [],
          open_questions: [],
        },
        "ds_001",
        createdAt,
        "Angelo Yu",
        ["cf_narrative_001"],
      ),
    CognitiveBridgeValidationError,
  );
});

test("human ratification creates a new version without rewriting source meaning", () => {
  const candidate = {
    id: "ds_candidate_001",
    cognitive_event_ref: "ce_candidate_001",
    participants: { humans: ["Angelo Yu"], agents: ["OpenAI Codex"] },
    hypotheses: ["Bidirectional continuity is required."],
    evidence_refs: ["evidence:2"],
    narrative_refs: ["cf_narrative_001"],
    arguments: ["The runtime cannot yet reload cognition."],
    open_questions: ["How should future conversations install the bridge?"],
    accountable_human: "Angelo Yu",
    learning_candidate: "Capture now; reload ratified cognition later.",
    status: "deliberating",
    created_at: createdAt,
  };
  const ratifiedPayload = buildRatifiedObjectPayload(
    "DeliberationSession",
    candidate,
    "ds_ratified_001",
    candidate.id,
    "Angelo Yu",
    "Angelo Yu",
    "Proceed with the bounded bridge.",
    createdAt,
  );
  const ratified = [
    {
      id: "ds_ratified_001",
      objectType: "DeliberationSession",
      payload: ratifiedPayload,
    },
  ];
  const commit = buildCognitiveCommitPayload({
    id: "cc_001",
    previousVersionRef: null,
    newVersionRef: "cv_001",
    evidenceRefs: ["evidence:2"],
    deliberationRefs: ["ds_ratified_001"],
    evolutionProposalRefs: [],
    decisionOwner: "Angelo Yu",
    summary: "Proceed with the bounded bridge.",
    createdAt,
    candidateRefs: [candidate.id],
    narrativeRefs: ["cf_narrative_001"],
  });
  const version = buildCognitiveVersionPayload({
    id: "cv_001",
    missionId: 1,
    revision: 1,
    previousVersionRef: null,
    previousPayload: null,
    commitRef: String(commit.id),
    ratifiedObjects: ratified,
    accountableHuman: "Mission owner",
    decisionOwner: "Named reviewer",
    createdAt,
    threadRef: "ct_001",
    decisionSummary: "Proceed with the bounded bridge.",
    candidateRefs: [candidate.id],
  });

  assert.equal(ratifiedPayload.source_candidate_ref, candidate.id);
  assert.deepEqual(ratifiedPayload.narrative_refs, ["cf_narrative_001"]);
  assert.deepEqual(version.evidence_refs, ["evidence:2"]);
  assert.deepEqual(version.narrative_refs, ["cf_narrative_001"]);
  assert.ok(!version.evidence_refs.includes("cf_narrative_001"));
  assert.deepEqual(version.open_questions, [
    "How should future conversations install the bridge?",
  ]);
  assert.deepEqual(version.reasoning_patterns, [
    "Capture now; reload ratified cognition later.",
  ]);
  assert.equal(version.commit_ref, "cc_001");
  assert.equal(version.decisions[0].summary, "Proceed with the bounded bridge.");
  assert.equal(version.decisions[0].decision_owner, "Named reviewer");
  assert.equal(version.accountable_human, "Mission owner");
});

test("ratification rewrites selected candidate dependencies and marks learning observed", () => {
  const references = new Map([
    ["ce_candidate", "ce_ratified"],
    ["ds_candidate", "ds_ratified"],
  ]);
  const deliberation = buildRatifiedObjectPayload(
    "DeliberationSession",
    {
      id: "ds_candidate",
      cognitive_event_ref: "ce_candidate",
      evidence_refs: ["evidence:2"],
      narrative_refs: ["cf_1"],
    },
    "ds_ratified",
    "ds_candidate",
    "Mission owner",
    "Named reviewer",
    "Approve the bounded interpretation.",
    createdAt,
    references,
  );
  const learning = buildRatifiedObjectPayload(
    "LearningRecord",
    {
      id: "lr_candidate",
      source_ref: "ds_candidate",
      validation_status: "candidate",
      evidence_refs: ["evidence:2"],
      narrative_refs: ["cf_1"],
    },
    "lr_ratified",
    "lr_candidate",
    "Mission owner",
    "Named reviewer",
    "Approve as an observed learning, not corroborated truth.",
    createdAt,
    new Map([...references, ["lr_candidate", "lr_ratified"]]),
  );

  assert.equal(deliberation.cognitive_event_ref, "ce_ratified");
  assert.equal(deliberation.accountable_human, "Mission owner");
  assert.equal(deliberation.ratified_by, "Named reviewer");
  assert.equal(learning.source_ref, "ds_ratified");
  assert.equal(learning.validation_status, "observed");
});
