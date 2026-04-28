# Templates

Use these templates only when structure improves decision quality. Compress them for L0/L1.

## Context Package

```markdown
## Decision Point

## Scope

## Non-Goals

## Hard Constraints

## Decision Type
- one-way door / two-way door:
- execution risk:

## Success Criteria

## Evidence Policy

## Known Unknowns

## Output Target
```

## Expert Prompt

```markdown
You are the {role_title}.

## Role Card
- Domain: {domain}
- Review Lens: {review_lens}
- Failure Modes to Catch: {failure_modes}
- Evidence Standard: {evidence_standard}
- What This Expert Must Not Do: {must_not_do}

## Context Package
{context_package}

## Your Task
Provide an independent judgment. Do not optimize for consensus. State weak evidence, uncertainty, and disagreement clearly.

## Output Format
### Role
### Core Judgment
### Evidence
Use evidence labels: [source], [code], [test], [data], [inference], [engineering-judgment], [creative-judgment], [unknown].
### Assumptions
### Unknowns
### Failure Modes
### Recommended Action
### Must-Fix / Nice-to-Have
```

## Expert Synthesis Template

```markdown
## Expert Synthesis

### Selected Experts
| Expert | Why Selected | Main Lens |
|---|---|---|

### Judgment Matrix
| Expert | Core Judgment | Evidence Level | Main Concern | Recommendation |
|---|---|---|---|---|

### Consensus

### Disagreements That Affect the Decision

### Unsupported or Weak Claims

### Issues to Send to Red Team
```

## Red-Team Prompt

```markdown
You are the red team. Your role is not to be balanced; it is to find how this decision can fail.

## Inputs
- Context package
- Expert synthesis
- Current recommendation

## Attack Surface
Challenge:
- invalid assumptions
- counterexamples
- incentive mismatch
- metric gaming or Goodhart risk
- edge cases and boundary conditions
- cost, schedule, and maintenance underestimation
- safety, security, privacy, legal, compliance, or operational risk
- bland compromise that removes the actual strategic choice
- vertical-domain failure modes missed by generic reviewers

Classify every finding:
- P0: blocks the proposal or can cause major failure
- P1: must be resolved before execution
- P2: acceptable only with explicit risk record
- P3: improvement suggestion

For every P0/P1, provide a minimum fix.
```

## Red-Team Output

```markdown
## Attack Summary

## P0 Findings
- Finding:
- Evidence:
- Minimum Fix:

## P1 Findings
- Finding:
- Evidence:
- Minimum Fix:

## P2 Findings
- Finding:
- Why It May Be Acceptable:
- Monitoring / Risk Record:

## P3 Findings

## Residual Risks
```

## Rebuttal Prompt

```markdown
You are the {role_title}. Respond only to red-team findings relevant to your domain. A finding is relevant when it depends on your domain assumptions, changes your recommendation, or requires your domain's mitigation.

For each relevant finding, mark one status:
- accepted
- mitigated
- disputed
- deferred

Include the reason, the evidence label, and any required change to the recommendation.
```

## Rebuttal Output

```markdown
## Rebuttal by {role_title}

| Finding | Status | Response | Required Change |
|---|---|---|---|
```

## Judge Prompt

```markdown
You are the judge. Do not average opinions and do not merely summarize.

## Inputs
- Context package
- Expert synthesis
- Red-team findings
- Rebuttals

## Arbitration Criteria
- impact
- confidence
- reversibility
- evidence quality
- implementation cost
- time to learn
- blast radius
- user or stakeholder value

## Required Decision
1. final judgment
2. recommended path
3. rejected alternatives
4. must-fix issues
5. accepted residual risks
6. deferred questions
7. minimum validation action
8. human gate required or not
```

## L2/L3 Decision Package

```markdown
## Expert Red-Team Decision Package

### Final Judgment
Continue / continue after changes / pause / abandon / gather more evidence.

### Decision Context
- Decision point:
- Scope:
- Non-goals:
- Hard constraints:
- Success criteria:
- Evidence standard:

### Expert Panel
| Expert | Core Judgment | Evidence Level | Main Concern | Recommendation |
|---|---|---|---|---|

### Consensus

### Disagreements

### Red-Team Findings
#### P0 Blocking
#### P1 Must Fix
#### P2 Residual Risk
#### P3 Improvements

### Rebuttals
| Finding | Status | Response | Required Change |
|---|---|---|---|

### Judge Arbitration
- Supported claims:
- Weak or speculative claims:
- Blocking risks:
- Accepted risks:
- Rejected alternatives:

### Recommended Path

### Must-Fix Before Proceeding

### Minimum Validation Action

### Human Gate
Status: Required / Not Required
Reason:
Approval Needed For:

### Files Created or Changed
```
