# Output Validation & Recovery Reference

After every subagent returns, the Director reads this document to validate output integrity before proceeding to Process Output or the next phase.

---

## Layer 1: Universal Structural Checks

Perform these checks on every subagent output, regardless of phase.

| # | Check | Director Action | Truncation Signal |
|---|-------|-----------------|-------------------|
| S1 | **File exists** | Read the expected output file path | File not found |
| S2 | **Non-empty** | Verify meaningful content beyond title/frontmatter | < 10 lines of actual content |
| S3 | **No abrupt ending** | Inspect last ~20 lines for completeness | Last line is an incomplete sentence, an unclosed ``` block, or an unfinished list item |
| S4 | **No stall pattern** | Check that output contains task-specific analysis, not just role preamble or repeated boilerplate | Content is >80% template/boilerplate with no substantive analysis |

S1–S3 are **hard signals** (high confidence of truncation). S4 is a **soft signal** (suggestive, not conclusive).

---

## Layer 2: Phase-Specific Section Checklists

For each phase, scan for the presence of required conceptual content. Do not demand exact markdown formatting (per the "Over-Formatting" gotcha) — check for the content, not the headings.

### analyze

| Required Content | How to Detect |
|---|---|
| Functional Requirements List | Section listing requirements with priorities (P0/P1/P2) |
| Problem Reframe and Initial Hypotheses | Section identifying the current framing and 3-7 material hypotheses or assumptions |
| Non-Functional Requirements | Section present (even if "None identified") |
| Ambiguities & Questions | Section present |
| Risk Warnings | Section present |
| Non-Obvious Constraints & Domain-Specific Invalidations | Section present (even if "None identified") — design phase treats these as top-priority architectural constraints |
| Recommended Task Breakdown | Section present with parallelization guidance |

**Key truncation heuristic**: If only 1–2 of 6 sections exist, likely truncated mid-output.

### research

This phase is Director-orchestrated. Raw material files are validated incrementally during the research loop (Step 2.1). The checklist below applies to the **summary document** produced by the summary subagent (Step 4).

**Raw material validation (during loop)**: After each search subagent returns, the Director checks that declared files exist and are non-empty. This is NOT deferred to post-phase validation.

**Summary document validation (after Step 4)**:

| Required Content | How to Detect |
|---|---|
| `iter_{NN}_research/` directory | Glob/Read check: directory exists with >=1 file |
| Research Conclusion Summary | 2-3 sentence summary present in `iter_{NN}_research.md` |
| Research Tree Overview | Tree structure with node statuses present |
| Source Materials Index | Table referencing raw material files |
| Claim/Evidence Mapping | Links key findings to `epistemic-ledger.md` rows or states that no material claims were added |
| Technical Solution Candidates | At least one candidate listed |
| Opposing Evidence and Gaps | Section lists contradictions, negative evidence, or explicitly says none found with method |
| Resolved Ambiguities | Section present (even if "None") — feeds forward to design |
| Remaining Uncertainties | Section present (even if "None") — design needs to know what's unresolved |
| User Decision Records | Section present (pruning decisions listed) |

**Key truncation heuristic**: Summary doc exists but Source Materials Index or Candidates section is missing. Raw materials directory empty at this point indicates a systemic failure in the research loop (search subagents failed to persist).

### design

This phase is Director-orchestrated with multiple outputs. Validate each output independently:

| Output File | Required Content |
|---|---|
| `iter_{NN}_expert_review_{slug}.md` | Expert identity, solution ratings with scores, recommendation, design constraints |
| `iter_{NN}_expert_synthesis.md` | Rating matrix, consensus points, divergence points, veto items (if any) |
| `iter_{NN}_design.md` | Selected solution & reasons, detailed design (module division), task packages JSON block with `estimated_output_size` per package |

For high-risk design choices, also check that assumptions, predictions/observables, invalidation conditions, and residual risks are recorded in `epistemic-ledger.md` or `falsification.md`.

**Key truncation heuristic**: Task packages JSON block absent or malformed (no closing `]`).

### implement

| Required Content | How to Detect |
|---|---|
| Implementation Overview | Brief description of what was implemented |
| Output Mode Declaration | "Actual Files" or "Document" stated |
| File List (Actual File mode) | Table or list of created files with paths |
| `**Status: Completed**` marker | Present at end of each module's verification section |
| Known Limitations | Section present (even if "None") |
| Discovered Edge Cases | Section present (even if "None") |

**Key truncation heuristic**: `**Status: Completed**` missing for one or more modules is the **strongest signal** — the implement template explicitly requires this marker after each module. If Implementation Overview exists but no `**Status: Completed**` anywhere, the output is almost certainly truncated.

### qa

| Required Content | How to Detect |
|---|---|
| Acceptance Conclusion | Three-value judgment stated (Fail / Pass-Optimizable / Pass-Converged) |
| Details of Pass/Partial/Fail items | Itemized breakdown present |
| Overall Deviation Level | Highest deviation level stated with reason (even if "no deviation") — critical for Director's rollback decision |
| Quality Evaluation | Multi-dimension scoring table with tier ratings |
| Epistemic Review | Check of high-confidence claims, opposing evidence, falsification triggers, and Goodhart risk |
| Optimization Gradients (if Pass-Optimizable) | Present when conclusion is Pass-Optimizable |
| Test Suite Evolution Suggestions | Present (even if "No new suggestions") |

**Key truncation heuristic**: Acceptance Conclusion missing = definitely truncated. Quality Evaluation missing but Conclusion present = partial truncation.

### epistemic artifacts

These files are created during startup and validated when the task reaches QA or convergence:

| File | Required Content |
|---|---|
| `epistemic-ledger.md` | Markdown table with ID, Type, Statement, Prediction / Observable, Supporting Evidence, Confidence, Decision Impact |
| `falsification.md` | Markdown table for high-risk disconfirmation checks; may be empty if no trigger applies |
| `convergence-audit.md` | Markdown table with Check, Status, Evidence; passing checks require substantive evidence |
| `platform-capabilities.md` | Capability/fallback table for host execution |

### retro

| Required Content | How to Detect |
|---|---|
| Basic Task Info | Task ID, completion time, final status |
| Goal Achievement | Section present |
| Execution Trajectory | Section present |
| Formalized Experience | Section present (even if "None" for each category) |

**Key truncation heuristic**: Formalized Experience section missing means the most actionable part was lost.

---

## Severity Classification

| Level | Criteria | Action |
|---|---|---|
| **PASS** | All Layer 1 structural checks pass AND all required sections for the phase are present | Proceed normally |
| **MINOR_TRUNCATION** | File exists with substantial content, but 1–2 non-critical sections are missing OR ending is slightly abrupt | Completion Retry (§A) |
| **SEVERE_TRUNCATION** | File missing, empty, or < 10 lines of content; OR ≥3 required sections missing; OR the conclusion/key-output section is absent | Scoped Retry (§B) → Task Splitting (§C) → User Escalation (§D) |

---

## Recovery Procedures

### A. Completion Retry (MINOR_TRUNCATION)

Don't redo the whole task. Dispatch a new subagent to append only the missing sections:

```
You previously produced the file {output_path} for the {phase} phase. The output is mostly
complete but is missing the following sections:

