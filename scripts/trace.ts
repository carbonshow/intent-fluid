#!/usr/bin/env -S deno run --allow-read --allow-write
// trace.ts — Append a structured trace event to a JSONL file.

const USAGE =
  `Usage: bash scripts/trace.sh <trace_file> <skill> <type> <step> <round> <agent> [detail_json]

Arguments:
  trace_file   Path to trace.jsonl
  skill        Skill name (e.g., surge)
  type         Event type (step_start|step_end|agent_dispatch|agent_return|checkpoint|decision|error)
  step         Current step name
  round        Current round number
  agent        Agent identifier
  detail_json  Optional JSON metadata (default: {})

Example:
  bash scripts/trace.sh ./trace.jsonl surge step_start analyze 1 director '{"input_files":["context.md"]}'`;

if (Deno.args.length < 6) {
  console.log(USAGE);
  Deno.exit(1);
}

const [traceFile, skill, type, step, roundArg, agent] = Deno.args;
const detailJsonStr = Deno.args[6] ?? "{}";

function dirname(path: string): string {
  const withoutTrailingSlash = path.replace(/\/+$/, "");
  if (withoutTrailingSlash === "") {
    return path.startsWith("/") ? "/" : ".";
  }

  const lastSlash = withoutTrailingSlash.lastIndexOf("/");
  if (lastSlash < 0) {
    return ".";
  }
  if (lastSlash === 0) {
    return "/";
  }
  return withoutTrailingSlash.slice(0, lastSlash);
}

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object";
}

async function pathExistsAsDirectory(path: string): Promise<boolean> {
  try {
    return (await Deno.stat(path)).isDirectory;
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      return false;
    }
    throw error;
  }
}

async function ensureFile(path: string): Promise<void> {
  try {
    await Deno.stat(path);
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      await Deno.writeTextFile(path, "");
      return;
    }
    throw error;
  }
}

const traceDir = dirname(traceFile);
if (!(await pathExistsAsDirectory(traceDir))) {
  console.error(`Error: directory does not exist: ${traceDir}`);
  Deno.exit(1);
}

await ensureFile(traceFile);

const content = await Deno.readTextFile(traceFile);
const lineCount =
  content.split(/\r?\n/).filter((line) => line.trim().length > 0)
    .length;
const eventId = `evt_${String(lineCount + 1).padStart(3, "0")}`;
const ts = new Date().toISOString();

let detail: unknown = {};
let tags: unknown[] = [];

try {
  const parsed: unknown = JSON.parse(detailJsonStr);
  if (isObject(parsed) && Array.isArray(parsed.tags)) {
    tags = parsed.tags;
    delete parsed.tags;
  }
  detail = parsed;
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Warning: invalid detail_json, using empty object: ${message}`);
  detail = {};
}

const detailObject = isObject(detail) ? detail : undefined;

let parentId: unknown = null;
if (detailObject && Object.hasOwn(detailObject, "parent_id")) {
  parentId = detailObject.parent_id;
  delete detailObject.parent_id;
}

type StatusInfo = {
  status: string;
  symbol: string;
};

const statusMap: Record<string, StatusInfo> = {
  step_start: { status: "executing", symbol: "\u26a1" },
  step_end: { status: "completed", symbol: "\u2705" },
  agent_dispatch: { status: "executing", symbol: "\u{1f4e4}" },
  agent_return: { status: "completed", symbol: "\u{1f4e5}" },
  checkpoint: { status: "waiting", symbol: "\u{1f536}" },
  decision: { status: "decided", symbol: "\u{1f3af}" },
  error: { status: "failed", symbol: "\u274c" },
};

const statusInfo = statusMap[type] ?? { status: type, symbol: "\u{1f4cb}" };
let statusDisplay: unknown = `${statusInfo.symbol} [${step}] ${
  type.replaceAll("_", " ")
} — ${agent}`;
if (detailObject && Object.hasOwn(detailObject, "status_display")) {
  statusDisplay = detailObject.status_display;
  delete detailObject.status_display;
}

let status: unknown = statusInfo.status;
if (detailObject && Object.hasOwn(detailObject, "status")) {
  status = detailObject.status;
  delete detailObject.status;
}

const event = {
  id: eventId,
  ts,
  skill,
  type,
  step,
  round: Number.parseInt(roundArg, 10),
  agent,
  status,
  status_display: statusDisplay,
  detail,
  parent_id: parentId,
  tags,
};

await Deno.writeTextFile(traceFile, `${JSON.stringify(event)}\n`, {
  append: true,
});

console.log(eventId);
