# Scenario 01 — image-focus layout (`--mock success` + user-override)

**Primary layout:** `image-focus`
**Primary mock path:** `success`
**Secondary paths proven:** `user-override` (in-deck)
**Target deck shape:** 7-slide product-vision pitch: cover + agenda + 1 × image-focus (auto) + 1 × content + 1 × image-focus (user-override) + 1 × content + closing

## Prompt to give the skill

> Make a 7-slide product-vision pitch for our internal engineering team —
> "unify our build and deploy story in 2026". Include two image-focus slides:
> one for the vision shot (let the skill generate it) and one with our
> existing hero photo at `public/hero.jpg` (use as user override).
> Executive-minimalist aesthetic.

## Mock directive

- **Do NOT** set `GEMINI_API_KEY`.
- **Do** pass `--mock success` to `generate-images.sh`.
- Scenarios drive `generate-images.sh` and `run.sh build` **separately**, because `build-deck.sh` does not forward `--mock` to `generate-images.sh`.

## Anti-hallucination rules

1. Quote actual stdout — no paraphrase, no "I observed that …".
2. Every ✅ must cite the exact output line that proves it.
3. If actual output differs from this scenario.md, record the actual output and mark ❌ — do NOT rewrite expectations.
4. All commands go through `tee <step>.log`; reviewers must be able to re-run the scenario from these logs alone.

## Procedure

Run from the repository root.

```bash
set -o pipefail
cd "$(git rev-parse --show-toplevel)"
SKILL_ROOT="$PWD/skills/slidev"
DECK=/tmp/sp2-scenario-01-image-focus
rm -rf "$DECK"
```

1) **Initialize the deck directory.**
   ```bash
   bash "$SKILL_ROOT/scripts/new-presentation.sh" "$DECK" \
     --title "Unify Build & Deploy: 2026 Vision" \
     --author "Platform Team" \
     --theme minimal-exec \
     --minimal
   ```
   Expect: the script prints `[new-presentation] ✓ …` lines and the directory exists.

2) **Copy the user-override hero image** from the existing smoke fixture:
   ```bash
   mkdir -p "$DECK/public"
   cp "$SKILL_ROOT/evals/sp2-scenarios/fixtures/minimal-deck/public/hero.jpg" \
      "$DECK/public/hero.jpg"
   sha256sum "$DECK/public/hero.jpg" | tee "$DECK/hero.sha256.before"
   ```

3) **Write `slides.md`** to produce exactly this shape (substitute the skill's Step 3 — do NOT free-form; the acceptance expectations assume this structure):

   ```yaml
   ---
   title: Unify Build & Deploy — 2026 Vision
   date: 2026-04-23
   theme: default
   colorSchema: light
   class: text-center
   highlighter: shiki
   ---

   # Unify Build & Deploy

   2026 Platform Vision · Platform Team · 2026-04-23

   ---
   layout: default
   class: skeleton-list agenda
   ---

   # Agenda

   <div class="content">

   1. Where we are today
   2. Vision: one pipeline, one artifact, one story
   3. The new developer workflow
   4. What this unlocks next quarter
   5. Rollout & ask

   </div>

   ---
   layout: default
   class: image-focus
   title: One Pipeline
   image_prompt: Minimalist editorial illustration of converging parallel tracks becoming a single smooth road, optimistic morning light, no text, no logos
   ---

   <div class="image-wrapper">
     <img src="public/generated/auto.png" alt="Converging tracks into one pipeline" />
   </div>

   # One Pipeline, One Artifact

   ---
   layout: default
   class: skeleton-list content-bullets
   ---

   # Why This Matters Now

   <div class="content">

   - Three deploy paths today; engineers pick the wrong one weekly
   - Incident-to-rollback: 24 min average (goal: 5)
   - New-hire ramp stalls on deploy knowledge for days

   </div>

   ---
   layout: default
   class: image-focus
   title: Our Team, In One Photo
   image_prompt: Hand-supplied team hero photograph placeholder used as user override, no text, no logos
   image_path: public/hero.jpg
   ---

   <div class="image-wrapper">
     <img src="public/hero.jpg" alt="Platform team portrait" />
   </div>

   # The Team Behind This

   ---
   layout: default
   class: skeleton-list content-bullets
   ---

   # What Unlocks Next Quarter

   <div class="content">

   - One rollback command across all services
   - Canary by default, not by opt-in
   - Deploy metrics in every PR

   </div>

   ---
   layout: end
   class: skeleton-hero
   ---

   # Questions?

   Platform Team · 2026-04-23
   ```

   Write this exact content to `$DECK/slides.md` (overwriting the starter's default).

4) **Sanity-check environment:**
   ```bash
   unset GEMINI_API_KEY
   env | grep GEMINI || echo "ok: no GEMINI in env"
   ```
   Expect: `ok: no GEMINI in env`.

5) **Run validate:**
   ```bash
   bash "$SKILL_ROOT/scripts/validate-slides.sh" "$DECK/slides.md" 2>&1 | tee "$DECK/validate.log"
   echo "validate exit=$?"
   ```
   Expect: last line `Result: N passed, 0 failed, 0 warnings`; `validate exit=0`.

