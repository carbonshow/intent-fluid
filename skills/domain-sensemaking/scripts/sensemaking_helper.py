#!/usr/bin/env python3
"""Deterministic helpers for the domain-sensemaking skill."""

from __future__ import annotations

import argparse
import csv
import json
import re
import sys
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Any

TOOL_DIR = Path(__file__).resolve().parents[1]
DEFAULT_FEEDBACK_LOG = TOOL_DIR / "logs/feedback.jsonl"
DEFAULT_PROPOSAL_DIR = TOOL_DIR / "evolution/proposals"


FRONTIER_FIELDS = [
    "node",
    "type",
    "exploration_purpose",
    "impact",
    "uncertainty",
    "explorability",
    "cost",
    "priority",
    "status",
]

SOURCES_FIELDS = [
    "source_id",
    "title",
    "url_or_path",
    "source_type",
    "accessed",
    "reliability",
    "linked_round",
    "linked_frontier",
]

REQUIRED_WORKSPACE_FILES = [
    "problem-card.md",
    "reader-brief.md",
    "frontier.csv",
    "sources.csv",
    "relations.csv",
    "claims.csv",
    "contradictions.csv",
    "convergence.csv",
    "visual-map.md",
    "final-synthesis.md",
]

CONVERGENCE_ROWS = [
    "Question is specific enough to answer",
    "Main graph has no critical isolated nodes",
    "Key disagreements can be explained",
    "Important claims have sufficient evidence or explicit uncertainty labels",
    "Decision, explanation, experiment, or action can be derived",
    "New exploration has low marginal value",
]

EXTERNAL_CITATION_RE = re.compile(r"https?://|arxiv\.org|doi\.org", re.IGNORECASE)

FINAL_SECTION_ALIASES = {
    "executive_summary": ["## Executive Summary", "## 执行摘要"],
    "question_evolution": ["## Question Evolution", "## 问题演化"],
    "reasoning_chain": ["## Reasoning Chain", "## 推理链"],
    "core_claims": ["## Core Claims", "## 核心 Claims", "## 核心 claims", "## 核心主张"],
    "answer": ["## Answer", "## 回答", "## 结论"],
}


def normalize_key(value: str) -> str:
    return value.strip().lower().replace(" ", "_").replace("-", "_")


def read_rows(path: Path) -> list[dict[str, Any]]:
    if path.suffix.lower() == ".json":
        data = json.loads(path.read_text(encoding="utf-8"))
        if isinstance(data, dict):
            data = data.get("rows", [])
        if not isinstance(data, list):
            raise ValueError("JSON input must be a list or an object with a rows list.")
        return [{normalize_key(str(k)): v for k, v in row.items()} for row in data]

    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        return [
            {normalize_key(str(k)): v for k, v in row.items() if k is not None}
            for row in reader
        ]


def read_jsonl(path: Path) -> list[dict[str, Any]]:
    if not path.exists():
        return []
    rows = []
    for line_number, line in enumerate(path.read_text(encoding="utf-8").splitlines(), start=1):
        if not line.strip():
            continue
        try:
            value = json.loads(line)
        except json.JSONDecodeError as exc:
            raise ValueError(f"{path}:{line_number} is not valid JSONL.") from exc
        if not isinstance(value, dict):
            raise ValueError(f"{path}:{line_number} must be a JSON object.")
        rows.append(value)
    return rows


def write_csv(rows: list[dict[str, Any]], fields: list[str], path: Path | None) -> None:
    target = path.open("w", encoding="utf-8", newline="") if path else sys.stdout
    close_target = path is not None
    try:
        writer = csv.DictWriter(target, fieldnames=fields, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(rows)
    finally:
        if close_target:
            target.close()


def print_markdown_table(rows: list[dict[str, Any]], fields: list[str]) -> None:
    print("| " + " | ".join(fields) + " |")
    print("|" + "|".join("---" for _ in fields) + "|")
    for row in rows:
        values = [str(row.get(field, "")).replace("\n", " ") for field in fields]
        print("| " + " | ".join(values) + " |")


def is_blank(value: Any) -> bool:
    return str(value or "").strip() == ""


def issue(
    code: str,
    message: str,
    path: Path | str,
    severity: str = "error",
    detail: str = "",
) -> dict[str, str]:
    return {
        "severity": severity,
        "code": code,
        "path": str(path),
        "message": message,
        "detail": detail,
    }


def substantive_text(value: Any, min_chars: int = 20) -> bool:
    text = re.sub(r"\s+", "", str(value or ""))
    return len(text) >= min_chars


def has_any_heading(text: str, headings: list[str]) -> bool:
    return any(heading in text for heading in headings)


def utc_now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def parse_score(value: Any, field: str, row_index: int) -> float:
    try:
        score = float(value)
    except (TypeError, ValueError) as exc:
        raise ValueError(f"Row {row_index}: {field} must be a number.") from exc
    if score < 1 or score > 5:
        raise ValueError(f"Row {row_index}: {field} must be between 1 and 5.")
    return score


# --- init ---


def cmd_init(args: argparse.Namespace) -> int:
    output_dir = Path(args.output)
    output_dir.mkdir(parents=True, exist_ok=True)

    files = {
        "problem-card.md": problem_card(args),
        "reader-brief.md": reader_brief(args),
        "frontier.csv": ",".join(FRONTIER_FIELDS) + "\n",
        "sources.csv": ",".join(SOURCES_FIELDS) + "\n",
        "relations.csv": "a,relation,b,note\n",
        "claims.csv": "claim,supporting_evidence,opposing_evidence,confidence,decision_relevance\n",
        "contradictions.csv": "type,content,likely_cause,next_action,resolution\n",
        "convergence.csv": convergence_csv(),
        "visual-map.md": visual_map(args),
        "final-synthesis.md": final_synthesis(args),
        "rounds/round-01.md": exploration_round(1, args.question, args.question, args.round_focus),
    }

    written: list[str] = []
    for name, content in files.items():
        path = output_dir / name
        if path.exists() and not args.force:
            raise FileExistsError(f"{path} already exists. Use --force to overwrite.")
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content, encoding="utf-8")
        written.append(str(path))

    print("Created domain-sensemaking workspace:")
    for path in written:
        print(f"- {path}")
    return 0


