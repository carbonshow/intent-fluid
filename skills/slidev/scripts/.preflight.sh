#!/usr/bin/env bash
# .preflight.sh — dev-only: lint all shell and markdown under the skill.
# Not invoked from SKILL.md; kept in the skill tree for convenience.
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "== shellcheck =="
if command -v shellcheck >/dev/null 2>&1; then
  find "$SKILL_ROOT/scripts" -name '*.sh' -not -name '.preflight.sh' -print0 \
    | xargs -0 shellcheck -s bash
else
  echo "shellcheck not installed — skipping"
fi

echo "== markdown trailing whitespace =="
if grep -rn --include='*.md' ' $' "$SKILL_ROOT"; then
  echo "Found trailing whitespace" >&2
  exit 1
fi

echo "Preflight OK"
