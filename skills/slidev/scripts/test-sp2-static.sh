#!/usr/bin/env bash
# test-sp2-static.sh — Static tests for SP2 image generation pipeline.
# Never makes real API calls; uses --mock and --dry-run only.
# Exit 0 if all pass, 1 otherwise.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
THEMES_DIR="$SKILL_ROOT/assets/themes"
FIXTURE="$SKILL_ROOT/evals/sp2-scenarios/fixtures/minimal-deck"
GEN="$SKILL_ROOT/scripts/generate-images.sh"
VAL="$SKILL_ROOT/scripts/validate-slides.sh"

PASS=0; FAIL=0
pass() { PASS=$((PASS+1)); echo "  PASS  Test $1: $2"; }
fail() { FAIL=$((FAIL+1)); echo "  FAIL  Test $1: $2"; }

THEMES=(tech-dark code-focus-light corporate-navy minimal-exec edu-warm playful-bright)

# Helper: create a temp deck based on fixture
make_deck() {
  local dir
  dir=$(mktemp -d)
  cp -R "$FIXTURE"/. "$dir"/
  echo "$dir"
}

# ── Test 1: 6 image-style.txt files exist & non-empty ────────────────────
MISSING_STYLES=()
for t in "${THEMES[@]}"; do
  F="$THEMES_DIR/$t.image-style.txt"
  if [[ ! -f "$F" ]] || [[ ! -s "$F" ]]; then
    MISSING_STYLES+=("$t")
  fi
