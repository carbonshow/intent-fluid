# Intent-Fluid Skills Framework: Quick Reference Cheat Sheet

## 📋 TL;DR

**Intent-Fluid** is a mature skill framework with:
- ✅ Canonical spec (SKILL_SPEC.md v2.0) enforced by validator
- ✅ Cross-platform distribution (Claude Code, Cursor, Gemini)
- ✅ One production skill (surge v1.0.1) with 28KB of orchestration logic
- ✅ Structured tracing & real-time observability
- ✅ Independent skill versioning + semantic repo versioning

---

## 🎯 Creating a New Skill (5-Minute Workflow)

```bash
# 1. Create directory
mkdir skills/my-skill

# 2. Create minimal SKILL.md
cat > skills/my-skill/SKILL.md << 'SKILL'
---
name: my-skill
description: "Use when ... (trigger condition, ≤1024 chars)"
version: "0.1.0"
author: your-name
tags: [tag1, tag2]
platforms: [claude, cursor, gemini]
---

# my-skill

You are [role description].

## Workflow

1. [Step 1]
2. [Step 2]
SKILL

# 3. Validate
bash scripts/validate-skill.sh skills/my-skill

# 4. (Optional) Add supporting materials
mkdir -p skills/my-skill/{references,scripts,assets}
```

**Result**: Minimal skill ready for cross-platform distribution ✅

---

## 📦 Skill Directory Structure (SKILL_SPEC v2.0)

| Path | Required | Purpose |
|------|----------|---------|
| `SKILL.md` | ✅ Yes | Metadata + workflow definition |
| `references/` | ❌ No | On-demand detailed materials |
| `scripts/` | ❌ No | Deterministic automation |
| `assets/` | ❌ No | Templates, boilerplate |
| `agents/openai.yaml` | ❌ No | UI metadata for skill pickers |

**❌ FORBIDDEN**: README.md, CHANGELOG.md, other top-level directories

---

## 🔍 Skill Naming Rules

- **Format**: `[a-z0-9-]` (lowercase, hyphens only)
- **Length**: 2-50 chars recommended
- **Must Match**: Directory name ↔ `name` field in SKILL.md frontmatter
- **Examples**: `surge`, `code-review`, `tdd-guard`

---

## 📝 SKILL.md Frontmatter

### Required
```yaml
---
name: my-skill
description: "Describe WHEN to use, not HOW it works (≤1024 chars)"
---
```

### Recommended
```yaml
---
name: my-skill
description: "..."
version: "1.0.0"                        # semver
author: author-name
tags: [orchestration, prd, delivery]    # discovery
platforms: [claude, cursor, gemini]     # compatibility
---
```

### Advanced (Optional)
```yaml
---
name: my-skill
# ...
trace:                                  # workflow structure for observability
  steps: [analyze, design, implement]
  topology: linear|cyclic|dag           # cyclic = iterative
  max_rounds: 5                          # max iterations
---
```

---

## ✅ Skill Validation

```bash
bash scripts/validate-skill.sh skills/<skill-name>
```

**Checks**:
1. Directory name: `[a-z0-9-]` ✓
2. SKILL.md exists ✓
3. YAML frontmatter present ✓
4. `name` field matches directory ✓
5. `description` exists and ≤1024 chars ✓
6. NO `README.md` (spec violation) ✓
7. Only allowed top-level entries ✓
8. Trace frontmatter valid (if present) ✓

---

## 🌍 Cross-Platform Distribution

### Installation Commands

| Platform | Command |
|----------|---------|
| **Claude Code** | `/plugin marketplace add carbonshow/intent-fluid` |
| **Cursor** | Add `https://github.com/carbonshow/intent-fluid` as rule source |
| **Gemini CLI** | `gemini extensions install https://github.com/carbonshow/intent-fluid` |
| **Manual** | Clone repo, point AI tool to `skills/` directory |

