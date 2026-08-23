#!/usr/bin/env python3
"""Validate GO OS JSON Schemas against their declared meta-schema."""

from __future__ import annotations

import json
import subprocess
import sys
from copy import deepcopy
from pathlib import Path

try:
    from jsonschema import FormatChecker
    from jsonschema.validators import validator_for
except ImportError:
    print(
        "ERROR: Python package 'jsonschema' is required; install jsonschema>=4.",
        file=sys.stderr,
    )
    raise SystemExit(2)


ROOT = Path(__file__).resolve().parents[1]
SCHEMA_ROOT = ROOT / "schemas"
EXPECTED_DRAFT = "https://json-schema.org/draft/2020-12/schema"

RUBY_YAML_TO_JSON = r'''
require "date"
require "json"
require "yaml"
document = YAML.safe_load(
  File.read(ARGV.fetch(0), encoding: "UTF-8"),
  permitted_classes: [Date, Time],
  aliases: false
)
puts JSON.generate(document)
'''


def load_v050_schema(name: str) -> dict:
    path = SCHEMA_ROOT / "v0.5" / name
    return json.loads(path.read_text(encoding="utf-8"))


def schema_validator(name: str):
    schema = load_v050_schema(name)
    validator_class = validator_for(schema)
    return validator_class(schema, format_checker=FormatChecker())


