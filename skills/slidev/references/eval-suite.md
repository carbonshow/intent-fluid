# Eval Suite — Usage Guide

The SP5 eval suite provides three composable tools for automated deck quality measurement:

- **grader.js** — parse a deck directory and emit structured metrics JSON
- **comparator.js** — diff two grader reports and surface regressions
- **analyzer.js** — map a scenario's expectations to grader metrics and produce a pre-filled result.md
- **eval-deck.sh** — thin orchestrator that runs the full pipeline for a deck + scenario

---

## Quick Start

### Grade a deck for a specific scenario

```bash
bash scripts/eval-deck.sh <deck-dir> <scenario-id>
# e.g.:
bash scripts/eval-deck.sh /tmp/my-deck sp2-01
```

This produces:
- `<deck-dir>/report.json` — structured metrics
- `<deck-dir>/result-<scenario-id>.md` — pre-filled result.md (auto-gradable Es filled in, MANUAL items labelled)

### Grade with image generation

Pass `--mock <scenario>` to also run `generate-images.sh` before grading:

```bash
bash scripts/eval-deck.sh /tmp/my-deck sp2-01 --mock success
```

### Compare two deck runs

```bash
bash scripts/eval-deck.sh --compare /tmp/deck-v1/report.json /tmp/deck-v2/report.json
```

Produces `diff.md` alongside report-b.json. Exit 0 = no FAILs; exit 1 = at least one FAIL.

---

## Individual tools

### grader.js

```bash
node scripts/lib/grader.js <deck-dir>
# Output: JSON to stdout
```

Fields emitted:

| Field | Description |
|-------|-------------|
| `deck` | Absolute path to deck directory |
| `sha` | Git HEAD SHA from skill root |
| `timestamp` | ISO-8601 timestamp |
| `slides.total` | Total slide count (deduped for two-col double entries) |
| `slides.by_layout` | Map of semantic layout name → count |
| `slides.image_slides` | Slides where `isImageSlide=true` |
| `slides.empty` | Slides with fewer than 3 words in body |
| `slides.no_heading` | Slides without an `# h1` heading in body |
| `text.total_words` | Total words across all slides (body only) |
| `text.avg_words_per_slide` | Average words per slide (rounded to 1dp) |
| `text.longest_bullet_chars` | Length of longest bullet point (chars, no markup) |
| `images.auto_generated` | Image slots with no `image_path` declared |
| `images.user_provided` | Image slots with `image_path` that resolves to an existing file |
| `images.placeholders` | `.svg` files in `public/generated/` |
| `images.missing` | Image slots with `image_path` declared but file not found |
| `validation.exit_code` | Exit code from `validate-slides.sh` |
| `validation.passed` | Number of checks that passed |
| `validation.failed` | Number of checks that failed |
| `validation.warnings` | Number of warnings |
| `validation.check10_failures` | Array of Check 10 failure message strings |
| `validation.check11_failures` | Array of Check 11 failure message strings |
| `review.score` | Score from `review-presentation.sh` (0–100) |
| `review.grade` | Grade string (Excellent / Good / Fair / Needs Work) |
| `theme.name` | Theme name from deck frontmatter |
| `theme.image_style_present` | Whether `image-style.txt` exists in deck dir |

### comparator.js

```bash
node scripts/lib/comparator.js <report-a.json> <report-b.json>
# Output: diff.md to stdout
# Exit 0 = no FAILs, exit 1 = at least one FAIL
```

Change rules:

| Field | Change | Severity |
|-------|--------|----------|
| `slides.total` | any ±N | INFO |
| `slides.by_layout.*` | any change | INFO |
| `images.placeholders` | increase | WARN |
| `images.missing` | any > 0 | FAIL |
| `validation.failed` | increase | FAIL |
| `validation.failed` | decrease | PASS |
| `review.score` | drop ≥ 5 | WARN |
| `review.score` | drop ≥ 15 | FAIL |
| `theme.name` | changed | INFO |

### analyzer.js

```bash
node scripts/lib/analyzer.js <scenario-id> <report.json>
# Output: pre-filled result.md to stdout
```

Supported scenario IDs: `sp1-01`, `sp1-02`, `sp1-03`, `sp2-01`, `sp2-02`, `sp2-03`

Auto-gradable items are pre-filled with ✅ or ❌ and evidence from the report. Items requiring shell logs, file contents, or visual inspection are labelled `MANUAL`.

---

## Scenario Integration

After SP5 ships, the updated scenario procedure is:

**Step 0 (new):** Run `eval-deck.sh <deck> <scenario-id>` — pre-fills auto-gradable Es in `result-<id>.md`.

**Remaining steps:** Operator runs only the MANUAL steps (generate logs, build, static suite, visual review).

**Effort reduction:** ~4-6 MANUAL steps instead of 10.

---

## Running the static test suite

```bash
bash scripts/test-sp5-static.sh
```

Expected: `SP5 static tests: 12 passed, 0 failed`

---

## Running grader unit tests

```bash
# SP2 fixture (minimal-deck)
bash evals/sp2-scenarios/fixtures/grader-tests.sh

# SP1 fixture (valid.md)
bash evals/sp1-scenarios/fixtures/grader-tests.sh
```
