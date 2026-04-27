# Scenario 03 — Result

- **Date:** 2026-04-27
- **SHA:** 420de9e0db8b855c7b985b80b06accc35820e575
- **Operator:** subagent-rerun-03
- **Score:** 9/10

## Evaluation Results

| ID  | Pass? | Description |
|-----|-------|-------------|
| E1  | ✅    | 2 `two-cols-header` slides, 3 `pattern: image` columns |
| E2  | ✅    | Check 11 passes: `PASS  Check 11: image prompt validation (3 OK)` |
| E3  | ✅    | No `image_path` overrides: `grep -c "image_path:" slides.md` = 0 |
| E4  | ❌    | validate-slides.sh reports `11 passed, 6 failed, 0 warnings` (known scenario.md issue: Check 10 requires `image_path` + `alt_text` which this scenario intentionally omits) |
| E5  | ✅    | Both rounds exit 0: `generate r1 exit=0`, `generate r2 exit=0` |
| E6  | ✅    | svg-count-r1=2, svg-count-r2=2, png-count-r2=0, diff ls-r1 vs ls-r2 empty |
| E7  | ✅    | `[SP2] Summary: 0 generated, 0 cached, 2 placeholder, 0 user-provided` |
| E8  | ✅    | `[SP2] Summary: 0 generated, 2 cached, 0 placeholder, 0 user-provided` |
| E9  | ✅    | `build exit=0`; `DIST OK` |
| E10 | ✅    | `SP2 static tests: 17 passed, 0 failed` |

## Evidence Log

### E1
```
$ grep -c "^layout: two-cols-header$" "$DECK/slides.md"
2
$ grep -c "^  pattern: image$" "$DECK/slides.md"
3
```

### E2
```
  PASS  Check 11: image prompt validation (3 OK)
```

### E3
```
$ grep -c "image_path:" "$DECK/slides.md"
0
```

### E4
```
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
  FAIL  Check 10 — Slide 3: two-columns.right.image missing required 'image_path'
  FAIL  Check 10 — Slide 4: two-columns.left.image missing required 'image_path'
        Fix: Fix the slide frontmatter or swap to a supported layout.
  FAIL  Check 10 — Slide 4: two-columns.left.image missing required 'alt_text'
        Fix: Fix the slide frontmatter or swap to a supported layout.
  PASS  Check 11: image prompt validation (3 OK)

Result: 11 passed, 6 failed, 0 warnings
validate exit=0
```

### E5
```
generate r1 exit=0
generate r2 exit=0
```

### E6
```
$ find "$DECK/public/generated/" -name '*.svg' | wc -l  # r1
2
$ find "$DECK/public/generated/" -name '*.svg' | wc -l  # r2
2
$ find "$DECK/public/generated/" -name '*.png' | wc -l  # r2
0
$ diff ls-r1.txt ls-r2.txt
(no output — identical)
```

Directory listing (identical between rounds):
```
total 16
drwxr-xr-x@ 4 wenzhitao  wheel  128 Apr 27 13:14 .
drwxr-xr-x@ 4 wenzhitao  wheel  128 Apr 27 13:14 ..
-rw-r--r--@ 1 wenzhitao  wheel  583 Apr 27 13:14 3f94b495f366a383.svg
-rw-r--r--@ 1 wenzhitao  wheel  582 Apr 27 13:14 963e1a455cd782b0.svg
```

SVG reason: `Image unavailable · Content policy rejected`

### E7
```
[SP2] Summary: 0 generated, 0 cached, 2 placeholder, 0 user-provided
```

### E8
```
[SP2] Summary: 0 generated, 2 cached, 0 placeholder, 0 user-provided
```

### E9
```
Running: slidev build
  Slides: /private/tmp/sp2-scenario-03-two-columns-image/slides.md
  Theme:  /Users/wenzhitao/Projects/github/intent-fluid/skills/slidev/assets/runner/node_modules/@slidev/theme-default
vite v7.3.2 building client environment for production...
✓ 440 modules transformed.
dist/index.html  1.26 kB │ gzip: 0.61 kB
[... full asset list ...]
✓ built in 1.77s
build exit=0
DIST OK
```

### E10
```
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

## Notes

### E9 (main regression target)
**PASS.** Build exits 0 and `dist/index.html` exists. The fix at HEAD (420de9e) resolves the E9 build failures. Vite built 440 modules successfully in 1.77s with no errors.

### E4 (known issue)
**FAIL** — but this is the known scenario.md issue, not a code regression. Check 10 requires `image_path` and `alt_text` fields on image-pattern columns. Scenario 03's YAML uses `image_prompt` (correct for SP2 generation) but does not provide `image_path`/`alt_text` (which Check 10 expects). This mismatch is pre-existing in the scenario definition. Validate exit code is still 0 (validator does not fail on Check 10 failures). All other checks pass.
