# Intent-Fluid Skills Directory Exploration Report

## Executive Summary

**Intent-Fluid** is a sophisticated AI skills framework for transforming human intent into autonomous execution. It's built on a unified skill specification (SKILL_SPEC.md) with cross-platform distribution across Claude Code, Cursor, and Gemini CLI. Currently, only the **surge** skill exists as a fully-featured example.

---

## 1. Project Root Structure

### Location
```
/Users/wenzhitao/Projects/github/intent-fluid/
```

### Key Files & Directories

```
intent-fluid/
├── package.json              # Project metadata, version 1.0.1
├── README.md                 # Main documentation, feature overview
├── LICENSE                   # MIT License
├── CHANGELOG.md              # Semantic versioning changelog
├── GEMINI.md                 # Gemini CLI context file
│
├── docs/                     # Repository-level documentation
│   ├── SKILL_SPEC.md         # **Canonical skill developer spec (VERSION 2.0)**
│   ├── SKILL_TEMPLATE.md     # Template for creating new skills
│   ├── INSTALL.md            # Platform-specific installation guide
│   ├── RELEASING.md          # Release process & version management
│   └── TRACE_SPEC.md         # Execution tracing protocol (v1.0)
│
├── scripts/                  # Framework-level utilities (repo-wide)
│   ├── validate-skill.sh     # Validates skill directory structure
│   ├── trace.sh              # Emits trace events to JSONL
│   ├── trace-export.sh       # Exports trace to Mermaid/markdown/ASCII
│   ├── dashboard.sh          # Starts/stops real-time visualization
│   └── dashboard-server.js   # Web server for trace dashboard
│
├── skills/                   # **Skill implementations**
│   └── surge/                # Current production skill (v1.0.1)
│       ├── SKILL.md          # Skill definition & orchestration rules
│       ├── references/       # On-demand reference materials
│       ├── scripts/          # Skill-specific executables
│       └── assets/           # Output templates & boilerplate
│
├── .claude-plugin/           # Claude Code plugin metadata
│   ├── plugin.json
│   └── marketplace.json
│
├── .cursor-plugin/           # Cursor plugin metadata
│   └── plugin.json
│
├── gemini-extension.json     # Gemini CLI extension metadata
│
├── assets/                   # Repository-level marketing assets
│   ├── images/               # PNG: hero-banner, architecture, pipeline, before-after
│   └── videos/               # Demo video (mp4, keynote)
│
└── tests/                    # Test specifications (PRDs for surge)
    └── skills/surge/         # Example Surge tasks as markdown
        ├── aura-link.md
        ├── nexus-burst.md
        ├── nova-logic.md
        ├── subscription-fluid-tracker.md
        └── titan-rank.md
```

### Version Management
- **Repository version**: Tracked via semver in `package.json` and git tags (`v1.0.1`)
- **Skill versions**: Independent per-skill versioning in `SKILL.md` frontmatter
- **Current repo version**: 1.0.1 (released 2026-03-31)

---

## 2. Canonical Skill Specification (SKILL_SPEC.md v2.0)

### Core Principle
> "`SKILL.md` is the product. Keep context lean, prefer progressive disclosure."

### Canonical Directory Layout

**Minimal skill (required only)**:
```
skills/<skill-name>/
└── SKILL.md
```

**Full-featured skill**:
```
skills/<skill-name>/
├── SKILL.md                    # Required: frontmatter + markdown body
├── agents/
│   └── openai.yaml             # Optional: UI metadata for skill pickers
├── scripts/                    # Optional: executable deterministic helpers
│   └── *.sh
├── references/                 # Optional: on-demand reference docs
│   └── *.md
└── assets/                     # Optional: output templates, boilerplate
    └── *.*
```

### Naming Rules
- Directory name: `[a-z0-9-]` only (lowercase alphanumeric + hyphens)
- Length: 2-50 characters recommended
- Examples: `surge`, `code-review`, `tdd-guard`

### `SKILL.md` Contract

#### Required Frontmatter
```yaml
---
name: my-skill
description: "Use when ..."  # ≤1024 chars, trigger-focused
---
```

#### Optional Frontmatter
```yaml
---
name: my-skill
description: "..."
version: "1.0.0"                    # semver recommended
author: author-name                 # free text
tags: [tag1, tag2]                  # discovery tags
platforms: [claude, cursor, gemini] # compatibility
trace:                              # workflow structure (optional)
  steps: [step1, step2, step3]      # ordered step names
  topology: linear|cyclic|dag       # workflow shape
  max_rounds: 5                      # iterations (default: 1 for linear, 5 for cyclic)
---
```

