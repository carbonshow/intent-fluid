# Surge Expert Review Committee Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enhance the surge design phase with multi-expert parallel review and 4 user interaction checkpoints, changing dispatch from single-agent to Director-orchestrated.

**Architecture:** The design phase template (`references/phases/design.md`) is rewritten as a 10-step Director-orchestrated flow. A new reference file (`references/expert-review.md`) defines the expert role library, parameterized prompt template, and synthesis report format. Supporting files (SKILL.md, rules.md, state-schema.md, output-structure.md, init.sh) are updated to integrate the new fields, rules, and file naming conventions.

**Tech Stack:** Markdown prompt templates, YAML state schema, Bash shell scripts

**Note for executing agents:** Some tasks contain complete file content with nested code fences. When the plan shows "Write file X with the following content," extract the complete intended content from context — do not rely on code fence boundaries alone. Read the spec for authoritative content if any ambiguity.

**Spec:** `docs/superpowers/specs/2026-03-25-surge-design-phase-expert-review-design.md`

---

### Task 1: Create expert review reference file

This is the foundational new file that defines the expert role library, parameterized prompt template, and report formats. All other changes reference it.

**Files:**
- Create: `skills/surge/references/expert-review.md`

- [ ] **Step 1: Create the expert review reference file**

Write `skills/surge/references/expert-review.md` with the following complete content:

```markdown
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

### Error Handling

- If an expert subagent fails (timeout, malformed output), the Director retries once
- If retry fails, that expert's review is omitted from the synthesis report with a note to the user
- Minimum 2 expert reviews required to proceed; if fewer than 2 succeed, ask user whether to re-run or proceed
```

- [ ] **Step 2: Verify file created correctly**

Run: `wc -l skills/surge/references/expert-review.md && head -3 skills/surge/references/expert-review.md`
Expected: File exists with ~150+ lines, starts with `# Expert Review Reference`

- [ ] **Step 3: Commit**

```bash
git add skills/surge/references/expert-review.md
git commit -m "feat(surge): add expert review reference with role library and prompt template"
```

---

### Task 2: Rewrite design phase template

Replace the current single-agent design template with the 10-step Director-orchestrated flow including expert review integration and 4 user checkpoints.

**Files:**
- Modify: `skills/surge/references/phases/design.md` (full rewrite, lines 1-104)

- [ ] **Step 1: Rewrite design.md with the new 10-step flow**

Replace the entire file content with:

```markdown
# Phase: Design (Director-Orchestrated)

## Dispatch Model

This phase uses **Director-orchestrated** dispatch, NOT single-agent dispatch. The Director remains active throughout Steps 1-7, performing:
- Solution generation (Step 1 — can delegate to a design subagent)
- User interaction at 4 checkpoints (Steps 2, 3, 5, 7)
- Expert subagent dispatch and synthesis (Steps 4-5)
- Detailed design orchestration (Step 6 — can delegate to a design subagent)

Steps 8-10 are performed by the Director or delegated as part of detailed design.

## Trigger

Invoked by the Director Agent after the research phase (or analyze phase, if research is skipped) is completed.

## Input Contract

The Director reads the following files:
- **Required**: `context.md` (PRD + Background knowledge)
- **Required**: `iterations/iter_{NN}_analyze.md` (Requirements analysis)
- **Optional**: `iterations/iter_{NN}_research.md` (Research conclusions, if any)
- **Optional**: Previous round's `iterations/iter_{NN-1}_design.md` + Failure reason (If Level 2 rollback)
- **Optional**: `deliverables.md` (for determining universal expert role)
- **Required for lightweight iteration**: QA optimization directives from `state.md`

## Process

### Step 1: Solution Conception

Synthesize the requirements analysis and research conclusions, conceive 2-3 feasible solutions. If technical constraints are extremely strong and only one solution is feasible, explain the reason and proceed with that single solution.

**CRITICAL**: Treat "Non-Obvious Constraints & Domain-Specific Invalidations" from analyze as top-priority architectural constraints.

The Director may delegate this step to a design subagent (using topology role from `topology.md`), or perform it directly if the scope is manageable.

For each solution, prepare a **summary** (not full detailed design) covering:
- Architecture approach (1-2 sentences)
- Key technology choices
- Core tradeoffs

### Step 2: Solution Overview Display [Checkpoint 1]

**Director presents to user:**
- 2-3 solution summaries with a preliminary comparison matrix:

| Dimension | Solution A | Solution B | Solution C |
|-----------|-----------|-----------|-----------|
| Implementation Complexity | Low/Medium/High | ... | ... |
| Technical Risk | Low/Medium/High | ... | ... |
| Maintainability | Low/Medium/High | ... | ... |
| Alignment with Requirements | Brief note | ... | ... |

- If patent/research task: add "Patent Describability" and "Degree of Difference from Prior Art" dimensions.

**User options:**
- A) Continue to expert review with these candidates
- B) Adjust a specific solution (Director refines and re-presents)
- C) Add constraints that solutions must satisfy
- D) Drop a solution / add a new direction

After user confirms, update `state.md`: `design_checkpoint` ← `"candidates_shown"`.

### Step 3: Expert Panel Assembly [Checkpoint 2]

**Director auto-recommends 3-5 expert roles** based on:
1. Project signals detected in PRD and analyze output (see `references/expert-review.md` for role library)
2. One universal expert based on `deliverable_type` from `deliverables.md`

**Director presents to user:**
```
Recommended Expert Panel (N experts):
1. [Role Title] — Focus: [brief focus description]
2. [Role Title] — Focus: [brief focus description]
3. [Universal Role] — Focus: [brief focus description]

