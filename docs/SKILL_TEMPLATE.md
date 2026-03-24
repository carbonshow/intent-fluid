# Skill Template

> Copy the structure below to create a new skill.

## Quick Start

```bash
# 1. Create the skill directory
mkdir -p skills/my-skill

# 2. Copy the SKILL.md template below into skills/my-skill/SKILL.md

# 3. Edit the frontmatter and body

# 4. Validate
bash scripts/validate-skill.sh skills/my-skill
```

## Minimal SKILL.md Template

```markdown
---
name: my-skill
description: "Use when ... (describe trigger conditions, ≤ 1024 chars)"
version: "0.1.0"
author: your-name
tags: []
platforms: [claude, cursor, gemini]
---

# my-skill

You are [role description]. Your purpose is to [what this skill does].

## When to Activate

- [Trigger condition 1]
- [Trigger condition 2]

## Gotchas

> Common failure modes — address these first.

- **[Failure mode]**: [How to avoid it]

## Core Workflow

1. [Step 1]
2. [Step 2]
3. [Step 3]

## Output Requirements

- [What the skill should produce]
```

## Full Structure (Optional)

If your skill requires sub-files:

```
skills/my-skill/
├── SKILL.md              ← Required
├── README.md             ← Optional: human docs
├── phases/               ← Optional: phase templates
│   ├── phase-one.md
│   └── phase-two.md
├── references/           ← Optional: reference docs
│   └── detailed-guide.md
├── scripts/              ← Optional: helper scripts
│   └── helper.sh
├── templates/            ← Optional: reusable templates
│   └── boilerplate.md
├── agents/               ← Optional: sub-agent configs
│   └── specialist.md
└── commands/             ← Optional: slash commands
    └── run.md
```

## Tips

- **description** should only describe *when* to use the skill, not *how* it works internally
- Keep the description under 1024 characters
- Use `[a-z0-9-]` for the skill directory name
- The `name` field in frontmatter must exactly match the directory name
- See [SKILL_SPEC.md](./SKILL_SPEC.md) for the full specification