done
if [[ ${#MISSING_STYLES[@]} -eq 0 ]]; then
  pass 1 "all 6 image-style.txt files exist and are non-empty"
else
  fail 1 "missing: ${MISSING_STYLES[*]}"
fi

# ── Test 2: Check 11 FAILs when image_prompt missing ──────────────────────
DECK=$(make_deck)
cat > "$DECK/slides.md" <<'EOF'
---
title: T
colorSchema: light
---

# Cover

---
layout: default
class: image-focus
---

body
EOF
OUT=$(bash "$VAL" "$DECK/slides.md" 2>&1 || true)
if echo "$OUT" | grep -q 'image_prompt missing'; then
  pass 2 "Check 11 FAILs on missing image_prompt"
else
  fail 2 "expected 'image_prompt missing', got: $OUT"
fi
rm -rf "$DECK"

# ── Test 3: Check 11 FAILs when image_prompt too short ────────────────────
DECK=$(make_deck)
cat > "$DECK/slides.md" <<'EOF'
---
title: T
colorSchema: light
---

# Cover

---
layout: default
class: image-focus
image_prompt: too short
---
EOF
OUT=$(bash "$VAL" "$DECK/slides.md" 2>&1 || true)
if echo "$OUT" | grep -q 'image_prompt too short'; then
  pass 3 "Check 11 FAILs on short image_prompt"
else
  fail 3 "expected 'image_prompt too short', got: $OUT"
fi
rm -rf "$DECK"

# ── Test 4: Check 11 FAILs when user-provided image_path missing ──────────
DECK=$(make_deck)
cat > "$DECK/slides.md" <<'EOF'
---
title: T
colorSchema: light
---

# Cover

---
layout: two-cols-header
class: two-columns
left:
  pattern: image
  image_path: public/does-not-exist.jpg
  image_prompt: Long enough prompt for validation purposes here
right:
  pattern: text
  content: right side
---

# demo
EOF
OUT=$(bash "$VAL" "$DECK/slides.md" 2>&1 || true)
if echo "$OUT" | grep -qE 'image_path .* does not exist'; then
  pass 4 "Check 11 FAILs on missing user-provided image_path"
else
  fail 4 "expected 'does not exist', got: $OUT"
fi
rm -rf "$DECK"

# ── Test 4b: Check 11 validates both two-column image sides ───────────────
DECK=$(make_deck)
cat > "$DECK/slides.md" <<'EOF'
---
title: T
colorSchema: light
---

# Cover

---
layout: two-cols-header
class: two-columns
left:
  pattern: image
  image_prompt: Long enough prompt for the left image side
  alt_text: Left image
right:
  pattern: image
  image_path: public/generated/auto.png
  alt_text: Right image
---

# demo
EOF
OUT=$(bash "$VAL" "$DECK/slides.md" 2>&1 || true)
if echo "$OUT" | grep -q 'two-cols-header.right.image) image_prompt missing'; then
  pass 4b "Check 11 validates both image columns"
else
  fail 4b "expected right-column missing prompt, got: $OUT"
fi
rm -rf "$DECK"

# ── Test 5: Check 11 PASSes on fixture deck ───────────────────────────────
OUT=$(bash "$VAL" "$FIXTURE/slides.md" 2>&1 || true)
if echo "$OUT" | grep -q 'PASS  Check 11'; then
  pass 5 "Check 11 PASSes on fixture"
else
  fail 5 "expected 'PASS  Check 11' in output"
fi

# ── Test 6: generate-images.js --dry-run produces summary ─────────────────
DECK=$(make_deck)
OUT=$(bash "$GEN" "$DECK" --dry-run 2>&1 || true)
if echo "$OUT" | grep -q 'DRY-RUN' && echo "$OUT" | grep -qE 'Found [0-9]+ image'; then
  pass 6 "--dry-run produces summary"
else
  fail 6 "expected DRY-RUN summary, got: $OUT"
fi
rm -rf "$DECK"

# ── Test 7: Hash stability — same deck → same hashes twice ────────────────
DECK1=$(make_deck)
DECK2=$(make_deck)
HASHES1=$(bash "$GEN" "$DECK1" --dry-run 2>&1 | grep -oE '[a-f0-9]{16}' | sort | tr '\n' ',')
HASHES2=$(bash "$GEN" "$DECK2" --dry-run 2>&1 | grep -oE '[a-f0-9]{16}' | sort | tr '\n' ',')
if [[ -n "$HASHES1" ]] && [[ "$HASHES1" == "$HASHES2" ]]; then
  pass 7 "hash stability: identical hashes across runs ($HASHES1)"
else
  fail 7 "hashes differ: run1='$HASHES1' run2='$HASHES2'"
fi
rm -rf "$DECK1" "$DECK2"

# ── Test 8: placeholder-svg.js generates well-formed SVG (all 6 themes) ──
ALL_SVG_OK=true
for t in "${THEMES[@]}"; do
  CSS="$THEMES_DIR/$t.css"
  SVG_OUT=$(node --input-type=module -e "
    import('$SKILL_ROOT/scripts/lib/theme-colors.js').then(async (tc) => {
      const fs = await import('node:fs');
      const css = fs.readFileSync('$CSS', 'utf8');
      const colors = tc.extractThemeColors(css);
      const mod = await import('$SKILL_ROOT/scripts/lib/placeholder-svg.js');
      const svg = mod.renderPlaceholder({ title: 'T', reason: 'test', colors, width: 100, height: 100 });
      process.stdout.write(svg);
    });
  " 2>&1 || true)
  if ! echo "$SVG_OUT" | grep -q '<svg' || ! echo "$SVG_OUT" | grep -q '</svg>'; then
    ALL_SVG_OK=false
    fail 8 "placeholder SVG for $t malformed"
    break
  fi
done
if [[ "$ALL_SVG_OK" == true ]]; then
  pass 8 "placeholder-svg generates well-formed SVG for all 6 themes"
fi

# ── Test 9a: --mock success → PNG files written ────────────────────────────
DECK=$(make_deck)
rm -rf "$DECK/public/generated" 2>/dev/null || true
OUT=$(bash "$GEN" "$DECK" --mock success 2>&1 || true)
PNG_COUNT=$(find "$DECK/public/generated" -name '*.png' 2>/dev/null | wc -l | tr -d ' ')
if [[ "$PNG_COUNT" -gt 0 ]] && echo "$OUT" | grep -q 'generated'; then
  pass 9a "--mock success writes PNG files ($PNG_COUNT found)"
else
  fail 9a "no PNG in public/generated or 'generated' missing from log"
fi
rm -rf "$DECK"

# ── Test 9b: --mock timeout → placeholder SVGs written ─────────────────────
DECK=$(make_deck)
rm -rf "$DECK/public/generated" 2>/dev/null || true
OUT=$(bash "$GEN" "$DECK" --mock timeout 2>&1 || true)
SVG_COUNT=$(find "$DECK/public/generated" -name '*.svg' 2>/dev/null | wc -l | tr -d ' ')
if [[ "$SVG_COUNT" -gt 0 ]]; then
  pass 9b "--mock timeout writes placeholder SVGs ($SVG_COUNT found)"
else
  fail 9b "no SVG placeholders written"
fi
rm -rf "$DECK"

# ── Test 9c: --mock content_policy → log mentions code ─────────────────────
DECK=$(make_deck)
rm -rf "$DECK/public/generated" 2>/dev/null || true
OUT=$(bash "$GEN" "$DECK" --mock content_policy 2>&1 || true)
if echo "$OUT" | grep -q 'content_policy'; then
  pass 9c "--mock content_policy logs error code"
else
  fail 9c "expected 'content_policy' in log"
fi
rm -rf "$DECK"

# ── Test 10: User-override path preserved (file untouched) ─────────────────
DECK=$(make_deck)
ORIG_SIZE=$(stat -f '%z' "$DECK/public/hero.jpg" 2>/dev/null || stat -c '%s' "$DECK/public/hero.jpg" 2>/dev/null)
OUT=$(bash "$GEN" "$DECK" --mock success 2>&1 || true)
NEW_SIZE=$(stat -f '%z' "$DECK/public/hero.jpg" 2>/dev/null || stat -c '%s' "$DECK/public/hero.jpg" 2>/dev/null)
if [[ "$ORIG_SIZE" == "$NEW_SIZE" ]] && echo "$OUT" | grep -q 'user-provided'; then
  pass 10 "user-provided path skipped (file unchanged)"
else
  fail 10 "size changed ($ORIG_SIZE → $NEW_SIZE) or no 'user-provided' in log"
fi
rm -rf "$DECK"

# ── Test 11: --force bypasses cache ────────────────────────────────────────
DECK=$(make_deck)
bash "$GEN" "$DECK" --mock success > /dev/null 2>&1
first_png_mtime() {
  local dir="$1"
  local first
  first=$(find "$dir/public/generated" -name '*.png' -print -quit 2>/dev/null || true)
  [[ -n "$first" ]] || return 1
  if stat -f '%m' "$first" >/dev/null 2>&1; then
    stat -f '%m' "$first"
  else
    stat -c '%Y' "$first"
  fi
}
FIRST_MTIME=$(first_png_mtime "$DECK" || true)
sleep 2
bash "$GEN" "$DECK" --mock success --force > /dev/null 2>&1
SECOND_MTIME=$(first_png_mtime "$DECK" || true)
if [[ -n "$FIRST_MTIME" ]] && [[ -n "$SECOND_MTIME" ]] && [[ "$SECOND_MTIME" -gt "$FIRST_MTIME" ]]; then
  pass 11 "--force regenerates (mtime advanced)"
else
  fail 11 "mtime did not advance ($FIRST_MTIME → $SECOND_MTIME)"
fi
rm -rf "$DECK"

# ── Test 11b: placeholders read generated style.css, not only theme.css ───
DECK=$(make_deck)
rm -f "$DECK/theme.css"
cat > "$DECK/style.css" <<'EOF'
:root {
  --color-bg: #123456;
  --color-text: #abcdef;
  --color-accent: #fedcba;
}
EOF
rm -rf "$DECK/public/generated" 2>/dev/null || true
bash "$GEN" "$DECK" --mock timeout > /dev/null 2>&1
FIRST_SVG=$(find "$DECK/public/generated" -name '*.svg' -print -quit 2>/dev/null || true)
if [[ -n "$FIRST_SVG" ]] && grep -q '#123456' "$FIRST_SVG"; then
  pass 11b "placeholder colors come from style.css"
else
  fail 11b "expected placeholder SVG to use #123456 from style.css"
fi
rm -rf "$DECK"

# ── Test 12: gemini-client unit tests pass ─────────────────────────────────
if node "$SKILL_ROOT/scripts/lib/test-gemini-client.mjs" > /dev/null 2>&1; then
  pass 12 "gemini-client unit tests pass"
else
  fail 12 "gemini-client unit tests fail — run directly for details"
fi

# ── Test 13: slides-parser unit tests pass ──────────────────────────────────
if node "$SKILL_ROOT/scripts/lib/test-slides-parser.mjs" > /dev/null 2>&1; then
  pass 13 "slides-parser unit tests pass"
else
  fail 13 "slides-parser unit tests fail"
fi

# ── Test 14: theme-colors unit tests pass ───────────────────────────────────
if node "$SKILL_ROOT/scripts/lib/test-theme-colors.mjs" > /dev/null 2>&1; then
  pass 14 "theme-colors unit tests pass"
else
  fail 14 "theme-colors unit tests fail"
fi

# ── Test 15: placeholder-svg unit tests pass ────────────────────────────────
if node "$SKILL_ROOT/scripts/lib/test-placeholder-svg.mjs" > /dev/null 2>&1; then
  pass 15 "placeholder-svg unit tests pass"
else
  fail 15 "placeholder-svg unit tests fail"
fi

echo ""
echo "SP2 static tests: $PASS passed, $FAIL failed"
if [[ "$FAIL" -gt 0 ]]; then exit 1; fi
