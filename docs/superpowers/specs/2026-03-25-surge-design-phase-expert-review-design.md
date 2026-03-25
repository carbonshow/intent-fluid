# Surge Design Phase: Expert Review Committee

**Date**: 2026-03-25
**Status**: Draft
**Scope**: Enhance surge design phase with multi-expert review and user interaction checkpoints

## Problem Statement

The current surge design phase operates as a black box: it generates 2-3 solutions, evaluates them internally, selects one, and proceeds to detailed design — all without user visibility or multi-perspective scrutiny. This leads to:

1. **Insufficient solution comparison** — evaluation is single-perspective (Director only)
2. **Missing domain expertise** — no specialized review from relevant disciplines (security, performance, UX, etc.)
3. **User exclusion** — the design process is opaque; users cannot influence direction until implementation

## Design Goals

- Make the design process transparent with structured user checkpoints
- Introduce multi-expert review via parallel subagents for deeper analysis
- Let users control which expert perspectives are applied
- Integrate cleanly with existing surge iteration/rollback mechanics
- Keep startup flow unchanged (out of scope)

## Redesigned Design Phase Flow

The current 7-step linear flow becomes a 10-step flow with 4 user checkpoints:

```
Step 1: Solution Conception (unchanged)
    └─ Read analyze + research → generate 2-3 candidate solutions

Step 2: Solution Overview Display [Checkpoint 1] 🆕
    └─ Present solution summaries + preliminary comparison matrix to user
    └─ User options: continue / adjust solutions / add constraints

Step 3: Expert Panel Assembly [Checkpoint 2] 🆕
    └─ Auto-recommend 3-5 expert roles based on PRD type
    └─ User confirms / adds / removes experts

Step 4: Parallel Expert Review 🆕
    └─ Each expert runs as independent subagent
    └─ Produces structured review per solution

Step 5: Review Synthesis Report [Checkpoint 3] 🆕
    └─ Director merges all expert opinions into consolidated report
    └─ User selects solution based on multi-angle analysis

Step 6: Detailed Design (enhanced)
    └─ Incorporates expert-flagged risks as design constraints
    └─ Produces module breakdown, interfaces, data structures

Step 7: Design Confirmation [Checkpoint 4] 🆕
    └─ Present complete design document summary to user
    └─ User approves or requests modifications

Step 8: Parallelizable Module Identification (unchanged)
Step 9: Content Volume Estimation (unchanged)
Step 10: Shared Context Generation (unchanged)
```

### Checkpoint Summary

| Checkpoint | When | User Sees | User Actions |
|---|---|---|---|
| 1 — Solution Overview | After solution generation | 2-3 solutions with high-level comparison | Continue / Adjust / Add constraints |
| 2 — Expert Panel | Before expert review | Recommended expert roles | Confirm / Add / Remove experts |
| 3 — Review Report | After expert review | Consolidated multi-angle analysis | Select solution / Request deeper analysis / Reject all |
| 4 — Design Confirmation | After detailed design | Full design document summary | Approve / Request changes |

## Expert Panel Mechanism

### Expert Role Library

Experts are recommended based on signals detected in the PRD and analyze output:

| Project Signal | Recommended Experts |
|---|---|
| API / backend / database | Backend Architect, DBA, Security Expert |
| Frontend / UI / user interaction | UX Designer, Frontend Architect, Accessibility Expert |
| Performance / high concurrency / big data | Performance Engineer, Distributed Systems Expert |
| AI / ML | ML Engineer, Data Scientist |
| Infrastructure / deployment | DevOps Engineer, SRE |

**Universal expert by deliverable type:**

| `deliverable_type` | Universal Expert |
|---|---|
| `code` | Code Quality Reviewer |
| `document` | Logical Consistency Reviewer (argument chains, data citations, structural completeness) |
| `mixed` | Integration Consistency Reviewer (document-code alignment) |
| Cannot determine | **Ask user** — prompt: "What general review perspective would be most valuable?" |

**Constraints:**
- Recommend 3-5 experts per task
- Hard cap at 5 experts (prevent review overhead)
- If Director cannot identify 3+ appropriate experts from PRD, **must ask user** for guidance

### Expert Subagent Input/Output Contract

