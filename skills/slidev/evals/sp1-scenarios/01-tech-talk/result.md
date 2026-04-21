# Scenario 1 — Result

**Date run**: 2026-04-21
**Skill commit SHA**: 550906abe9cdef14b8c1587903dfa0e8ac1629e6
**Operator**: subagent-scenario-1

## Actual outputs

- **Theme chosen**: `tech-dark` — modern tooling aesthetics + technical peers + deep internals signals
- **Slide count**: 17 (cover + agenda + 14 content + end)
- **Verbosity**: `standard`
- **Tone**: `technical`
- **Density tier default**: Normal (with targeted Compact on the two-columns slide)

## Design Brief (summary)

- Audience: 15-person technical team, Rust-literate engineers
- Purpose: Inform (lean teach) — understand how Tokio turns `async fn` into scheduled polls
- Language: English
- Style keywords: `[modern-tooling, signal-forward, deep-internals, dark]`
- Key messages:
  1. Futures are lazy state machines — the runtime calls `poll` on them
  2. Tokio uses work-stealing + a LIFO slot for latency-sensitive message-passing
  3. Wakers are how `Pending` tasks get re-scheduled from the reactor
  4. Cooperative scheduling has a coop budget; violations hurt tail latency
- Layout mix: 1 cover, 1 agenda, 1 big-statement, 1 content-narrative, 3 diagram-primary, 3 code-focus, 4 content-bullets, 1 two-columns (bullets × table), 1 three-metrics, 1 closing

## Expectation results

- [x] E1 Theme ∈ {tech-dark, code-focus-light} — chose `tech-dark`
- [x] E2 Agenda in first 3 slides (slide 2)
- [x] E3 ≥ 3 `code-focus` or `diagram-primary` — 3 diagram-primary + 3 code-focus = 6 total
- [x] E4 ≥ 1 `image-focus` or `big-statement` — one `big-statement` (slide 3)
- [x] E5 `section-divider` rule obeyed — deck is 17 slides (≤ 20), no dividers used
- [x] E6 First slide is `cover` (cover frontmatter via starter template)
- [x] E7 Closing uses `layout: end`
- [x] E8 Check 10 zero FAIL — `validate-slides.sh` reports 11 passed / 0 failed / 0 warnings
- [x] E9 First 5 slides render without overflow (static check — see note)
- [x] E10 Slide count between 10 and 25 — 17 slides

## Score

**Items ticked**: 10 / 10

## Notes / failures

- E9 is a static judgement (no browser available in this session). The first 5
  slides are: cover (minimal), agenda (6 short items), big-statement (single
  sentence ≤ 120 chars), content-narrative (~330-char paragraph, slightly
  above the 300-char soft target but validator Check 10 passed), and a
  `flowchart LR` with 6 short-labelled nodes horizontal (safe for width).
  No nested heavy layouts, no `grid grid-cols-2` with Mermaid inside, no code
  block >15 lines in the first 5. Marking ✅.
- `review-presentation.sh` reports score **82 (Good)**. It flags "15 empty /
  17 no-heading slides" because its parser splits every intra-slide `---`
  block (including frontmatter closings) into a phantom slide — this is a
  known review-script counting limitation, not a real content defect. The
  actual deck is 17 well-formed slides.
- All first-cover density checks passed.

## Remediation

- No failures to remediate. One cosmetic follow-up: the `review-presentation.sh`
  heuristic inflates the slide count by treating each frontmatter-close `---`
  as a new slide boundary. This doesn't affect the acceptance score, but if
  we want a cleaner review output the script could be hardened to skip
  `---` lines that are immediately preceded by a blank line after a
  `layout:`/`class:` block (i.e., real frontmatter closings). Out of scope
  for SP1 acceptance.