def problem_card(args: argparse.Namespace) -> str:
    return f"""# Problem Card

Initial question: {args.question or ""}
Current reframing:
Mode: {args.mode}
Target output: {args.target_output or ""}

Core uncertainties:
- U1:
- U2:
- U3:

Known facts:
-

Initial hypotheses:
- H1:
- H2:

Constraints:
- Time:
- Data:
- Scope:
- Business/engineering boundary:

Draft convergence criteria:
-
"""


def convergence_csv() -> str:
    lines = ["check,status,evidence"]
    lines.extend(f'"{check}",fail,' for check in CONVERGENCE_ROWS)
    return "\n".join(lines) + "\n"


def reader_brief(args: argparse.Namespace) -> str:
    return f"""# Reader Brief

Primary reader: {args.primary_reader or ""}
Reader goal: {args.reader_goal or ""}
Known territory:
- {args.known_territory or ""}
Needs explanation:
- {args.needs_explanation or ""}
Detail policy: {args.detail_policy}
Format policy:
- Tables:
- Diagrams:
- Lists:
- Prose:
- Appendices or split files:
Citation policy:
-
"""


def final_synthesis(args: argparse.Namespace) -> str:
    return f"""# Final Synthesis

## Reader Profile

- Primary reader: {args.primary_reader or ""}
- Assumed known territory: {args.known_territory or ""}
- Terms explained here: {args.needs_explanation or ""}
- Detail policy: {args.detail_policy}

## Executive Summary

## Initial Question

## Question Evolution

## Reasoning Chain

Explain how the conclusion follows:

1. Key premise:
2. Evidence:
3. Inference:
4. Implication:

## Research Path

Keep this short. Reference `rounds/round-XX.md` for the auditable exploration trail; do not paste raw round history unless it changes the answer.

## Knowledge Graph Summary

For complex structures, include Mermaid directly:

```mermaid
flowchart TD
  InitialQuestion["Initial question"] --> ReframedQuestion["Reframed question"]
  ReframedQuestion --> Evidence["Evidence"]
  Evidence --> Inference["Inference"]
  Inference --> Answer["Answer"]
```

## Core Claims

| Claim | Evidence | Reasoning | Confidence | Implication |
|---|---|---|---|---|

## Key Terms

| Term | Short explanation | Why it matters here |
|---|---|---|

## Contradictions And Unknowns

## Answer

## Next Actions

## Sources And Notes
"""


def visual_map(args: argparse.Namespace) -> str:
    return f"""# Visual Map

Use Mermaid code blocks for complex process, causal, concept, dependency, state, or decision-path visualization.

```mermaid
flowchart TD
  InitialQuestion["Initial question"] --> Frontier["Ranked frontier"]
  Frontier --> R1["Round 01 exploration"]
  R1 --> Sources["Source notes"]
  Sources --> Claims["Claim and evidence updates"]
  Claims --> Reframe["Question reframe"]
  Reframe --> Convergence{{"Converged?"}}
  Convergence -- "No" --> Frontier
  Convergence -- "Yes" --> Synthesis["Reader-calibrated synthesis"]
```

Initial question: {args.question or ""}
"""


def exploration_round(
    round_number: int,
    starting_question: str = "",
    previous_question: str = "",
    focus: str = "",
) -> str:
    label = f"{round_number:02d}"
    return f"""# Exploration Round {label}

Focus: {focus}
Starting question: {starting_question}

## Selected Frontier

| Node | Reason selected | Expected uncertainty reduction |
|---|---|---|

## Evidence Collected

| Source | Claim or observation | Reliability | Effect on confidence |
|---|---|---|---|

## Graph And Claim Updates

- Relations added or revised:
- Claims added or revised:
- Contradictions or gaps added or revised:

## Question Reframe

Previous: {previous_question}
Current:
Why it changed:

## Round Decision

Decision: continue / pivot / deepen / converge
Reason:
Next frontier candidates:
-
"""


# --- new-round ---


