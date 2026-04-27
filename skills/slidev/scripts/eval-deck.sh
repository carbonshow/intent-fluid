#!/usr/bin/env bash
# eval-deck.sh — Orchestrate the SP5 eval pipeline for a deck + scenario.
#
# Usage (grade mode):
#   bash scripts/eval-deck.sh <deck-dir> <scenario-id> [--mock <scenario>]
#   e.g.: bash scripts/eval-deck.sh /tmp/my-deck sp2-01 --mock success
#
# Usage (compare mode):
#   bash scripts/eval-deck.sh --compare <report-a.json> <report-b.json>
#
# Outputs (grade mode):
#   <deck-dir>/report.json          — grader metrics
#   <deck-dir>/result-<id>.md       — pre-filled result.md from analyzer
#
# Outputs (compare mode):
#   <dir-of-report-b>/diff.md       — comparator diff report

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

GRADER="$SKILL_ROOT/scripts/lib/grader.js"
COMPARATOR="$SKILL_ROOT/scripts/lib/comparator.js"
ANALYZER="$SKILL_ROOT/scripts/lib/analyzer.js"
GEN="$SKILL_ROOT/scripts/generate-images.sh"
VAL="$SKILL_ROOT/scripts/validate-slides.sh"
REVIEW="$SKILL_ROOT/scripts/review-presentation.sh"

# ── Argument parsing ──────────────────────────────────────────────────────────
if [[ "${1:-}" == "--compare" ]]; then
  # Compare mode
  if [[ $# -lt 3 ]]; then
    echo "Usage: bash scripts/eval-deck.sh --compare <report-a.json> <report-b.json>" >&2
    exit 2
  fi
  REPORT_A="$(cd "$(dirname "$2")" && pwd)/$(basename "$2")"
  REPORT_B="$(cd "$(dirname "$3")" && pwd)/$(basename "$3")"
  DIFF_OUT="$(dirname "$REPORT_B")/diff.md"

  echo "[eval-deck] compare mode"
  echo "[eval-deck] A: $REPORT_A"
  echo "[eval-deck] B: $REPORT_B"

  node "$COMPARATOR" "$REPORT_A" "$REPORT_B" > "$DIFF_OUT"; COMP_EXIT=${PIPESTATUS[0]:-$?}
  echo "[eval-deck] diff written: $DIFF_OUT"
  cat "$DIFF_OUT"
  exit "${COMP_EXIT:-0}"
fi

# Grade mode
if [[ $# -lt 2 ]]; then
  echo "Usage: bash scripts/eval-deck.sh <deck-dir> <scenario-id> [--mock <scenario>]" >&2
  exit 2
fi

DECK_DIR="$(cd "$1" && pwd)"
SCENARIO_ID="$2"
shift 2

MOCK_SCENARIO=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --mock)
      MOCK_SCENARIO="${2:-}"
      shift 2
      ;;
    *)
      echo "[eval-deck] unknown argument: $1" >&2
      exit 2
      ;;
  esac
done

SLIDES_PATH="$DECK_DIR/slides.md"
if [[ ! -f "$SLIDES_PATH" ]]; then
  echo "[eval-deck] error: slides.md not found in $DECK_DIR" >&2
  exit 1
fi

echo "[eval-deck] deck:     $DECK_DIR"
echo "[eval-deck] scenario: $SCENARIO_ID"
if [[ -n "$MOCK_SCENARIO" ]]; then
  echo "[eval-deck] mock:     $MOCK_SCENARIO"
fi
echo ""

# ── Step 1: generate-images.sh (if --mock provided) ──────────────────────────
if [[ -n "$MOCK_SCENARIO" ]]; then
  echo "[eval-deck] === Step 1: generate-images.sh --mock $MOCK_SCENARIO ==="
  bash "$GEN" "$DECK_DIR" --mock "$MOCK_SCENARIO"
  echo ""
fi

# ── Step 2: validate-slides.sh ───────────────────────────────────────────────
echo "[eval-deck] === Step 2: validate-slides.sh ==="
bash "$VAL" "$SLIDES_PATH" || true
echo ""

# ── Step 3: review-presentation.sh ───────────────────────────────────────────
echo "[eval-deck] === Step 3: review-presentation.sh ==="
bash "$REVIEW" "$SLIDES_PATH" || true
echo ""

# ── Step 4: grader.js ────────────────────────────────────────────────────────
echo "[eval-deck] === Step 4: grader.js ==="
REPORT_OUT="$DECK_DIR/report.json"
node "$GRADER" "$DECK_DIR" > "$REPORT_OUT"
echo "[eval-deck] report written: $REPORT_OUT"
echo ""

# ── Step 5: analyzer.js ──────────────────────────────────────────────────────
echo "[eval-deck] === Step 5: analyzer.js ==="
RESULT_OUT="$DECK_DIR/result-${SCENARIO_ID}.md"
node "$ANALYZER" "$SCENARIO_ID" "$REPORT_OUT" > "$RESULT_OUT"
echo "[eval-deck] result written: $RESULT_OUT"
echo ""

# ── Summary ───────────────────────────────────────────────────────────────────
echo "[eval-deck] === Summary ==="
SCORE=$(python3 -c "import json,sys; d=json.load(open('$REPORT_OUT')); print(d['review']['score'])" 2>/dev/null || echo "?")
GRADE=$(python3 -c "import json,sys; d=json.load(open('$REPORT_OUT')); print(d['review']['grade'])" 2>/dev/null || echo "?")
TOTAL=$(python3 -c "import json,sys; d=json.load(open('$REPORT_OUT')); print(d['slides']['total'])" 2>/dev/null || echo "?")
VAL_FAILED=$(python3 -c "import json,sys; d=json.load(open('$REPORT_OUT')); print(d['validation']['failed'])" 2>/dev/null || echo "?")

echo "  Slides:          $TOTAL"
echo "  Review score:    $SCORE / 100 ($GRADE)"
echo "  Validation fail: $VAL_FAILED"
echo "  Report:          $REPORT_OUT"
echo "  Result:          $RESULT_OUT"
