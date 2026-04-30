#!/usr/bin/env node
// Lightweight tests for audit-task.js. Uses only Node.js standard library.

"use strict";

const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const SCRIPT = path.join(__dirname, "audit-task.js");
const INIT_SCRIPT = path.join(__dirname, "init.sh");

function makeTaskDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "surge-audit-test-"));
}

function runAudit(args, taskDir) {
  return spawnSync(process.execPath, [SCRIPT, ...args, taskDir], {
    encoding: "utf8",
  });
}

function write(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, "utf8");
}

function read(taskDir, fileName) {
  return fs.readFileSync(path.join(taskDir, fileName), "utf8");
}

function testInitArtifactsCreatesRuntimeFiles() {
  const taskDir = makeTaskDir();
  const result = runAudit(["init-artifacts"], taskDir);

  assert.strictEqual(result.status, 0, result.stderr || result.stdout);
  for (const fileName of [
    "epistemic-ledger.md",
    "falsification.md",
    "convergence-audit.md",
    "platform-capabilities.md",
  ]) {
    assert.ok(fs.existsSync(path.join(taskDir, fileName)), `${fileName} should exist`);
  }
  assert.match(read(taskDir, "epistemic-ledger.md"), /\| ID \| Type \| Statement \|/);
  assert.match(read(taskDir, "platform-capabilities.md"), /Claude\/Cursor\/Gemini/);
}

function testLedgerFailsHighConfidenceClaimWithoutEvidence() {
  const taskDir = makeTaskDir();
  runAudit(["init-artifacts"], taskDir);
  write(
    path.join(taskDir, "epistemic-ledger.md"),
    [
      "| ID | Type | Statement | Prediction / Observable | Supporting Evidence | Opposing Evidence | Confidence | Delta | Decision Impact | Owner Phase |",
      "|---|---|---|---|---|---|---|---|---|---|",
      "| C-001 | claim | The design is production-safe | Build passes |  |  | High | + because it looks sound | P0 | design |",
      "",
    ].join("\n"),
  );

  const result = runAudit(["check-ledger"], taskDir);

  assert.notStrictEqual(result.status, 0, "ledger check should fail");
  assert.match(result.stdout, /high_confidence_without_evidence/);
}

function testLedgerPassesWhenEvidenceIsDurable() {
  const taskDir = makeTaskDir();
  runAudit(["init-artifacts"], taskDir);
  write(path.join(taskDir, "iterations", "iter_01_qa.md"), "# QA\nPassed.\n");
  write(
    path.join(taskDir, "epistemic-ledger.md"),
    [
      "| ID | Type | Statement | Prediction / Observable | Supporting Evidence | Opposing Evidence | Confidence | Delta | Decision Impact | Owner Phase |",
      "|---|---|---|---|---|---|---|---|---|---|",
      "| C-001 | claim | The design is production-safe | Build passes | iterations/iter_01_qa.md | None found | High | + after QA | P0 | qa |",
      "",
    ].join("\n"),
  );

  const result = runAudit(["check-ledger"], taskDir);

  assert.strictEqual(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /Audit passed/);
}

function testConvergenceFailsWhenLedgerIsIncomplete() {
  const taskDir = makeTaskDir();
  runAudit(["init-artifacts"], taskDir);
  write(
    path.join(taskDir, "epistemic-ledger.md"),
    [
      "| ID | Type | Statement | Prediction / Observable | Supporting Evidence | Opposing Evidence | Confidence | Delta | Decision Impact | Owner Phase |",
      "|---|---|---|---|---|---|---|---|---|---|",
      "| C-001 | claim | The selected strategy is best | User adoption improves |  |  | High | + from analysis | P1 | design |",
      "",
    ].join("\n"),
  );
  write(
    path.join(taskDir, "convergence-audit.md"),
    [
      "| Check | Status | Evidence |",
      "|---|---|---|",
      "| Acceptance criteria passed at current eval level | pass | iterations/iter_01_qa.md |",
      "| High-confidence claims have evidence | pass | epistemic-ledger.md |",
      "",
    ].join("\n"),
  );

  const result = runAudit(["check-convergence"], taskDir);

  assert.notStrictEqual(result.status, 0, "convergence should fail when ledger fails");
  assert.match(result.stdout, /high_confidence_without_evidence/);
}

function testInitScriptIncludesTraceFileAndAuditArtifacts() {
  const surgeRoot = fs.mkdtempSync(path.join(os.tmpdir(), "surge-init-test-"));
  const result = spawnSync("bash", [INIT_SCRIPT, surgeRoot, "task-001"], {
    encoding: "utf8",
  });
  const taskDir = path.join(surgeRoot, "tasks", "task-001");

  assert.strictEqual(result.status, 0, result.stderr || result.stdout);
  assert.match(read(taskDir, "state.md"), /trace_file: null/);
  for (const fileName of [
    "epistemic-ledger.md",
    "falsification.md",
    "convergence-audit.md",
    "platform-capabilities.md",
  ]) {
    assert.ok(fs.existsSync(path.join(taskDir, fileName)), `${fileName} should exist`);
  }
}

const tests = [
  testInitArtifactsCreatesRuntimeFiles,
  testLedgerFailsHighConfidenceClaimWithoutEvidence,
  testLedgerPassesWhenEvidenceIsDurable,
  testConvergenceFailsWhenLedgerIsIncomplete,
  testInitScriptIncludesTraceFileAndAuditArtifacts,
];

for (const test of tests) {
  test();
  console.log(`PASS ${test.name}`);
}
