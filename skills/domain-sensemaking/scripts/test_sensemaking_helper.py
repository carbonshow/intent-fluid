#!/usr/bin/env python3
"""Regression tests for domain-sensemaking helper behavior."""

from __future__ import annotations

import csv
import json
import subprocess
import sys
import tempfile
from pathlib import Path


HELPER = Path(__file__).resolve().parent / "sensemaking_helper.py"


def run_helper(*args: str) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        [sys.executable, str(HELPER), *args],
        check=False,
        text=True,
        capture_output=True,
    )


def write_csv(path: Path, fields: list[str], rows: list[dict[str, str]]) -> None:
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fields)
        writer.writeheader()
        writer.writerows(rows)


def make_bad_workspace(base: Path) -> Path:
    workspace = base / "bad-workspace"
    workspace.mkdir()
    (workspace / "problem-card.md").write_text("# Problem Card\n", encoding="utf-8")
    (workspace / "reader-brief.md").write_text("# Reader Brief\n", encoding="utf-8")
    (workspace / "relations.csv").write_text("a,relation,b,note\n", encoding="utf-8")
    (workspace / "contradictions.csv").write_text(
        "type,content,likely_cause,next_action,resolution\n", encoding="utf-8"
    )
    (workspace / "visual-map.md").write_text("# Visual Map\n", encoding="utf-8")
    (workspace / "final-synthesis.md").write_text(
        "# Final Synthesis\n\n## Core Claims\n\nClaim cites [Example 2026](https://example.com).\n",
        encoding="utf-8",
    )
    write_csv(
        workspace / "frontier.csv",
        [
            "node",
            "type",
            "exploration_purpose",
            "impact",
            "uncertainty",
            "explorability",
            "cost",
            "priority",
            "status",
        ],
        [
            {
                "node": "Unscored node",
                "type": "concept",
                "exploration_purpose": "Check scoring",
                "impact": "5",
                "uncertainty": "4",
                "explorability": "4",
                "cost": "2",
                "priority": "",
                "status": "pending",
            }
        ],
    )
    write_csv(
        workspace / "claims.csv",
        [
            "claim",
            "supporting_evidence",
            "opposing_evidence",
            "confidence",
            "decision_relevance",
        ],
        [
            {
                "claim": "High confidence claim",
                "supporting_evidence": "Example 2026",
                "opposing_evidence": "",
                "confidence": "high",
                "decision_relevance": "Core decision",
            }
        ],
    )
    write_csv(
        workspace / "sources.csv",
        [
            "source_id",
            "title",
            "url_or_path",
            "source_type",
            "accessed",
            "reliability",
            "linked_round",
            "linked_frontier",
        ],
        [],
    )
    write_csv(
        workspace / "convergence.csv",
        ["check", "status", "evidence"],
        [
            {"check": "Question is specific enough to answer", "status": "pass", "evidence": "ok"},
            {
                "check": "Important claims have sufficient evidence or explicit uncertainty labels",
                "status": "pass",
                "evidence": "ok",
            },
            {"check": "New exploration has low marginal value", "status": "pass", "evidence": "ok"},
        ],
    )
    return workspace


def test_init_creates_workspace() -> None:
    with tempfile.TemporaryDirectory() as tmp:
        workspace = Path(tmp) / "research"
        result = run_helper("init", "--output", str(workspace), "--question", "What is X?")
        assert result.returncode == 0, result.stdout + result.stderr
        assert (workspace / "problem-card.md").exists()
        assert (workspace / "reader-brief.md").exists()
        assert (workspace / "frontier.csv").exists()
        assert (workspace / "sources.csv").exists()
        assert (workspace / "convergence.csv").exists()
        assert (workspace / "visual-map.md").exists()
        assert (workspace / "final-synthesis.md").exists()
        assert (workspace / "rounds/round-01.md").exists()