#### Body Requirements
- Start with `# <skill-name>`
- Describe agent role in second person
- List gotchas near the top for fragile workflows
- Use relative paths for resources
- Keep concise (< 500 lines when practical)
- Use `references/` for bulky details

### Validation
All skills must pass:
```bash
bash scripts/validate-skill.sh skills/<skill-name>
```

Enforces:
- Valid directory name (`[a-z0-9-]`)
- `SKILL.md` exists
- YAML frontmatter present
- `name` field exists and matches directory name
- `description` exists and ≤1024 chars
- NO `README.md` inside skill (spec violation)
- Only allowed top-level entries: `SKILL.md`, `agents/`, `scripts/`, `references/`, `assets/`

### Deliberately Excluded Files
❌ No: README.md, CHANGELOG.md, INSTALLATION_GUIDE.md, ad-hoc notes
✅ Use: Repository-level docs under `docs/`

---

## 3. The Surge Skill: A Full Example

### Location & Metadata
```
skills/surge/
├── version: 1.0.1
├── author: carbonshow
├── tags: [orchestration, prd, delivery, multi-agent]
├── platforms: [claude, cursor, gemini]
└── topology: cyclic, max_rounds: 5
```

### Purpose
**Use when**: User provides PRD/spec and needs a full project delivered through iterative expert orchestration — multi-round analyze/research/design/implement/QA cycles with convergence detection.

**NOT for**: Single-file edits, quick prototypes, simple Q&A, tasks without written spec.

### Directory Structure
```
surge/
├── SKILL.md                         # 28KB, comprehensive workflow doc
├── references/                      # On-demand reference materials
│   ├── startup.md                   # Detailed startup steps, config schema, Resume Protocol
│   ├── qa-handling.md               # QA 3-value logic, convergence, Director Override
│   ├── state-schema.md              # state.md field definitions
│   ├── output-structure.md          # Directory structure & file naming conventions
│   ├── output-validation.md         # Output integrity checks & recovery procedures
│   ├── process-output.md            # Per-phase process summary requirements
│   ├── token-budget.md              # Context window management rules
│   ├── expert-review.md             # Expert role library & synthesis format
│   └── phases/                      # Prompt templates for each phase
│       ├── analyze.md
│       ├── research.md
│       ├── design.md
│       ├── implement.md
│       ├── qa.md
│       └── retro.md
├── scripts/                         # Skill-specific automation
│   ├── init.sh                      # Initialize task directory + trace.jsonl
│   ├── state.sh                     # Read/update state.md fields (CLI wrapper)
│   └── merge-parallel.sh            # Merge parallel implement outputs
└── assets/
    └── rules.md                     # Global constraints (NEVER/ALWAYS/PREFER)
```

### Core Flow

**Startup Phase**:
1. Determine workspace & task ID
2. Initialize context package (run `init.sh`)
3. Task topology analysis → write `topology.md`
4. Deliverables negotiation → write `deliverables.md`
5. Acceptance criteria negotiation → write `acceptance.md`

**Main Iteration Loop** (repeats until convergence):
- **Analyze**: Parse requirements, identify ambiguities
- **Research**: Gather market/domain/competitive data (conditionally skippable)
- **Design**: Create architecture, assemble expert panel for review
- **Implement**: Code generation (serial or parallel by module)
- **QA**: Acceptance testing, convergence evaluation
- **Decision**: Continue iteration or proceed to retro

**Completion**:
- Execute **retro** subagent (retrospective & process memory extraction)
- Display final deliverables
- Persist task data to `{surge_root}/tasks/{task_id}/`

### Key Concepts

#### Context Package
Complete directory at `{surge_root}/tasks/{task_id}/` containing:
- `context.md` — PRD + background knowledge
- `state.md` — Director-maintained task state
- `topology.md` — Task topology + role planning
- `deliverables.md` — Deliverable type & config
- `acceptance.md` — Tiered acceptance criteria
- `test_cases.md` — Accumulated test suite
- `memory_draft.md` — Process experience log
- `trace.jsonl` — Execution trace (JSONL append mode)
- `iterations/` — Per-phase output files
- `output/` — Final deliverables (document/mixed types)

