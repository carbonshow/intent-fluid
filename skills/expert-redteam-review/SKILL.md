---
name: expert-redteam-review
description: Use when a user asks to evaluate a complex, high-impact, ambiguous, cross-functional, or hard-to-reverse decision; mentions expert panel, red team, adversarial review, rebuttal, judge, arbitration, risk review, challenge assumptions, poke holes, or wants stronger decision quality than a normal review.
version: "1.0.3"
author: carbonshow
tags: [decision-quality, expert-review, red-team, orchestration, risk]
---

# Expert Red-Team Review

Use this skill to improve decision quality for complex work. The main agent stays accountable for state, scope, synthesis, and final communication. Experts, red team, rebuttal, and judge roles exist to reveal blind spots; they do not replace the user's decision.

## Core Rules

- Scale the workflow to the task. Do not run a full panel for trivial work.
- Keep expert initial judgments independent. Do not show one expert another expert's initial answer.
- Prefer 3-5 experts for serious reviews. More than 5 usually adds integration noise.
- Build vertical-domain experts from success criteria and failure modes; do not pretend a generic role is domain expertise.
- For vertical-domain L2/L3 work, propose the domain-specific panel and ask the user to confirm or adjust it before running the full review, unless the user has already approved the panel.
- Label important claims with evidence tags: `[source]`, `[code]`, `[test]`, `[data]`, `[inference]`, `[engineering-judgment]`, `[creative-judgment]`, or `[unknown]`.
- Optimize for decision quality, not consensus. Preserve meaningful disagreement.
- The judge must arbitrate. A judge that only summarizes has failed.
- P0/P1 red-team findings require minimum fixes. P2 risks require explicit acceptance rationale.
- For one-way-door or high-blast-radius actions, stop at recommendation and ask for human approval before execution.

## Level Selection

| Level | Use When | Shape |
|---|---|---|
| L0 Quick Check | The user wants a fast challenge or self-check. | Single-agent red-team review. |
| L1 Expert Review | 2-3 perspectives are useful, but formal adversarial review is unnecessary. | Small independent expert panel, no red team. |
| L2 Full Review | The user asks for expert panel/red team/judge or the decision has major uncertainty. | Expert panel, synthesis, red team, rebuttal, judge. |
| L3 Gated Review | The decision is hard to reverse or affects production, security, privacy, finance, compliance, or shared systems. | L2 plus explicit human gate before action. |

Default downshift: if the task is low-risk or the user asks for speed, choose the lowest useful level. Default upshift: if L0/L1 reveals P0/P1 risks or severe disagreement, propose L2.

## Operating Flow

1. Triage the request and choose L0-L3.
2. Build a compact context package: decision point, scope, non-goals, hard constraints, success criteria, evidence policy, and output target.
3. Select orthogonal roles. For vertical domains, construct role cards from domain success criteria and failure modes.
4. If the task is vertical-domain L2/L3 and the panel has not already been confirmed, stop and ask the user to confirm or adjust the proposed panel before full review.
5. Run independent expert analysis when L1+ is needed.
6. Synthesize consensus and disagreements. Lead with disagreements that affect the decision.
7. Run red-team attack for L2/L3.
8. Run rebuttal from relevant experts only.
9. Judge the result: supported claims, weak claims, blocking risks, accepted risks, rejected alternatives, recommended path, minimum validation.
10. For L3, ask the user before executing any irreversible or externally visible action.

## Reference Files

| File | Read When |
|---|---|
| `references/workflow.md` | You need the detailed L0-L3 workflow, escalation rules, or failure handling. |
| `references/role-library.md` | You need to choose experts or construct vertical-domain roles. |
| `references/templates.md` | You need prompt/output templates for context package, experts, red team, rebuttal, or judge. |
| `references/surge-integration.md` | The task involves an optional integration with surge. |
| `references/evaluation.md` | You need to check whether the review itself is high quality. |

## Output Contract

For L0, keep the answer compact. For L1-L3, produce a decision package with:

- Final judgment.
- Recommended path and rejected alternatives.
- Must-fix issues.
- Accepted residual risks.
- Open or deferred questions.
- Minimum validation action.
- Human gate status.
- Files created or changed, if any.

## Common Failure Modes

- A panel gives agreeable summaries but no decision.
- The red team attacks style instead of core assumptions.
- The judge averages opinions instead of arbitrating.
- Generic roles are used for a vertical domain without constructing domain-specific lenses.
- The workflow becomes a hard dependency for another system that should only use it as an optional checkpoint.
- The output is long but not actionable.
