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
  OPEN_COUNT=$( { grep -o "<${TAG}" "$SLIDES" 2>/dev/null || true; } | wc -l | tr -d ' ')
  CLOSE_COUNT=$( { grep -o "</${TAG}>" "$SLIDES" 2>/dev/null || true; } | wc -l | tr -d ' ')
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

# ── Check 10: Layout catalog schema validation ──────────────────────────────
# Parse per-slide frontmatter and validate each slide's `layout:` / `class:`
# against layout-catalog.md. For two-columns slides, validate `left.pattern`
# and `right.pattern` against the 6-enum. Report FAILs as hard errors, WARNs
# as non-blocking notes (maxLength overflow, pattern-content overflow).

SCRIPT_DIR_C10="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_ROOT_C10="$(cd "$SCRIPT_DIR_C10/.." && pwd)"
CATALOG_PATH="$SKILL_ROOT_C10/references/layout-catalog.md"

if [[ ! -f "$CATALOG_PATH" ]]; then
  warn "Check 10 skipped: catalog not found at $CATALOG_PATH" \
       "Ensure references/layout-catalog.md is installed."
else
  C10_OUTPUT=$(python3 - "$SLIDES" "$CATALOG_PATH" <<'PYEOF' 2>&1 || true
import json, re, sys
from pathlib import Path

slides_path = Path(sys.argv[1])
catalog_path = Path(sys.argv[2])

import importlib.util
helper = catalog_path.parent.parent / "scripts" / "lib" / "parse-catalog.py"
spec = importlib.util.spec_from_file_location("parse_catalog", helper)
pc = importlib.util.module_from_spec(spec)
spec.loader.exec_module(pc)
schemas = pc.parse_file(catalog_path)
meta = schemas["_meta"]

text = slides_path.read_text(encoding="utf-8")

lines = text.splitlines()
if lines and lines[0].strip() == "---":
    end = next((i for i in range(1, len(lines)) if lines[i].strip() == "---"), None)
    body = "\n".join(lines[(end or 0) + 1:])
else:
    body = text

slide_chunks = re.split(r"(?m)^---\s*$", body)

slides = []
first = slide_chunks[0]
rest = slide_chunks[1:]

def parse_fm(s: str):
    fm = {}
    cur_key = None
    sub_obj = None
    for line in s.splitlines():
        if not line.strip():
            continue
        m = re.match(r"^([a-zA-Z_-]+):\s*(.*)$", line)
        if m and not line.startswith(" "):
            cur_key = m.group(1)
            val = m.group(2)
            if val:
                fm[cur_key] = val.strip().strip('"').strip("'")
                sub_obj = None
            else:
                fm[cur_key] = {}
                sub_obj = fm[cur_key]
        elif line.startswith("- ") and cur_key is not None:
            if not isinstance(fm.get(cur_key), list):
                fm[cur_key] = []
            fm[cur_key].append(line[2:].strip().strip('"').strip("'"))
        elif line.startswith("  ") and sub_obj is not None:
            m2 = re.match(r"^  ([a-zA-Z_-]+):\s*(.*)$", line)
            if m2:
                k, v = m2.group(1), m2.group(2)
                if v:
                    sub_obj[k] = v.strip().strip('"').strip("'")
                else:
                    sub_obj[k] = []
        elif line.startswith("    - ") and sub_obj is not None:
            last = list(sub_obj.keys())[-1] if sub_obj else None
            if last and isinstance(sub_obj[last], list):
                sub_obj[last].append(line[6:].strip().strip('"').strip("'"))
    return fm

if first.strip():
    slides.append(({}, first))
k = 0
while k < len(rest):
    fm_chunk = rest[k] if k < len(rest) else ""
    body_chunk = rest[k+1] if (k+1) < len(rest) else ""
    fm = parse_fm(fm_chunk) if fm_chunk.strip() else {}
    slides.append((fm, body_chunk))
    k += 2

def char_count(s):
    return len(s)

fails = []
warns = []

for idx, (fm, slide_body) in enumerate(slides, start=1):
    if fm.get("schema-override", "").lower() == "true":
        continue

    layout = fm.get("layout")
    cls = fm.get("class")

    if not layout:
        continue

    expected_class = meta["expected_class"]
    expected_layout_map = meta["expected_layout"]

    semantic = None
    for sem, exp_layout in expected_layout_map.items():
        if sem == "image-text-split" and layout in ("image-left", "image-right"):
            candidate_class = expected_class[sem]
            if cls == candidate_class:
                semantic = sem
                break
        elif exp_layout == layout:
            needed = expected_class[sem]
            if needed is None:
                if cls is None or cls == "":
                    semantic = sem
                    break
            else:
                if cls == needed:
                    semantic = sem
                    break

    if semantic is None:
        if cls and cls in {v for v in expected_class.values() if v}:
            for sem, needed in expected_class.items():
                if needed == cls:
                    expected = expected_layout_map[sem]
                    fails.append(f"Slide {idx}: class '{cls}' requires layout '{expected}' but got '{layout}'")
                    break
        SLIDEV_BUILTINS = {"default", "cover", "center", "two-cols", "image", "image-left",
                            "image-right", "section", "end", "fact", "quote", "statement", "intro"}
        if layout not in SLIDEV_BUILTINS:
            fails.append(f"Slide {idx}: unknown layout '{layout}'; not in catalog or Slidev built-ins")
        continue

    schema = schemas[semantic]

    if semantic == "two-columns":
        for side in ("left", "right"):
            obj = fm.get(side)
            if not isinstance(obj, dict):
                fails.append(f"Slide {idx}: two-columns missing '{side}' object")
                continue
            pat = obj.get("pattern")
            if pat not in meta["two_columns_patterns"]:
                fails.append(f"Slide {idx}: two-columns.{side}.pattern '{pat}' not in {meta['two_columns_patterns']}")
                continue
            for rf in meta["pattern_required"][pat]:
                if rf not in obj:
                    fails.append(f"Slide {idx}: two-columns.{side}.{pat} missing required '{rf}'")
            if pat == "code" and "code" in obj:
                code_lines = str(obj["code"]).count("\n") + 1
                if code_lines > meta["pattern_maxlen"]["code"]["code_lines_max"]:
                    warns.append(f"Slide {idx}: two-columns.{side}.code has {code_lines} lines (>8); promote to code-focus slide")
            if pat == "table" and "rows" in obj and isinstance(obj["rows"], list):
                if len(obj["rows"]) > meta["pattern_maxlen"]["table"]["rows_max"]:
                    warns.append(f"Slide {idx}: two-columns.{side}.table has {len(obj['rows'])} rows (>6); promote to data-table slide")
            if pat == "text" and "content" in obj:
                if char_count(str(obj["content"])) > meta["pattern_maxlen"]["text"]["content"]:
                    warns.append(f"Slide {idx}: two-columns.{side}.text content exceeds maxLength 250")

    for field in schema["fields"]:
        if field["maxLength"] is None:
            continue
        val = fm.get(field["name"])
        if val is None:
            continue
        if isinstance(val, list):
            for item in val:
                if char_count(str(item)) > field["maxLength"]:
                    warns.append(f"Slide {idx}: {semantic}.{field['name']} item exceeds maxLength {field['maxLength']}")
        elif isinstance(val, str):
            if char_count(val) > field["maxLength"]:
                warns.append(f"Slide {idx}: {semantic}.{field['name']} exceeds maxLength {field['maxLength']}")

    if semantic == "content-bullets":
        bullets = re.findall(r"(?m)^-\s+(.+)$", slide_body)
        for b in bullets:
            clean = re.sub(r"<[^>]+>", "", b).strip()
            if char_count(clean) > 90:
                warns.append(f"Slide {idx}: content-bullets bullet exceeds maxLength 90 ({char_count(clean)} chars)")

for msg in fails:
    print(f"FAIL: {msg}")
for msg in warns:
    print(f"WARN: {msg}")
PYEOF
)

  if echo "$C10_OUTPUT" | grep -q '^FAIL: '; then
    while IFS= read -r line; do
      fail "Check 10 — ${line#FAIL: }" "Fix the slide frontmatter or swap to a supported layout."
    done < <(echo "$C10_OUTPUT" | grep '^FAIL: ')
  fi
  if echo "$C10_OUTPUT" | grep -q '^WARN: '; then
    while IFS= read -r line; do
      warn "Check 10 — ${line#WARN: }" "Consider shortening, using schema-override, or promoting to a standalone layout."
    done < <(echo "$C10_OUTPUT" | grep '^WARN: ')
  fi
  if ! echo "$C10_OUTPUT" | grep -qE '^(FAIL|WARN): '; then
    pass "Check 10: all slides conform to layout-catalog schema"
  fi
fi

# ── Summary ──────────────────────────────────────────────────────────────────
echo ""
echo "Result: $PASS passed, $FAIL failed, $WARN warnings"

if [[ $FAIL -gt 0 ]]; then
  exit 1
else
  exit 0
fi