def cmd_new_round(args: argparse.Namespace) -> int:
    workspace = Path(args.workspace)
    rounds_dir = workspace / "rounds"
    rounds_dir.mkdir(parents=True, exist_ok=True)

    existing = []
    for path in rounds_dir.glob("round-*.md"):
        match = re.fullmatch(r"round-(\d+)\.md", path.name)
        if match:
            existing.append(int(match.group(1)))

    next_number = args.number or ((max(existing) + 1) if existing else 1)
    target = rounds_dir / f"round-{next_number:02d}.md"
    if target.exists() and not args.force:
        raise FileExistsError(f"{target} already exists. Use --force to overwrite.")

    content = exploration_round(
        next_number,
        args.starting_question,
        args.previous_question,
        args.focus,
    )
    target.write_text(content, encoding="utf-8")
    print(f"Created exploration round: {target}")
    return 0


def next_round_number(rounds_dir: Path) -> int:
    existing = []
    for path in rounds_dir.glob("round-*.md"):
        match = re.fullmatch(r"round-(\d+)\.md", path.name)
        if match:
            existing.append(int(match.group(1)))
    return (max(existing) + 1) if existing else 1


# --- new-source ---


def slugify_source_title(title: str) -> str:
    value = title.strip().lower()
    value = re.sub(r"[^a-z0-9\u4e00-\u9fff]+", "-", value)
    value = value.strip("-")
    return value[:48] or "source"


def next_source_id(notes_dir: Path) -> str:
    existing = []
    for path in notes_dir.glob("source-*.md"):
        match = re.match(r"source-(\d+)", path.stem)
        if match:
            existing.append(int(match.group(1)))
    number = (max(existing) + 1) if existing else 1
    return f"source-{number:03d}"


def source_note(args: argparse.Namespace, source_id: str) -> str:
    citation_target = args.url or args.path or ""
    citation = f"[{args.title}]({citation_target})" if citation_target else args.title
    return f"""# Source Note {source_id}

Title: {args.title}
URL or path: {citation_target}
Source type: {args.source_type}
Accessed: {args.accessed}
Reliability: {args.reliability}

## Why This Source Was Read

Linked frontier nodes: {args.linked_frontier}
Linked round: {args.linked_round}

## Key Contents

-

## Claims Supported

| Claim | Evidence in this source | Confidence effect |
|---|---|---|

## Claims Contradicted Or Complicated

| Claim | Tension or counterevidence | Confidence effect |
|---|---|---|

## Concepts, Methods, Cases, Examples

-

## Reusable Notes

-

## Citation Handle

Use in synthesis as: {citation}
"""


def append_source_index(workspace: Path, row: dict[str, Any]) -> None:
    index_path = workspace / "sources.csv"
    exists = index_path.exists()
    with index_path.open("a", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=SOURCES_FIELDS)
        if not exists:
            writer.writeheader()
        writer.writerow(row)


def cmd_new_source(args: argparse.Namespace) -> int:
    workspace = Path(args.workspace)
    notes_dir = workspace / "source-notes"
    notes_dir.mkdir(parents=True, exist_ok=True)

    source_id = args.source_id or next_source_id(notes_dir)
    slug = slugify_source_title(args.title)
    target = notes_dir / f"{source_id}-{slug}.md"
    if target.exists() and not args.force:
        raise FileExistsError(f"{target} already exists. Use --force to overwrite.")

    target.write_text(source_note(args, source_id), encoding="utf-8")
    append_source_index(
        workspace,
        {
            "source_id": source_id,
            "title": args.title,
            "url_or_path": args.url or args.path or "",
            "source_type": args.source_type,
            "accessed": args.accessed,
            "reliability": args.reliability,
            "linked_round": args.linked_round,
            "linked_frontier": args.linked_frontier,
        },
    )
    print(f"Created source note: {target}")
    return 0


# --- select-frontier ---


def priority_for_row(row: dict[str, Any], row_index: int) -> float:
    priority = row.get("priority")
    if not is_blank(priority):
        try:
            return float(priority)
        except (TypeError, ValueError) as exc:
            raise ValueError(f"Row {row_index}: priority must be a number.") from exc

    impact = parse_score(row.get("impact"), "impact", row_index)
    uncertainty = parse_score(row.get("uncertainty"), "uncertainty", row_index)
    explorability = parse_score(row.get("explorability"), "explorability", row_index)
    cost = parse_score(row.get("cost"), "cost", row_index)
    return round((impact * uncertainty * explorability) / cost, 2)


def selected_frontier_table(rows: list[dict[str, Any]]) -> str:
    lines = ["| Node | Reason selected | Expected uncertainty reduction |", "|---|---|---|"]
    for row in rows:
        purpose = str(row.get("exploration_purpose", "")).strip()
        priority = row.get("priority", "")
        reason = f"priority={priority}"
        if purpose:
            reason += f"; {purpose}"
        lines.append(f"| {row.get('node', '')} | {reason} | {purpose} |")
    return "\n".join(lines)


def exploration_round_with_frontier(
    round_number: int,
    selected_rows: list[dict[str, Any]],
    starting_question: str = "",
    previous_question: str = "",
    focus: str = "",
    override_reason: str = "",
) -> str:
    content = exploration_round(round_number, starting_question, previous_question, focus)
    table = selected_frontier_table(selected_rows)
    if override_reason:
        table += f"\n\nOverride reason: {override_reason}"
    return re.sub(
        r"## Selected Frontier\n\n\| Node \| Reason selected \| Expected uncertainty reduction \|\n\|---\|---\|---\|",
        "## Selected Frontier\n\n" + table,
        content,
    )


