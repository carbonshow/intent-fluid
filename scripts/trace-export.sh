#!/usr/bin/env bash
# trace-export.sh — Convert trace.jsonl to visualization formats.
# Framework-level script: works with any intent-fluid skill.
# PREREQUISITE: Node.js 12+ must be available on PATH.
#
# Usage: bash scripts/trace-export.sh <trace_file> <format> [--skill-dir <path>]
#
# Formats:
#   mermaid   — Mermaid flowchart DAG (output: <dir>/execution_dag.mmd)
#   summary   — Markdown execution summary table (output: <dir>/execution_summary.md)
#   timeline  — ASCII timeline (output: stdout)
#
# Options:
#   --skill-dir <path>  Path to skill directory containing SKILL.md
#                        (reads trace.topology and trace.steps from frontmatter)
#
# Examples:
#   bash scripts/trace-export.sh .surge/tasks/20260327-abc1/trace.jsonl mermaid
#   bash scripts/trace-export.sh ./trace.jsonl summary --skill-dir skills/surge
#   bash scripts/trace-export.sh ./trace.jsonl timeline

set -euo pipefail

# --- Node.js check ---
if ! command -v node &>/dev/null; then
    echo "Error: Node.js is required but not found on PATH." >&2
    exit 1
fi

# --- Usage ---
usage() {
    echo "Usage: bash scripts/trace-export.sh <trace_file> <format> [--skill-dir <path>]"
    echo ""
    echo "Formats: mermaid | summary | timeline"
    echo ""
    echo "Options:"
    echo "  --skill-dir <path>  Path to skill directory with SKILL.md (for workflow metadata)"
    echo ""
    echo "Examples:"
    echo "  bash scripts/trace-export.sh ./trace.jsonl mermaid"
    echo "  bash scripts/trace-export.sh ./trace.jsonl summary --skill-dir skills/surge"
    exit 1
}