def test_lint_workspace_flags_missing_audit_trail() -> None:
    with tempfile.TemporaryDirectory() as tmp:
        workspace = make_bad_workspace(Path(tmp))
        result = run_helper("lint-workspace", str(workspace), "--format", "json")
        assert result.returncode == 1, result.stdout + result.stderr
        data = json.loads(result.stdout)
        codes = {issue["code"] for issue in data["issues"]}
        assert "missing_rounds" in codes
        assert "empty_frontier_priority" in codes
        assert "high_confidence_claim_without_source_id" in codes
        assert "external_citation_without_source_notes" in codes


def test_check_convergence_uses_workspace_gate() -> None:
    with tempfile.TemporaryDirectory() as tmp:
        workspace = make_bad_workspace(Path(tmp))
        result = run_helper(
            "check-convergence",
            str(workspace / "convergence.csv"),
            "--workspace",
            str(workspace),
            "--format",
            "json",
            "--strict-exit",
        )
        assert result.returncode == 1, result.stdout + result.stderr
        data = json.loads(result.stdout)
        assert data["can_converge"] is False
        failed_checks = {row["check"] for row in data["failed_checks"]}
        assert "Workspace lint has no blocking issues" in failed_checks
        assert "Pass rows include substantive evidence" in failed_checks


def test_select_frontier_creates_round_from_top_priority() -> None:
    with tempfile.TemporaryDirectory() as tmp:
        workspace = Path(tmp) / "workspace"
        workspace.mkdir()
        write_csv(
            workspace / "frontier.csv",
            [
                "node",
                "type",
                "exploration_purpose",
                "impact",
                "uncertainty",
                "explorability",
                "cost",
                "priority",
                "status",
            ],
            [
                {
                    "node": "Low priority",
                    "type": "concept",
                    "exploration_purpose": "Less important",
                    "impact": "2",
                    "uncertainty": "2",
                    "explorability": "2",
                    "cost": "4",
                    "priority": "2.0",
                    "status": "pending",
                },
                {
                    "node": "High priority",
                    "type": "method",
                    "exploration_purpose": "Blocks the conclusion",
                    "impact": "5",
                    "uncertainty": "4",
                    "explorability": "5",
                    "cost": "1",
                    "priority": "100.0",
                    "status": "pending",
                },
            ],
        )
        result = run_helper(
            "select-frontier",
            str(workspace),
            "--top",
            "1",
            "--focus",
            "Deepen evidence",
            "--format",
            "json",
        )
        assert result.returncode == 0, result.stdout + result.stderr
        data = json.loads(result.stdout)
        assert data["created_round"].endswith("round-01.md")
        assert data["selected"][0]["node"] == "High priority"
        round_text = (workspace / "rounds/round-01.md").read_text(encoding="utf-8")
        assert "High priority" in round_text
        assert "Blocks the conclusion" in round_text


def test_new_source_creates_note_and_index() -> None:
    with tempfile.TemporaryDirectory() as tmp:
        workspace = Path(tmp) / "workspace"
        workspace.mkdir()
        write_csv(workspace / "sources.csv", [
            "source_id", "title", "url_or_path", "source_type",
            "accessed", "reliability", "linked_round", "linked_frontier",
        ], [])
        result = run_helper(
            "new-source",
            str(workspace),
            "--title", "Example Paper",
            "--url", "https://example.com/paper.pdf",
            "--source-type", "paper",
            "--reliability", "high",
        )
        assert result.returncode == 0, result.stdout + result.stderr
        notes = list((workspace / "source-notes").glob("source-*.md"))
        assert len(notes) == 1
        note_text = notes[0].read_text(encoding="utf-8")
        assert "Example Paper" in note_text
        index_text = (workspace / "sources.csv").read_text(encoding="utf-8")
        assert "source-001" in index_text