### Plugin Manifests
- `.claude-plugin/plugin.json` — Claude Code metadata
- `.claude-plugin/marketplace.json` — Claude marketplace listing
- `.cursor-plugin/plugin.json` — Cursor metadata
- `gemini-extension.json` — Gemini CLI metadata

---

## 🏷️ Versioning Strategy

### Repository Version (package.json + git tags)
```json
{
  "name": "intent-fluid",
  "version": "1.0.1"
}
```

**Bumped when**:
- New skill added → minor bump (`1.0.0` → `1.1.0`)
- Breaking spec change → major bump (`1.0.0` → `2.0.0`)
- Plugin manifest changes → patch bump (`1.0.0` → `1.0.1`)
- Docs only → no release

### Skill Version (SKILL.md frontmatter)
Each skill has **independent** semver in `SKILL.md`:
```yaml
---
name: my-skill
version: "1.0.0"  # Independent from repo version
---
```

**Bumped when**:
- Skill bug fix → patch (`1.0.0` → `1.0.1`)
- Skill new feature → minor (`1.0.0` → `1.1.0`)

---

## 🚀 Release Process

```bash
# 1. Update versions
vim package.json                        # e.g., 1.0.1 → 1.0.2
vim skills/modified-skill/SKILL.md     # e.g., 0.1.0 → 0.2.0

# 2. Update changelog (Keep a Changelog format)
vim CHANGELOG.md                        # Add ## [X.Y.Z] - YYYY-MM-DD section

# 3. Validate
for dir in skills/*/; do
  bash scripts/validate-skill.sh "$dir"
done
python3 -m json.tool .claude-plugin/plugin.json > /dev/null

# 4. Commit, tag, push
git add -A
git commit -m "release: vX.Y.Z"
git tag vX.Y.Z
git push origin main --tags
```

---

## 📊 Surge Skill Overview (Example)

### Metadata
- **Version**: 1.0.1
- **Author**: carbonshow
- **Platforms**: Claude, Cursor, Gemini
- **Topology**: cyclic (iterative), max 5 rounds
- **Tags**: orchestration, prd, delivery, multi-agent

### Use Case
> "Use when a user provides a PRD and needs a full project delivered through iterative expert orchestration"

### Main Workflow
1. **Startup**: Config negotiation, context initialization
2. **Analyze**: Parse requirements, identify ambiguities
3. **Research**: Gather market/domain data (optional)
4. **Design**: Architecture + expert review panel
5. **Implement**: Code generation (serial or parallel)
6. **QA**: Acceptance testing, convergence check
7. **Retro**: Process retrospective + memory extraction

