#!/usr/bin/env bash
# new-presentation.sh — Initialize a new Slidev presentation from the starter template.
# Usage: bash scripts/new-presentation.sh <target_dir> [--title "Title"] [--author "Name"] [--minimal]
#
# Copies the starter template, substitutes title/date/author, and ensures the
# shared runner is ready.  Idempotent: refuses to overwrite an existing directory
# unless --force is given.
#
# Requires: Node.js >= 18, npm

set -euo pipefail

# ── Resolve skill root from script location ──────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
STARTER="$SKILL_ROOT/assets/slidev-starter"

# ── Defaults ─────────────────────────────────────────────────────────────────
TITLE="My Presentation"
AUTHOR=""
DATE="$(date +%Y-%m-%d)"
THEME="tech-dark"
MINIMAL=false
FORCE=false

# List of valid themes — must stay in sync with files under assets/themes/*.css
AVAILABLE_THEMES=(tech-dark code-focus-light corporate-navy minimal-exec edu-warm playful-bright)

# ── Parse arguments ──────────────────────────────────────────────────────────
usage() {
  cat <<EOF
Usage: bash scripts/new-presentation.sh <target_dir> [options]

Options:
  --title "Title"   Set presentation title (default: "My Presentation")
  --author "Name"   Set author name
  --theme "Name"    Select theme: tech-dark (default) / code-focus-light /
                    corporate-navy / minimal-exec / edu-warm / playful-bright
  --minimal         Use minimal template (cover + one content + closing)
  --force           Overwrite existing target directory
  -h, --help        Show this help

Examples:
  bash scripts/new-presentation.sh ./my-talk --title "Quarterly Review"
  bash scripts/new-presentation.sh ./demo --title "API Design" --author "Alice" --minimal
EOF
  exit 0
}

TARGET_DIR=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --title)   TITLE="$2"; shift 2 ;;
    --author)  AUTHOR="$2"; shift 2 ;;
    --theme)   THEME="$2"; shift 2 ;;
    --minimal) MINIMAL=true; shift ;;
    --force)   FORCE=true; shift ;;
    -h|--help) usage ;;
    -*)        echo "Error: unknown option $1" >&2; exit 1 ;;
    *)
      if [[ -z "$TARGET_DIR" ]]; then
        TARGET_DIR="$1"; shift
      else
        echo "Error: unexpected argument $1" >&2; exit 1
      fi
      ;;
  esac
done

if [[ -z "$TARGET_DIR" ]]; then
  echo "Error: target directory is required." >&2
  echo "Run with --help for usage." >&2
  exit 1
fi

# ── Validate theme name ──────────────────────────────────────────────────────
VALID_THEME=false
for T in "${AVAILABLE_THEMES[@]}"; do
  if [[ "$T" == "$THEME" ]]; then
    VALID_THEME=true
    break
  fi
done
if [[ "$VALID_THEME" != true ]]; then
  echo "Error: unknown theme '$THEME'." >&2
  echo "Available themes:" >&2
  for T in "${AVAILABLE_THEMES[@]}"; do
    echo "  - $T" >&2
  done
  exit 1
fi

# Verify the CSS file actually exists
THEME_CSS="$SKILL_ROOT/assets/themes/$THEME.css"
if [[ ! -f "$THEME_CSS" ]]; then
  echo "Error: theme CSS file not found: $THEME_CSS" >&2
  echo "Check skill install integrity." >&2
  exit 1
fi

# ── Validate starter template ───────────────────────────────────────────────
if [[ ! -f "$STARTER/slides.md" ]]; then
  echo "Error: starter template not found at $STARTER/slides.md" >&2
  exit 1
fi

# ── Guard against overwrite ──────────────────────────────────────────────────
if [[ -d "$TARGET_DIR" ]] && [[ "$FORCE" != true ]]; then
  echo "Error: directory already exists: $TARGET_DIR" >&2
  echo "Use --force to overwrite." >&2
  exit 1
fi

# ── Create target structure ──────────────────────────────────────────────────
mkdir -p "$TARGET_DIR/public/fonts"

# ── Copy template files ─────────────────────────────────────────────────────
cp "$THEME_CSS" "$TARGET_DIR/style.css"
# Also copy the shared design-token skeleton that themes @import
if [[ -f "$SKILL_ROOT/assets/themes/_skeleton.css" ]]; then
  cp "$SKILL_ROOT/assets/themes/_skeleton.css" "$TARGET_DIR/_skeleton.css"
fi
# SP2: Copy the theme's image-style.txt for Gemini prompt injection
THEME_IMAGE_STYLE="$SKILL_ROOT/assets/themes/$THEME.image-style.txt"
if [[ -f "$THEME_IMAGE_STYLE" ]]; then
  cp "$THEME_IMAGE_STYLE" "$TARGET_DIR/image-style.txt"
fi

if [[ "$MINIMAL" == true ]]; then
  # Minimal: cover + one content slide + closing
  cat > "$TARGET_DIR/slides.md" <<'SLIDES_EOF'
---
title: __TITLE__
date: __DATE__
theme: default
colorSchema: light
layout: cover
class: skeleton-hero
highlighter: shiki
---

# __TITLE__

__AUTHOR_LINE__

---
layout: default
---