Options:
A) Confirm this panel
B) Add an expert role
C) Remove an expert role
D) Replace an expert role
```

**Constraints:**
- 3-5 experts, hard cap at 5
- If unable to identify 3+ experts, ask user for guidance
- Solution summaries (not full solutions) are passed to experts

After user confirms, update `state.md`:
- `expert_roles` ← confirmed list
- `design_checkpoint` ← `"experts_confirmed"`

### Step 4: Parallel Expert Review

Dispatch each expert as an independent subagent using the parameterized prompt template from `references/expert-review.md`.

**For each expert:**
1. Read `references/expert-review.md` to get the prompt template
2. Inject: expert role definition (title, focus_areas, review_lens)
3. Inject: `context.md`, `iter_{NN}_analyze.md`, `iter_{NN}_research.md` (if any)
4. Inject: solution summaries from Step 1
5. Dispatch via Agent tool

**Run experts in parallel** (up to `parallel_agent_limit`).

Each expert writes output to: `iterations/iter_{NN}_expert_review_{role_slug}.md`
- Role slug: lowercase, spaces → underscores (e.g., "Security Expert" → `security_expert`)

**Error handling:**
- If an expert subagent fails, retry once
- If retry fails, omit that expert's review with a note to the user
- Minimum 2 reviews required; if fewer succeed, ask user whether to re-run or proceed

### Step 5: Review Synthesis Report [Checkpoint 3]

**Director consolidates** all expert outputs into `iterations/iter_{NN}_expert_synthesis.md` using the synthesis report format from `references/expert-review.md`.

Key sections: Rating Matrix, Consensus Points, Divergence Points, Veto Items, Design Constraints to Incorporate.

**Director presents the synthesis report to user** with decision options:
- **A)** Select Solution X, accept all expert recommendations
- **B)** Select Solution X, but adjust specific recommendations
- **C)** Need more information — request deeper analysis from specific expert
- **D)** None of these work — propose new direction or constraints

**Veto handling:**
- Vetoed solutions are shown but marked; removed from Director's recommendation
- If ALL solutions vetoed → default to option D
- User CAN override veto with explicit risk acknowledgment

After user decides, update `state.md`:
- `design_checkpoint` ← `"review_done"`
- `expert_review_summary` ← path to synthesis report

### Step 6: Detailed Design

Perform detailed design for the selected solution, incorporating expert-flagged design constraints.

The Director may delegate to a design subagent (using topology role) with the following inputs:
- Selected solution summary + user's adjustments (if any)
- Aggregated design constraints from expert synthesis
- `context.md`, analyze, research outputs

**Output must include:**
- **Selected Solution & Reasons**: Which solution, why, how expert feedback influenced the choice
- **Detailed Design**: Module division (responsibilities, inputs/outputs, dependencies), key interface definitions, data structures. Use interval notation for boundary semantics (e.g., `(today, today+3]`).

### Step 7: Design Confirmation [Checkpoint 4]

**Director presents to user:**
- Complete design document summary: module list, key interfaces, data structures, expert constraints incorporated
- Highlight any divergences from expert recommendations (if user adjusted)

**User options:**
- A) Approve design, proceed to parallelization planning
- B) Request specific modifications (Director revises Step 6 output)

After user confirms, update `state.md`: `design_checkpoint` ← `"design_confirmed"`.

**Note:** This checkpoint serves as the design phase's process summary. The Director does NOT show a separate post-phase summary — the 4 checkpoints provide more transparency than a single summary.

### Step 8: Parallelizable Module Identification

Determine if there are parallelizable independent modules in the implementation phase; if so, generate parallel task packages in JSON format.

```json
[
  {
    "module": "Module Name",
    "agent_role": "Professional role (e.g., Documentation Specialist)",
    "dependencies": [],
    "interface": "Input: [Description], Output: [Description]",
    "context_files": ["context.md", "iter_{NN}_design.md"],
    "output_files": ["src/module_a.py", "src/module_a_test.py"],
    "estimated_output_size": "small | medium | large | xlarge",
    "split_plan": "(Required only for large/xlarge)",
    "test_expectations": "(Optional) What tests this package should produce"
  }
]
```

> **`output_files` Note**: List actual file paths relative to `project_root` in `deliverables.md`. If deliverable is `document`, this field can be omitted.

### Step 9: Content Volume Estimation

For each parallel task package, evaluate `estimated_output_size`. For `large`/`xlarge` tasks, pre-plan a splitting strategy (split into multiple Parts by module/chapter/functional domain) using an index file + split files structure.

### Step 10: Shared Context Generation

If parallel task packages exist, generate a `shared_context` block containing:
- **Exact field lists** for all core data structures (not just abbreviations), with `canonical_source` for each
- **Shared utility function signatures**: name, parameter types, return type
- Unified terminology glossary

```json
{
  "shared_context": {
    "terminology": { "Abbreviation": "Full Name" },
    "data_structures": {
      "StructureName": {
        "fields": ["field1: type — description"],
        "canonical_source": "iter_{NN}_design.md §X.Y"
      }
    },
    "utility_functions": {
      "functionName": {
        "signature": "functionName(param: Type): ReturnType",
        "source_module": "src/utils/example.ts",
        "description": "Brief description"
      }
    }
  }
}
```

## Lightweight Iteration Variant

When entering design via lightweight iteration (QA Pass-Optimizable, non-functional improvements only):

- **Skip Checkpoint 1** — solutions already selected in prior iteration
- **Skip Checkpoint 2** — reuse previous expert panel from `state.md:expert_roles`
- **Experts receive only** the diff/delta + optimization directives (not full solutions)
- **Director determines relevant experts** based on QA-flagged optimization dimensions
- **Keep Checkpoint 3** (synthesis) and **Checkpoint 4** (design confirmation)

## Level 2 Rollback Variant

When re-entering design after QA Fail with Level 2 deviation:

- Write `[REDESIGN: {Failure Reason}]` at the beginning of the output document
- **Reuse confirmed expert panel** from `state.md:expert_roles` (user can opt to change at Checkpoint 2)
- Experts review only the redesigned parts, focusing on the failure reason
- Full checkpoint flow (all 4 checkpoints active)

## Error Handling

- If Level 2 rollback: analyze failure reason, mark `[REDESIGN: {Failure Reason}]`, focus improvements on failed parts
- If unsolvable contradictions: mark `[ESCALATE: {Issue Description}]`, Director escalates to Level 3
- If expert subagent fails: see Step 4 error handling

## Output Contract

- Design document: `{surge_root}/tasks/{task_id}/iterations/iter_{NN}_design.md`
- Expert reviews: `{surge_root}/tasks/{task_id}/iterations/iter_{NN}_expert_review_{role_slug}.md`
- Synthesis report: `{surge_root}/tasks/{task_id}/iterations/iter_{NN}_expert_synthesis.md`
- memory_draft update: Record rejected solutions, expert insights, reusable patterns. Append to `memory_draft.md` with format: `[{timestamp}] [design] {content}`

## Tools Allowed

Read, Write, Edit, Bash, Glob, Grep, Agent, and all MCP tools
```

