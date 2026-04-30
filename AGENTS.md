# Agent Guidelines

This repository contains intent-fluid skills and framework-level helper scripts. It is primarily a skill/documentation repository, not a Node package or Python application.

## Repository Purpose

- Skills live under `skills/<skill-name>/`.
- Repository-level documentation lives under `docs/`.
- Framework helper scripts live under `scripts/`.
- `docs/SKILL_SPEC.md` is the canonical standard for skill authoring.
- `docs/TRACE_SPEC.md` is the canonical standard for trace events and dashboard/export behavior.

## Skill Authoring Rules

Follow `docs/SKILL_SPEC.md` when creating or modifying skills.

Key constraints:

- `SKILL.md` is required for every skill.
- Skill directory names use `[a-z0-9-]` and match the `name` frontmatter field.
- Allowed skill top-level entries are `SKILL.md`, `agents/`, `scripts/`, `references/`, and `assets/`.
- Do not add skill-local `README.md` files unless the skill spec changes.
- Validate skills with `bash scripts/validate-skill.sh skills/<skill-name>`.

## Python Rules

Python is allowed for future helper tooling only when it follows these rules:

- Use `uv` for all Python execution and dependency management.
- Use PEP 723 single-file scripts for standalone execution-layer helpers.
- Use `pyproject.toml` plus `uv sync` only when a tool needs multiple modules or project-local imports.
- Do not introduce system Python, `pip`, `venv`, Poetry, or Conda workflows.

## TypeScript Rules

TypeScript helper scripts use Deno.

- Use `deno run`, `deno check`, `deno lint`, and `deno fmt`.
- Keep TypeScript scripts in `scripts/*.ts` unless a larger tool directory is explicitly needed.
- Avoid `node_modules` and package-managed runtime dependencies.
- Keep `package.json` as repository metadata only unless the user explicitly approves a Node/npm exception.
- Prefer Deno permissions scoped to the script's needs, such as `--allow-read --allow-write`.

## Shell Rules

Shell scripts are compatibility wrappers or thin orchestration glue.

- Preserve existing shell entrypoints when they are part of documented workflows.
- Do not add complex JSON, parsing, export, or validation logic to shell scripts.
- Move complex logic into Deno TypeScript or Python/uv scripts.

## Current Node Exception

`scripts/dashboard-server.js` remains a temporary Node.js exception because it owns the existing local dashboard server, SSE handling, PID file behavior, and HTTP lifecycle.

Do not expand this exception without user approval. Future dashboard migration should be planned separately.

## Verification Commands

Use these checks after script or standards changes:

```bash
deno fmt --check
deno lint
deno check scripts/*.ts
bash scripts/validate-skill.sh skills/surge
```

For trace changes, also run a smoke test through the shell wrappers:

```bash
bash scripts/trace.sh <tmp>/trace.jsonl surge step_start analyze 1 director '{}'
bash scripts/trace-export.sh <tmp>/trace.jsonl timeline
```
