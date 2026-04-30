#!/usr/bin/env bash
# init.sh - Initialize surge Context Package for a new task.
# Reduces manual directory creation and file copying during Step 1/2.

set -euo pipefail

# --- Usage ---
usage() {
    echo "Usage: bash scripts/init.sh [--force] <surge_root> <task_id>"
    echo ""
    echo "Arguments:"
    echo "  surge_root  surge workspace directory (e.g., .surge)"
    echo "  task_id     task identifier (e.g., 20260319-abc1)"
    echo ""
    echo "Options:"
    echo "  --force     Re-initialize an existing task directory (only creates missing files,"
    echo "              never overwrites existing ones). Useful for recovering from partial init."
    echo ""
    echo "Example: bash scripts/init.sh .surge 20260319-abc1"
    echo "         bash scripts/init.sh --force .surge 20260319-abc1"
    exit 1
}

# Parse --force flag
FORCE=false
POSITIONAL=()
for arg in "$@"; do
    if [[ "$arg" == "--force" ]]; then
        FORCE=true
    else
        POSITIONAL+=("$arg")
    fi
done

if [[ ${#POSITIONAL[@]} -ne 2 ]]; then
    usage
fi

SURGE_ROOT="${POSITIONAL[0]}"
TASK_ID="${POSITIONAL[1]}"
SKILL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TASK_DIR="${SURGE_ROOT}/tasks/${TASK_ID}"

# Validate skill_dir exists
if [[ ! -d "$SKILL_DIR" ]]; then
    echo "Error: skill directory does not exist: ${SKILL_DIR}" >&2
    exit 1
fi

# Validate assets/rules.md exists in skill_dir
if [[ ! -f "${SKILL_DIR}/assets/rules.md" ]]; then
    echo "Error: asset file does not exist: ${SKILL_DIR}/assets/rules.md" >&2
    exit 1
fi

# Check if task directory already exists
if [[ -d "$TASK_DIR" ]]; then
    if [[ "$FORCE" == true ]]; then
        echo "Re-initializing existing task directory (--force mode)..."
        echo "  Only missing files will be created; existing files are preserved."
    else
        echo "Warning: task directory already exists: ${TASK_DIR}" >&2
        echo "Skipping initialization to avoid overwriting existing data." >&2
        echo "" >&2
        echo "Hint: use --force to safely re-initialize (creates missing files only)." >&2
        exit 1
    fi
fi

echo "Initializing Context Package..."
echo "  surge_root: ${SURGE_ROOT}"
echo "  task_id:    ${TASK_ID}"
echo ""

# Create task directory and iterations/
mkdir -p "${TASK_DIR}/iterations"
touch "${TASK_DIR}/iterations/.gitkeep"

# Create candidates/ if not exists
mkdir -p "${SURGE_ROOT}/candidates"

# Copy rules.md if not exists
if [[ ! -f "${SURGE_ROOT}/rules.md" ]]; then
    cp "${SKILL_DIR}/assets/rules.md" "${SURGE_ROOT}/rules.md"
    echo "  ✓ Copied rules.md → ${SURGE_ROOT}/rules.md"
else
    echo "  - rules.md already exists, skipping copy"
fi

# Generate state.md with default values (skip if exists in --force mode)
if [[ ! -f "${TASK_DIR}/state.md" ]]; then
    cat > "${TASK_DIR}/state.md" << EOF
task_id: "${TASK_ID}"
surge_root: "${SURGE_ROOT}"
current_phase: analyze
iteration: 1
iteration_type: "full"
acceptance_modifications: 0
last_deviation_level: null
deliverable_type: null
current_eval_level: "L1"
last_quality_assessment: null
quality_history: []
optimization_directives: []
plateau_count: 0
status: in_progress
max_iterations: 5
parallel_agent_limit: 10
notes: ""
expert_roles: []
design_checkpoint: null
expert_review_summary: null
trace_file: null
EOF
    echo "  ✓ Generated state.md"
else
    echo "  - state.md already exists, skipping"
fi

# Create empty context.md (skip if exists)
if [[ ! -f "${TASK_DIR}/context.md" ]]; then
    touch "${TASK_DIR}/context.md"
    echo "  ✓ Created context.md"
else
    echo "  - context.md already exists, skipping"
fi

# Create empty memory_draft.md (skip if exists)
if [[ ! -f "${TASK_DIR}/memory_draft.md" ]]; then
    touch "${TASK_DIR}/memory_draft.md"
    echo "  ✓ Created memory_draft.md"
else
    echo "  - memory_draft.md already exists, skipping"
fi

# Create empty trace.jsonl for execution tracing (skip if exists)
if [[ ! -f "${TASK_DIR}/trace.jsonl" ]]; then
    touch "${TASK_DIR}/trace.jsonl"
    echo "  ✓ Created trace.jsonl"
else
    echo "  - trace.jsonl already exists, skipping"
fi

# Create empty test_cases.md (skip if exists)
if [[ ! -f "${TASK_DIR}/test_cases.md" ]]; then
    touch "${TASK_DIR}/test_cases.md"
    echo "  ✓ Created test_cases.md"
else
    echo "  - test_cases.md already exists, skipping"
fi

# Create epistemic audit artifacts (skip if exists)
if [[ ! -f "${TASK_DIR}/epistemic-ledger.md" ]]; then
    cat > "${TASK_DIR}/epistemic-ledger.md" << 'EOF'
# Epistemic Ledger

This file tracks hypotheses, claims, evidence, confidence, and decision impact for the surge task.

| ID | Type | Statement | Prediction / Observable | Supporting Evidence | Opposing Evidence | Confidence | Delta | Decision Impact | Owner Phase |
|---|---|---|---|---|---|---|---|---|---|
EOF
    echo "  ✓ Created epistemic-ledger.md"
else
    echo "  - epistemic-ledger.md already exists, skipping"
fi

if [[ ! -f "${TASK_DIR}/falsification.md" ]]; then
    cat > "${TASK_DIR}/falsification.md" << 'EOF'
# Falsification Checks

Use this file when high-impact claims, architecture choices, expert vetoes, or contested document claims need explicit disconfirmation checks.

| Claim ID | What Would Prove It Wrong | Search / Test Performed | Result | Residual Risk | Decision |
|---|---|---|---|---|---|
EOF
    echo "  ✓ Created falsification.md"
else
    echo "  - falsification.md already exists, skipping"
fi

if [[ ! -f "${TASK_DIR}/convergence-audit.md" ]]; then
    cat > "${TASK_DIR}/convergence-audit.md" << 'EOF'
# Convergence Audit

Convergence requires more than polished output. Record concrete evidence for each passing check.

| Check | Status | Evidence |
|---|---|---|
| Acceptance criteria passed at current eval level | fail | |
| High-confidence claims have evidence | fail | |
| Important opposing evidence handled | fail | |
| Optimization directives executed or retired | fail | |
| Remaining gaps are low impact or user-accepted | fail | |
| Quality is not being optimized at the expense of user value | fail | |
| Stop rule is explicit | fail | |
EOF
    echo "  ✓ Created convergence-audit.md"
else
    echo "  - convergence-audit.md already exists, skipping"
fi

if [[ ! -f "${TASK_DIR}/platform-capabilities.md" ]]; then
    cat > "${TASK_DIR}/platform-capabilities.md" << 'EOF'
# Platform Capabilities

Record the available execution path for this task. Keep the artifact contract stable across Claude/Cursor/Gemini; only the execution mechanism changes.

| Capability | Preferred Path | Fallback Path | Notes |
|---|---|---|---|
| Claude/Cursor/Gemini runtime | Detect available host features | Use the shared file protocol and serial execution | Do not assume host-specific tools exist. |
| Parallel subagents | Dispatch up to parallel_agent_limit | Run serially using the same task packages | Preserve output files either way. |
| Web search / fetch | Save raw materials per search/fetch call | Ask user for source files or URLs; mark evidence as user-provided | Do not pretend unavailable browsing happened. |
| User question UI | Native question/checkpoint tool | Plain text prompt and wait | Core ambiguity gates still apply. |
| File edits | Native write/edit tools | Platform editor or shell-safe file operations | Preserve task directory structure. |
| Script execution | Bash/Node.js helpers | Manual checklist fallback | Scripts accelerate stable checks; manual fallback must keep the same fields. |
EOF
    echo "  ✓ Created platform-capabilities.md"
else
    echo "  - platform-capabilities.md already exists, skipping"
fi

echo ""
echo "Directory Structure:"
echo "${SURGE_ROOT}/"
echo "├── rules.md"
echo "├── candidates/"
echo "└── tasks/"
echo "    └── ${TASK_ID}/"
echo "        ├── state.md"
echo "        ├── context.md"
echo "        ├── memory_draft.md"
echo "        ├── trace.jsonl"
echo "        ├── test_cases.md"
echo "        ├── epistemic-ledger.md"
echo "        ├── falsification.md"
echo "        ├── convergence-audit.md"
echo "        ├── platform-capabilities.md"
echo "        └── iterations/"
echo "            └── .gitkeep"
echo ""
echo "Initialization Complete ✓"
