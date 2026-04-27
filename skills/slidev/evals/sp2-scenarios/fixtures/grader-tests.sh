#!/usr/bin/env bash
# grader-tests.sh — Unit tests for grader.js against the sp2 minimal-deck fixture.
# Run from repo root: bash skills/slidev/evals/sp2-scenarios/fixtures/grader-tests.sh
# Exit 0 = all pass, 1 = any fail.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_ROOT="$(cd "$SCRIPT_DIR/../../../../.." && pwd)/skills/slidev"
FIXTURE="$SKILL_ROOT/evals/sp2-scenarios/fixtures/minimal-deck"
GRADER="$SKILL_ROOT/scripts/lib/grader.js"
PARSER="$SKILL_ROOT/scripts/lib/slides-parser.js"
VAL="$SKILL_ROOT/scripts/validate-slides.sh"

PASS=0; FAIL=0
pass() { PASS=$((PASS+1)); echo "  PASS  Test $1: $2"; }
fail() { FAIL=$((FAIL+1)); echo "  FAIL  Test $1: $2"; }

REPORT=$(node "$GRADER" "$FIXTURE" 2>&1)

# ── Test 1: output is valid JSON ─────────────────────────────────────────────
if echo "$REPORT" | python3 -m json.tool > /dev/null 2>&1; then
  pass 1 "grader.js emits valid JSON"
else
  fail 1 "grader.js output is not valid JSON: $REPORT"
fi

# ── Test 2: slides.total matches parser ──────────────────────────────────────
# slides-parser.js parseSlides gives multiple records for double-col slides.
# We count unique indices the same way grader.js does.
PARSER_COUNT=$(node --input-type=module - "$FIXTURE/slides.md" "$PARSER" <<'EOF'
const [,, slidesPath, parserPath] = process.argv;
const { readFileSync } = await import('node:fs');
const { parseSlides } = await import(parserPath);
const md = readFileSync(slidesPath, 'utf8');
const slides = parseSlides(md);
const unique = new Set(slides.map(s => s.index));
process.stdout.write(String(unique.size) + '\n');
EOF
)
GRADER_TOTAL=$(echo "$REPORT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['slides']['total'])" 2>/dev/null || echo "ERR")
if [[ "$GRADER_TOTAL" == "$PARSER_COUNT" ]]; then
  pass 2 "slides.total ($GRADER_TOTAL) matches parser unique-index count ($PARSER_COUNT)"
else
  fail 2 "slides.total ($GRADER_TOTAL) != parser count ($PARSER_COUNT)"
fi

# ── Test 3: validation fields match validate-slides.sh exit ──────────────────
bash "$VAL" "$FIXTURE/slides.md" > /dev/null 2>&1; VAL_EXIT=$?
GRADER_EXIT=$(echo "$REPORT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['validation']['exit_code'])" 2>/dev/null || echo "ERR")
if [[ "$GRADER_EXIT" == "$VAL_EXIT" ]]; then
  pass 3 "validation.exit_code ($GRADER_EXIT) matches validate-slides.sh exit ($VAL_EXIT)"
else
  fail 3 "validation.exit_code ($GRADER_EXIT) != validate-slides.sh exit ($VAL_EXIT)"
fi

# ── Test 4: image counts match filesystem ─────────────────────────────────────
SVG_COUNT=$(find "$FIXTURE/public/generated" -name '*.svg' 2>/dev/null | wc -l | tr -d ' \n' || true)
GRADER_PLACEHOLDERS=$(echo "$REPORT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['images']['placeholders'])" 2>/dev/null || echo "ERR")
if [[ "$GRADER_PLACEHOLDERS" == "$SVG_COUNT" ]]; then
  pass 4 "images.placeholders ($GRADER_PLACEHOLDERS) matches public/generated/ SVG count ($SVG_COUNT)"
else
  fail 4 "images.placeholders ($GRADER_PLACEHOLDERS) != SVG count ($SVG_COUNT)"
fi

echo ""
echo "SP2 grader tests: $PASS passed, $FAIL failed"
if [[ "$FAIL" -gt 0 ]]; then exit 1; fi
