#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if ! command -v deno &>/dev/null; then
    echo "Error: Deno is required but not found on PATH." >&2
    exit 1
fi

exec deno run --allow-read --allow-write "${SCRIPT_DIR}/trace.ts" "$@"
