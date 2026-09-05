# Greenfield Adapter

Read this reference when creating a new product or repository. Your goal is to reach a usable, verifiable vertical slice quickly while establishing only the architecture, guardrails, and project memory that current risks justify.

## Greenfield Invariants

- Begin with the user problem and outcome, not a technology inventory.
- Treat unvalidated product value and technical feasibility as hypotheses, not requirements disguised as facts.
- Build a walking skeleton early: one thin end-to-end path that can be built, run, tested, and observed in the real target shape.
- Prefer reversible decisions and a small dependency surface. Record only consequential choices.
- Encode essential boundaries and feedback early; postpone speculative scale, abstraction, services, roles, and configuration.
- “From zero” does not imply deployment. Delivery, operations, and distribution remain product-shape decisions.

## 1. Define Outcome and Learning

Establish:

- primary user/operator and job to be done;
- desired outcome and how success will be observed;
- first critical journey or system capability;
- non-goals and constraints;
- assumptions about users, data, environment, integrations, and scale;
- domain pack and accountable expertise needed;
- which uncertainties require research, prototype, or user feedback before a delivery build.

Separate two kinds of work:

- **learning slice**: tests a value, usability, data, or technical hypothesis with the least credible artifact;
- **delivery slice**: creates durable product behavior against a sufficiently stable contract.

Do not productionize a learning artifact by accident. If a prototype is promoted, explicitly review architecture, security, data, tests, licensing, and operational debt first.

## 2. Establish Project Principles

Create a short, project-visible map only if one does not already exist. It should point to, rather than duplicate:

- build, run, test, format, lint, and typecheck commands;
- architecture boundaries and dependency rules;
- product/domain source of truth;
- security and data-handling constraints;
- documentation and decision locations;
- release/operations paths when they exist.

Use the host's supported convention, such as `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, or another repository instruction file. Do not create competing instruction files or copy the same rules into each one. Keep detailed material behind links and make critical rules executable where practical.

## 3. Select Architecture from Decision Drivers

List the drivers before selecting a stack or topology:

- user experience and target platforms;
- data ownership, sensitivity, volume, and lifecycle;
- offline/online and latency requirements;
- reliability, determinism, reproducibility, or real-time budgets;
- integration and interoperability constraints;
- team/tooling constraints and operational ownership;
- security, compliance, licensing, and distribution model;
- expected change boundaries, not speculative user counts alone.

Compare alternatives only where the decision is material. Prefer technologies that the team and agent can inspect, run, test, and maintain in the intended environment. Avoid novel dependencies when a stable built-in or existing standard meets the need.

Record a decision when it is costly to reverse, constrains many later choices, or violates the default. Include the reversal signal.

## 4. Build the Walking Skeleton

The first delivery-quality slice should prove the development system as well as one user outcome:

1. canonical setup and repeatable local run;
2. one real entry point through the necessary layers to a visible result;
3. representative data or fixture flow;
4. an automated acceptance path for that journey;
5. fast static/unit feedback appropriate to the stack;
6. error visibility and minimal diagnostics;
7. build/package path if the product will be distributed;
8. CI or an equivalent repeatable gate when collaborative or long-lived development is in scope.

Do not construct every future layer before the first journey. Do not fake the core path with disconnected mock screens or placeholder services and then call the product usable. Stubs are acceptable when explicitly marked and when the slice's acceptance contract does not depend on their real behavior.

## 5. Grow by Vertical Slices

For each slice:

- start from a user, operator, integration, or learning outcome;
- update the behavioral contract and quality budgets;
- extend the architecture only at the pressure point exposed by the slice;
- keep data and API contracts explicit;
- add independent tests and runtime observability;
- review dependencies and generated scaffolding;
- reconcile project guidance when a repeated convention becomes real.

Use parallel exploration for genuinely independent design alternatives or low-overlap slices. Converge on one approved contract before integrating incompatible paths.

## 6. Greenfield Quality Gate

In addition to the universal review, check:

- the product solves the stated user problem rather than demonstrating the chosen technology;
- the critical path is real and end-to-end;
- architecture matches present decision drivers and has named extension seams;
- dependencies, licenses, versions, and generated templates were inspected;
- secrets, test data, and environment configuration are separated safely;
- the project can be set up and verified from repository-visible instructions;
- quality attributes have observable budgets instead of aspirational adjectives;
- deferred features and placeholders cannot be mistaken for complete behavior;
- optional delivery or operations work is neither missing when required nor built without a trigger.

## Greenfield Completion Evidence

The handoff must include:

- outcome and first usable/learning journey;
- setup, build, run, and test evidence;
- architecture drivers and consequential decisions;
- acceptance and quality-budget results;
- dependencies and external services introduced;
- assumptions validated, falsified, or still open;
- optional modules selected or skipped;
- next slice and the evidence that should trigger architectural expansion.

The project is not “done” because scaffolding exists. Completion is tied to the user's requested scope and observable behavior.
