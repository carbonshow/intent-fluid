# Startup Process Details

This document is a complete reference manual for the Director's startup phase (Step 1 - Step 5).

---

## Step 1: Determine Workspace and Task ID

**Before creating any files, determine the workspace directory and task ID.**

### Workspace Directory (`surge_root`)

Determine in the following priority:

1. **Project Standards Priority**: Check if the project's CLAUDE.md / GEMINI.md / AGENTS.md configuration files define the surge workspace directory (e.g., `surge_root: .my_agents`), if so, follow it directly.
2. **Ask the User**: If project standards do not define it, ask the user if they want to specify a custom workspace directory.
3. **Use Default**: If the user does not specify, use the default `.surge`.

> ⚠️ **MANDATORY**: Even if the user has not defined `surge_root` in project standards, you MUST confirm the workspace directory location with the user, presenting the default value for them to accept or modify. Never silently use the default.

After determining:
- Ensure `{surge_root}/tasks/` and `{surge_root}/candidates/` directories exist (create if not).
- Ensure `{surge_root}/rules.md` exists (copy from `assets/rules.md` if not).

> **All `{surge_root}` in subsequent documents refer to the actual path determined in this step.**

### Task ID (`task_id`)

Automatically generate a default task_id (Format: `YYYYMMDD-{4 random alphanumeric chars}`), then ask the user:

> The task ID for this session is `{default task_id}`, you can:
> A) Use this ID
> B) Specify a custom name (e.g., project abbreviation, requirement number, etc.)

When the user specifies a custom name, the Director uses that name directly as the task_id (ensure it contains no invalid file system characters).

---

## Step 2: Initialize Context Package

Using the `{surge_root}` and `{task_id}` determined in Step 1, run the initialization script to create the directory structure (adjust the relative path to the script based on your current path):

```bash
bash <surge_skill_dir>/scripts/init.sh {surge_root} {task_id}
```

The initialization script will automatically generate the directory structure and a `state.md` with default values:

```
{surge_root}/tasks/{task_id}/
├── context.md          ← Manually write PRD + background knowledge to this file
├── state.md            ← Initial state (see schema below)
├── test_cases.md       ← QA evolving test suite
├── epistemic-ledger.md ← Hypotheses, claims, evidence, confidence
├── falsification.md    ← High-risk disconfirmation checks
├── convergence-audit.md← Evidence behind stop/convergence decisions
├── platform-capabilities.md ← Host capabilities and fallbacks
└── iterations/         ← Stores phase outputs for each iteration
```

Then, write the PRD and background knowledge provided by the user into `{surge_root}/tasks/{task_id}/context.md`.

> ⚠️ **Path Resolution**: After determining `surge_root` and `task_id`, the Director MUST resolve the task directory to an **absolute path** and use it for ALL subsequent file operations (state.sh calls, file reads/writes, subagent prompts). Subagent execution (especially `npm run build`, `cd` commands) can change the working directory, causing relative paths to break silently.
>
> Store as variables:
> - `task_dir` = absolute path of `{surge_root}/tasks/{task_id}/`
> - `state_file` = `{task_dir}/state.md`
> - `iterations_dir` = `{task_dir}/iterations/`

### Initial Content of state.md (YAML)

```yaml
task_id: "{task_id}"
surge_root: "{surge_root}"       # Workspace determined in Step 1
current_phase: analyze
iteration: 1
iteration_type: "full"                  # Iteration type: "full" | "lightweight"
acceptance_modifications: 0
last_deviation_level: null
deliverable_type: null          # "code" | "document" | "mixed", filled after Step 4 negotiation
current_eval_level: "L1"        # Current evaluation tier: "L1" | "L1+L2" | "L1+L2+L3"
                                # NOTE: If deliverable_type is "document", override to "L1+L2" for Round 1
                                # (documents rely heavily on L2 attributes like terminology consistency)
last_quality_assessment: null   # Quality evaluation summary of previous round, for cross-round comparison
quality_history: []             # Evaluation records per round, for trend analysis & oscillation detection
optimization_directives: []    # Directives injected in prev round, for QA to verify execution
plateau_count: 0                # Number of consecutive rounds without substantial change
status: in_progress
max_iterations: 5
parallel_agent_limit: 10
notes: ""
expert_roles: []               # Current task's expert role list, set at design Checkpoint 2
design_checkpoint: null        # Design phase progress tracking
expert_review_summary: null    # Path to latest expert review synthesis report
trace_file: null                # Absolute path to trace.jsonl, set by Director after init
```

Parse `max_iterations` and `parallel_agent_limit` from user input during Step 3 (Topology confirmation) or config.json to override defaults 5 and 10 respectively.

