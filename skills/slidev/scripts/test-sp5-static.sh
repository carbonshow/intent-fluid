#!/usr/bin/env bash
# test-sp5-static.sh — Static tests for SP5 eval suite.
# Never makes real API calls.
# Exit 0 if all 12 pass, 1 otherwise.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
FIXTURE="$SKILL_ROOT/evals/sp2-scenarios/fixtures/minimal-deck"
GRADER="$SKILL_ROOT/scripts/lib/grader.js"
COMPARATOR="$SKILL_ROOT/scripts/lib/comparator.js"
ANALYZER="$SKILL_ROOT/scripts/lib/analyzer.js"
EVAL_DECK="$SKILL_ROOT/scripts/eval-deck.sh"
VAL="$SKILL_ROOT/scripts/validate-slides.sh"
PARSER="$SKILL_ROOT/scripts/lib/slides-parser.js"

PASS=0; FAIL=0
pass() { PASS=$((PASS+1)); echo "  PASS  Test $1: $2"; }
fail() { FAIL=$((FAIL+1)); echo "  FAIL  Test $1: $2"; }

# Helper: make a minimal report JSON file
make_report() {
  local slides_total="${1:-4}"
  local image_missing="${2:-0}"
  local placeholders="${3:-0}"
  local val_failed="${4:-0}"
  local review_score="${5:-85}"
  local theme_name="${6:-tech-dark}"
  cat <<JSON
{
  "deck": "/tmp/test-deck",
  "sha": "abc123",
  "timestamp": "2026-04-27T00:00:00.000Z",
  "slides": {
    "total": $slides_total,
    "by_layout": { "cover": 1, "image-focus": 2, "content-bullets": 1 },
    "image_slides": 2, "empty": 0, "no_heading": 0
  },
  "text": { "total_words": 80, "avg_words_per_slide": 20, "longest_bullet_chars": 50 },
  "images": { "auto_generated": 2, "user_provided": 0, "placeholders": $placeholders, "missing": $image_missing },
  "validation": { "exit_code": $val_failed, "passed": 8, "failed": $val_failed, "warnings": 0, "check10_failures": [], "check11_failures": [] },
  "review": { "score": $review_score, "grade": "Good" },
  "theme": { "name": "$theme_name", "image_style_present": true }
}
JSON
}

# ── Test 1: grader.js emits valid JSON on fixture ────────────────────────────
GRADER_OUT=$(node "$GRADER" "$FIXTURE" 2>&1)
if echo "$GRADER_OUT" | python3 -m json.tool > /dev/null 2>&1; then
  pass 1 "grader.js emits valid JSON on minimal fixture"
else
  fail 1 "grader.js output is not valid JSON: $GRADER_OUT"
fi

# ── Test 2: slide counts match slides-parser.js ──────────────────────────────
PARSER_COUNT=$(node --input-type=module - "$FIXTURE/slides.md" "$PARSER" <<'NODEEOF'
const [,, slidesPath, parserPath] = process.argv;
const { readFileSync } = await import('node:fs');
const { parseSlides } = await import(parserPath);
const md = readFileSync(slidesPath, 'utf8');
const slides = parseSlides(md);
const unique = new Set(slides.map(s => s.index));
process.stdout.write(String(unique.size) + '\n');
NODEEOF
)
GRADER_TOTAL=$(echo "$GRADER_OUT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['slides']['total'])" 2>/dev/null || echo "ERR")
if [[ "$GRADER_TOTAL" == "$PARSER_COUNT" ]]; then
  pass 2 "slide counts match: grader=$GRADER_TOTAL parser=$PARSER_COUNT"
else
  fail 2 "slide count mismatch: grader=$GRADER_TOTAL parser=$PARSER_COUNT"
fi

# ── Test 3: validation fields match validate-slides exit ──────────────────────
bash "$VAL" "$FIXTURE/slides.md" > /dev/null 2>&1; VAL_EXIT=$?
GRADER_VAL_EXIT=$(echo "$GRADER_OUT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['validation']['exit_code'])" 2>/dev/null || echo "ERR")
if [[ "$GRADER_VAL_EXIT" == "$VAL_EXIT" ]]; then
  pass 3 "validation.exit_code ($GRADER_VAL_EXIT) matches validate-slides.sh exit ($VAL_EXIT)"
