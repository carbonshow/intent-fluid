# SP1 — Style & Layout Intelligence — Delivery

## Status

**Automated delivery complete.** All automated acceptance criteria from the SP1 design spec (`docs/superpowers/specs/2026-04-21-sp1-style-layout-intelligence-design.md`) are met. Manual scenario E2E runs (§9.2) and Playwright PDF export verification (§9.5) are operator tasks — see "Pending manual verification" below.

## Automated gates — all passing

```
test-sp1-static.sh            10 passed, 0 failed
theme-flag-tests.sh            9 passed, 0 failed
check10-tests.sh               5 passed, 0 failed
.preflight.sh                  shellcheck clean, markdown clean
```

Combined: **24 automated tests, 0 failures.**

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
- **Test fixtures**:
  - 5 Check 10 fixtures + runner
  - Theme-flag test runner
- **Scenario fixtures**: 3 scenarios × (scenario.md + result.md) under `evals/sp1-scenarios/`
- **Troubleshooting**: `references/troubleshooting.md` — SP1 theme & schema sections

## Pending manual verification

Three tasks remain for the operator before SP1 can be tagged fully released:

1. **Scenario 1 — Technical talk** (`evals/sp1-scenarios/01-tech-talk/`): run the prompt in a fresh Claude Code session, confirm the brief, let the skill generate slides, fill `result.md`.
2. **Scenario 2 — Executive report** (`evals/sp1-scenarios/02-exec-report/`): same procedure.
3. **Scenario 3 — Educational course** (`evals/sp1-scenarios/03-edu-course/`): same procedure.
4. **Dev + PDF export smoke test** (§9.5 DoD): pick one generated deck, run `scripts/run.sh dev <path>/slides.md` to render in browser, then `scripts/run.sh export <path>/slides.md` to produce a PDF. Verify visually.

Per-scenario pass threshold: ≥ 80% items ✅. Overall SP1 threshold: ≥ 90% across all three.

After all three are filled, run the score aggregator in Task 32 Step 8 of the plan.

## What's next (SP2-5)

- **SP2 — Image Generation Pipeline** (Nano Banana / Gemini 2.5 Flash Image)
- **SP3 — Multi-Round Refinement Loop** (Reflexion-style verbal feedback)
- **SP4 — Self-Evolution via Sedimentation** (pattern extraction + skill versioning)
- **SP5 — Minimal Eval Suite** (Grader / Comparator / Analyzer framework)

Each will be captured in its own design spec (`docs/superpowers/specs/`) and implementation plan before work begins.