---

## Step 3: Task Topology Analysis

Read `context.md`, analyze task structure, output a topology report and present it to the user for confirmation.

### Topology Report Format

```
Task Topology Report
─────────────────────────────────────────
Task Type: [Serial / Parallel / Mixed]

Serial Main Chain:
  [List required serial stages] (Estimated volume: small/medium/large/xlarge)

Parallelizable Nodes (if any):
  [Stage Name]:
    ├── [Module A] (Estimated volume: small/medium/large/xlarge) (Agent-1: [Role Description])
    ├── [Module B] (Estimated volume: ...) (Agent-2: [Role Description])
    └── ...

Agent Team Config:
  · Serial Phase: 1 agent, switching roles as needed
  · Parallel Phase: [N] agents

Estimated Iteration Rounds: [N-M rounds]
Cost Config: max_iterations=[N] / parallel_agent_limit=[N]
─────────────────────────────────────────
```

### Role and Content Volume Planning

Analyze the problem domain of the PRD, evaluate the content scale of each implementation stage, and generate a domain-specialized Role description for each Phase.

**Content Volume Evaluation Rules**:
- **small**: Single script, simple config, or document under 1000 words.
- **medium**: Medium-scale implementation, e.g., single core class, 1000-3000 words analysis report.
- **large**: Complex system layer implementation, 3000-5000 words design doc. **(Requires warning: Must be split into subtasks in implement phase)**
- **xlarge**: Systemic report over 5000 words or full-stack system skeleton. **(Requires warning: Must be split into subtasks in implement phase)**

**Generation Rules**:
- Retain the core responsibilities of that Phase (analyze still analyzes requirements, research still researches tech, design still does architecture, etc.)
- Inject professional background, terminology, and experiential dimensions of the problem domain.
- Each Role is 2-3 sentences, the first sentence points out the professional identity, the rest supplement the key capabilities of that domain.

**Output Format (Append to the end of topology report)**:

```
## Phase Role Config

| Phase | Customized Role |
|-------|-----------------|
| analyze | [Domain-specialized requirements analyst description] |
| research | [Domain-specialized research expert description] |
| design | [Domain-specialized architect description] |
| implement | [Domain-specialized implementation engineer description] |
| qa | [Domain-specialized QA engineer description] |
| retro | [Domain-specialized retrospective expert description] |
```

Write the topology report (including role planning) to `topology.md`. Wait for user confirmation or modification.

---

## Step 4: Deliverables Negotiation

**After topology confirmation and before acceptance criteria, the final format of the deliverables MUST be clarified. Do not assume the deliverable format.**

> ⚠️ **MANDATORY**: Deliverable paths (`project_root` / `output_dir`) are non-skippable required questions. In Fast Startup mode, these questions may be combined with Steps 3/5, but they MUST NOT be omitted.

### Questions to Ask

1. **What is the format of the final deliverables?**
   - Actual source files (code, config, scripts, etc.)
   - Documents (research reports, design docs, markdown, etc.)
   - Mixed (some modules are code, some are documents)
   - Other (please describe)

2. **If code-type deliverables, ask follow-up:**
   - Where is the project root directory? (Absolute path)
   - Is there an existing project structure? (If so, provide directory layout or let surge explore itself)
   - Language / Framework constraints? (e.g., Python 3.11+, Java 17, Lua 5.4, etc.)
   - Build / Run methods? (e.g., `uv run`, `npm run build`, `make`, etc.)

3. **If document-type deliverables, ask follow-up:**
   - Where is the output directory? (Default is `{surge_root}/tasks/{task_id}/output/`, user can specify external path to override)
   - Format requirements? (markdown / docx / PDF, etc.)

**If user's answer is incomplete, keep asking until info is sufficient.**

### Creating Output Directory

When `deliverable_type` is `document` or `mixed`, ensure `output_dir` directory exists (create if not). If the user doesn't specify an external path, default to creating `{surge_root}/tasks/{task_id}/output/`.

### deliverables.md Format

Write the negotiation results to `{surge_root}/tasks/{task_id}/deliverables.md`:

```yaml
deliverable_type: "code" | "document" | "mixed"

# Code-type fields (Required when deliverable_type is code or mixed)
project_root: "/absolute/path/to/project"
existing_structure: true | false
language: "Python 3.11+"
framework: "FastAPI"
build_command: "uv run main.py"
test_command: "uv run pytest"

# Document-type fields (Required when deliverable_type is document or mixed)
output_dir: "{surge_root}/tasks/{task_id}/output"  # Default, user can override
format: "markdown"

# Supplementary notes (Optional)
notes: "..."
```

Also update the `deliverable_type` field in `state.md`.