def cmd_select_frontier(args: argparse.Namespace) -> int:
    workspace = Path(args.workspace)
    frontier_path = workspace / "frontier.csv"
    rows = read_rows(frontier_path)
    if not rows:
        raise ValueError(f"{frontier_path} has no frontier rows.")

    normalized: list[dict[str, Any]] = []
    for index, row in enumerate(rows, start=1):
        row = dict(row)
        row["priority"] = priority_for_row(row, index)
        normalized.append(row)

    if args.nodes:
        requested = {node.strip() for node in args.nodes.split(",") if node.strip()}
        selected = [row for row in normalized if str(row.get("node", "")).strip() in requested]
        missing = requested - {str(row.get("node", "")).strip() for row in selected}
        if missing:
            raise ValueError(f"Requested frontier node(s) not found: {', '.join(sorted(missing))}")
        top_nodes = {
            str(row.get("node", "")).strip()
            for row in sorted(normalized, key=lambda row: float(row["priority"]), reverse=True)[: len(selected)]
        }
        if requested != top_nodes and not args.override_reason:
            raise ValueError("Manual frontier override requires --override-reason.")
    else:
        selected = sorted(normalized, key=lambda row: float(row["priority"]), reverse=True)[: args.top]

    if not selected:
        raise ValueError("No frontier nodes selected.")

    rounds_dir = workspace / "rounds"
    rounds_dir.mkdir(parents=True, exist_ok=True)
    round_number = args.number or next_round_number(rounds_dir)
    target = rounds_dir / f"round-{round_number:02d}.md"
    if target.exists() and not args.force:
        raise FileExistsError(f"{target} already exists. Use --force to overwrite.")

    content = exploration_round_with_frontier(
        round_number,
        selected,
        args.starting_question,
        args.previous_question,
        args.focus,
        args.override_reason,
    )
    target.write_text(content, encoding="utf-8")

    result = {
        "created_round": str(target),
        "selected": selected,
    }
    if args.format == "json":
        print(json.dumps(result, ensure_ascii=False, indent=2))
    else:
        print(f"Created exploration round: {target}")
        print_markdown_table(selected, FRONTIER_FIELDS)
    return 0


# --- score-frontier ---


def cmd_score_frontier(args: argparse.Namespace) -> int:
    rows = read_rows(Path(args.input))
    scored: list[dict[str, Any]] = []

    for index, row in enumerate(rows, start=1):
        impact = parse_score(row.get("impact"), "impact", index)
        uncertainty = parse_score(row.get("uncertainty"), "uncertainty", index)
        explorability = parse_score(row.get("explorability"), "explorability", index)
        cost = parse_score(row.get("cost"), "cost", index)
        priority = round((impact * uncertainty * explorability) / cost, 2)

        normalized = {
            "node": row.get("node", ""),
            "type": row.get("type", ""),
            "exploration_purpose": row.get("exploration_purpose", ""),
            "impact": int(impact) if impact.is_integer() else impact,
            "uncertainty": int(uncertainty) if uncertainty.is_integer() else uncertainty,
            "explorability": int(explorability) if explorability.is_integer() else explorability,
            "cost": int(cost) if cost.is_integer() else cost,
            "priority": priority,
        }
        scored.append(normalized)

    scored.sort(key=lambda row: float(row["priority"]), reverse=True)
    if args.top:
        scored = scored[: args.top]

    output_path = Path(args.output) if args.output else None
    if args.format == "json":
        text = json.dumps(scored, ensure_ascii=False, indent=2)
        if output_path:
            output_path.write_text(text + "\n", encoding="utf-8")
        else:
            print(text)
    elif args.format == "csv":
        write_csv(scored, FRONTIER_FIELDS, output_path)
    else:
        if output_path:
            with output_path.open("w", encoding="utf-8") as handle:
                stdout = sys.stdout
                sys.stdout = handle
                try:
                    print_markdown_table(scored, FRONTIER_FIELDS)
                finally:
                    sys.stdout = stdout
        else:
            print_markdown_table(scored, FRONTIER_FIELDS)

    return 0


# --- lint-workspace ---


def source_note_files(workspace: Path) -> list[Path]:
    notes_dir = workspace / "source-notes"
    if not notes_dir.exists():
        return []
    return sorted(notes_dir.glob("source-*.md"))


