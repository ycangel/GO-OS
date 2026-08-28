#!/usr/bin/env python3
"""Dependency-free consistency checks for the GO OS v0.5.0 release baseline."""

from __future__ import annotations

import json
import re
import subprocess
import sys
from pathlib import Path
from urllib.parse import unquote


ROOT = Path(__file__).resolve().parents[1]
RELEASE = "0.5.0"
REQUIRED_ENTRY_DOCS = (
    "docs/INDEX.md",
    "docs/DEPLOYMENT_STATUS.md",
    "docs/QUICK_START.md",
    "docs/ARCHITECTURE_OVERVIEW.md",
    "docs/ECOSYSTEM_AND_GOVERNANCE_BOUNDARY.md",
    "docs/WHITEPAPER.md",
    "docs/RELEASE_NOTES_v0.5.0.md",
    "docs/MIGRATION_AND_DEPRECATION_v0.5.0.md",
    "docs/EVALUATION_AND_RED_TEAM_v0.5.0.md",
)
CORE_OBJECTS = (
    "Mission",
    "AuthorityGrant",
    "Evidence",
    "CognitiveEvent",
    "DeliberationSession",
    "LearningRecord",
    "EvolutionProposal",
    "CognitiveVersion",
)
MARKDOWN_LINK = re.compile(r"!?(?:\[[^\]]*\])\(([^)]+)\)")


def rel(path: Path) -> str:
    return path.relative_to(ROOT).as_posix()


def read(path: str | Path) -> str:
    value = Path(path)
    if not value.is_absolute():
        value = ROOT / value
    return value.read_text(encoding="utf-8")


