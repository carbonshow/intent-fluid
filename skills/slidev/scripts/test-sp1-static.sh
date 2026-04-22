#!/usr/bin/env bash
# test-sp1-static.sh — The 10 static checks from SP1 spec §9.1.
# Exit 0 if all pass, 1 otherwise.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
THEMES_DIR="$SKILL_ROOT/assets/themes"
THEME_LIB="$SKILL_ROOT/references/theme-library.md"
CATALOG="$SKILL_ROOT/references/layout-catalog.md"
FIXTURES="$SKILL_ROOT/evals/sp1-scenarios/fixtures"
NEW_PRES="$SKILL_ROOT/scripts/new-presentation.sh"

PASS=0; FAIL=0
pass() { PASS=$((PASS+1)); echo "  PASS  Check $1: $2"; }
fail() { FAIL=$((FAIL+1)); echo "  FAIL  Check $1: $2"; }

THEMES=(tech-dark code-focus-light corporate-navy minimal-exec edu-warm playful-bright)
LAYOUTS=(cover agenda section-divider content-bullets content-narrative two-columns \
         three-metrics data-table timeline-horizontal code-focus diagram-primary \
         image-focus image-text-split big-statement closing)

# Layouts that use a `class:` (must have CSS rule in at least one theme)
LAYOUT_CLASSES=(agenda content-bullets content-narrative two-columns three-metrics \
                data-table timeline-horizontal code-focus diagram-primary image-focus \
                image-text-split big-statement)

# Check 1: 6 theme CSS files exist
CSS_COUNT=$(find "$THEMES_DIR" -maxdepth 1 -name '*.css' -not -name '_*' 2>/dev/null | wc -l | tr -d ' ')
if [[ "$CSS_COUNT" -eq 6 ]]; then
  pass 1 "6 theme CSS files exist"
else
  fail 1 "expected 6 theme CSS files, found $CSS_COUNT"
fi

# Check 2: every theme defines all 9 CSS variables
MISSING_VARS=()
for t in "${THEMES[@]}"; do
  for v in --color-primary --color-accent --color-text --color-bg --color-muted \
            --color-code-bg --font-heading --font-body --font-code; do
    if ! grep -q -- "$v" "$THEMES_DIR/$t.css" 2>/dev/null; then
      MISSING_VARS+=("$t:$v")
    fi
  done
