#!/usr/bin/env -S deno run --allow-read --allow-write
// trace-export.ts — Convert trace.jsonl to visualization formats.

type Format = "mermaid" | "summary" | "timeline";

type TraceEvent = {
  id?: string;
  ts?: string;
  skill?: string;
  type?: string;
  step?: string;
  round?: number;
  agent?: string;
  status?: unknown;
  status_display?: string;
  detail?: Record<string, unknown>;
  parent_id?: unknown;
  tags?: string[];
};

type WorkflowConfig = {
  steps: string[];
  topology: string;
  max_rounds: number;
};

type MermaidNode = {
  key: string;
  step: string;
  round: number;
  status: "executing" | "completed" | "failed";
  label: string;
};

const USAGE =
  `Usage: bash scripts/trace-export.sh <trace_file> <format> [--skill-dir <path>]

Formats: mermaid | summary | timeline

Options:
  --skill-dir <path>  Path to skill directory with SKILL.md (for workflow metadata)

Examples:
  bash scripts/trace-export.sh ./trace.jsonl mermaid
  bash scripts/trace-export.sh ./trace.jsonl summary --skill-dir skills/surge`;

function usage(): never {
  console.log(USAGE);
  Deno.exit(1);
}

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

function joinPath(...parts: string[]): string {
  let result = parts[0] ?? "";
  for (const part of parts.slice(1)) {
    if (result.endsWith("/")) {
      result += part.replace(/^\/+/, "");
    } else {
      result += `/${part.replace(/^\/+/, "")}`;
    }
  }
  return result;
}

function sanitizeId(value: string): string {
  return value.replace(/[^a-zA-Z0-9_]/g, "_");
}

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function asStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }
  return value.map((item) => String(item));
}

function detailStringArray(
  detail: Record<string, unknown> | undefined,
  key: string,
): string[] | undefined {
  if (!detail) {
    return undefined;
  }
  return asStringArray(detail[key]);
}

async function pathExistsAsFile(path: string): Promise<boolean> {
  try {
    return (await Deno.stat(path)).isFile;
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      return false;
    }
    throw error;
  }
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await Deno.stat(path);
    return true;
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      return false;
    }
    throw error;
  }
}

async function parseEvents(traceFile: string): Promise<TraceEvent[]> {
  const content = (await Deno.readTextFile(traceFile)).trim();
  if (!content) {
    console.error("Warning: trace file is empty");
    Deno.exit(0);
  }

  const events = content.split("\n").map((line, index): TraceEvent | null => {
    try {
      const parsed: unknown = JSON.parse(line);
      return isObject(parsed) ? parsed as TraceEvent : null;
    } catch (_error) {
      console.error(`Warning: invalid JSON on line ${index + 1}, skipping`);
      return null;
    }
  }).filter((event): event is TraceEvent => event !== null);

  if (events.length === 0) {
    console.error("Warning: no valid events found");
    Deno.exit(0);
  }

  return events;
}