# Key Point

- First item
- Second item
- Third item

---
layout: center
class: text-center
---

# Thank You

Questions & Discussion
SLIDES_EOF
else
  cp "$STARTER/slides.md" "$TARGET_DIR/slides.md"
fi

# ── Substitute placeholders ─────────────────────────────────────────────────
SLIDES_FILE="$TARGET_DIR/slides.md"

# Escape special characters for sed replacement strings (& \ /)
escape_sed() { printf '%s' "$1" | sed 's/[&/\]/\\&/g'; }

SAFE_TITLE="$(escape_sed "$TITLE")"
SAFE_AUTHOR="$(escape_sed "$AUTHOR")"

if [[ "$MINIMAL" == true ]]; then
  # Minimal template uses __PLACEHOLDER__ tokens
  sed -i.bak "s/__TITLE__/$SAFE_TITLE/g" "$SLIDES_FILE"
  sed -i.bak "s/__DATE__/$DATE/g" "$SLIDES_FILE"
  if [[ -n "$AUTHOR" ]]; then
    sed -i.bak "s/__AUTHOR_LINE__/$SAFE_AUTHOR/" "$SLIDES_FILE"
  else
    sed -i.bak "s/__AUTHOR_LINE__//" "$SLIDES_FILE"
  fi
else
  # Full template uses literal strings from the starter
  sed -i.bak "s/title: My Presentation/title: $SAFE_TITLE/" "$SLIDES_FILE"
  sed -i.bak "s/# My Presentation/# $SAFE_TITLE/g" "$SLIDES_FILE"
  sed -i.bak "s/date: [0-9]\{4\}-[0-9]\{2\}-[0-9]\{2\}/date: $DATE/" "$SLIDES_FILE"
  if [[ -n "$AUTHOR" ]]; then
    sed -i.bak "s/Your Name · Date/$SAFE_AUTHOR · $DATE/" "$SLIDES_FILE"
  fi
fi

# Clean up sed backup files
rm -f "$SLIDES_FILE.bak"

# ── Ensure runner is ready ───────────────────────────────────────────────────
RUNNER="$SKILL_ROOT/assets/runner"
if [[ ! -d "$RUNNER/node_modules/@slidev/cli" ]]; then
  echo "Runner not initialized. Running setup..."
  bash "$SKILL_ROOT/scripts/setup-runner.sh"
  echo ""
fi

# ── Link runner node_modules into target ─────────────────────────────────────
# Slidev resolves dependencies from the entry file's directory, not from CWD.
# Without this symlink, features like Mermaid diagrams, themes, and plugins
# cannot be found, and Vite may pollute ancestor directories with cache files.
RUNNER_ABS="$(cd "$RUNNER" && pwd)"
TARGET_MODULES="$TARGET_DIR/node_modules"
if [[ -L "$TARGET_MODULES" ]]; then
  rm "$TARGET_MODULES"
fi
ln -s "$RUNNER_ABS/node_modules" "$TARGET_MODULES"

# Create a minimal package.json to anchor Vite's project root detection.
# Without this, Vite walks up the directory tree looking for a package.json
# and may create .vite cache directories in ancestor projects.
if [[ ! -f "$TARGET_DIR/package.json" ]]; then
  cat > "$TARGET_DIR/package.json" << 'PKG_EOF'
{
  "private": true,
  "description": "Slidev presentation — managed by slidev skill"
}
PKG_EOF
fi

# SP2: Ensure .env is gitignored so users' GEMINI_API_KEY doesn't leak
GITIGNORE="$TARGET_DIR/.gitignore"
if [[ ! -f "$GITIGNORE" ]] || ! grep -qxF '.env' "$GITIGNORE"; then
  echo '.env' >> "$GITIGNORE"
fi

# ── Summary ──────────────────────────────────────────────────────────────────
TARGET_ABS="$(cd "$TARGET_DIR" && pwd)"
echo "Presentation created at: $TARGET_ABS"
echo ""
echo "Files:"
echo "  slides.md   — edit this to build your deck"
echo "  style.css   — customize colors, fonts, spacing"
echo "  public/     — place images and font files here"
echo ""
echo "Next steps:"
echo "  # Start dev server (hot reload)"
echo "  bash $SKILL_ROOT/scripts/run.sh dev $TARGET_ABS/slides.md"
echo ""
echo "  # Export to PDF"
echo "  bash $SKILL_ROOT/scripts/run.sh export $TARGET_ABS/slides.md"
echo ""
echo "  # Validate slides before export"
echo "  bash $SKILL_ROOT/scripts/validate-slides.sh $TARGET_ABS/slides.md"
echo ""
echo "  # Review presentation quality"
echo "  bash $SKILL_ROOT/scripts/review-presentation.sh $TARGET_ABS/slides.md"
echo ""
echo "SP2 — Image generation:"
echo "  If your deck uses image-focus / image-text-split / two-columns(image) layouts,"
echo "  images are auto-generated when you run build-deck.sh (requires GEMINI_API_KEY)."
echo "  See skills/slidev/references/image-generation.md for key setup."
echo ""
echo "  # Build with SP1 validation + SP2 image generation"
echo "  bash $SKILL_ROOT/scripts/build-deck.sh $TARGET_ABS"