**Input (uniform review package):**
```yaml
context: context.md                    # PRD
analysis: iter_{NN}_analyze.md         # Requirements analysis
research: iter_{NN}_research.md        # If available
candidates:                            # 2-3 solution summaries
  - name: "Solution A"
    summary: "..."
  - name: "Solution B"
    summary: "..."
expert_role:                           # Role definition
  title: "Security Expert"
  focus_areas:
    - "Authentication & authorization"
    - "Data protection"
    - "Attack surface analysis"
  review_lens: "Evaluate each solution from a security perspective"
```

**Output (structured review):**
```yaml
expert: "Security Expert"
solution_ratings:
  - solution: "Solution A"
    score: 4                           # 1-5 scale
    strengths: ["..."]
    risks: ["..."]
  - solution: "Solution B"
    score: 2
    strengths: ["..."]
    risks: ["..."]
recommended_solution: "Solution A"
recommendation_reason: "..."
design_constraints:                    # Must-include items for detailed design
  - "All API endpoints must implement rate limiting"
  - "User data must be encrypted at rest"
veto_items: []                         # [VETO: reason] for critical blockers
```

### Review Synthesis Report Format

Director consolidates all expert outputs into:

```markdown
## Expert Review Synthesis Report

### Rating Matrix
| Dimension | Solution A | Solution B | Solution C |
|-----------|-----------|-----------|-----------|
| Backend Architect | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Security Expert | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| Performance Engineer | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ |
| Consensus Recommendation | 2/3 | 1/3 | 0/3 |

### Consensus Points
- [Design principles all experts agree on]

### Divergence Points
- [Where experts disagree, with each expert's reasoning]

### Veto Items
- [Any VETO-flagged issues — these block the vetoed solution]

### Design Constraints to Incorporate
- [Aggregated must-include items from all experts]
```

### User Decision Options at Checkpoint 3

After viewing the synthesis report:
- **A)** Select Solution X, accept all expert recommendations
- **B)** Select Solution X, but adjust specific recommendations
- **C)** Need more information — request deeper analysis from specific expert
- **D)** None of these work — propose new direction or constraints

## Integration with Existing Surge Architecture

### File Changes

| File | Change Type | Description |
|---|---|---|
| `references/phases/design.md` | **Rewrite** | Core redesign: 10-step flow with expert review and 4 checkpoints |
| `references/expert-review.md` | **New** | Expert role library + subagent prompt template + report format |
| `SKILL.md` | **Modify** | Update design phase description, add expert review to gotchas |
| `assets/rules.md` | **Modify** | Add expert review NEVER/ALWAYS/PREFER rules |
| `references/state-schema.md` | **Modify** | Add `expert_roles`, `design_checkpoint`, `expert_review_summary` fields |

### New state.md Fields

```yaml
expert_roles: []                  # Current task's expert role list, e.g. ["Backend Architect", "Security Expert"]
design_checkpoint: null           # "candidates_shown" | "experts_confirmed" | "review_done" | "design_confirmed"
expert_review_summary: null       # Path to latest review synthesis report
```

### New Rules (rules.md)

**NEVER:**
- NEVER skip the solution overview display (Checkpoint 1), even with only one solution
- NEVER start expert review before user confirms the expert panel
- NEVER let expert subagents access state.md
- NEVER default to "Code Quality Reviewer" for document-type deliverables

**ALWAYS:**
- ALWAYS flag divergence points and veto items in the review synthesis report
- ALWAYS incorporate expert-flagged risk constraints into detailed design
- ALWAYS ask user when unable to auto-recommend 3+ expert roles
- ALWAYS select universal expert based on `deliverable_type`, not project type

**PREFER:**
- PREFER running expert review subagents in parallel (not serial)
- PREFER reusing confirmed expert panel on Level 2 rollback (unless requirements changed)
- PREFER streamlined review (only relevant experts review changed parts) during lightweight iterations

### Iteration Loop Integration

| Scenario | Expert Review Behavior |
|---|---|
| **First iteration** | Full 10-step flow with complete expert review |
| **Level 1 rollback** (execution issues) | Skip design phase entirely — no re-review |
| **Level 2 rollback** (design issues) | Re-enter design phase; **reuse confirmed expert panel** (user can opt to change); experts only review redesigned parts |
| **Lightweight iteration** | Skip analyze/research; streamlined review — only relevant experts evaluate changes |

## Out of Scope

- Startup flow optimization (explicitly deferred)
- Changes to analyze, research, implement, QA, or retro phases
- Visual companion / browser-based mockups
- Changes to parallel implementation mechanics (Step 8-10 unchanged)
