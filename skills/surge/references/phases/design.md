# Phase: Design (Director-Orchestrated)

## Dispatch Model

Director-orchestrated (NOT single-agent). The Director is active throughout Steps 1–7, performing:
- Solution generation (or delegating to design subagent)
- User checkpoints (4 interactive gates)
- Expert dispatch and synthesis
- Detailed design production

Steps 8–10 are deterministic post-processing by the Director.

## Trigger

Invoked after the research phase completes (or after analyze phase, if research is skipped).

## Input Contract

The Director will provide or have access to the following:

- **Required**: `context.md` (PRD + Background knowledge)
- **Required**: `iterations/iter_{NN}_analyze.md` (Requirements analysis)
- **Optional**: `iterations/iter_{NN}_research.md` (Research conclusions summary, if any)
- **Optional**: `iterations/iter_{NN}_research/` (Raw research materials directory — consult individual files when the summary lacks detail for a specific technical question)
- **Optional**: Previous round's `iterations/iter_{NN-1}_design.md` + Failure reason (Level 2 rollback)
- **Optional**: `deliverables.md` (Project deliverable metadata)
- **Required for lightweight iteration**: QA optimization directives from `state.md`

## Process

### Step 1: Solution Conception

Generate 2–3 feasible solutions by synthesizing the requirements analysis and research conclusions.

**CRITICAL**: Treat "Non-Obvious Constraints & Domain-Specific Invalidations" passed from Analyze as **top-priority architectural constraints**. Failing to respect these is the most common cause of design rejection.

The Director may delegate this step to a design subagent if the domain warrants specialized reasoning.

Prepare **summaries only** (not full designs) for each candidate:
- High-level architecture sketch
- Key technology choices
- Primary tradeoffs and risks

If technical constraints are extremely strong and only one solution is feasible, explain the reason and proceed with a single candidate.

### Step 2: Solution Overview [Checkpoint 1]

Present candidate summaries to the user along with a **comparison matrix**:

| Dimension | Solution A | Solution B | Solution C |
|-----------|-----------|-----------|-----------|
| Implementation Complexity | Low/Med/High | ... | ... |
| Technical Risk | Low/Med/High | ... | ... |
| Maintainability | Low/Med/High | ... | ... |
| Alignment with Requirements | Low/Med/High | ... | ... |

> **Patent tasks**: Add extra dimensions — "Patent Describability / Interpretability" and "Degree of Difference from Prior Art" as high-weight evaluation columns.

**User options**:
- **A) Continue** — proceed with all candidates to expert review
- **B) Adjust** — modify a specific solution
- **C) Add constraints** — introduce new requirements or constraints
- **D) Drop/Add** — remove a candidate or propose a new one

**State update**: `design_checkpoint` ← `"candidates_shown"`

### Step 3: Expert Panel Assembly [Checkpoint 2]

Auto-recommend **3–5 expert reviewers** from `references/expert-review.md` based on the project domain, plus **1 universal reviewer** determined by `deliverable_type`.

Present the recommended panel to the user for confirmation.

**User options**: Confirm, add experts, or remove experts.

**Constraints**:
- Minimum 3, maximum 5 experts (hard cap at 5)
- If auto-recommendation yields fewer than 3, ask the user to supplement

**State update**: `expert_roles` ← `[list of confirmed roles]`, `design_checkpoint` ← `"experts_confirmed"`

### Step 4: Parallel Expert Review

Dispatch each confirmed expert as a **subagent** using the review template from `references/expert-review.md`.

For each expert subagent, inject:
- Role definition (from expert-review.md)
- Full project context (context.md, analyze, research)
- Candidate solution summaries from Step 2

Run all expert reviews **in parallel** (up to `parallel_agent_limit`).

**Output**: `iterations/iter_{NN}_expert_review_{role_slug}.md` per expert.

**Error handling**:
- If an expert subagent fails: retry once
- If retry also fails: omit that expert's review and continue
- **Minimum 2 expert reviews required** to proceed; if fewer succeed, [ESCALATE]

### Step 5: Review Synthesis [Checkpoint 3]

The Director consolidates all expert reviews into a single synthesis document.

**Output**: `iterations/iter_{NN}_expert_synthesis.md`

**Sections**:
- **Rating Matrix**: Expert × Solution scores
- **Consensus Points**: Where experts agree
- **Divergence Points**: Where experts disagree, with reasoning
- **Vetoes**: Any solution explicitly vetoed by an expert, with justification
- **Design Constraints Extracted**: Concrete constraints derived from reviews

**Veto handling**:
- Vetoed solutions are still shown but clearly marked as `[VETOED by {role}]`
- If ALL solutions are vetoed → force option D (none viable)
- User may override a veto with explicit acknowledgment

**User options**:
- **A) Select + Accept** — pick a solution and accept expert feedback as-is
- **B) Select + Adjust** — pick a solution but request specific modifications
- **C) Deeper analysis** — request additional expert review on specific concerns
- **D) None work** — reject all candidates, return to Step 1

**State update**: `design_checkpoint` ← `"review_done"`, `expert_review_summary` ← `path to synthesis`