done
if [[ ${#MISSING_VARS[@]} -eq 0 ]]; then
  pass 2 "all 6 themes define the 9 required CSS variables"
else
  fail 2 "missing variables: ${MISSING_VARS[*]}"
fi

# Check 3: theme-library.md has a `## <name>` section for each theme
MISSING_SEC=()
for t in "${THEMES[@]}"; do
  if ! grep -qE "^## ${t}$" "$THEME_LIB"; then
    MISSING_SEC+=("$t")
  fi
done
if [[ ${#MISSING_SEC[@]} -eq 0 ]]; then
  pass 3 "theme-library.md has a section for each of 6 themes"
else
  fail 3 "missing sections: ${MISSING_SEC[*]}"
fi

# Check 4: layout-catalog.md has a `## <name>` section for each of 15 layouts
MISSING_L=()
for l in "${LAYOUTS[@]}"; do
  if ! grep -qE "^## ${l}$" "$CATALOG"; then
    MISSING_L+=("$l")
  fi
done
if [[ ${#MISSING_L[@]} -eq 0 ]]; then
  pass 4 "layout-catalog.md has a section for each of 15 layouts"
else
  fail 4 "missing layouts: ${MISSING_L[*]}"
fi

# Check 5: each layout section contains the 8 required sub-sections
if python3 "$SCRIPT_DIR/lib/parse-catalog.py" "$CATALOG" > /dev/null 2>&1; then
  if python3 - "$CATALOG" <<'PY'
import re, sys
from pathlib import Path
path = Path(sys.argv[1])
text = path.read_text()
LAYOUTS = ["cover","agenda","section-divider","content-bullets","content-narrative",
           "two-columns","three-metrics","data-table","timeline-horizontal",
           "code-focus","diagram-primary","image-focus","image-text-split",
           "big-statement","closing"]
REQ = ["Semantic role","Slidev frontmatter","When to use","Avoid when",
       "Fields schema","Markdown template","Density tier default","Allowed animations"]
sections = {}
cur = None; buf = []
for line in text.splitlines():
    m = re.match(r"^## ([a-z-]+)$", line)
    if m and m.group(1) in LAYOUTS:
        if cur: sections[cur] = "\n".join(buf)
        cur = m.group(1); buf = []
    elif cur:
        buf.append(line)
if cur: sections[cur] = "\n".join(buf)
bad = []
for l in LAYOUTS:
    if l not in sections:
        bad.append(f"{l}:missing-section"); continue
    for r in REQ:
        if not re.search(r"\*\*" + re.escape(r) + r"\*\*", sections[l]):
            bad.append(f"{l}:missing-{r.replace(' ','-')}")
if bad:
    print("\n".join(bad)); sys.exit(1)
PY
  then
    pass 5 "every layout has all 8 required sub-sections"
  else
    fail 5 "some layouts are missing required sub-sections (see output above)"
  fi
else
  fail 5 "parse-catalog.py failed — malformed catalog"
fi

# Check 6: every layout `class:` value has a CSS rule in at least one theme
MISSING_CSS=()
for cls in "${LAYOUT_CLASSES[@]}"; do
  FOUND=false
  # Check skeleton first (v2: shared geometric skeletons live there)
  if grep -q "\\.${cls}" "$THEMES_DIR/_skeleton.css" 2>/dev/null; then
    FOUND=true
  fi
  if [[ "$FOUND" != true ]]; then
    for t in "${THEMES[@]}"; do
      if grep -q "\\.${cls}" "$THEMES_DIR/$t.css" 2>/dev/null; then
        FOUND=true; break
      fi
    done
  fi
  if [[ "$FOUND" != true ]]; then
    MISSING_CSS+=("$cls")
  fi
done
if [[ ${#MISSING_CSS[@]} -eq 0 ]]; then
  pass 6 "every layout class has CSS in at least one theme"
else
  fail 6 "no theme provides CSS for: ${MISSING_CSS[*]}"
fi

# Check 7: new-presentation.sh --theme <each of 6> succeeds
SCRATCH=$(mktemp -d -t sp1-static.XXXXXX)
trap 'rm -rf "$SCRATCH"' EXIT
T7_FAILS=()
for t in "${THEMES[@]}"; do
  if ! bash "$NEW_PRES" "$SCRATCH/c7-$t" --theme "$t" --title "Test" > "$SCRATCH/c7-$t.log" 2>&1; then
    T7_FAILS+=("$t")
  fi
done
if [[ ${#T7_FAILS[@]} -eq 0 ]]; then
  pass 7 "new-presentation.sh --theme <each of 6> succeeds"
else
  fail 7 "failed themes: ${T7_FAILS[*]}"
fi

# Check 8: new-presentation.sh --theme nonsense exits non-zero + lists themes
if bash "$NEW_PRES" "$SCRATCH/c8" --theme nonsense > "$SCRATCH/c8.log" 2>&1; then
  fail 8 "nonsense theme should have failed but succeeded"
else
  MISS=()
  for t in "${THEMES[@]}"; do
    grep -q "$t" "$SCRATCH/c8.log" || MISS+=("$t")
  done
  if [[ ${#MISS[@]} -eq 0 ]]; then
    pass 8 "nonsense theme produces proper error listing all 6 themes"
  else
    fail 8 "error message missing themes: ${MISS[*]}"
  fi
fi

# Check 9: validate-slides.sh Check 10 passes for known-good fixture
if bash "$SKILL_ROOT/scripts/validate-slides.sh" "$FIXTURES/valid.md" > "$SCRATCH/c9.log" 2>&1; then
  if grep -q "Check 10" "$SCRATCH/c9.log"; then
    pass 9 "Check 10 passes on valid.md fixture"
  else
    fail 9 "valid.md passed overall but Check 10 did not run"
  fi
else
  fail 9 "valid.md did not pass validate-slides.sh"
fi

# Check 10: Check 10 FAILs on invalid-layout fixture AND WARNs on over-length fixture
BAD_LAYOUT_OK=false
OVER_LEN_OK=false
if ! bash "$SKILL_ROOT/scripts/validate-slides.sh" "$FIXTURES/invalid-layout.md" > "$SCRATCH/c10a.log" 2>&1; then
  if grep -qE "FAIL.*(Check 10|layout)" "$SCRATCH/c10a.log"; then
    BAD_LAYOUT_OK=true
  fi
fi
if bash "$SKILL_ROOT/scripts/validate-slides.sh" "$FIXTURES/over-length.md" > "$SCRATCH/c10b.log" 2>&1; then
  if grep -qE "WARN.*Check 10" "$SCRATCH/c10b.log"; then
    OVER_LEN_OK=true
  fi
fi
if [[ "$BAD_LAYOUT_OK" == true ]] && [[ "$OVER_LEN_OK" == true ]]; then
  pass 10 "Check 10 FAILs on invalid-layout AND WARNs on over-length"
else
  fail 10 "bad-layout-fail=$BAD_LAYOUT_OK over-length-warn=$OVER_LEN_OK"
fi

echo
echo "Static tests: $PASS passed, $FAIL failed"
[[ $FAIL -eq 0 ]]