- [ ] **Step 2: Verify the rewrite**

Run: `head -5 skills/surge/references/phases/design.md && echo "---" && wc -l skills/surge/references/phases/design.md`
Expected: Starts with `# Phase: Design (Director-Orchestrated)`, ~220+ lines

- [ ] **Step 3: Commit**

```bash
git add skills/surge/references/phases/design.md
git commit -m "feat(surge): rewrite design phase as Director-orchestrated 10-step flow with expert review"
```

---

### Task 3: Update SKILL.md — dispatch model and gotchas

Update the Main Iteration Loop table to reflect the new Director-orchestrated dispatch model for design, add expert review gotchas, and update the Reference File Index.

**Files:**
- Modify: `skills/surge/SKILL.md:63-67` (Main Iteration Loop table, design row)
- Modify: `skills/surge/SKILL.md:16-33` (Gotchas section, add new entries)
- Modify: `skills/surge/SKILL.md:76-78` (Phase Invocation Flow, add exception note)
- Modify: `skills/surge/SKILL.md:96-102` (Process Output table, update design row)
- Modify: `skills/surge/SKILL.md:182-193` (Reference File Index, add new entry)

- [ ] **Step 1: Update Main Iteration Loop table — change design dispatch mode**

In `skills/surge/SKILL.md`, find the design row in the table at line 67:
```
| design | Single agent | `references/phases/design.md` + analyze + research (if any) | — |
```
Replace with:
```
| design | Director-orchestrated | `references/phases/design.md` + analyze + research (if any) + `deliverables.md` | See Expert Review below |
```

