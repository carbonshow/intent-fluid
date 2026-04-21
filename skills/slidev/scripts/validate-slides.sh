#!/usr/bin/env bash
# validate-slides.sh — Deterministic validation of a Slidev slides.md file.
# Usage: bash scripts/validate-slides.sh <slides_md_path>
#
# Checks for known Slidev pitfalls that cause silent rendering failures.
# Exit code: 0 = all passed, 1 = one or more checks failed.

set -euo pipefail

# ── Usage ────────────────────────────────────────────────────────────────────
if [[ $# -lt 1 ]] || [[ "$1" == "-h" ]] || [[ "$1" == "--help" ]]; then
  echo "Usage: bash scripts/validate-slides.sh <slides_md_path>"
  echo ""
  echo "Checks:"
  echo "  1. File exists and is non-empty"
  echo "  2. Frontmatter starts on line 1 with ---"
  echo "  3. Frontmatter has a closing --- delimiter"
  echo "  4. No --- inside frontmatter body (causes truncation)"
  echo "  5. colorSchema: light is present (prevents dark-mode breakage)"
  echo "  6. title field is present"
  echo "  7. No --- inside HTML blocks (breaks slide parsing)"
  echo "  8. All v-click and v-mark tags are properly closed"
  exit 0
fi

SLIDES="$1"
PASS=0
FAIL=0
WARN=0

pass() { PASS=$((PASS + 1)); echo "  PASS  $1"; }
fail() { FAIL=$((FAIL + 1)); echo "  FAIL  $1"; echo "        Fix: $2"; }
warn() { WARN=$((WARN + 1)); echo "  WARN  $1"; echo "        Suggestion: $2"; }

echo "Validating: $SLIDES"
echo ""

# ── Check 1: File exists and is non-empty ────────────────────────────────────
if [[ ! -f "$SLIDES" ]]; then
  fail "File does not exist: $SLIDES" "Create the file or check the path."
  echo ""
  echo "Result: 0 passed, 1 failed"
  exit 1
fi

if [[ ! -s "$SLIDES" ]]; then
  fail "File is empty: $SLIDES" "Add frontmatter and slide content."
  echo ""
  echo "Result: 0 passed, 1 failed"
  exit 1
fi

pass "File exists and is non-empty"

# ── Read first line for frontmatter opening check ──
FIRST_LINE="$(head -n 1 "$SLIDES")"

# ── Check 2: Frontmatter opens with --- on line 1 ───────────────────────────
if [[ "$FIRST_LINE" == "---" ]]; then
  pass "Frontmatter opens with --- on line 1"
else
  fail "First line is not ---" "Frontmatter must start with --- on line 1."
  # Cannot continue without frontmatter
  echo ""
  echo "Result: $PASS passed, $((FAIL)) failed"
  exit 1
fi

# ── Extract frontmatter (between first --- and second ---) ───────────────────
# Find line number of the closing --- (skip line 1)
CLOSE_LINE=""
LINE_NUM=0
while IFS= read -r line; do
  LINE_NUM=$((LINE_NUM + 1))
  if [[ $LINE_NUM -gt 1 ]] && [[ "$line" == "---" ]]; then
    CLOSE_LINE=$LINE_NUM
    break
  fi
done < "$SLIDES"

# ── Check 3: Frontmatter has closing delimiter ──────────────────────────────
if [[ -n "$CLOSE_LINE" ]]; then
  pass "Frontmatter has closing --- on line $CLOSE_LINE"
else
  fail "No closing --- found for frontmatter" "Add --- on its own line after all frontmatter fields."
  echo ""
  echo "Result: $PASS passed, $((FAIL)) failed"
  exit 1
fi

# Extract frontmatter body (between line 2 and CLOSE_LINE-1)
FRONTMATTER_BODY="$(sed -n "2,$((CLOSE_LINE - 1))p" "$SLIDES")"

# ── Check 4: No --- inside frontmatter body ─────────────────────────────────
# Check for lines containing --- as part of text (not the delimiters)
FM_DASHES=""
FM_LINE=1
while IFS= read -r line; do
  FM_LINE=$((FM_LINE + 1))
  # Match lines that contain --- anywhere (including in comments)
  if echo "$line" | grep -q -- '---'; then
    FM_DASHES="${FM_DASHES}line $FM_LINE: $line\n"
  fi
done <<< "$FRONTMATTER_BODY"

if [[ -z "$FM_DASHES" ]]; then
  pass "No --- found inside frontmatter body"
else
  fail "Found --- inside frontmatter (causes silent truncation)" \
       "Remove or rephrase any line containing --- within the frontmatter block."
  echo -e "        Lines: $FM_DASHES" | head -5
fi

# ── Check 5: colorSchema: light ─────────────────────────────────────────────
if echo "$FRONTMATTER_BODY" | grep -qE '^\s*colorSchema:\s*light'; then
  pass "colorSchema: light is set"
else
  fail "colorSchema: light is missing from frontmatter" \
       "Add 'colorSchema: light' to frontmatter. Without it, Slidev inherits the OS theme — dark mode makes light text on dark bg invisible with the default theme."
fi

# ── Check 6: title field ────────────────────────────────────────────────────
if echo "$FRONTMATTER_BODY" | grep -qE '^\s*title:'; then
  pass "title field is present"
else
  warn "title field is missing from frontmatter" \
       "Add 'title: Your Title' for metadata and browser tab display."
fi

# ── Check 7: No --- inside HTML blocks ──────────────────────────────────────
# After frontmatter, look for --- that appears between < and > contexts
# Strategy: scan for lines that are exactly "---" after the frontmatter,
# then check if they're between opening/closing HTML tags
BODY="$(sed -n "$((CLOSE_LINE + 1)),\$p" "$SLIDES")"

IN_HTML=false
HTML_DASH_LINES=""
BODY_LINE=$CLOSE_LINE
while IFS= read -r line; do
  BODY_LINE=$((BODY_LINE + 1))

  # Track HTML block entry/exit (tags like <div>, <v-click>, etc.)
  # Skip self-closing tags (<br />, <img ... />) — they don't create blocks
  if echo "$line" | grep -qE '^\s*<[a-zA-Z]' && ! echo "$line" | grep -qE '/>'; then
    IN_HTML=true
  fi
  if echo "$line" | grep -qE '^\s*</[a-zA-Z]'; then
    IN_HTML=false
  fi

  # If we're inside an HTML block and see ---, that's a problem
  # shellcheck disable=SC2001  # sed is clearest for leading-whitespace trim here
  if [[ "$IN_HTML" == true ]] && [[ "$(echo "$line" | sed 's/^[[:space:]]*//')" == "---" ]]; then
    HTML_DASH_LINES="${HTML_DASH_LINES}line $BODY_LINE\n"
  fi
done <<< "$BODY"

if [[ -z "$HTML_DASH_LINES" ]]; then
  pass "No --- found inside HTML blocks"
else
  fail "Found --- inside HTML block (Slidev treats it as slide separator)" \
       "Replace --- with <hr class=\"my-3 opacity-30\" /> inside HTML blocks."
  echo -e "        At: $HTML_DASH_LINES" | head -5
fi

# ── Check 8: Paired v-click and v-mark tags ─────────────────────────────────
for TAG in "v-click" "v-mark"; do
  OPEN_COUNT=$(grep -o "<${TAG}" "$SLIDES" 2>/dev/null | wc -l | tr -d ' ')
  CLOSE_COUNT=$(grep -o "</${TAG}>" "$SLIDES" 2>/dev/null | wc -l | tr -d ' ')
  if [[ "$OPEN_COUNT" -eq "$CLOSE_COUNT" ]]; then
    pass "$TAG tags are balanced ($OPEN_COUNT open, $CLOSE_COUNT close)"
  else
    fail "$TAG tags are unbalanced ($OPEN_COUNT open, $CLOSE_COUNT close)" \
         "Ensure every <$TAG> has a matching </$TAG>."
  fi
done

# ── Check 9: Paired magic-move fences ───────────────────────────────────────
# Magic-move uses 4-backtick fences (````md magic-move ... ````). An unclosed fence
# causes Slidev to silently swallow all subsequent slides.
MAGIC_OPEN=$(grep -c '````md magic-move' "$SLIDES" 2>/dev/null || true)
MAGIC_CLOSE=$(grep -cE '^````\s*$' "$SLIDES" 2>/dev/null || true)
if [[ "$MAGIC_OPEN" -eq 0 ]]; then
  pass "No magic-move blocks (nothing to check)"
elif [[ "$MAGIC_OPEN" -eq "$MAGIC_CLOSE" ]]; then
  pass "magic-move fences are balanced ($MAGIC_OPEN open, $MAGIC_CLOSE close)"
else
  fail "magic-move fences are unbalanced ($MAGIC_OPEN open, $MAGIC_CLOSE close)" \
       "Each \`\`\`\`magic-move must have a matching closing \`\`\`\` on its own line."
fi

# ── Summary ──────────────────────────────────────────────────────────────────
echo ""
echo "Result: $PASS passed, $FAIL failed, $WARN warnings"

if [[ $FAIL -gt 0 ]]; then
  exit 1
else
  exit 0
fi
