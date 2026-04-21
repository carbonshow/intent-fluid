#!/usr/bin/env bash
# check10-tests.sh — Drive validate-slides.sh against Check 10 fixtures.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
VALIDATE="$SKILL_ROOT/scripts/validate-slides.sh"

PASS=0; FAIL=0
pass() { PASS=$((PASS+1)); echo "  PASS  $1"; }
fail() { FAIL=$((FAIL+1)); echo "  FAIL  $1"; }

run_case() {
  local label="$1" fixture="$2" expect_exit="$3" expect_grep="$4"
  local output status
  output=$(bash "$VALIDATE" "$fixture" 2>&1) && status=0 || status=$?
  if [[ $status -eq $expect_exit ]]; then
    if [[ -z "$expect_grep" ]] || echo "$output" | grep -qE "$expect_grep"; then
      pass "$label"
    else
      fail "$label — exit matched but output missing '$expect_grep'"
      echo "$output" | head -20 | sed 's/^/       /'
    fi
  else
    fail "$label — expected exit $expect_exit got $status"
    echo "$output" | head -20 | sed 's/^/       /'
  fi
}

echo "Check 10 tests:"
run_case "valid.md passes"                     "$SCRIPT_DIR/valid.md"                 0 ""
run_case "invalid-layout.md fails"             "$SCRIPT_DIR/invalid-layout.md"        1 "FAIL.*layout"
run_case "over-length.md is WARN not FAIL"     "$SCRIPT_DIR/over-length.md"           0 "WARN.*maxLength"
run_case "two-columns-valid.md passes"         "$SCRIPT_DIR/two-columns-valid.md"     0 ""
run_case "two-columns-bad-pattern.md fails"    "$SCRIPT_DIR/two-columns-bad-pattern.md" 1 "FAIL.*pattern"

echo
echo "Check 10 tests: $PASS passed, $FAIL failed"
[[ $FAIL -eq 0 ]]
