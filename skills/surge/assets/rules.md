# surge rules

These rules codify stable constraints validated during surge execution, using the `NEVER / ALWAYS / PREFER` structure.

## NEVER

- NEVER let phase skills read or write `state.md`; `state.md` is maintained exclusively by the Director (`surge`).
- NEVER write retrospective suggestions directly to `CLAUDE.md` or modify this file without user confirmation; output drafts first (`CLAUDE_updates_draft.md` / `RULES_updates_draft.md`).
- NEVER exceed the `parallel_agent_limit` during the parallel implementation phase; the excess must be processed serially in the current round.
- NEVER assign a single deliverable with an estimated workload of "large" or "xlarge" to a single agent to complete all at once in the implement phase; it must be pre-split into multiple Parts during the topology or design phase, keeping the estimated output volume of each Part within 70% of the agent's single-output limit.
- NEVER allow downstream documents (documents referencing upstream data) to be finalized before upstream documents (the authoritative source for data definitions) are fully finalized in a parallel implement phase; if completion order cannot be controlled, downstream documents must execute an alignment check before finalization.
- NEVER use wording that implies experimental data support (like "actual measurement," "measurements indicate") in research-type documents (`deliverable_type=document`) unless accompanied by complete experimental methods and data records; quantitative conclusions lacking experimental records should use qualifiers like "theoretical analysis indicates" or "inferred."
- NEVER output results purely based on "looks reasonable" in documents involving complex numerical calculations like weighted averages or matrix summations; a manual verification must be included or independently executed during the implement phase to ensure the sum of the parts equals the whole.

## ALWAYS

- ALWAYS create the `{surge_root}/tasks/{task_id}/` Context Package at startup and initialize `state.md`.
- ALWAYS advance sequentially through the phases: `analyze → research → design → implement → qa`, entering `retro` after acceptance passes.
- ALWAYS write process experiences in append mode to `memory_draft.md` (including timestamps and trigger reasons).
- ALWAYS ensure `shared_context` contains exact field lists (rather than just abbreviation definitions) for all core data structures referenced across documents when implement involves multiple parallel agents, and mark the `canonical_source` (authoritative source document) for each definition. Also include signatures (name, parameter types, return type) for utility functions shared across packages to prevent duplicate implementations and API mismatches.
- ALWAYS adopt a lightweight iteration path (skip analyze and research, starting from design or implement depending on whether structural changes are needed) when QA determines "Pass-Optimizable" and improvements only involve non-functional dimensions, avoiding unnecessary full-process reruns.
- ALWAYS explicitly label the evidence type for all key quantitative conclusions during the implement phase of research-type documents, such as `[Citation:Source]`, `[Theoretical Derivation]`, `[Analogy Inference]`, `[Engineering Intuition]`, `[Actual Measurement:with experimental methods and records]`.
- ALWAYS use absolute paths when calling scripts/state.sh and when referencing state.md, context.md, or any task file from the Director. Subagent execution may change CWD; relative paths will silently resolve to wrong locations.
- ALWAYS specify inclusive/exclusive boundary semantics for threshold, range, or window logic in design documents using mathematical interval notation (e.g., `(today, today+3]` means exclusive start, inclusive end). Unspecified boundaries cause cross-component inconsistencies.

## PREFER

- PREFER judging acceptance deviations step-by-step from `Level 1 → Level 2 → Level 3`, explicitly ruling out lower-level causes before escalating.
- PREFER retrying once when phase outputs are missing or clearly incomplete before entering a user decision branch.
- PREFER marking `[BLOCKED: Dependencies not ready]` when parallel tasks encounter unready dependencies to avoid forced advancement that spreads errors.
- PREFER explicitly stating the reasons below matrix-type data (like scenario analysis, stress testing) if aggregate values include second-order effects causing "sum of parts ≠ whole," to avoid being misjudged as arithmetic errors.
- PREFER specifying test_expectations per parallel task package in design, describing what tests each package should produce. Deferring all tests to a single package leaves the majority of code untested.