def lint_workspace(workspace: Path) -> list[dict[str, str]]:
    issues: list[dict[str, str]] = []

    for relative in REQUIRED_WORKSPACE_FILES:
        path = workspace / relative
        if not path.exists():
            issues.append(issue("missing_required_file", "Required workspace file is missing.", path))

    rounds = sorted((workspace / "rounds").glob("round-*.md")) if (workspace / "rounds").exists() else []
    if not rounds:
        issues.append(
            issue(
                "missing_rounds",
                "No exploration round files found; substantial research needs an auditable trail.",
                workspace / "rounds",
            )
        )

    frontier_path = workspace / "frontier.csv"
    if frontier_path.exists():
        for index, row in enumerate(read_rows(frontier_path), start=1):
            if is_blank(row.get("node")):
                issues.append(issue("missing_frontier_node", "Frontier row has no node.", frontier_path, detail=str(index)))
            score_fields_present = all(not is_blank(row.get(field)) for field in ["impact", "uncertainty", "explorability", "cost"])
            if score_fields_present and is_blank(row.get("priority")):
                issues.append(
                    issue(
                        "empty_frontier_priority",
                        "Frontier row has scores but no computed priority.",
                        frontier_path,
                        detail=f"row {index}: {row.get('node', '')}",
                    )
                )
            for field in ["impact", "uncertainty", "explorability", "cost"]:
                if not is_blank(row.get(field)):
                    try:
                        parse_score(row.get(field), field, index)
                    except ValueError as exc:
                        issues.append(issue("invalid_frontier_score", str(exc), frontier_path, detail=f"row {index}"))

    claims_path = workspace / "claims.csv"
    if claims_path.exists():
        for index, row in enumerate(read_rows(claims_path), start=1):
            if is_blank(row.get("claim")):
                issues.append(issue("missing_claim", "Claim row has no claim text.", claims_path, detail=f"row {index}"))
            if is_blank(row.get("supporting_evidence")):
                issues.append(
                    issue("missing_claim_support", "Claim row has no supporting evidence.", claims_path, detail=f"row {index}")
                )
            if is_blank(row.get("confidence")):
                issues.append(issue("missing_claim_confidence", "Claim row has no confidence.", claims_path, detail=f"row {index}"))
            if is_blank(row.get("decision_relevance")):
                issues.append(
                    issue("missing_decision_relevance", "Claim row has no decision relevance.", claims_path, detail=f"row {index}")
                )
            confidence = str(row.get("confidence", "")).strip().lower()
            evidence = str(row.get("supporting_evidence", ""))
            if confidence == "high" and "source-" not in evidence:
                issues.append(
                    issue(
                        "high_confidence_claim_without_source_id",
                        "High-confidence claim should cite at least one durable source note id.",
                        claims_path,
                        detail=f"row {index}: {row.get('claim', '')}",
                    )
                )

    final_path = workspace / "final-synthesis.md"
    if final_path.exists():
        final_text = final_path.read_text(encoding="utf-8")
        if EXTERNAL_CITATION_RE.search(final_text) and not source_note_files(workspace):
            issues.append(
                issue(
                    "external_citation_without_source_notes",
                    "Final synthesis cites external sources but no source-notes are present.",
                    final_path,
                )
            )
        for section_name, headings in FINAL_SECTION_ALIASES.items():
            if not has_any_heading(final_text, headings):
                issues.append(
                    issue(
                        "missing_final_section",
                        f"Final synthesis is missing section {section_name}.",
                        final_path,
                        detail=" / ".join(headings),
                    )
                )

    return issues


def cmd_lint_workspace(args: argparse.Namespace) -> int:
    workspace = Path(args.workspace)
    issues = lint_workspace(workspace)
    result = {
        "workspace": str(workspace),
        "issue_count": len(issues),
        "issues": issues,
    }
    if args.format == "json":
        print(json.dumps(result, ensure_ascii=False, indent=2))
    else:
        if not issues:
            print(f"Workspace lint passed: {workspace}")
        else:
            print(f"Workspace lint found {len(issues)} issue(s):")
            print_markdown_table(issues, ["severity", "code", "path", "message", "detail"])
    return 1 if issues and args.strict_exit else (1 if issues else 0)


# --- check-convergence ---


def cmd_check_convergence(args: argparse.Namespace) -> int:
    rows = read_rows(Path(args.input))
    normalized = []
    failed = []
    for row in rows:
        status = str(row.get("status", "")).strip().lower()
        passed = status in {"pass", "passed", "true", "yes", "y", "1", "ok"}
        normalized_row = {
            "check": row.get("check", ""),
            "status": "pass" if passed else "fail",
            "evidence": row.get("evidence", ""),
        }
        normalized.append(normalized_row)
        if not passed:
            failed.append(normalized_row)

    total = len(normalized)
    passed_count = sum(1 for row in normalized if row["status"] == "pass")
    weak_evidence = [row for row in normalized if row["status"] == "pass" and not substantive_text(row["evidence"])]
    if weak_evidence:
        failed.append(
            {
                "check": "Pass rows include substantive evidence",
                "status": "fail",
                "evidence": f"{len(weak_evidence)} pass row(s) have too little evidence.",
            }
        )

    lint_issues: list[dict[str, str]] = []
    if args.workspace:
        lint_issues = lint_workspace(Path(args.workspace))
        if lint_issues:
            failed.append(
                {
                    "check": "Workspace lint has no blocking issues",
                    "status": "fail",
                    "evidence": f"{len(lint_issues)} workspace lint issue(s).",
                }
            )
    can_converge = total > 0 and not failed

    result = {
        "can_converge": can_converge,
        "passed": passed_count,
        "total": total,
        "failed_checks": failed,
        "workspace_issues": lint_issues,
    }

    if args.format == "json":
        print(json.dumps(result, ensure_ascii=False, indent=2))
    else:
        print(f"Can converge: {'yes' if can_converge else 'no'}")
        print(f"Passed: {passed_count}/{total}")
        if failed:
            print("\nFailed checks:")
            print_markdown_table(failed, ["check", "status", "evidence"])

    return 1 if args.strict_exit and not can_converge else 0


