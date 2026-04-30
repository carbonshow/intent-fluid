#!/usr/bin/env node
// audit-task.js - deterministic checks for surge runtime epistemic artifacts.
// Usage:
//   node audit-task.js init-artifacts <task_dir>
//   node audit-task.js check-ledger <task_dir>
//   node audit-task.js check-convergence <task_dir>
//   node audit-task.js summarize-gaps <task_dir>

"use strict";

const fs = require("fs");
const path = require("path");

const ARTIFACT_TEMPLATES = {
  "epistemic-ledger.md": `# Epistemic Ledger

This file tracks hypotheses, claims, evidence, confidence, and decision impact for the surge task.

| ID | Type | Statement | Prediction / Observable | Supporting Evidence | Opposing Evidence | Confidence | Delta | Decision Impact | Owner Phase |
|---|---|---|---|---|---|---|---|---|---|
`,
  "falsification.md": `# Falsification Checks

Use this file when high-impact claims, architecture choices, expert vetoes, or contested document claims need explicit disconfirmation checks.

| Claim ID | What Would Prove It Wrong | Search / Test Performed | Result | Residual Risk | Decision |
|---|---|---|---|---|---|
`,
  "convergence-audit.md": `# Convergence Audit

Convergence requires more than polished output. Record concrete evidence for each passing check.

| Check | Status | Evidence |
|---|---|---|
| Acceptance criteria passed at current eval level | fail | |
| High-confidence claims have evidence | fail | |
| Important opposing evidence handled | fail | |
| Optimization directives executed or retired | fail | |
| Remaining gaps are low impact or user-accepted | fail | |
| Quality is not being optimized at the expense of user value | fail | |
| Stop rule is explicit | fail | |
`,
  "platform-capabilities.md": `# Platform Capabilities

Record the available execution path for this task. Keep the artifact contract stable across Claude/Cursor/Gemini; only the execution mechanism changes.

| Capability | Preferred Path | Fallback Path | Notes |
|---|---|---|---|
| Claude/Cursor/Gemini runtime | Detect available host features | Use the shared file protocol and serial execution | Do not assume host-specific tools exist. |
| Parallel subagents | Dispatch up to parallel_agent_limit | Run serially using the same task packages | Preserve output files either way. |
| Web search / fetch | Save raw materials per search/fetch call | Ask user for source files or URLs; mark evidence as user-provided | Do not pretend unavailable browsing happened. |
| User question UI | Native question/checkpoint tool | Plain text prompt and wait | Core ambiguity gates still apply. |
| File edits | Native write/edit tools | Platform editor or shell-safe file operations | Preserve task directory structure. |
| Script execution | Bash/Node.js helpers | Manual checklist fallback | Scripts accelerate stable checks; manual fallback must keep the same fields. |
`,
};

const REQUIRED_ARTIFACTS = Object.keys(ARTIFACT_TEMPLATES);
const LEDGER_COLUMNS = [
  "ID",
  "Type",
  "Statement",
  "Prediction / Observable",
  "Supporting Evidence",
  "Opposing Evidence",
  "Confidence",
  "Delta",
  "Decision Impact",
  "Owner Phase",
];
const CONVERGENCE_COLUMNS = ["Check", "Status", "Evidence"];

function usage() {
  console.error(
    [
      "Usage: node audit-task.js <command> <task_dir>",
      "",
      "Commands:",
      "  init-artifacts      create missing epistemic runtime artifacts",
      "  check-ledger        validate epistemic-ledger.md",
      "  check-convergence   validate convergence-audit.md and ledger dependencies",
      "  summarize-gaps      print all current audit issues",
    ].join("\n"),
  );
  process.exit(2);
}

function ensureTaskDir(taskDir) {
  if (!taskDir || !fs.existsSync(taskDir) || !fs.statSync(taskDir).isDirectory()) {
    throw new Error(`Task directory does not exist: ${taskDir || "(missing)"}`);
  }
}