---

## Step 5: Acceptance Criteria Negotiation

Generate a **tiered acceptance plan** based on PRD type, and present it to the user.

### Three Tiers of Acceptance Criteria

- **L1 Core Standards** (Evaluated from Round 1): Functional correctness, basic requirement satisfaction
  - Code: Feature points verifiable one by one + no obvious bugs + buildable/runnable
  - Document: Structurally complete + covers all requirements + no factual errors
  - Research: Core assumptions verified + conclusions backed by evidence

- **L2 Quality Standards** (Evaluated after L1 passes): Robustness, edge case handling, engineering quality
  - Code: Exception handling + edge conditions + complete interface contracts + necessary comments
  - Document: Rigorous argumentation logic + accurate cross-references + consistent terminology
  - Research: Discussion of opposing evidence + confidence labeling + reasonable methodology

- **L3 Excellence Standards** (Evaluated after L2 passes): Maintainability, extensibility, best practices
  - Code: Consistent code style + extensible design + no obvious perf bottlenecks
  - Document: Excellent readability + independently understandable + sufficient examples
  - Research: Depth of insight + actionable suggestions + follow-up research directions

**The above are default templates, the Director should customize specific items for each tier based on the specific PRD.**

### User Options

> A) Accept default tiered plan
> B) Modify some items or adjust tier division
> C) Provide external document/SKILL/service as substitute

### acceptance.md Format

After confirmation, write acceptance criteria to `acceptance.md`:

```markdown
## L1 Core Standards

| ID | Acceptance Item | Verification Method |
|----|-----------------|---------------------|
| L1-1 | ... | ... |

## L2 Quality Standards

| ID | Acceptance Item | Verification Method |
|----|-----------------|---------------------|
| L2-1 | ... | ... |

## L3 Excellence Standards

| ID | Acceptance Item | Verification Method |
|----|-----------------|---------------------|
| L3-1 | ... | ... |
```

---

## Fast Startup Combined Template

When the user's PRD is comprehensive and intent is clear, the Director MAY combine Steps 3-5 into a single confirmation message. **Steps 1-2 (workspace + init) and the mandatory path questions (surge_root, project_root/output_dir) MUST still be asked separately beforehand.**

### Combined Display Format

```
surge Configuration — Please confirm or modify
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 1. Task Topology
Task Type: [Serial / Parallel / Mixed]
Estimated Iteration Rounds: [N-M rounds]
Cost Config: max_iterations=[N] / parallel_agent_limit=[N]

Parallelizable Nodes (if any):
  [Stage Name]:
    ├── [Module A] (small) (Agent-1: [Role])
    └── [Module B] (medium) (Agent-2: [Role])

Phase Roles:
  | Phase     | Customized Role                          |
  |-----------|------------------------------------------|
  | analyze   | [Domain-specialized description]         |
  | research  | [Domain-specialized description]         |
  | design    | [Domain-specialized description]         |
  | implement | [Domain-specialized description]         |
  | qa        | [Domain-specialized description]         |
  | retro     | [Domain-specialized description]         |

## 2. Deliverables
  Type: [code / document / mixed]
  Project Root: {project_root}          ← confirmed in prior step
  Language/Framework: [e.g., Python 3.11+ / FastAPI]
  Build Command: [e.g., uv run main.py]
  Test Command: [e.g., uv run pytest]

## 3. Acceptance Criteria

  L1 Core Standards:
    | ID   | Item           | Verification Method |
    |------|----------------|---------------------|
    | L1-1 | ...            | ...                 |

  L2 Quality Standards:
    | ID   | Item           | Verification Method |
    |------|----------------|---------------------|
    | L2-1 | ...            | ...                 |

  L3 Excellence Standards:
    | ID   | Item           | Verification Method |
    |------|----------------|---------------------|
    | L3-1 | ...            | ...                 |

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Options:
  A) Confirm all — proceed to first iteration
  B) Modify topology / roles
  C) Modify deliverables config
  D) Modify acceptance criteria
  E) Modify multiple sections
```

After the user confirms (option A) or finishes modifications, the Director writes `topology.md`, `deliverables.md`, and `acceptance.md` in sequence, then proceeds to Rules Loading and the Main Iteration Loop.

### Epistemic and Platform Setup

After Step 5 and before the Main Iteration Loop:

1. Record available host capabilities and fallbacks in `platform-capabilities.md` using `references/platform-adapter.md`.
2. If Node.js is available, run:
   ```bash
   node <surge_skill_dir>/scripts/audit-task.js init-artifacts "{task_dir}"
   ```
   This is idempotent and creates any missing audit artifacts.