### Step 6: Detailed Design

Produce detailed design for the **selected solution**, incorporating all accepted expert constraints.

The Director may delegate this to a design subagent for complex domains.

**Output sections** (included in `iter_{NN}_design.md`):
- **Selected Solution & Reasons**: Which solution was chosen and why
- **Detailed Design**:
  - Module division (responsibilities, inputs/outputs, dependencies)
  - Key interface definitions
  - Data structures with field-level detail
  - For any logic involving thresholds, date ranges, or numeric windows: specify exact boundary semantics using **interval notation** (e.g., `(today, today+3]`)

### Step 7: Design Confirmation [Checkpoint 4]

Present the full design summary to the user. Highlight any points where the design **diverges** from expert recommendations (with rationale).

**User options**:
- **A) Approve** — design is finalized
- **B) Request changes** — specify modifications, loop back to Step 6

**State update**: `design_checkpoint` ← `"design_confirmed"`

> **NOTE**: This checkpoint serves as the process summary. There is no separate post-phase summary step.

### Step 8: Parallelizable Module Identification

Analyze the approved design and identify modules that can be implemented in parallel.

Generate **parallel task packages** in JSON format:

```json
[
  {
    "module": "Module Name",
    "agent_role": "Professional role required (e.g., Documentation Specialist, Script Dev Engineer)",
    "dependencies": [],
    "interface": "Input: [Description], Output: [Description]",
    "context_files": ["context.md", "iter_{NN}_design.md"],
    "output_files": ["src/module_a.py", "src/module_a_test.py"],
    "estimated_output_size": "small | medium | large | xlarge",
    "split_plan": "(Required only for large/xlarge) Description of splitting plan",
    "test_expectations": "Description of what tests this package should produce"
  }
]
```

If all modules are strictly serial, state so explicitly.

> **`output_files` Note**: List actual file paths (relative to `project_root` in `deliverables.md`). If the deliverable is a document (`deliverable_type` is `document`), this field can be omitted.

### Step 9: Content Volume Estimation

For each parallel task package, evaluate `estimated_output_size`:
- **small**: < 200 lines
- **medium**: 200–500 lines
- **large**: 500–1500 lines
- **xlarge**: > 1500 lines

For tasks rated `large` or `xlarge`, **pre-plan a splitting strategy**:
- Split by module, chapter, or functional domain
- Use an index file + split files structure
- Document the split plan in the task package's `split_plan` field

### Step 10: Shared Context Generation

If parallel task packages exist, generate a `shared_context` block:

```json
{
  "shared_context": {
    "terminology": {
      "Abbreviation": "Full Name / Definition"
    },
    "data_structures": {
      "StructureName": {
        "fields": ["field1: type — description", "field2: type — description"],
        "canonical_source": "iter_{NN}_design.md §X.Y"
      }
    },
    "utility_functions": {
      "functionName": {
        "signature": "functionName(param: Type): ReturnType",
        "source_module": "src/utils/example.ts",
        "description": "Brief description of what it does"
      }
    }
  }
}
```

This ensures all parallel agents share identical definitions and prevents duplicate implementations or API mismatches.

## Lightweight Iteration Variant

When re-entering design during a lightweight QA iteration:

- **Skip** Checkpoints 1 and 2 (solution overview + expert assembly)
- **Reuse** `expert_roles` from `state.md` (previously confirmed panel)
- Experts receive only the **diff/delta** plus QA optimization directives (not full context)
- Director picks **relevant experts only** based on QA failure flags (not all)
- **Keep** Checkpoints 3 and 4 (review synthesis + design confirmation)

## Level 2 Rollback Variant

When triggered by a Level 2 rollback:

- Write `[REDESIGN: {reason}]` at the beginning of the design document
- **Reuse** the previous expert panel (user may change at Checkpoint 2)
- Expert review **focuses on the failure mode** — what went wrong and how to avoid it
- All 4 checkpoints remain active
- Previous design is provided as anti-pattern reference

## Error Handling

- **Level 2 rollback** (design cannot meet requirements): Write `[REDESIGN: {Failure Reason}]` at the beginning of the document, focus on improving the failed parts
- **Unsolvable contradictions**: Mark `[ESCALATE: {Issue Description}]`, the Director will escalate to Level 3 handling
- **Expert subagent failure**: See Step 4 error handling (retry once → omit → minimum 2 required)

## Output Contract

- **Design document**: `{surge_root}/tasks/{task_id}/iterations/iter_{NN}_design.md`
- **Expert reviews**: `{surge_root}/tasks/{task_id}/iterations/iter_{NN}_expert_review_{role_slug}.md` (one per expert)
- **Expert synthesis**: `{surge_root}/tasks/{task_id}/iterations/iter_{NN}_expert_synthesis.md`
- **memory_draft**: Append to `{surge_root}/tasks/{task_id}/memory_draft.md`
  - Format: `[{timestamp}] [design] {content}`
  - Record rejected solution rationale; mark candidate SKILL if reusable patterns found

## Tools Allowed

Read, Write, Edit, Bash, Glob, Grep, Agent, and all MCP tools
