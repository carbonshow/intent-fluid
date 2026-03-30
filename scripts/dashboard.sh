#!/usr/bin/env bash
# dashboard.sh — Lifecycle management for the intent-fluid trace dashboard.
# Framework-level script: works with any intent-fluid skill.
# PREREQUISITE: Node.js 12+ must be available on PATH.
#
# Usage:
#   bash scripts/dashboard.sh start  <task_dir> [--skill-dir <path>] [--port <port>]
#   bash scripts/dashboard.sh stop   <task_dir>
#   bash scripts/dashboard.sh status <task_dir>
#
# Examples:
#   bash scripts/dashboard.sh start .surge/tasks/20260327-abc1 --skill-dir skills/surge
#   bash scripts/dashboard.sh stop  .surge/tasks/20260327-abc1
#   bash scripts/dashboard.sh status .surge/tasks/20260327-abc1

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVER_JS="${SCRIPT_DIR}/dashboard-server.js"

# --- Usage ---
usage() {
    echo "Usage: bash scripts/dashboard.sh <command> <task_dir> [options]"
    echo ""
    echo "Commands:"
    echo "  start   Start the dashboard server"
    echo "  stop    Stop the dashboard server"
    echo "  status  Check if the dashboard is running"
    echo ""
    echo "Options (start only):"
    echo "  --skill-dir <path>  Path to skill directory with SKILL.md"
    echo "  --port <port>       Starting port number (default: 9500)"
    echo ""
    echo "Examples:"
    echo "  bash scripts/dashboard.sh start .surge/tasks/20260327-abc1 --skill-dir skills/surge"
    echo "  bash scripts/dashboard.sh stop .surge/tasks/20260327-abc1"
    exit 1
}

if [[ $# -lt 2 ]]; then
    usage
fi

COMMAND="$1"
TASK_DIR="${2%/}"
shift 2

# Validate task directory
if [[ ! -d "$TASK_DIR" ]]; then
    echo "Error: task directory does not exist: ${TASK_DIR}" >&2
    exit 1
fi

PID_FILE="${TASK_DIR}/.dashboard.pid"

# --- Helper: check if PID is alive ---
is_pid_alive() {
    local pid="$1"
    kill -0 "$pid" 2>/dev/null
}

# --- Helper: read PID file ---
read_pid_file() {
    if [[ -f "$PID_FILE" ]]; then
        local content
        content=$(cat "$PID_FILE")
        local pid="${content%%:*}"
        local port="${content##*:}"
        echo "$pid $port"
    fi
}

# --- Helper: open browser ---
open_browser() {
    local url="$1"
    if command -v open &>/dev/null; then
        open "$url" 2>/dev/null || true
    elif command -v xdg-open &>/dev/null; then
        xdg-open "$url" 2>/dev/null || true
    elif command -v start &>/dev/null; then
        start "$url" 2>/dev/null || true
    fi
}

case "$COMMAND" in
    start)
        # Check Node.js
        if ! command -v node &>/dev/null; then
            echo "Error: Node.js is required but not found on PATH." >&2
            exit 1
        fi

        # Check server script exists
        if [[ ! -f "$SERVER_JS" ]]; then
            echo "Error: dashboard-server.js not found at ${SERVER_JS}" >&2
            exit 1
        fi

        # Check for existing server
        if [[ -f "$PID_FILE" ]]; then
            read -r existing_pid existing_port <<< "$(read_pid_file)"
            if [[ -n "$existing_pid" ]] && is_pid_alive "$existing_pid"; then
                echo "Dashboard is already running (PID: ${existing_pid}, port: ${existing_port})"
                echo "URL: http://127.0.0.1:${existing_port}"
                exit 0
            else
                echo "Removing stale PID file..."
                rm -f "$PID_FILE"
            fi
        fi

        # Parse start options
        SKILL_DIR_OPT=""
        PORT_OPT=""
        while [[ $# -gt 0 ]]; do
            case "$1" in
                --skill-dir)
                    SKILL_DIR_OPT="--skill-dir $2"
                    shift 2
                    ;;
                --port)
                    PORT_OPT="--port $2"
                    shift 2
                    ;;
                *)
                    echo "Error: unknown option: $1" >&2
                    usage
                    ;;
            esac
        done

        # Launch server in background
        # shellcheck disable=SC2086
        node "$SERVER_JS" "$TASK_DIR" $SKILL_DIR_OPT $PORT_OPT &
        SERVER_PID=$!

        # Wait briefly for server to start and write PID file
        for i in $(seq 1 30); do
            if [[ -f "$PID_FILE" ]]; then
                read -r pid port <<< "$(read_pid_file)"
                echo "Dashboard started (PID: ${pid}, port: ${port})"
                echo "URL: http://127.0.0.1:${port}"
                open_browser "http://127.0.0.1:${port}"
                exit 0
            fi
            # Check if process died
            if ! is_pid_alive "$SERVER_PID"; then
                echo "Error: dashboard server failed to start" >&2
                wait "$SERVER_PID" 2>/dev/null || true
                exit 1
            fi
            sleep 0.1
        done

        echo "Error: dashboard server did not write PID file within 3 seconds" >&2
        kill "$SERVER_PID" 2>/dev/null || true
        exit 1
        ;;

    stop)
        if [[ ! -f "$PID_FILE" ]]; then
            echo "Dashboard is not running (no PID file found)"
            exit 0
        fi

        read -r pid port <<< "$(read_pid_file)"

        if [[ -z "$pid" ]]; then
            echo "Invalid PID file, removing..."
            rm -f "$PID_FILE"
            exit 0
        fi

        if is_pid_alive "$pid"; then
            kill "$pid" 2>/dev/null
            # Wait for graceful shutdown
            for i in $(seq 1 20); do
                if ! is_pid_alive "$pid"; then
                    break
                fi
                sleep 0.1
            done
            # Force kill if still alive
            if is_pid_alive "$pid"; then
                kill -9 "$pid" 2>/dev/null || true
            fi
            echo "Dashboard stopped (was PID: ${pid}, port: ${port})"
        else
            echo "Dashboard process already dead (PID: ${pid})"
        fi

        rm -f "$PID_FILE"
        ;;

    status)
        if [[ ! -f "$PID_FILE" ]]; then
            echo "Dashboard is not running"
            exit 1
        fi

        read -r pid port <<< "$(read_pid_file)"

        if [[ -n "$pid" ]] && is_pid_alive "$pid"; then
            echo "Dashboard is running (PID: ${pid}, port: ${port})"
            echo "URL: http://127.0.0.1:${port}"
            exit 0
        else
            echo "Dashboard is not running (stale PID file for PID: ${pid})"
            rm -f "$PID_FILE"
            exit 1
        fi
        ;;

    *)
        echo "Error: unknown command: ${COMMAND}" >&2
        usage
        ;;
esac
