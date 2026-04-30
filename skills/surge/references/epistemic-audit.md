# Epistemic Audit

This reference defines the lightweight epistemic layer used by surge. It turns scientific-methodology ideas into runtime artifacts that can be read, validated, and carried across phases.

## Purpose

Use these artifacts to answer four questions:

1. What important hypotheses or claims are being relied on?
2. What observable evidence would support or weaken them?
3. Which high-risk claims have been actively challenged?
4. Why is the Director allowed to declare convergence now?

The audit layer does not replace acceptance criteria. It checks whether acceptance, evidence, confidence, and residual risk are aligned.

## Runtime Artifacts

`init.sh` creates the following files in each Context Package:

| File | Purpose |
|---|---|
| `epistemic-ledger.md` | Tracks hypotheses, claims, evidence, confidence, and decision impact. |
| `falsification.md` | Records disconfirmation checks for high-risk or contested claims. |
| `convergence-audit.md` | Records the evidence behind the stop decision. |
| `platform-capabilities.md` | Records host capabilities and fallback execution paths. |

## Epistemic Ledger Rules

The ledger table columns are:

| Column | Meaning |
|---|---|
| ID | Stable row id, such as `H-001` for hypotheses or `C-001` for claims. |
| Type | `hypothesis`, `claim`, `assumption`, `constraint`, or `decision`. |
| Statement | The thing being relied on. |
| Prediction / Observable | What would be observed if the statement is true. |
| Supporting Evidence | Durable evidence path, source id, test output, user clarification, or URL. |
| Opposing Evidence | Contradictory evidence or "None found after [method]". |
| Confidence | Low, Medium, or High unless real data justifies numeric probabilities. |
| Delta | Why confidence changed, such as `+ after QA` or `- after expert veto`. |
| Decision Impact | P0/P1/P2 impact on delivery or user decision. |
| Owner Phase | Phase responsible for maintaining the row. |

Rules:

- Treat LLM output as a hypothesis source, not as evidence.
- High-confidence claims require durable supporting evidence.
- P0/P1 rows require a prediction or observable.
- Document/strategy deliverables should link key quantitative or factual claims to source materials.
- Code deliverables should link behavior claims to build output, tests, source files, or QA artifacts when relevant.

## Falsification Gate

Use `falsification.md` when any of these triggers appear:

- P0/P1 requirement or claim.
- Security, privacy, data migration, financial, public release, or one-way-door architecture decision.
- Expert veto or severe expert disagreement.
- QA Level 2 or Level 3 failure.
- Document/strategy claim with market, competitive, scientific, legal, or domain-specific uncertainty.

Minimum fields:

| Field | Meaning |
|---|---|
| Claim ID | Ledger row being challenged. |
| What Would Prove It Wrong | Concrete counter-evidence or failure condition. |
| Search / Test Performed | What was done to look for counter-evidence. |
| Result | What was found. |
| Residual Risk | What remains uncertain. |
| Decision | Accept, redesign, ask user, defer, or override with risk. |

The gate is not a permanent veto. The user may explicitly accept residual risk.

## Convergence Audit

Before declaring convergence, QA or the Director updates `convergence-audit.md`:

| Check | Required Evidence |
|---|---|
| Acceptance criteria passed at current eval level | QA file path and pass counts. |
| High-confidence claims have evidence | Ledger rows or audit script result. |
| Important opposing evidence handled | Falsification rows or stated reason no gate was required. |
| Optimization directives executed or retired | QA Stage 5 result. |
| Remaining gaps are low impact or user-accepted | Gap list and user decision where applicable. |
| Quality is not being optimized at the expense of user value | Goodhart audit note. |
| Stop rule is explicit | Convergence reason from QA handling. |

Passing rows need substantive evidence. A table full of `pass` values without evidence is not convergence.

## Goodhart Audit

Run this check when convergence is near, when QA jumps sharply upward, or when the output looks polished but weakly supported:

- Is the output optimized for rubric shape rather than the user's real goal?
- Are weak sources hidden behind confident language?
- Are acceptance criteria too narrow to catch the user's likely failure cases?
- Did the process create artifacts that look complete but contain little decision-relevant evidence?
- Are the remaining improvements genuinely low-value, or just inconvenient?

Record the result in `convergence-audit.md`.

## Deterministic Helper

Use `scripts/audit-task.js` when Node.js is available:

```bash
node skills/surge/scripts/audit-task.js init-artifacts <task_dir>
node skills/surge/scripts/audit-task.js check-ledger <task_dir>
node skills/surge/scripts/audit-task.js check-convergence <task_dir>
node skills/surge/scripts/audit-task.js summarize-gaps <task_dir>
```

If Node.js is unavailable, apply the same checks manually and record the result in the relevant artifact.