def check_invariant_probes(failures: list[str]) -> int:
    """Exercise constitutional constraints that meta-schema checks cannot prove."""

    probes = 0

    def expect_valid(name: str, validator, instance: dict) -> None:
        nonlocal probes
        probes += 1
        errors = list(validator.iter_errors(instance))
        if errors:
            failures.append(f"invariant {name}: expected valid, got {errors[0].message}")

    def expect_invalid(name: str, validator, instance: dict) -> None:
        nonlocal probes
        probes += 1
        if not list(validator.iter_errors(instance)):
            failures.append(f"invariant {name}: expected schema rejection")

    authority = {
        "id": "authority-probe",
        "grantor": "role:owner",
        "grantee": "agent:runtime",
        "grantee_type": "agent",
        "accountable_human": "role:owner",
        "scope": "Record bounded evidence.",
        "allowed_actions": ["create_evidence"],
        "prohibited_actions": ["custom:expand_own_authority"],
        "limits": {"aggregate_writes": 10},
        "reversibility_ceiling": "reversible_only",
        "evidence_obligations": ["Record provenance."],
        "escalation": ["Escalate on a guardrail breach."],
        "revocation": {
            "revocable": True,
            "revoked_by": ["role:owner"],
            "conditions": ["Guardrail breach."],
        },
        "self_expansion_allowed": False,
    }
    authority_validator = schema_validator("authority-grant.schema.json")
    expect_valid("authority canonical action", authority_validator, authority)
    invalid = deepcopy(authority)
    invalid["self_expansion_allowed"] = True
    expect_invalid("authority self expansion", authority_validator, invalid)
    invalid = deepcopy(authority)
    invalid["allowed_actions"] = ["record_evidence"]
    expect_invalid("authority legacy alias is non-canonical", authority_validator, invalid)
    invalid = deepcopy(authority)
    invalid["allowed_actions"] = ["approve_evolution_proposal"]
    expect_invalid("agent cannot approve evolution proposal", authority_validator, invalid)

    mission = {
        "id": "mission-probe",
        "version": "0.5.0",
        "status": "active",
        "purpose": "Test a bounded intervention.",
        "current_state": "Baseline recorded.",
        "desired_state": "Target outcome independently verified.",
        "accountable_human": "role:owner",
        "authority_ref": "authority:probe",
        "success_evidence_refs": ["evidence:success"],
        "disconfirming_evidence_refs": ["evidence:disconfirming"],
        "constraints": ["Stay inside the operating envelope."],
        "assumptions": ["The intervention can affect the outcome."],
        "reversibility": "reversible",
        "risk_class": "medium",
        "recompile_when": ["A core assumption is contradicted."],
        "terminate_when": ["A material guardrail is breached."],
        "created_at": "2026-08-23T00:00:00Z",
    }
    mission_validator = schema_validator("mission.schema.json")
    expect_valid("mission falsifiability", mission_validator, mission)
    invalid = deepcopy(mission)
    invalid["disconfirming_evidence_refs"] = []
    expect_invalid("mission missing disconfirming evidence", mission_validator, invalid)

    evidence = {
        "id": "evidence-probe",
        "claim_ref": "claim:probe",
        "claim_type": "observed_fact",
        "observation": "A bounded observation.",
        "source": "system:probe",
        "provenance": "record:probe",
        "observed_at": "2026-08-23T00:00:00Z",
        "confidence": 0.8,
        "quality": {
            "freshness": "current",
            "fidelity": "direct",
            "independence": "independent",
        },
        "validation_status": "unverified",
    }
    evidence_validator = schema_validator("evidence.schema.json")
    expect_valid("evidence provenance", evidence_validator, evidence)
    invalid = deepcopy(evidence)
    invalid["provenance"] = ""
    expect_invalid("evidence missing provenance", evidence_validator, invalid)
    invalid = deepcopy(evidence)
    invalid["confidence"] = 90
    expect_invalid("evidence confidence scale", evidence_validator, invalid)

    event = {
        "id": "event-probe",
        "type": "evidence_conflict",
        "trigger": "Two observations conflict.",
        "context": {"mission_ref": "mission:probe"},
        "questions": ["Which interpretation survives review?"],
        "expected_decision": "Retain, revise, or reject the belief.",
        "accountable_human": "role:owner",
        "human_review_required": True,
        "status": "open",
        "created_at": "2026-08-23T00:00:00Z",
    }
    event_validator = schema_validator("cognitive-event.schema.json")
    expect_valid("cognitive event review", event_validator, event)
    invalid = deepcopy(event)
    invalid["human_review_required"] = False
    expect_invalid("evidence conflict human review", event_validator, invalid)

    deliberation = {
        "id": "deliberation-probe",
        "cognitive_event_ref": "event:probe",
        "participants": {"humans": ["role:owner"], "agents": ["agent:analysis"]},
        "hypotheses": ["Hypothesis A", "Hypothesis B"],
        "evidence_refs": ["evidence:probe"],
        "arguments": ["The evidence remains incomplete."],
        "accountable_human": "role:owner",
        "decision": {"summary": "Run another test.", "decision_owner": "role:owner"},
        "status": "resolved",
        "created_at": "2026-08-23T00:00:00Z",
        "resolved_at": "2026-08-23T01:00:00Z",
    }
    deliberation_validator = schema_validator("deliberation-session.schema.json")
    expect_valid("resolved deliberation owner", deliberation_validator, deliberation)
    invalid = deepcopy(deliberation)
    invalid["decision"] = None
    expect_invalid("resolved deliberation missing decision", deliberation_validator, invalid)

    proposal = {
        "id": "proposal-probe",
        "source_learning_ref": "learning:probe",
        "target": "policy:probe",
        "change_type": "policy",
        "current_state": "Current policy.",
        "proposed_state": "Proposed policy.",
        "rationale": "Evidence indicates a correctable gap.",
        "evidence_refs": ["evidence:probe"],
        "disconfirming_conditions": ["A controlled retest shows no gap."],
        "risk_class": "medium",
        "reversibility": "reversible",
        "authority_ref": "authority:policy-owner",
        "accountable_human": "role:policy-owner",
        "is_candidate": True,
        "approval_status": "pending_human_review",
        "created_at": "2026-08-23T00:00:00Z",
    }
    proposal_validator = schema_validator("evolution-proposal.schema.json")
    expect_valid("candidate evolution proposal", proposal_validator, proposal)
    invalid = deepcopy(proposal)
    invalid["is_candidate"] = False
    expect_invalid("evolution proposal candidate boundary", proposal_validator, invalid)
    invalid = deepcopy(proposal)
    invalid["approval_status"] = "approved"
    expect_invalid("approved proposal requires decision owner", proposal_validator, invalid)
    approved = deepcopy(proposal)
    approved.update(
        {
            "approval_status": "approved",
            "decision_owner": "role:policy-owner",
            "decision_owner_type": "human",
            "decision_rationale": "The named policy owner accepts the bounded change.",
            "decided_at": "2026-08-23T00:30:00Z",
        }
    )
    expect_valid("human-approved evolution proposal", proposal_validator, approved)
    invalid = deepcopy(approved)
    invalid["decision_owner_type"] = "agent"
    expect_invalid("agent cannot approve evolution proposal", proposal_validator, invalid)

    learning = {
        "id": "learning-probe",
        "source_type": "deliberation",
        "source_ref": "deliberation:probe",
        "learning_statement": "The pattern is plausible and requires replication.",
        "claim_type": "hypothesis",
        "evidence_refs": ["evidence:probe"],
        "validation_status": "candidate",
        "accountable_human": "role:owner",
        "created_at": "2026-08-23T00:00:00Z",
    }
    learning_validator = schema_validator("learning-record.schema.json")
    expect_valid("learning record traceability", learning_validator, learning)
    invalid = deepcopy(learning)
    invalid["evidence_refs"] = []
    expect_invalid("learning record missing evidence", learning_validator, invalid)

    commit = {
        "id": "commit-probe",
        "trigger": "An authorized proposal was approved.",
        "previous_version_ref": "cognitive-version:1",
        "new_version_ref": "cognitive-version:2",
        "evidence_refs": ["evidence:probe"],
        "deliberation_refs": ["deliberation:probe"],
        "decision_owner": "role:owner",
        "decision_owner_type": "human",
        "summary": "Updated one supported belief.",
        "created_at": "2026-08-23T00:00:00Z",
    }
    commit_validator = schema_validator("cognitive-commit.schema.json")
    expect_valid("cognitive commit traceability", commit_validator, commit)
    invalid = deepcopy(commit)
    invalid["evidence_refs"] = []
    expect_invalid("cognitive commit evidence", commit_validator, invalid)
    invalid = deepcopy(commit)
    invalid["decision_owner_type"] = "agent"
    expect_invalid("cognitive commit human decision owner", commit_validator, invalid)

    version = {
        "id": "cognitive-version-probe",
        "version": "2",
        "status": "ratified",
        "previous_version_ref": "cognitive-version:1",
        "beliefs": [
            {
                "statement": "The intervention remains a hypothesis.",
                "validation_status": "supported",
                "evidence_refs": ["evidence:probe"],
            }
        ],
        "assumptions": ["External factors remain possible."],
        "decisions": [
            {"summary": "Run an independent replication.", "decision_owner": "role:owner"}
        ],
        "reasoning_patterns": ["Separate causal claims from correlations."],
        "open_questions": ["Will the effect replicate?"],
        "evidence_refs": ["evidence:probe"],
        "learning_record_refs": ["learning:probe"],
        "commit_ref": "commit:probe",
        "created_at": "2026-08-23T00:00:00Z",
    }
    version_validator = schema_validator("cognitive-version.schema.json")
    expect_valid("cognitive version provenance", version_validator, version)
    invalid = deepcopy(version)
    invalid["commit_ref"] = ""
    expect_invalid("cognitive version missing commit", version_validator, invalid)

    exception = {
        "id": "exception-probe",
        "mission_ref": "mission:probe",
        "detected_at": "2026-08-23T00:00:00Z",
        "condition": "The operating envelope was approached.",
        "severity": "medium",
        "authority_status": "near_limit",
        "disposition": "escalate",
        "recurrence_count": 1,
        "structural_review_required": False,
    }
    exception_validator = schema_validator("exception.schema.json")
    expect_valid("exception recurrence", exception_validator, exception)
    invalid = deepcopy(exception)
    invalid["recurrence_count"] = 0
    expect_invalid("exception recurrence minimum", exception_validator, invalid)

    return probes