# --- feedback ---


def parse_tags(values: list[str] | None) -> list[str]:
    tags: list[str] = []
    for value in values or []:
        for item in value.split(","):
            tag = item.strip()
            if tag and tag not in tags:
                tags.append(tag)
    return tags


def feedback_log_path(value: str | None) -> Path:
    return Path(value) if value else DEFAULT_FEEDBACK_LOG


def feedback_event(args: argparse.Namespace) -> dict[str, Any]:
    if args.rating is not None and (args.rating < 1 or args.rating > 5):
        raise ValueError("--rating must be between 1 and 5.")
    tags = parse_tags(args.tag)
    if not tags:
        tags = ["untagged"]
    timestamp = args.timestamp or utc_now()
    event_id = args.event_id or f"fb-{timestamp.replace(':', '').replace('-', '')}"
    return {
        "event_id": event_id,
        "timestamp": timestamp,
        "source": args.source,
        "verdict": args.verdict,
        "rating": args.rating,
        "dimension": args.dimension,
        "tags": tags,
        "feedback": args.feedback.strip(),
        "workspace": args.workspace or "",
        "artifact": args.artifact or "",
        "run_id": args.run_id or "",
    }


def append_jsonl(path: Path, row: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("a", encoding="utf-8") as handle:
        handle.write(json.dumps(row, ensure_ascii=False, sort_keys=True) + "\n")


def cmd_record_feedback(args: argparse.Namespace) -> int:
    if not args.feedback.strip():
        raise ValueError("--feedback cannot be empty.")
    path = feedback_log_path(args.log)
    event = feedback_event(args)
    append_jsonl(path, event)
    result = {"log": str(path), "event": event}
    if args.format == "json":
        print(json.dumps(result, ensure_ascii=False, indent=2))
    else:
        print(f"Recorded feedback: {event['event_id']} -> {path}")
    return 0


def summarize_feedback_events(events: list[dict[str, Any]], min_count: int) -> dict[str, Any]:
    groups: dict[tuple[str, str, str], list[dict[str, Any]]] = {}
    for event in events:
        tags = event.get("tags") or ["untagged"]
        for tag in tags:
            key = (
                str(event.get("dimension", "") or "general"),
                str(tag),
                str(event.get("verdict", "") or "mixed"),
            )
            groups.setdefault(key, []).append(event)

    patterns = []
    candidates = []
    for (dimension, tag, verdict), grouped in sorted(groups.items(), key=lambda item: (-len(item[1]), item[0])):
        ratings = [event.get("rating") for event in grouped if isinstance(event.get("rating"), int)]
        average_rating = round(sum(ratings) / len(ratings), 2) if ratings else None
        sample_feedback = [str(event.get("feedback", "")) for event in grouped[:3]]
        pattern = {
            "dimension": dimension,
            "tag": tag,
            "verdict": verdict,
            "count": len(grouped),
            "average_rating": average_rating,
            "sample_feedback": sample_feedback,
        }
        patterns.append(pattern)
        if len(grouped) >= min_count and verdict in {"negative", "mixed"}:
            candidates.append(
                {
                    **pattern,
                    "requires_human_review": True,
                    "suggested_next_step": "Create or update tests first, then decide whether this belongs in scripts, references, or SKILL.md.",
                }
            )

    return {
        "event_count": len(events),
        "pattern_count": len(patterns),
        "candidate_count": len(candidates),
        "patterns": patterns,
        "candidates": candidates,
    }


def cmd_summarize_feedback(args: argparse.Namespace) -> int:
    path = feedback_log_path(args.log)
    summary = summarize_feedback_events(read_jsonl(path), args.min_count)
    summary["log"] = str(path)
    if args.format == "json":
        print(json.dumps(summary, ensure_ascii=False, indent=2))
    else:
        print(f"Feedback events: {summary['event_count']}")
        print(f"Evolution candidates: {summary['candidate_count']}")
        if summary["candidates"]:
            print_markdown_table(
                summary["candidates"],
                ["dimension", "tag", "verdict", "count", "average_rating", "suggested_next_step"],
            )
    return 0


# --- propose-evolution ---


def proposal_markdown(summary: dict[str, Any], source_log: Path) -> str:
    today = date.today().isoformat()
    lines = [
        f"# domain-sensemaking Evolution Proposal {today}",
        "",
        "Do not edit SKILL.md directly from this proposal. Confirm the candidate, add or update regression tests, then change scripts/references/SKILL.md through the normal workflow.",
        "",
        f"Source log: `{source_log}`",
        f"Events analyzed: {summary['event_count']}",
        f"Candidates: {summary['candidate_count']}",
        "",
        "## Candidate Patterns",
        "",
        "| Dimension | Tag | Verdict | Count | Average Rating | Suggested Next Step |",
        "|---|---|---|---:|---:|---|",
    ]
    for candidate in summary["candidates"]:
        average = "" if candidate["average_rating"] is None else candidate["average_rating"]
        lines.append(
            "| {dimension} | {tag} | {verdict} | {count} | {average} | {step} |".format(
                dimension=candidate["dimension"],
                tag=candidate["tag"],
                verdict=candidate["verdict"],
                count=candidate["count"],
                average=average,
                step=candidate["suggested_next_step"],
            )
        )
    lines.extend(
        [
            "",
            "## Review Checklist",
            "",
            "- [ ] Is this feedback pattern repeated enough to justify a rule?",
            "- [ ] Is the issue better solved by script validation, a reference file, or SKILL.md prose?",
            "- [ ] Is there a failing regression test or pressure scenario before the change?",
            "- [ ] Are unrelated one-off preferences excluded?",
            "- [ ] After implementation, did helper tests pass?",
            "",
        ]
    )
    return "\n".join(lines)


def cmd_propose_evolution(args: argparse.Namespace) -> int:
    log_path = feedback_log_path(args.log)
    summary = summarize_feedback_events(read_jsonl(log_path), args.min_count)
    output_dir = Path(args.output_dir) if args.output_dir else DEFAULT_PROPOSAL_DIR
    output_dir.mkdir(parents=True, exist_ok=True)
    target = output_dir / f"{date.today().isoformat()}-evolution-proposal.md"
    if target.exists() and not args.force:
        raise FileExistsError(f"{target} already exists. Use --force to overwrite.")
    target.write_text(proposal_markdown(summary, log_path), encoding="utf-8")
    result = {
        "proposal_path": str(target),
        "candidate_count": summary["candidate_count"],
        "requires_human_review": True,
    }
    if args.format == "json":
        print(json.dumps(result, ensure_ascii=False, indent=2))
    else:
        print(f"Created evolution proposal: {target}")
        print(f"Candidates: {summary['candidate_count']}")
    return 0


# --- CLI parser ---


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Domain sensemaking helper.")
    subparsers = parser.add_subparsers(dest="command", required=True)

    init_parser = subparsers.add_parser("init", help="Create a research workspace.")
    init_parser.add_argument("--output", required=True, help="Output directory.")
    init_parser.add_argument("--question", default="", help="Initial fuzzy question.")
    init_parser.add_argument(
        "--mode",
        default="Learning",
        choices=["Learning", "Research / Engineering", "Consulting / Decision"],
        help="Primary sensemaking mode.",
    )
    init_parser.add_argument("--target-output", default="", help="Expected final artifact.")
    init_parser.add_argument(
        "--round-focus", default="Initial breadth-first map", help="Focus for rounds/round-01.md."
    )
    init_parser.add_argument("--primary-reader", default="", help="Expected reader of the synthesis.")
    init_parser.add_argument("--reader-goal", default="", help="What the reader needs to do next.")
    init_parser.add_argument(
        "--known-territory", default="", help="Concepts or domains the reader likely knows well."
    )
    init_parser.add_argument(
        "--needs-explanation",
        default="",
        help="Concepts or methods that likely need explanation in the synthesis.",
    )
    init_parser.add_argument(
        "--detail-policy",
        default="standard",
        choices=["concise", "standard", "teaching", "layered"],
        help="Explanation depth for the human-facing synthesis.",
    )
    init_parser.add_argument("--force", action="store_true", help="Overwrite existing files.")
    init_parser.set_defaults(func=cmd_init)

    round_parser = subparsers.add_parser("new-round", help="Create the next exploration round file.")
    round_parser.add_argument("workspace", help="Existing sensemaking workspace.")
    round_parser.add_argument("--focus", default="", help="Focus for this exploration round.")
    round_parser.add_argument("--starting-question", default="", help="Question at round start.")
    round_parser.add_argument("--previous-question", default="", help="Previous reframed question.")
    round_parser.add_argument("--number", type=int, help="Explicit round number.")
    round_parser.add_argument("--force", action="store_true", help="Overwrite an existing round file.")
    round_parser.set_defaults(func=cmd_new_round)

    select_parser = subparsers.add_parser(
        "select-frontier", help="Select frontier nodes and create the next exploration round."
    )
    select_parser.add_argument("workspace", help="Existing sensemaking workspace.")
    select_parser.add_argument("--top", type=int, default=3, help="Select the top N nodes by priority.")
    select_parser.add_argument(
        "--nodes",
        default="",
        help="Comma-separated node names to select manually. Requires --override-reason if not top-ranked.",
    )
    select_parser.add_argument("--focus", default="", help="Focus for the created exploration round.")
    select_parser.add_argument("--starting-question", default="", help="Question at round start.")
    select_parser.add_argument("--previous-question", default="", help="Previous reframed question.")
    select_parser.add_argument("--override-reason", default="", help="Why manual selection overrides score ranking.")
    select_parser.add_argument("--number", type=int, help="Explicit round number.")
    select_parser.add_argument("--force", action="store_true", help="Overwrite an existing round file.")
    select_parser.add_argument(
        "--format", choices=["markdown", "json"], default="markdown", help="Output format."
    )
    select_parser.set_defaults(func=cmd_select_frontier)

    source_parser = subparsers.add_parser("new-source", help="Create a reusable source note.")
    source_parser.add_argument("workspace", help="Existing sensemaking workspace.")
    source_parser.add_argument("--title", required=True, help="Source title.")
    source_parser.add_argument("--url", default="", help="Source URL.")
    source_parser.add_argument("--path", default="", help="Local source path.")
    source_parser.add_argument(
        "--source-type",
        default="web",
        choices=[
            "web",
            "paper",
            "report",
            "dataset",
            "interview",
            "internal-doc",
            "observation",
            "other",
        ],
        help="Source category.",
    )
    source_parser.add_argument("--accessed", default=str(date.today()), help="Access date in YYYY-MM-DD.")
    source_parser.add_argument(
        "--reliability",
        default="medium",
        choices=["high", "medium", "low"],
        help="Initial reliability assessment.",
    )
    source_parser.add_argument("--linked-round", default="", help="Round file or label.")
    source_parser.add_argument("--linked-frontier", default="", help="Frontier node(s) this source informs.")
    source_parser.add_argument("--source-id", default="", help="Explicit source id, e.g. source-003.")
    source_parser.add_argument("--force", action="store_true", help="Overwrite an existing source note.")
    source_parser.set_defaults(func=cmd_new_source)

    score_parser = subparsers.add_parser("score-frontier", help="Score and rank frontier rows.")
    score_parser.add_argument("input", help="CSV or JSON frontier input.")
    score_parser.add_argument("--output", help="Optional output path.")
    score_parser.add_argument("--top", type=int, help="Only return the top N rows.")
    score_parser.add_argument(
        "--format",
        choices=["markdown", "csv", "json"],
        default="markdown",
        help="Output format.",
    )
    score_parser.set_defaults(func=cmd_score_frontier)

    lint_parser = subparsers.add_parser("lint-workspace", help="Validate workspace traceability and evidence hygiene.")
    lint_parser.add_argument("workspace", help="Existing sensemaking workspace.")
    lint_parser.add_argument(
        "--format", choices=["markdown", "json"], default="markdown", help="Output format."
    )
    lint_parser.add_argument(
        "--strict-exit", action="store_true", help="Exit with code 1 if lint issues exist."
    )
    lint_parser.set_defaults(func=cmd_lint_workspace)

    feedback_parser = subparsers.add_parser("record-feedback", help="Record user or evaluation feedback.")
    feedback_parser.add_argument("--feedback", required=True, help="Feedback text.")
    feedback_parser.add_argument("--dimension", default="general", help="Quality dimension, e.g. evidence or reader_fit.")
    feedback_parser.add_argument(
        "--verdict",
        default="mixed",
        choices=["positive", "negative", "mixed"],
        help="Feedback polarity.",
    )
    feedback_parser.add_argument("--rating", type=int, help="Optional 1-5 rating.")
    feedback_parser.add_argument("--tag", action="append", help="Feedback tag; may be repeated or comma-separated.")
    feedback_parser.add_argument(
        "--source",
        default="user",
        choices=["user", "self", "lint", "regression"],
        help="Feedback source.",
    )
    feedback_parser.add_argument("--workspace", default="", help="Related sensemaking workspace.")
    feedback_parser.add_argument("--artifact", default="", help="Related artifact path.")
    feedback_parser.add_argument("--run-id", default="", help="Optional run/session id.")
    feedback_parser.add_argument("--event-id", default="", help="Optional stable event id.")
    feedback_parser.add_argument("--timestamp", default="", help="Optional ISO timestamp.")
    feedback_parser.add_argument("--log", help="Feedback JSONL path.")
    feedback_parser.add_argument("--format", choices=["markdown", "json"], default="markdown")
    feedback_parser.set_defaults(func=cmd_record_feedback)

    summarize_parser = subparsers.add_parser(
        "summarize-feedback", help="Summarize feedback and identify repeated evolution signals."
    )
    summarize_parser.add_argument("--log", help="Feedback JSONL path.")
    summarize_parser.add_argument("--min-count", type=int, default=3, help="Minimum repeated count for a candidate.")
    summarize_parser.add_argument("--format", choices=["markdown", "json"], default="markdown")
    summarize_parser.set_defaults(func=cmd_summarize_feedback)

    propose_parser = subparsers.add_parser(
        "propose-evolution", help="Write a human-reviewable evolution proposal from repeated feedback."
    )
    propose_parser.add_argument("--log", help="Feedback JSONL path.")
    propose_parser.add_argument("--output-dir", help="Proposal output directory.")
    propose_parser.add_argument("--min-count", type=int, default=3, help="Minimum repeated count for a candidate.")
    propose_parser.add_argument("--force", action="store_true", help="Overwrite today's proposal file.")
    propose_parser.add_argument("--format", choices=["markdown", "json"], default="markdown")
    propose_parser.set_defaults(func=cmd_propose_evolution)

    convergence_parser = subparsers.add_parser(
        "check-convergence", help="Summarize convergence checklist status."
    )
    convergence_parser.add_argument("input", help="CSV or JSON convergence checklist.")
    convergence_parser.add_argument(
        "--workspace", help="Optional workspace path; when provided, convergence also requires lint to pass."
    )
    convergence_parser.add_argument(
        "--format", choices=["markdown", "json"], default="markdown", help="Output format."
    )
    convergence_parser.add_argument(
        "--strict-exit", action="store_true", help="Exit with code 1 if checks fail."
    )
    convergence_parser.set_defaults(func=cmd_check_convergence)

    return parser


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()
    try:
        return args.func(args)
    except Exception as exc:  # noqa: BLE001 - concise CLI error for agents.
        print(f"error: {exc}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
