# Scenario 01 — Result

**Date run**: 2026-04-27
**Skill commit SHA**: 44a713f504a953f8f768c547bc8bd10769354d17
**Operator**: subagent-rerun-01b

## Actual outputs

- **Theme chosen**: minimal-exec
- **Slide count**: 7
- **Image slides**: 2

## Design Brief (summary)

Audience: internal engineering team. Purpose: product-vision pitch to unify build and deploy in 2026.
Language: English, executive-minimalist tone. Key messages: (1) three deploy paths today causing weekly
mistakes and 24-min rollbacks; (2) one pipeline/one artifact as the target state; (3) platform team is
ready with a clear rollout plan and ask. Layout mix: cover (text-center) + agenda (skeleton-list) + 2×
image-focus (auto-generated vision + user-override hero photo) + 2× content-bullets + closing (end/skeleton-hero).

## Expectation results

- [x] E1 Deck contains exactly 2 slides with `class: image-focus` (one auto, one override).
- [x] E2 Every image-* slide has a valid `image_prompt` (40–150 chars, includes "no text"/"no logos").
- [x] E3 `image_path` fields comply: one slide omitted (auto), one points to `public/hero.jpg` which exists.
- [x] E4 `validate-slides.sh` reports 0 FAIL, 0 WARN.
- [x] E5 `generate-images.sh --mock success` exits 0.
- [x] E6 `public/generated/` contains exactly 1 PNG, 0 SVG.
- [x] E7 Summary line equals `[SP2] Summary: 1 generated, 0 cached, 0 placeholder, 1 user-provided`.
- [x] E8 User-provided `hero.jpg` file is byte-identical before and after the pipeline run.
- [x] E9 `run.sh build` completes and `dist/index.html` exists.
- [x] E10 `test-sp2-static.sh` reports `17 passed, 0 failed`.

## Score

**Items ticked**: 10 / 10

## Evidence log

```
E1: grep -c "^class: image-focus$" "$DECK/slides.md"
2

E2: grep "Check 11" "$DECK/validate.log"
  PASS  Check 11: image prompt validation (3 OK)

E3: ls -la "$DECK/public/hero.jpg"
-rw-r--r--@ 1 wenzhitao  wheel  1 Apr 27 13:21 /tmp/sp2-scenario-01-image-focus/public/hero.jpg
(no FAIL.*Check 11 line in validate.log)

E4: grep -E "Result: [0-9]+ passed, 0 failed, 0 warnings" "$DECK/validate.log"
Result: 12 passed, 0 failed, 0 warnings

E5: generate exit=0
(from stdout after generate-images.sh tee run)

E6: find "$DECK/public/generated/" -name '*.png' | wc -l  →  1
    find "$DECK/public/generated/" -name '*.svg' | wc -l  →  0

E7: grep "Summary:" "$DECK/generate.log"
[SP2] Summary: 1 generated, 0 cached, 0 placeholder, 1 user-provided

E8: sha256sum before: 2d711642b726b04401627ca9fbac32f5c8530fb1903cc4db02258717921a4881  /tmp/sp2-scenario-01-image-focus/public/hero.jpg
    sha256sum after:  2d711642b726b04401627ca9fbac32f5c8530fb1903cc4db02258717921a4881  /tmp/sp2-scenario-01-image-focus/public/hero.jpg
    diff produced no output
    HERO UNCHANGED

E9 — PASS:
Running: slidev build
  Slides: /private/tmp/sp2-scenario-01-image-focus/slides.md
  Theme:  /Users/wenzhitao/Projects/github/intent-fluid/skills/slidev/assets/runner/node_modules/@slidev/theme-default

✓ 437 modules transformed.
dist/index.html   1.27 kB │ gzip:  0.62 kB
✓ built in 1.80s
build exit=0
DIST OK

Slides.md src= rewrites after generate-images.sh:
  <img src="/generated/a3a7404ed50d443e.png" alt="Converging tracks into one pipeline" />  (was: public/generated/auto.png)
  <img src="/hero.jpg" alt="Platform team portrait" />  (was: public/hero.jpg)
Neither "public/generated/auto.png" nor "public/hero.jpg" found in img src= attributes — both correctly rewritten to "/" form.

E10: grep "SP2 static tests" "$DECK/static.log"
SP2 static tests: 17 passed, 0 failed
```

## Notes

- **E9 now PASSES** at HEAD 44a713f. The fix (`patchPublicSrcs`) correctly rewrites both:
  - auto-generated image: `src="public/generated/auto.png"` → `src="/generated/<hash>.png"`
  - user-override image: `src="public/hero.jpg"` → `src="/hero.jpg"`
  Both paths are now absolute `/`-form references, which Vite/Rollup treats as static public-dir assets rather than module imports — build completes cleanly.
- `hero.jpg` byte content is unchanged (SHA-256 identical before/after); `patchPublicSrcs` only edits slides.md, not the image file itself.
- All 10 expectations pass. Full 10/10 score achieved.
