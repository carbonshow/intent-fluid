# Conditional Lifecycle Modules

The core development kernel always runs. These modules add work only when the product shape, delivery target, risk, or domain triggers them.

Applicability assessment is mandatory; module execution is conditional. Do not create a large checklist for obviously irrelevant modules. Record decisions that a future reviewer could reasonably question.

## Selection Protocol

1. Scan triggers during orientation.
2. Mark each material module `required`, `skipped — reason`, or `deferred — owner/activation signal`.
3. Add required module outputs to the Development Contract, design, work graph, and evidence matrix.
4. Re-scan when scope, architecture, data, distribution, or risk changes.
5. A module may tighten acceptance or authority; it may not silently grant permissions or waive the core workflow.

## Module Matrix

| Module | Typical Triggers | Minimum Outputs and Evidence | Key Gate |
|---|---|---|---|
| Product discovery and experiment | user value, workflow, feasibility, or adoption is materially uncertain | falsifiable hypothesis, cheapest credible experiment, success/failure signal, decision after result | do not disguise a prototype result as product validation |
| UX, visual design, accessibility, localization | human-facing UI, multi-device use, assistive technology, language/locale requirements | journey/state design, design-system constraints, keyboard/accessibility checks, responsive/locale evidence | accountable product/design decision for subjective tradeoffs |
| Data migration and backfill | persistent schema/state/format change, imports, reprocessing, ownership transfer | source/target contract, volume/profile, idempotency, validation/reconciliation, mixed-version plan, backup/rollback, dry run | explicit authority before destructive or irreversible execution |
| Security, privacy, abuse, compliance | identity, permissions, untrusted content, secrets, personal/regulated data, external integration, high-consequence behavior | trust/threat model, data flow, control mapping, secure defaults, scan/review evidence, retention/deletion/recovery rules | qualified/accountable acceptance for material residual risk |
| Performance, reliability, resilience | SLO/SLA, real-time/interactive budget, scale, concurrency, availability, resource/cost constraint | workload model, budgets, benchmark/load/failure results, capacity and bottleneck evidence, degradation/recovery behavior | measurements use representative conditions and tolerances |
| Deployment, release, rollback | user asks to deploy/release, artifact will be installed/published, environment/config changes | target/environment matrix, repeatable build, config/secrets plan, rollout, smoke checks, rollback/recovery, release notes | production/external mutation requires explicit authority |
| Operations, observability, incident response | long-running service, on-call/support duty, production diagnosis or remediation | logs/metrics/traces, alert/SLO mapping, dashboards/runbook, incident evidence, recovery verification | diagnosis does not authorize production remediation |
| Distribution and software supply chain | package, binary, container, plugin, mobile/desktop release, third-party consumption | dependency/license inventory, reproducible build inputs, signing/provenance/SBOM as required, artifact verification | consumers verify provenance against expectations |
| AI/ML or stochastic system | product trains, fine-tunes, embeds, retrieves for, or invokes a model; probabilistic output affects users | model/data provenance, task-specific evals, safety/privacy/robustness tests, baseline, cost/latency, monitoring/drift/fallback | accountable approval for consequential automated decisions |
| Compatibility and portability | public API/schema, file format, protocol, plugin ecosystem, multiple OS/device/runtime versions | compatibility matrix, contract/golden fixtures, versioning/deprecation policy, cross-target evidence | intentional breaks are explicit and migration-ready |
| External documentation, training, support | public API, end-user/operator behavior, adoption, customer support, compliance communication | audience-specific docs, examples, upgrade/runbook/support material, correctness review | legal/brand/safety-critical content gets accountable review |
| Deprecation, retirement, deletion | removing features/data/APIs/services, sunsetting product, destructive cleanup | usage evidence, notice/migration, archive/export, dependency removal, rollback window, post-removal verification | confirm ownership, retention, and irreversible effects |

## Product Discovery and Experiment

Activate when the team knows how to build something but not whether it is useful, usable, feasible, or worth the risk.

- State the hypothesis, affected users, independent/dependent variables, expected effect, and falsifying observation.
- Use the least expensive artifact that can change the decision: interview/prototype, technical spike, concierge flow, data sample, simulation, or limited release.
- Keep learning code isolated or clearly labeled. Define what must be rebuilt or hardened before promotion.
- End with `proceed`, `revise`, `stop`, or `need more evidence`; do not turn an inconclusive experiment into a delivery commitment.

## Data Migration and Backfill

