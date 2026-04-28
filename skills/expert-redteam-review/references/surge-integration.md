# Optional surge Integration

This skill is independent and general-purpose. surge must not depend on it. If the skill is unavailable, surge should continue with its native expert review, design, QA, and convergence mechanisms.

## Relationship

| Capability | surge Native Expert Review | expert-redteam-review |
|---|---|---|
| Primary goal | Delivery-oriented iterative completion. | Decision-quality review for complex choices. |
| Review focus | Candidate scoring and design constraints. | Assumption attack, rebuttal, arbitration, validation. |
| Scope | surge design and QA phases. | Any high-impact decision point. |
| Output | Synthesis and constraints for iteration. | Decision package and minimum validation action. |
| Dependency | Internal to surge. | Optional external enhancement. |

## Optional Use Criteria

The preferred placement is after surge has produced candidate options or after QA exposes a design-rooted risk. Do not run this skill before surge has a concrete decision point to review.

surge may use this skill only when one or more are true:
- The user explicitly asks for an expert panel, red-team challenge, rebuttal, or judge.
- The design phase has multiple high-risk candidate solutions.
- Native expert reviews disagree severely and a decision must be arbitrated.
- QA finds P0/P1 issues caused by design-level assumptions rather than implementation defects.
- The task has one-way-door characteristics: production release, data migration, security/privacy/compliance exposure, broad refactor, external publication, or financial exposure.

Do not use it for:
- Normal delivery iteration.
- Low-risk changes.
- Work that has already converged.
- Cases where token budget is tight and the risk profile is low.
- Tasks where implementation is the only remaining step.

## Non-Dependency Rule

surge documentation may say:

```markdown
If an `expert-redteam-review` skill is available and the task meets high-risk decision criteria, the Director may use it as an optional review checkpoint. If unavailable, continue with surge's native expert-review flow.
```

This skill must not require surge to change:
- state schema
- trace schema
- scripts
- task directory layout
- convergence rules

## Minimum Input Package from surge

Pass summaries and paths, not entire artifacts.

```markdown
## Surge Context Summary
- task_id:
- current_phase:
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
- State the exact decision point.
- Pass candidate option summaries, not full designs.
- Pass file paths for source artifacts; read details only when needed.
- Do not ask the red team to attack the whole project if only one decision is under review.
- Keep the decision brief under 1-2 pages when possible.

## Output Back to surge

The decision package may include a surge-specific section:

```markdown
### Suggested surge Integration
- design_constraints:
- qa_acceptance_additions:
- implementation_warnings:
- rollback_or_checkpoint_notes:
- optimization_directives:
```

surge may choose to incorporate these into:
- `iter_{NN}_design.md` as design constraints.
- `acceptance.md` as acceptance additions.
- `state.md` as optimization directives or risk notes.
- `context.md` as user-confirmed clarifications.
- `iter_{NN}_qa.md` as risk interpretation.

These are suggestions. The surge Director remains responsible for state updates and convergence decisions.

## Veto and Severity Mapping

| expert-redteam-review | Suggested surge Handling |
|---|---|
| P0 | Treat like a veto. Return to design or ask for explicit user override. |
| P1 | Add to design constraints or acceptance criteria before implementation continues. |
| P2 | Record as residual risk and monitor during QA. |
| P3 | Add to optimization backlog if useful. |

A P0 is not a permanent ban. The user can override it, but must explicitly acknowledge the risk.

## Token Budget

Use three layers:
1. **Decision brief**: required, compact summary.
2. **Referenced files**: paths only, read on demand.
3. **Full artifacts**: avoid unless needed for a disputed or high-impact claim.

Experts receive only the context relevant to their role. Red team receives the synthesis rather than every raw expert answer. Judge receives context package, synthesis, red-team findings, and rebuttal summary.

## Recommended surge Patch Scope

If the repository wants surge to mention this skill, make only a small optional note in surge's expert review or design references. Do not make startup, state, scripts, or QA require this skill.
