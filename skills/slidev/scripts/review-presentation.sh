#!/usr/bin/env bash
# review-presentation.sh — Automated quality review of a Slidev presentation.
# Usage: bash scripts/review-presentation.sh <slides_md_path> [--json]
#
# Analyzes a slides.md file and produces a structured quality report covering:
#   - Structure: slide count, layout distribution, animation density
#   - Content: text density per slide, heading consistency, empty slides
#   - Quality: overall scoring with actionable improvement suggestions
#
# Exit codes:
#   0 = Good (score >= 70)
#   1 = Needs improvement (score < 70) or file errors
#
# The --json flag outputs machine-readable JSON instead of human-readable text.

set -euo pipefail

# ── Usage ────────────────────────────────────────────────────────────────────
if [[ $# -lt 1 ]] || [[ "$1" == "-h" ]] || [[ "$1" == "--help" ]]; then
  cat <<EOF
Usage: bash scripts/review-presentation.sh <slides_md_path> [--json]

Produces a quality review report with structure analysis, content checks,
and an overall score with actionable suggestions.

Options:
  --json    Output machine-readable JSON instead of text report

Exit codes:
  0 = Good (score >= 70)
  1 = Needs improvement (score < 70) or file errors
EOF
  exit 0
fi

SLIDES="$1"
JSON_MODE=false
if [[ "${2:-}" == "--json" ]]; then
  JSON_MODE=true
fi

if [[ ! -f "$SLIDES" ]]; then
  echo "Error: file not found: $SLIDES" >&2
  exit 1
fi

# ── Split slides ─────────────────────────────────────────────────────────────
# Find the end of frontmatter first
CLOSE_LINE=""
LINE_NUM=0
FIRST_LINE="$(head -n 1 "$SLIDES")"
if [[ "$FIRST_LINE" == "---" ]]; then
  while IFS= read -r line; do
    LINE_NUM=$((LINE_NUM + 1))
    if [[ $LINE_NUM -gt 1 ]] && [[ "$line" == "---" ]]; then
      CLOSE_LINE=$LINE_NUM
      break
    fi
  done < "$SLIDES"
fi

if [[ -z "$CLOSE_LINE" ]]; then
  echo "Error: cannot parse frontmatter in $SLIDES" >&2
  exit 1
fi

# Extract body (everything after frontmatter closing ---)
BODY="$(tail -n +"$((CLOSE_LINE + 1))" "$SLIDES")"

# ── Per-slide analysis ───────────────────────────────────────────────────────
# We walk the body with a two-state machine (BODY ↔ FM) that mirrors
# scripts/lib/slides-parser.js. In Slidev, a slide separator `---` that lands
# in BODY state MAY be immediately followed by a per-slide frontmatter block,
# whose closing `---` is NOT a slide separator. The previous implementation
# counted every `---` in the body as a separator, which double-counted slides
# with per-slide FM and leaked FM keys (title:, image_prompt:, etc.) into the
# body-level heading/word/empty checks.
EMPTY_SLIDES=0
TEXT_HEAVY_SLIDES=0
NO_HEADING_SLIDES=0
SLIDES_WITH_ANIMATIONS=0
TOTAL_WORDS=0
TOTAL_VCLICKS=0
TOTAL_VMARKS=0
TOTAL_CODE_BLOCKS=0
MAX_WORDS=0
MIN_WORDS=999999
ALL_HEADINGS=""
HAS_NOTES=0
SLIDES_WITH_ZOOM=0
SLIDE_WORDS_LIST=""

process_slide() {
  local body="$1"
  local fm="$2"
  # $3 (slide index) is reserved for future per-slide reporting; intentionally unused.

  # Density control: `zoom:` only appears in per-slide FM.
  if echo "$fm" | grep -qE '^\s*zoom:\s*[0-9]'; then
    SLIDES_WITH_ZOOM=$((SLIDES_WITH_ZOOM + 1))
  fi

  # Word count — body only, with HTML tags and markdown sigils stripped.
  local clean_text
  clean_text="$(echo "$body" | sed 's/<[^>]*>//g' | sed 's/[#*`>|_~\[\]]//g')"
  local words
  words=$(echo "$clean_text" | wc -w | tr -d ' ')
  TOTAL_WORDS=$((TOTAL_WORDS + words))

  if [[ $words -gt $MAX_WORDS ]]; then MAX_WORDS=$words; fi
  if [[ $words -lt $MIN_WORDS ]]; then MIN_WORDS=$words; fi
  SLIDE_WORDS_LIST="${SLIDE_WORDS_LIST}${words} "

  if [[ $words -lt 3 ]]; then
    EMPTY_SLIDES=$((EMPTY_SLIDES + 1))
  fi
  if [[ $words -gt 200 ]]; then
    TEXT_HEAVY_SLIDES=$((TEXT_HEAVY_SLIDES + 1))
  fi

  # Has heading? Body only — title: in FM is metadata, not a visible heading.
  if ! echo "$body" | grep -qE '^\s*#{1,3}\s'; then
    NO_HEADING_SLIDES=$((NO_HEADING_SLIDES + 1))
  fi

  # Animations (body only).
  local vclicks
  vclicks=$(echo "$body" | grep -c '<v-click' || true)
  local vmarks
  vmarks=$(echo "$body" | grep -c '<v-mark' || true)
  TOTAL_VCLICKS=$((TOTAL_VCLICKS + vclicks))
  TOTAL_VMARKS=$((TOTAL_VMARKS + vmarks))
  if [[ $((vclicks + vmarks)) -gt 0 ]]; then
    SLIDES_WITH_ANIMATIONS=$((SLIDES_WITH_ANIMATIONS + 1))
  fi

  # Code blocks (body only).
  local code_blocks
  code_blocks=$(echo "$body" | grep -c '```' || true)
  code_blocks=$((code_blocks / 2))  # opening + closing = 1 block
  TOTAL_CODE_BLOCKS=$((TOTAL_CODE_BLOCKS + code_blocks))

  # First heading for duplicate detection (body only).
  local heading
  heading="$(echo "$body" | grep -E '^\s*#{1,3}\s' | head -1 | sed 's/^[[:space:]#]*//' || true)"
  if [[ -n "$heading" ]]; then
    ALL_HEADINGS="${ALL_HEADINGS}${heading}\n"
  fi

  # Presenter notes (body only) — `<!--` in FM would be unusual and is ignored.
  if echo "$body" | grep -q '<!--'; then
    HAS_NOTES=$((HAS_NOTES + 1))
  fi
}

# State machine walk over body lines.
CURRENT_BODY=""
CURRENT_FM=""
LAST_BODY=""
SLIDE_INDEX=1
IN_FM=false
PEEK_FM=false

flush_slide() {
  process_slide "$CURRENT_BODY" "$CURRENT_FM" "$SLIDE_INDEX"
  LAST_BODY="$CURRENT_BODY"
  CURRENT_BODY=""
  CURRENT_FM=""
}

while IFS= read -r line; do
  # shellcheck disable=SC2001  # sed is clearest for leading-whitespace trim here
  TRIMMED="$(echo "$line" | sed 's/^[[:space:]]*//')"

  if [[ "$IN_FM" == true ]]; then
    # Inside a per-slide FM block. `---` closes it (NOT a slide separator).
    if [[ "$TRIMMED" == "---" ]]; then
      IN_FM=false
    else
      CURRENT_FM="${CURRENT_FM}${line}
"
    fi
    continue
  fi

  # BODY state.
  if [[ "$TRIMMED" == "---" ]]; then
    # Real slide separator. Flush current slide, start next.
    flush_slide
    SLIDE_INDEX=$((SLIDE_INDEX + 1))
    PEEK_FM=true
    continue
  fi

  if [[ "$PEEK_FM" == true ]]; then
    PEEK_FM=false
    # Per slides-parser.js: FM must open IMMEDIATELY after `---`, with the first
    # line matching `key:` at column 0. A blank line means no FM for this slide.
    if [[ -n "$TRIMMED" ]] && [[ "$TRIMMED" =~ ^[a-zA-Z_][a-zA-Z0-9_-]*: ]]; then
      CURRENT_FM="${CURRENT_FM}${line}
"
      IN_FM=true
      continue
    fi
    # Not FM-shaped — fall through and treat this line as body.
  fi

  CURRENT_BODY="${CURRENT_BODY}${line}
"
done <<< "$BODY"

# Flush the trailing slide.
flush_slide

SLIDE_COUNT=$SLIDE_INDEX
# If the file ends with a bare `---` followed by nothing, the last flush
# processed an empty slide. That's a degenerate case and still counts.

if [[ $MIN_WORDS -eq 999999 ]]; then MIN_WORDS=0; fi

# ── Layout analysis ──────────────────────────────────────────────────────────
LAYOUT_DEFAULT=$(grep -cE '^\s*layout:\s*default' "$SLIDES" 2>/dev/null || true)
LAYOUT_CENTER=$(grep -cE '^\s*layout:\s*center' "$SLIDES" 2>/dev/null || true)
LAYOUT_COVER=$(grep -cE '^\s*layout:\s*cover' "$SLIDES" 2>/dev/null || true)
LAYOUT_TWO_COLS=$(grep -cE '^\s*layout:\s*two-cols' "$SLIDES" 2>/dev/null || true)

# ── Structural completeness ──────────────────────────────────────────────────
# Check for cover/opening slide (first slide with a heading)
FIRST_SLIDE_HEADING="$(echo "$BODY" | sed '/^---/q' | grep -E '^\s*#\s' | head -1 || true)"
HAS_COVER=false
if [[ -n "$FIRST_SLIDE_HEADING" ]]; then
  HAS_COVER=true
fi

# Check for closing slide (last slide contains common closing patterns)
LAST_SLIDE="$LAST_BODY"
HAS_CLOSING=false
if echo "$LAST_SLIDE" | grep -qiE '(thank|questions|discussion|Q&A|the end|summary|recap|conclusion|takeaway|谢谢|感谢|提问|讨论|总结|回顾|ありがとう|danke|merci|gracias)'; then
  HAS_CLOSING=true
fi

# Count duplicate headings
DUPLICATE_HEADINGS=0
if [[ -n "$ALL_HEADINGS" ]]; then
  DUPLICATE_HEADINGS=$(echo -e "$ALL_HEADINGS" | sort | uniq -d | wc -l | tr -d ' ')
fi

# Presenter notes coverage
if [[ $SLIDE_COUNT -gt 0 ]]; then
  NOTES_PCT=$(( (HAS_NOTES * 100) / SLIDE_COUNT ))
else
  NOTES_PCT=0
fi

# ── Compute averages ─────────────────────────────────────────────────────────
if [[ $SLIDE_COUNT -gt 0 ]]; then
  AVG_WORDS=$((TOTAL_WORDS / SLIDE_COUNT))
  ANIMATION_PCT=$(( (SLIDES_WITH_ANIMATIONS * 100) / SLIDE_COUNT ))
else
  AVG_WORDS=0
  ANIMATION_PCT=0
fi

# ── Scoring ──────────────────────────────────────────────────────────────────
SCORE=100
SUGGESTIONS=""

add_suggestion() {
  local deduction="$1"
  local msg="$2"
  SCORE=$((SCORE - deduction))
  if [[ -n "$SUGGESTIONS" ]]; then
    SUGGESTIONS="${SUGGESTIONS}\n"
  fi
  SUGGESTIONS="${SUGGESTIONS}- $msg"
}

# Slide count
if [[ $SLIDE_COUNT -lt 3 ]]; then
  add_suggestion 15 "Very few slides ($SLIDE_COUNT). Most presentations need at least 5-8 slides for a complete narrative."
elif [[ $SLIDE_COUNT -gt 40 ]]; then
  add_suggestion 10 "Large deck ($SLIDE_COUNT slides). Consider splitting into sections or removing low-value slides."
fi

# Empty slides
if [[ $EMPTY_SLIDES -gt 1 ]]; then
  add_suggestion 10 "$EMPTY_SLIDES slides have almost no content. Add substance or remove them."
fi

# Text-heavy slides
if [[ $TEXT_HEAVY_SLIDES -gt 0 ]]; then
  add_suggestion $((TEXT_HEAVY_SLIDES * 5)) "$TEXT_HEAVY_SLIDES slide(s) exceed 200 words. Use compact/dense tier (zoom: 0.8-0.9) or split into multiple slides."
fi

# Missing headings
HEADING_MISS_THRESHOLD=$((SLIDE_COUNT / 3))
if [[ $NO_HEADING_SLIDES -gt $HEADING_MISS_THRESHOLD ]] && [[ $NO_HEADING_SLIDES -gt 1 ]]; then
  add_suggestion 5 "$NO_HEADING_SLIDES slides lack headings. Headings help the audience track structure."
fi

# Animation usage
if [[ $SLIDE_COUNT -gt 5 ]] && [[ $ANIMATION_PCT -eq 0 ]]; then
  add_suggestion 5 "No animations used. Consider v-click for step-by-step reveals on complex slides."
elif [[ $ANIMATION_PCT -gt 80 ]]; then
  add_suggestion 5 "Over 80% of slides use animations. Too many click-steps can slow delivery."
fi

# Average word count
if [[ $AVG_WORDS -gt 150 ]]; then
  add_suggestion 10 "Average $AVG_WORDS words per slide. Use zoom/compact-table to fit dense slides, or split content."
elif [[ $AVG_WORDS -lt 10 ]] && [[ $SLIDE_COUNT -gt 3 ]]; then
  add_suggestion 5 "Average only $AVG_WORDS words per slide. Some slides may be too sparse."
fi

# Layout variety
if [[ $SLIDE_COUNT -gt 8 ]] && [[ $LAYOUT_CENTER -eq 0 ]] && [[ $LAYOUT_TWO_COLS -eq 0 ]]; then
  add_suggestion 5 "Only default layout used. Try 'center' for impact slides or two-column layouts for comparisons."
fi

# Structural completeness
if [[ "$HAS_COVER" != true ]] && [[ $SLIDE_COUNT -gt 3 ]]; then
  add_suggestion 5 "No clear cover/title slide detected. The first slide should establish the presentation topic."
fi
if [[ "$HAS_CLOSING" != true ]] && [[ $SLIDE_COUNT -gt 3 ]]; then
  add_suggestion 5 "No closing slide detected (e.g., 'Thank You', 'Questions', 'Summary'). A closing slide signals the presentation is complete."
fi

# Duplicate headings
if [[ $DUPLICATE_HEADINGS -gt 0 ]]; then
  add_suggestion $((DUPLICATE_HEADINGS * 3)) "$DUPLICATE_HEADINGS duplicate heading(s) found. Unique headings help the audience track progress through the deck."
fi

# Presenter notes
if [[ $SLIDE_COUNT -gt 5 ]] && [[ $NOTES_PCT -eq 0 ]]; then
  add_suggestion 3 "No presenter notes found. Add <!-- notes --> comments to help with delivery."
fi

# Clamp score
if [[ $SCORE -lt 0 ]]; then SCORE=0; fi

# Grade
if [[ $SCORE -ge 90 ]]; then GRADE="Excellent"
elif [[ $SCORE -ge 70 ]]; then GRADE="Good"
elif [[ $SCORE -ge 50 ]]; then GRADE="Fair"
else GRADE="Needs Work"
fi

# ── Output ───────────────────────────────────────────────────────────────────
if [[ "$JSON_MODE" == true ]]; then
  # Escape file path for JSON safety (handle backslashes and quotes)
  SAFE_PATH="$(printf '%s' "$SLIDES" | sed 's/\\/\\\\/g; s/"/\\"/g')"
  cat <<JSON_EOF
{
  "file": "$SAFE_PATH",
  "score": $SCORE,
  "grade": "$GRADE",
  "structure": {
    "slide_count": $SLIDE_COUNT,
    "empty_slides": $EMPTY_SLIDES,
    "text_heavy_slides": $TEXT_HEAVY_SLIDES,
    "no_heading_slides": $NO_HEADING_SLIDES,
    "slides_with_zoom": $SLIDES_WITH_ZOOM
  },
  "content": {
    "total_words": $TOTAL_WORDS,
    "avg_words_per_slide": $AVG_WORDS,
    "max_words": $MAX_WORDS,
    "min_words": $MIN_WORDS
  },
  "interactivity": {
    "slides_with_animations": $SLIDES_WITH_ANIMATIONS,
    "animation_percentage": $ANIMATION_PCT,
    "total_v_clicks": $TOTAL_VCLICKS,
    "total_v_marks": $TOTAL_VMARKS,
    "total_code_blocks": $TOTAL_CODE_BLOCKS
  },
  "completeness": {
    "has_cover": $( [[ "$HAS_COVER" == true ]] && echo "true" || echo "false" ),
    "has_closing": $( [[ "$HAS_CLOSING" == true ]] && echo "true" || echo "false" ),
    "duplicate_headings": $DUPLICATE_HEADINGS,
    "slides_with_notes": $HAS_NOTES,
    "notes_percentage": $NOTES_PCT
  },
  "layouts": {
    "default": $LAYOUT_DEFAULT,
    "center": $LAYOUT_CENTER,
    "cover": $LAYOUT_COVER,
    "two_cols": $LAYOUT_TWO_COLS
  }
}
JSON_EOF
else
  echo "============================================"
  echo "  Presentation Quality Review"
  echo "============================================"
  echo ""
  echo "File:  $SLIDES"
  echo "Score: $SCORE / 100  ($GRADE)"
  echo ""
  echo "── Structure ──────────────────────────────"
  echo "  Slides:           $SLIDE_COUNT"
  echo "  Empty slides:     $EMPTY_SLIDES"
  echo "  Text-heavy:       $TEXT_HEAVY_SLIDES (>200 words)"
  echo "  Missing headings: $NO_HEADING_SLIDES"
  echo "  Zoomed slides:    $SLIDES_WITH_ZOOM (using density control)"
  echo ""
  echo "── Content ────────────────────────────────"
  echo "  Total words:      $TOTAL_WORDS"
  echo "  Avg per slide:    $AVG_WORDS"
  echo "  Range:            $MIN_WORDS – $MAX_WORDS words"
  echo "  Code blocks:      $TOTAL_CODE_BLOCKS"
  echo ""
  echo "── Interactivity ──────────────────────────"
  echo "  Animated slides:  $SLIDES_WITH_ANIMATIONS / $SLIDE_COUNT ($ANIMATION_PCT%)"
  echo "  v-click uses:     $TOTAL_VCLICKS"
  echo "  v-mark uses:      $TOTAL_VMARKS"
  echo ""
  echo "── Completeness ───────────────────────────"
  echo "  Cover slide:      $( [[ "$HAS_COVER" == true ]] && echo "yes" || echo "no" )"
  echo "  Closing slide:    $( [[ "$HAS_CLOSING" == true ]] && echo "yes" || echo "no" )"
  echo "  Duplicate heads:  $DUPLICATE_HEADINGS"
  echo "  Presenter notes:  $HAS_NOTES / $SLIDE_COUNT slides ($NOTES_PCT%)"
  echo ""
  echo "── Layouts ────────────────────────────────"
  echo "  default:   $LAYOUT_DEFAULT"
  echo "  center:    $LAYOUT_CENTER"
  echo "  cover:     $LAYOUT_COVER"
  echo "  two-cols:  $LAYOUT_TWO_COLS"

  if [[ -n "$SUGGESTIONS" ]]; then
    echo ""
    echo "── Suggestions ────────────────────────────"
    echo -e "$SUGGESTIONS"
  fi

  echo ""
  echo "============================================"
fi

if [[ $SCORE -lt 70 ]]; then
  exit 1
else
  exit 0
fi