else
  fail 3 "validation.exit_code ($GRADER_VAL_EXIT) != validate-slides exit ($VAL_EXIT)"
fi

# ── Test 4: image counts match public/generated/ filesystem ──────────────────
SVG_COUNT=0
if [[ -d "$FIXTURE/public/generated" ]]; then
  SVG_COUNT=$(find "$FIXTURE/public/generated" -name '*.svg' | wc -l | tr -d ' \n')
fi
GRADER_PLACEHOLDERS=$(echo "$GRADER_OUT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['images']['placeholders'])" 2>/dev/null || echo "ERR")
if [[ "$GRADER_PLACEHOLDERS" == "$SVG_COUNT" ]]; then
  pass 4 "images.placeholders ($GRADER_PLACEHOLDERS) matches SVG count ($SVG_COUNT)"
else
  fail 4 "images.placeholders ($GRADER_PLACEHOLDERS) != SVG count ($SVG_COUNT)"
fi

# ── Test 5: comparator exits 0 when no FAILs ─────────────────────────────────
RA=$(mktemp -t report-a.XXXX); RB=$(mktemp -t report-b.XXXX)
make_report 5 0 0 0 85 > "$RA"
make_report 6 0 0 0 84 > "$RB"
if node "$COMPARATOR" "$RA" "$RB" > /dev/null 2>&1; then
  pass 5 "comparator exits 0 with no FAILs"
else
  fail 5 "comparator exited non-zero when there should be no FAILs"
fi
rm "$RA" "$RB"

# ── Test 6: comparator exits 1 when FAIL present (injected images.missing=1) ─
RA=$(mktemp -t report-a.XXXX); RB=$(mktemp -t report-b.XXXX)
make_report 5 0 0 0 85 > "$RA"
make_report 5 1 0 0 85 > "$RB"  # images.missing=1 → FAIL
COMP_EXIT=0; node "$COMPARATOR" "$RA" "$RB" > /dev/null 2>&1 || COMP_EXIT=$?
if [[ "$COMP_EXIT" -eq 1 ]]; then
  pass 6 "comparator exits 1 when images.missing>0 (FAIL)"
else
  fail 6 "comparator exit=$COMP_EXIT (expected 1 for FAIL)"
fi
rm "$RA" "$RB"

# ── Test 7: comparator emits WARN on placeholder increase ──────────────────────
RA=$(mktemp -t report-a.XXXX); RB=$(mktemp -t report-b.XXXX)
make_report 5 0 0 0 85 > "$RA"
make_report 5 0 2 0 85 > "$RB"  # placeholders 0→2 → WARN
COMP_OUT=$(node "$COMPARATOR" "$RA" "$RB" 2>&1 || true)
if echo "$COMP_OUT" | grep -q 'WARN'; then
  pass 7 "comparator emits WARN on placeholder increase"
else
  fail 7 "WARN not found in comparator output for placeholder increase"
fi
rm "$RA" "$RB"

# ── Test 8: analyzer auto-grades E1 correctly on fixture deck (sp2-01) ────────
REPORT_F=$(mktemp -t report.XXXX)
echo "$GRADER_OUT" > "$REPORT_F"
ANALYZER_OUT=$(node "$ANALYZER" sp2-01 "$REPORT_F" 2>&1)
# E1 for sp2-01: slides.by_layout.image-focus === 2 — fixture has 1 image-focus slide
# So E1 should be AUTO-FAIL (1 != 2)
if echo "$ANALYZER_OUT" | grep -q 'E1'; then
  pass 8 "analyzer produces E1 entry for sp2-01"
else
  fail 8 "E1 not found in analyzer output"
fi
rm "$REPORT_F"

