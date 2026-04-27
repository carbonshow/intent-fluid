#!/usr/bin/env bash
# run.sh — Unified Slidev command runner using the shared runner.
# Usage: bash scripts/run.sh <command> <slides_path> [extra_flags...]
#
# Commands:
#   dev     Start development server with hot reload (default port 3030)
#   export  Export slides to PDF
#   build   Build static HTML site
#
# All paths are resolved automatically from the runner installation.
# Extra flags are passed through to @slidev/cli.
#
# Examples:
#   bash scripts/run.sh dev ./my-talk/slides.md
#   bash scripts/run.sh export ./my-talk/slides.md --with-clicks
#   bash scripts/run.sh dev ./my-talk/slides.md --port 3031

set -euo pipefail

# ── Resolve paths ────────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
RUNNER="$SKILL_ROOT/assets/runner"
THEME="$RUNNER/node_modules/@slidev/theme-default"

# ── Usage ────────────────────────────────────────────────────────────────────
usage() {
  cat <<EOF
Usage: bash scripts/run.sh <command> <slides_path> [extra_flags...]

Commands:
  dev      Start dev server with hot reload (default port 3030)
  export   Export to PDF (install Playwright first: npx playwright install chromium)
  build    Build static HTML site to dist/

Extra flags are passed through to @slidev/cli.

Examples:
  bash scripts/run.sh dev ./talk/slides.md
  bash scripts/run.sh export ./talk/slides.md --with-clicks
  bash scripts/run.sh dev ./talk/slides.md --port 3031
EOF
  exit 0
}

if [[ $# -lt 2 ]] || [[ "$1" == "-h" ]] || [[ "$1" == "--help" ]]; then
  usage
fi

COMMAND="$1"
SLIDES="$2"
shift 2
EXTRA_FLAGS=("$@")

# ── Validate command ─────────────────────────────────────────────────────────
case "$COMMAND" in
  dev|export|build) ;;
  *)
    echo "Error: unknown command '$COMMAND'. Use dev, export, or build." >&2
    exit 1
    ;;
esac

# ── Resolve slides to absolute path ─────────────────────────────────────────
if [[ ! -f "$SLIDES" ]]; then
  echo "Error: slides file not found: $SLIDES" >&2
  exit 1
fi
SLIDES_ABS="$(cd "$(dirname "$SLIDES")" && pwd)/$(basename "$SLIDES")"
# Resolve symlinks (e.g. macOS /tmp → /private/tmp) so Vite's build-html plugin
# does not reject the path as "not relative to project root".
if command -v realpath &>/dev/null; then
  SLIDES_ABS="$(realpath "$SLIDES_ABS")"
fi

# ── Ensure runner is ready ───────────────────────────────────────────────────
if [[ ! -d "$RUNNER/node_modules/@slidev/cli" ]]; then
  echo "Runner not initialized. Running setup..."
  bash "$SKILL_ROOT/scripts/setup-runner.sh"
  echo ""
fi

if [[ ! -d "$THEME" ]]; then
  echo "Error: theme not found at $THEME" >&2
  echo "Try running: bash $SKILL_ROOT/scripts/setup-runner.sh" >&2
  exit 1
fi

# ── Ensure node_modules symlink in slides directory ─────────────────────────
# Slidev resolves dependencies from the entry file's directory, not from CWD.
# A symlink to the shared runner's node_modules ensures Mermaid, themes, and
# other plugins are found without per-project npm install.
SLIDES_DIR="$(dirname "$SLIDES_ABS")"
RUNNER_ABS="$(cd "$RUNNER" && pwd)"
TARGET_MODULES="$SLIDES_DIR/node_modules"
if [[ ! -L "$TARGET_MODULES" ]] && [[ ! -d "$TARGET_MODULES" ]]; then
  ln -s "$RUNNER_ABS/node_modules" "$TARGET_MODULES"
elif [[ -L "$TARGET_MODULES" ]]; then
  # Refresh if symlink points to wrong location
  CURRENT_TARGET="$(readlink "$TARGET_MODULES")"
  if [[ "$CURRENT_TARGET" != "$RUNNER_ABS/node_modules" ]]; then
    rm "$TARGET_MODULES"
    ln -s "$RUNNER_ABS/node_modules" "$TARGET_MODULES"
  fi
fi

# ── Playwright check for export ──────────────────────────────────────────────
if [[ "$COMMAND" == "export" ]]; then
  if ! npx playwright --version &>/dev/null; then
    echo "Warning: Playwright may not be installed."
    echo "If export fails, run: npx playwright install chromium"
    echo ""
  fi
fi

# ── Execute ──────────────────────────────────────────────────────────────────
echo "Running: slidev $COMMAND"
echo "  Slides: $SLIDES_ABS"
echo "  Theme:  $THEME"
if [[ ${#EXTRA_FLAGS[@]} -gt 0 ]]; then
  echo "  Flags:  ${EXTRA_FLAGS[*]}"
fi
echo ""

# Run from the slides directory so Vite cache stays local (not in ancestor dirs).
# The node_modules symlink ensures all dependencies are found.
cd "$SLIDES_DIR"

case "$COMMAND" in
  dev)
    exec npx @slidev/cli "$SLIDES_ABS" --theme "$THEME" ${EXTRA_FLAGS[@]+"${EXTRA_FLAGS[@]}"}
    ;;
  export)
    exec npx @slidev/cli export "$SLIDES_ABS" --theme "$THEME" ${EXTRA_FLAGS[@]+"${EXTRA_FLAGS[@]}"}
    ;;
  build)
    exec npx @slidev/cli build "$SLIDES_ABS" --theme "$THEME" ${EXTRA_FLAGS[@]+"${EXTRA_FLAGS[@]}"}
    ;;
esac