#### File Naming Convention
- Phase outputs: `iter_{NN}_{phase}.md` (NN = zero-padded iteration number)
- Parallel modules: `iter_{NN}_implement_{module}.md` → merged by `merge-parallel.sh`
- Expert reviews: `iter_{NN}_expert_review_{role}.md` + `iter_{NN}_expert_synthesis.md`

#### Trace Protocol (JSONL)
Each task produces `{task_dir}/trace.jsonl` with structured events:
```json
{
  "id": "evt_001",
  "ts": "2026-03-27T18:00:20Z",
  "skill": "surge",
  "type": "step_start|agent_dispatch|agent_return|step_end|error|checkpoint|decision",
  "step": "analyze|research|design|implement|qa|retro",
  "round": 1,
  "agent": "director|subagent:analyze|subagent:design",
  "status": "executing|completed|failed|validating",
  "status_display": "⚡ Analyzing requirements",
  "detail": {...},
  "parent_id": "evt_000",
  "tags": ["key:value"]
}
```

Events are used by:
- Real-time dashboard visualization
- Static export to Mermaid DAGs
- External observability (Datadog, Grafana, jq)

#### State Management
`state.md` fields maintained via `scripts/state.sh`:
```bash
bash scripts/state.sh get <state_file> <field>
bash scripts/state.sh set <state_file> <field> <value>
```

### Critical Gotchas (from SKILL.md)

**CRITICAL** — Data loss if violated:
1. **Research Raw Materials Lost**: WebSearch/WebFetch results MUST persist to `iter_{NN}_research/` immediately after each call
2. **CWD Drift**: Always use ABSOLUTE paths after subagent returns (they may `cd`)
3. **state.md Field Omission**: Use `scripts/state.sh` not manual editing
4. **Output Truncation**: Always run Output Integrity Validation before proceeding
5. **Design Checkpoint Stale**: Reset `design_checkpoint` to `null` when entering design phase

**IMPORTANT** — Quality/convergence issues:
1. **QA Never Converges**: Override QA if all criteria pass + all dimensions ≥ Good
2. **Parallel Context Missing**: Each subagent needs deliverables.md + task package + context.md
3. **Missing Process Output**: MANDATORY after every phase (users need to see progress)
4. **Quality Oscillation**: If same dimension bounces 3 rounds, lock it or ask user
5. **Optimization Directives Fail**: If same directive unexecuted 2 rounds, don't retry
6. **Ambiguity Auto-Fill**: Don't fill P0 ambiguities; ask user for clarification
7. **Expert Panel Budget**: Pass summaries (not full designs), hard cap 5 experts

---

## 4. Cross-Platform Distribution

### Plugin Manifests

**Claude Code** (`.claude-plugin/plugin.json`):
```json
{
  "name": "intent-fluid",
  "version": "1.0.1",
  "description": "Transforming human intent into autonomous execution with AI Skills",
  "repository": "https://github.com/carbonshow/intent-fluid",
  "keywords": ["skills", "ai-orchestration", "workflow", "prd", "multi-agent"]
}
```

**Claude Marketplace** (`.claude-plugin/marketplace.json`):
```json
{
  "plugins": [
    {
      "name": "intent-fluid",
      "source": "./",
      "version": "1.0.1"
    }
  ]
}
```

**Cursor** (`.cursor-plugin/plugin.json`):
```json
{
  "name": "intent-fluid",
  "version": "1.0.1",
  "skills": "./skills/"
}
```

**Gemini CLI** (`gemini-extension.json`):
```json
{
  "name": "intent-fluid",
  "version": "1.0.1",
  "contextFileName": "GEMINI.md"
}
```

### Installation Methods

| Platform | Command |
|----------|---------|
| Claude Code (marketplace) | `/plugin marketplace add carbonshow/intent-fluid` |
| Claude Code (local dev) | `/plugin add .` (from cloned repo) |
| Cursor | Add as rule source: `https://github.com/carbonshow/intent-fluid` |
| Gemini CLI | `gemini extensions install https://github.com/carbonshow/intent-fluid` |
| Manual (any) | Clone + configure AI tool to scan `skills/` directory |

---

## 5. Release & Versioning Process

### Version Tracking
- **Repository version**: `package.json` + git tags (`vX.Y.Z`)
- **Skill versions**: Independent in each skill's `SKILL.md` frontmatter
- **When to bump**: See RELEASING.md

| Change | Repo Version | Skill Version |
|--------|-------------|---------------|
| New skill | minor | N/A (starts at 0.1.0 or 1.0.0) |
| Breaking change to spec | major | — |
| Skill bug fix | patch | patch |
| Skill new feature | minor | minor |
| Plugin manifest | patch | — |
| Docs only | — (no release) | — |