async function parseWorkflowConfig(skillDir: string): Promise<WorkflowConfig> {
  const config: WorkflowConfig = {
    steps: [],
    topology: "linear",
    max_rounds: 1,
  };

  if (!skillDir) {
    return config;
  }

  const skillFile = joinPath(skillDir, "SKILL.md");
  if (!(await pathExists(skillFile))) {
    return config;
  }

  const skillContent = await Deno.readTextFile(skillFile);
  const fmMatch = skillContent.match(/^---\n([\s\S]*?)\n---/);
  if (!fmMatch) {
    return config;
  }

  const fm = fmMatch[1];
  const stepsMatch = fm.match(/steps:\s*\[([^\]]*)\]/);
  if (stepsMatch) {
    config.steps = stepsMatch[1].split(",").map((step) =>
      step.trim().replace(/["\x27]/g, "")
    );
  }

  const topoMatch = fm.match(/topology:\s*(\S+)/);
  if (topoMatch) {
    config.topology = topoMatch[1].replace(/["\x27]/g, "");
  }

  const roundsMatch = fm.match(/max_rounds:\s*(\d+)/);
  if (roundsMatch) {
    config.max_rounds = Number.parseInt(roundsMatch[1], 10);
  }

  return config;
}

function inferMissingConfig(
  events: TraceEvent[],
  config: WorkflowConfig,
): number {
  if (config.steps.length === 0) {
    const stepSet = new Set<string>();
    events.forEach((event) => {
      if (event.step) {
        stepSet.add(event.step);
      }
    });
    config.steps = Array.from(stepSet);
  }

  const maxRound = Math.max(...events.map((event) => event.round || 1), 1);
  if (maxRound > 1 && config.topology === "linear") {
    config.topology = "cyclic";
  }

  return maxRound;
}

async function exportMermaid(
  events: TraceEvent[],
  config: WorkflowConfig,
  maxRound: number,
  traceDir: string,
): Promise<void> {
  const lines = ["flowchart TD"];
  const stepEvents = events.filter((event) =>
    event.type === "step_start" || event.type === "step_end"
  );

  const nodes = new Map<string, MermaidNode>();
  const nodeOrder: string[] = [];

  for (const event of stepEvents) {
    if (event.type !== "step_start" || !event.step) {
      continue;
    }
    const round = event.round || 1;
    const key = `${event.step}_r${round}`;
    if (!nodes.has(key)) {
      nodes.set(key, {
        key,
        step: event.step,
        round,
        status: "executing",
        label: `${event.step} R${round}`,
      });
      nodeOrder.push(key);
    }
  }

  for (const event of stepEvents) {
    if (event.type !== "step_end" || !event.step) {
      continue;
    }
    const round = event.round || 1;
    const key = `${event.step}_r${round}`;
    const node = nodes.get(key);
    if (node) {
      const validationResult = event.detail?.validation_result;
      node.status = validationResult === "PASS" || !validationResult
        ? "completed"
        : "failed";
    }
  }

  for (const [key, node] of nodes) {
    const id = sanitizeId(key);
    const shape = node.status === "failed"
      ? `${id}[/"${node.label}"/]`
      : `${id}["${node.label}"]`;
    lines.push(`    ${shape}`);
  }

  if (config.topology === "cyclic") {
    for (let round = 1; round <= maxRound; round++) {
      const roundSteps = config.steps.filter((step) =>
        nodes.has(`${step}_r${round}`)
      );
      for (let index = 0; index < roundSteps.length - 1; index++) {
        const from = sanitizeId(`${roundSteps[index]}_r${round}`);
        const to = sanitizeId(`${roundSteps[index + 1]}_r${round}`);
        lines.push(`    ${from} --> ${to}`);
      }

      if (round < maxRound) {
        const lastStep = roundSteps[roundSteps.length - 1];
        const firstNextRound = config.steps.find((step) =>
          nodes.has(`${step}_r${round + 1}`)
        );
        if (lastStep && firstNextRound) {
          const from = sanitizeId(`${lastStep}_r${round}`);
          const to = sanitizeId(`${firstNextRound}_r${round + 1}`);
          const qaDecision = events.find((event) =>
            event.type === "decision" && event.round === round
          );
          const decision = qaDecision?.detail?.decision;
          const label = decision ? String(decision) : "continue";
          lines.push(`    ${from} -->|${label}| ${to}`);
        }
      }
    }
  } else {
    for (let index = 0; index < nodeOrder.length - 1; index++) {
      const from = sanitizeId(nodeOrder[index]);
      const to = sanitizeId(nodeOrder[index + 1]);
      lines.push(`    ${from} --> ${to}`);
    }
  }

  for (const [key, node] of nodes) {
    const id = sanitizeId(key);
    if (node.status === "completed") {
      lines.push(`    style ${id} fill:#3fb950,stroke:#2ea043,color:#fff`);
    } else if (node.status === "failed") {
      lines.push(`    style ${id} fill:#f85149,stroke:#da3633,color:#fff`);
    } else {
      lines.push(`    style ${id} fill:#1f6feb,stroke:#1158c7,color:#fff`);
    }
  }

  const outFile = joinPath(traceDir, "execution_dag.mmd");
  await Deno.writeTextFile(outFile, `${lines.join("\n")}\n`);
  console.log(`✓ Mermaid DAG written to ${outFile}`);
}

async function exportSummary(
  events: TraceEvent[],
  config: WorkflowConfig,
  maxRound: number,
  traceDir: string,
): Promise<void> {
  const lines = [
    "# Execution Summary",
    "",
    `**Skill**: ${events[0]?.skill || "unknown"}`,
    `**Total Events**: ${events.length}`,
    `**Rounds**: ${maxRound}`,
    `**Topology**: ${config.topology}`,
    "",
    "## Step Summary",
    "",
    "| Round | Step | Status | Agent | Duration | Output Files | Tags |",
    "|-------|------|--------|-------|----------|--------------|------|",
  ];

  const starts = events.filter((event) => event.type === "step_start");
  for (const start of starts) {
    const end = events.find((event) =>
      event.type === "step_end" && event.step === start.step &&
      event.round === start.round
    );
    const validationResult = end?.detail?.validation_result;
    const status = end
      ? validationResult === "PASS" || !validationResult
        ? "✅ completed"
        : "❌ failed"
      : "⏳ in progress";
    const duration = end && start.ts && end.ts
      ? `${
        ((new Date(end.ts).getTime() - new Date(start.ts).getTime()) / 1000)
          .toFixed(1)
      }s`
      : "-";
    const outputs =
      detailStringArray(end?.detail, "output_files")?.join(", ") ||
      "-";
    const tags = start.tags?.join(", ") || "-";

    lines.push(
      `| ${start.round} | ${start.step} | ${status} | ${start.agent} | ${duration} | ${outputs} | ${tags} |`,
    );
  }

  const errors = events.filter((event) => event.type === "error");
  if (errors.length > 0) {
    lines.push("");
    lines.push("## Errors");
    lines.push("");
    lines.push("| Time | Step | Round | Message |");
    lines.push("|------|------|-------|---------|");
    for (const error of errors) {
      const message = error.detail?.error_message || error.status_display ||
        "-";
      lines.push(
        `| ${error.ts} | ${error.step} | ${error.round} | ${message} |`,
      );
    }
  }

  const decisions = events.filter((event) => event.type === "decision");
  if (decisions.length > 0) {
    lines.push("");
    lines.push("## Decisions");
    lines.push("");
    lines.push("| Time | Step | Round | Decision | Tags |");
    lines.push("|------|------|-------|----------|------|");
    for (const decisionEvent of decisions) {
      const decision = decisionEvent.detail?.decision || "-";
      const tags = decisionEvent.tags?.join(", ") || "-";
      lines.push(
        `| ${decisionEvent.ts} | ${decisionEvent.step} | ${decisionEvent.round} | ${decision} | ${tags} |`,
      );
    }
  }

  const outFile = joinPath(traceDir, "execution_summary.md");
  await Deno.writeTextFile(outFile, `${lines.join("\n")}\n`);
  console.log(`✓ Summary written to ${outFile}`);
}

function exportTimeline(events: TraceEvent[], maxRound: number): void {
  const timeCol = 12;
  const typeCol = 18;
  const stepCol = 14;
  const agentCol = 30;

  console.log("─".repeat(80));
  console.log(
    ` ${"Time".padEnd(timeCol)}${"Type".padEnd(typeCol)}${
      "Step".padEnd(stepCol)
    }${"Agent".padEnd(agentCol)}`,
  );
  console.log("─".repeat(80));

  const icons: Record<string, string> = {
    step_start: "▶",
    step_end: "■",
    agent_dispatch: "↗",
    agent_return: "↙",
    checkpoint: "◆",
    decision: "◎",
    error: "✖",
  };

  for (const event of events) {
    const time = event.ts ? event.ts.substring(11, 19) : "        ";
    const type = (event.type || "").padEnd(typeCol);
    const step = `${event.step || ""} R${event.round || 1}`.padEnd(stepCol);
    const agent = (event.agent || "").padEnd(agentCol);
    const icon = event.type ? icons[event.type] || "·" : "·";
    console.log(` ${time.padEnd(timeCol)}${icon} ${type}${step}${agent}`);
  }

  console.log("─".repeat(80));
  console.log(` Total: ${events.length} events, ${maxRound} round(s)`);
}

if (Deno.args.length < 2) {
  usage();
}

const [traceFile, formatArg, ...remainingArgs] = Deno.args;
let skillDir = "";
for (let index = 0; index < remainingArgs.length; index++) {
  const arg = remainingArgs[index];
  switch (arg) {
    case "--skill-dir": {
      const value = remainingArgs[index + 1];
      if (!value) {
        console.error("Error: --skill-dir requires a path");
        usage();
      }
      skillDir = value;
      index++;
      break;
    }
    default:
      console.error(`Error: unknown option: ${arg}`);
      usage();
  }
}

if (!(await pathExistsAsFile(traceFile))) {
  console.error(`Error: trace file does not exist: ${traceFile}`);
  Deno.exit(1);
}

if (
  formatArg !== "mermaid" && formatArg !== "summary" && formatArg !== "timeline"
) {
  console.error(
    `Error: unknown format: ${formatArg} (expected: mermaid|summary|timeline)`,
  );
  Deno.exit(1);
}

const format = formatArg as Format;
const traceDir = dirname(traceFile);
const events = await parseEvents(traceFile);
const config = await parseWorkflowConfig(skillDir);
const maxRound = inferMissingConfig(events, config);

switch (format) {
  case "mermaid":
    await exportMermaid(events, config, maxRound, traceDir);
    break;
  case "summary":
    await exportSummary(events, config, maxRound, traceDir);
    break;
  case "timeline":
    exportTimeline(events, maxRound);
    break;
}
