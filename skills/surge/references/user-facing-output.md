# User-Facing Output Layer

This reference defines what the Director shows to the user while surge runs.
It separates human-readable briefings from runtime evidence files.

## Purpose

surge produces many artifacts because it is an execution and audit system:
`trace.jsonl`, `state.md`, phase reports, expert reviews, raw research files,
epistemic ledgers, and convergence audits. Those files are useful for control
and replay, but they are not the default reading surface for the user.

The default user surface is a briefing: conclusion first, evidence second,
risks third, decision request last.

## Output Separation

Use three layers:

| Layer | Audience | Examples | User-facing by default |
|---|---|---|---|
| Runtime control | Director and scripts | `state.md`, `trace.jsonl`, `platform-capabilities.md` | No |
| Evidence archive | Audit and recovery | `iterations/*`, raw research files, ledgers, QA details | No |
| Briefing layer | User and decision maker | phase briefings, `current-brief.md`, `decision-log.md`, completion review | Yes |

The Director may link to evidence files, but should not make the user read
the evidence archive to understand the current state.

## Durable Briefing Files

The Context Package contains two user-readable files:

- `current-brief.md`: overwritten after startup and after every phase. It is the
  best single file to open when resuming a task.
- `decision-log.md`: append-only record of user decisions, skipped phases,
  overrides, veto acknowledgements, and acceptance criteria changes.

Do not duplicate full phase reports in these files. Link to the relevant files.

## Default Phase Briefing

After a phase completes, the Director updates `current-brief.md` and shows a
short briefing to the user using this structure:

```markdown
## Bottom Line

[One or two sentences stating what changed and what it means.]

## Basis

- [Evidence item or output file that supports the conclusion.]
- [Important source, test result, expert consensus, or QA finding.]

## Risks and Uncertainties

- [Only include risks that can affect downstream decisions.]

## Decision Needed

[No user decision needed / one concrete question with options.]

## Next Action

[The next phase or recovery action.]
```

Rules:

- Lead with the result, not with the steps taken.
- Keep the briefing short enough to read in under one minute.
- Prefer narrative synthesis over a list of every artifact produced.
- If the user must decide, ask one decision question and list the impact of
  each option.
- If no decision is needed, say so explicitly.

## Symbol Policy

Keep symbols out of the user's main reading path.

- Real-time status lines may use host-specific styling, but durable Markdown
  should use plain text.
- Prefer `Status: [phase] ...` for progress messages.
- Do not use emoji, decorative dividers, star ratings, or dense marker sets in
  durable briefings.
- Keep machine-readable markers such as `[BLOCKED]`, `[VETOED]`,
  `[DEGRADED]`, `[ASSUMPTION]`, and `[DESIGN_MISMATCH]` inside evidence files.
  Translate them in user-facing briefings.

Example translation:

| Evidence marker | User-facing wording |
|---|---|
| `[DEGRADED: helm unavailable]` | "Helm validation could not be run because the tool is unavailable." |
| `[VETOED by Security Expert]` | "The security reviewer rejected this option because ..." |
| `[BLOCKED: missing source]` | "This cannot proceed until the missing source is provided." |

## Phase-Specific Briefing Focus

| Phase | User-facing focus |
|---|---|
| analyze | Requirement interpretation, contradictions, decision-blocking ambiguities, high-impact risks |
| research | Evidence-backed conclusions, independent source status, unresolved factual gaps |
| design | Selected option, why rejected alternatives lost, accepted risks, user approval point |
| implement | Actual changes or produced deliverables, verification performed, discovered edge cases |
| qa | Delivery verdict, blockers vs non-blocking improvements, residual risk, next iteration decision |
| retro | What was delivered, what was learned, what should change in future runs |

## Reader Summary Requirement

Canonical phase reports must start with `## Reader Summary` before detailed
phase sections. Expert review files and raw research material files are exempt
because they are evidence artifacts.

The summary must contain:

- Bottom line
- Evidence basis
- Decision or next action
- Material risks, if any

If a canonical phase report lacks this summary, the Director should treat it as
a readability defect and prepend a concise summary before using it downstream.