function writeIfMissing(filePath, content) {
  if (fs.existsSync(filePath)) {
    return false;
  }
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, "utf8");
  return true;
}

function initArtifacts(taskDir) {
  ensureTaskDir(taskDir);
  const created = [];
  for (const fileName of REQUIRED_ARTIFACTS) {
    if (writeIfMissing(path.join(taskDir, fileName), ARTIFACT_TEMPLATES[fileName])) {
      created.push(fileName);
    }
  }
  return created;
}

function splitMarkdownRow(line) {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

function isSeparatorRow(cells) {
  return cells.length > 0 && cells.every((cell) => /^:?-{3,}:?$/.test(cell));
}

function parseTables(text) {
  const lines = text.split(/\r?\n/);
  const tables = [];
  let index = 0;
  while (index < lines.length) {
    if (!lines[index].trim().startsWith("|")) {
      index += 1;
      continue;
    }
    const header = splitMarkdownRow(lines[index]);
    const separator = splitMarkdownRow(lines[index + 1] || "");
    if (!isSeparatorRow(separator)) {
      index += 1;
      continue;
    }
    const rows = [];
    index += 2;
    while (index < lines.length && lines[index].trim().startsWith("|")) {
      const cells = splitMarkdownRow(lines[index]);
      const row = {};
      for (let cellIndex = 0; cellIndex < header.length; cellIndex += 1) {
        row[header[cellIndex]] = cells[cellIndex] || "";
      }
      rows.push(row);
      index += 1;
    }
    tables.push({ header, rows });
  }
  return tables;
}

function findTable(text, requiredColumns) {
  const tables = parseTables(text);
  return tables.find((table) => requiredColumns.every((column) => table.header.includes(column)));
}

function issue(code, message, fileName, detail, severity) {
  return {
    severity: severity || "error",
    code,
    file: fileName,
    message,
    detail: detail || "",
  };
}

function isBlank(value) {
  return String(value || "").trim() === "";
}

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function hasDurableEvidence(taskDir, value) {
  const evidence = String(value || "").trim();
  if (!evidence || /^(none|n\/a|na|unknown|tbd|-)$/.test(evidence.toLowerCase())) {
    return false;
  }
  if (/https?:\/\/|source[-_][a-z0-9]+|user clarification|user-provided|test output|build output/i.test(evidence)) {
    return true;
  }
  const parts = evidence
    .split(/[,;]+/)
    .map((part) => part.trim())
    .filter(Boolean);
  for (const part of parts) {
    const clean = part.replace(/^`|`$/g, "");
    if (clean && fs.existsSync(path.resolve(taskDir, clean))) {
      return true;
    }
  }
  return false;
}

function readFileIfExists(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }
  return fs.readFileSync(filePath, "utf8");
}

function validateLedger(taskDir) {
  const fileName = "epistemic-ledger.md";
  const filePath = path.join(taskDir, fileName);
  const text = readFileIfExists(filePath);
  const issues = [];
  if (text === null) {
    return [issue("missing_epistemic_ledger", "epistemic-ledger.md is missing.", fileName)];
  }
  const table = findTable(text, LEDGER_COLUMNS);
  if (!table) {
    return [issue("missing_ledger_table", "Epistemic ledger table is missing or malformed.", fileName)];
  }
  table.rows.forEach((row, index) => {
    const rowLabel = row.ID || `row ${index + 1}`;
    const hasSubstantiveStatement = !isBlank(row.Statement);
    if (!hasSubstantiveStatement && table.rows.length === 1) {
      return;
    }
    if (isBlank(row.ID)) {
      issues.push(issue("missing_id", "Ledger row has no ID.", fileName, `row ${index + 1}`));
    }
    if (isBlank(row.Type)) {
      issues.push(issue("missing_type", "Ledger row has no Type.", fileName, rowLabel));
    }
    if (isBlank(row.Statement)) {
      issues.push(issue("missing_statement", "Ledger row has no Statement.", fileName, rowLabel));
    }
    if (isBlank(row.Confidence)) {
      issues.push(issue("missing_confidence", "Ledger row has no Confidence.", fileName, rowLabel));
    } else if (!["low", "medium", "high"].includes(normalize(row.Confidence))) {
      issues.push(issue("invalid_confidence", "Confidence must be Low, Medium, or High unless numeric data is explicitly justified.", fileName, rowLabel));
    }
    if (["p0", "p1"].includes(normalize(row["Decision Impact"])) && isBlank(row["Prediction / Observable"])) {
      issues.push(issue("missing_prediction", "P0/P1 claims need a prediction or observable.", fileName, rowLabel));
    }
    if (normalize(row.Confidence) === "high" && !hasDurableEvidence(taskDir, row["Supporting Evidence"])) {
      issues.push(issue("high_confidence_without_evidence", "High-confidence claims need durable supporting evidence.", fileName, rowLabel));
    }
  });
  return issues;
}