- [ ] **Step 2: Add Design Phase Exception note and Expert Review summary section**

After the Phase Invocation Flow section (after line 78, the blockquote about phase templates), add:

```markdown
**Design Phase Exception**: The design phase does NOT follow the standard single-agent dispatch above. Instead, the Director orchestrates a multi-step flow with expert subagent dispatch and 4 user checkpoints. See `references/phases/design.md` for the complete Director-orchestrated flow.

**Expert Review (design phase)**: The design phase includes parallel expert review where 3-5 domain experts (selected from `references/expert-review.md` role library) independently evaluate candidate solutions. The Director assembles the panel (Checkpoint 2), dispatches experts in parallel (Step 4), synthesizes their reviews into a consolidated report (Step 5/Checkpoint 3), then proceeds to detailed design incorporating expert-flagged constraints. See `references/phases/design.md` and `references/expert-review.md` for details.
```

- [ ] **Step 3: Update Process Output table — design row**

In the Process Output table at line 100, find:
```
| design | Selected solution name with a 1-sentence reason, core module list, key design decisions. |
```
Replace with:
```
| design | Checkpoint 4 (Design Confirmation) serves as the process summary. No separate post-phase summary needed — the 4 checkpoints provide transparency throughout the phase. |
```

- [ ] **Step 4: Add expert review gotchas**

After the last gotcha entry (line 33, "Missing Process Output"), add:

```markdown
- **Expert Panel Token Budget**: Each expert subagent receives the full review package (PRD + analyze + solution summaries). With 5 parallel experts, this is 5× the context. Always pass solution **summaries** (not full detailed solutions) to experts. The hard cap of 5 experts is both a quality and resource constraint.
- **Expert Veto Override**: Users can override expert vetoes at Checkpoint 3, but the Director must ensure they explicitly acknowledge the flagged risks. Never silently proceed past a veto.
- **Design Checkpoint Stale State**: `design_checkpoint` in state.md must be reset to `null` when entering the design phase. Stale checkpoint values from a previous iteration can cause the Director to skip steps.
```

- [ ] **Step 5: Add expert-review.md to Reference File Index**

