#!/usr/bin/env bash
# trace.sh — Append a structured trace event to a JSONL file.
# Framework-level script: works with any intent-fluid skill.
# PREREQUISITE: Node.js 12+ must be available on PATH.
#
# Usage: bash scripts/trace.sh <trace_file> <skill> <type> <step> <round> <agent> [detail_json]
#
# Arguments:
#   trace_file   Path to the trace.jsonl file
#   skill        Skill name (e.g., "surge", "code-review")
#   type         Event type: step_start|step_end|agent_dispatch|agent_return|checkpoint|decision|error
#   step         Current step name (e.g., "analyze", "scan")
#   round        Current round number (1-indexed)
#   agent        Agent identifier (e.g., "director", "subagent:analyze")
#   detail_json  Optional JSON string for extra metadata (default: "{}")
#
# Example:
#   bash scripts/trace.sh ./trace.jsonl surge step_start analyze 1 director '{"input_files":["context.md"]}'

set -euo pipefail

# --- Node.js check ---
if ! command -v node &>/dev/null; then
    echo "Error: Node.js is required but not found on PATH." >&2
    echo "trace.sh uses Node.js for JSON generation." >&2
    exit 1
fi

# --- Usage ---
usage() {
    echo "Usage: bash scripts/trace.sh <trace_file> <skill> <type> <step> <round> <agent> [detail_json]"
    echo ""
    echo "Arguments:"
    echo "  trace_file   Path to trace.jsonl"
    echo "  skill        Skill name (e.g., surge)"
    echo "  type         Event type (step_start|step_end|agent_dispatch|agent_return|checkpoint|decision|error)"
    echo "  step         Current step name"
    echo "  round        Current round number"
    echo "  agent        Agent identifier"
    echo "  detail_json  Optional JSON metadata (default: {})"
    echo ""
    echo "Example:"
    echo "  bash scripts/trace.sh ./trace.jsonl surge step_start analyze 1 director '{\"input_files\":[\"context.md\"]}'"
    exit 1
}

if [[ $# -lt 6 ]]; then
    usage
fi

TRACE_FILE="$1"
SKILL="$2"
TYPE="$3"
STEP="$4"
ROUND="$5"
AGENT="$6"
DETAIL_JSON="${7:-"{}"}"

# Validate trace file parent directory exists
TRACE_DIR=$(dirname "$TRACE_FILE")
if [[ ! -d "$TRACE_DIR" ]]; then
    echo "Error: directory does not exist: ${TRACE_DIR}" >&2
    exit 1
fi

# Create trace file if it doesn't exist
if [[ ! -f "$TRACE_FILE" ]]; then
    touch "$TRACE_FILE"
fi

# Use Node.js to generate the event JSON and append atomically
# Pass DETAIL_JSON via environment variable to avoid shell quoting issues
DETAIL_JSON_ENV="$DETAIL_JSON" node -e '
const fs = require("fs");
const path = require("path");

const traceFile = process.argv[1];
const skill = process.argv[2];
const type = process.argv[3];
const step = process.argv[4];
const round = parseInt(process.argv[5], 10);
const agent = process.argv[6];
const detailJsonStr = process.env.DETAIL_JSON_ENV || "{}";

// Count existing lines for auto-incrementing ID
let lineCount = 0;
try {
    const content = fs.readFileSync(traceFile, "utf8").trim();
    if (content.length > 0) {
        lineCount = content.split("\n").length;
    }
} catch (e) {
    // File may be empty or not exist yet
}

const eventId = "evt_" + String(lineCount + 1).padStart(3, "0");
const ts = new Date().toISOString();

// Parse detail JSON
let detail = {};
let tags = [];
try {
    const parsed = JSON.parse(detailJsonStr);
    if (parsed.tags && Array.isArray(parsed.tags)) {
        tags = parsed.tags;
        delete parsed.tags;
    }
    detail = parsed;
} catch (e) {
    console.error("Warning: invalid detail_json, using empty object: " + e.message);
    detail = {};
}

// Extract parent_id from detail if present
let parentId = null;
if (detail.parent_id !== undefined) {
    parentId = detail.parent_id;
    delete detail.parent_id;
}

// Determine status and status_display from type
const statusMap = {
    step_start: { status: "executing", emoji: "⚡" },
    step_end: { status: "completed", emoji: "✅" },
    agent_dispatch: { status: "executing", emoji: "📤" },
    agent_return: { status: "completed", emoji: "📥" },
    checkpoint: { status: "waiting", emoji: "🔶" },
    decision: { status: "decided", emoji: "🎯" },
    error: { status: "failed", emoji: "❌" },
};

const statusInfo = statusMap[type] || { status: type, emoji: "📋" };
const statusDisplay = detail.status_display ||
    `${statusInfo.emoji} [${step}] ${type.replace(/_/g, " ")} — ${agent}`;

// Remove status_display from detail if it was there
delete detail.status_display;

const event = {
    id: eventId,
    ts: ts,
    skill: skill,
    type: type,
    step: step,
    round: round,
    agent: agent,
    status: detail.status || statusInfo.status,
    status_display: statusDisplay,
    detail: detail,
    parent_id: parentId,
    tags: tags,
};

// Remove status from detail if it was set there
delete event.detail.status;

// Append as single line
const line = JSON.stringify(event) + "\n";
fs.appendFileSync(traceFile, line);

// Output the event ID for caller reference
console.log(eventId);
' "$TRACE_FILE" "$SKILL" "$TYPE" "$STEP" "$ROUND" "$AGENT"
