# Engineering Standards and Deno Trace Script Modernization Design

Date: 2026-04-30

## Goal

Modernize this repository's engineering conventions by adapting the Python and TypeScript rules from `/Users/wenzhitao/Projects/mirror-in-peace/mywork/AGENTS.md`, then optimize the safest legacy scripts first.

This change targets the current repository shape: `intent-fluid` is primarily a skill/documentation repository with framework-level helper scripts under `scripts/`. The goal is not to turn it into a Node package or Python application.

## Current State

- `package.json` only carries repository metadata and version information.
- No `AGENTS.md`, `CODEBUDDY.md`, or `CLAUDE.md` exists at the repository root.
- Framework scripts currently include:
  - `scripts/validate-skill.sh`: Bash validator for skill structure.
  - `scripts/trace.sh`: Bash wrapper with inline Node.js for trace JSONL event emission.
  - `scripts/trace-export.sh`: Bash wrapper with inline Node.js for Mermaid, Markdown, and timeline exports.
  - `scripts/dashboard.sh` and `scripts/dashboard-server.js`: Node.js-based local trace dashboard.
- `docs/SKILL_SPEC.md` remains the canonical skill authoring standard.
- `docs/TRACE_SPEC.md` remains the canonical trace protocol standard.

## Adopted Engineering Rules

### Python

Python is not currently used in this repository, but future Python tooling should follow these rules:

- Use `uv` for all Python execution and dependency management.
- Use PEP 723 single-file scripts for standalone execution-layer helpers.
- Use `pyproject.toml` plus `uv sync` only when a tool needs multiple modules or project-local imports.
- Do not introduce system Python, `pip`, `venv`, Poetry, or Conda workflows.

### TypeScript

TypeScript helper scripts should use Deno:

- Add `deno.json` at the repository root.
- Prefer `deno run`, `deno check`, `deno lint`, and `deno fmt`.
- Avoid `node_modules` and package-managed runtime dependencies.
- Keep `package.json` as repository/package metadata only unless a user explicitly approves a Node/npm exception.

### Shell

Shell scripts should remain thin orchestration or compatibility wrappers:

- Keep shell for simple CLI glue and existing invocation compatibility.
- Move complex JSON, parsing, export, and validation logic into Deno TypeScript or Python/uv scripts.
- Do not expand inline Node.js blocks in shell scripts.

### Skill Repository Rules

- Keep `docs/SKILL_SPEC.md` as the source of truth for skill layout and authoring.
- Continue using `scripts/validate-skill.sh skills/<skill-name>` as the compatibility command.
- Do not add skill-local README files unless the skill spec changes.

## Scope

### In Scope

1. Add repository-level agent instructions:
   - `AGENTS.md`
   - `CODEBUDDY.md`
   - `CLAUDE.md`

   These files should stay textually synchronized and point to `docs/SKILL_SPEC.md` and `docs/TRACE_SPEC.md` for canonical details.

2. Add Deno configuration:
   - `deno.json`
   - Tasks for format, lint, type check, skill validation, trace emission, and trace export.

3. Modernize low-risk trace scripts:
   - Add `scripts/trace.ts` for trace JSONL event emission.
   - Add `scripts/trace-export.ts` for Mermaid, Markdown summary, and ASCII timeline exports.
   - Update `scripts/trace.sh` to preserve the existing CLI while delegating to `deno run`.
   - Update `scripts/trace-export.sh` to preserve the existing CLI while delegating to `deno run`.

4. Document the Node exception:
   - `scripts/dashboard-server.js` remains Node.js for now because it is much larger and manages HTTP, SSE, PID files, and process lifecycle.
   - `scripts/dashboard.sh` remains the dashboard lifecycle wrapper.
   - A future migration can move dashboard server logic to Deno after the trace scripts are stable.

### Out of Scope

- Rewriting `scripts/dashboard-server.js` in this change.
- Removing `package.json`.
- Introducing npm dependencies, `node_modules`, or lockfiles.
- Changing the trace JSONL schema.
- Changing the public CLI contract of existing `.sh` scripts.
- Adding CI unless requested separately.

## Target Architecture

```text
intent-fluid/
|-- AGENTS.md
|-- CODEBUDDY.md
|-- CLAUDE.md
|-- deno.json
|-- docs/
|   |-- SKILL_SPEC.md
|   `-- TRACE_SPEC.md
`-- scripts/
    |-- validate-skill.sh
    |-- trace.sh              # compatibility wrapper
    |-- trace.ts              # Deno implementation
    |-- trace-export.sh       # compatibility wrapper
    |-- trace-export.ts       # Deno implementation
    |-- dashboard.sh          # existing Node dashboard wrapper
    `-- dashboard-server.js   # temporary Node exception