### Key Assets
- **SKILL.md**: 28KB, 313 lines, comprehensive orchestration rules
- **references/**: 9 files + 6 phase templates
- **scripts/**: init.sh, state.sh, merge-parallel.sh
- **assets/**: rules.md (constraint library)

### Context Package Structure
```
{surge_root}/tasks/{task_id}/
├── context.md                   # PRD + background
├── state.md                     # Task state (Director-maintained)
├── topology.md                  # Task topology + roles
├── deliverables.md              # Deliverable config
├── acceptance.md                # Tiered acceptance criteria
├── trace.jsonl                  # Execution trace events (JSONL)
├── iterations/
│   ├── iter_01_analyze.md
│   ├── iter_01_design.md
│   ├── iter_01_implement.md     # or _implement_{module}.md for parallel
│   ├── iter_01_qa.md
│   └── ...
└── output/                      # Final deliverables
```

---

## 🔬 Execution Tracing (Observability)

### Trace File
Each task produces: `{task_dir}/trace.jsonl` (JSONL format, append mode)

### Event Structure
```json
{
  "id": "evt_001",
  "ts": "2026-03-27T18:00:20Z",
  "skill": "surge",
  "type": "step_start|agent_dispatch|agent_return|step_end|error",
  "step": "analyze|research|design|implement|qa|retro",
  "round": 1,
  "agent": "director|subagent:analyze",
  "status": "executing|completed|failed",
  "status_display": "⚡ Analyzing requirements",
  "detail": {...},
  "parent_id": "evt_000",
  "tags": ["key:value"]
}
```

### Trace Tools
```bash
# Emit event
bash scripts/trace.sh <trace_file> <skill> <type> <step> <round> <agent> [detail_json]

# Export to Mermaid DAG
bash scripts/trace-export.sh <trace_file>

# Start real-time dashboard
bash scripts/dashboard.sh start <task_dir> --skill-dir <skill_dir>
bash scripts/dashboard.sh stop <task_dir>
```

### Outputs
- `execution_dag.mmd` — Mermaid visualization
- `execution_summary.md` — Markdown table
- Real-time web dashboard (port auto-assigned)
- JSONL passthrough (Datadog, Grafana ingestion)

---

## 📚 Documentation Hierarchy

### Repository-Level (`docs/`)
- **SKILL_SPEC.md** — Canonical skill specification (v2.0) ⭐
- **SKILL_TEMPLATE.md** — Template for new skill authors
- **INSTALL.md** — Platform installation guide
- **RELEASING.md** — Release & versioning process
- **TRACE_SPEC.md** — Execution trace protocol (v1.0)

### Skill-Level (`skills/<skill>/references/`)
- Phase templates (analyze, research, design, implement, qa, retro)
- Detailed guides (startup, qa-handling, state-schema, etc.)
- Expert library, output validation procedures

### User-Facing (`docs/` + root)
- README.md — Feature overview, quick start
- INSTALL.md — How to install on Claude/Cursor/Gemini
- GEMINI.md — Gemini CLI specific instructions

---

## 🛠️ Progressive Disclosure Pattern

**Keep SKILL.md focused** (< 500 lines):

1. **Main file**: Role description, key gotchas, high-level workflow
2. **On-demand references**: Load via explicit instructions in SKILL.md
3. **Example**: "Read `references/detailed-guide.md` when implementing X"

**Benefits**:
- ✅ Smaller context load for agents
- ✅ Clear progression from overview to detail
- ✅ Easier to update and maintain

---

## 🎯 Token Budget Best Practices

From surge:
- Pass **summaries** of upstream outputs, not full documents
- Trim older iterations if iteration ≥ 3
- Use research-by-reference (link vs. embed)
- If subagent prompt > ~40% of context window (~80K chars), reduce scope

---

## 🧪 Testing Skills

Test PRDs for surge skill are in `tests/skills/surge/`:
- `aura-link.md`
- `nexus-burst.md`
- `nova-logic.md`
- `subscription-fluid-tracker.md`
- `titan-rank.md`

Each is a markdown PRD demonstrating surge capabilities.

---

## 🔗 Key Links

- **Repository**: https://github.com/carbonshow/intent-fluid
- **License**: MIT
- **Author**: carbonshow
- **Current Version**: 1.0.1 (released 2026-03-31)

---

## 📖 Reference Files Quick Index

| File | Version | Purpose |
|------|---------|---------|
| SKILL_SPEC.md | 2.0 | Canonical skill developer spec |
| TRACE_SPEC.md | 1.0 | Execution trace protocol |
| validate-skill.sh | — | Validator script |
| trace.sh | — | Trace event emitter |
| trace-export.sh | — | Trace exporter |
| dashboard.sh | — | Real-time dashboard |

---

## ✨ One-Liner Commands

```bash
# Validate a skill
bash scripts/validate-skill.sh skills/surge

# Validate all skills
for dir in skills/*/; do bash scripts/validate-skill.sh "$dir"; done

# Emit trace event
bash scripts/trace.sh trace.jsonl surge step_start analyze 1 director

# Export trace
bash scripts/trace-export.sh .surge/tasks/my-task/trace.jsonl

# Check versions
jq .version package.json
grep -A1 "^version:" skills/surge/SKILL.md

# Release
git commit -m "release: v1.0.2" && git tag v1.0.2 && git push origin main --tags
```

---

**Last Updated**: 2026-03-31  
**For latest info**: See `/Users/wenzhitao/Projects/github/intent-fluid/EXPLORATION.md`
