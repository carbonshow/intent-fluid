#!/usr/bin/env bash
# state.sh - Read/update YAML fields in state.md safely.
# Supports multi-line blocks (arrays/objects) using Node.js.
# PREREQUISITE: Node.js 12+ must be available on PATH.

set -euo pipefail

# --- Node.js check ---
if ! command -v node &>/dev/null; then
    echo "Error: Node.js is required but not found on PATH." >&2
    echo "state.sh uses Node.js for reliable YAML field parsing." >&2
    echo "Install Node.js (v12+) or use manual Read/Edit on state.md." >&2
    exit 1
fi

# --- Usage ---
usage() {
    echo "Usage: bash scripts/state.sh <subcommand> <state_file> [field] [value]"
    echo ""
    echo "Subcommands:"
    echo "  get <state_file> <field>          read field value"
    echo "  set <state_file> <field> <value>  set field value"
    echo "  increment <state_file> <field>    increment numeric field by 1"
    echo "  show <state_file>                 show all fields"
    echo ""
    echo "Examples:"
    echo "  bash scripts/state.sh get ./state.md current_phase"
    echo "  bash scripts/state.sh set ./state.md current_phase design"
    echo "  bash scripts/state.sh increment ./state.md iteration"
    echo "  bash scripts/state.sh show ./state.md"
    exit 1
}

if [[ $# -lt 2 ]]; then
    usage
fi

SUBCMD="$1"
STATE_FILE="$2"

# Validate state file exists
if [[ ! -f "$STATE_FILE" ]]; then
    # Detect common mistake: swapped subcommand and file arguments
    if [[ "$STATE_FILE" =~ ^(get|set|increment|show)$ ]]; then
        echo "Error: it looks like you swapped the subcommand and file path." >&2
        echo "  You wrote:  state.sh $SUBCMD $STATE_FILE ..." >&2
        echo "  Correct:    state.sh $STATE_FILE $SUBCMD ..." >&2
        echo "" >&2
        echo "Usage: bash scripts/state.sh <subcommand> <state_file> [field] [value]" >&2
    else
        echo "Error: state file does not exist: ${STATE_FILE}" >&2
    fi
    exit 1
fi

if [[ "$SUBCMD" == "show" ]]; then
    echo "--- ${STATE_FILE} ---"
    cat "$STATE_FILE"
    exit 0
fi

# Use Node.js for robust regex-based multi-line parsing
# This replaces the brittle sed-based logic which corrupted arrays/objects
node -e '
const fs = require("fs");
const subcmd = process.argv[1];
const file = process.argv[2];
const field = process.argv[3];
let newValue = process.argv[4];

if (!field) {
    console.error("Usage Error: missing field argument");
    process.exit(1);
}

let text = fs.readFileSync(file, "utf8");
// Regex to match a key at root level, and all subsequent lines that are indented
const regex = new RegExp(`^(${field}):([ \\t]*.*(?:\\n[ \\t]+.*)*)`, "m");

const match = text.match(regex);
if (!match) {
    console.error(`Error: field does not exist: ${field}`);
    process.exit(1);
}

let val = match[2];
let isQuoted = false;
let trimmedVal = val.trim();
if (trimmedVal.startsWith("\"") && trimmedVal.endsWith("\"") && !trimmedVal.includes("\n")) {
    isQuoted = true;
    trimmedVal = trimmedVal.slice(1, -1);
}

if (subcmd === "get") {
    console.log(trimmedVal);
} else if (subcmd === "set" || subcmd === "increment") {
    if (subcmd === "increment") {
        const num = parseInt(trimmedVal, 10);
        if (isNaN(num)) {
            console.error(`Error: field value is not a number: ${field} = ${trimmedVal}`);
            process.exit(1);
        }
        newValue = (num + 1).toString();
    } else {
        if (newValue === undefined) {
             console.error("Usage Error: missing value argument");
             process.exit(1);
        }
    }
    
    let replacement = `${field}:`;
    if (newValue.includes("\n") || newValue.trim().startsWith("-") || newValue.trim().startsWith("{") || newValue.trim().startsWith("[")) {
        // Multi-line or array/object
        replacement += (newValue.startsWith("\n") ? "" : "\n") + newValue;
    } else {
        // Single line
        if (isQuoted && !newValue.startsWith("\"")) {
            replacement += ` "${newValue}"`;
        } else {
            replacement += ` ${newValue}`;
        }
    }
    
    text = text.replace(regex, replacement);
    fs.writeFileSync(file, text);
    
    if (subcmd === "increment") {
        console.log(`${field}: ${trimmedVal} → ${newValue}`);
    } else {
        console.log(`${field}: ${newValue}`);
    }
} else {
    console.error(`Error: unknown subcommand: ${subcmd}`);
    process.exit(1);
}
' "$SUBCMD" "$STATE_FILE" "${3:-}" "${4:-}"