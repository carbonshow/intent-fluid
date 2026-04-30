# Process Output Reference

**Purpose**: (1) Let the user see key contents of the intermediate process to judge if the direction is right; (2) Provide a progress indicator during long runs so the user doesn't think the task is stuck.

---

## Director's Duty

After each subagent returns, the Director MUST present a brief process summary to the user. **This is a mandatory obligation after every Phase — not optional. Violating this rule is equivalent to a process interruption.**

### Pre-Phase Status Announcement

Before dispatching each subagent, the Director MUST also print a status line to provide real-time progress indication:

**Format**: `{emoji} [{step}] {status_description}`

This is a one-line announcement before the action, NOT a summary after the action. It serves as a real-time heartbeat so the user knows the task is progressing. The status line is also emitted as a trace event (see Execution Trace Protocol in `SKILL.md`).

---

## Required Content Per Phase

| Phase | Required Process Content |
|-------|--------------------------|
| analyze | Number of key requirements, ambiguities, and high-risk items identified (list IDs and 1-sentence descriptions). |
| research | **Key findings from web search/fetch** (source URLs, core conclusions), pruning decisions at each layer, and **number of raw material files saved** (with directory path). Note: because research is Director-orchestrated with per-layer user interaction, progress is shown incrementally during the phase — the post-phase summary covers the final summary document only. |
| design | Checkpoint 4 (Design Confirmation) serves as the process summary. No separate post-phase summary needed — the 4 checkpoints provide transparency throughout the phase. |
| implement | Module name completed by each subagent, output file paths, lines of code, **edge cases discovered** (if any). |
| qa | Number of Passed/Partial/Failed items, quality score changes, P0 issue list. |

---

## Format Example

Director showing to user:

```
📋 [research] Subagent finished — Key Findings:
  • Approach A focuses on runtime adaptation, differs from our static-analysis path — no overlap.
  • arXiv:2507.18224 uses a learning-driven path, different from our formalization path.
  • CrewAI/AutoGen/LangGraph have no auto-topology generation (blank space confirmed).
  → Output: iter_01_research.md (xxx lines)
```

---

## Director Self-Check

If the subagent's response does not include a progress summary (the subagent may have ignored the Process Output Requirement), the Director MUST extract key information from the subagent's output files and present it to the user, rather than skipping the summary.

---

## Cooperation Requirement in Subagent Prompt

When the Director concatenates the subagent prompt, it MUST append the following instruction at the end:

```
## Process Output Requirement
In your final reply (not the content written to the file), please provide an additional brief process summary containing:
- Key findings or decisions of this phase (3-5 items, one sentence each)
- External info sources used (URLs, lit IDs, etc., if any)
- Output file path and approximate line count
- Unexpected situations or issues needing Director's attention (skip if none)
```


## Writing Style Guidelines (Human-Friendly Output)

The Director and all subagents MUST prioritize human readability and logical flow in their final deliverables and summaries:
- **Narrative over Rigid Lists**: Avoid outputting raw data dumps or endless nested bullet points. Use structured prose to connect concepts and explain the *why* behind decisions.
- **Logical Deductive Flow**: Structure conclusions as a logical argument (Observation -> Hypothesis -> Evidence -> Conclusion), rather than just abruptly stating the final result.
- **Synthesis over Summarization**: When processing upstream documents, synthesize the core insights into a cohesive viewpoint rather than mechanically summarizing each source.
- **Calibrated Tone**: The tone should be professional yet conversational (like a senior consultant briefing a stakeholder), avoiding robotic, overly formulaic, or strictly templated stiffness.
