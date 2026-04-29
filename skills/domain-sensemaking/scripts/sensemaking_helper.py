#!/usr/bin/env python3
"""Deterministic helpers for the domain-sensemaking skill."""

from __future__ import annotations

import argparse
import csv
import json
import sys
from pathlib import Path
from typing import Any


FRONTIER_FIELDS = [
    "node",
    "type",
    "exploration_purpose",
    "impact",
    "uncertainty",
    "explorability",
    "cost",
    "priority",
]

CONVERGENCE_ROWS = [
    "Question is specific enough to answer",
    "Main graph has no critical isolated nodes",
    "Key disagreements can be explained",
    "Important claims have sufficient evidence or explicit uncertainty labels",
    "Decision, explanation, experiment, or action can be derived",
    "New exploration has low marginal value",
]


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


def parse_score(value: Any, field: str, row_index: int) -> float:
    try:
        score = float(value)
    except (TypeError, ValueError) as exc:
        raise ValueError(f"Row {row_index}: {field} must be a number.") from exc
    if score < 1 or score > 5:
        raise ValueError(f"Row {row_index}: {field} must be between 1 and 5.")
    return score


def cmd_init(args: argparse.Namespace) -> int:
    output_dir = Path(args.output)
    output_dir.mkdir(parents=True, exist_ok=True)

    files = {
        "problem-card.md": problem_card(args),
        "frontier.csv": ",".join(FRONTIER_FIELDS) + "\n",
        "relations.csv": "a,relation,b,note\n",
        "claims.csv": "claim,supporting_evidence,opposing_evidence,confidence,decision_relevance\n",
        "contradictions.csv": "type,content,likely_cause,next_action\n",
        "convergence.csv": convergence_csv(),
        "final-synthesis.md": final_synthesis(),
    }

    written: list[str] = []
    for name, content in files.items():
        path = output_dir / name
        if path.exists() and not args.force:
            raise FileExistsError(f"{path} already exists. Use --force to overwrite.")
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


def final_synthesis() -> str:
    return """# Final Synthesis

## Initial Question

## Question Evolution

## Research Path

## Knowledge Graph Summary

## Core Claims

| Claim | Evidence | Confidence | Implication |
|---|---|---|---|

## Contradictions And Unknowns

## Answer

## Next Actions
"""


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


def cmd_check_convergence(args: argparse.Namespace) -> int:
    rows = read_rows(Path(args.input))
    normalized = []
    for row in rows:
        status = str(row.get("status", "")).strip().lower()
        passed = status in {"pass", "passed", "true", "yes", "y", "1", "ok"}
        normalized.append(
            {
                "check": row.get("check", ""),
                "status": "pass" if passed else "fail",
                "evidence": row.get("evidence", ""),
            }
        )

    total = len(normalized)
    passed_count = sum(1 for row in normalized if row["status"] == "pass")
    failed = [row for row in normalized if row["status"] != "pass"]
    can_converge = total > 0 and not failed

    result = {
        "can_converge": can_converge,
        "passed": passed_count,
        "total": total,
        "failed_checks": failed,
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
    init_parser.add_argument("--force", action="store_true", help="Overwrite existing files.")
    init_parser.set_defaults(func=cmd_init)

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

    convergence_parser = subparsers.add_parser(
        "check-convergence", help="Summarize convergence checklist status."
    )
    convergence_parser.add_argument("input", help="CSV or JSON convergence checklist.")
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
    except Exception as exc:  # noqa: BLE001
        print(f"error: {exc}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
