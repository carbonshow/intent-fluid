#!/usr/bin/env bash
# review-count-tests.sh — Guard against the per-slide frontmatter counting bug
# in review-presentation.sh.
#
# Bug (pre-fix): the slide-count loop treats every `---` line in the body as a
# slide separator, but in Slidev format each per-slide frontmatter block has two
# `---` (opening = separator, closing ≠ separator). The script double-counted.
# Same story for empty-slide and no-heading detection: the FM closing `---` made
# the parser emit a phantom empty slide, and per-slide FM keys (title:, left:,
# image_prompt: etc.) leaked into the body, which made real slides look like
# "no heading" slides.
#
# These fixtures lock the correct behavior in place.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
REVIEW="$SKILL_ROOT/scripts/review-presentation.sh"

PASS=0; FAIL=0
pass() { PASS=$((PASS+1)); echo "  PASS  $1"; }
fail() { FAIL=$((FAIL+1)); echo "  FAIL  $1"; }

extract() {
  # extract <json> <key>
  # Pulls a top-level numeric value out of the nested JSON review-presentation.sh emits.
  # We grep the first occurrence of `"<key>": <number>` — good enough for this schema.
  printf '%s' "$1" | grep -oE "\"$2\": *-?[0-9]+" | head -1 | awk '{print $NF}'
}

assert_num() {
  # assert_num <label> <actual> <expected>
  local label="$1" actual="$2" expected="$3"
  if [[ "$actual" == "$expected" ]]; then
    pass "$label (= $expected)"
  else
    fail "$label — expected $expected, got '$actual'"
  fi
}

run_case() {
  # run_case <label> <fixture> <exp_slide_count> <exp_empty> <exp_no_heading>
  local label="$1" fixture="$2" e_count="$3" e_empty="$4" e_noh="$5"
  local json
  json=$(bash "$REVIEW" "$fixture" --json 2>&1) || true
  local sc emp noh
  sc=$(extract  "$json" slide_count)
  emp=$(extract "$json" empty_slides)
  noh=$(extract "$json" no_heading_slides)
  assert_num "$label :: slide_count"        "$sc"  "$e_count"
  assert_num "$label :: empty_slides"       "$emp" "$e_empty"
  assert_num "$label :: no_heading_slides"  "$noh" "$e_noh"
}

echo "review-presentation.sh counting tests:"

# 1) slidev-starter — 8 slides; every slide has a `# heading`; no empty slides.
#    Pre-fix numbers: slide_count=15, empty=6, no_heading=7 (all wrong).
run_case "starter template (8 slides, all headed)" \
         "$SKILL_ROOT/assets/slidev-starter/slides.md" \
         8 0 0

# 2) SP2 fixture — 4 slides; every slide has a `# heading`; no empty slides.
#    Pre-fix: slide_count=7, empty=0, no_heading=3.
run_case "SP2 fixture deck (4 slides, all headed)" \
         "$SKILL_ROOT/evals/sp2-scenarios/fixtures/minimal-deck/slides.md" \
         4 0 0

# 3) Check-10 valid fixture — 5 slides; slide 4 (big-statement) is the only one
#    without a `#` heading; no empty slides. Exercises a mix of headed and
#    heading-less slides so the fix cannot be a trivial "count every slide as
#    headed" short-circuit.
run_case "valid.md fixture (5 slides, 1 headless)" \
         "$SCRIPT_DIR/valid.md" \
         5 0 1

echo
echo "review-count tests: $PASS passed, $FAIL failed"
[[ $FAIL -eq 0 ]]