```

## Script Behavior

### `scripts/trace.ts`

The Deno implementation should preserve the existing command contract:

```bash
bash scripts/trace.sh <trace_file> <skill> <type> <step> <round> <agent> [detail_json]
```

Behavior:

- Validate required argument count.
- Validate that the trace file parent directory exists.
- Create the trace file if missing.
- Count existing non-empty lines to generate `evt_###` IDs.
- Parse `detail_json` as JSON, defaulting to `{}`.
- Pull `tags`, `parent_id`, and `status_display` out of the detail object using the existing behavior.
- Generate ISO timestamp with `new Date().toISOString()`.
- Append exactly one JSONL line.
- Print the generated event ID to stdout.

Invalid `detail_json` should keep the current behavior: warn to stderr and use an empty detail object.

### `scripts/trace-export.ts`

The Deno implementation should preserve the existing command contract:

```bash
bash scripts/trace-export.sh <trace_file> <format> [--skill-dir <path>]
```

Supported formats stay unchanged:

- `mermaid`: writes `<trace_dir>/execution_dag.mmd`
- `summary`: writes `<trace_dir>/execution_summary.md`
- `timeline`: prints an ASCII timeline to stdout

Behavior:

- Validate trace file existence.
- Validate format: `mermaid | summary | timeline`.
- Parse JSONL line by line, skipping invalid JSON with a warning.
- Parse optional `trace` frontmatter from `<skill-dir>/SKILL.md` using the current regex-based behavior.
- Infer steps from events when frontmatter is absent.
- Preserve existing output filenames and output text shape as closely as possible.

## Compatibility Strategy

Existing shell commands remain valid:

```bash
bash scripts/trace.sh ./trace.jsonl surge step_start analyze 1 director '{}'
bash scripts/trace-export.sh ./trace.jsonl timeline
```

The wrappers should fail clearly if Deno is not installed:

```text
Error: Deno is required but not found on PATH.
```

No user workflow should need to call the `.ts` scripts directly, although `deno task` aliases may expose them for maintainers.

## Deno Tasks

`deno.json` should include tasks similar to:

```json
{
  "tasks": {
    "fmt": "deno fmt",
    "fmt:check": "deno fmt --check",
    "lint": "deno lint",
    "check": "deno check scripts/*.ts",
    "validate:skill": "bash scripts/validate-skill.sh",
    "trace": "deno run --allow-read --allow-write scripts/trace.ts",
    "trace:export": "deno run --allow-read --allow-write scripts/trace-export.ts"
  }
}
```

Exact task names may be adjusted during implementation if Deno task argument forwarding requires a better shape.

## Error Handling

- Preserve current CLI-level error messages where practical.
- Keep JSON parsing failures non-fatal for `detail_json`, matching the current `trace.sh` behavior.
- Keep invalid JSONL lines non-fatal during export, matching the current `trace-export.sh` behavior.
- Do not silently ignore missing files or invalid formats.
- Do not broaden file permissions beyond required read/write access.

## Verification Plan

Run these checks after implementation:

```bash
deno fmt --check
deno lint
deno check scripts/*.ts
bash scripts/validate-skill.sh skills/surge
```

Then run an end-to-end trace smoke test in a temporary directory:

```bash
bash scripts/trace.sh <tmp>/trace.jsonl surge step_start analyze 1 director '{"input_files":["context.md"],"tags":["iteration_type:smoke"]}'
bash scripts/trace.sh <tmp>/trace.jsonl surge step_end analyze 1 director '{"validation_result":"PASS"}'
bash scripts/trace-export.sh <tmp>/trace.jsonl timeline
bash scripts/trace-export.sh <tmp>/trace.jsonl summary --skill-dir skills/surge
bash scripts/trace-export.sh <tmp>/trace.jsonl mermaid --skill-dir skills/surge
```

Expected result:

- Type check, lint, and format checks pass.
- Skill validation still passes.
- Trace wrapper prints event IDs.
- Timeline prints events.
- Summary and Mermaid files are generated in the trace directory.

## Risks and Mitigations

### Risk: Deno is unavailable for existing users

Mitigation: wrappers emit a clear Deno requirement message. The repository standard will state Deno as the required TypeScript runtime.

### Risk: Regex frontmatter parsing remains imperfect

Mitigation: keep current behavior instead of expanding scope. A real YAML parser would require an external dependency decision and is not necessary for this migration.

### Risk: Formatting changes create noisy diffs

Mitigation: only format newly added TypeScript and files touched for the migration. Avoid broad formatting of existing Markdown or generated assets.

### Risk: Dashboard remains Node-based

Mitigation: document it as an explicit temporary exception. Do not mix it into the trace migration; treat dashboard migration as a future, separate task.

## Acceptance Criteria

- Root agent instruction files exist and are synchronized.
- `deno.json` exists and exposes useful maintainer tasks.
- `scripts/trace.sh` and `scripts/trace-export.sh` preserve their existing CLI contracts.
- New Deno TypeScript implementations reproduce the existing trace and export behavior.
- `dashboard-server.js` remains functional and documented as a Node exception.
- Verification commands pass.
