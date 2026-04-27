# Scenario 01 — Result

**Date run**: 2026-04-27
**Skill commit SHA**: 880efead2e14a14d6afe2bd9ab59e97e8c42279c
**Operator**: subagent-scenario-01

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
- [ ] E9 `run.sh build` completes and `dist/index.html` exists. (actual: `✗ Build failed in 433ms` — Rollup failed to resolve import `"public/generated/auto.png"` from the image-focus slide; the generated file is named by content-hash `a3a7404ed50d443e.png` not `auto.png`; `dist/index.html` was NOT created; `DIST OK` not printed; `build exit=0` was captured from the tee shell, not from slidev which exited 1)
- [x] E10 `test-sp2-static.sh` reports `17 passed, 0 failed`.

## Score

**Items ticked**: 9 / 10

## Evidence log

```
E1: grep -c "^class: image-focus$" "$DECK/slides.md"
2

E2: grep "Check 11" "$DECK/validate.log"
  PASS  Check 11: image prompt validation (3 OK)

E3: ls -la "$DECK/public/hero.jpg"
-rw-r--r--@ 1 wenzhitao  wheel  1 Apr 27 11:48 /tmp/sp2-scenario-01-image-focus/public/hero.jpg
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

E9: ✗ Build failed in 433ms
[vite]: Rollup failed to resolve import "public/generated/auto.png" from "/tmp/sp2-scenario-01-image-focus/slides.md__slidev_3.md".
This is most likely unintended because it can break your application at runtime.
If you do want to externalize this module explicitly add it to
`build.rollupOptions.external`
build exit=0  (captured from tee shell; slidev process itself exited 1)
test -f "$DECK/dist/index.html"  →  DIST MISSING

E10: grep "17 passed, 0 failed" "$DECK/static.log"
SP2 static tests: 17 passed, 0 failed
```

## Notes / failures

- **E9 failure root cause**: The scenario's prescribed `slides.md` (Step 3 exact YAML) hard-codes `<img src="public/generated/auto.png" ...>` in the image-focus slide body. However `generate-images.sh` saves files under a content-hash filename (`a3a7404ed50d443e.png`), not `auto.png`. Vite/Rollup (vite 7.3.2, Slidev v52.14.2) attempts to resolve `public/generated/auto.png` as a static asset import and fails because the file does not exist, causing the build to abort with `✗ Build failed` and produce no `dist/index.html`.
- The `echo "build exit=$?"` in the transcript printed `build exit=0` because `$?` captures the exit of `tee` (which exited 0), not of `run.sh`/slidev (which exited 1). The Bash tool itself returned exit code 1 for the pipeline.
- All other steps (validate, generate, sha256, static regression) passed cleanly.

## Remediation

- **E9**: The Step 3 YAML in scenario.md hard-codes `public/generated/auto.png` in the `<img src>` attribute; the skill generates hash-named files. scenario.md should either: (a) instruct operators to replace `auto.png` with the actual hash filename after step 6, (b) use an absolute public-asset URL path (e.g. `/generated/<hash>.png`) that Rollup won't try to bundle, or (c) have `generate-images.sh` also create a stable `auto.png` symlink/alias alongside the hash file. Scenario expectation cannot be ticked as-is when the slides.md references a filename that does not exist at build time.
