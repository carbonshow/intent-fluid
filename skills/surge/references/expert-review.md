# Expert Review Reference

This document defines the expert role library, parameterized prompt template for expert subagents, and the synthesis report format used during the design phase's expert review steps (Steps 3-5).

## Expert Role Library

### Domain-Specific Experts

Experts are recommended based on signals detected in the PRD and analyze output:

| Project Signal | Recommended Experts |
|---|---|
| API / backend / database | Backend Architect, DBA, Security Expert |
| Frontend / UI / user interaction | UX Designer, Frontend Architect, Accessibility Expert |
| Performance / high concurrency / big data | Performance Engineer, Distributed Systems Expert |
| AI / ML | ML Engineer, Data Scientist |
| Infrastructure / deployment | DevOps Engineer, SRE |

### Universal Expert (by deliverable type)

| `deliverable_type` | Universal Expert |
|---|---|
| `code` | Code Quality Reviewer |
| `document` | Logical Consistency Reviewer (argument chains, data citations, structural completeness) |
| `mixed` | Integration Consistency Reviewer (document-code alignment) |

`deliverable_type` is guaranteed to be set before the design phase (startup Step 4). For `mixed` deliverables where the balance is unclear, the Director should ask the user which universal review perspective is most valuable.

### Extensibility

The role library is a starting set. The Director MAY define ad-hoc expert roles when project signals don't match library entries. The retro phase SHOULD capture effective ad-hoc roles as candidates for library inclusion.

### Constraints

- Recommend 3-5 experts per task
- Hard cap at 5 experts (both quality control and token budget)
- If Director cannot identify 3+ appropriate experts from PRD, **must ask user** for guidance
- Solution **summaries** (not full detailed solutions) are passed to experts to control input size

## Expert Subagent Prompt Template

The Director uses this template for each expert subagent. The `{EXPERT_ROLE}` section is parameterized — the Director injects the expert's title, focus areas, and review lens.

Expert subagents do NOT follow the standard Phase Invocation Flow. They do NOT receive topology roles. The standard "Process Output Requirement" does not apply; expert output follows the structured contract below.

---

**Template (injected into Agent tool prompt):**

```
You are an expert reviewer for a system design evaluation.

## Your Role

{EXPERT_ROLE_TITLE}

## Focus Areas

{EXPERT_FOCUS_AREAS}

## Review Lens

{EXPERT_REVIEW_LENS}

## Context

### PRD (Requirements)
{CONTEXT_MD_CONTENT}

### Requirements Analysis
{ANALYZE_MD_CONTENT}

### Research Conclusions (if available)
{RESEARCH_MD_CONTENT}

## Candidate Solutions

{CANDIDATE_SOLUTIONS_SUMMARIES}

## Your Task

Evaluate each candidate solution from your expert perspective. For each solution, provide:
1. A score from 1-5 (1=poor, 5=excellent from your perspective)
2. Strengths relevant to your domain
3. Risks and concerns from your domain

Then recommend which solution is best from your perspective, and list any design constraints that MUST be incorporated into the detailed design.

If any solution has a critical flaw that makes it unacceptable from your perspective, mark it with [VETO: reason].

## Output Format

Write your review as a structured document with the following sections:

### Expert Identity
- Expert: {EXPERT_ROLE_TITLE}

### Solution Ratings

#### {Solution A Name}
- Score: X/5
- Strengths: [list]
- Risks: [list]

#### {Solution B Name}
- Score: X/5
- Strengths: [list]
- Risks: [list]

### Recommendation
- Recommended Solution: {name}
- Reason: {explanation}

### Design Constraints
- [Must-include items for detailed design from your perspective]

### Veto Items
- [VETO: reason] (or "None")
```

---

## Synthesis Report Format

The Director consolidates all expert review outputs into a single synthesis report.

### File Naming

- Individual expert reviews: `iterations/iter_{NN}_expert_review_{role_slug}.md`
- Synthesis report: `iterations/iter_{NN}_expert_synthesis.md`
- Role slug: lowercase, spaces replaced with underscores (e.g., "Backend Architect" → `backend_architect`)

### Report Template

