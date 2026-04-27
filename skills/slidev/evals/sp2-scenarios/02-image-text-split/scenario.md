# Scenario 02 — image-text-split layout (no-key / placeholder path)

**Primary layout:** `image-left` / `image-right` (alternating)
**Primary mock path:** `no-key` (unset `GEMINI_API_KEY`, do NOT pass `--mock`)
**Target deck shape:** 8-slide architecture intro: cover + agenda + 3 × image-text-split (alternating left/right) + 2 × content + closing

## Prompt to give the skill

> Produce an 8-slide architecture intro for a new engineering manager:
> "How our event pipeline handles 1B events/day". Walk through ingest →
> enrichment → fanout as three side-by-side image-plus-text slides.
> Corporate-navy aesthetic.

## Mock directive

- **Do NOT** set `GEMINI_API_KEY`. This scenario tests the no-key fallback path.
- **Do NOT** pass `--mock` either — just `generate-images.sh <deck>` plain.
- The pipeline's behavior under no key is the object of test.

## Anti-hallucination rules

1. Quote actual stdout — no paraphrase, no "I observed that …".
2. Every ✅ must cite the exact output line that proves it.
3. If actual output differs from this scenario.md, record the actual output and mark ❌ — do NOT rewrite expectations.
4. All commands go through `tee <step>.log`.

## Procedure

```bash
set -o pipefail
cd "$(git rev-parse --show-toplevel)"
SKILL_ROOT="$PWD/skills/slidev"
DECK=/tmp/sp2-scenario-02-image-text-split
rm -rf "$DECK"
```

1) **Initialize:**
   ```bash
   bash "$SKILL_ROOT/scripts/new-presentation.sh" "$DECK" \
     --title "Event Pipeline Architecture" \
     --author "Data Platform" \
     --theme corporate-navy \
     --minimal
   ```
   Expect: `Presentation created at: /tmp/sp2-scenario-02-image-text-split` printed; deck directory contains `image-style.txt`.

2) **Write `slides.md`** — overwrite with this exact content:

   ```yaml
   ---
   title: Event Pipeline Architecture
   date: 2026-04-23
   theme: default
   colorSchema: light
   class: text-center
   highlighter: shiki
   ---

   # Event Pipeline Architecture

   1B events/day · Data Platform · 2026-04-23

   ---
   layout: default
   class: skeleton-list agenda
   ---

   # Agenda

   <div class="content">

   1. The three pipeline stages
   2. Stage 1 — Ingest
   3. Stage 2 — Enrichment
   4. Stage 3 — Fanout
   5. Scale properties
   6. Failure modes

   </div>

   ---
   layout: image-left
   class: image-text-split
   title: Stage 1 — Ingest
   image_prompt: Clean editorial illustration of event streams converging into a single ingest gateway, minimal composition, no text, no logos
   ---

   # Stage 1 — Ingest

   <div class="body">

   Events land on a Kafka topic partitioned by source-id.
   Back-pressure is shed via a leaky-bucket at the edge
   so hot producers cannot starve cold ones.

   </div>

   ---
   layout: image-right
   class: image-text-split
   title: Stage 2 — Enrichment
   image_prompt: Clean editorial illustration of records passing through parallel enrichment stations, arrows showing attributes being added, no text, no logos
   ---

   # Stage 2 — Enrichment

   <div class="body">

   Each record is joined against three reference tables
   (geo, device, user) in a stateful Flink job.
   Late-arriving keys go to a dead-letter partition.

   </div>

   ---
   layout: image-left
   class: image-text-split
   title: Stage 3 — Fanout
   image_prompt: Clean editorial illustration of one stream branching out to multiple consumer groups, fan shape composition, no text, no logos
   ---

   # Stage 3 — Fanout

   <div class="body">

   Enriched records split into four topic families
   (analytics, billing, search, ML features).
   Each consumer group reads at its own pace.

   </div>

   ---
   layout: default
   class: skeleton-list content-bullets
   ---

   # Scale Properties

   <div class="content">

   - Peak: 18K events/sec, p99 ingest 240ms
   - Each stage scales independently via partition count
   - Shed-load headroom: 3× sustained throughput

   </div>

   ---
   layout: default
   class: skeleton-list content-bullets
   ---

   # Failure Modes Worth Knowing

   <div class="content">

   - Kafka partition skew when a source-id hash collides
   - Flink checkpoint storms during deploys
   - Dead-letter backlog when reference tables lag

   </div>

   ---
   layout: end
   class: skeleton-hero
   ---

   # Questions?

   Data Platform · 2026-04-23
   ```

