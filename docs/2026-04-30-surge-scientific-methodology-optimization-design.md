# surge Scientific Methodology Optimization Design

Status: Draft for user review
Date: 2026-04-30
Scope: Design only. This document proposes changes to `skills/surge` but does not change the skill implementation.

## 1. Background

The reference research argues that an agent workflow should not copy "scientific method" as slogans. It should translate scientific cognition primitives into executable operations, durable artifacts, evaluation criteria, and failure modes.

The current `surge` skill already has several strong primitives:

- Control loop: analyze, research, design, implement, QA, retro.
- Operationalized acceptance: L1/L2/L3 acceptance criteria.
- External sensing: web research raw material persistence.
- Multi-perspective review: expert panel and optional red-team review.
- Feedback and calibration: QA history, optimization directives, evaluator calibration, retro.
- Evolution control: memory drafts, rules drafts, candidate skill drafts requiring user confirmation.

The main gap is epistemic traceability. `surge` records phase outputs, but it does not consistently record:

- which hypotheses are being tested;
- which predictions would make a solution credible;
- which evidence supports or contradicts each important claim;
- whether high-risk claims have been actively falsified;
- how confidence changes across iterations;
- whether a process improvement has enough repeated evidence to become a rule or skill update.

## 2. First-Principles Framing

`surge` is a delivery control system, not only a multi-agent prompt package.

Its core components are:

| Control Component | Current `surge` Mechanism | Weak Point |
|---|---|---|
| Goal | PRD, acceptance criteria, deliverables | Abstract goals are operationalized, but claim validity is not always tracked. |
| Sensor | analyze, research, QA, user checkpoints | Evidence is scattered across reports and raw files. |
| Comparator | L1/L2/L3 QA, convergence logic | Comparator checks output quality more than epistemic reliability. |
| Actuator | design and implement phases | Improvement directives exist, but hypothesis testing is implicit. |
| Feedback | quality history, optimization directives, retro | Confidence deltas and falsification results are not first-class. |
| Evolution | memory draft, rule drafts, candidate skills | Promotion gates exist, but repeated evidence thresholds are under-specified. |

The design goal is to add a lightweight epistemic layer around the existing control loop without turning every task into a heavy research project.

## 3. Design Principles

1. Keep `surge` compatible with Claude, Cursor, and Gemini.
   - Do not require a host-specific `Agent`, `AskUserQuestion`, `WebSearch`, or `WebFetch` capability as the only path.
   - Keep platform-specific behavior behind a `platform adapter` reference.
   - Preserve degraded serial execution when subagents or browsing are unavailable.

2. Make scientific primitives operational.
   - Replace "be rigorous" with concrete fields, files, checks, and stop rules.
   - Prefer reusable templates and deterministic audits over asking the model to remember everything.

3. Use progressive disclosure.
   - Keep `SKILL.md` focused on routing and non-skippable gotchas.
   - Move detailed procedures to `references/`.
   - Use scripts for stable checks instead of expanding prompts.

4. Scale by task complexity.
   - Trivial tasks should not enter `surge`.
   - Bounded code tasks should get a small hypothesis and verification record.
   - High-impact, ambiguous, document, strategy, market, or architecture tasks should get full evidence and falsification handling.

5. Avoid Goodhart failure.
   - Do not let a single score become the target.
   - Cross-check acceptance, evidence quality, user value, calibration, and residual risk.

## 4. Proposed Architecture

Add an epistemic layer to the Context Package:

```text
{surge_root}/tasks/{task_id}/
├── epistemic-ledger.md
├── falsification.md
├── convergence-audit.md
├── platform-capabilities.md
├── experiment-plan.md                 # optional, only for workflow or skill optimization tasks
└── iterations/
    └── ...
```

These files should be created during startup or the first phase that needs them. They are runtime artifacts, not new required files inside `skills/surge` itself.

### 4.1 `epistemic-ledger.md`

Purpose: centralize hypotheses, claims, evidence, confidence, and decision impact.

Suggested table:

| ID | Type | Statement | Prediction / Observable | Supporting Evidence | Opposing Evidence | Confidence | Delta | Decision Impact | Owner Phase |
|---|---|---|---|---|---|---|---|---|---|
| H-001 | hypothesis | ... | ... | ... | ... | Low/Medium/High | + / - / 0 with reason | P0/P1/P2 | analyze/research/design/qa |

Rules:

