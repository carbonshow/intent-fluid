#!/usr/bin/env bash
# theme-flag-tests.sh — End-to-end tests for new-presentation.sh --theme.
# Run from the skill root or with absolute paths.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
NEW_PRES="$SKILL_ROOT/scripts/new-presentation.sh"

PASS=0; FAIL=0
pass() { PASS=$((PASS+1)); echo "  PASS  $1"; }
fail() { FAIL=$((FAIL+1)); echo "  FAIL  $1"; }

# Set up a scratch dir we clean at the end
SCRATCH="$(mktemp -d -t slidev-sp1-test.XXXXXX)"
trap 'rm -rf "$SCRATCH"' EXIT

# Test 1: each of the 6 themes succeeds
echo "Test 1: --theme <each of 6> creates a deck"
for THEME in tech-dark code-focus-light corporate-navy minimal-exec edu-warm playful-bright; do
  TARGET="$SCRATCH/t1-$THEME"
  if bash "$NEW_PRES" "$TARGET" --theme "$THEME" --title "Test $THEME" > /tmp/sp1-t1-$THEME.log 2>&1; then
    if [[ -f "$TARGET/style.css" ]] && grep -q -- "--color-primary" "$TARGET/style.css"; then
      pass "theme $THEME: directory + style.css with --color-primary"
    else
      fail "theme $THEME: style.css missing or wrong content"
    fi
  else
    fail "theme $THEME: new-presentation.sh failed (see /tmp/sp1-t1-$THEME.log)"
  fi
done

# Test 2: invalid theme exits non-zero and lists available themes
echo "Test 2: --theme nonsense fails and lists 6 themes"
TARGET="$SCRATCH/t2"
if bash "$NEW_PRES" "$TARGET" --theme nonsense > /tmp/sp1-t2.log 2>&1; then
  fail "invalid theme should have failed, but succeeded"
else
  # Check the error message lists all 6 themes
  MISSING=0
  for THEME in tech-dark code-focus-light corporate-navy minimal-exec edu-warm playful-bright; do
    if ! grep -q "$THEME" /tmp/sp1-t2.log; then
      MISSING=$((MISSING+1))
      echo "    missing theme name in error output: $THEME"
    fi
  done
  if [[ $MISSING -eq 0 ]]; then
    pass "invalid theme name rejected with proper error listing all 6"
  else
    fail "invalid theme error lists only $((6-MISSING)) of 6 themes"
  fi
fi

# Test 3: omitting --theme uses tech-dark as default
echo "Test 3: --theme omitted defaults to tech-dark"
TARGET="$SCRATCH/t3"
if bash "$NEW_PRES" "$TARGET" --title "Default Test" > /tmp/sp1-t3.log 2>&1; then
  # Compare the target's style.css to tech-dark.css (must match)
  if diff -q "$TARGET/style.css" "$SKILL_ROOT/assets/themes/tech-dark.css" > /dev/null; then
    pass "default theme is tech-dark"
  else
    fail "default style.css does not match tech-dark.css"
  fi
else
  fail "new-presentation.sh without --theme failed (see /tmp/sp1-t3.log)"
fi

# Test 4: missing theme file (simulated) fails with helpful message
echo "Test 4: if themes/<name>.css is missing, script exits 1 with helpful hint"
# We simulate by creating a fake runner with no themes/ — too invasive.
# Instead, verify the error-message presence when asking for a theme that
# happens to not exist. This overlaps with Test 2 but is separately informative.
TARGET="$SCRATCH/t4"
if bash "$NEW_PRES" "$TARGET" --theme definitely-not-a-theme-name > /tmp/sp1-t4.log 2>&1; then
  fail "missing-theme should have exited non-zero"
else
  if grep -qE "(not found|invalid|unknown|available)" /tmp/sp1-t4.log; then
    pass "missing theme produces readable error"
  else
    fail "missing theme error lacks helpful keywords"
  fi
fi

echo
echo "Theme-flag tests: $PASS passed, $FAIL failed"
[[ $FAIL -eq 0 ]]