function validateConvergence(taskDir) {
  const fileName = "convergence-audit.md";
  const filePath = path.join(taskDir, fileName);
  const text = readFileIfExists(filePath);
  const issues = [];
  if (text === null) {
    return [issue("missing_convergence_audit", "convergence-audit.md is missing.", fileName)];
  }
  const table = findTable(text, CONVERGENCE_COLUMNS);
  if (!table) {
    return [issue("missing_convergence_table", "Convergence audit table is missing or malformed.", fileName)];
  }
  table.rows.forEach((row, index) => {
    const rowLabel = row.Check || `row ${index + 1}`;
    const status = normalize(row.Status);
    if (!["pass", "passed", "ok", "yes"].includes(status)) {
      issues.push(issue("convergence_check_not_passed", "Convergence check is not passed.", fileName, rowLabel));
    }
    if (["pass", "passed", "ok", "yes"].includes(status) && String(row.Evidence || "").trim().length < 12) {
      issues.push(issue("weak_convergence_evidence", "Passing convergence checks need substantive evidence.", fileName, rowLabel));
    }
  });
  return issues.concat(validateLedger(taskDir));
}

function validateMissingArtifacts(taskDir) {
  const issues = [];
  for (const fileName of REQUIRED_ARTIFACTS) {
    if (!fs.existsSync(path.join(taskDir, fileName))) {
      issues.push(issue("missing_runtime_artifact", "Required epistemic runtime artifact is missing.", fileName));
    }
  }
  return issues;
}

function printIssues(issues) {
  if (issues.length === 0) {
    console.log("Audit passed: no issues found.");
    return;
  }
  console.log(`Audit found ${issues.length} issue(s):`);
  console.log("| Severity | Code | File | Message | Detail |");
  console.log("|---|---|---|---|---|");
  for (const current of issues) {
    console.log(
      `| ${current.severity} | ${current.code} | ${current.file} | ${current.message} | ${current.detail} |`,
    );
  }
}

function main(argv) {
  const command = argv[2];
  const taskDir = argv[3];
  if (!command || !taskDir) {
    usage();
  }
  ensureTaskDir(taskDir);

  if (command === "init-artifacts") {
    const created = initArtifacts(taskDir);
    if (created.length === 0) {
      console.log("Audit artifacts already exist.");
    } else {
      console.log(`Created audit artifact(s): ${created.join(", ")}`);
    }
    return 0;
  }

  let issues;
  if (command === "check-ledger") {
    issues = validateLedger(taskDir);
  } else if (command === "check-convergence") {
    issues = validateConvergence(taskDir);
  } else if (command === "summarize-gaps") {
    issues = validateMissingArtifacts(taskDir).concat(validateConvergence(taskDir));
  } else {
    usage();
  }

  printIssues(issues);
  return issues.length === 0 ? 0 : 1;
}

try {
  process.exitCode = main(process.argv);
} catch (error) {
  console.error(`Error: ${error.message}`);
  process.exitCode = 1;
}
