# state.md Schema

This document defines the complete YAML schema of `state.md`, field meanings, and update rules.

---

## Complete Schema

```yaml
task_id: "{task_id}"                    # string  — Task identifier, immutable after creation
surge_root: "{surge_root}"             # string  — Workspace path, immutable after creation
current_phase: "analyze"                # string  — Current execution phase
iteration: 1                            # number  — Current iteration round
iteration_type: "full"                  # string  — Iteration type: full / lightweight
acceptance_modifications: 0             # number  — Cumulative count of acceptance criteria modifications
last_deviation_level: null              # string? — Deviation level of previous round
deliverable_type: null                  # string? — Deliverables type
current_eval_level: "L1"                # string  — Current evaluation tier
last_quality_assessment: null           # string? — Quality eval summary of prev round (incl. intra-tier positioning)
quality_history: []                     # array   — Evaluation records per round, for trend analysis & oscillation detection
optimization_directives: []             # array   — Directives injected in prev round, for QA to verify execution
plateau_count: 0                        # number  — Consecutive rounds with no substantial change
status: "in_progress"                   # string  — Overall task status
max_iterations: 5                       # number  — Max allowed iterations
parallel_agent_limit: 10                 # number  — Max parallel agents limit
notes: ""                               # string  — Free-form notes
expert_roles: []                       # array   — Current task's expert role list (e.g., ["Backend Architect", "Security Expert"])
design_checkpoint: null                # string? — Design phase progress: candidates_shown / experts_confirmed / review_done / design_confirmed
expert_review_summary: null            # string? — Path to latest expert review synthesis report
trace_file: null                       # string? — Path to trace.jsonl for execution tracing (set by Director after init)
```

---

## Field Details

### task_id
- **Type**: string
- **Default**: `YYYYMMDD-{4 random chars}` or user custom
- **Update Timing**: Set only at creation in Step 1, immutable afterwards.
- **Description**: Unique identifier for the task, used for directory naming.

### surge_root
- **Type**: string
- **Default**: `.surge`
- **Update Timing**: Set only at creation in Step 1, immutable afterwards.
- **Description**: Actual path of the workspace directory.

### current_phase
- **Type**: string
- **Allowed Values**: `"analyze"` | `"research"` | `"design"` | `"implement"` | `"qa"` | `"retro"`
- **Default**: `"analyze"`
- **Update Timing**: Updated before entering each new Phase.
- **Description**: The phase currently being executed.

### iteration
- **Type**: number
- **Default**: `1`
- **Update Timing**: +1 at the start of each iteration (starts at 1).
- **Description**: Current iteration round number.

### iteration_type
- **Type**: string
- **Allowed Values**: `"full"` | `"lightweight"`
- **Default**: `"full"`
- **Update Timing**: Set at the start of each iteration.
- **Description**: Iteration type. `full` is the complete flow; `lightweight` skips analyze and research, starting from design or implement depending on whether structural changes are needed. Trigger condition: QA concludes "Pass-Optimizable" and improvements only involve non-functional dimensions, no changes in requirement understanding or new features. Start from design if improvements require structural changes; start from implement if only local tweaks.

### acceptance_modifications
- **Type**: number
- **Default**: `0`
- **Update Timing**: +1 each time `acceptance.md` is modified.
- **Description**: Cumulative number of times acceptance criteria were modified. If `>= 2`, requires explaining reasons to user and asking whether to continue.

### last_deviation_level
- **Type**: string | null
- **Allowed Values**: `null` | `"Level 1"` | `"Level 2"` | `"Level 3"`
- **Default**: `null`
- **Update Timing**: Updated to current deviation level when QA conclusion is "Fail".
- **Description**: Deviation level detected by previous round's QA.

### deliverable_type
- **Type**: string | null
- **Allowed Values**: `null` | `"code"` | `"document"` | `"mixed"`
- **Default**: `null`
- **Update Timing**: Filled after Step 4 negotiation.
- **Description**: The format of the final deliverable.

### current_eval_level
- **Type**: string
- **Allowed Values**: `"L1"` | `"L1+L2"` | `"L1+L2+L3"`
- **Default**: `"L1"`
- **Update Timing**:
  - Pass-Optimizable and Unconverged: May elevate tier.
  - Fail: Rollback to `"L1"`.
- **Description**: The tier scope currently evaluated by QA.

### last_quality_assessment
- **Type**: string | null
- **Default**: `null`
- **Update Timing**: Stores this round's quality evaluation summary after each QA.
- **Description**: Used for cross-round comparison to judge if entering a plateau. Intra-tier positioning helps distinguish "true plateau" (quality actually stalled) from "false plateau" (tier unchanged but progress within tier).

### quality_history
- **Type**: array
- **Default**: `[]`
- **Update Timing**: Appends this round's record after each QA.
- **Format**: Array of objects containing `iteration`, `dimensions` (eval results incl. tier and positioning), `conclusion` (three-value).
- **Description**: Complete history of quality evaluations, used for: (1) Trend analysis; (2) Oscillation detection; (3) Data source for retro. Never cleared or truncated.

### optimization_directives
- **Type**: array
- **Default**: `[]`
- **Update Timing**: Stored when "Pass-Optimizable & Unconverged"; cleared and rewritten after next QA.
- **Description**: List of filtered optimization directives for next QA subagent to verify execution in Stage 5. Director MUST pass this list when dispatching QA. If same directive is "Unexecuted" twice, escalate to user decision.