### Release Checklist
1. Update `package.json` version
2. Update modified skill `SKILL.md` versions
3. Update `CHANGELOG.md` (Keep a Changelog format)
4. Commit: `git commit -m "release: vX.Y.Z"`
5. Tag: `git tag vX.Y.Z`
6. Push: `git push origin main --tags`

### Pre-Release Validation
```bash
# Validate all skills
for dir in skills/*/; do
  bash scripts/validate-skill.sh "$dir"
done

# Verify JSON manifests
python3 -m json.tool .claude-plugin/plugin.json > /dev/null
python3 -m json.tool .claude-plugin/marketplace.json > /dev/null
python3 -m json.tool .cursor-plugin/plugin.json > /dev/null
python3 -m json.tool gemini-extension.json > /dev/null
```

---

## 6. Key Conventions & Patterns

### Skill Naming Conventions
- **Lowercase alphanumeric + hyphens**: `surge`, `code-review`, `tdd-guard`
- **Directory name MUST match** `SKILL.md` frontmatter `name` field

### Progressive Disclosure Pattern
1. Keep `SKILL.md` focused (< 500 lines)
2. Move bulk material to `references/` subdirectory
3. Load reference files on-demand via explicit instructions
4. SKILL.md tells agent **when** to read which reference file

### Script Naming
- Keep executables in `scripts/` directory
- Scripts should be deterministic (no interactive prompts)
- Usage comment at top of script
- Pass parameters explicitly (no env vars assumed)

### Token Budget Best Practices (from surge)
- Pass **summaries** of upstream outputs, not full documents
- Rolling context windows: trim older iterations if iteration ≥ 3
- Research-by-reference: Link to search results rather than embedding full content
- Estimate: If subagent prompt > ~40% of context window (~80K chars), apply scope reduction

### Shared Patterns in Surge

1. **Subagent Dispatch via Agent Tool**
   - Read phase template from `references/phases/{phase}.md`
   - Append context files to prompt
   - Emit trace event: `bash scripts/trace.sh ...`
   - Call Agent tool with assembled prompt
   - Validate output integrity before processing

2. **Output Validation Workflow**
   - Classify: PASS / MINOR_TRUNCATION / SEVERE_TRUNCATION
   - Recovery: Completion Retry → Scoped Retry → Task Splitting Retry → User Escalation

3. **State Management**
   - All state in `state.md` (single source of truth)
   - Use `scripts/state.sh` for all reads/writes
   - Include in every phase dispatch

4. **User Interaction Gates**
   - **Ambiguity Escalation**: After Analyze, present P0/3+ phase ambiguities to user
   - **Design Checkpoints**: 4 user confirmation points during design phase
   - **Convergence Review**: Before entering retro, confirm completion with user

5. **Process Memory Extraction**
   - After each iteration, append to `memory_draft.md`
   - Format: `[{timestamp}] [{trigger_reason}] {content}`
   - Retro phase uses memory for rule refinement suggestions

---

## 7. Framework-Level Utilities

### `validate-skill.sh`
**Purpose**: Enforces SKILL_SPEC.md compliance
**Checks**:
- Valid directory name: `[a-z0-9-]`
- SKILL.md exists
- YAML frontmatter present
- Required fields: `name`, `description`
- Name matches directory name
- Description ≤ 1024 chars
- NO README.md (forbidden)
- Only allowed top-level directories
- Trace frontmatter validation (if present)

**Usage**:
```bash
bash scripts/validate-skill.sh skills/<skill-name>
```

### `trace.sh`
**Purpose**: Emit structured trace events to JSONL
**Signature**:
```bash
bash scripts/trace.sh <trace_file> <skill> <event_type> <step> <round> <agent> [detail_json]
```

**Returns**: Event ID (auto-generated, stored for parent_id references)

**Event Types**: `step_start`, `step_end`, `agent_dispatch`, `agent_return`, `checkpoint`, `decision`, `error`

### `trace-export.sh`
**Purpose**: Export trace.jsonl to human-readable formats
**Outputs**:
- Mermaid DAG (`execution_dag.mmd`)
- Markdown table (`execution_summary.md`)
- ASCII timeline (stdout)

### `dashboard.sh`
**Purpose**: Start/stop real-time visualization server
**Usage**:
```bash
bash scripts/dashboard.sh start <task_dir> --skill-dir <surge_skill_dir>
bash scripts/dashboard.sh stop <task_dir>
```

