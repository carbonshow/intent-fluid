# SP2 — Image Generation Pipeline — Scenario Eval Delivery

## Status

**Delivered.** All three scenario evals pass 10/10 as of commit `1776b6a`. Four fixes were applied after the initial eval run:

1. `generate-images.js` — two-step `src` path normalisation: (a) `patchAutoSrc` replaces `auto.png` with actual hash filename per-slide; (b) `patchPublicSrcs` rewrites all remaining `src="public/..."` to `src="/..."` (Vite public-dir convention), covering user-provided assets.
2. `run.sh` — `realpath` normalisation of `SLIDES_ABS` resolves the macOS `/tmp` → `/private/tmp` symlink.
3. `slides-parser.js` — `two-cols-header` with both columns as `pattern: image` now emits two separate image-slide records so both columns are processed and their `auto.png` references are patched.
4. `validate-slides.sh` Check 10 — SP2 exemption: `image_path` is optional when `image_prompt` is present on a `pattern: image` column (SP2 auto-generation path).

## Automated gates — SP2 static suite

```
test-sp2-static.sh        17 passed, 0 failed
```

## Scenario E2E results (final, post-fix)

| Scenario | Theme | Slides | Image slides | Score |
|----------|-------|--------|--------------|-------|
| 01 image-focus (`--mock success` + user-override) | minimal-exec | 7 | 2 | **10/10** |
| 02 image-text-split (no-key placeholder path) | corporate-navy | 8 | 3 | **10/10** |
| 03 two-columns-image (`--mock content_policy` + cache-hit) | edu-warm | 7 | 3 | **10/10** |

**Overall: 30/30 = 100%** ✅

## Coverage matrix

| Expectation | Description | S01 | S02 | S03 |
|------------|-------------|-----|-----|-----|
| E1 | Image layout slides present (correct count) | ✅ | ✅ | ✅ |
| E2 | `image_prompt` valid on all image slides (Check 11) | ✅ | ✅ | ✅ |
| E3 | No spurious `image_path` overrides | ✅ | ✅ | ✅ |
| E4 | `validate-slides.sh` 0 FAIL, 0 WARN | ✅ | ✅ | ✅ |
| E5 | `generate-images.sh` exits 0 | ✅ | ✅ | ✅ |
| E6 | `public/generated/` file-type counts correct | ✅ | ✅ | ✅ |
| E7 | Summary line verbatim (round 1) | ✅ | ✅ | ✅ |
| E8 | Key-hint / cache-hit / user-override behavior | ✅ | ✅ | ✅ |
| E9 | `run.sh build` produces `dist/index.html` | ✅ | ✅ | ✅ |
| E10 | Static regression suite 17/17 | ✅ | ✅ | ✅ |

Legend: ✅ passed

## Resolved issues

### Issue A — `auto.png` literal reference breaks Rollup (E9, all scenarios)

**Affected:** Scenario 01 E9, Scenario 03 E9  
**Root cause:** `src="public/generated/..."` is a relative path; Vite/Rollup treats it as a module import and fails. Vite's `public/` convention requires the root-relative form `src="/generated/..."`.  
**✅ Fixed in `44a713f`** — `generate-images.js` now runs a two-step patch after the image loop: (1) `patchAutoSrc` replaces `auto.png` with the actual hash filename per-slide; (2) `patchPublicSrcs` rewrites all remaining `src="public/..."` to `src="/..."`, covering user-provided assets (`public/hero.jpg`) as well.

---

### Issue B — macOS `/tmp` → `/private/tmp` symlink breaks Vite build (E9, Scenario 02)

**Affected:** Scenario 02 E9  
**Root cause:** On macOS `/tmp` is a symlink to `/private/tmp`. After symlink resolution Vite's `vite:build-html` plugin receives a fileName of `../../private/tmp/…` relative to the project root and rejects it.  
**✅ Fixed in `420de9e`** — `run.sh` now runs `realpath "$SLIDES_ABS"` (when `realpath` is available) after the `cd + pwd` path construction, resolving symlinks before passing to `slidev build`.

---

### Issue C — Scenario 03 Check 10 / double-image column (E4)

**Affected:** Scenario 03 E4  
**Root cause:** (a) Check 10 required `image_path` even when `image_prompt` was present (SP2 auto-gen path); (b) `slides-parser.js` only processed the left column of a `two-cols-header` slide when both columns were `pattern: image`, leaving the right column's `auto.png` unpatched.  
**✅ Fixed in `44a5dd4`** — Three co-ordinated changes: (1) `validate-slides.sh` Check 10 exempts `image_path` when `image_prompt` is set; (2) `slides-parser.js` emits two image-slide records for dual-image columns; (3) scenario 03 YAML uses only `alt_text` + `image_prompt` (no fake `image_path` placeholder).

**Fix options (not in scope for this eval pass):**
1. Update `scenario.md` YAML to include `image_path` and `alt_text` placeholders (SP1 path).
2. Relax Check 10 for columns that declare `image_prompt` — treat SP2 auto-generation as sufficient (no SP1 override required).

---

## Artifacts

- **3 scenarios × 2 files** under `evals/sp2-scenarios/{01,02,03}/`:
  - `scenario.md` — self-contained runnable procedure (YAML, commands, 10 expectations)
  - `result.md` — filled by subagent with exact command output evidence
- **1 smoke fixture**: `evals/sp2-scenarios/fixtures/minimal-deck/` (used by `test-sp2-static.sh`)
- **Static regression suite**: `scripts/test-sp2-static.sh` (17 checks)
- **Image generation pipeline**:
  - `scripts/generate-images.js` — prompt assembly, Gemini REST, content-hash cache, SVG placeholder fallback
  - `scripts/build-deck.sh` — `validate → generate → build` wrapper
  - `scripts/gemini-client.js`, `slides-parser.js`, `theme-colors.js`, `placeholder-svg.js`
- **6 `image-style.txt` theme files**: `assets/themes/<name>.image-style.txt`
- **SKILL.md**: SP2 section (Step 5 — image generation, `--mock` flag, build flow)

## Observations from scenario runs

- **Core pipeline is solid**: All 30/30 expectations pass. Validation, generation, placeholder fallback, cache-hit, no-key UX, user-override, dual-image columns, and build all behave as specified.
- **`--mock success` writes real PNGs**: Scenario 01 produced a 1-byte PNG under the correct hash filename. `user-provided` counting and `image_path` bypass both work; `hero.jpg` SHA-256 is byte-identical before and after the pipeline.
- **Cache determinism confirmed**: Scenario 03 round 2 hit all 3 content-policy placeholder SVGs from round 1 (`0 generated, 3 cached, 0 placeholder`) — hash stability holds across runs, and the cache is correctly keyed on prompt+size independent of the prior outcome type (content_policy → success).
- **Vite `public/` path convention**: All E9 failures were caused by `src="public/..."` being treated as a module import by Rollup. The fix (rewrite to `src="/..."`) is the correct Vite convention and covers both generated and user-provided assets.
- **Dual-image columns**: `slides-parser.js` previously only processed the left column of a `two-cols-header` slide when both columns were `pattern: image`. The fix emits two image-slide records, correctly handling both columns independently.

## What's next (SP3-5)

- **SP3 — Multi-Round Refinement Loop** (Reflexion-style verbal feedback)
- **SP4 — Self-Evolution via Sedimentation** (pattern extraction + skill versioning)
- **SP5 — Minimal Eval Suite** (Grader / Comparator / Analyzer framework)

Each will be captured in its own design spec (`docs/superpowers/specs/`) and implementation plan before work begins.
