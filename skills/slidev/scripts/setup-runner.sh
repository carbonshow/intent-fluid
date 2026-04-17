#!/usr/bin/env bash
# setup-runner.sh — Install Slidev runner dependencies.
# Usage: bash <skill-root>/scripts/setup-runner.sh
#
# Idempotent: safe to run multiple times.
# Requires: Node.js >= 18, npm

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
RUNNER_DIR="$SKILL_ROOT/assets/runner"

# 1. Check Node.js version
if ! command -v node &>/dev/null; then
  echo "ERROR: Node.js is not installed. Install Node.js >= 18 from https://nodejs.org"
  exit 1
fi

NODE_VERSION=$(node --version | sed 's/v//' | cut -d. -f1)
if [[ "$NODE_VERSION" -lt 18 ]]; then
  echo "ERROR: Node.js >= 18 required (found: $(node --version))"
  exit 1
fi

# 2. Check runner directory
if [[ ! -f "$RUNNER_DIR/package.json" ]]; then
  echo "ERROR: Runner package.json not found at $RUNNER_DIR"
  exit 1
fi

# 3. Install dependencies
echo "Installing Slidev runner dependencies in $RUNNER_DIR ..."
cd "$RUNNER_DIR" && npm install --no-audit --no-fund

# 4. Verify installation
if [[ -d "$RUNNER_DIR/node_modules/@slidev/cli" ]]; then
  CLI_VER=$(node -p "require('$RUNNER_DIR/node_modules/@slidev/cli/package.json').version")
  THEME_VER=$(node -p "require('$RUNNER_DIR/node_modules/@slidev/theme-default/package.json').version")
  echo ""
  echo "Runner ready at $RUNNER_DIR"
  echo "  @slidev/cli:           $CLI_VER"
  echo "  @slidev/theme-default: $THEME_VER"
else
  echo "ERROR: Installation failed — @slidev/cli not found in node_modules"
  exit 1
fi
