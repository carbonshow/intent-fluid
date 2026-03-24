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
- Ensure `{surge_root}/rules.md` exists (copy from `templates/rules.md` if not).

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
└── iterations/         ← Stores phase outputs for each iteration
```

Then, write the PRD and background knowledge provided by the user into `{surge_root}/tasks/{task_id}/context.md`.

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
plateau_count: 0                # Number of consecutive rounds without substantial change
status: in_progress
max_iterations: 5
parallel_agent_limit: 10
notes: ""
```

Parse `max_iterations` and `parallel_agent_limit` from user input to override defaults 5 and 10 respectively.

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