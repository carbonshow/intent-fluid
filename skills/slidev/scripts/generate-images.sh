#!/usr/bin/env bash
# generate-images.sh — Bash wrapper for SP2 image generation pipeline.
#
# Usage:
#   bash scripts/generate-images.sh <deck-dir> [--dry-run] [--force] [--mock <scenario>]
#
# Environment (forwarded):
#   GEMINI_API_KEY   Required for real generation. Missing → placeholders.
#   GEMINI_MODEL     Optional override (default: gemini-2.5-flash-image).

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
RUNNER="$SKILL_ROOT/assets/runner"

if [[ $# -lt 1 ]]; then
  echo "Usage: bash scripts/generate-images.sh <deck-dir> [--dry-run] [--force] [--mock <scenario>]" >&2
  exit 1
fi

# Use runner node_modules path if present; otherwise Node resolves nothing extra
# (generate-images.js has zero runtime deps, so this is purely defensive).
export NODE_PATH="${NODE_PATH:-$RUNNER/node_modules}"

exec node "$SKILL_ROOT/scripts/lib/generate-images.js" "$@"