3) **Verify no key in env:**
   ```bash
   unset GEMINI_API_KEY
   env | grep GEMINI || echo "ok: no GEMINI in env"
   ```
   Expect: `ok: no GEMINI in env`.

4) **Validate:**
   ```bash
   bash "$SKILL_ROOT/scripts/validate-slides.sh" "$DECK/slides.md" 2>&1 | tee "$DECK/validate.log"
   echo "validate exit=$?"
   ```
   Expect: `Result: N passed, 0 failed, 0 warnings`; `validate exit=0`.

5) **Run generate-images with NO mock and NO key** (this is the test):
   ```bash
   bash "$SKILL_ROOT/scripts/generate-images.sh" "$DECK" 2>&1 | tee "$DECK/generate.log"
   echo "generate exit=$?"
   ```
   Expect: output contains `GEMINI_API_KEY not set — using placeholders for all images.` hint; Summary line `[SP2] Summary: 0 generated, 0 cached, 3 placeholder, 0 user-provided`; `generate exit=0`.

6) **Capture post-state:**
   ```bash
   ls -la "$DECK/public/generated/" | tee "$DECK/ls-after.txt"
   find "$DECK/public/generated/" -name '*.svg' | wc -l | tee "$DECK/svg-count.txt"
   find "$DECK/public/generated/" -name '*.png' | wc -l | tee "$DECK/png-count.txt"
   ```
   Expect: `svg-count.txt` = 3, `png-count.txt` = 0.

7) **Spot-check placeholder SVG reason line:**
   ```bash
   first_svg=$(find "$DECK/public/generated/" -name '*.svg' | head -1)
   grep -oE 'Image unavailable[^<]*' "$first_svg" | head -1 | tee "$DECK/svg-reason.txt"
   ```
   Expect: `svg-reason.txt` contains `Image unavailable · API key not set`.

8) **Build static site:**
   ```bash
   bash "$SKILL_ROOT/scripts/run.sh" build "$DECK/slides.md" 2>&1 | tee "$DECK/build.log"
   echo "build exit=$?"
   test -f "$DECK/dist/index.html" && echo "DIST OK"
   ```
   Expect: `build exit=0`; `DIST OK`.

9) **Regression check:**
   ```bash
   bash "$SKILL_ROOT/scripts/test-sp2-static.sh" 2>&1 | tee "$DECK/static.log"
   ```
   Expect: `SP2 static tests: 17 passed, 0 failed`.

10) **Fill `result.md`** — each E below gets ✅/❌ + exact output snippet.

## Expectations (10 items)

- [ ] **E1** Deck contains 3 image-text-split slides (`layout: image-left` or `layout: image-right`).
  Evidence: `grep -cE "^layout: (image-left|image-right)$" "$DECK/slides.md"` = 3.

- [ ] **E2** Every image-* slide has a valid `image_prompt`.
  Evidence: Check 11 line in `validate.log` reads `PASS  Check 11: image prompt validation (4 OK)`.

- [ ] **E3** No `image_path` overrides used; all images are auto.
  Evidence: `grep -c "image_path:" "$DECK/slides.md"` = 0.

- [ ] **E4** `validate-slides.sh` reports 0 FAIL, 0 WARN.
  Evidence: `grep -E "Result: [0-9]+ passed, 0 failed, 0 warnings" "$DECK/validate.log"` matches.

- [ ] **E5** `generate-images.sh` exits 0 even with no key.
  Evidence: `generate exit=0` line.

- [ ] **E6** `public/generated/` contains 0 PNG, 3 SVG.
  Evidence: `cat "$DECK/png-count.txt"` = 0; `cat "$DECK/svg-count.txt"` = 3.

- [ ] **E7** Summary line equals `[SP2] Summary: 0 generated, 0 cached, 3 placeholder, 0 user-provided`.
  Evidence: `grep "Summary:" "$DECK/generate.log"` matches the expected string verbatim.

- [ ] **E8** Key-setup hint line is present in stdout.
  Evidence: `grep "GEMINI_API_KEY not set" "$DECK/generate.log"` matches; `grep "aistudio.google.com/app/apikey" "$DECK/generate.log"` matches (second bullet of the hint).

- [ ] **E9** `run.sh build` completes and `dist/index.html` exists.
  Evidence: `build exit=0`; `DIST OK`.

- [ ] **E10** `test-sp2-static.sh` reports `17 passed, 0 failed`.
  Evidence: `grep "17 passed, 0 failed" "$DECK/static.log"` matches.

## Scoring

Same thresholds as scenario 01. See `evals/sp2-scenarios/DELIVERY.md`.

## Cleanup

```bash
rm -rf /tmp/sp2-scenario-02-image-text-split
```
