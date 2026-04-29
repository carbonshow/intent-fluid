# Domain Sensemaking Templates

Use these templates when the user asks for a concrete workflow artifact or when the research is substantial enough to need traceability.

If a local runtime is available, prefer generating these files with:

```bash
python scripts/sensemaking_helper.py init --output path/to/workspace --question "..."
```

## Problem Card

```markdown
# Problem Card

Initial question:
Current reframing:
Mode:
Target output:

Core uncertainties:
- U1:
- U2:
- U3:

Known facts:
-

Initial hypotheses:
- H1:
- H2:

Constraints:
- Time:
- Data:
- Scope:
- Business/engineering boundary:

Draft convergence criteria:
-
```

## Frontier Queue

```markdown
| Node | Type | Exploration purpose | Impact | Uncertainty | Explorability | Cost | Priority |
|---|---|---|---:|---:|---:|---:|---:|
|  | concept / variable / method / evidence / case / controversy / hypothesis / decision |  |  |  |  |  |  |
```

Use a 1-5 score for `Impact`, `Uncertainty`, `Explorability`, and `Cost`. Higher `Cost` lowers priority.

## Node Exploration Note

```markdown
## Node:

Type:
Exploration purpose:

### Definition

### Structure
- Related concepts:
- Related variables:
- Related methods:
- Related cases:
- Dependencies:

### Evidence
| Source | Claim | Evidence type | Reliability | Notes |
|---|---|---|---|---|

### Implication
- Question update:
- Hypothesis update:
- New frontier candidates:
```

## Concept Relation Table

```markdown
| A | Relation | B | Note |
|---|---|---|---|
|  | is-a / part-of / depends-on / causes / enables / contrasts-with / evolves-from / used-for / failure-mode-of |  |  |
```

## Claim-Evidence Table

```markdown
| Claim | Supporting evidence | Opposing evidence | Confidence | Decision relevance |
|---|---|---|---|---|
|  |  |  | high / medium / low |  |
```

Confidence guidance:

- `high`: multiple reliable sources or direct data support the claim; counterevidence is weak or explained.
- `medium`: plausible and supported, but limited by source quality, sample size, or unresolved assumptions.
- `low`: useful hypothesis, but evidence is thin, indirect, outdated, or mostly inferred.

## Contradiction And Gap Table

```markdown
| Type | Content | Likely cause | Next action |
|---|---|---|---|
| contradiction / gap / isolated-node / assumption |  | definition / sample / time window / incentive / missing data / unknown |  |
```

## Convergence Checklist

```markdown
| Check | Status | Evidence |
|---|---|---|
| Question is specific enough to answer | pass / fail |  |
| Main graph has no critical isolated nodes | pass / fail |  |
| Key disagreements can be explained | pass / fail |  |
| Important claims have sufficient evidence or explicit uncertainty labels | pass / fail |  |
| Decision, explanation, experiment, or action can be derived | pass / fail |  |
| New exploration has low marginal value | pass / fail |  |
```

## Final Synthesis

```markdown
# Final Synthesis

## Initial Question

## Question Evolution

## Research Path

## Knowledge Graph Summary

## Core Claims

| Claim | Evidence | Confidence | Implication |
|---|---|---|---|

## Contradictions And Unknowns

## Answer

## Next Actions
```

## Mode-Specific Additions

### Learning

Add:

- Core terminology.
- Threshold concepts.
- Competency questions.
- Recommended learning path.
- Self-test prompts.

Converge when the user can explain the root problem, compare mainstream approaches, answer 10-20 competency questions, and place new material onto the existing map.

### Research / Engineering

Add:

- Falsifiable hypotheses.
- Design space.
- Minimum validation experiment.
- Failure modes.
- Evaluation metrics.
- Constraints matrix.

Converge when key hypotheses are testable, the design has measurable criteria, major risks have mitigations or alternatives, and the next step can become an experiment, prototype, or engineering plan.

### Consulting / Decision

Add:

- Decision statement.
- Evaluation criteria.
- Scenario analysis.
- Sensitivity analysis.
- Reversal signals.
- Counterargument.

Converge when the output can recommend an action, name the assumptions behind it, define signals that would change the recommendation, and convert uncertainty into monitoring or small tests.
