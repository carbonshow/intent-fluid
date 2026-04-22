# Scenario 1 — Result

**Date run**: 2026-04-22
**Skill commit SHA**: aba5c922608098b417c99022ce8bc57fac08381a
**Operator**: subagent-v2-scenario-1

## Actual outputs

- **Theme chosen**: `tech-dark` — matches "modern tooling aesthetics" + technical peers + deep internals + dark/signal-forward keywords
- **Slide count**: 18 (cover + agenda + big-statement + 14 content + closing)
- **Verbosity**: `standard`
- **Tone**: `technical`
- **Density tier default**: Normal

## Design Brief (summary)

- Audience: 15-person technical team, Rust-literate engineers
- Purpose: Inform (lean teach) — understand how Tokio turns `async fn` into scheduled polls
- Language: English
- Style keywords: `[modern-tooling, signal-forward, deep-internals, dark]`
- Key messages:
  1. `async fn` is a compiler-generated state machine; the runtime drives it via `poll`
  2. Tokio uses work-stealing + a LIFO slot to balance throughput and message-passing latency
  3. Wakers are the hand-off mechanism from reactor → executor
  4. Cooperative scheduling has a budget; blocking breaks it
- Layout mix: 1 cover, 1 agenda, 1 big-statement, 2 content-narrative, 3 content-bullets, 3 diagram-primary, 4 code-focus, 1 three-metrics, 1 two-columns (bullets × bullets), 1 closing

## Expectation results

- [x] E1 Theme ∈ {tech-dark, code-focus-light} — chose `tech-dark`
- [x] E2 Agenda in first 3 slides (slide 2)
- [x] E3 ≥ 3 `code-focus` or `diagram-primary` — 4 code-focus + 3 diagram-primary = 7 total
- [x] E4 ≥ 1 `image-focus` or `big-statement` — one `big-statement` (slide 3)
- [x] E5 `section-divider` rule obeyed — deck is 18 slides (≤ 20), no dividers used
- [x] E6 First slide is `cover` (`layout: cover` + `class: skeleton-hero`)
- [x] E7 Closing uses `layout: end` + `class: skeleton-hero`
- [x] E8 Check 10 zero FAIL — `validate-slides.sh` reports 11 passed / 0 failed / 0 warnings
- [x] E9 First 5 slides render without overflow (static check — see note)
- [x] E10 Slide count between 10 and 25 — 18 slides

## Score

**Items ticked**: 10 / 10

## Notes / failures

- v2 visual quality: **this deck should look noticeably better than the SP1.v1
  equivalent.** The compound classes (e.g. `skeleton-list agenda`,
  `skeleton-code-diagram code-focus`, `skeleton-hero big-statement`) now route
  each layout through a shared geometric skeleton that applies CSS Grid row
  templates (`auto 1fr` for list, `auto 1fr auto` for data and code-diagram),
  wraps bodies in the prescribed `.content` / `.data-body` / `.content-body`
  containers, and pulls spacing/typography from design tokens
  (`--space-*`, `--text-*`). The v1 themes sized each layout ad-hoc, so code
  blocks and mermaid diagrams could float at the top of the slide with dead
  space underneath. Here the skeleton centers each body in the remaining
  vertical room and caps it to the viewport — so the `flowchart LR` on
  slide 7 and the code on slide 5 should visually centre automatically.
  The `tech-dark` aesthetics layer (colors + Inter/JetBrains fonts)
  still applies on top, so nothing was lost.
- E9 is a static judgement (no browser available in this session). First 5
  slides: (1) cover with title + 1-line subtitle + attribution, (2) agenda
  with 6 short items, (3) big-statement at ~65 chars well under the 120
  ceiling, (4) content-narrative shortened to ~380 chars (slightly above the
  300 soft target but validator Check 10 passed and `content` flexes to
  available space), (5) code-focus with 10-line Rust `async fn` + comment
  block. No `grid grid-cols-2` + mermaid combos, no code > 15 lines, no
  nested heavy layouts. Marking ✅.
- `review-presentation.sh` reports **82 (Good)** and flags "16 empty /
  18 no-heading slides" — same known parser limitation documented in the
  v1 result: the review script splits on every `---` including frontmatter
  closings, inflating the slide count to 35 phantoms. Actual deck is 18
  well-formed slides, all with headings except `big-statement` which uses
  a `<div class="statement">` per the catalog template.
- v2 compatibility: the compound class string (`skeleton-list agenda`,
  `skeleton-code-diagram code-focus`, etc.) validated cleanly through
  Check 10. The parser in `validate-slides.sh` tokenizes the class field
  and matches each semantic layout's expected token against the set, so
  both the v1-style bare class (`agenda`) and the v2 compound form
  (`skeleton-list agenda`) are accepted — confirming backwards
  compatibility claim.

## Remediation

- No failures to remediate. One cosmetic follow-up (pre-existing, also
  noted in v1 result): `review-presentation.sh`'s slide-count heuristic
  treats every frontmatter-close `---` as a new slide boundary. Does not
  affect acceptance; out of scope for SP1.v2 acceptance.
