# Artifact Contracts

Use these templates when durable state improves execution or auditability. Follow existing repository, issue, and documentation conventions; do not create duplicate files for information already authoritative elsewhere.

For an S0 patch, most fields may stay in the task conversation and final handoff. For S1, use a compact contract and evidence matrix. For S2, multi-session, multi-contributor, or R2/R3 work, persist the relevant artifacts in the project system of record.

## Development Contract

```markdown
# Development Contract: <task>

## Outcome and Authority
- Requested outcome:
- User/operator:
- Requested action: analyze | plan | implement | deliver
- Decisions reserved for owner:
- Explicit non-goals:

## Routing
- Engagement mode: brownfield | greenfield | reference reconstruction | mixed
- Scale: S0 | S1 | S2
- Risk: R0 | R1 | R2 | R3
- Autonomy/permission envelope:
- Domain pack(s), version, status:

## Current or Initial State
- Baseline/reproduction:
- Evidence and confidence:
- Relevant interfaces/data/dependencies:
- Existing user changes to preserve:

## Behavioral and Quality Contract
| ID | Scenario or quality claim | Expected observable result | Planned oracle | Priority |
|---|---|---|---|---|

## Assumptions and Unknowns
| Item | observed/intended/inferred/unknown/conflict | Impact | Resolution or owner |
|---|---|---|---|

## Conditional Modules
| Module | required/skipped/deferred | Trigger or reason | Owner/gate |
|---|---|---|---|
```

Keep this as the current contract. Record consequential changes in a decision log rather than deleting the previous rationale.

## Change-Surface Map

Use for brownfield or cross-system work.

```markdown
# Change-Surface Map

- Entry point / initiating event:
- Primary control flow:
- Data flow and ownership:
- Affected modules/services/packages:
- Public interfaces, schemas, formats, protocols:
- Consumers and compatibility promises:
- Trust, permission, and privacy boundaries:
- Tests, fixtures, CI, and runtime observability:
- Configuration, feature flags, and environments:
- Known coupling, pre-existing failures, and uncertain edges:
```

Link to code and generated diagrams where they are more precise than prose.

## Domain Delta

```markdown
# Domain Delta

- Pack(s), version(s), status, source date:
- Terms whose meaning changes:
- Added/tightened requirements:
- Invariants and forbidden states:
- Hazards and severity:
- Data semantics, provenance, units, time, missingness:
- Architecture/integration constraints:
- Validation oracles, fixtures, and tolerances:
- Required tools/checks:
- Added lifecycle modules:
- Human gates and qualifications:
- Conflicts, stale evidence, unknowns, escalation triggers:
```

Every material domain rule should change an acceptance item, design constraint, review lens, or gate. Remove background content that does none of these.

## Work Graph and Slice Card

```markdown
# Work Graph

| Slice | User or learning value | Depends on | Interfaces/files | Acceptance IDs | Risk | State |
|---|---|---|---|---|---|---|

## Active Slice: <id and title>
- Single outcome:
- In scope:
- Out of scope:
- Preconditions/baseline:
- Interfaces and allowed files/areas:
- Acceptance IDs and commands/oracles:
- Domain and module gates:
- Rollback/recovery:
- Handoff target:
```

Parallelize only slices with stable contracts and low overlap. The graph must include an integration and combined-verification node when outputs meet.

## Decision Record

Use for costly-to-reverse, cross-cutting, risk-accepting, or convention-breaking choices.

```markdown
## Decision: <short title>
- Date/status/owner:
- Context and decision driver:
- Evidence and confidence:
- Options considered:
- Decision and rationale:
- Consequences and accepted risk:
- Reversal signal and migration path:
- Affected contracts/docs/tests:
```

Do not create a decision record for routine implementation detail.

## Acceptance Evidence Matrix

```markdown
# Acceptance Evidence

| ID | Claim | Oracle and environment | Expected | Observed | Status | Evidence link/output | Confidence/gap |
|---|---|---|---|---|---|---|---|
| AC-1 |  |  |  |  | passed/failed/blocked/not run |  |  |
```

Rules:

- Each row represents a claim, not merely a command.
- Capture actual observations. Link artifacts or retain the concise output needed to reproduce them.
- Separate pre-existing failure evidence from post-change results.
- Do not omit failed, blocked, or not-run rows from the final summary.

## Evidence Ledger for Conflicting Sources

```markdown
| Behavior/Constraint | Source | observed/intended/inferred/stale/conflict/unknown | Version/Date | Evidence | Authority/Confidence | Decision |
|---|---|---|---|---|---|---|
```

Use when code, tests, docs, runtime, policies, reference-product evidence, or user statements disagree.

## Reconstruction Source and Parity Ledgers

```markdown
# Source and Rights Ledger

| Source | Owner/origin | Authorization/license | Permitted use | Target version/date | Restrictions | Status |
|---|---|---|---|---|---|---|

# Behavioral Parity Ledger

| Capability/Journey | Tier | Evidence | observed/documented/inferred/unknown | Target | Current Result | Status/Gap |
|---|---|---|---|---|---|---|

# Optimization Backlog

| User problem | Proposed divergence | Hypothesis | Expected benefit | Experiment/oracle | Risk/cost | Decision |
|---|---|---|---|---|---|---|
```

Never merge the parity and optimization tables. They answer different questions.

## Session Handoff

```markdown
# Current Handoff

## Bottom Line
- Current state: accepted | iterating | redesigning | reframing | blocked | stopped
- Completed outcome:
- Active/next slice:

## Decisions and Changes
- Decisions made and why:
- Files/interfaces/data changed:
- Spec/docs/guardrails updated:

## Evidence
| Acceptance ID | Status | Observed evidence |
|---|---|---|

## Risks and Gaps
- Failed/blocked/not-run checks:
- Residual risk and accepted owner:
- Assumptions/unknowns:
- Temporary paths, migrations, flags, or cleanup triggers:

## Resume
- Exact next executable action:
- Commands/oracles to run first:
- Context/resources to load:
- Permissions or human decisions needed:
```

Update this at meaningful handoffs and the end of every multi-session slice. Replace stale current-state text while preserving decisions and historical evidence in their own records.

## Final User Handoff

Lead with the result, not process chronology:

```markdown
Outcome:

What changed:
-

Evidence:
- <acceptance claim -> observed result>

Not verified / residual risk:
-

Conditional modules and gates:
-

Files/artifacts:
-

Next action, if any:
-
```

Do not claim tests or review that did not occur. Do not force the user to read the working packet to understand the final state.
