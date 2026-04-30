# Experiment Design

Use this reference when the deliverable changes a workflow, prompt, rule, skill, rubric, or other agent process. The goal is to keep process evolution evidence-based.

## When Required

Create `experiment-plan.md` when any of these are true:

- The task changes `surge` itself.
- The task proposes a new reusable skill or rule.
- The task claims a workflow improves quality, reliability, cost, or speed.
- The user asks to compare methods or validate a process.

## Minimum Protocol

| Field | Meaning |
|---|---|
| Hypothesis | What process change should improve. |
| Baseline | Existing workflow or current skill behavior. |
| Treatment | Proposed workflow or skill behavior. |
| Task Set | Representative PRDs or scenarios. |
| Outcome Metrics | Quality, correctness, user value, or deliverable success. |
| Process Metrics | Time, token cost, tool calls, user interruptions, retry count. |
| Evidence Collection | How artifacts, QA reports, or user judgments will be gathered. |
| Promotion Threshold | What evidence is enough to make this the default. |

## Small First Run

Start with 3-5 historical or synthetic PRD tasks. Expand only if the result is ambiguous or the change has high impact.

## Promotion Ladder

1. Single observation: record in `memory_draft.md`.
2. Repeated pattern: create a proposal.
3. Accepted proposal: add pressure scenario, regression check, or audit script test.
4. Validated change: update references, scripts, rules, or `SKILL.md`.
5. Durable change: user review required before applying to shared rules or skills.

## Anti-Goodhart Checks

- A better rubric score is not enough if the user value did not improve.
- A lower token cost is not enough if evidence quality dropped.
- A cleaner artifact is not enough if it hides unsupported claims.
- A single successful run is not enough for default workflow promotion.