In the Reference File Index table (around line 190), add a new row:
```
| `references/expert-review.md` | Expert role library, subagent prompt template, synthesis report format | Design phase Steps 3-5 |
```

- [ ] **Step 6: Verify changes**

Run: `grep -n "Director-orchestrated" skills/surge/SKILL.md && grep -n "expert-review.md" skills/surge/SKILL.md`
Expected: Both terms appear in the file

- [ ] **Step 7: Commit**

```bash
git add skills/surge/SKILL.md
git commit -m "feat(surge): update SKILL.md for Director-orchestrated design with expert review"
```

---

### Task 4: Update rules.md — add expert review rules

Add NEVER/ALWAYS/PREFER rules for the expert review mechanism.

**Files:**
- Modify: `skills/surge/assets/rules.md:6-13` (NEVER section, append)
- Modify: `skills/surge/assets/rules.md:17-24` (ALWAYS section, append)
- Modify: `skills/surge/assets/rules.md:28-32` (PREFER section, append)

- [ ] **Step 1: Add expert review NEVER rules**

After the last NEVER entry (line 13, about numerical calculations), append:

```markdown
- NEVER skip the solution overview display (Checkpoint 1) in the design phase, even if only one solution exists.
- NEVER start expert review before the user confirms the expert panel at Checkpoint 2.
- NEVER let expert review subagents access `state.md`; they receive only the review package defined in `references/expert-review.md`.
- NEVER default to "Code Quality Reviewer" as the universal expert for document-type deliverables; use "Logical Consistency Reviewer" instead (see `references/expert-review.md`).
```

- [ ] **Step 2: Add expert review ALWAYS rules**

After the last ALWAYS entry (line 24, about boundary semantics), append:

```markdown
- ALWAYS flag divergence points and veto items in the expert review synthesis report; omitting disagreements hides critical design risks.
- ALWAYS incorporate expert-flagged risk constraints into the detailed design (Step 6); expert feedback that isn't acted on wastes the review.
- ALWAYS ask the user when unable to auto-recommend 3+ expert roles from the PRD; don't proceed with fewer than 3 experts without user consent.
- ALWAYS select the universal expert role based on `deliverable_type`, not on project type signals.
```

- [ ] **Step 3: Add expert review PREFER rules**

After the last PREFER entry (line 32, about test_expectations), append:

```markdown
- PREFER running expert review subagents in parallel (not serial) to reduce design phase latency.
- PREFER reusing the confirmed expert panel on Level 2 rollback (unless requirements changed at Level 3); re-confirming unchanged experts wastes user attention.
- PREFER streamlined expert review during lightweight iterations: only dispatch experts relevant to QA-flagged optimization dimensions, skip Checkpoints 1 and 2.
```

- [ ] **Step 4: Verify changes**

Run: `grep -c "NEVER\|ALWAYS\|PREFER" skills/surge/assets/rules.md`
Expected: Count increases (originally ~24 rules, now ~35)

- [ ] **Step 5: Commit**

```bash
git add skills/surge/assets/rules.md
git commit -m "feat(surge): add expert review NEVER/ALWAYS/PREFER rules"
```

---

### Task 5: Update state-schema.md — add new fields

Add `expert_roles`, `design_checkpoint`, and `expert_review_summary` fields with full lifecycle documentation.

**Files:**
- Modify: `skills/surge/references/state-schema.md:10-26` (Complete Schema section, append fields)
- Modify: `skills/surge/references/state-schema.md:31-147` (Field Details section, append new field docs)
- Modify: `skills/surge/references/state-schema.md:153-178` (Field Relationships section, update)

- [ ] **Step 1: Add new fields to Complete Schema**

In the YAML schema block (between lines 10-26), before the closing ` ``` `, append:

```yaml
expert_roles: []                       # array   — Current task's expert role list (e.g., ["Backend Architect", "Security Expert"])
design_checkpoint: null                # string? — Design phase progress: candidates_shown / experts_confirmed / review_done / design_confirmed
expert_review_summary: null            # string? — Path to latest expert review synthesis report
```

- [ ] **Step 2: Add Field Details for expert_roles**

After the `notes` field details section (after line 147), append:

```markdown
### expert_roles
- **Type**: array
- **Default**: `[]`
- **Update Timing**: Set at design phase Checkpoint 2 when user confirms the expert panel.
- **Persistence**: Persists across iterations. Preserved on Level 2 rollback (user can opt to change). Preserved during lightweight iterations. Only cleared on Level 3 rollback (requirements changed).
- **Description**: List of confirmed expert role titles for the current task. Used to reuse the panel across iterations without re-asking the user.