- LLM output may create hypotheses, but it is not evidence by itself.
- High-confidence claims must point to durable evidence: source file, test output, artifact path, or user clarification.
- Confidence uses Low/Medium/High unless the task has real data justifying numeric probabilities.
- Every P0/P1 architecture or strategy claim must have a prediction or observable.

### 4.2 `falsification.md`

Purpose: force high-risk claims through an explicit disconfirmation check.

Trigger:

- Any P0/P1 requirement or claim.
- Architecture choices with security, data, migration, publication, financial, or irreversible impact.
- Expert vetoes, severe expert disagreement, or QA Level 2/3 failures.
- Document/strategy deliverables with contested market, domain, or technical claims.

Suggested table:

| Claim ID | What Would Prove It Wrong | Search / Test Performed | Result | Residual Risk | Decision |
|---|---|---|---|---|---|

Rules:

- A falsification gate is not a permanent blocker. The user can override it, but the risk must be explicit.
- Low-risk tasks can skip this file with a reason written in `convergence-audit.md`.

### 4.3 `convergence-audit.md`

Purpose: prevent premature or self-declared convergence.

Suggested checklist:

| Check | Status | Evidence |
|---|---|---|
| Acceptance criteria passed at current eval level | pass/fail | QA path and item count |
| High-confidence claims have evidence | pass/fail | ledger rows |
| Important opposing evidence handled | pass/fail | falsification rows or rationale |
| Optimization directives executed or retired | pass/fail | QA Stage 5 |
| Remaining gaps are low impact or user-accepted | pass/fail | gap list |
| Quality is not being optimized at the expense of user value | pass/fail | Goodhart audit |
| Stop rule is explicit | pass/fail | convergence reason |

### 4.4 `platform-capabilities.md`

Purpose: make Claude/Cursor/Gemini compatibility explicit.

Suggested table:

| Capability | Preferred Path | Fallback Path | Notes |
|---|---|---|---|
| Parallel subagents | Dispatch up to `parallel_agent_limit` | Run serially using same task packages | Must preserve output files. |
| Web search / fetch | Save raw materials per search/fetch call | Ask user for source files or URLs; mark evidence as user-provided | Do not pretend unavailable browsing happened. |
| User question UI | Native question/checkpoint tool | Plain text prompt and wait | Core ambiguity gates still apply. |
| File edits | Native write/edit tools | Manual shell or platform editor | Must preserve task directory structure. |
| Script execution | Bash/Node/Python if available | Manual checklist | Scripts are accelerators, not hard dependencies unless declared. |

This file should be generated per task because capabilities vary by host and session.

### 4.5 `experiment-plan.md`

Purpose: make changes to `surge` itself measurable before becoming defaults.

Use when the deliverable is a workflow, skill, rule, methodology, or process change.

Suggested fields:

- Hypothesis.
- Baseline workflow.
- Treatment workflow.
- Task set.
- Outcome metrics.
- Process metrics.
- Evidence collection method.
- Promotion threshold.

## 5. Phase-Level Changes

### Startup

Changes:

- Fix state schema consistency by adding `trace_file: null` to `init.sh` output.
- Add optional initialization of `epistemic-ledger.md`, `falsification.md`, and `convergence-audit.md`.
- Generate `platform-capabilities.md` after workspace and deliverable paths are confirmed.

Advantages:

- Fixes a concrete state bug.
- Establishes a durable place for evidence and compatibility decisions.

Risks:

- More startup files can feel heavy. Mitigation: create templates, but only require full completion when triggers apply.

Confidence: High.

### Analyze

Changes:

- Add "Problem Reframe" and "Initial Hypotheses" to analyze output.
- Record P0/P1 assumptions into `epistemic-ledger.md`.
- Mark ambiguities not only by downstream phase impact, but also by epistemic risk: whether the ambiguity can invalidate a high-impact claim.

Advantages:

- Makes abductive reasoning explicit.
- Prevents hidden assumptions from becoming design facts.

Risks:

- Analyze may over-generate hypotheses. Mitigation: cap at 3-7 material hypotheses.

Confidence: High.

### Research

Changes:

- Extend direction scoring from `relevance` and `importance` to:
  - impact;
  - uncertainty;
  - verifiability;
  - exploration cost;
  - source independence.
- Require the research summary to map source materials to ledger claim IDs.
- Record opposing evidence and unresolved gaps, not only solution candidates.

Advantages:

- Reduces single-source and source-dump failure modes.
- Better aligns research effort with uncertainty reduction.

Risks:

