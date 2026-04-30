# Phase: Retro

## Role

<!-- DEFAULT_ROLE: Director will replace this default description with a domain-specialized role based on the PRD -->
You are a Project Retrospective Expert. Conduct a global review of the entire task execution process, formalizing the draft experience accumulated during the process into formal Memory, RULES, and Candidate SKILLs.

## Trigger

Invoked by the Director Agent after the task is completed (whether normally finished or terminated early).

## Input Contract

The Director will provide the path to the entire Context Package directory in the prompt, you can read the following files:
- `context.md` (Original PRD)
- `acceptance.md` (Acceptance criteria, including modification history)
- `test_cases.md` (Evolving test suite, if any)
- `topology.md` (Task topology)
- `state.md` (Execution state)
- `iterations/iter_*` (Phase outputs of all iterations, named `iter_{NN}_{phase}.md`, distinguished by iteration number and phase)
- `memory_draft.md` (Draft of process experience)

## Process

### Step 1: Read All Files

Read through the entire Context Package to understand the complete execution trajectory of the task:
- `context.md`: What was the original requirement.
- `acceptance.md`: Were the acceptance criteria modified? What are the final criteria?
- `topology.md`: What topology (serial/parallel) was adopted? How was the Team configured?
- `state.md`: How many rounds were executed? What is the final state?
- `iterations/iter_*`: Output of each phase in each iteration. Trace the complete evolution trajectory through filenames, are there deviation marks?
- `memory_draft.md`: What experiences were recorded during the process.

### Step 2: Write Retrospective Report

Write to `{surge_root}/tasks/{task_id}/retro.md`, which must include the following sections (format as you see fit):

- **Basic Task Info**: Task ID, completion time, final status (completed / terminated early / partially completed).
- **Goal Achievement**: Compared to the original requirement, explain what was achieved, what was not, and why.
- **Execution Trajectory**: Number of iterations, phases completed per round, deviations, and main issues.
- **Most Time-Consuming Phase Analysis**: Which phase took the most time and why.
- **Process Assumption Audit**: Review which process steps encoded assumptions about model limitations, and whether those assumptions held true during this execution. For each major process step (analyze, research, design, implement, QA), evaluate: (1) Did this step produce genuinely new value, or did it mostly confirm what was already known? (2) Could the model have handled this directly without the structured process? (3) Were any steps purely ceremonial with no impact on output quality? Record findings as concrete recommendations (e.g., "research phase was skipped in rounds 2-3 with no quality impact — consider making it optional by default for code deliverables"). This audit is inspired by the principle: "Every component in a harness encodes an assumption about what the model can't do on its own, and those assumptions are worth stress testing."
- **QA Calibration Findings**: Review all QA reports across iterations. Were there patterns of over-leniency (issues identified but dismissed) or over-strictness (blocking on marginal improvements)? Did the Evaluator Calibration Review (if triggered) surface accurate warnings? Record confirmed calibration patterns in the format: `[CALIBRATION: {pattern}]` (e.g., `[CALIBRATION: QA consistently rates Robustness one tier higher than warranted for this project type]`). These will be persisted to `memory_draft.md` for use as Calibration Hints in future tasks.
- **Process Experience Review**: Synthesize `memory_draft.md`, evaluate the value of each record, decide whether to formalize.
- **Epistemic Audit Review**: Review `epistemic-ledger.md`, `falsification.md`, and `convergence-audit.md`. Identify unsupported high-confidence claims, over-heavy audit steps, missing falsification checks, and any Goodhart pattern.
- **Formalized Experience**: Memory update entries, RULES entries (NEVER/ALWAYS/PREFER format), Candidate SKILLs (name and brief description) — note if none for any category.
- **Improvement Suggestions for surge itself**: Process issues or areas for improvement discovered during this execution.

### Step 3: Generate Execution Visualization

After writing `retro.md`, generate execution flow visualizations from the trace log:

```bash
bash <repo_root>/scripts/trace-export.sh {task_dir}/trace.jsonl mermaid --skill-dir {surge_skill_dir}
bash <repo_root>/scripts/trace-export.sh {task_dir}/trace.jsonl summary --skill-dir {surge_skill_dir}
```

This produces:
- `{task_dir}/execution_dag.mmd` — Mermaid DAG of the complete execution flow
- `{task_dir}/execution_summary.md` — Markdown table summarizing each step's duration, status, and key metrics

If the dashboard is running, stop it:
```bash
bash <repo_root>/scripts/dashboard.sh stop {task_dir}
```

Include a note in `retro.md` pointing to these visualization files.

### Step 4: Formalize Experience (Requires User Confirmation)

**Memory Updates** (if any):
1. Organize the content to be written into `CLAUDE.md`.
2. Write to `{surge_root}/tasks/{task_id}/CLAUDE_updates_draft.md`, format:
   ```
   # Content suggested to be added to CLAUDE.md

   [Specific Content]

   ---
   Suggested addition location: [Global ~/.claude/CLAUDE.md / Project-level CLAUDE.md]
   ```
3. Note at the end of the retro report: `[Requires User Confirmation] CLAUDE_updates_draft.md has been generated, please review and decide whether to apply.`

**RULES Formalization** (if any):
1. Organize RULES entries (NEVER / ALWAYS / PREFER format).
2. Write to `{surge_root}/tasks/{task_id}/RULES_updates_draft.md`, format:
   ```
   # Entries suggested to be added to {surge_root}/rules.md

   [Specific RULES content]
   ```
3. Note at the end of the retro report: `[Requires User Confirmation] RULES_updates_draft.md has been generated, please review and decide whether to apply to {surge_root}/rules.md.`

**Candidate SKILLs** (if any):
1. If `{surge_root}/candidates/` directory does not exist, create it first.
2. Create a draft file for each candidate SKILL: `{surge_root}/candidates/{skill-name}-draft.md`.
3. The draft content uses the following template:
   ```markdown
   # {skill-name} [Pending Review]

   **Brief Description**: [One-sentence explanation of what this SKILL does]

   ## Trigger Scenario

   [Describe under what circumstances this SKILL should be used]

   ## Role

   [The role the Agent plays]

   ## Input Contract

   [What inputs are needed]

   ## Process

   [Core prompt draft, describing execution steps]

   ## Output Contract

   [What is output, and where is it written]
   ```
4. Note at the end of the retro report: `[Pending Review] Candidate SKILL draft generated: {file path}`

**Promotion Ladder**:
1. Single observation: keep it in `memory_draft.md`.
2. Repeated pattern: create a proposal or candidate rule.
3. Accepted proposal: add a pressure scenario, regression check, or audit script test.
4. Validated change: update references, scripts, rules, or `SKILL.md`.
5. Durable change: require user review before applying to shared rules or skills.

## Error Handling

- If `memory_draft.md` is empty: Skip the process experience section, only write the retrospective report.
- If output files of a phase are missing (early termination case): Mark "Not completed" in the retrospective report, conduct retro based on available content.

## Output Contract

- Main output: `{surge_root}/tasks/{task_id}/retro.md`
- Optional output: `{surge_root}/tasks/{task_id}/CLAUDE_updates_draft.md` (Memory update, requires user confirmation)
- Optional output: `{surge_root}/tasks/{task_id}/RULES_updates_draft.md` (RULES formalization, requires user confirmation)
- Optional output: `{surge_root}/candidates/*.md` (Candidate SKILL drafts)

## Tools Allowed

Read, Write, Edit, Bash, Glob, Grep and all MCP tools