### design_checkpoint
- **Type**: string | null
- **Allowed Values**: `null` | `"candidates_shown"` | `"experts_confirmed"` | `"review_done"` | `"design_confirmed"`
- **Default**: `null`
- **Update Timing**: Reset to `null` when entering the design phase. Updated at each checkpoint within the design phase.
- **Reset Conditions**:
  - Entering design phase (any iteration): Reset to `null`
  - Fail (any deviation level): Reset to `null`
  - Pass-Converged: Frozen with final value
- **Description**: Tracks progress through the design phase's 4 user checkpoints. Prevents the Director from skipping steps and enables resumption if interrupted.

### expert_review_summary
- **Type**: string | null
- **Default**: `null`
- **Update Timing**: Set after the expert synthesis report is generated (Step 5). Updated with new path on each design iteration.
- **Reset Conditions**:
  - Fail (any deviation level): Reset to `null`
  - Pass-Converged: Frozen with final value
- **Description**: Absolute path to the latest expert review synthesis report. Used by the Director to reference expert recommendations during detailed design.
```

- [ ] **Step 3: Update Field Relationships — add expert review fields to QA conclusion blocks**

In the Field Relationships section, find the `QA Conclusion: Fail` block and add after `→ optimization_directives = [] (Clear)`:
```
  → design_checkpoint = null (Reset)
  → expert_review_summary = null (Reset)
  → expert_roles preserved (unless Level 3)
```

Find the `QA Conclusion: Pass-Converged` block and add after `→ optimization_directives remains unchanged`:
```
  → design_checkpoint frozen
  → expert_review_summary frozen
  → expert_roles frozen
```

Find the `QA Conclusion: Pass-Optimizable (Unconverged)` block and add after `→ iteration +1`:
```
  → design_checkpoint = null if re-entering design (Reset at phase entry)
  → expert_roles preserved
  → expert_review_summary updated if design re-runs
```

- [ ] **Step 4: Verify changes**

Run: `grep -n "expert_roles\|design_checkpoint\|expert_review_summary" skills/surge/references/state-schema.md`
Expected: All 3 fields appear in schema, details, and relationships sections

- [ ] **Step 5: Commit**

```bash
git add skills/surge/references/state-schema.md
git commit -m "feat(surge): add expert review state fields with lifecycle rules"
```

---

### Task 6: Update output-structure.md — add expert review file naming

Add the new expert review file naming conventions to the output structure documentation.

**Files:**
- Modify: `skills/surge/references/output-structure.md:46-96` (File Naming Rules and Output Files sections)

- [ ] **Step 1: Add Expert Review file naming section**

After the "Parallel Mode Output Files" section (after line 82), add a new subsection:

```markdown
### Expert Review Output Files (design phase)

During the design phase's expert review steps, each expert subagent produces an individual review, and the Director generates a synthesis report:

```
iter_{NN}_expert_review_{role_slug}.md
iter_{NN}_expert_synthesis.md
```

| Placeholder | Description | Example |
|-------------|-------------|---------|
| `{role_slug}` | Expert role title, lowercased, spaces → underscores | `backend_architect`, `security_expert` |

