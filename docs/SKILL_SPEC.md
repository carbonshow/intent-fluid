# Skill Developer Specification

> Version 2.0 — the only canonical standard for authoring skills in intent-fluid.

## 1. Goal

This document is the single source of truth for skill structure in this repository.

Its purpose is to keep every skill small, predictable, and publishable across multiple authors. If any older README, template, or existing skill conflicts with this file, follow this file.

## 2. Core Principles

1. **`SKILL.md` is the product.** The main asset of a skill is its trigger metadata plus its operating instructions.
2. **Keep context lean.** Assume the model is already capable; only include repository-specific workflow, constraints, and resources it cannot infer.
3. **Prefer progressive disclosure.** Keep `SKILL.md` focused; move detailed material into `references/` and load it only when needed.
4. **Bundle only necessary resources.** If a file does not directly help the agent execute the skill, it should not live inside the skill.
5. **Do not add README by default.** Human-facing duplication inside a skill causes drift. A skill directory should usually contain only `SKILL.md` plus the minimum supporting resources.

## 3. Canonical Directory Layout

Every skill lives under `skills/<skill-name>/`. The directory name is the skill identifier.

Minimal layout:

```text
skills/<skill-name>/
`-- SKILL.md
```

Allowed extended layout:

```text
skills/<skill-name>/
|-- SKILL.md                # required
|-- agents/                 # optional, recommended for UI metadata only
|   `-- openai.yaml
|-- scripts/                # optional, executable helpers
|-- references/             # optional, on-demand reference docs or prompt fragments
`-- assets/                 # optional, files used in output but not meant for context loading
```

### Directory Policy

- `SKILL.md` is required.
- `agents/`, `scripts/`, `references/`, and `assets/` are allowed.
- Other top-level directories are not part of the standard and should be avoided unless the repo standard is explicitly extended.
- `README.md` inside a skill is discouraged and should be treated as a spec violation in this repository.
- If you think you need `phases/` or `templates/`, put those files under `references/` or `assets/` instead:
  - prompt fragments and phase instructions belong in `references/`
  - copyable runtime templates belong in `assets/`

## 4. Naming Rules

| Rule | Detail |
|------|--------|
| Character set | `[a-z0-9-]` only |
| Consistency | Directory name must exactly match the `name` field in `SKILL.md` |
| Length | 2-50 characters recommended |

Examples: `surge`, `code-review`, `tdd-guard`

## 5. `SKILL.md` Contract

`SKILL.md` has two parts: YAML frontmatter and a Markdown body.

### 5.1 Required Frontmatter

```yaml
---
name: my-skill
description: "Use when ..."
---
```

### 5.2 Supported Frontmatter Fields

```yaml
---
name: my-skill
description: "Use when ..."
version: "1.0.0"
author: your-name
tags: [tag1, tag2]
platforms: [claude, cursor, gemini]
---
```

| Field | Required | Constraints | Notes |
|-------|----------|-------------|-------|
| `name` | yes | `[a-z0-9-]`, should match directory name | canonical skill id |
| `description` | yes | <= 1024 chars | must describe when to activate the skill, not how it works |
| `version` | no | semver recommended | per-skill version |
| `author` | no | free text | skill author |
| `tags` | no | string array | discovery only |
| `platforms` | no | array of `claude`, `cursor`, `gemini` | compatibility declaration |
| `trace` | no | object | workflow declaration for execution tracing and dashboard support (see §5.3) |

### 5.3 Trace Frontmatter (Optional)

Skills can declare their workflow structure for execution tracing and real-time dashboard visualization. When present, the framework's trace tools (`scripts/trace.sh`, `scripts/trace-export.sh`, `scripts/dashboard.sh`) use this metadata to generate topology-aware visualizations.

```yaml
---
name: my-skill
description: "Use when ..."
trace:
  steps: [step1, step2, step3]
  topology: linear
  max_rounds: 1
