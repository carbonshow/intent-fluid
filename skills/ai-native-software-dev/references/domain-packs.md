# Domain Pack Contract

Read this reference when specialized knowledge can change the correct behavior, acceptable architecture, validation oracle, or accountable authority. A domain pack is an on-demand evidence overlay; it does not replace the core workflow or grant permissions.

## When a Domain Pack Is Required

Activate or create a provisional Domain Delta when any of these are true:

- terms have a precise domain meaning that differs from ordinary language;
- correctness depends on domain laws, formulas, state machines, protocols, or professional practice;
- bad output can cause material financial, scientific, legal, privacy, safety, or operational harm;
- data semantics, provenance, timing, units, missingness, sampling, or bias affect conclusions;
- the product has domain-specific performance, determinism, reproducibility, fairness, or audit requirements;
- acceptance needs a specialist oracle, certified fixture, simulator, benchmark, or qualified reviewer;
- architecture or lifecycle conventions differ materially from ordinary application development.

Do not activate a domain pack merely because a product belongs to an industry. Load it only when it changes this task's decisions or proof obligations.

## Supported Forms

A pack may be:

- another discoverable skill;
- a repository-owned policy or engineering guide;
- an authoritative standards bundle;
- a user-supplied expert protocol;
- a temporary, clearly labeled research synthesis for a bounded task.

Prefer a maintained existing source. Do not silently convert generic model knowledge into a “validated” pack.

## Required Pack Interface

Use this contract for a reusable pack. Omit a section only when the omission is explicit and cannot affect safe use.

```markdown
---
id: <stable-domain-id>
version: <semver or dated revision>
status: draft | reviewed | validated
applies_when: <discriminating activation conditions>
last_verified: <YYYY-MM-DD>
owners_or_reviewers: <accountable roles, if any>
---

# <Domain Pack Name>

## Scope and Exclusions
## Source and Freshness Policy
## Domain Model and Glossary
## User/Operator Outcomes
## Invariants and Forbidden States
## Hazards and Failure Severity
## Data Semantics and Provenance
## Architecture and Integration Constraints
## Validation Oracles, Fixtures, and Tolerances
## Required Tools and Checks
## Performance, Reliability, or Reproducibility Budgets
## Security, Privacy, Compliance, and Rights
## Human Authority and Review Gates
## Conditional Lifecycle Overrides
## Known Limits and Escalation Triggers
```

### What Good Content Looks Like

- **Sources** name authoritative origins, versions, jurisdictions, market/data dates, and refresh triggers.
- **Glossary** resolves terms that could change implementation or tests; it is not an encyclopedia.
- **Invariants** are written as assertions or forbidden states and become executable checks where practical.
- **Hazards** connect failure mode, severity, detection, mitigation, recovery, and accountable decision.
- **Data semantics** cover units, time, identity, ordering, missingness, revisions, lineage, and leakage risks that matter in the domain.
- **Architecture constraints** state why a boundary exists and what may depend on what; they avoid framework trivia.
- **Oracles** name how correctness can be independently observed, including reference datasets, tolerances, simulators, expert review, and known blind spots.
- **Tools/checks** are runnable or have a clear fallback. A tool name without expected evidence is not a control.
- **Human gates** name the decision and accountable qualification, not “ask an expert” generically.
- **Known limits** prevent the pack from presenting uncertain or stale guidance as universal truth.

## Precedence and Conflict Rules

1. Current applicable law, contract, approved organizational policy, and repository safety rules are hard constraints.
2. Explicit user outcomes and non-goals define product scope but do not silently waive safety, rights, or accountable review.
3. A validated, applicable domain pack may tighten the generic workflow and quality gates.
4. Repository-specific domain rules outrank generic pack defaults when both are current and authorized.
5. A provisional or stale pack supplies hypotheses, not final authority.

A pack must not:

- mark a core outcome complete without evidence;
- weaken a higher-authority security, privacy, compliance, or safety rule;
- grant network, secret, external-system, destructive, or production permission;
- claim professional qualification or regulatory approval;
- hide a conflict by selecting whichever rule is easiest to implement.

When packs conflict, identify the exact invariant, source version, scope, and consequence. Resolve through an authoritative source or accountable owner; keep the affected work blocked or isolated meanwhile.

## Loading Protocol

