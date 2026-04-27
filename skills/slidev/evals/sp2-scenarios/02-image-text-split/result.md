# Scenario 02 — Result

**Date run**: 2026-04-27
**Skill commit SHA**: 880efead2e14a14d6afe2bd9ab59e97e8c42279c
**Operator**: general-purpose-1 (subagent)

## Actual outputs

- **Theme chosen**: corporate-navy
- **Slide count**: 8
- **Image slides**: 3 (layout: image-left × 2, layout: image-right × 1)

## Brief summary

8-slide architecture intro deck for a new engineering manager, describing a 1B events/day event pipeline (Ingest → Enrichment → Fanout). Three image-text-split slides (alternating image-left / image-right) + cover + agenda + 2 × content-bullets + closing. Initialization and validation succeeded; generate-images correctly fell back to placeholders when no GEMINI_API_KEY was set; static regression suite passed 17/17. Build step failed with a Vite/Rollup path error caused by macOS `/tmp` → `/private/tmp` symlink resolution.

## Expectation results

- ✅ **E1** 3 image-text-split slides (`layout: image-left`/`image-right`) present.
- ✅ **E2** Every image-* slide has a valid `image_prompt`; validate.log Check 11 passes.
- ✅ **E3** No `image_path` overrides used.
- ✅ **E4** `validate-slides.sh` reports 0 FAIL, 0 WARN.
- ✅ **E5** `generate-images.sh` exits 0 with no key.
- ✅ **E6** `public/generated/` contains 0 PNG, 3 SVG.
- ✅ **E7** Summary line equals `[SP2] Summary: 0 generated, 0 cached, 3 placeholder, 0 user-provided`.
- ✅ **E8** Key-setup hint and `aistudio.google.com/app/apikey` URL both present in generate.log.
- ❌ **E9** `run.sh build` exits 1; `dist/index.html` not created — Vite path error on macOS /tmp symlink.
- ✅ **E10** `test-sp2-static.sh` reports `17 passed, 0 failed`.

## Score

**9 / 10**

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
drwxr-xr-x@ 5 wenzhitao  wheel  160 Apr 27 11:49 .
drwxr-xr-x@ 4 wenzhitao  wheel  128 Apr 27 11:49 ..
-rw-r--r--@ 1 wenzhitao  wheel  586 Apr 27 11:49 2d3366ca70f83c3b.svg
-rw-r--r--@ 1 wenzhitao  wheel  582 Apr 27 11:49 b0de26f77e06bc66.svg
-rw-r--r--@ 1 wenzhitao  wheel  582 Apr 27 11:49 f4249a7028cc21dc.svg
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

**E9** — ❌ ACTUAL build.log (key lines):
```
✗ Build failed in 1.65s
[vite:build-html] The "fileName" or "name" properties of emitted chunks and assets must be strings that are neither absolute nor relative paths, received "../../private/tmp/sp2-scenario-02-image-text-split/index.html".
    code: 'PLUGIN_ERROR',
    pluginCode: 'VALIDATION_ERROR',
    plugin: 'vite:build-html',
    hook: 'generateBundle'
build exit=1
```
`dist/index.html` was not created (DIST MISSING). Expected: `build exit=0` and `DIST OK`.

**E10** — static.log:
```
SP2 static tests: 17 passed, 0 failed
```

## Notes

**E9 — Build failure (macOS /tmp symlink):**
`/tmp` on macOS is a symlink to `/private/tmp`. Vite/Rollup validates that the resolved `fileName` is neither absolute nor relative; after symlink resolution the path becomes `../../private/tmp/…` relative to the project root, triggering a VALIDATION_ERROR in the `vite:build-html` plugin. `run.sh` exits 1 (build error detected), and `dist/index.html` is never produced. This is an environment-specific issue on macOS that does not affect slide content or image generation correctness. Workaround: place the deck under `/private/tmp/` directly or under a non-symlinked path (e.g. `~/tmp/`). Suggested fix: resolve deck path with `realpath` in `run.sh` before passing to `slidev build`.
