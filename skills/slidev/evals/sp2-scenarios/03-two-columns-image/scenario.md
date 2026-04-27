# Scenario 03 — two-columns.image layout (`--mock content_policy` + cache-hit)

**Primary layout:** `two-cols-header` with a column `pattern: image`
**Primary mock path:** `content_policy` (round 1)
**Secondary mock path:** cache-hit (round 2, `--mock success`, same deck, no cleanup)
**Target deck shape:** 7-slide A/B comparison for a DS lecture: cover + agenda + 2 × two-columns-image (linked list vs array, memory layout) + 2 × content + closing

## Prompt to give the skill

> First-year DS course slide deck: "linked lists vs arrays, a visual
> comparison". Students will review independently. Use two side-by-side
> illustrations on two slides to show the data structure and the memory
> layout. Edu-warm aesthetic.

## Mock directive

- **Do NOT** set `GEMINI_API_KEY`.
- **Round 1**: pass `--mock content_policy` to `generate-images.sh`.
- **Round 2**: re-run `generate-images.sh` with `--mock success` against the **same** `$DECK/` with the SVGs from round 1 still present. The existing SVGs should be treated as cache hits (no regeneration, no placeholder creation). This proves the cache is keyed on prompt+size only, independent of outcome type.

## Anti-hallucination rules

1. Quote actual stdout — no paraphrase.
2. Every ✅ must cite exact output.
3. If actual output differs from this scenario.md, record the actual output and mark ❌.
4. All commands go through `tee <step>.log`.

## Procedure

```bash
set -o pipefail
cd "$(git rev-parse --show-toplevel)"
SKILL_ROOT="$PWD/skills/slidev"
DECK=/tmp/sp2-scenario-03-two-columns-image
rm -rf "$DECK"
```

1) **Initialize:**
   ```bash
   bash "$SKILL_ROOT/scripts/new-presentation.sh" "$DECK" \
     --title "Linked Lists vs Arrays" \
     --author "DS Course" \
     --theme edu-warm \
     --minimal
   ```
   Expect: `Presentation created at: /tmp/sp2-scenario-03-two-columns-image` printed; deck directory contains `image-style.txt`.

2) **Write `slides.md`** — overwrite:

   ```yaml
   ---
   title: Linked Lists vs Arrays
   date: 2026-04-23
   theme: default
   colorSchema: light
   class: text-center
   highlighter: shiki
   ---

   # Linked Lists vs Arrays

   Data Structures 101 · 2026-04-23

   ---
   layout: default
   class: skeleton-list agenda
   ---

   # Today's Lecture

   <div class="content">

   1. The two competing shapes
   2. Memory layout, side by side
   3. Access patterns
   4. Which one for which problem

   </div>

   ---
   layout: two-cols-header
   class: two-columns
   title: The Two Shapes
   left:
     pattern: image
     alt_text: Linked list diagram
     image_prompt: Hand-drawn educational illustration of a linked list with 5 rounded boxes connected by curved arrows, warm friendly style, no text, no logos
   right:
     pattern: image
     alt_text: Array diagram
     image_prompt: Hand-drawn educational illustration of an array as 5 equal rectangles in a row with index labels implied by position, warm friendly style, no text, no logos
   ---

   # The Two Shapes

   ::left::

   <div class="pattern-image">
     <img src="public/generated/auto.png" alt="Linked list diagram" />
   </div>

   ::right::

   <div class="pattern-image">
     <img src="public/generated/auto.png" alt="Array diagram" />
   </div>

   ---
   layout: two-cols-header
   class: two-columns
   title: Memory Layout
   left:
     pattern: image
     alt_text: Scattered pointer chain
     image_prompt: Hand-drawn educational illustration of scattered memory cells connected by arrows showing pointer chains, warm friendly style, no text, no logos
   right:
     pattern: text
     content: Arrays occupy a single contiguous block, so index = pointer arithmetic.
   ---

   # Memory Layout

   ::left::

   <div class="pattern-image">
     <img src="public/generated/auto.png" alt="Scattered pointer chain" />
   </div>

   ::right::

   <div class="pattern-text">

   Arrays occupy a single contiguous block — so `arr[i]` is just
   base + i × stride.  Cache-friendly, random-access cheap.

   </div>

   ---
   layout: default
   class: skeleton-list content-bullets
   ---

   # Access Patterns

   <div class="content">

   - Array: O(1) index, O(n) insert in the middle
   - Linked list: O(n) index, O(1) insert given the node
   - Contiguous layout makes arrays ~5–20× faster to scan

   </div>

   ---
   layout: default
   class: skeleton-list content-bullets
   ---

   # Choose The Shape That Matches The Access Pattern

   <div class="content">

   - Random access by index → array
   - Frequent insertion in the middle → linked list
   - Mixed workload → often array, because caches
   - When in doubt: profile, don't guess

   </div>

   ---
   layout: end
   class: skeleton-hero
   ---

   # Questions?

   DS Course · 2026-04-23
   ```

3) **Verify no key:**
   ```bash
   unset GEMINI_API_KEY
   env | grep GEMINI || echo "ok: no GEMINI in env"
   ```

4) **Validate:**
   ```bash
   bash "$SKILL_ROOT/scripts/validate-slides.sh" "$DECK/slides.md" 2>&1 | tee "$DECK/validate.log"
   echo "validate exit=$?"
   ```
   Expect: `Result: N passed, 0 failed, 0 warnings`; `validate exit=0`.
   Note: Check 11 will show `(3 OK)` — one per two-cols-header slide (left side only due to early break in check-11.py) plus the `OK: image-style.txt` line.

