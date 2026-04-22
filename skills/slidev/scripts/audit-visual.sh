#!/usr/bin/env bash
# audit-visual.sh — Run Playwright-driven visual audit of themes × layouts.
# Usage: bash scripts/audit-visual.sh
# Exit 0 if all 90 checks pass, 1 otherwise.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
RUNNER="$SKILL_ROOT/assets/runner"

if ! node -e "require('playwright')" 2>/dev/null; then
  echo "Playwright not installed. Install with:"
  echo "  (cd $RUNNER && npm install --no-save playwright)"
  echo "  npx --prefix $RUNNER playwright install chromium"
  exit 2
fi

NODE_PATH="$RUNNER/node_modules" node "$SCRIPT_DIR/lib/audit-visual.js" "$SKILL_ROOT"