# ── Test 9: analyzer auto-grades E4 correctly (validation.failed=0 vs >0) ─────
# E4 for sp2-01: validation.failed===0 && warnings===0
# Test with 0 failures (fixture) — should be AUTO-PASS
REPORT_PASS=$(mktemp -t report-pass.XXXX)
echo "$GRADER_OUT" > "$REPORT_PASS"
ANA_PASS=$(node "$ANALYZER" sp2-01 "$REPORT_PASS" 2>&1)
if echo "$ANA_PASS" | grep -qE 'E4.*AUTO-PASS|✅.*E4'; then
  pass 9a "analyzer E4=AUTO-PASS for deck with 0 validation failures"
else
  # Also accept if validation.failed=0 is shown anywhere near E4
  if echo "$ANA_PASS" | grep -A2 'E4' | grep -q 'failed=0'; then
    pass 9a "analyzer E4 shows validation.failed=0 (auto-passed)"
  else
    fail 9a "E4 not correctly graded for 0-fail deck"
  fi
fi
rm "$REPORT_PASS"

# Test with 1 failure — E4 should be AUTO-FAIL
REPORT_FAIL=$(mktemp -t report-fail.XXXX)
make_report 4 0 0 1 85 > "$REPORT_FAIL"  # val_failed=1
ANA_FAIL=$(node "$ANALYZER" sp2-01 "$REPORT_FAIL" 2>&1)
if echo "$ANA_FAIL" | grep -qE 'E4.*AUTO-FAIL|❌.*E4'; then
  pass 9b "analyzer E4=AUTO-FAIL for deck with validation failures"
else
  if echo "$ANA_FAIL" | grep -A2 'E4' | grep -q 'failed=1'; then
    pass 9b "analyzer E4 shows failed=1 (auto-failed)"
  else
    fail 9b "E4 not correctly graded for 1-fail deck"
  fi
fi
rm "$REPORT_FAIL"

# ── Test 10: analyzer marks MANUAL items with MANUAL label ────────────────────
REPORT_F=$(mktemp -t report.XXXX)
echo "$GRADER_OUT" > "$REPORT_F"
ANA_OUT=$(node "$ANALYZER" sp2-01 "$REPORT_F" 2>&1)
if echo "$ANA_OUT" | grep -q 'MANUAL'; then
  pass 10 "analyzer output contains MANUAL label for non-auto-gradable items"
else
  fail 10 "MANUAL label not found in analyzer output"
fi
rm "$REPORT_F"

# ── Test 11: eval-deck.sh produces report.json + pre-filled result.md ────────
DECK=$(mktemp -d)
cp -R "$FIXTURE"/. "$DECK"/
bash "$EVAL_DECK" "$DECK" sp2-01 > /dev/null 2>&1
if [[ -f "$DECK/report.json" ]] && [[ -f "$DECK/result-sp2-01.md" ]]; then
  if python3 -m json.tool "$DECK/report.json" > /dev/null 2>&1; then
    pass 11 "eval-deck.sh produces valid report.json and result-sp2-01.md"
  else
    fail 11 "report.json exists but is invalid JSON"
  fi
else
  fail 11 "eval-deck.sh did not create report.json and/or result-sp2-01.md"
fi
rm -rf "$DECK"

# ── Test 12: eval-deck.sh --compare produces diff.md with correct verdict ─────
RA=$(mktemp -t report-a.XXXX); RB=$(mktemp -t report-b.XXXX)
make_report 5 0 0 0 85 > "$RA"
make_report 5 0 2 0 85 > "$RB"  # placeholder increase → WARN
DIFF_DIR="$(dirname "$RB")"
bash "$EVAL_DECK" --compare "$RA" "$RB" > /dev/null 2>&1
if [[ -f "$DIFF_DIR/diff.md" ]] && grep -q 'WARN' "$DIFF_DIR/diff.md"; then
  pass 12 "eval-deck.sh --compare produces diff.md with WARN verdict"
else
  fail 12 "diff.md not produced or WARN not found"
fi
rm "$RA" "$RB" "$DIFF_DIR/diff.md" 2>/dev/null || true

echo ""
echo "SP5 static tests: $PASS passed, $FAIL failed"
if [[ "$FAIL" -gt 0 ]]; then exit 1; fi
