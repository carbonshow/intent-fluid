# Phase: Research (Director-Orchestrated)

## Dispatch Model

Director-orchestrated (NOT single-agent). The Director controls the interactive research loop:
- Extracting research seeds from analyze output
- Dispatching search/fetch subagents for each direction
- Scoring results and presenting them to the user
- Collecting user pruning decisions
- Recursively deepening selected directions
- Producing the final summary (or delegating to a summary subagent)

Subagents in this phase are **short-lived workers** — each receives a single search/fetch task, persists the result, and returns. The Director manages all state, scoring, and user interaction.

## Trigger

Invoked after the analyze phase completes (and after the Ambiguity Escalation Gate, if applicable).

**Skip conditions** — the Director may skip this phase ONLY when ALL of the following hold:
1. The risk list is empty or contains only Low-severity risks, AND
2. There are no unresolved ambiguities requiring external research, AND
3. The `deliverable_type` is `"code"` OR the task does not inherently require market/domain/competitive research.

**Mandatory research**: When `deliverable_type` is `"document"` or `"mixed"` and the task involves strategy, marketing, market analysis, or domain expertise, research is MANDATORY in the first iteration. The agent's pre-trained knowledge is NOT a substitute for current market data, competitive analysis, and domain-specific evidence.

## Input Contract

The Director reads:
- **Required**: `context.md` (PRD + Background knowledge)
- **Required**: `iterations/iter_{NN}_analyze.md` (Requirements analysis output)

## Director Orchestration Flow

### Step 1: Extract Research Seeds (Root)

The Director reads ambiguities and risk warnings from `iter_{NN}_analyze.md` and extracts all issues requiring research as **research seeds**.

Categorize each seed into a **research direction**, merging highly similar issues to form a list of root nodes.

Create the raw materials directory:

```bash
mkdir -p "{task_dir}/iterations/iter_{NN}_research"
```

Initialize a global sequence counter at 1 (increments for every WebSearch/WebFetch call across all layers and directions).

### Step 2: Interactive Tree-Structured Research Loop

The research unfolds layer by layer in a **tree structure**, deepening after user pruning at each layer.

#### 2.1 Dispatch Search Subagents (Expand Current Layer)

For each direction to be researched in the current layer, the Director dispatches a **search subagent** via the Agent tool with the following prompt structure:

```
You are a research assistant. Execute the following search task and persist results.

## Task
Conduct shallow research (1-2 WebSearch/WebFetch calls) on the following direction:
  Direction: {direction_name}
  Context: {1-2 sentence description of what we need to learn}

## Raw Material Persistence Protocol

**CRITICAL**: After EVERY WebSearch/WebFetch call, IMMEDIATELY write the result to a file.
Do NOT defer file writing. Do NOT batch writes.

Directory: {task_dir}/iterations/iter_{NN}_research/
File naming: {seq}_{type}_{slug}.md
  - seq: 3-digit zero-padded ({next_seq})
  - type: "search" (WebSearch) or "fetch" (WebFetch)
  - slug: from query/URL — lowercase, spaces to hyphens, strip non-alphanumeric (keep hyphens), max 40 chars, no trailing hyphen

File format (YAML frontmatter + full raw content):
---
seq: {next_seq}
type: search | fetch
query: "the search query string or the fetched URL"
direction: "{direction_name}"
layer: {current_layer}
timestamp: {ISO 8601}
relevance: null
importance: null
---

[Full raw content — no truncation]

## Output
In your final reply, provide:
- What sub-directions / candidate solutions exist under this direction
- The core point of each sub-direction (1-2 sentences)
- Files written (path and seq number)
```

The Director may dispatch multiple search subagents **in parallel** (one per direction) up to `parallel_agent_limit`.

**After each subagent returns**, the Director MUST verify:
1. The declared raw material file(s) exist (Glob/Read check)
2. Files are non-empty and contain the YAML frontmatter

If a file is missing, the Director retries that subagent once. If retry also fails, mark the direction as `[Research Failed]` and continue.

#### 2.2 Director Scores and Presents Results

The Director consolidates findings from all subagents in the current layer and scores each direction/sub-direction on two dimensions:

**Scoring Criteria**:

- **Relevance** (1-5): Direct correlation between this direction and the PRD's core objectives.
  - 5: Directly solves core requirements or key risks in the PRD.
  - 4: Indirectly supports core requirements, necessary technical foundation.
  - 3: Somewhat relevant but not on the critical path.
  - 2: Marginally relevant, valuable only under specific conditions.
  - 1: Very weak relevance, more of an extended topic.

- **Importance** (1-5): Impact of this direction on the quality and feasibility of the final solution.
  - 5: Not researching this will lead to major risks or omissions in the solution.
  - 4: Researching this can significantly improve solution quality or avoid known risks.
  - 3: Helps refine the solution, but its absence won't cause serious problems.
  - 2: Nice to have, lower priority.
  - 1: Can be ignored, almost no impact on the solution.

**After scoring**: The Director backfills the `relevance` and `importance` fields in the frontmatter of all raw material files written during this layer's expansion (use Edit tool to update the two lines).

**Present to user**:

```
Research Tree — Layer {Depth}
---

| # | Direction | Relevance | Importance | Reason |
|---|-----------|-----------|------------|--------|
| 1 | ... | *****  | ****  | [1-sentence explanation] |
| 2 | ... | ***  | ***** | ... |
| 3 | ... | **  | **  | ... |

Parent Direction: {Name of current expanding parent node, Root shows "---"}
Completed Depth: {Current Layer}/{Max Explored Depth}
```

#### 2.3 User Pruning Decision