### plateau_count
- **Type**: number
- **Default**: `0`
- **Update Timing**:
  - Pass-Optimizable: If tier is identical to previous AND positioning has no significant change, +1; else reset to 0.
  - Fail: Reset to 0.
- **Description**: Number of consecutive rounds with no substantial change. Triggers "Plateau Phase" convergence when `>= 2`.

### status
- **Type**: string
- **Allowed Values**: `"in_progress"` | `"done"` | `"terminated_by_user"`
- **Default**: `"in_progress"`
- **Update Timing**:
  - QA Pass-Converged → `"done"`
  - QA Pass-Optimizable and Converged → `"done"`
  - User explicitly terminates → `"terminated_by_user"`
- **Description**: Overall task status.

### max_iterations
- **Type**: number
- **Default**: `5`
- **Update Timing**: Defaults to 5; can be overridden by user during Step 3 (Topology) confirmation or via config.json.
- **Description**: Max allowed iteration rounds.

### parallel_agent_limit
- **Type**: number
- **Default**: `10`
- **Update Timing**: Defaults to 10; can be overridden by user during Step 3 (Topology) confirmation or via config.json.
- **Description**: Max parallel agents limit in implement phase.

### notes
- **Type**: string
- **Default**: `""`
- **Update Timing**: Director records notes as needed.
- **Description**: Free-form notes field.

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

### trace_file
- **Type**: string | null
- **Default**: `null`
- **Update Timing**: Set by the Director after `init.sh` completes, pointing to `{task_dir}/trace.jsonl`. Immutable after creation.
- **Description**: Absolute path to the JSONL trace file for execution flow tracking. Used by the framework-level `trace.sh`, `trace-export.sh`, and `dashboard.sh` scripts. See `docs/TRACE_SPEC.md` for the trace protocol specification.

---

## Field Relationships

```
QA Conclusion: Fail
  → last_deviation_level = Current deviation level
  → current_eval_level = "L1" (Rollback)
  → plateau_count = 0 (Reset)
  → quality_history appends this round
  → optimization_directives = [] (Clear)
  → design_checkpoint = null (Reset)
  → expert_review_summary = null (Reset)
  → expert_roles preserved (unless Level 3)

QA Conclusion: Pass-Optimizable (Unconverged)
  → current_eval_level = May elevate
  → last_quality_assessment = This round's summary
  → quality_history appends this round
  → plateau_count = +1 if tier/positioning both identical, else 0
  → optimization_directives = Filtered directives list
  → iteration +1
  → design_checkpoint = null if re-entering design (Reset at phase entry)
  → expert_roles preserved
  → expert_review_summary updated if design re-runs

QA Conclusion: Pass-Converged / Pass-Optimizable (Converged)
  → status = "done"
  → current_phase = "retro"
  → quality_history appends this round (Final record)
  → last_quality_assessment = This round's summary (Available for retro)
  → optimization_directives remains unchanged
  → design_checkpoint frozen
  → expert_review_summary frozen
  → expert_roles frozen

Acceptance Criteria Modified
  → acceptance_modifications +1
  → If >= 2 requires user confirmation
```

---

## state.md Maintenance Rules

- **state.md is maintained EXCLUSIVELY by the Director; Phase subagents do NOT read/write state.md.**
- Update `current_phase` before entering each new Phase.
- `iteration` +1 at the start of each iteration.
- Batch update relevant fields when processing QA results.

---

## scripts/state.sh Usage and Constraints

### Runtime Prerequisite

`state.sh` requires **Node.js** (any version with `fs` module — Node 12+). If Node.js is not available in the environment, the Director must fall back to manual Read/Edit operations on `state.md`, following the format constraints below strictly.

### YAML Format Constraints

`state.sh` uses regex-based parsing (not a full YAML parser). To ensure correct read/write behavior, `state.md` MUST adhere to these format rules:

1. **Root-level fields only**: Every field starts at column 0 with `field_name:`. No nested YAML objects at the root level.
2. **Single-line scalar values**: Strings, numbers, and `null` are written on the same line as the key (e.g., `current_phase: analyze`).
3. **Quoted strings stay quoted**: Fields initialized with quotes (e.g., `iteration_type: "full"`) must remain quoted on update. `state.sh` preserves quoting automatically.
4. **Array indentation**: Array fields (`quality_history`, `optimization_directives`, `expert_roles`) use YAML block sequence format with **2-space indentation** for each `- ` element. Example:
   ```yaml
   quality_history:
     - iteration: 1
       dimensions: "..."
       conclusion: "Pass-Optimizable"
     - iteration: 2
       dimensions: "..."
       conclusion: "Pass-Converged"
   ```
5. **No inline comments after values**: Comments are allowed only on their own line or at the end of the initial template. Do not add comments after values during updates (e.g., do NOT write `iteration: 3  # bumped`).
6. **No duplicate field names**: Each field name appears exactly once. Duplicate names cause the regex to match only the first occurrence.
7. **Values must not contain unescaped colons at line start**: If a multi-line value contains a line starting with `word:`, it will be misinterpreted as a new field. Indent such lines by at least 2 spaces.

### Argument Order Reminder

The correct argument order is: `state.sh <subcommand> <state_file> <field> [value]`

A common error is: `state.sh <state_file> <subcommand> ...` — this produces the confusing message `Error: state file does not exist: set` because it interprets the subcommand as the file path.