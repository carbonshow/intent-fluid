# Scenario 1 — Technical Talk

## Prompt to give the skill

> Explain the Rust async runtime scheduling strategy to a 15-person technical
> team, 40 minutes, go deep but don't be overly academic, style should fit
> modern tooling aesthetics.

## Expectations (10 items)

- [ ] **E1** Theme is `tech-dark` OR `code-focus-light` (must NOT be `edu-warm` or `playful-bright`)
- [ ] **E2** If deck has ≥ 5 slides, `agenda` appears within the first 3 slides
- [ ] **E3** At least 3 slides use `code-focus` OR `diagram-primary`
- [ ] **E4** At least 1 slide uses `image-focus` (screenshot/topology) OR `big-statement` (key conclusion)
- [ ] **E5** `section-divider` present only if slide count > 20
- [ ] **E6** First slide is `cover`
- [ ] **E7** If a closing slide exists, it uses `layout: end` (i.e., `closing`)
- [ ] **E8** `validate-slides.sh` Check 10 reports zero FAIL entries
- [ ] **E9** `run.sh dev` renders the first 5 slides without visible overflow
- [ ] **E10** Slide count falls between 10 and 25 (reasonable for 40 min)

## Procedure

1. Ensure you are on a clean worktree with SP1 installed.
2. Start a fresh Claude Code session and give the prompt above.
3. Walk the skill through Step 1 (initialize) and Step 2 (brief + hard gate).
4. Confirm the brief when presented. DO NOT modify it — the aim is to test
   the skill's default behavior against the expectations.
5. Let the skill write all slides (Step 3) and run validate + review.
6. Manually start `run.sh dev` and visually inspect slides 1-5.
7. Fill in `result.md` with ✅ / ❌ for each expectation.

## Scoring

- Per-scenario pass threshold: ≥ 80% of items ticked ✅
- Global SP1 pass threshold: ≥ 90% across all three scenarios combined