**Port**: Auto-assigned, stored in `{task_dir}/.dashboard.pid`

---

## 8. Documentation Hierarchy

### Repository-Level Docs (`docs/`)
- `SKILL_SPEC.md` — **Canonical** skill developer spec (v2.0)
- `SKILL_TEMPLATE.md` — Template for new skill authors
- `INSTALL.md` — Platform-specific installation guide
- `RELEASING.md` — Release process & versioning
- `TRACE_SPEC.md` — Execution trace protocol (v1.0)

### Skill-Level Docs (`skills/<skill>/references/`)
- Phase templates: `phases/{analyze,research,design,implement,qa,retro}.md`
- Supporting materials: `startup.md`, `qa-handling.md`, `state-schema.md`, etc.

### User-Facing Docs (`docs/` + `README.md`)
- Main README: Feature overview, quick start, available skills
- INSTALL.md: How to add skills to Claude Code/Cursor/Gemini
- GEMINI.md: Gemini CLI specific instructions

---

## 9. Key Statistics

| Metric | Value |
|--------|-------|
| Current skills | 1 (surge) |
| Repository version | 1.0.1 |
| Surge skill version | 1.0.1 |
| SKILL_SPEC version | 2.0 |
| TRACE_SPEC version | 1.0 |
| Surge SKILL.md size | 28KB (313 lines) |
| Surge references (files) | 9 files + phases/ (6 templates) |
| Supported platforms | 3 (Claude Code, Cursor, Gemini CLI) |
| License | MIT |

---

## 10. Publishing & Distribution Summary

### How Skills Are Discovered
1. **Claude Code Marketplace**: Via `.claude-plugin/marketplace.json`
2. **Cursor**: As rule source or MCP server pointing to repo
3. **Gemini CLI**: Via `gemini-extension.json`
4. **Manual**: Clone repo + configure AI tool to scan `skills/` directory

### How Skills Are Versioned
- Each skill has **independent** version in `SKILL.md` frontmatter
- Repository version (in `package.json` + git tags) bumps when:
  - New skill added (minor bump)
  - Breaking change to SKILL_SPEC (major bump)
  - Plugin manifest changes (patch bump)

### How Skills Are Validated
- **Pre-release**: Run `bash scripts/validate-skill.sh skills/*` on all skills
- **CI/CD integration**: Validator enforces spec compliance
- **User-facing**: Agent detects skill automatically via manifest scanning

### Where Skills Are Tested
- `tests/skills/surge/` — Example PRDs demonstrating surge capabilities
- Each example is a markdown file with requirements + expected outputs

---

## Summary Table: Skill Organization

| Aspect | Convention | Example |
|--------|-----------|---------|
| **Naming** | `[a-z0-9-]`, 2-50 chars | `surge`, `code-review` |
| **Version** | Independent per skill | `1.0.1` in SKILL.md |
| **Metadata** | YAML frontmatter in SKILL.md | name, description, tags, platforms, trace |
| **Primary Asset** | SKILL.md + Markdown body | 28KB surge/SKILL.md |
| **On-Demand Refs** | `references/` subdirectory | 9 files + phases/ (6 templates) |
| **Automation** | `scripts/` subdirectory | init.sh, state.sh, merge-parallel.sh |
| **Boilerplate** | `assets/` subdirectory | rules.md template, output templates |
| **Validation** | Via `validate-skill.sh` | Enforces name match, no README, valid frontmatter |
| **Distribution** | Plugin manifests + git tags | claude-plugin/, cursor-plugin/, gemini-extension.json |
| **Release** | Semantic versioning | vX.Y.Z tags, CHANGELOG.md entries |

---

## Conclusion

Intent-Fluid is a **mature, well-documented skill framework** with:
- ✅ Clear canonical spec (SKILL_SPEC.md v2.0) enforced by validator
- ✅ Progressive disclosure pattern for managing complexity
- ✅ Cross-platform distribution infrastructure (Claude Code, Cursor, Gemini)
- ✅ Comprehensive reference materials for surge (28KB SKILL.md + 9 references)
- ✅ Structured versioning (repo + per-skill + trace protocol)
- ✅ Validated release process with pre-flight checks
- ✅ Execution tracing & real-time dashboard for observability
- ✅ MIT-licensed, open-source, author: carbonshow

**Ready for new skill creation** following SKILL_SPEC.md conventions.