---
```

| Subfield | Required (if trace present) | Type | Constraints | Description |
|----------|---------------------------|------|-------------|-------------|
| `steps` | yes | string[] | non-empty, `[a-z0-9-]` per element | ordered list of execution step names |
| `topology` | yes | string | `linear` \| `cyclic` \| `dag` | workflow shape — affects dashboard layout strategy |
| `max_rounds` | no | positive integer | default: 1 for linear, 5 for cyclic | maximum execution rounds |

**Topology values:**
- `linear` — single-pass execution, steps run once in order
- `cyclic` — iterative loop, steps may repeat across multiple rounds
- `dag` — general directed acyclic graph with branching/merging

See `docs/TRACE_SPEC.md` for the complete trace protocol specification and integration guide.

### 5.4 Body Requirements

The Markdown body should:

- start with `# <skill-name>`
- describe the agent role in second person
- keep core workflow in the main file
- list high-risk gotchas near the top when the workflow is fragile
- point to bundled resources with relative paths
- stay concise; split out large details before `SKILL.md` becomes bloated

### 5.5 Body Size Guidance

- Keep `SKILL.md` under 500 lines whenever practical.
- When the skill supports multiple variants, keep only routing logic in `SKILL.md` and move variant details into `references/`.
- For large reference files, add a short table of contents near the top.

## 6. Resource Rules

### `references/`

Use for material that may be read into context on demand:

- detailed workflow notes
- API or schema references
- phase prompt fragments
- domain-specific guides

Rules:

- do not duplicate content already written in `SKILL.md`
- keep references one level away from `SKILL.md`; avoid deep reference chains
- if a file is large, mention in `SKILL.md` when to read it

### `scripts/`

Use for deterministic or repetitive operations.

Rules:

- prefer a script when the same logic would otherwise be re-described repeatedly
- scripts should be executable and have a clear usage comment
- `SKILL.md` should tell the agent when to invoke the script

### `assets/`

Use for files that support outputs but should not normally be loaded into context.

Examples:

- runtime templates copied into a workspace
- icons, sample files, fonts
- boilerplate output artifacts

## 7. Deliberately Excluded Files

Do not place these inside a skill directory unless this spec is explicitly changed:

- `README.md`
- `CHANGELOG.md`
- `INSTALLATION_GUIDE.md`
- `QUICK_REFERENCE.md`
- ad hoc notes about how the skill was authored

Repository-level documentation belongs under `docs/`, not inside each skill.

## 8. Recommended `agents/openai.yaml`

If a skill is intended to appear in a UI list or skill picker, add:

```text
skills/<skill-name>/agents/openai.yaml
```

Rules:

- generate it from the actual `SKILL.md` content
- keep it aligned with the skill when the skill changes
- do not invent UI metadata that is unsupported by the skill itself

## 9. Validation Rules

Every skill must pass:

```bash
bash scripts/validate-skill.sh skills/<skill-name>
```

The repository validator enforces at least:

- valid skill directory name
- `SKILL.md` exists
- YAML frontmatter exists
- `name` exists and matches the directory name
- `description` exists and is within the length limit
- `README.md` is absent
- only allowed top-level entries exist inside the skill directory

## 10. Minimal Example

```text
skills/hello-world/
`-- SKILL.md
```

```markdown
---
name: hello-world
description: "Use when the user asks for a greeting or hello-world example in a programming language."
version: "0.1.0"
---

# hello-world

You are a focused coding assistant for hello-world examples.

## Workflow

1. Detect the requested language.
2. Produce the smallest idiomatic example.
3. Add only the minimum explanation needed.
```

## 11. Migration Rule

When upgrading an older skill to this standard:

1. remove `README.md` from the skill directory
2. move prompt fragments from `phases/` into `references/`
3. move copyable templates from `templates/` into `assets/`
4. update `SKILL.md` links to match the new layout
5. run the validator