def check_reference_example(failures: list[str]) -> int:
    """Validate every present v0.5 object in the canonical YAML example."""

    example_path = SCHEMA_ROOT / "examples" / "cognitive-loop-v0.5.0.yaml"
    try:
        result = subprocess.run(
            ["ruby", "-e", RUBY_YAML_TO_JSON, str(example_path)],
            check=True,
            capture_output=True,
            text=True,
        )
        example = json.loads(result.stdout)
    except (OSError, subprocess.CalledProcessError, json.JSONDecodeError) as error:
        failures.append(f"reference example could not be parsed through Ruby YAML: {error}")
        return 0

    schema_map = {
        "mission": "mission.schema.json",
        "authority_grant": "authority-grant.schema.json",
        "evidence": "evidence.schema.json",
        "cognitive_event": "cognitive-event.schema.json",
        "deliberation_session": "deliberation-session.schema.json",
        "learning_record": "learning-record.schema.json",
        "evolution_proposal": "evolution-proposal.schema.json",
        "cognitive_commit": "cognitive-commit.schema.json",
        "cognitive_version": "cognitive-version.schema.json",
    }
    checked = 0
    for key, schema_name in schema_map.items():
        if key not in example:
            continue
        checked += 1
        errors = sorted(
            schema_validator(schema_name).iter_errors(example[key]),
            key=lambda item: list(item.path),
        )
        if errors:
            location = ".".join(str(part) for part in errors[0].path) or "<root>"
            failures.append(
                f"schemas/examples/cognitive-loop-v0.5.0.yaml: {key}.{location}: "
                f"{errors[0].message}"
            )

    return checked


def main() -> int:
    failures: list[str] = []
    identifiers: dict[str, Path] = {}
    schema_paths = sorted(SCHEMA_ROOT.rglob("*.schema.json"))

    for path in schema_paths:
        relative = path.relative_to(ROOT)
        try:
            schema = json.loads(path.read_text(encoding="utf-8"))
        except json.JSONDecodeError as error:
            failures.append(f"{relative}: invalid JSON: {error}")
            continue

        try:
            validator_class = validator_for(schema)
            validator_class.check_schema(schema)
        except Exception as error:  # jsonschema exposes validator-specific errors.
            failures.append(f"{relative}: invalid JSON Schema: {error}")

        if schema.get("$schema") != EXPECTED_DRAFT:
            failures.append(f"{relative}: expected JSON Schema Draft 2020-12")

        identifier = schema.get("$id")
        if not isinstance(identifier, str) or not identifier:
            failures.append(f"{relative}: missing non-empty $id")
        elif identifier in identifiers:
            failures.append(
                f"{relative}: duplicate $id also used by {identifiers[identifier].relative_to(ROOT)}"
            )
        else:
            identifiers[identifier] = path

        if not isinstance(schema.get("version"), str):
            failures.append(f"{relative}: version must be a string")

    probe_count = check_invariant_probes(failures)
    example_count = check_reference_example(failures)

    if failures:
        print(f"FAIL: {len(failures)} JSON Schema issue(s):", file=sys.stderr)
        for failure in failures:
            print(f"- {failure}", file=sys.stderr)
        return 1

    print(
        f"PASS: {len(schema_paths)} JSON Schemas conform to Draft 2020-12 metadata; "
        f"{probe_count} v0.5 invariant probes behaved as expected; "
        f"{example_count} reference objects validate."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
