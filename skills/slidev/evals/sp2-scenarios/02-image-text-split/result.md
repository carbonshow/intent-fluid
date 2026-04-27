# Scenario 02 — Result

**Date run**: 2026-04-27
**Skill commit SHA**: 420de9e0db8b855c7b985b80b06accc35820e575
**Operator**: subagent-rerun-02

## Actual outputs

- **Theme chosen**: corporate-navy
- **Slide count**: 8
- **Image slides**: 3 (layout: image-left × 2, layout: image-right × 1)

## Brief summary

8-slide architecture intro deck for a new engineering manager, describing a 1B events/day event pipeline (Ingest → Enrichment → Fanout). Three image-text-split slides (alternating image-left / image-right) + cover + agenda + 2 × content-bullets + closing. Initialization and validation succeeded; generate-images correctly fell back to placeholders when no GEMINI_API_KEY was set; static regression suite passed 17/17. Build step (E9) now exits 0 and produces dist/index.html — the /tmp symlink fix in run.sh (using realpath) resolved the prior Vite/Rollup path validation error on macOS.

## Expectation results

- ✅ **E1** 3 image-text-split slides (`layout: image-left`/`image-right`) present.
- ✅ **E2** Every image-* slide has a valid `image_prompt`; validate.log Check 11 passes.
- ✅ **E3** No `image_path` overrides used.
- ✅ **E4** `validate-slides.sh` reports 0 FAIL, 0 WARN.
- ✅ **E5** `generate-images.sh` exits 0 with no key.
- ✅ **E6** `public/generated/` contains 0 PNG, 3 SVG.
- ✅ **E7** Summary line equals `[SP2] Summary: 0 generated, 0 cached, 3 placeholder, 0 user-provided`.
- ✅ **E8** Key-setup hint and `aistudio.google.com/app/apikey` URL both present in generate.log.
- ✅ **E9** `run.sh build` exits 0; `dist/index.html` exists (DIST OK).
- ✅ **E10** `test-sp2-static.sh` reports `17 passed, 0 failed`.

## Score

**10 / 10**

## Evidence log

**E1** — `grep -cE "^layout: (image-left|image-right)$" "$DECK/slides.md"` → `3`

**E2** — validate.log line 11:
```
  PASS  Check 11: image prompt validation (4 OK)
```

**E3** — `grep -c "image_path:" "$DECK/slides.md"` → `0`

**E4** — validate.log:
```
Result: 12 passed, 0 failed, 0 warnings
validate exit=0
```

**E5** — stdout after generate-images.sh:
```
generate exit=0
```

**E6** — svg-count.txt = `3`; png-count.txt = `0`
```
total 24
drwxr-xr-x@ 5 wenzhitao  wheel  160 Apr 27 13:14 .
drwxr-xr-x@ 4 wenzhitao  wheel  128 Apr 27 13:14 ..
-rw-r--r--@ 1 wenzhitao  wheel  586 Apr 27 13:14 2d3366ca70f83c3b.svg
-rw-r--r--@ 1 wenzhitao  wheel  582 Apr 27 13:14 b0de26f77e06bc66.svg
-rw-r--r--@ 1 wenzhitao  wheel  582 Apr 27 13:14 f4249a7028cc21dc.svg
```

**E7** — generate.log:
```
[SP2] Summary: 0 generated, 0 cached, 3 placeholder, 0 user-provided
```
Matches expected string verbatim. ✅

**E8** — generate.log contains both required lines:
```
[SP2] ⚠  GEMINI_API_KEY not set — using placeholders for all images.
[SP2]   1. Get a key:  https://aistudio.google.com/app/apikey
```

**E9** — build.log (key lines):
```
✓ 444 modules transformed.
✓ built in 2.00s
build exit=0
DIST OK
```
`dist/index.html` exists. The prior /tmp symlink error is resolved — run.sh now uses `realpath` so Vite receives the canonical `/private/tmp/…` path and the fileName validation passes.

**E10** — static.log:
```
SP2 static tests: 17 passed, 0 failed
```

## Notes

**E9 — Build now PASSES (was ❌ in prior run):**
The `/tmp symlink fix in run.sh (commit 420de9e) resolves macOS's `/tmp` → `/private/tmp` symlink before passing the slides path to `slidev build`. Vite/Rollup no longer sees a path that looks like a relative traversal (`../../private/tmp/…`), so the `vite:build-html` VALIDATION_ERROR is gone. `build exit=0` and `dist/index.html` is produced. Score improves from 9/10 → 10/10.