3. For high-impact, ambiguous, document/strategy, market/domain, or architecture-heavy tasks, treat `epistemic-ledger.md` as a required downstream input. For low-risk tasks, keep the artifact initialized and record skipped checks in `convergence-audit.md` if needed.

---

## config.json Mechanism

### Storage Location

Config file is stored at `${CLAUDE_PLUGIN_DATA}/config.json`. If this env var is unavailable, fallback to `{surge_root}/config.json`.

### Field Definitions

```json
{
  "surge_root": ".surge",
  "default_deliverable_type": "code",
  "default_max_iterations": 5,
  "default_parallel_agent_limit": 10
}
```

| Field | Type | Description |
|-------|------|-------------|
| `surge_root` | string | Workspace directory path |
| `default_deliverable_type` | string | Default output type: `"code"` / `"document"` / `"mixed"` |
| `default_max_iterations` | number | Default max iterations |
| `default_parallel_agent_limit` | number | Default parallel agent limit |

### Runtime Behavior

- **First Run**: No config.json exists, execute the full interactive process (Step 1 – Step 5), save config to config.json upon completion.
- **Subsequent Runs**: When config.json is detected, load config and ask user:
  > Detected previous config:
  > - Workspace: {surge_root}
  > - Default Deliverable Type: {default_deliverable_type}
  > - Max Iterations: {default_max_iterations}
  > - Parallel Agent Limit: {default_parallel_agent_limit}
  >
  > Keep previous config or modify?

If the user chooses to keep it, skip the corresponding interactive steps. If modify, enter the full interactive process and update config.json.

---

## Resume Protocol (Recovering from Interrupted Sessions)

When a new session starts and the user asks to resume a previously interrupted surge task (or the Director detects an existing in-progress task), follow this protocol instead of the normal Startup flow.

### Detection

The Director checks for an existing task in one of two ways:

1. **User provides task path**: User says "resume surge task X" or provides a `{surge_root}/tasks/{task_id}/` path.
2. **Director scans on startup**: If `config.json` exists, read `surge_root`, then scan `{surge_root}/tasks/` for directories containing a `state.md` with `status: "in_progress"`. If exactly one is found, propose resuming it. If multiple are found, list them and ask the user which to resume.

### Validation Steps

After identifying the task directory, the Director MUST validate before resuming:

1. **Read `state.md`**: Parse all fields. Confirm `status` is `"in_progress"` (if `"done"` or `"terminated_by_user"`, inform user the task is already finished).
2. **Resolve absolute paths**: Set `task_dir`, `state_file`, `iterations_dir` to absolute paths (same as normal startup Step 2).
3. **Read `{surge_root}/rules.md`**: Load guardrail constraints into active context.
4. **Verify core files exist**: Check that `context.md`, `topology.md`, `deliverables.md`, `acceptance.md` all exist and are non-empty. If any are missing, report to user — these indicate the task was interrupted during startup and cannot be resumed; a fresh start is needed.
5. **Identify last completed phase output**: Based on `current_phase` and `iteration` in `state.md`, check which phase outputs exist in `iterations/`:
   - Glob for `iter_{NN}_*.md` where `NN` is the current iteration number.
   - Determine the last phase that produced a valid output file.
6. **Validate last output integrity**: Run the output validation checklist from `references/output-validation.md` on the last phase output. Classify as PASS / MINOR_TRUNCATION / SEVERE_TRUNCATION.

### Resume Decision Table

| `current_phase` in state.md | Last Valid Output Found | Action |
|------------------------------|------------------------|--------|
| Phase X | Output for Phase X exists and PASS | Phase X completed successfully; advance to next phase |
| Phase X | Output for Phase X exists but MINOR/SEVERE_TRUNCATION | Re-enter Phase X with recovery procedures |
| Phase X | No output for Phase X | Re-enter Phase X from scratch |
| Phase X | Output for Phase X-1 exists but not Phase X | Phase X was never started; enter Phase X normally |

### User Confirmation

Before resuming, present a summary to the user:

```
Resume Detected — Task {task_id}
---
Iteration: {iteration} (type: {iteration_type})
Last Phase: {current_phase}
Last Output: {last valid output file or "none"}
Output Status: {PASS / TRUNCATED / MISSING}
Eval Level: {current_eval_level}
Plateau Count: {plateau_count}
Remaining Rounds: {max_iterations - iteration + 1}
---

Options:
  A) Resume from {recommended resume point}
  B) Roll back to an earlier phase (specify)
  C) Restart iteration from analyze
  D) Terminate task, enter retro
```

### Post-Resume

After the user confirms, the Director enters the Main Iteration Loop at the determined phase. All normal rules apply (Phase Invocation Flow, Output Validation, Process Output, etc.).