The Director presents the following options to the user (via direct message, NOT via subagent):

> Please select the directions to research deeper, or:
> - **A) Check numbers**: Enter the direction numbers to deepen (e.g., `1,3`)
> - **B) Continue all**: Deepen research into all directions
> - **C) All sufficient, next phase**: End research, summarize existing results
> - **D) Add direction**: Add a new research direction not in the table

#### 2.4 Smart Skip

**Automatically skip user confirmation and continue deepening if:**

- The current layer has <= 2 branches, **AND** all branches score >= 4 in both Relevance and Importance.

When auto-skipping, notify the user:

```
[Auto-Continue] Direction "{Direction Name}" has only {N} high-scoring sub-directions, automatically deepening research.
```

**If the above conditions are not met, the Director MUST wait for user confirmation.**

#### 2.5 Recursive Deepening

Directions selected by the user become the input for the next layer. Return to Step 2.1 and repeat until termination.

### Step 3: Termination Conditions

End the research loop when any of the following conditions are met:

1. **User explicitly terminates**: User selects "All sufficient, next phase".
2. **Leaf nodes converged**: All selected branches have reached leaf nodes (no more sub-directions to expand, or clear conclusions obtained).
3. **Depth limit**: Reached Layer 5 (prevents over-deepening).

### Step 4: Summary Output

After the research loop ends, the Director dispatches a **summary subagent** to produce the final research report:

```
You are a research summarizer. Read all raw research materials and produce a structured summary.

## Input
- Raw materials directory: {task_dir}/iterations/iter_{NN}_research/
- Research tree structure (provided below):
{Director provides the tree structure with node statuses from the loop}

## Output
Write a structured summary to: {task_dir}/iterations/iter_{NN}_research.md

The summary MUST include the following sections:

- **Research Conclusion Summary**: 2-3 sentences summarizing core findings.

- **Research Tree Overview**: The complete research tree structure, marking the status of each node (researched/pruned by user/auto-skipped, etc.).

- **Source Materials Index**: A table listing all raw material files:

  | Seq | File | Type | Direction | Query/URL | Relevance | Importance |
  |-----|------|------|-----------|-----------|-----------|------------|
  | 001 | iter_{NN}_research/001_search_xxx.md | search | Direction A | "query..." | 4 | 5 |

- **Technical Solution Candidates**: Each with brief description, rating, credibility, applicable scenarios, and references to source material files (e.g., "-> 001_search_xxx.md, 003_fetch_yyy.md").

- **Resolved Ambiguities**: Issue description, research conclusion, and source file references.

- **Remaining Uncertainties**: Issues still unresolved, passed to design phase.

- **User Decision Records**: Pruning decisions made during research.

## Process Output Requirement
In your final reply (not the content written to the file), please provide an additional brief process summary containing:
- Key findings or decisions of this phase (3-5 items, one sentence each)
- External info sources used (URLs, lit IDs, etc., if any)
- Output file path and approximate line count
- Unexpected situations or issues needing Director's attention (skip if none)
```

After the summary subagent returns, the Director validates the output per `references/output-validation.md` (research phase checklist).

## Raw Material Persistence Protocol (Reference for Subagent Prompts)

Every WebSearch and WebFetch call during the research MUST be persisted immediately to a local file by the search subagent. This ensures raw data survives beyond the subagent's context window.

**Directory**: `{task_dir}/iterations/iter_{NN}_research/`

**File naming**: `{seq}_{type}_{slug}.md`
- `seq`: 3-digit zero-padded, globally incrementing (Director tracks and provides the next sequence number to each subagent).
- `type`: `search` (WebSearch) or `fetch` (WebFetch).
- `slug`: Derived from the search query or URL — lowercase, spaces to hyphens, strip non-alphanumeric (keep hyphens), truncate at 40 chars, no trailing hyphen.

**File format** (YAML frontmatter + full raw content):

```yaml
---
seq: 1
type: search | fetch
query: "the search query string or the fetched URL"
direction: "parent research direction name"
layer: 1
timestamp: {ISO 8601}
relevance: null
importance: null
---

[Full raw content — no truncation]
```

- `relevance` and `importance` are initially `null`, backfilled by the Director after scoring in Step 2.2.
- For `fetch` type, `query` contains the URL. For `search` type, `query` contains the search query string.

## Error Handling

- If a search subagent yields no valuable info: The Director marks `[Insufficient Info]` in the scoring table, estimates relevance and importance based on existing knowledge, lets user decide whether to continue.
- Network access fails in subagent: The Director marks `[Network Failed]` on the corresponding item, provides best estimate based on existing knowledge.
- If an issue remains ultimately unresolved: The Director marks `[Unresolved]` in the summary, explains the paths attempted, passes to the design phase.

## Output Contract

- **Summary**: `{task_dir}/iterations/iter_{NN}_research.md` (produced by summary subagent, validated by Director)
- **Raw materials**: `{task_dir}/iterations/iter_{NN}_research/` (one file per WebSearch/WebFetch call, persisted by search subagents during the loop)
- **memory_draft update**: If important technical constraints, known pitfalls, or key technical decisions are found, the Director appends to `{task_dir}/memory_draft.md`, format: `[{timestamp}] [research] {content}`

## Tools Used by Director

AskUserQuestion (user pruning decisions), Agent (dispatch search/summary subagents), Read, Edit (backfill scores), Glob (verify raw material files), Bash (mkdir)

## Tools Allowed for Search Subagents

WebSearch, WebFetch, Write, Bash (mkdir), Read

## Tools Allowed for Summary Subagent

Read, Write, Glob, Grep