1. Identify the decision or failure mode that requires domain knowledge.
2. Locate applicable packs and inspect metadata before loading details.
3. Check status, version, last verification, scope, source quality, jurisdiction/platform, and known limits.
4. Read only the sections relevant to the current slice.
5. Produce a Domain Delta:

```markdown
## Domain Delta

- Pack(s) and version(s):
- Terms whose meaning changes:
- Added or tightened requirements:
- Architecture/integration constraints:
- Required invariants and forbidden states:
- Required data/provenance controls:
- Added validation oracles and tolerances:
- Added risk/module triggers:
- Human decisions or qualified reviews:
- Conflicts, stale evidence, and unknowns:
```

6. Add the delta to the Development Contract, design, work slice, and evidence matrix.
7. Re-check the pack only when a later slice crosses a new domain boundary; do not reload it in full by habit.

## No Pack Available

If the task is low or moderate consequence:

- perform targeted research using current authoritative sources;
- state the competency questions the research must answer;
- create a task-local provisional Domain Delta;
- label confidence, source date, and what a domain reviewer still needs to verify;
- validate through the strongest available independent oracle.

If the task is R2/R3, regulated, live-financial, safety-critical, or scientifically consequential, do not invent missing expertise. Continue only with safely isolated research, scaffolding, or test-harness work that cannot be mistaken for an approved domain result; request the qualified decision before the affected action.

## Multiple Domains

Compose packs only after mapping boundaries. Examples include finance plus privacy, scientific computing plus distributed systems, or game simulation plus accessibility.

- Assign each invariant and oracle to an owning pack.
- Identify shared data, units, time, identity, and trust boundaries.
- Detect contradictory tolerances, lifecycle assumptions, or authority gates.
- Keep one integrated evidence matrix; do not let each pack independently claim system completion.
- Prefer interface contracts between domains over merging their entire vocabularies.

## Illustrative Specialization Map

These examples show what a future pack would add; they are not implementations or sufficient domain guidance.

| Domain | Likely Invariants/Hazards | Architecture or Workflow Delta | Domain Oracles | Likely Human Gates |
|---|---|---|---|---|
| Game development | frame-time budget, deterministic simulation where required, save compatibility, asset rights, platform input/state behavior | playable vertical slice, asset pipeline, build targets, frequent playtest loop | frame capture, replay/golden state, controller matrix, visual/audio/playtest rubric | creative direction, platform certification, monetization/safety choices |
| Financial investment/trading | time ordering, market calendars, prices/corporate actions, no look-ahead or survivorship leakage, risk limits, auditability | research/live separation, deterministic backtest, data lineage, kill switch and staged execution | golden calculations, walk-forward/out-of-sample tests, reconciliation, stress scenarios | strategy approval, model risk, compliance, capital/live-order authorization |
| Office/productivity | document fidelity, user data ownership, permissions, undo/recovery, interoperability | local/cloud sync choices, import/export contracts, extension model, accessibility | round-trip corpora, permission matrix, collaboration conflict tests, accessibility review | enterprise data policy, external sharing, destructive bulk operations |
| Scientific software | units, numerical stability, uncertainty, provenance, reproducibility, separation of exploration and confirmatory analysis | reproducible environment, data/code versioning, deterministic seeds where possible | reference solutions, tolerance analysis, independent reproduction, sensitivity tests | method validity, interpretation, ethics, publication claims |
| Data processing/analytics | schema and semantic contracts, idempotency, lineage, missingness, duplicates, leakage, reconciliation | staged pipelines, immutable raw data, quality gates, backfill/rollback | row/count/control-total reconciliation, property tests, anomaly thresholds, sampled manual checks | source-of-truth choice, destructive correction, privacy, business metric definition |

## Pack Validation and Evolution

Before marking a reusable pack `validated`:

- test activation against positive and negative prompts;
- run representative normal, boundary, failure, and adversarial scenarios;
- verify that each mandatory invariant maps to an oracle;
- verify current sources, versions, jurisdictions, and licenses;
- check that the pack tightens rather than duplicates the core;
- measure irrelevant context and false blocking;
- obtain the named accountable review where required.

Revise from repeated observed failures or material source changes. Keep version history and re-run affected scenarios. Do not promote one project's convention into a universal domain invariant without evidence.