{list of missing sections with brief description of expected content}

Read the existing file and APPEND the missing sections. Do not rewrite existing content.
Write the completed content to the same file path.
```

Provide: the existing output file + the original phase prompt (for reference on expected sections).

If the completion retry also produces incomplete output, escalate to Scoped Retry (§B).

### B. Scoped Retry (SEVERE_TRUNCATION, Attempt 1)

Retry the full phase with anti-truncation instructions injected into the prompt:

```
[OUTPUT INTEGRITY NOTICE]
Your previous attempt at this phase produced truncated/incomplete output.
To avoid this, follow these guidelines:
- Prioritize completing ALL required sections over depth in any single section.
- Keep each section concise — use bullet points, not long paragraphs.
- If you realize you are running long, summarize remaining sections rather than stopping.
- Required sections for this phase: {explicit list from Layer 2 checklist}
- The LAST line of your output MUST be: "--- END OF {PHASE} OUTPUT ---"
```

**End-marker purpose**: The Director can easily detect if the retried output was still truncated (marker missing = truncated).

**For large/xlarge tasks** (when `estimated_output_size` in the task package is large or xlarge), additionally inject:

```
[SCOPE REDUCTION]
The previous attempt likely failed due to output volume. Reduce your output by:
- Using summary tables instead of prose where possible.
- Omitting detailed rationale where a one-line justification suffices.
- Referencing upstream documents by section number instead of repeating their content.
```

If the scoped retry also produces truncated output (end-marker missing or sections still absent), proceed to Task Splitting (§C).

### C. Task Splitting Retry (SEVERE_TRUNCATION, Attempt 2)

When the task is too large for a single subagent, split it into smaller sub-tasks:

| Phase | Splitting Strategy |
|---|---|
| **analyze** | By requirement domain: "Analyze functional requirements only" → "Analyze non-functional + risks + task breakdown only" → merge |
| **research** | Already naturally chunked by direction. Dispatch one subagent per research direction instead of one for all |
| **design** | Already Director-orchestrated. If detailed design (Step 6) truncates, split by module: one subagent per module's detailed design |
| **implement** | Convert serial mode to parallel mode. If already parallel and a single module truncates, further split using the `split_plan` from design |
| **qa** | By evaluation stage: "Run Stage 1 (standard acceptance)" → "Run Stage 2–3 (quality eval + conclusion) using Stage 1 results" → "Run Stage 4–5 (test evolution + directive verification)" → merge |
| **retro** | "Write trajectory analysis (Steps 1–2)" → "Write experience formalization (Step 3) using the trajectory analysis" → merge |

**Merge protocol**: After sub-tasks complete, combine outputs into the canonical file path. For implement, use the existing `scripts/merge-parallel.sh`. For other phases, the Director reads all partial outputs and writes a combined file — or dispatches a lightweight merge subagent:

```
Read the following partial outputs for the {phase} phase and merge them into a single
coherent document at {output_path}. Resolve any conflicts or overlaps. Ensure all required
sections are present: {section list}.

