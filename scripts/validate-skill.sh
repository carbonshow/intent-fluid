#!/usr/bin/env bash
# validate-skill.sh — Check that a skill directory conforms to the intent-fluid spec.
# Usage: bash scripts/validate-skill.sh skills/<skill-name>

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

errors=0
warnings=0

fail() {
  echo -e "${RED}FAIL${NC}: $1"
  errors=$((errors + 1))
}

warn() {
  echo -e "${YELLOW}WARN${NC}: $1"
  warnings=$((warnings + 1))
}

pass() {
  echo -e "${GREEN}PASS${NC}: $1"
}

ALLOWED_TOP_LEVEL=("SKILL.md" "agents" "scripts" "references" "assets")

is_allowed_top_level() {
  local entry="$1"
  local allowed
  for allowed in "${ALLOWED_TOP_LEVEL[@]}"; do
    if [[ "$entry" == "$allowed" ]]; then
      return 0
    fi
  done
  return 1
}

# ── Argument check ──────────────────────────────────
if [[ $# -lt 1 ]]; then
  echo "Usage: bash scripts/validate-skill.sh <skill-directory>"
  echo "Example: bash scripts/validate-skill.sh skills/surge"
  exit 1
fi

SKILL_DIR="${1%/}" # strip trailing slash

# ── 1. Directory exists ─────────────────────────────
if [[ ! -d "$SKILL_DIR" ]]; then
  fail "Directory '$SKILL_DIR' does not exist"
  exit 1
fi

# ── 2. Directory name uses only [a-z0-9-] ──────────
DIR_NAME=$(basename "$SKILL_DIR")

if [[ ! "$DIR_NAME" =~ ^[a-z0-9-]+$ ]]; then
  fail "Directory name '$DIR_NAME' contains invalid characters (allowed: [a-z0-9-])"
else
  pass "Directory name '$DIR_NAME' uses valid characters"
fi

# ── 3. SKILL.md exists ──────────────────────────────
SKILL_FILE="$SKILL_DIR/SKILL.md"

if [[ ! -f "$SKILL_FILE" ]]; then
  fail "SKILL.md not found in '$SKILL_DIR'"
  exit 1
else
  pass "SKILL.md exists"
fi

# ── 4. Skill-local README is forbidden ─────────────
if [[ -f "$SKILL_DIR/README.md" ]]; then
  fail "README.md is not allowed inside a skill directory"
else
  pass "No skill-local README.md"
fi

# ── 5. Only approved top-level entries exist ───────
while IFS= read -r entry; do
  base=$(basename "$entry")
  if ! is_allowed_top_level "$base"; then
    fail "Unsupported top-level entry '$base' in '$DIR_NAME'"
  fi
done < <(find "$SKILL_DIR" -mindepth 1 -maxdepth 1 | sort)

if [[ $errors -eq 0 ]]; then
  pass "Top-level entries match the canonical skill layout"
fi

# ── 6. Extract frontmatter ──────────────────────────
# Read between the first two '---' lines
FRONTMATTER=$(awk '/^---$/{n++; next} n==1{print} n>=2{exit}' "$SKILL_FILE")

if [[ -z "$FRONTMATTER" ]]; then
  fail "No YAML frontmatter found (expected --- delimiters)"
  exit 1
fi

# ── 7. Extract 'name' field ─────────────────────────
NAME=$(echo "$FRONTMATTER" | grep -E '^name:' | head -1 | sed 's/^name:[[:space:]]*//' | sed 's/^["'\'']//' | sed 's/["'\'']$//')

if [[ -z "$NAME" ]]; then
  fail "Frontmatter missing required field: name"
else
  pass "Frontmatter has 'name': $NAME"
fi

# ── 8. Name matches directory name ──────────────────
if [[ -n "$NAME" && "$NAME" != "$DIR_NAME" ]]; then
  fail "Frontmatter name '$NAME' does not match directory name '$DIR_NAME'"
elif [[ -n "$NAME" ]]; then
  pass "Frontmatter name matches directory name"
fi

# ── 9. Extract 'description' field ──────────────────
DESCRIPTION=$(echo "$FRONTMATTER" | grep -E '^description:' | head -1 | sed 's/^description:[[:space:]]*//' | sed 's/^["'\'']//' | sed 's/["'\'']$//')

if [[ -z "$DESCRIPTION" ]]; then
  fail "Frontmatter missing required field: description"
else
  pass "Frontmatter has 'description'"
fi

# ── 10. Description length ≤ 1024 chars ─────────────
if [[ -n "$DESCRIPTION" ]]; then
  DESC_LEN=${#DESCRIPTION}
  if [[ $DESC_LEN -gt 1024 ]]; then
    fail "Description is $DESC_LEN chars (max 1024)"
  else
    pass "Description length OK ($DESC_LEN chars)"
  fi
fi

# ── Summary ─────────────────────────────────────────

# ── 11. Validate trace frontmatter (non-blocking) ────
# Uses Node.js for YAML-like parsing of the trace block
if echo "$FRONTMATTER" | grep -qE '^trace:'; then
  if command -v node &>/dev/null; then
    node -e '
const frontmatter = process.argv[1];
const lines = frontmatter.split("\n");
let inTrace = false;
let traceLines = [];
for (const line of lines) {
  if (/^trace:/.test(line)) { inTrace = true; continue; }
  if (inTrace) {
    if (/^[a-z]/.test(line)) break; // next top-level field
    traceLines.push(line);
  }
}
const traceBlock = traceLines.join("\n");

// Check steps
const stepsMatch = traceBlock.match(/steps:\s*\[([^\]]*)\]/);
if (!stepsMatch || stepsMatch[1].trim().length === 0) {
  console.log("WARN:trace.steps is empty or missing");
} else {
  console.log("PASS:trace.steps declared");
}

// Check topology
const topoMatch = traceBlock.match(/topology:\s*(\S+)/);
if (!topoMatch) {
  console.log("WARN:trace.topology is missing");
} else {
  const topo = topoMatch[1].replace(/["\x27]/g, "");
  if (!["linear", "cyclic", "dag"].includes(topo)) {
    console.log("WARN:trace.topology has invalid value: " + topo + " (expected: linear|cyclic|dag)");
  } else {
    console.log("PASS:trace.topology is valid: " + topo);
  }
}

// Check max_rounds if present
const roundsMatch = traceBlock.match(/max_rounds:\s*(\S+)/);
if (roundsMatch) {
  const val = parseInt(roundsMatch[1], 10);
  if (isNaN(val) || val < 1) {
    console.log("WARN:trace.max_rounds must be a positive integer, got: " + roundsMatch[1]);
  } else {
    console.log("PASS:trace.max_rounds is valid: " + val);
  }
}
' "$FRONTMATTER" | while IFS=: read -r level msg; do
      if [[ "$level" == "WARN" ]]; then
        warn "$msg"
      elif [[ "$level" == "PASS" ]]; then
        pass "$msg"
      fi
    done
  else
    warn "trace field found but Node.js not available for validation"
  fi
else
  pass "No trace field (optional)"
fi

# ── Summary ─────────────────────────────────────────
echo ""
if [[ $errors -eq 0 && $warnings -eq 0 ]]; then
  echo -e "${GREEN}All checks passed for '$DIR_NAME'${NC}"
  exit 0
elif [[ $errors -eq 0 ]]; then
  echo -e "${GREEN}All checks passed for '$DIR_NAME'${NC} (${YELLOW}$warnings warning(s)${NC})"
  exit 0
else
  echo -e "${RED}$errors check(s) failed for '$DIR_NAME'${NC}$(if [[ $warnings -gt 0 ]]; then echo " (${YELLOW}$warnings warning(s)${NC})"; fi)"
  exit 1
fi