def test_record_feedback_appends_structured_event() -> None:
    with tempfile.TemporaryDirectory() as tmp:
        log_path = Path(tmp) / "feedback.jsonl"
        result = run_helper(
            "record-feedback",
            "--log",
            str(log_path),
            "--workspace",
            "research/sample-workspace",
            "--artifact",
            "final-synthesis.md",
            "--dimension",
            "traceability",
            "--verdict",
            "negative",
            "--rating",
            "2",
            "--tag",
            "missing_source_notes",
            "--feedback",
            "Final memo cites papers but does not keep source notes.",
            "--format",
            "json",
        )
        assert result.returncode == 0, result.stdout + result.stderr
        data = json.loads(result.stdout)
        assert data["event"]["dimension"] == "traceability"
        assert data["event"]["tags"] == ["missing_source_notes"]
        events = [json.loads(line) for line in log_path.read_text(encoding="utf-8").splitlines()]
        assert len(events) == 1
        assert events[0]["feedback"].startswith("Final memo")


def test_summarize_feedback_promotes_repeated_negative_signal() -> None:
    with tempfile.TemporaryDirectory() as tmp:
        log_path = Path(tmp) / "feedback.jsonl"
        for index in range(3):
            result = run_helper(
                "record-feedback",
                "--log",
                str(log_path),
                "--dimension",
                "evidence",
                "--verdict",
                "negative",
                "--tag",
                "weak_sources",
                "--feedback",
                f"Feedback {index}: source evidence is too thin.",
                "--format",
                "json",
            )
            assert result.returncode == 0, result.stdout + result.stderr

        result = run_helper(
            "summarize-feedback",
            "--log",
            str(log_path),
            "--min-count",
            "2",
            "--format",
            "json",
        )
        assert result.returncode == 0, result.stdout + result.stderr
        data = json.loads(result.stdout)
        assert data["event_count"] == 3
        assert data["candidates"][0]["tag"] == "weak_sources"
        assert data["candidates"][0]["count"] == 3
        assert data["candidates"][0]["requires_human_review"] is True


def test_propose_evolution_writes_reviewable_candidate() -> None:
    with tempfile.TemporaryDirectory() as tmp:
        log_path = Path(tmp) / "feedback.jsonl"
        output_dir = Path(tmp) / "proposals"
        for index in range(2):
            result = run_helper(
                "record-feedback",
                "--log",
                str(log_path),
                "--dimension",
                "reader_fit",
                "--verdict",
                "mixed",
                "--tag",
                "too_dense",
                "--feedback",
                f"Feedback {index}: output is useful but too dense.",
                "--format",
                "json",
            )
            assert result.returncode == 0, result.stdout + result.stderr

        result = run_helper(
            "propose-evolution",
            "--log",
            str(log_path),
            "--output-dir",
            str(output_dir),
            "--min-count",
            "2",
            "--format",
            "json",
        )
        assert result.returncode == 0, result.stdout + result.stderr
        data = json.loads(result.stdout)
        proposal_path = Path(data["proposal_path"])
        assert proposal_path.exists()
        proposal_text = proposal_path.read_text(encoding="utf-8")
        assert "too_dense" in proposal_text
        assert "Do not edit SKILL.md directly from this proposal" in proposal_text


def main() -> int:
    tests = [
        test_init_creates_workspace,
        test_lint_workspace_flags_missing_audit_trail,
        test_check_convergence_uses_workspace_gate,
        test_select_frontier_creates_round_from_top_priority,
        test_new_source_creates_note_and_index,
        test_record_feedback_appends_structured_event,
        test_summarize_feedback_promotes_repeated_negative_signal,
        test_propose_evolution_writes_reviewable_candidate,
    ]
    failures: list[str] = []
    for test in tests:
        try:
            test()
        except Exception as exc:  # noqa: BLE001 - compact local test runner.
            failures.append(f"{test.__name__}: {exc}")

    if failures:
        print("FAILED")
        for failure in failures:
            print(f"- {failure}")
        return 1

    print(f"PASSED {len(tests)} tests")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