Partial outputs:
- {path_1} (covers: {scope_1})
- {path_2} (covers: {scope_2})
```

If splitting also fails, proceed to User Escalation (§D).

### D. User Escalation (All Retries Exhausted)

Present the situation to the user with clear options:

```
⚠️ [{phase}] Output Validation Failed — Escalation Required
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Attempts made:
  1. {First attempt type}: {result}
  2. {Second attempt type}: {result}
  3. {Third attempt type}: {result}

Missing content: {list of missing sections}
Available partial output: {path}

Options:
  A) Retry with user-provided guidance (e.g., simplify scope)
  B) Accept partial output and continue (Director will mark gaps for downstream phases)
  C) Skip this phase (if non-critical)
  D) Terminate task
```

### E. Cross-Iteration Truncation Learning

If the same phase truncates in 2+ consecutive iterations:

1. Record `[{timestamp}] [truncation] {phase} truncated in iterations {N-1} and {N}. Recommend proactive pre-splitting.` in `memory_draft.md`.
2. In subsequent iterations, **proactively apply** scope reduction or task splitting BEFORE the first attempt (preemptive splitting).
3. Consider whether the PRD scope itself is too large and suggest to the user to break the project into multiple surge tasks.

---

## Retry Budget

- **Max retries per phase per iteration**: 3 total attempts (1 original + up to 2 recovery attempts)
- Recovery path: Original → Completion/Scoped Retry → Task Splitting → User Escalation
- Do not exceed 3 attempts without user input — endless retries waste tokens and time.