**Examples**:
- `iter_01_expert_review_backend_architect.md` — Round 1 Backend Architect's review
- `iter_01_expert_review_security_expert.md` — Round 1 Security Expert's review
- `iter_01_expert_synthesis.md` — Round 1 consolidated synthesis report
```

- [ ] **Step 2: Add expert review rows to Output Files table**

In the "Output Files for Each Phase" table (around line 88-96), add two new rows after the `design` row:

```
| design (expert review) | `iter_{NN}_expert_review_{role_slug}.md` | Individual expert review from each panel member |
| design (synthesis) | `iter_{NN}_expert_synthesis.md` | Consolidated expert review synthesis report |
```

- [ ] **Step 3: Verify changes**

Run: `grep -n "expert_review\|expert_synthesis" skills/surge/references/output-structure.md`
Expected: Both naming patterns appear

- [ ] **Step 4: Commit**

```bash
git add skills/surge/references/output-structure.md
git commit -m "feat(surge): add expert review file naming to output-structure"
```

---

### Task 7: Update init.sh — add new state fields to default state.md

Update the init script to include the 3 new state fields in the generated state.md.

**Files:**
- Modify: `skills/surge/scripts/init.sh:68-86` (state.md generation block)

- [ ] **Step 1: Add new fields to state.md template in init.sh**

In `scripts/init.sh`, find the `cat > "${TASK_DIR}/state.md"` block. Before the `EOF` marker (line 86), add the 3 new fields after the `notes` field (line 85):

```yaml
expert_roles: []
design_checkpoint: null
expert_review_summary: null
```

So the full block becomes (lines 84-89):
```
notes: ""
expert_roles: []
design_checkpoint: null
expert_review_summary: null
EOF
```

- [ ] **Step 2: Verify changes**

Run: `bash skills/surge/scripts/init.sh /tmp/test-surge test-001 && grep "expert_roles\|design_checkpoint\|expert_review_summary" /tmp/test-surge/tasks/test-001/state.md && rm -rf /tmp/test-surge`
Expected: All 3 fields appear in the generated state.md

- [ ] **Step 3: Commit**

```bash
git add skills/surge/scripts/init.sh
git commit -m "feat(surge): add expert review fields to init.sh state template"
```

---

### Task 8: Final integration verification

Run end-to-end checks to ensure all files are consistent and no references are broken.

**Files:**
- Read-only verification of all modified files

- [ ] **Step 1: Verify all cross-references are consistent**

Check that every file referenced in SKILL.md's Reference File Index exists:
```bash
# Verify expert-review.md exists and is referenced
test -f skills/surge/references/expert-review.md && echo "✓ expert-review.md exists"

# Verify all phase files exist
for f in analyze research design implement qa retro; do
  test -f "skills/surge/references/phases/${f}.md" && echo "✓ ${f}.md exists"
done

# Verify state-schema.md has all 3 new fields
grep -q "expert_roles" skills/surge/references/state-schema.md && echo "✓ expert_roles in schema"
grep -q "design_checkpoint" skills/surge/references/state-schema.md && echo "✓ design_checkpoint in schema"
grep -q "expert_review_summary" skills/surge/references/state-schema.md && echo "✓ expert_review_summary in schema"

# Verify output-structure.md has expert naming
grep -q "expert_review" skills/surge/references/output-structure.md && echo "✓ expert naming in output-structure"
grep -q "expert_synthesis" skills/surge/references/output-structure.md && echo "✓ synthesis naming in output-structure"

# Verify init.sh generates the new fields
grep -q "expert_roles" skills/surge/scripts/init.sh && echo "✓ expert_roles in init.sh"

# Verify SKILL.md has Director-orchestrated
grep -q "Director-orchestrated" skills/surge/SKILL.md && echo "✓ Director-orchestrated in SKILL.md"

# Verify rules.md has expert rules
grep -c "expert" skills/surge/assets/rules.md
```
Expected: All checks pass (✓ for each)

- [ ] **Step 2: Run skill validation script if available**

```bash
bash scripts/validate-skill.sh skills/surge/ 2>&1 || true
```
Expected: No new errors introduced (existing warnings OK)

- [ ] **Step 3: Verify init.sh still works end-to-end**

```bash
bash skills/surge/scripts/init.sh /tmp/verify-surge verify-001 && cat /tmp/verify-surge/tasks/verify-001/state.md && rm -rf /tmp/verify-surge
```
Expected: state.md contains all fields including the 3 new ones

- [ ] **Step 4: Commit any fixes needed, then verify clean state**

```bash
git status
git log --oneline feat/surge-interaction-design --not main
```
Expected: Clean working tree, 7+ commits on branch