- More fields can slow down shallow research. Mitigation: full scoring only when research is mandatory or user selects deeper research.

Confidence: Medium-High.

### Design

Changes:

- Each candidate solution should include:
  - assumptions;
  - testable predictions;
  - invalidation conditions;
  - residual risk.
- Expert review should evaluate assumptions and falsifiability, not only solution score.
- High-risk selected designs must update `falsification.md` before detailed design approval.

Advantages:

- Expert review becomes more than preference scoring.
- Design decisions become testable and auditable.

Risks:

- Expert review may become verbose. Mitigation: pass summaries and cap required fields.

Confidence: Medium.

### Implement

Changes:

- For code deliverables, implementation summaries should link tests, build output, or inspection evidence to ledger claims where relevant.
- For document deliverables, evidence labels should point to ledger/source rows, not only generic labels like `[Citation:Source]`.
- Assumptions discovered during implementation should update the ledger, not only `implement.md`.

Advantages:

- Turns implementation into evidence production.
- Helps QA distinguish verified behavior from stated intent.

Risks:

- Could be excessive for small code edits. Mitigation: only map claims that affect acceptance criteria or high-risk decisions.

Confidence: Medium.

### QA

Changes:

- Add an epistemic review stage before final conclusion:
  - check high-confidence claims;
  - check unsupported quantitative claims;
  - check unresolved contradictions;
  - check whether falsification gates were required and completed.
- Add Goodhart audit when convergence is near:
  - identify if output is optimized for passing rubric while losing user value;
  - inspect whether weak evidence is hidden behind polished structure.
- Write or update `convergence-audit.md`.

Advantages:

- Reduces false convergence.
- Makes QA evidence-aware rather than only acceptance-aware.

Risks:

- QA may become too strict. Mitigation: keep Director override, but require residual risk display to the user.

Confidence: High.

### Retro

Changes:

- Formalize a promotion ladder:
  1. single event: record in `memory_draft.md`;
  2. repeated pattern: create proposal;
  3. proposal accepted: add pressure scenario or regression check;
  4. validated change: update `rules.md`, references, script, or skill;
  5. user review required for durable changes.
- Separate "task lessons" from "surge process lessons".
- When a process step was ceremonial or low-value, record that as negative evidence against keeping it mandatory.

Advantages:

- Preserves self-evolution while reducing capability drift.
- Makes process improvements testable.

Risks:

- Requires discipline to avoid turning every retro note into a rule. Mitigation: repeated evidence threshold.

Confidence: High.

## 6. Deterministic Helper Proposal

Add a future helper script, name to be decided, for stable checks:

```text
skills/surge/scripts/audit-task.js
```

Proposed commands:

```bash
node skills/surge/scripts/audit-task.js init-artifacts <task_dir>
node skills/surge/scripts/audit-task.js check-ledger <task_dir>
node skills/surge/scripts/audit-task.js check-convergence <task_dir>
node skills/surge/scripts/audit-task.js summarize-gaps <task_dir>
```

Why Node.js:

- `surge` already depends on Node.js for `state.sh` and trace scripts.
- It avoids adding a new Python dependency for cross-platform skill execution.

Fallback:

- If Node.js is unavailable, use the manual checklist in `references/epistemic-audit.md`.

## 7. Documentation Changes

Proposed new reference files:

| File | Purpose |
|---|---|
| `skills/surge/references/epistemic-audit.md` | Ledger, falsification, convergence, Goodhart audit rules. |
| `skills/surge/references/platform-adapter.md` | Claude/Cursor/Gemini capability mapping and fallback paths. |
| `skills/surge/references/experiment-design.md` | Baseline/treatment protocol for changes to workflows, prompts, rules, or skills. |

Proposed updates:

| File | Update |
|---|---|
| `skills/surge/SKILL.md` | Add short gotchas and reference index entries only. Keep body lean. |
| `skills/surge/references/startup.md` | Add artifact initialization and platform capability capture. |
| `skills/surge/references/phases/analyze.md` | Add problem reframe and hypotheses. |
| `skills/surge/references/phases/research.md` | Add uncertainty-focused scoring and claim mapping. |
| `skills/surge/references/phases/design.md` | Add assumptions, predictions, invalidation conditions. |
| `skills/surge/references/phases/implement.md` | Link verification evidence to claims where relevant. |
| `skills/surge/references/phases/qa.md` | Add epistemic review and convergence audit. |
| `skills/surge/references/phases/retro.md` | Add promotion ladder and process evidence thresholds. |
| `skills/surge/references/output-validation.md` | Add required sections for new artifacts when they are triggered. |
| `skills/surge/references/output-structure.md` | Document new runtime artifacts. |
| `skills/surge/assets/rules.md` | Add only stable NEVER/ALWAYS/PREFER rules after validation. |

