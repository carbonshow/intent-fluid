# Brownfield Adapter

Read this reference when changing, debugging, modernizing, or extending an existing codebase. Your goal is not to understand everything before acting; it is to build a trustworthy model of the requested change surface and expand it only when evidence exposes wider coupling.

## Brownfield Invariants

- Preserve the user's working state and unrelated changes.
- Existing behavior is evidence, not automatic intent. Existing tests, code, docs, tickets, history, and production behavior can disagree.
- Compatibility is an explicit contract. Name what must remain stable: API, schema, stored data, configuration, performance, security, UI behavior, integrations, or deployment path.
- Prefer established repository patterns unless they are the defect, violate a current requirement, or create unacceptable risk.
- Characterize before replacing. Avoid big-bang rewrites unless the user explicitly chooses them after seeing migration and rollback risk.
- Do not require a complete reverse-engineered specification of a large system before the first bounded change.

## 1. Protect and Reproduce the Baseline

1. Read all applicable repository instructions and contribution guidance.
2. Inspect version-control status, current branch/worktree, recent relevant history, and existing user changes. Never erase or normalize unrelated work.
3. Discover the canonical setup, build, lint, typecheck, test, and run commands from project files and CI—not memory alone.
4. Run the narrowest safe baseline that can detect regression in the target area. For high-risk or cross-cutting work, also run the broader pre-change gate when feasible.
5. Reproduce the reported behavior through code, a test, UI, API, logs, metrics, or a fixture. Capture environment and input conditions.

If the baseline is already broken:

- record the exact pre-existing failure and evidence;
- determine whether it blocks validation of the requested change;
- avoid broad repair unless it is in scope or necessary for a trustworthy oracle;
- create a focused characterization test or alternative comparison when safe;
- never claim that a failure is pre-existing without observing it before the change or from reliable historical evidence.

## 2. Build Just-in-Time Cartography

Map the requested path and one boundary beyond it:

- user or external entry point;
- control and data flow;
- owning module/service/package and dependency direction;
- public interfaces, schemas, protocols, and stored-state boundaries;
- authorization, trust, and privacy boundaries;
- tests, fixtures, generators, mocks, and CI gates;
- runtime configuration, feature flags, logs, metrics, and failure recovery;
- relevant ownership, decisions, and change history.

Prefer tool-produced maps—symbol search, call sites, dependency graphs, schema inspection, test selection, runtime traces—over a prose summary when available. Keep the map scoped. Expand it when an interface, shared state, or cross-cutting concern makes the next dependency relevant.

## 3. Reconcile Evidence

Create a compact evidence ledger for consequential behavior:

| Behavior or Constraint | Code | Test | Runtime | Docs/History | Status |
|---|---|---|---|---|---|
| Example | observed location | coverage and result | reproduced result | intended statement | aligned / conflict / unknown |

Resolve conflicts by authority and freshness. Do not silently choose the easiest source. Typical patterns:

- passing tests can preserve an obsolete behavior;
- runtime behavior can contain an unintended defect;
- comments and docs can lag code;
- a new product requirement can intentionally supersede all current behavior;
- production configuration can differ from repository defaults.

When the correct behavior is a material product or policy decision, surface the conflict with evidence and obtain the decision.

## 4. Define the Change and Compatibility Envelope

Add to the Development Contract:

- observed baseline and reproduction path;
- desired delta and explicit non-goals;
- interfaces, consumers, data, tests, and operations that may be affected;
- behaviors that must remain unchanged;
- allowed migration or deprecation behavior;
- known pre-existing failures and technical debt;
- rollback/recovery requirements when triggered.

For bug fixes, include a regression oracle that fails for the observed defect and passes for the intended behavior when practical. For modernization, define equivalence properties before improving structure.

## 5. Choose a Change Strategy

Prefer the smallest strategy that preserves compatibility:

- modify through an existing seam;
- add an adapter around unstable or legacy behavior;
- introduce a contract test before changing an implementation;
- use expand/migrate/contract for schemas or APIs;
- use a strangler or side-by-side path for risky replacement;
- protect partial rollout with a flag or reversible configuration when the delivery module is active;
- separate behavior-preserving refactor from behavior change when combining them would obscure evidence.

A new abstraction must earn its cost through multiple real consumers, an explicit architecture boundary, or a verified risk reduction. Do not “clean up” neighboring code merely because it is visible.

## 6. Slice Around Risk

Good brownfield slices often follow this order:

1. make the current behavior observable or add characterization evidence;
2. introduce or stabilize an interface/seam;
3. change one behavior behind that seam;
4. migrate consumers or data in reversible increments;
5. remove obsolete paths only after evidence shows they are unused and rollback needs have expired.

Each slice must leave the repository in a reviewable, internally consistent state. When temporary dual paths are necessary, record their removal trigger and owner.

## 7. Brownfield Review Gate

In addition to the universal review, check:

- public and undocumented-but-relied-upon compatibility;
- downstream consumers and integration contracts;
- data migration, rollback, idempotency, and mixed-version operation;
- test changes that merely encode the new implementation;
- performance or resource regression in a historically sensitive path;
- deleted code, flags, configuration, or schema still referenced elsewhere;
- operational signals and support/runbook impact;
- whether new patterns fragment an established architecture.

## Brownfield Completion Evidence

The handoff must include:

- baseline and post-change reproduction results;
- change-surface map or concise affected-interface list;
- compatibility matrix and any intentional break;
- observed pre-existing failures separated from new results;
- migrations, flags, temporary paths, and removal triggers;
- checks run and not run;
- residual risk and rollback/recovery status.

If the existing system cannot be made sufficiently observable, mark verification incomplete and recommend the smallest harness or instrumentation improvement needed next.
