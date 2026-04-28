# Evaluation Criteria

Use this reference to check whether an expert red-team review actually improved decision quality.

## Decision Quality

A good review:
- Gives a clear final judgment, not a vague summary.
- Names the recommended path and rejected alternatives.
- Preserves disagreements that affect the decision.
- Distinguishes one-way-door and two-way-door decisions.
- Identifies when more evidence is needed before action.

Failure signs:
- Everyone appears to agree without meaningful reasoning.
- The answer is balanced but does not decide.
- The recommendation ignores reversibility or blast radius.

## Evidence Quality

A good review:
- Labels important claims with evidence tags.
- Separates facts, inference, expert judgment, creative judgment, and unknowns.
- Uses domain-appropriate evidence standards.
- Does not treat model confidence as evidence.

Failure signs:
- Strong claims have no source, code, test, data, or reasoning trail.
- Domain claims are generic and could apply anywhere.
- Unknowns are hidden behind confident language.

## Role Quality

A good review:
- Selects roles based on failure modes.
- Uses orthogonal lenses.
- Constructs vertical-domain roles when the task demands it.
- Asks the user to confirm roles when domain criteria are unclear.

Failure signs:
- The same role appears under multiple names.
- A generic expert panel pretends to be specialized.
- More experts are added without improving coverage.

## Red-Team Quality

A good red team:
- Attacks core assumptions, not formatting.
- Finds counterexamples and edge conditions.
- Checks incentives, metrics, cost, operations, security, privacy, compliance, and domain-specific failure modes.
- Classifies findings as P0/P1/P2/P3.
- Provides minimum fixes for P0/P1.

Failure signs:
- Red-team findings are polite suggestions only.
- P0/P1 findings do not include minimum fixes.
- Everything is labeled severe, causing unnecessary paralysis.

## Rebuttal Quality

A good rebuttal:
- Responds only to relevant findings.
- Marks each finding as accepted, mitigated, disputed, or deferred.
- Explains what changes if the finding is accepted.
- Does not dismiss red-team issues without evidence.

Failure signs:
- Experts defend the original proposal reflexively.
- Rebuttal becomes a second generic review.
- Disputed findings have no evidence basis.

## Judge Quality

A good judge:
- Arbitrates rather than summarizes.
- States supported claims, weak claims, blocking risks, and accepted risks.
- Chooses a recommended path.
- Names minimum validation action.
- Requires a human gate for high-blast-radius actions.

Failure signs:
- The judge averages expert opinions.
- The judge avoids choosing between alternatives.
- The judge ignores P0/P1 findings.

## Output Usability

A useful final answer:
- Is short enough to act on and long enough to justify the decision.
- Provides next actions, not just analysis.
- Includes files changed or created when applicable.
- Makes human approval requirements explicit.

Failure signs:
- Long report, no next step.
- Lists risks without prioritizing them.
- Leaves the user unable to decide.

## Self-Check Before Final Answer

Before presenting the final package, check:

- Did I choose the smallest adequate level?
- Did I construct domain experts when needed?
- Did experts start independently?
- Did the red team attack the core decision?
- Did every P0/P1 get a minimum fix?
- Did the judge make a decision?
- Did I distinguish supported claims from unknowns?
- Did I identify the minimum validation action?
- Did I ask for human approval before any L3 execution?
