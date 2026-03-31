#!/usr/bin/env bash
# merge-parallel.sh - Merge parallel implement outputs into a single file.
# Combines iter_{NN}_implement_*.md files into iter_{NN}_implement.md.

set -euo pipefail

# --- Usage ---
usage() {
    echo "Usage: bash scripts/merge-parallel.sh <task_dir> <iteration>"
    echo ""
    echo "Arguments:"
    echo "  task_dir    path to task directory (e.g., .surge/tasks/20260319-abc1)"
    echo "  iteration   iteration number (e.g., 1)"
    echo ""
    echo "Example: bash scripts/merge-parallel.sh .surge/tasks/20260319-abc1 1"
    exit 1
}

if [[ $# -ne 2 ]]; then
    usage
fi

TASK_DIR="$1"
ITERATION="$2"
ITER_DIR="${TASK_DIR}/iterations"

# Validate task directory
if [[ ! -d "$ITER_DIR" ]]; then
    echo "Error: iterations directory does not exist: ${ITER_DIR}" >&2
    echo "" >&2
    echo "Hint: the first argument should be the task directory (containing iterations/)," >&2
    echo "  not the iterations directory itself." >&2
    echo "" >&2
    echo "  Correct:  merge-parallel.sh .surge/tasks/my-task 1" >&2
    echo "  Wrong:    merge-parallel.sh .surge/tasks/my-task/iterations iter_01_implement" >&2
    exit 1
fi

# Validate iteration is a number
if ! [[ "$ITERATION" =~ ^[0-9]+$ ]]; then
    echo "Error: iteration must be a number: ${ITERATION}" >&2
    exit 1
fi

# Zero-pad iteration number to 2 digits
NN=$(printf "%02d" "$ITERATION")
PATTERN="iter_${NN}_implement_"
OUTPUT_FILE="${ITER_DIR}/iter_${NN}_implement.md"

# Find all matching partial implement files, sorted by name
PART_FILES=()
while IFS= read -r -d '' f; do
    PART_FILES+=("$f")
done < <(find "$ITER_DIR" -maxdepth 1 -name "${PATTERN}*.md" -print0 | sort -z)

if [[ ${#PART_FILES[@]} -eq 0 ]]; then
    echo "Error: no matching files found: ${ITER_DIR}/${PATTERN}*.md" >&2
    exit 1
fi

echo "Merging parallel implementation outputs for iteration ${ITERATION}..."
echo "  Found ${#PART_FILES[@]} module files:"

# Build merged file
{
    echo "# Iteration ${NN} - Implement (Merged)"
    echo ""
    echo "> Auto-merged by merge-parallel.sh, total ${#PART_FILES[@]} modules."
    echo ""

    FIRST=true
    for f in "${PART_FILES[@]}"; do
        BASENAME=$(basename "$f")
        # Extract module name: iter_NN_implement_<module>.md -> <module>
        MODULE_NAME="${BASENAME#${PATTERN}}"
        MODULE_NAME="${MODULE_NAME%.md}"

        if [[ "$FIRST" == true ]]; then
            FIRST=false
        else
            # Horizontal rule separator between modules
            echo ""
            echo "---"
            echo ""
        fi

        echo "## Module: ${MODULE_NAME}"
        echo ""
        cat "$f"
        echo ""
    done
} > "$OUTPUT_FILE"

# Print progress to stdout (outside the redirect block)
for f in "${PART_FILES[@]}"; do
    BASENAME=$(basename "$f")
    MODULE_NAME="${BASENAME#${PATTERN}}"
    MODULE_NAME="${MODULE_NAME%.md}"
    echo "  - ${BASENAME} (${MODULE_NAME})"
done

echo ""
echo "Merge Complete ✓"
echo "  Output file: ${OUTPUT_FILE}"
echo "  Module count: ${#PART_FILES[@]}"