## 8. Compatibility Strategy

The skill should keep a common protocol and adapt execution mechanics per host.

### Claude

Expected best path:

- Native subagents for parallel work.
- Native web tools where available.
- Native ask/checkpoint UI where available.
- Scripts for initialization, state, trace, and audits.

Fallback:

- Serial execution if subagent dispatch is unavailable.
- User-provided sources if browsing is unavailable.

### Cursor

Expected best path:

- Treat subagent steps as sequential role prompts unless Cursor has equivalent agent orchestration.
- Use filesystem and terminal scripts for deterministic state and audit checks.
- Prefer repository-local evidence and test commands.

Fallback:

- Store research sources from user-provided URLs or pasted material.
- Mark missing external evidence explicitly.

### Gemini CLI

Expected best path:

- Use extension skill activation and available shell/file tools.
- Run scripts for deterministic checks.
- Use serial role execution when parallel agents are unavailable.

Fallback:

- Same artifact contract, fewer concurrent workers.

Non-negotiable compatibility rule:

The artifacts and state model must stay the same across platforms. Only the execution mechanism changes.

## 9. Implementation Plan After Approval

Phase 1: Correctness and minimal artifacts

- Fix `trace_file` in `init.sh`.
- Add `platform-capabilities.md`, `epistemic-ledger.md`, `falsification.md`, and `convergence-audit.md` templates to initialization.
- Update output structure and state docs.
- Add a minimal audit script or checklist.

Phase 2: Phase integration

- Update analyze, research, design, implement, QA, and retro references.
- Keep `SKILL.md` changes short and reference-driven.
- Update output validation to check triggered artifact sections.

Phase 3: Compatibility hardening

- Add `platform-adapter.md`.
- Replace host-specific tool names in core text with capability terms where possible.
- Keep host-specific examples in adapter reference.

Phase 4: Validation

- Run `bash scripts/validate-skill.sh skills/surge`.
- Run startup initialization in a temporary directory.
- Run state updates for all fields, including `trace_file`.
- Run trace export on a small synthetic trace.
- Run audit script/checklist on a minimal synthetic task.

Phase 5: Empirical experiment

- Select 3-5 historical or synthetic PRD tasks first, not 8-12, to keep the first validation cheap.
- Compare baseline `surge` vs treatment `surge` with epistemic artifacts.
- Score outcome, process, evidence, calibration, cost.
- Only promote heavier gates to default if quality improves without unacceptable friction.

## 10. Open Decisions for Review

1. Should the ledger be Markdown-only for readability, or CSV/JSON plus Markdown for easier script validation?
   - Recommendation: start Markdown-only with strict tables, then add JSON/CSV only if auditing becomes brittle.

2. Should epistemic artifacts be created for every task or only when triggered?
   - Recommendation: create empty templates for every `surge` task, but require completion only when risk triggers apply.

3. Should `audit-task.js` be required for convergence?
   - Recommendation: required when Node.js exists; manual checklist fallback when Node.js is unavailable.

4. Should research scoring replace current relevance/importance or extend it?
   - Recommendation: extend it for mandatory/deep research; preserve simple relevance/importance display for shallow layers.

5. Should platform compatibility be enforced by validator?
   - Recommendation: not initially. First document adapter rules, then add validation only for stable requirements.

## 11. Recommended Approval Scope

Recommended first implementation approval:

- Fix `trace_file` schema drift.
- Add minimal epistemic artifacts and docs.
- Add QA convergence audit checklist.
- Add platform adapter reference.
- Validate with temporary task initialization and skill validator.

Defer:

- Full experiment framework.
- Heavy automated scoring.
- Mandatory falsification for all tasks.
- Any change that makes subagents, browsing, or a specific host mandatory.

## 12. Self-Audit

- Topic alignment: this design directly addresses `skills/surge` optimization using the scientific methodology research as the evaluation frame.
- Factual risk: current implementation references are based on local files inspected on 2026-04-30. The only empirically verified bug is the missing `trace_file` field in generated `state.md`.
- Logic closure: the proposal maps each scientific primitive to a concrete artifact, phase change, script/checklist, risk, and validation path.
