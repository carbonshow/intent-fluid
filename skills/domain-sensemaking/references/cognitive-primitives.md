# Cognitive Primitives For Domain Sensemaking

Use this reference when a research result must become an Agent workflow, evaluation rubric, experiment design, or repeatable skill. The primitives below are the execution-level pieces extracted from broader scientific methods.

## Primitive Menu

| Primitive | Use When | Agent Operation | Output Artifact |
|---|---|---|---|
| Abduction | The input is vague, surprising, or contradictory | Generate multiple candidate explanations for the observation | hypothesis rows in `frontier.csv` or `claims.csv` |
| Operationalization | The goal or quality bar is fuzzy | Convert abstract criteria into observable checks, metrics, assertions, or failure thresholds | convergence criteria, evaluation rubric |
| Hypothetico-deductive loop | A claim needs validation | Turn a hypothesis into predictions, then into evidence-gathering actions | round plan and verification steps |
| Triangulation | A key claim could be wrong, biased, or popular because many sources repeat it | Trace source origins, compare independent evidence types, look for counterevidence, and assign a triangulation status | `source-notes/` plus `claims.csv` triangulation fields |
| Bayesian update | Evidence changes confidence but does not decide the issue | Update claim confidence continuously instead of binary pass/fail | confidence field in `claims.csv` |
| Falsification check | A hard constraint or high-risk assumption exists | Ask what would prove the claim or plan wrong; search for counterevidence | contradiction/gap rows |
| Metacognitive reflection | Iteration quality matters | Inspect whether the current strategy is producing new signal or just repeating itself | round decision and next frontier |
| Satisficing stop | Research could continue indefinitely | Stop when the answer is good enough for the target decision under budget | convergence evidence |
| Skill consolidation | The same pattern worked repeatedly | Convert the verified method into durable instructions, scripts, or memory | SKILL/README/reference update |

## Default Composition

For substantial research, use this order:

1. Abduction: generate possible frames and explanations.
2. Operationalization: define what would make the answer usable.
3. Hypothetico-deductive loop: plan checks that can change the answer.
4. Triangulation: gather independent evidence for high-impact claims.
5. Bayesian update: assign confidence and mark what changed it.
6. Falsification check: look for failure cases and hard disconfirming evidence.
7. Metacognitive reflection: decide whether to continue, pivot, deepen, or converge.
8. Satisficing stop: stop when marginal exploration is low.
9. Skill consolidation: capture reusable lessons only after verification.

Do not load every primitive into every task. Trivial fact lookup needs none. Bounded research usually needs operationalization, one validation loop, and a stop rule. Non-trivial research should use the full composition.

## Triangulation Operation

Triangulation is not "find three sources." It checks whether a claim survives contact with independent evidence. Multiple search results, reposts, vendor summaries, or LLM restatements that trace to the same upstream origin count as one evidence origin.

Use this operation for high-impact, controversial, factual, quantitative, or decision-relevant claims:

1. Identify the exact claim and why it matters to the user's decision or understanding.
2. Trace upstream origins. Group sources that repeat the same original report, benchmark, paper, vendor post, dataset, or anecdote.
3. Classify source roles: primary, independent-analysis, replication, aggregator, vendor, opposing, user-provided, or unknown.
4. Seek at least one opposing or complicating source angle when the claim could materially change the conclusion.
5. Assign a triangulation status in `claims.csv`.

| Status | Meaning | Confidence Rule |
|---|---|---|
| `unverified` | No durable source, or only LLM/search-result snippets. | Low only. |
| `single-origin` | Support exists, but all support traces to one upstream origin. | Capped at medium. |
| `corroborated` | Multiple independent origins or evidence types support the claim, and opposition is weak or explained. | May be high. |
| `contested` | Credible opposing evidence exists. | Capped at medium until resolved or accepted as risk. |
| `inconclusive` | Evidence is weak, unavailable, capability-limited, or too costly to resolve now. | Low or medium with explicit residual risk. |
| `direct-data` | Direct experiment, dataset, code inspection, or measurement supports the claim. | May be high if method is adequate. |
| `not-required` | Low-impact claim where triangulation would not affect the output. | Do not use for high-impact claims. |

High confidence requires `corroborated` or `direct-data`. If the status is `single-origin`, `contested`, or `inconclusive`, write the confidence cap and downstream implication instead of smoothing over the uncertainty.

## Embedding In Agent Loop

When building or evaluating an Agent workflow, map the primitives to their temporal position in the loop:

### Single-Task Loop (within one research cycle)

```text
Input (vague question / observation / task)
  │
  ├─ 1. Abduction ──────── generate candidate frames/hypotheses
  │
  ├─ 2. Operationalization ── define measurable success criteria
  │
  ├─ 3. Hypothetico-deductive ── derive testable predictions
  │
  ├─ 4. Triangulation ───── gather independent evidence
  │
  ├─ 5. Bayesian update ──── adjust claim confidence
  │
  ├─ 6. Falsification check ── test hard constraints / red lines
  │
  ├─ 7. Metacognitive reflection ── assess: am I converging?
  │
  └─ 8. Satisficing stop ─── good enough for the decision? → exit or loop back to 3
```

Primitives 3-7 form the iterative core; each round re-enters at 3 (or 1 if the problem needs reframing).

### Cross-Task Evolution Loop (across sessions)

```text
Completed task
  │
  └─ 9. Skill consolidation ── extract verified pattern → persist as reusable skill/reference
         │
         └─ feeds back into future tasks' primitive selection and defaults
```

### Triage-Based Pruning

Not every task needs all 8 primitives in the single-task loop:

| Task complexity | Active primitives | Skippable |
|---|---|---|
| Trivial (lookup) | None | All |
| Bounded (clear scope) | 2, 3, 5, 8 | 1 (already framed), 4 only for low-impact claims, 6 (low risk), 7 (one pass) |
| Non-trivial | All 1-8 | None -- but budget each by impact |

## Mapping To Workspace Files

| Workspace File | Primitive Role |
|---|---|
| `problem-card.md` | abduction seed, operationalized target output |
| `frontier.csv` | candidate hypotheses, concepts, methods, evidence, and decisions |
| `rounds/round-XX.md` | hypothetico-deductive loop and metacognitive reflection |
| `source-notes/source-XXX.md` | triangulation, source-origin tracing, and reusable evidence capture |
| `claims.csv` | Bayesian confidence, triangulation status, and evidence ledger |
| `contradictions.csv` | falsification checks, gaps, assumptions |
| `convergence.csv` | satisficing stop and decision readiness |
| `final-synthesis.md` | reader-calibrated answer, not raw research state |

## Failure Modes

| Failure Mode | Symptom | Countermeasure |
|---|---|---|
| Method pile | Many scientific terms, weak workflow implications | Translate each method into a primitive and artifact |
| Claim pile | Many claims, no reasoning chain | Use final synthesis to connect premise -> evidence -> inference -> answer |
| False convergence | Checklist says pass but evidence is thin | Run `check-convergence --workspace` and fix lint issues |
| Unverifiable authority | External papers appear only in final prose | Create `source-notes/` and cite source ids in `claims.csv` |
| Popularity echo | Many sources repeat the same claim, so confidence rises without source independence | Trace upstream origins and cap status at `single-origin` or `inconclusive` |
| Over-processing | Simple question gets a full research pipeline | Use triage: skip primitives not needed for the decision |