if [[ $# -lt 2 ]]; then
    usage
fi

TRACE_FILE="$1"
FORMAT="$2"
shift 2

SKILL_DIR=""
while [[ $# -gt 0 ]]; do
    case "$1" in
        --skill-dir)
            SKILL_DIR="$2"
            shift 2
            ;;
        *)
            echo "Error: unknown option: $1" >&2
            usage
            ;;
    esac
done

# Validate trace file
if [[ ! -f "$TRACE_FILE" ]]; then
    echo "Error: trace file does not exist: ${TRACE_FILE}" >&2
    exit 1
fi

# Validate format
if [[ "$FORMAT" != "mermaid" && "$FORMAT" != "summary" && "$FORMAT" != "timeline" ]]; then
    echo "Error: unknown format: ${FORMAT} (expected: mermaid|summary|timeline)" >&2
    exit 1
fi

TRACE_DIR=$(dirname "$TRACE_FILE")

node -e '
"use strict";
const fs = require("fs");
const path = require("path");

const traceFile = process.argv[1];
const format = process.argv[2];
const skillDir = process.argv[3] || "";
const traceDir = path.dirname(traceFile);

// --- Parse trace events ---
const content = fs.readFileSync(traceFile, "utf8").trim();
if (!content) {
    console.error("Warning: trace file is empty");
    process.exit(0);
}

const events = content.split("\n").map((line, i) => {
    try {
        return JSON.parse(line);
    } catch (e) {
        console.error(`Warning: invalid JSON on line ${i + 1}, skipping`);
        return null;
    }
}).filter(Boolean);

if (events.length === 0) {
    console.error("Warning: no valid events found");
    process.exit(0);
}

// --- Parse workflow config from SKILL.md frontmatter ---
let config = { steps: [], topology: "linear", max_rounds: 1 };

if (skillDir) {
    const skillFile = path.join(skillDir, "SKILL.md");
    if (fs.existsSync(skillFile)) {
        const skillContent = fs.readFileSync(skillFile, "utf8");
        const fmMatch = skillContent.match(/^---\n([\s\S]*?)\n---/);
        if (fmMatch) {
            const fm = fmMatch[1];
            const stepsMatch = fm.match(/steps:\s*\[([^\]]*)\]/);
            if (stepsMatch) {
                config.steps = stepsMatch[1].split(",").map(s => s.trim().replace(/["\x27]/g, ""));
            }
            const topoMatch = fm.match(/topology:\s*(\S+)/);
            if (topoMatch) config.topology = topoMatch[1].replace(/["\x27]/g, "");
            const roundsMatch = fm.match(/max_rounds:\s*(\d+)/);
            if (roundsMatch) config.max_rounds = parseInt(roundsMatch[1], 10);
        }
    }
}

// If no config from frontmatter, infer from events
if (config.steps.length === 0) {
    const stepSet = new Set();
    events.forEach(e => { if (e.step) stepSet.add(e.step); });
    config.steps = Array.from(stepSet);
}
const maxRound = Math.max(...events.map(e => e.round || 1), 1);
if (maxRound > 1 && config.topology === "linear") {
    config.topology = "cyclic";
}

// --- Mermaid Export ---
function exportMermaid() {
    const lines = ["flowchart TD"];
    const stepEvents = events.filter(e =>
        e.type === "step_start" || e.type === "step_end"
    );

    // Build nodes: one per (step, round) pair
    const nodes = new Map(); // key: "step_round"
    const nodeOrder = [];

    for (const evt of stepEvents) {
        if (evt.type !== "step_start") continue;
        const key = `${evt.step}_r${evt.round}`;
        if (!nodes.has(key)) {
            nodes.set(key, {
                key, step: evt.step, round: evt.round,
                status: "executing", label: `${evt.step} R${evt.round}`
            });
            nodeOrder.push(key);
        }
    }

    // Update statuses from step_end events
    for (const evt of stepEvents) {
        if (evt.type !== "step_end") continue;
        const key = `${evt.step}_r${evt.round}`;
        const node = nodes.get(key);
        if (node) {
            const vr = evt.detail && evt.detail.validation_result;
            node.status = (vr === "PASS" || !vr) ? "completed" : "failed";
        }
    }

    // Generate node definitions
    for (const [key, node] of nodes) {
        const id = key.replace(/[^a-zA-Z0-9_]/g, "_");
        const shape = node.status === "failed" ? `${id}[/"${node.label}"/]` : `${id}["${node.label}"]`;
        lines.push(`    ${shape}`);
    }

    // Generate edges
    if (config.topology === "cyclic") {
        // Connect steps within each round, then QA → next round analyze
        for (let r = 1; r <= maxRound; r++) {
            const roundSteps = config.steps.filter(s =>
                nodes.has(`${s}_r${r}`)
            );
            for (let i = 0; i < roundSteps.length - 1; i++) {
                const from = `${roundSteps[i]}_r${r}`.replace(/[^a-zA-Z0-9_]/g, "_");
                const to = `${roundSteps[i + 1]}_r${r}`.replace(/[^a-zA-Z0-9_]/g, "_");
                lines.push(`    ${from} --> ${to}`);
            }
            // Cross-round edge
            if (r < maxRound) {
                const lastStep = roundSteps[roundSteps.length - 1];
                const firstNextRound = config.steps.find(s => nodes.has(`${s}_r${r + 1}`));
                if (lastStep && firstNextRound) {
                    const from = `${lastStep}_r${r}`.replace(/[^a-zA-Z0-9_]/g, "_");
                    const to = `${firstNextRound}_r${r + 1}`.replace(/[^a-zA-Z0-9_]/g, "_");
                    // Find QA decision for edge label
                    const qaDecision = events.find(e =>
                        e.type === "decision" && e.round === r
                    );
                    const label = qaDecision && qaDecision.detail && qaDecision.detail.decision
                        ? qaDecision.detail.decision : "continue";
                    lines.push(`    ${from} -->|${label}| ${to}`);
                }
            }
        }
    } else {
        // Linear: connect in order
        for (let i = 0; i < nodeOrder.length - 1; i++) {
            const from = nodeOrder[i].replace(/[^a-zA-Z0-9_]/g, "_");
            const to = nodeOrder[i + 1].replace(/[^a-zA-Z0-9_]/g, "_");
            lines.push(`    ${from} --> ${to}`);
        }
    }

    // Style completed/failed nodes
    for (const [key, node] of nodes) {
        const id = key.replace(/[^a-zA-Z0-9_]/g, "_");
        if (node.status === "completed") {
            lines.push(`    style ${id} fill:#3fb950,stroke:#2ea043,color:#fff`);
        } else if (node.status === "failed") {
            lines.push(`    style ${id} fill:#f85149,stroke:#da3633,color:#fff`);
        } else {
            lines.push(`    style ${id} fill:#1f6feb,stroke:#1158c7,color:#fff`);
        }
    }

    const mermaidContent = lines.join("\n") + "\n";
    const outFile = path.join(traceDir, "execution_dag.mmd");
    fs.writeFileSync(outFile, mermaidContent);
    console.log(`✓ Mermaid DAG written to ${outFile}`);
}

// --- Summary Export ---
function exportSummary() {
    const lines = [
        "# Execution Summary",
        "",
        `**Skill**: ${events[0]?.skill || "unknown"}`,
        `**Total Events**: ${events.length}`,
        `**Rounds**: ${maxRound}`,
        `**Topology**: ${config.topology}`,
        "",
        "## Step Summary",
        "",
        "| Round | Step | Status | Agent | Duration | Output Files | Tags |",
        "|-------|------|--------|-------|----------|--------------|------|",
    ];

    // Pair step_start and step_end events
    const starts = events.filter(e => e.type === "step_start");
    for (const start of starts) {
        const end = events.find(e =>
            e.type === "step_end" && e.step === start.step && e.round === start.round
        );
        const status = end
            ? (end.detail?.validation_result === "PASS" || !end.detail?.validation_result ? "✅ completed" : "❌ failed")
            : "⏳ in progress";
        const duration = (start && end)
            ? `${((new Date(end.ts) - new Date(start.ts)) / 1000).toFixed(1)}s`
            : "-";
        const outputs = end?.detail?.output_files?.join(", ") || "-";
        const tags = start.tags?.join(", ") || "-";

        lines.push(`| ${start.round} | ${start.step} | ${status} | ${start.agent} | ${duration} | ${outputs} | ${tags} |`);
    }

    // Error summary
    const errors = events.filter(e => e.type === "error");
    if (errors.length > 0) {
        lines.push("");
        lines.push("## Errors");
        lines.push("");
        lines.push("| Time | Step | Round | Message |");
        lines.push("|------|------|-------|---------|");
        for (const err of errors) {
            const msg = err.detail?.error_message || err.status_display || "-";
            lines.push(`| ${err.ts} | ${err.step} | ${err.round} | ${msg} |`);
        }
    }

    // Decision summary
    const decisions = events.filter(e => e.type === "decision");
    if (decisions.length > 0) {
        lines.push("");
        lines.push("## Decisions");
        lines.push("");
        lines.push("| Time | Step | Round | Decision | Tags |");
        lines.push("|------|------|-------|----------|------|");
        for (const dec of decisions) {
            const decision = dec.detail?.decision || "-";
            const tags = dec.tags?.join(", ") || "-";
            lines.push(`| ${dec.ts} | ${dec.step} | ${dec.round} | ${decision} | ${tags} |`);
        }
    }

    const summaryContent = lines.join("\n") + "\n";
    const outFile = path.join(traceDir, "execution_summary.md");
    fs.writeFileSync(outFile, summaryContent);
    console.log(`✓ Summary written to ${outFile}`);
}

// --- Timeline Export ---
function exportTimeline() {
    const timeCol = 12;
    const typeCol = 18;
    const stepCol = 14;
    const agentCol = 30;

    console.log("─".repeat(80));
    console.log(` ${"Time".padEnd(timeCol)}${"Type".padEnd(typeCol)}${"Step".padEnd(stepCol)}${"Agent".padEnd(agentCol)}`);
    console.log("─".repeat(80));

    for (const evt of events) {
        const time = evt.ts ? evt.ts.substring(11, 19) : "        ";
        const type = (evt.type || "").padEnd(typeCol);
        const step = `${evt.step || ""} R${evt.round || 1}`.padEnd(stepCol);
        const agent = (evt.agent || "").padEnd(agentCol);
        const icons = {
            step_start: "▶",
            step_end: "■",
            agent_dispatch: "↗",
            agent_return: "↙",
            checkpoint: "◆",
            decision: "◎",
            error: "✖",
        };
        const icon = icons[evt.type] || "·";
        console.log(` ${time.padEnd(timeCol)}${icon} ${type}${step}${agent}`);
    }

    console.log("─".repeat(80));
    console.log(` Total: ${events.length} events, ${maxRound} round(s)`);
}

// --- Main ---
switch (format) {
    case "mermaid": exportMermaid(); break;
    case "summary": exportSummary(); break;
    case "timeline": exportTimeline(); break;
}
' "$TRACE_FILE" "$FORMAT" "$SKILL_DIR"
