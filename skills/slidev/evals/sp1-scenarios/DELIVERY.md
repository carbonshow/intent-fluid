# SP1 — Style & Layout Intelligence — Delivery

## Status

**Delivered.** All acceptance criteria from the SP1 design spec (`docs/superpowers/specs/2026-04-21-sp1-style-layout-intelligence-design.md`) are met.

## Automated gates — all passing

```
test-sp1-static.sh            10 passed, 0 failed
theme-flag-tests.sh            9 passed, 0 failed
check10-tests.sh               5 passed, 0 failed
.preflight.sh                  shellcheck clean, markdown clean
```

Combined: **24 automated tests, 0 failures.**

## Scenario E2E results — all passing

Three fresh subagents ran the three scenarios end-to-end (read SKILL.md from scratch, processed the prompt, produced a brief, wrote slides, validated, reviewed, scored against 10 expectations each):

| Scenario | Theme chosen | Slides | Verbosity | Score |
|----------|-------------|--------|-----------|-------|
| 01 Technical talk (Rust async) | tech-dark | 17 | standard | 10/10 |
| 02 Executive report (Q1 review) | corporate-navy | 9 | concise | 10/10 |
| 03 Educational course (DS intro) | edu-warm | 18 | text-heavy | 10/10 |

**Overall: 30/30 = 100%** (threshold: ≥ 80% per-scenario, ≥ 90% overall).

Each scenario's full details — chosen theme rationale, outline, expectation-by-expectation evidence, and notes — are in `0{1,2,3}-*/result.md`.

## Artifacts

- **6 curated themes**: `skills/slidev/assets/themes/*.css`
  - tech-dark, code-focus-light, corporate-navy, minimal-exec, edu-warm, playful-bright
  - Each defines the 9 required CSS variables and 14 layout class specializations
- **Theme selection guide**: `skills/slidev/references/theme-library.md`
- **Layout catalog**: `skills/slidev/references/layout-catalog.md` (15 semantic layouts, each with 8 required sub-sections)
- **3-parameter capture + hard gate**: `skills/slidev/references/content-strategy.md` §6 + brief template
- **SKILL.md wiring**: Step 2 (theme/layout inference + hard gate) + Step 3 (schema discipline)
- **Script extensions**:
  - `new-presentation.sh --theme <name>` (6 themes + validation)
  - `validate-slides.sh` Check 10 (schema-aware)
  - `scripts/lib/parse-catalog.py` (catalog parser)
  - `scripts/test-sp1-static.sh` (10 static checks)
- **Test fixtures**: 5 Check 10 fixtures + runner, theme-flag test runner
- **Scenario fixtures**: 3 scenarios × (scenario.md + filled result.md) under `evals/sp1-scenarios/`
- **Troubleshooting**: `references/troubleshooting.md` — SP1 theme & schema sections

## Pending (operator)

One last item from spec §9.5 DoD remains for the human operator:

- **Manual `run.sh dev` + PDF export smoke test**: pick one generated deck, run `scripts/run.sh dev <path>/slides.md` to render in browser, then `scripts/run.sh export <path>/slides.md` to produce a PDF. Verify visually.

This can only be done by a human with a browser; it wasn't automated because it requires visual judgement of how the deck looks, not just whether it parses.

## Observations from the scenario runs

- **Theme inference works**: all three scenarios picked the most-fit theme from theme-library.md on the first attempt. No scenarios fell through to the `tech-dark` default fallback.
- **Layout discipline holds**: all three decks are 100% Check-10-clean (0 FAIL / 0 WARN). Subagents used schema-override sparingly (once, for a justified case in Scenario 1).
- **review-presentation.sh has a known counting artifact**: it counts each per-slide `---` frontmatter boundary as a separate "slide", which inflates empty-slides and no-heading counts. All three scenarios scored 82/100 (Good) because of this, not because of real content defects. ~~Candidate follow-up for a later maintenance pass (not blocking SP1).~~ **Fixed 2026-04-23** — parser rewritten as a BODY ↔ FM state machine (mirrors `scripts/lib/slides-parser.js`); regression guarded by `evals/sp1-scenarios/fixtures/review-count-tests.sh` (9 tests). Starter/fixture decks now score 95–100 (Excellent).

## What's next (SP2-5)

- **SP2 — Image Generation Pipeline** (Nano Banana / Gemini 2.5 Flash Image)
- **SP3 — Multi-Round Refinement Loop** (Reflexion-style verbal feedback)
- **SP4 — Self-Evolution via Sedimentation** (pattern extraction + skill versioning)
- **SP5 — Minimal Eval Suite** (Grader / Comparator / Analyzer framework)

Each will be captured in its own design spec (`docs/superpowers/specs/`) and implementation plan before work begins.

---

## SP1.v2 — Design Tokens & Geometric Skeleton (2026-04-22)

### Trigger

During DoD visual verification of v1, the user flagged that slide 7 (diagram-primary) rendered with the Mermaid diagram stuck to the top-left and a large blank bottom-right — a systematic centering failure, not a single bug. A UX audit (`docs/superpowers/research/2026-04-22-sp1-ux-audit.md`) identified **5 blockers + 10 majors** across the 15 layouts, all rooted in three systemic issues:

1. 8 of 15 layouts had no CSS geometry at all — relying on default block flow, content stuck to top-left
2. Spacing used 10+ non-systematic rem values; h1 font-size drifted across 4/6 themes
3. Theme CSS duplicated layout geometry 6 times with subtle inconsistencies

### What changed

**New `assets/themes/_skeleton.css`** — shared design system + geometric skeletons:

- **Typography scale**: Perfect Fourth 1.333× with body=18px; 7 steps (`--text-caption` → `--text-hero`)
- **Spacing scale**: 0.5rem base; 6 steps (`--space-1` through `--space-6` = 8/16/24/32/48/64px)
- **Color tokens**: 9 original + 3 new (`--color-border`, `--color-on-primary`, `--color-overlay`)
- **Line-height**: 3 steps (`--lh-tight` / `--lh-body` / `--lh-loose`)
- **5 layout skeletons**:
  - `skeleton-hero` (flex column center) — cover, section-divider, big-statement, closing
  - `skeleton-list` (`auto 1fr` grid, content row align-self:center) — agenda, content-bullets, content-narrative
  - `skeleton-data` (`auto 1fr auto` grid, flex-center data-body) — three-metrics, data-table, timeline-horizontal
  - `skeleton-code-diagram` (`auto 1fr auto` grid, flex-center content-body with max caps) — code-focus, diagram-primary
  - Dedicated CSS for Media class — image-focus (background + overlay), image-text-split, two-columns (natively two-cols-header)

**6 themes slimmed** — each theme is now `@import _skeleton.css` + token overrides + ~80-line theme aesthetics block. Per-theme geometry duplication eliminated.

**Catalog templates updated** — every layout's `class:` now prefixed with its skeleton class (e.g. `skeleton-list agenda`); body content wrapped in `.content` / `.data-body` / `.content-body` as required by the skeleton.

**New `scripts/audit-visual.sh`** — Playwright-driven visual audit. 6 themes × 15 layouts = 90 PNG screenshots, each checked against 4 geometric assertions (no overflow, vertical centering ≤30% deviation, h1 font-size in [35,140]px, three-metrics row alignment).

### Verification

```
test-sp1-static.sh        10 / 10 PASS
theme-flag-tests.sh        9 / 9  PASS
check10-tests.sh           5 / 5  PASS
audit-visual.sh           90 / 90 PASS  (Playwright, 4 assertions each)
─────────────────────────────────────────
Total automated            114 / 114 PASS
```

### Scenario E2E results (v2 re-run)

Three parallel subagents re-ran the 3 SP1 scenarios against v2 from scratch:

| Scenario | Theme | Slides | Verbosity | Score (v1 → v2) |
|---|---|---|---|---|
| 01 Technical talk (Rust async) | tech-dark | 18 | standard | 10/10 → 10/10 |
| 02 Executive report (Q1 VP review) | corporate-navy | 10 | concise | 10/10 → 10/10 |
| 03 Educational course (DS intro) | edu-warm | 19 | text-heavy | 10/10 → 10/10 |

**Overall: 30/30 = 100%** (unchanged from v1 — schema backwards-compatible).

### v2 compatibility with authored decks

- **Compound class strings** (e.g. `skeleton-list agenda`) work cleanly. Check 10's Python validator tokenizes the class field into a set and checks semantic class membership — so both v1 bare classes (`agenda`) and v2 compound form both validate.
- **Wrapper divs** (`.content` / `.data-body` / `.content-body`) are the one new authoring rule vs v1. Subagents found them trivially followable by reading the catalog templates.
- **No regressions** — all three scenarios scored identical to v1.

### UX audit issues addressed

Source: `docs/superpowers/research/2026-04-22-sp1-ux-audit.md`

- **All 5 blockers** (content-bullets geometry; cover/section-divider/closing no CSS; h1 font-size drift) — FIXED via skeleton + tokens
- **All 10 majors** (vertical centering, overflow caps, caption styling, alignment, border tokens) — FIXED
- **3 minors** (spacing drift, metric/big-statement scale, `<p>` rule) — addressed via tokenized base rules

### New regression surface

- `audit-visual.sh`: 90 visual checks, manually runs on demand (slow; not in preflight). Run after theme or layout CSS changes.
- Static + check10 suites remain 24 checks, run on every preflight.

### Observations

- **The visual weight rebalanced itself**. v1 had the "content pile at top-left, empty bottom-right" pattern on 8 layouts. v2 fixes this everywhere by making `align-self: center` / flex-center / grid row `1fr` the default at the skeleton level.
- **Theme drift eliminated**. h1 font-size is now identical across 6 themes (all consume `var(--text-h1)`); previously 4/6 themes didn't declare it and inherited Slidev defaults. Same for spacing.
- **review-presentation.sh still has its known counting bug** — all 3 scenarios score 82/100 because of per-slide `---` false-positive slide counting. This is a pre-existing artifact, not a v2 regression. ~~Candidate follow-up for a maintenance pass.~~ **Fixed 2026-04-23** (see top section).

### Breaking changes vs SP1 v1

- Existing decks written against v1 keep working (Check 10 tokenizer accepts bare classes). New decks written with v2 use compound classes; the catalog templates are the canonical guide.
- Theme CSS file structure: if a user has written their own theme, they need to switch to the `@import _skeleton.css` + token-override pattern. The old 180-line self-contained theme still works but re-implements geometry that the skeleton could provide for free.
