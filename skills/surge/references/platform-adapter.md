# Platform Adapter

surge keeps one artifact contract across Claude, Cursor, and Gemini. The host may change how work is executed, but it must not change which files are produced or what evidence is recorded.

## Capability Model

At startup, record available capabilities in `platform-capabilities.md`.

| Capability | Preferred Path | Fallback Path |
|---|---|---|
| Parallel subagents | Dispatch one worker per task package up to `parallel_agent_limit`. | Execute the same task packages serially. |
| Web search / fetch | Save every search/fetch result to `iter_{NN}_research/`. | Ask the user for sources or source files; mark evidence as user-provided. |
| User question UI | Use native checkpoint/question tool. | Ask in plain text and wait for reply. |
| File edits | Use host-native write/edit tools. | Use safe filesystem operations available in the host. |
| Script execution | Run `init.sh`, `state.sh`, `trace.sh`, and `audit-task.js`. | Use manual checklist fallback and record the limitation. |

## Claude

Expected path:

- Use native subagents for parallel analyze/research/design/implement work where available.
- Use available web tools for research.
- Use checkpoint/question UI if available.
- Run scripts for state, trace, and audit checks.

Fallback:

- Run subagent task packages serially.
- If browsing is unavailable, ask the user for sources and record the limitation.

## Cursor

Expected path:

- Treat phase roles as structured prompts if independent agent dispatch is unavailable.
- Use repository files and terminal scripts for deterministic state and audit checks.
- Prefer actual build/test commands for evidence.

Fallback:

- Execute task packages serially.
- Preserve the same output file names under `iterations/`.

## Gemini CLI

Expected path:

- Use extension skill activation and available shell/file tools.
- Run scripts when available.
- Use serial role execution when parallel workers are unavailable.

Fallback:

- Keep all artifacts and phase outputs identical to the shared protocol.
- Mark unavailable tools explicitly rather than pretending the action happened.

## Non-Negotiable Rules

- Do not make `Agent`, `AskUserQuestion`, `WebSearch`, or `WebFetch` the only valid execution path in shared references.
- Do not skip an ambiguity gate because the platform lacks a special question UI.
- Do not claim external research was performed when the platform had no browsing and no user-provided source material.
- Do not change task directory layout per platform.

## Prompting Guidance

When a host lacks subagents, the Director uses the phase template directly and writes the same output file. When a host lacks browsing, the research phase may still run over local files or user-provided documents, but the evidence type must say so.