Activate for persistent state, schema, format, or ownership changes even if application code is small.

Required considerations:

- source/target truth and semantic mapping;
- data profile, volume, skew, invalid/missing/duplicate records;
- online/offline and mixed-version compatibility;
- repeatability, idempotency, checkpoints, resume behavior, and audit trail;
- dry run and sampled plus aggregate reconciliation;
- backups, rollback or forward-fix, and the point of irreversibility;
- privacy, retention, lineage, and access controls;
- monitoring during execution and post-migration acceptance.

Generate migration code and plans independently enough that one mistaken mapping does not validate itself.

## Security, Privacy, Abuse, and Compliance

The universal security baseline always applies; activate this deeper module when a meaningful trust boundary or obligation exists.

- Identify assets, actors, entry points, trust boundaries, threats/misuse, and unacceptable outcomes.
- Map each material threat to prevention, detection, response, and evidence.
- Minimize data and permissions; define purpose, retention, deletion, encryption, logging, and incident handling.
- Use current, applicable standards and jurisdiction/project policies. A generic checklist does not prove compliance.
- Review dependencies, build/release provenance, prompt/retrieval injection where relevant, and external tool permissions.
- Keep legal/compliance interpretation and residual-risk acceptance with accountable reviewers.

## Performance, Reliability, and Resilience

Activate when quality can fail under load, timing, concurrency, network, or resource pressure.

- Define representative workload and environment before measuring.
- Record baseline, budget, distribution/tail metric, resource cost, and tolerance.
- Test failure injection, overload/degradation, timeout, retry/backoff, idempotency, recovery, and data consistency where relevant.
- Compare like-for-like and retain raw results sufficient to reproduce the conclusion.
- Avoid optimizing a microbenchmark that is not connected to user or system behavior.

## Deployment, Release, and Operations

Delivery is separate from implementation. A change can be implementation-complete while release is not requested or not authorized.

For delivery:

- identify exact artifact, environment, users, version, configuration, and dependencies;
- build from controlled inputs and verify the artifact that will actually ship;
- define staged rollout or distribution, smoke/health checks, stop conditions, and rollback/recovery;
- keep credentials and production data outside generated artifacts and logs;
- require the appropriate human or system gate before external mutation;
- observe real behavior after release and feed incidents, metrics, and user outcomes back into the living specification.

For operations:

- give the agent only the logs, metrics, traces, code, and deployment history needed for the incident;
- separate observed symptom, candidate cause, confirming evidence, remediation, and preventative change;
- rehearse or validate the fix in an isolated environment when possible;
- treat an AI-generated root-cause narrative as a hypothesis until evidence connects symptom to mechanism.

## Distribution and Supply Chain

Activate when others consume an artifact rather than only source in a local workspace.

- inventory direct and material transitive dependencies, origin, version/digest, license, and necessity;
- use trusted build infrastructure appropriate to the risk;
- generate and distribute provenance, signatures, SBOM, or attestations when required by the ecosystem/organization;
- verify the final artifact and its provenance, not only the source tree;
- document supported versions, update path, vulnerability response, and reproducible build inputs.

Select an assurance target such as an applicable SLSA level from project requirements; do not claim conformance from a checklist alone.

## AI/ML and Stochastic Systems

Activate because the product contains or depends on a model, not merely because AI helped write its code.

- Define the task, population, decision boundary, failure severity, and fallback.
- Version model, prompt/configuration, retrieval corpus, tools, datasets, preprocessing, and eval code.
- Separate training/tuning, validation, and held-out evaluation data; test leakage and contamination risks.
- Use task-specific offline and online evals, slice analysis, adversarial/safety cases, human rubric calibration, and uncertainty reporting.
- Measure quality together with latency, cost, robustness, privacy, and operational failure.
- Monitor drift and feedback loops; define rollback or disable paths.
- Use current AI-specific secure-development and governance profiles required by the project/domain.

## Deprecation and Retirement

Activate when removal can strand users, data, integrations, or obligations.

- establish evidence of usage and owners;
- define notice, replacement, migration, export/archive, and retention;
- stage disablement before deletion where feasible;
- remove code, configuration, data, docs, alerts, credentials, and dependencies consistently;
- verify consumers and recovery window before the irreversible step;
- preserve required audit or compliance evidence.

## Module Handoff

For every required module, report:

- trigger and scope;
- artifacts or controls created;
- evidence observed and environment;
- accountable gate status;
- skipped/deferred work and activation signal;
- residual risk, recovery, and next feedback loop.
