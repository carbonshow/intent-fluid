# Scenario 03 — Result

- **Date:** 2026-04-27
- **SHA:** 1776b6a079c4114555669aee61e6d556cfe84649
- **Operator:** subagent-rerun-03c
- **Score:** 10/10

## Evaluation Results

| ID  | Pass? | Description |
|-----|-------|-------------|
| E1  | ✅    | 2 `two-cols-header` slides, 3 `pattern: image` columns |
| E2  | ✅    | Check 11 passes: `PASS  Check 11: image prompt validation (3 OK)` |
| E3  | ✅    | `grep -c "image_path:" slides.md` = 0 |
| E4  | ✅    | `Result: 12 passed, 0 failed, 0 warnings`; `validate exit=0` |
| E5  | ✅    | Both rounds exit 0: `generate r1 exit=0`, `generate r2 exit=0` |
| E6  | ✅    | `svg-count-r1.txt` = 3; `svg-count-r2.txt` = 3; `png-count-r2.txt` = 0; diff empty |
| E7  | ✅    | Round 1 Summary: `[SP2] Summary: 0 generated, 0 cached, 3 placeholder, 0 user-provided` |
| E8  | ✅    | Round 2 Summary: `[SP2] Summary: 0 generated, 3 cached, 0 placeholder, 0 user-provided` |
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
  PASS  Check 10: all slides conform to layout-catalog schema
  PASS  Check 11: image prompt validation (3 OK)

Result: 12 passed, 0 failed, 0 warnings
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
       3
$ find "$DECK/public/generated/" -name '*.svg' | wc -l  # r2
       3
$ find "$DECK/public/generated/" -name '*.png' | wc -l  # r2
       0
$ diff ls-r1.txt ls-r2.txt
(no output — identical)
```

Directory listing (identical between rounds):
```
total 24
drwxr-xr-x@ 5 wenzhitao  wheel  160 Apr 27 13:45 .
drwxr-xr-x@ 4 wenzhitao  wheel  128 Apr 27 13:45 ..
-rw-r--r--@ 1 wenzhitao  wheel  583 Apr 27 13:45 3f94b495f366a383.svg
-rw-r--r--@ 1 wenzhitao  wheel  582 Apr 27 13:45 963e1a455cd782b0.svg
-rw-r--r--@ 1 wenzhitao  wheel  583 Apr 27 13:45 b8ed778eb6e36f57.svg
```

SVG reason: `Image unavailable · Content policy rejected`

### E7 — ACTUAL OUTPUT (verbatim)
```
[SP2] Deck: /tmp/sp2-scenario-03-two-columns-image
[SP2] Theme: edu-warm
[SP2] Found 3 images to process
[SP2] ⚠ slide 3 placeholder: public/generated/3f94b495f366a383.svg (content_policy: mock content_policy)
[SP2] ⚠ slide 3 placeholder: public/generated/b8ed778eb6e36f57.svg (content_policy: mock content_policy)
[SP2] ⚠ slide 4 placeholder: public/generated/963e1a455cd782b0.svg (content_policy: mock content_policy)
[SP2] Summary: 0 generated, 0 cached, 3 placeholder, 0 user-provided
generate r1 exit=0
```

### E8 — ACTUAL OUTPUT (verbatim)
```
[SP2] Deck: /tmp/sp2-scenario-03-two-columns-image
[SP2] Theme: edu-warm
[SP2] Found 3 images to process
[SP2] ✓ slide 3 (two-cols-header) cached: public/generated/3f94b495f366a383.svg
[SP2] ✓ slide 3 (two-cols-header) cached: public/generated/b8ed778eb6e36f57.svg
[SP2] ✓ slide 4 (two-cols-header) cached: public/generated/963e1a455cd782b0.svg
[SP2] Summary: 0 generated, 3 cached, 0 placeholder, 0 user-provided
generate r2 exit=0
```

### E9
```
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
