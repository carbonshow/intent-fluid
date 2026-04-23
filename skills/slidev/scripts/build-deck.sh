#!/usr/bin/env bash
# build-deck.sh — One-shot SP1+SP2 build: validate → generate images → slidev build.
#
# Usage:
#   bash scripts/build-deck.sh <deck-dir> [--force-images] [--skip-images]
#
# Flags:
#   --force-images   Pass --force to generate-images (regenerate all)
#   --skip-images    Skip image generation (useful for quick rebuilds during dev)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

if [[ $# -lt 1 ]] || [[ "$1" == "-h" ]] || [[ "$1" == "--help" ]]; then
  cat <<EOF
Usage: bash scripts/build-deck.sh <deck-dir> [--force-images] [--skip-images]

Runs SP1 validate → SP2 image generation → Slidev build.
Outputs dist/ inside the deck directory.
EOF
  exit 0
fi

DECK="$1"
shift

FORCE_IMAGES=false
SKIP_IMAGES=false
while [[ $# -gt 0 ]]; do
  case "$1" in
    --force-images) FORCE_IMAGES=true; shift ;;
    --skip-images)  SKIP_IMAGES=true;  shift ;;
    *) echo "Error: unknown flag $1" >&2; exit 1 ;;
  esac
done

if [[ ! -d "$DECK" ]]; then
  echo "Error: deck directory not found: $DECK" >&2
  exit 1
fi

SLIDES="$DECK/slides.md"
if [[ ! -f "$SLIDES" ]]; then
  echo "Error: slides.md not found in deck: $SLIDES" >&2
  exit 1
fi

echo "━━━ [1/3] Validate ━━━"
bash "$SKILL_ROOT/scripts/validate-slides.sh" "$SLIDES"

echo ""
echo "━━━ [2/3] Generate Images ━━━"
if [[ "$SKIP_IMAGES" == true ]]; then
  echo "[build-deck] --skip-images: skipping SP2 generation."
else
  GEN_FLAGS=()
  [[ "$FORCE_IMAGES" == true ]] && GEN_FLAGS+=(--force)
  bash "$SKILL_ROOT/scripts/generate-images.sh" "$DECK" ${GEN_FLAGS[@]+"${GEN_FLAGS[@]}"}
fi

echo ""
echo "━━━ [3/3] Build ━━━"
bash "$SKILL_ROOT/scripts/run.sh" build "$SLIDES"

echo ""
echo "━━━ Done ━━━"
echo "Output: $DECK/dist/"
