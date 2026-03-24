# Skill Developer Specification

> Version 1.0 — Canonical reference for authoring intent-fluid skills.

## 1. Directory Layout

Every skill lives under `skills/<skill-name>/`. The directory name **is** the skill identifier.

```
skills/<skill-name>/
├── SKILL.md            # REQUIRED — manifest + prompt
├── README.md           # optional — human-readable documentation
├── phases/             # optional — phase prompt templates
├── references/         # optional — reference documentation
├── scripts/            # optional — helper scripts
├── templates/          # optional — reusable templates
├── agents/             # optional — sub-agent configurations
└── commands/           # optional — slash-command definitions
```

## 2. Naming Rules

| Rule | Detail |
|------|--------|
| Character set | `[a-z0-9-]` only (lowercase, digits, hyphens) |
| Consistency | Directory name **must** match the `name` field in SKILL.md frontmatter |
| Length | 2–50 characters recommended |

**Examples:** `surge`, `code-review`, `tdd-guard`

## 3. SKILL.md Format

SKILL.md consists of two parts: **YAML frontmatter** and **Markdown body**.

### 3.1 Frontmatter Schema

```yaml
---
# ── Required ──────────────────────────────────────
name: "my-skill"                  # string — must match directory name
description: "Use when ..."       # string, ≤ 1024 chars — trigger conditions only

# ── Optional ──────────────────────────────────────
version: "1.0.0"                  # semver string
author: "username"                # string
tags: [tag1, tag2]                # string[] — categorization keywords
platforms: [claude, cursor, gemini]  # string[] — supported AI platforms
---
```

#### Field Details

| Field | Required | Type | Constraints | Purpose |
|-------|----------|------|-------------|---------|
| `name` | ✅ | string | `[a-z0-9-]`, 2–50 chars | Unique skill identifier |
| `description` | ✅ | string | ≤ 1024 characters | Tells the AI **when** to activate this skill. Write only trigger conditions — not what the skill does internally. |
| `version` | ❌ | string | [semver](https://semver.org) | Independent of repo version; tracks skill-level changes |
| `author` | ❌ | string | — | Original author |
| `tags` | ❌ | string[] | — | Discovery & categorization |
| `platforms` | ❌ | string[] | Known values: `claude`, `cursor`, `gemini` | Declares platform compatibility |

### 3.2 Markdown Body

Everything after the closing `---` of the frontmatter is the **skill prompt**. This content is injected verbatim into the AI's context when the skill is activated.

Guidelines:

- Start with a `# <skill-name>` heading
- Write in second person ("You are…", "Your role is…")
- Structure with clear sections (## headings)
- Include failure modes / gotchas near the top
- Reference sub-files with relative paths (`phases/analyze.md`, `references/startup.md`)

## 4. Optional Sub-directories

| Directory | Purpose | Convention |
|-----------|---------|------------|
| `phases/` | Phase-specific prompt templates | One `.md` per phase, named after the phase |
| `references/` | Detailed reference docs the skill may read | Stable documentation, rarely changes |
| `scripts/` | Shell/Python helper scripts | Must be executable, include usage comments |
| `templates/` | Reusable file templates | Copied or adapted during execution |
| `agents/` | Sub-agent configuration files | Agent role definitions |
| `commands/` | Slash-command definitions | Platform-specific command integrations |

## 5. Validation

Run the validation script to check compliance:

```bash
bash scripts/validate-skill.sh skills/<skill-name>
```

The script checks:
- SKILL.md exists
- Frontmatter contains `name` and `description`
- `name` matches directory name
- `description` ≤ 1024 characters
- Directory name uses only `[a-z0-9-]`

## 6. Example

A minimal, valid skill:

```
skills/hello-world/
└── SKILL.md
```

```yaml
---
name: hello-world
description: "Use when the user asks for a greeting or hello-world example in any programming language."
---

# hello-world

You are a friendly coding assistant. When the user asks for a hello-world example, provide clean, idiomatic code in their requested language with brief explanatory comments.
```
