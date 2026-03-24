#!/usr/bin/env bash
# validate-skill.sh — Check that a skill directory conforms to the intent-fluid spec.
# Usage: bash scripts/validate-skill.sh skills/<skill-name>

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

errors=0

fail() {
  echo -e "${RED}FAIL${NC}: $1"
  errors=$((errors + 1))
}

pass() {
  echo -e "${GREEN}PASS${NC}: $1"
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

# ── 4. Extract frontmatter ──────────────────────────
# Read between the first two '---' lines
FRONTMATTER=$(awk '/^---$/{n++; next} n==1{print} n>=2{exit}' "$SKILL_FILE")

if [[ -z "$FRONTMATTER" ]]; then
  fail "No YAML frontmatter found (expected --- delimiters)"
  exit 1
fi

# ── 5. Extract 'name' field ─────────────────────────
NAME=$(echo "$FRONTMATTER" | grep -E '^name:' | head -1 | sed 's/^name:[[:space:]]*//' | sed 's/^["'\'']//' | sed 's/["'\'']$//')

if [[ -z "$NAME" ]]; then
  fail "Frontmatter missing required field: name"
else
  pass "Frontmatter has 'name': $NAME"
fi

# ── 6. Name matches directory name ──────────────────
if [[ -n "$NAME" && "$NAME" != "$DIR_NAME" ]]; then
  fail "Frontmatter name '$NAME' does not match directory name '$DIR_NAME'"
elif [[ -n "$NAME" ]]; then
  pass "Frontmatter name matches directory name"
fi

# ── 7. Extract 'description' field ──────────────────
DESCRIPTION=$(echo "$FRONTMATTER" | grep -E '^description:' | head -1 | sed 's/^description:[[:space:]]*//' | sed 's/^["'\'']//' | sed 's/["'\'']$//')

if [[ -z "$DESCRIPTION" ]]; then
  fail "Frontmatter missing required field: description"
else
  pass "Frontmatter has 'description'"
fi

# ── 8. Description length ≤ 1024 chars ──────────────
if [[ -n "$DESCRIPTION" ]]; then
  DESC_LEN=${#DESCRIPTION}
  if [[ $DESC_LEN -gt 1024 ]]; then
    fail "Description is $DESC_LEN chars (max 1024)"
  else
    pass "Description length OK ($DESC_LEN chars)"
  fi
fi

# ── Summary ─────────────────────────────────────────
echo ""
if [[ $errors -eq 0 ]]; then
  echo -e "${GREEN}All checks passed for '$DIR_NAME'${NC}"
  exit 0
else
  echo -e "${RED}$errors check(s) failed for '$DIR_NAME'${NC}"
  exit 1
fi
