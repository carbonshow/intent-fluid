#!/usr/bin/env bash
# grader-tests.sh — Unit tests for grader.js against an sp1-style fixture.
# Run from repo root: bash skills/slidev/evals/sp1-scenarios/fixtures/grader-tests.sh
# Exit 0 = all pass, 1 = any fail.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_ROOT="$(cd "$SCRIPT_DIR/../../../../.." && pwd)/skills/slidev"
VALID_SLIDES="$SKILL_ROOT/evals/sp1-scenarios/fixtures/valid.md"
GRADER="$SKILL_ROOT/scripts/lib/grader.js"

PASS=0; FAIL=0
pass() { PASS=$((PASS+1)); echo "  PASS  Test $1: $2"; }
fail() { FAIL=$((FAIL+1)); echo "  FAIL  Test $1: $2"; }

# Create a temp deck dir wrapping the valid.md fixture
DECK=$(mktemp -d)
cp "$VALID_SLIDES" "$DECK/slides.md"

# Run grader
REPORT=$(node "$GRADER" "$DECK" 2>&1)

# ── Test 1: output is valid JSON ─────────────────────────────────────────────
if echo "$REPORT" | python3 -m json.tool > /dev/null 2>&1; then
  pass 1 "grader.js emits valid JSON on sp1 valid.md fixture"
else
  fail 1 "grader.js output not valid JSON: $REPORT"
fi

# ── Test 2: slides.total >= 1 ────────────────────────────────────────────────
TOTAL=$(echo "$REPORT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['slides']['total'])" 2>/dev/null || echo "0")
if [[ "$TOTAL" -ge 1 ]]; then
  pass 2 "slides.total ($TOTAL) >= 1"
else
  fail 2 "slides.total ($TOTAL) is 0 — parser returned nothing"
fi

# ── Test 3: all required top-level keys present ───────────────────────────────
KEYS_OK=$(echo "$REPORT" | python3 -c "
import sys, json
d = json.load(sys.stdin)
required = ['deck','sha','timestamp','slides','text','images','validation','review','theme']
missing = [k for k in required if k not in d]
print('OK' if not missing else 'MISSING: ' + ', '.join(missing))
" 2>/dev/null || echo "ERR")
if [[ "$KEYS_OK" == "OK" ]]; then
  pass 3 "all required top-level keys present in report"
else
  fail 3 "report missing keys: $KEYS_OK"
fi

# ── Test 4: validation.exit_code is 0 for valid fixture ──────────────────────
VAL_EXIT=$(echo "$REPORT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['validation']['exit_code'])" 2>/dev/null || echo "ERR")
if [[ "$VAL_EXIT" == "0" ]]; then
  pass 4 "validation.exit_code=0 for valid.md fixture"
else
  fail 4 "validation.exit_code=$VAL_EXIT (expected 0 for valid.md)"
fi

rm -rf "$DECK"

echo ""
echo "SP1 grader tests: $PASS passed, $FAIL failed"
if [[ "$FAIL" -gt 0 ]]; then exit 1; fi