def parse_json(path: str | Path, failures: list[str]) -> dict | None:
    value = Path(path)
    if not value.is_absolute():
        value = ROOT / value
    try:
        parsed = json.loads(value.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as error:
        failures.append(f"{rel(value)}: invalid JSON: {error}")
        return None
    if not isinstance(parsed, dict):
        failures.append(f"{rel(value)}: JSON top level must be an object")
        return None
    return parsed


def local_markdown_target(source: Path, raw: str) -> Path | None:
    target = raw.strip()
    if target.startswith("<") and target.endswith(">"):
        target = target[1:-1]
    target = target.split(maxsplit=1)[0]
    target = target.split("#", 1)[0]
    if not target or re.match(r"^(?:https?:|mailto:|chatgpt-conversation:)", target):
        return None
    target = unquote(target)
    if target.startswith("/"):
        return ROOT / target.lstrip("/")
    return (source.parent / target).resolve()


def tracked_files(failures: list[str]) -> list[Path]:
    try:
        result = subprocess.run(
            ["git", "ls-files"],
            cwd=ROOT,
            check=True,
            capture_output=True,
            text=True,
        )
    except (OSError, subprocess.CalledProcessError) as error:
        failures.append(f"unable to inspect tracked files: {error}")
        return []
    return [ROOT / line for line in result.stdout.splitlines() if line]


def main() -> int:
    failures: list[str] = []
    warnings: list[str] = []

    version = read("VERSION").strip()
    if version != RELEASE:
        failures.append(f"VERSION: expected {RELEASE}, got {version!r}")

    for required in (
        "README.md",
        "README.zh-CN.md",
        "CHANGELOG.md",
        "CONTRIBUTING.md",
        "AUTHORS.md",
        *REQUIRED_ENTRY_DOCS,
        "schemas/README.md",
        "schemas/v0.5/manifest.json",
        "skills/README.md",
        "skills/manifest-v0.5.0.yaml",
        "tests/README.md",
        "tests/manifest-v0.5.0.yaml",
        "web/README.md",
    ):
        if not (ROOT / required).exists():
            failures.append(f"missing release artifact: {required}")

    manifest = parse_json("schemas/v0.5/manifest.json", failures)
    if manifest:
        if manifest.get("release") != RELEASE:
            failures.append("schemas/v0.5/manifest.json: release mismatch")
        names = [
            item.get("object")
            for item in manifest.get("core_runtime_objects", [])
            if isinstance(item, dict)
        ]
        if names != list(CORE_OBJECTS):
            failures.append("schemas/v0.5/manifest.json: frozen core inventory mismatch")
        if manifest.get("release_name_zh") != "奠基版本":
            failures.append("schemas/v0.5/manifest.json: Chinese release name mismatch")
        if manifest.get("legal_entity_implied") is not False:
            failures.append("schemas/v0.5/manifest.json: legal entity boundary missing")

    package = parse_json("web/package.json", failures)
    lock = parse_json("web/package-lock.json", failures)
    if package:
        if package.get("name") != "go-society" or package.get("version") != RELEASE:
            failures.append("web/package.json: expected go-society 0.5.0")
        if package.get("dependencies", {}).get("zod") != "4.4.3":
            failures.append("web/package.json: directly imported zod must be a direct dependency")
    if lock:
        root_package = lock.get("packages", {}).get("", {})
        for label, entry in (("lock root", lock), ("lock package", root_package)):
            if entry.get("name") != "go-society" or entry.get("version") != RELEASE:
                failures.append(f"web/package-lock.json: {label} metadata mismatch")

    json_count = 0
    for path in sorted((ROOT / "schemas").rglob("*.json")):
        json_count += 1
        parse_json(path, failures)

    markdown_files = [
        path
        for path in ROOT.rglob("*.md")
        if ".git" not in path.parts and "node_modules" not in path.parts
    ]
    link_count = 0
    for path in sorted(markdown_files):
        body = path.read_text(encoding="utf-8")
        for raw in MARKDOWN_LINK.findall(body):
            target = local_markdown_target(path, raw)
            if target is None:
                continue
            link_count += 1
            if not target.exists():
                failures.append(f"{rel(path)}: broken local link {raw}")

    all_text = "\n".join(path.read_text(encoding="utf-8") for path in markdown_files)
    if "基金会版本" in all_text:
        failures.append("中文释放名不得使用“基金会版本”，应使用“奠基版本”")

    readmes = read("README.md") + read("README.zh-CN.md")
    for required in REQUIRED_ENTRY_DOCS:
        if required not in readmes:
            failures.append(f"root READMEs do not navigate to {required}")

    web_actions = read("web/db/authority-grants.ts")
    for action in (
        "create_evidence",
        "create_exception",
        "create_evolution_proposal",
        "update_mission",
    ):
        if f'"{action}"' not in web_actions:
            failures.append(f"web authority vocabulary missing {action}")
    for legacy in ("record_evidence", "raise_exception", "propose_evolution", "modify_mission"):
        if f'"{legacy}"' in web_actions:
            failures.append(f"web runtime still uses legacy authority action {legacy}")

    route_actions = {
        "web/app/api/field-records/route.ts": "create_evidence",
        "web/app/api/exception/route.ts": "create_exception",
        "web/app/api/evolutions/route.ts": "create_evolution_proposal",
    }
    for route, action in route_actions.items():
        body = read(route)
        if "requireOrganizationalMutation" not in body or f'"{action}"' not in body:
            failures.append(f"{route}: missing canonical constitutional mutation check")

    tracked = tracked_files(failures)
    forbidden_names = {".env", ".env.local", ".env.production", "credentials.json"}
    for path in tracked:
        if path.name in forbidden_names or path.suffix in {".pem", ".p12", ".key"}:
            failures.append(f"tracked credential-like file: {rel(path)}")

    if not (ROOT / ".git").exists():
        warnings.append(".git not available; tracked-file checks may be incomplete")

    if failures:
        print(f"FAIL: {len(failures)} release consistency issue(s):", file=sys.stderr)
        for failure in failures:
            print(f"- {failure}", file=sys.stderr)
        for warning in warnings:
            print(f"WARNING: {warning}", file=sys.stderr)
        return 1

    print(
        "PASS: GO OS v0.5.0 release baseline is internally consistent "
        f"({json_count} JSON files, {len(markdown_files)} Markdown files, "
        f"{link_count} local links)."
    )
    for warning in warnings:
        print(f"WARNING: {warning}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