6) **Generate images with mock success:**
   ```bash
   bash "$SKILL_ROOT/scripts/generate-images.sh" "$DECK" --mock success 2>&1 | tee "$DECK/generate.log"
   echo "generate exit=$?"
   ```
   Expect: `[SP2] Summary: 1 generated, 0 cached, 0 placeholder, 1 user-provided`; `generate exit=0`.

7) **Capture post-state:**
   ```bash
   ls -la "$DECK/public/generated/" | tee "$DECK/ls-after.txt"
   sha256sum "$DECK/public/hero.jpg" | tee "$DECK/hero.sha256.after"
   diff "$DECK/hero.sha256.before" "$DECK/hero.sha256.after" && echo "HERO UNCHANGED"
   ```
   Expect: `generated/` contains exactly 1 `.png` file (the auto image); the two sha256 lines match; prints `HERO UNCHANGED`.

8) **Build static site:**
   ```bash
   bash "$SKILL_ROOT/scripts/run.sh" build "$DECK/slides.md" 2>&1 | tee "$DECK/build.log"
   echo "build exit=$?"
   test -f "$DECK/dist/index.html" && echo "DIST OK"
   ```
   Expect: `build exit=0` and `DIST OK`.

9) **Regression check — SP2 static tests still pass:**
   ```bash
   bash "$SKILL_ROOT/scripts/test-sp2-static.sh" 2>&1 | tee "$DECK/static.log"
   ```
   Expect: last line `SP2 static tests: 17 passed, 0 failed`.

10) **Fill `result.md`** — mark each E below ✅ or ❌ and paste the exact output snippet in the Evidence log section.

## Expectations (10 items)

- [ ] **E1** Deck contains exactly 2 slides with `class: image-focus` (one auto, one override).
  Evidence: `grep -c "^class: image-focus$" "$DECK/slides.md"` = 2.

- [ ] **E2** Every image-* slide has a valid `image_prompt` (40–150 chars, includes "no text"/"no logos").
  Evidence: Check 11 line in `validate.log` reads `PASS  Check 11: image prompt validation (2 OK)`.

- [ ] **E3** `image_path` fields comply: one slide omitted (auto), one points to `public/hero.jpg` which exists.
  Evidence: `ls -la "$DECK/public/hero.jpg"` succeeds; no `FAIL.*Check 11` line in `validate.log`.

- [ ] **E4** `validate-slides.sh` reports 0 FAIL, 0 WARN.
  Evidence: `grep -E "Result: [0-9]+ passed, 0 failed, 0 warnings" "$DECK/validate.log"` matches a line.

- [ ] **E5** `generate-images.sh --mock success` exits 0.
  Evidence: `generate exit=0` line in stdout (captured in shell transcript).

- [ ] **E6** `public/generated/` contains exactly 1 PNG, 0 SVG.
  Evidence: `find "$DECK/public/generated/" -name '*.png' | wc -l` = 1; `find "$DECK/public/generated/" -name '*.svg' | wc -l` = 0.

- [ ] **E7** Summary line equals `[SP2] Summary: 1 generated, 0 cached, 0 placeholder, 1 user-provided`.
  Evidence: `grep "Summary:" "$DECK/generate.log"` matches the expected string verbatim.

- [ ] **E8** User-provided `hero.jpg` file is byte-identical before and after the pipeline run.
  Evidence: `diff "$DECK/hero.sha256.before" "$DECK/hero.sha256.after"` produces no output (files match); the `HERO UNCHANGED` line is present in the transcript.

- [ ] **E9** `run.sh build` completes and `dist/index.html` exists.
  Evidence: `build exit=0` line; `DIST OK` line; `test -f "$DECK/dist/index.html"` succeeds.

- [ ] **E10** `test-sp2-static.sh` reports `17 passed, 0 failed`.
  Evidence: `grep "17 passed, 0 failed" "$DECK/static.log"` matches.

## Scoring

- Per-scenario pass threshold: ≥ 8/10 expectations ✅
- Aggregate with 02 and 03: ≥ 27/30 (≥ 90%)
- See `evals/sp2-scenarios/DELIVERY.md` for final tally.

## Cleanup

After filling `result.md`:
```bash
rm -rf /tmp/sp2-scenario-01-image-focus
```
