# Reference Reconstruction Adapter

Read this reference when an existing product, service, application, interface, API, or documented behavior is the target for an independent implementation or optimization.

This is an engineering workflow, not a legal conclusion. Rights, licenses, contracts, trademarks, patents, trade secrets, access-control rules, and permitted reverse engineering vary by source and jurisdiction. When a material question remains, stop the affected use of evidence and obtain qualified review.

## Reconstruction Invariants

- Establish what reference material may be used before implementation.
- Reproduce authorized observable behavior through an independent implementation; do not copy protected source code, assets, content, branding, secrets, or restricted expression.
- Do not bypass authentication, technical protection, rate limits, or other access controls to collect evidence.
- Separate `observed`, `documented`, `inferred`, `unknown`, and `desired divergence`.
- Keep parity and optimization in separate ledgers. An improvement does not erase a missing parity requirement.
- Version the target. Product behavior, screenshots, APIs, and content change over time.
- Feature count and pixel similarity do not prove usefulness, accessibility, security, performance, or operational equivalence.

## 1. Pass the Rights and Source Gate

Create a source ledger before relying on material:

| Source | Owner/Origin | Authorization or License | Permitted Use | Target Version/Date | Restrictions | Status |
|---|---|---|---|---|---|---|

Confirm:

- the user has supplied, owns, licensed, or is otherwise authorized to use the material for the stated purpose;
- public observation is performed through ordinary authorized use;
- no proprietary implementation, credentials, personal data, or confidential materials enter the workspace without explicit authority and appropriate controls;
- third-party assets, fonts, datasets, SDKs, APIs, and content have independent provenance and usable terms;
- names, logos, copy, visual assets, and brand identifiers will be replaced unless their use is authorized and in scope.

If authorization is unclear, you may still help define a clean-room functional specification from clearly permitted facts, but do not ingest or reproduce questionable material. Label the boundary and ask for the missing decision when it changes what can be built.

## 2. Inventory Evidence

Use available authorized evidence directly:

- product brief, user stories, marketing claims, and public documentation;
- screenshots, screen recordings, prototypes, and design files;
- normal user interaction with the running product;
- public or supplied API schemas and example payloads;
- support docs, error messages, accessibility tree, keyboard behavior, and localization;
- performance observations under stated environment conditions;
- user feedback and known pain points;
- user-supplied exports or test data with privacy controls.

For each observation, record source, target version, environment, steps, actual result, confidence, and permitted use. A screenshot proves one visual state, not hidden interaction, responsiveness, data rules, security, or failure behavior.

## 3. Build the Behavioral Contract

Create a behavior matrix before broad implementation:

| Journey/Capability | Preconditions | Action/Input | Observable Result | States/Errors | Quality Attributes | Evidence | Confidence |
|---|---|---|---|---|---|---|---|

Cover:

- navigation and primary user journeys;
- domain objects and state transitions;
- input rules, defaults, persistence, undo/recovery, and destructive actions;
- permissions, identity, collaboration, and multi-user effects where observable;
- loading, empty, partial, offline, timeout, and error states;
- responsive, keyboard, accessibility, and localization behavior when in scope;
- API or file compatibility and data round trips;
- performance and reliability characteristics that matter to the user.

Do not infer internal architecture from external behavior unless clearly labeled as a design hypothesis. Choose an independent architecture from the new product's constraints.

## 4. Define Parity and Divergence

Classify every target item:

| Tier | Meaning | Completion Rule |
|---|---|---|
| Critical parity | Journeys without which the reconstructed product cannot serve its stated purpose | Must pass before claiming a usable parity baseline |
| Core parity | Expected breadth, data fidelity, and main error/recovery behavior | Must pass for a “core replica” claim |
| Extended parity | Edge cases, secondary workflows, platform nuances, and non-functional equivalence | Pass, defer explicitly, or exclude by scope |
| Divergence | Intentional improvement, simplification, or new behavior | Has its own rationale, acceptance target, and impact on parity |
| Unknown | Evidence is unavailable or contradictory | Never silently treat as parity or divergence |

Default to proving the selected parity tier before optimizing it. If the user explicitly prioritizes differentiation or a subset first, record the trade: which parity items are deferred and how the product claim changes.

Keep two backlogs:

1. **Parity ledger** — target behavior, current result, evidence, gap, confidence.
2. **Optimization backlog** — user problem, proposed divergence, hypothesis, expected benefit, cost/risk, experiment, and reversal signal.

## 5. Create Oracles Before Scaling Implementation

Use an oracle appropriate to each behavior:

- scripted journey or end-to-end test;
- API/file contract and round-trip fixture;
- state-machine or property test;
- approved screenshot/golden comparison plus responsive and interaction checks;
- accessibility inspection and keyboard journey;
- performance measurement with environment and tolerance;
- side-by-side user evaluation;
- manual expert review for subjective or domain-specific quality.

Capture a baseline smoke path that every later slice can run. For visual reconstruction, compare hierarchy, layout, states, typography, interaction, and accessibility; a raw pixel score alone is brittle and can reward copying artifacts instead of preserving usable behavior.

Do not create tests from the same unverified inference used to implement the feature. Derive critical acceptance examples independently from the source evidence.

## 6. Implement in Parity Slices

Prefer this sequence:

1. establish the minimum real data/state path and application shell;
2. complete one critical journey end to end;
3. add core states and recovery behavior for that journey;
4. expand to the next independently verifiable capability;
5. close critical and core parity gaps;
6. evaluate selected optimizations against their own hypotheses;
7. add extended parity only where scope and value justify it.

At the start of each session or slice, run the smoke path and read the current parity ledger. At the end, update evidence and unknowns. Do not regenerate the whole application from the original high-level prompt.

## 7. Reconstruction Review Gate

In addition to the universal review, check:

- every used source has authorization/provenance and stays within permitted use;
- product identity, branding, content, assets, and implementation are independently created or licensed;
- observed behavior is distinguishable from inference;
- target version and environment are recorded;
- parity gaps are not relabeled as improvements;
- visual similarity does not mask broken interaction, accessibility, data, permissions, or errors;
- generated dependencies and public-code matches receive provenance/license review;
- optimizations solve a stated user problem and have a falsifiable evaluation;
- product claims accurately name the achieved parity tier and known unknowns.

## Reconstruction Completion Evidence

The handoff must include:

- source/rights ledger and any unresolved qualified-review need;
- target product version and test environment;
- behavior matrix and achieved parity tier;
- parity evidence, gaps, inferences, and unknowns;
- independent implementation and dependency provenance notes;
- optimization decisions and experiment results kept separate;
- checks run and not run, residual risk, and next target.

Use “reference implementation,” “behavioral parity,” or another precise description. Do not imply endorsement, official affiliation, complete equivalence, or rights that have not been established.
