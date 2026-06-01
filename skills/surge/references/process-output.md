# Process Output Reference

**Purpose**: Show users the current conclusion, evidence basis, risks, decision needs, and next action without forcing them to read raw process logs.

---

## Director's Duty

After each phase completes, the Director MUST present a user-facing briefing and update `current-brief.md`. **This is a mandatory obligation after every Phase — not optional. Violating this rule is equivalent to a process interruption.**

Use `references/user-facing-output.md` as the source of truth for briefing structure, symbol policy, and `decision-log.md` updates.

### Pre-Phase Status Announcement

Before dispatching each subagent, the Director MUST also print a status line to provide real-time progress indication:

**Format**: `Status: [{step}] {status_description}`

This is a one-line announcement before the action, NOT a summary after the action. It serves as a real-time heartbeat so the user knows the task is progressing. The status line is also emitted as a trace event (see Execution Trace Protocol in `SKILL.md`).

---

## Required Content Per Phase

| Phase | Required Briefing Content |
|-------|--------------------------|
| analyze | Bottom-line interpretation, decision-blocking ambiguities, high-risk items, and whether user clarification is required. |
| research | Evidence-backed conclusions, source independence or triangulation status, unresolved factual gaps, and pruning decisions that affect design. |
| design | Selected option, why alternatives lost, accepted expert constraints or veto overrides, and the user approval point. |
| implement | Actual files or document sections produced, verification performed, discovered edge cases, and any design mismatch. |
| qa | Delivery verdict, blocker vs non-blocking issues, quality movement, residual risk, and next iteration or convergence decision. |

---

## Format Example

Director showing to user:

```
## Bottom Line

Research supports the static-analysis path. The runtime-adaptation alternatives do not solve the core requirement.

## Basis

- `iter_01_research.md` maps the relevant sources to the candidate comparison.
- Two independent source groups support the same design constraint; no material counter-evidence was found.

## Risks and Uncertainties

- Benchmark claims remain single-source, so design should not rely on exact throughput numbers.

## Decision Needed

No user decision needed.

## Next Action

Proceed to design with the static-analysis path as the leading candidate.
```

---

## Director Self-Check

If the subagent's response does not include the information needed for a briefing, the Director MUST extract key information from the output files and present it to the user, rather than skipping the briefing.

---

## Cooperation Requirement in Subagent Prompt

When the Director concatenates the subagent prompt, it MUST append the following instruction at the end:

```
## Process Output Requirement
In your final reply (not the content written to the file), please provide the information the Director needs for a user-facing briefing:
- Bottom line of this phase (1-2 sentences)
- Evidence basis (important sources, files, tests, or expert judgments)
- Material risks or uncertainties that affect downstream decisions
- Whether a user decision is needed
- Output file path and approximate line count
```


## Writing Style Guidelines (Human-Friendly Output)

The Director and all subagents MUST prioritize human readability and logical flow in their final deliverables and summaries:
- **Narrative over Rigid Lists**: Avoid outputting raw data dumps or endless nested bullet points. Use structured prose to connect concepts and explain the *why* behind decisions.
- **Logical Deductive Flow**: Structure conclusions as a logical argument (Observation -> Hypothesis -> Evidence -> Conclusion), rather than just abruptly stating the final result.
- **Synthesis over Summarization**: When processing upstream documents, synthesize the core insights into a cohesive viewpoint rather than mechanically summarizing each source.
- **Calibrated Tone**: The tone should be professional yet conversational (like a senior consultant briefing a stakeholder), avoiding robotic, overly formulaic, or strictly templated stiffness.
- **Reader Summary First**: Canonical phase reports start with `## Reader Summary` before detailed process sections. Raw research materials and individual expert reviews are exempt.
- **Plain Symbols**: Avoid emoji, decorative dividers, star ratings, and dense status markers in durable Markdown. Keep machine-readable markers inside evidence files and translate them in user-facing briefings.