```markdown
## Expert Review Synthesis Report

### Rating Matrix
| Expert | Solution A | Solution B | Solution C |
|--------|-----------|-----------|-----------|
| {Expert 1} | X/5 | X/5 | X/5 |
| {Expert 2} | X/5 | X/5 | X/5 |
| Consensus Recommendation | N/M recommend | N/M recommend | N/M recommend |

### Consensus Points
- [Design principles all experts agree on]

### Divergence Points
- [Where experts disagree, with each expert's reasoning]

### Veto Items
- [Any VETO-flagged issues — solution name + expert + reason]
- [Or "None"]

### Design Constraints to Incorporate
- [Aggregated must-include items from all experts, deduplicated]
```

### User Decision Options (Checkpoint 3)

After viewing the synthesis report, the Director presents:
- **A)** Select Solution X, accept all expert recommendations
- **B)** Select Solution X, but adjust specific recommendations
- **C)** Need more information — request deeper analysis from specific expert
- **D)** None of these work — propose new direction or constraints

### Veto Semantics

- A single veto removes that solution from the Director's recommendation, but it is still shown in the synthesis report (marked as vetoed)
- If ALL solutions are vetoed, the Director MUST inform the user and default to option D
- **Veto is advisory** — the user CAN select a vetoed solution if they explicitly acknowledge the flagged risks
- Multiple experts may veto the same solution for different reasons; all reasons are listed

## Optional Adversarial Decision Review

If an `expert-redteam-review` skill is available and the task meets high-risk decision criteria, the Director MAY use it as an optional checkpoint after surge has concrete candidate options or after QA exposes a design-rooted risk. If unavailable, continue with surge's native expert-review flow.

Use this optional checkpoint only when one or more are true:
- The user explicitly asks for an expert panel, red-team challenge, rebuttal, judge, or adversarial arbitration.
- Candidate solutions are high-risk and differ on architecture, data, security, compliance, production rollout, or irreversible direction.
- Native expert reviews disagree severely and the Director needs arbitration rather than another scoring pass.
- QA finds P0/P1 issues caused by design-level assumptions rather than implementation defects.
- The task has one-way-door characteristics: production release, data migration, security/privacy/compliance exposure, broad refactor, external publication, or financial exposure.

Do not use it for routine delivery iteration, low-risk changes, work that has already converged, token-constrained low-risk cases, or tasks where implementation is the only remaining step.

### Non-Dependency Rules

- `expert-redteam-review` is an optional enhancement, not a surge dependency.
- Do not change state schema, trace schema, scripts, task directory layout, or convergence rules to require it.
- If the skill is missing, disabled, or unsuitable, continue with this native expert-review process.
- The surge Director remains responsible for state updates, checkpoint decisions, and convergence.

### Minimum Input Package

Pass summaries and paths, not full artifacts:

```markdown
## Surge Context Summary
- task_id:
- current_phase: design / qa / convergence
- iteration:
- deliverable_type:
- decision_point:
- candidate_options:
- current_recommendation:
- known_constraints:
- acceptance_criteria:
- open_risks:
- relevant_file_paths:
```

Rules:
- State the exact decision point under review.
- Pass candidate option summaries, not full designs.
- Pass file paths for source artifacts so details can be read on demand.
- Do not ask the red team to attack the whole project if only one decision is under review.

### Output Mapping Back to surge

If the optional checkpoint returns a decision package, map it back as suggestions:

| expert-redteam-review Output | Suggested surge Handling |
|---|---|
| P0 blocking issue | Treat like a veto: return to design or ask for explicit user override. |
| P1 must-fix issue | Add to design constraints or acceptance criteria before implementation continues. |
| P2 residual risk | Record as residual risk and monitor during QA. |
| P3 improvement | Add to optimization backlog only if useful. |
| Minimum validation action | Add to acceptance criteria, QA plan, or checkpoint notes. |

A P0 is not a permanent ban. The user can override it, but must explicitly acknowledge the flagged risk.

### Error Handling

- If an expert subagent fails (timeout, malformed output), the Director retries once
- If retry fails, that expert's review is omitted from the synthesis report with a note to the user
- Minimum 2 expert reviews required to proceed; if fewer than 2 succeed, ask user whether to re-run or proceed