5) **Round 1 — content_policy mock:**
   ```bash
   bash "$SKILL_ROOT/scripts/generate-images.sh" "$DECK" --mock content_policy 2>&1 \
     | tee "$DECK/generate-round1.log"
   echo "generate r1 exit=$?"
   ```
   Expect: Summary `[SP2] Summary: 0 generated, 0 cached, 3 placeholder, 0 user-provided`; `generate r1 exit=0`.

6) **Capture round-1 state:**
   ```bash
   ls -la "$DECK/public/generated/" | tee "$DECK/ls-r1.txt"
   find "$DECK/public/generated/" -name '*.svg' | wc -l | tee "$DECK/svg-count-r1.txt"
   first_svg=$(find "$DECK/public/generated/" -name '*.svg' | head -1)
   grep -oE 'Image unavailable[^<]*' "$first_svg" | head -1 | tee "$DECK/svg-reason-r1.txt"
   ```
   Expect: `svg-count-r1.txt` = 2; `svg-reason-r1.txt` contains `Image unavailable · Content policy rejected`.

7) **Round 2 — success mock, same deck, no cleanup** (proves cache-hit):
   ```bash
   bash "$SKILL_ROOT/scripts/generate-images.sh" "$DECK" --mock success 2>&1 \
     | tee "$DECK/generate-round2.log"
   echo "generate r2 exit=$?"
   ```
   Expect: Summary `[SP2] Summary: 0 generated, 3 cached, 0 placeholder, 0 user-provided`; `generate r2 exit=0`.

8) **Verify cache-hit didn't create new files:**
   ```bash
   ls -la "$DECK/public/generated/" | tee "$DECK/ls-r2.txt"
   find "$DECK/public/generated/" -name '*.svg' | wc -l | tee "$DECK/svg-count-r2.txt"
   find "$DECK/public/generated/" -name '*.png' | wc -l | tee "$DECK/png-count-r2.txt"
   diff "$DECK/ls-r1.txt" "$DECK/ls-r2.txt" || echo "WARN: file list differs between rounds"
   ```
   Expect: `svg-count-r2.txt` = 2; `png-count-r2.txt` = 0; `diff` produces no output (file list identical between rounds).

9) **Build:**
   ```bash
   bash "$SKILL_ROOT/scripts/run.sh" build "$DECK/slides.md" 2>&1 | tee "$DECK/build.log"
   echo "build exit=$?"
   test -f "$DECK/dist/index.html" && echo "DIST OK"
   ```
   Expect: `build exit=0`; `DIST OK`.

10) **Regression:**
    ```bash
    bash "$SKILL_ROOT/scripts/test-sp2-static.sh" 2>&1 | tee "$DECK/static.log"
    ```
    Expect: `17 passed, 0 failed`.

11) **Fill `result.md`.**

## Expectations (10 items)

- [ ] **E1** Deck contains 2 `two-cols-header` slides with at least one column `pattern: image` each (total 3 image columns: slide-3 has 2 image cols, slide-4 has 1; all 3 are processed by generate-images.js).
  Evidence: `grep -c "^layout: two-cols-header$" "$DECK/slides.md"` = 2; `grep -c "^  pattern: image$" "$DECK/slides.md"` = 3 _(note: frontmatter 2-space indent)_.

- [ ] **E2** Every image-column has a valid `image_prompt`.
  Evidence: Check 11 line in `validate.log` matches `PASS  Check 11: image prompt validation (3 OK)`.

- [ ] **E3** No `image_path` overrides used.
  Evidence: `grep -c "image_path:" "$DECK/slides.md"` = 0.

- [ ] **E4** `validate-slides.sh` reports 0 FAIL, 0 WARN.
  Evidence: `grep -E "Result: [0-9]+ passed, 0 failed, 0 warnings" "$DECK/validate.log"` matches.

- [ ] **E5** Both `generate-images.sh` rounds exit 0.
  Evidence: `generate r1 exit=0` and `generate r2 exit=0` lines.

- [ ] **E6** After round 1, `public/generated/` contains 0 PNG, 3 SVG, and stays that way after round 2 (identical file list).
  Evidence: `svg-count-r1.txt` = 3; `svg-count-r2.txt` = 3; `png-count-r2.txt` = 0; `diff ls-r1.txt ls-r2.txt` empty.

- [ ] **E7** Round 1 Summary = `[SP2] Summary: 0 generated, 0 cached, 3 placeholder, 0 user-provided`.
  Evidence: `grep "Summary:" "$DECK/generate-round1.log"` matches verbatim.

- [ ] **E8** Round 2 Summary = `[SP2] Summary: 0 generated, 3 cached, 0 placeholder, 0 user-provided`.
  Evidence: `grep "Summary:" "$DECK/generate-round2.log"` matches verbatim.

- [ ] **E9** `run.sh build` completes and `dist/index.html` exists.
  Evidence: `build exit=0`; `DIST OK`.

- [ ] **E10** `test-sp2-static.sh` reports `17 passed, 0 failed`.
  Evidence: `grep "17 passed, 0 failed" "$DECK/static.log"` matches.

## Scoring

Same thresholds as scenario 01. See `evals/sp2-scenarios/DELIVERY.md`.

## Cleanup

```bash
rm -rf /tmp/sp2-scenario-03-two-columns-image
```
