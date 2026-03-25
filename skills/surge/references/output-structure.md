# Directory Structure & File Naming

This document defines the directory structure and file naming conventions for surge runtime.

---

## Top-Level Directory Structure

```
{surge_root}/
├── tasks/                  ← Root directory for all tasks
│   └── {task_id}/          ← Context Package for a single task
├── candidates/             ← Storage area for candidate SKILLs
└── rules.md                ← Global rules (initialized from assets/rules.md)
```

---

## Single Task Directory Structure (Runtime)

```
{surge_root}/tasks/{task_id}/
├── context.md              ← PRD + Background knowledge
├── state.md                ← Task state (solely maintained by Director)
├── topology.md             ← Task topology report + Role planning
├── deliverables.md         ← Deliverables negotiation result (Step 4)
├── acceptance.md           ← Tiered acceptance criteria (Step 5)
├── test_cases.md           ← Independently accumulated evolving test suite
├── memory_draft.md         ← Process experience records (append mode)
├── retro.md                ← Retrospective report (retro phase output)
├── iterations/             ← Phase output files for each iteration
│   ├── .gitkeep
│   ├── iter_01_analyze.md
│   ├── iter_01_research.md
│   ├── iter_01_research/            # Raw research materials (WebSearch/WebFetch results)
│   │   ├── 001_search_xxx.md
│   │   ├── 002_fetch_yyy.md
│   │   └── ...
│   ├── iter_01_design.md
│   ├── iter_01_implement.md
│   ├── iter_01_qa.md
│   ├── iter_02_analyze.md
│   └── ...
└── output/                 ← Final deliverables (only for document/mixed types)
    └── ...
```

---

## File Naming Rules

### Iteration Phase Output Files

All phase output files use versioned naming and are stored in the `iterations/` directory:

```
iter_{NN}_{phase}.md
```

| Placeholder | Description | Example |
|-------------|-------------|---------|
| `{NN}` | Two-digit zero-padded iteration number | `01`, `02`, `03` |
| `{phase}` | Phase name | `analyze`, `research`, `design`, `implement`, `qa` |

**Examples**:
- `iter_01_analyze.md` — Round 1 Requirements Analysis
- `iter_02_design.md` — Round 2 Architecture Design
- `iter_03_qa.md` — Round 3 QA Acceptance

### Parallel Mode Output Files (implement phase)

When there are multiple parallel modules in the implement phase, the independent output of each subagent is named:

```
iter_{NN}_implement_{module}.md
```

| Placeholder | Description | Example |
|-------------|-------------|---------|
| `{module}` | Module name (from task package naming in design phase) | `auth`, `api`, `frontend` |

**Examples**:
- `iter_01_implement_auth.md` — Round 1 Auth Module Implementation
- `iter_01_implement_api.md` — Round 1 API Module Implementation

After all parallel subagents complete, the Director merges the module outputs into `iter_{NN}_implement.md`.

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

### Research Raw Material Files

During the research phase, each WebSearch/WebFetch call is persisted as an individual file in a dedicated subdirectory:

```
iterations/iter_{NN}_research/{seq}_{type}_{slug}.md
```

| Placeholder | Description | Example |
|-------------|-------------|---------|
| `{seq}` | 3-digit zero-padded global sequence number (increments across all layers/directions) | `001`, `002`, `013` |
| `{type}` | `search` (WebSearch) or `fetch` (WebFetch) | `search` |
| `{slug}` | Sanitized query/URL: lowercase, spaces→hyphens, non-alphanumeric stripped (keep hyphens), max 40 chars, no trailing hyphen | `react-server-components` |

Each file contains YAML frontmatter followed by the full raw content:

```yaml
---
seq: 1
type: search | fetch
query: "search query or fetched URL"
direction: "parent research direction name"
layer: 2
timestamp: 2026-03-25T10:30:00
relevance: 4
importance: 5
---

[Full raw content — no truncation]
```

- `relevance` and `importance` are initially `null`, backfilled after scoring in Step 2.2.
- For `fetch` type, `query` contains the URL. For `search` type, `query` contains the search query string.

**Examples**:
- `iter_01_research/001_search_react-server-components.md`
- `iter_01_research/002_fetch_vercel-docs-isr.md`

---

## Output Files for Each Phase

| Phase | Output File | Description |
|-------|-------------|-------------|
| analyze | `iter_{NN}_analyze.md` | Requirements analysis report |
| research | `iter_{NN}_research.md` + `iter_{NN}_research/` | Tech research summary + raw materials directory (optional, skippable) |
| design | `iter_{NN}_design.md` | Architecture design doc, incl. parallel task list |
| design (expert review) | `iter_{NN}_expert_review_{role_slug}.md` | Individual expert review from each panel member |
| design (synthesis) | `iter_{NN}_expert_synthesis.md` | Consolidated expert review synthesis report |
| implement | `iter_{NN}_implement.md` | Implementation report (merged file if parallel) |
| implement (parallel sub) | `iter_{NN}_implement_{module}.md` | Independent report for each parallel module |
| qa | `iter_{NN}_qa.md` | QA acceptance report, incl. three-value conclusion |
| retro | `retro.md` | Retro report (not in iterations/, directly in task root) |

---

## output/ Directory Instructions

The `output/` directory is **ONLY used when `deliverable_type` is `document` or `mixed`**.

### Creation Timing

After Step 4 Deliverables Negotiation, if `deliverable_type` is `document` or `mixed`, Director ensures `output_dir` exists.

### Path Rules

- **Default Path**: `{surge_root}/tasks/{task_id}/output/`
- **User can specify external path to override**: Recorded in `output_dir` field of `deliverables.md`

### Purpose

- The final deliverables of document-type outputs are stored here.
- Code-type outputs are written directly to `project_root` declared in `deliverables.md`, not using output/.

---

## Path Reference Conventions

In Director and phase prompts, use the following placeholders to reference paths:

| Placeholder | Meaning |
|-------------|---------|
| `{surge_root}` | Workspace directory determined in Step 1 |
| `{task_id}` | Task ID determined in Step 1 |
| `{N}` | Current iteration number (`iteration` in `state.md`) |
| `{N-1}` | Previous iteration number |
| `{NN}` | Two-digit zero-padded iteration number (e.g., `01`, `02`) |