# Scenario 03 — Result

**Date run**: 2026-04-27
**Skill commit SHA**: 880efead2e14a14d6afe2bd9ab59e97e8c42279c
**Operator**: general-purpose-3

## Actual outputs

- **Theme chosen**: edu-warm
- **Slide count**: 7
- **Image slides**: 2 two-cols-header slides, 3 declared image columns, 2 actually processed by pipeline (left-column-only behavior in slides-parser.js)

## Brief summary

Scenario 03 tested the `two-cols-header` layout with `pattern: image` columns under a two-round mock flow: round 1 (`--mock content_policy`) produced 2 SVG placeholders; round 2 (`--mock success`) hit cache and produced no new files. Core SP2 pipeline behavior (E5–E8) passed perfectly. E1–E3 and E10 also passed. Two expectations failed: E4 (validate-slides Check 10 requires `image_path`+`alt_text` which the scenario's own YAML template omits) and E9 (build fails because `auto.png` literal in slide body cannot be resolved by Rollup when only SVG placeholders exist on disk).

## Expectation results

- [x] **E1** `grep -c "^layout: two-cols-header$" "$DECK/slides.md"` = 2; `grep -c "^  pattern: image$" "$DECK/slides.md"` = 3
- [x] **E2** `PASS  Check 11: image prompt validation (3 OK)`
- [x] **E3** `grep -c "image_path:" "$DECK/slides.md"` = 0
- [ ] **E4** Actual: `Result: 11 passed, 6 failed, 0 warnings` — 6 Check 10 FAILs (image_path / alt_text missing on image-pattern columns). Expected: `Result: N passed, 0 failed, 0 warnings`.
- [x] **E5** `generate r1 exit=0`; `generate r2 exit=0`
- [x] **E6** `svg-count-r1.txt` = 2; `svg-count-r2.txt` = 2; `png-count-r2.txt` = 0; `diff ls-r1.txt ls-r2.txt` empty
- [x] **E7** `[SP2] Summary: 0 generated, 0 cached, 2 placeholder, 0 user-provided`
- [x] **E8** `[SP2] Summary: 0 generated, 2 cached, 0 placeholder, 0 user-provided`
- [ ] **E9** `build exit=0` (run.sh wrapper absorbed Rollup's exit 1) but `DIST MISSING` — Rollup failed to resolve `public/generated/auto.png`; `dist/index.html` absent. Expected: `build exit=0`; `DIST OK`.
- [x] **E10** `SP2 static tests: 17 passed, 0 failed`

## Score

**Items ticked**: 8 / 10

## Evidence log

```
# Step 1 — init
Presentation created at: /tmp/sp2-scenario-03-two-columns-image

# Step 3 — no key
ok: no GEMINI in env

# Step 4 — validate
Validating: /tmp/sp2-scenario-03-two-columns-image/slides.md

  PASS  File exists and is non-empty
  PASS  Frontmatter opens with --- on line 1
  PASS  Frontmatter has closing --- on line 8
  PASS  No --- found inside frontmatter body
  PASS  colorSchema: light is set
  PASS  title field is present
  PASS  No --- found inside HTML blocks
  PASS  v-click tags are balanced (0 open, 0 close)
  PASS  v-mark tags are balanced (0 open, 0 close)
  PASS  No magic-move blocks (nothing to check)
  FAIL  Check 10 — Slide 3: two-columns.left.image missing required 'image_path'
        Fix: Fix the slide frontmatter or swap to a supported layout.
  FAIL  Check 10 — Slide 3: two-columns.left.image missing required 'alt_text'
        Fix: Fix the slide frontmatter or swap to a supported layout.
  FAIL  Check 10 — Slide 3: two-columns.right.image missing required 'image_path'
        Fix: Fix the slide frontmatter or swap to a supported layout.
  FAIL  Check 10 — Slide 3: two-columns.right.image missing required 'alt_text'
        Fix: Fix the slide frontmatter or swap to a supported layout.
  FAIL  Check 10 — Slide 4: two-columns.left.image missing required 'image_path'
        Fix: Fix the slide frontmatter or swap to a supported layout.
  FAIL  Check 10 — Slide 4: two-columns.left.image missing required 'alt_text'
        Fix: Fix the slide frontmatter or swap to a supported layout.
  PASS  Check 11: image prompt validation (3 OK)

Result: 11 passed, 6 failed, 0 warnings
validate exit=0

# Step 5 — Round 1 content_policy
[SP2] Deck: /tmp/sp2-scenario-03-two-columns-image
[SP2] Theme: edu-warm
[SP2] Found 2 images to process
[SP2] ⚠ slide 3 placeholder: public/generated/3f94b495f366a383.svg (content_policy: mock content_policy)
[SP2] ⚠ slide 4 placeholder: public/generated/963e1a455cd782b0.svg (content_policy: mock content_policy)
[SP2] Summary: 0 generated, 0 cached, 2 placeholder, 0 user-provided
generate r1 exit=0

# Step 6 — Round-1 file state
total 16
drwxr-xr-x@ 4 wenzhitao  wheel  128 Apr 27 11:49 .
drwxr-xr-x@ 4 wenzhitao  wheel  128 Apr 27 11:49 ..
-rw-r--r--@ 1 wenzhitao  wheel  583 Apr 27 11:49 3f94b495f366a383.svg
-rw-r--r--@ 1 wenzhitao  wheel  582 Apr 27 11:49 963e1a455cd782b0.svg
svg-count-r1: 2
svg-reason-r1: Image unavailable · Content policy rejected

# Step 7 — Round 2 success (cache-hit)
[SP2] Deck: /tmp/sp2-scenario-03-two-columns-image
[SP2] Theme: edu-warm
[SP2] Found 2 images to process
[SP2] ✓ slide 3 (two-cols-header) cached: public/generated/3f94b495f366a383.svg
[SP2] ✓ slide 4 (two-cols-header) cached: public/generated/963e1a455cd782b0.svg
[SP2] Summary: 0 generated, 2 cached, 0 placeholder, 0 user-provided
generate r2 exit=0

# Step 8 — Round-2 file state
total 16
drwxr-xr-x@ 4 wenzhitao  wheel  128 Apr 27 11:49 .
drwxr-xr-x@ 4 wenzhitao  wheel  128 Apr 27 11:49 ..
-rw-r--r--@ 1 wenzhitao  wheel  583 Apr 27 11:49 3f94b495f366a383.svg
-rw-r--r--@ 1 wenzhitao  wheel  582 Apr 27 11:49 963e1a455cd782b0.svg
svg-count-r2: 2
png-count-r2: 0
diff ls-r1.txt ls-r2.txt: (empty — files identical)

# Step 9 — Build
Running: slidev build
  Slides: /tmp/sp2-scenario-03-two-columns-image/slides.md
  Theme:  /Users/wenzhitao/Projects/github/intent-fluid/skills/slidev/assets/runner/node_modules/@slidev/theme-default

vite v7.3.2 building client environment for production...
transforming...
✓ 239 modules transformed.
✗ Build failed in 411ms
[vite]: Rollup failed to resolve import "public/generated/auto.png" from "/tmp/sp2-scenario-03-two-columns-image/slides.md__slidev_3.md".
build exit=0
DIST MISSING

# Step 10 — Static regression
  PASS  Test 1: all 6 image-style.txt files exist and are non-empty
  PASS  Test 2: Check 11 FAILs on missing image_prompt
  PASS  Test 3: Check 11 FAILs on short image_prompt
  PASS  Test 4: Check 11 FAILs on missing user-provided image_path
  PASS  Test 5: Check 11 PASSes on fixture
  PASS  Test 6: --dry-run produces summary
  PASS  Test 7: hash stability: identical hashes across runs (2a455910e11fe3f3,314dc353651ecedc,)
  PASS  Test 8: placeholder-svg generates well-formed SVG for all 6 themes
  PASS  Test 9a: --mock success writes PNG files (2 found)
  PASS  Test 9b: --mock timeout writes placeholder SVGs (2 found)
  PASS  Test 9c: --mock content_policy logs error code
  PASS  Test 10: user-provided path skipped (file unchanged)
  PASS  Test 11: --force regenerates (mtime advanced)
  PASS  Test 12: gemini-client unit tests pass
  PASS  Test 13: slides-parser unit tests pass
  PASS  Test 14: theme-colors unit tests pass
  PASS  Test 15: placeholder-svg unit tests pass

SP2 static tests: 17 passed, 0 failed
```

## Notes / failures

**E4 — Check 10 failures (6 FAILs)**: The slides.md YAML prescribed by scenario.md uses `pattern: image` with `image_prompt` but does NOT include `image_path` or `alt_text` fields in the per-column frontmatter. Check 10 in validate-slides.sh requires both `image_path` and `alt_text` on every image-pattern column. The scenario's expected result ("0 failed") is inconsistent with the YAML template it prescribes. Note: `validate exit=0` despite the 6 FAILs (the validator reports failures but exits 0 for these non-blocking checks).

**E9 — Build fails**: `run.sh build` internally gets exit 1 from Rollup (printed as `Exit code 1` by run.sh wrapper) but the wrapper script itself exits 0. The root cause is that slides.md contains `<img src="public/generated/auto.png" …>` literal references, but only SVG placeholder files exist on disk after the mock rounds. Rollup cannot resolve the literal `.png` import reference, so the build fails and `dist/index.html` is never written.

## Remediation notes

- **E4**: The scenario.md YAML template for two-cols-header image columns should either include `image_path` and `alt_text` fields (SP1 path), or Check 10 should be relaxed for columns that declare `pattern: image` with `image_prompt` (SP2 auto-generation path). Scenario expectation should be updated to reflect the actual 6 Check 10 failures.
- **E9**: The `<img src="public/generated/auto.png">` placeholder in the template body creates a hard Rollup dependency on a literal filename. Either the build script should tolerate missing assets (e.g., `build.rollupOptions.external`), or the generate-images pipeline should rewrite `auto.png` references to actual generated filenames before building.
