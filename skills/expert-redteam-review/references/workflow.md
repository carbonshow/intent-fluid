# Expert Red-Team Workflow

This reference defines the scalable workflow. Use the smallest level that can produce a reliable decision.

## L0: Quick Red-Team Check

Use L0 when the user wants a fast challenge, a sanity check, or a concise adversarial pass.

Steps:
1. Identify the decision point.
2. State assumptions and constraints.
3. Challenge the proposal from value, feasibility, and risk perspectives.
4. Classify serious issues as P0/P1/P2/P3.
5. Give a concise recommendation and minimum validation action.

Output:

```markdown
## Quick Red-Team Check

### Main Vulnerability
### Must-Fix Before Action
### Acceptable Risks
### Minimum Validation
### Recommendation
```

Do not dispatch subagents for L0.

## L1: Small Expert Review

Use L1 when multiple perspectives are useful but formal adversarial review would be excessive.

Steps:
1. Build a compact context package.
2. Choose 2-3 orthogonal expert roles.
3. Run independent expert judgments.
4. Synthesize consensus and disagreements.
5. Recommend a path and minimum validation action.

Output:

```markdown
## Expert Review Summary

### Context
### Selected Experts
### Expert Judgments
| Expert | Judgment | Evidence Level | Key Risk | Recommendation |
|---|---|---|---|---|

### Consensus
### Disagreements
### Recommended Path
### Minimum Validation
```

Use real subagents when the environment supports delegation and independent context matters. Otherwise simulate roles sequentially with strict section separation.

## L2: Full Expert Panel + Red Team

Use L2 when the user asks for an expert panel, red team, rebuttal, or judge, or when the decision is ambiguous, cross-functional, high-impact, or likely to suffer from hidden assumptions.

Steps:
1. **Triage**: define the decision, reversibility, risk level, and output target.
2. **Context package**: capture scope, non-goals, constraints, success criteria, evidence policy, and known unknowns.
3. **Expert panel**: choose 3-5 orthogonal roles. Experts produce independent judgments.
4. **Synthesis**: summarize consensus briefly, then emphasize disagreements and weak evidence.
5. **Red team**: attack assumptions, incentives, metrics, cost, edge cases, security, privacy, compliance, operations, and bland compromises.
6. **Rebuttal**: only experts touched by a finding respond. Mark each finding `accepted`, `mitigated`, `disputed`, or `deferred`.
7. **Judge**: arbitrate supported claims, weak claims, blocking risks, accepted risks, rejected alternatives, and the recommended path. The judge should use the record, not loyalty to the initial recommendation.
8. **Decision package**: produce an actionable result.

Output:

```markdown
## Expert Red-Team Decision Package

### Final Judgment
### Decision Context
### Expert Panel
### Consensus
### Disagreements
### Red-Team Findings
#### P0 Blocking
#### P1 Must Fix
#### P2 Residual Risk
#### P3 Improvements
### Rebuttals
### Judge Arbitration
### Recommended Path
### Must-Fix Before Proceeding
### Minimum Validation Action
### Human Gate
### Files Created or Changed
```

## L3: Gated Review

Use L3 for one-way-door or high-blast-radius decisions, including production releases, data migrations, financial exposure, privacy/security/compliance risks, external publication, permission changes, or destructive actions.

L3 is L2 plus:
- Explicit one-way-door / two-way-door classification.
- Human approval before execution.
- A rollback or containment note when rollback is possible.
- A recommendation that does not execute the risky action until approved.

Human gate format:

```markdown
### Human Gate
Status: Required
Reason: [irreversible / production / security / privacy / compliance / financial / external-facing / destructive]
Approval Needed For: [specific action]
Do Not Execute Until: the user explicitly approves this action.
```

## Escalation and Downshift Rules

Escalate when:
- L0 finds a P0/P1 issue.
- L1 experts strongly disagree on the recommended path.
- The task involves one-way-door execution.
- Evidence is weak but consequences are high.

Downshift when:
- The user asks for speed and risk is low.
- The task is a simple implementation detail.
- The decision is already made and only execution remains.
- The panel would repeat obvious points rather than improve judgment.

## Red-Team Severity

| Severity | Meaning | Required Handling |
|---|---|---|
| P0 | Blocks the proposal or can cause major failure. | Do not proceed without redesign or explicit user override. |
| P1 | Must be resolved before execution. | Provide a minimum fix. |
| P2 | Acceptable only if recorded and monitored. | Explain why it is acceptable. |
| P3 | Improvement suggestion. | Do not present as a blocker. |

Every P0/P1 requires a minimum fix. If the review cannot identify a fix, say so and recommend more discovery before action.

## Evidence Policy

Use these labels for important claims:

- `[source]`: external source or authoritative document.
- `[code]`: current code or repository file.
- `[test]`: test, build, benchmark, or runtime verification.
- `[data]`: dataset, metric, telemetry, financial model, or measurement.
- `[inference]`: reasoning from stated facts.
- `[engineering-judgment]`: engineering experience or heuristic.
- `[creative-judgment]`: creative, editorial, aesthetic, or audience-experience judgment.
- `[unknown]`: important but currently unsupported.

The judge should not treat all labels equally. A high-confidence decision should rely on evidence appropriate to the domain.
