# Image Generation Pipeline (SP2)

## 1. Overview

SP2 auto-generates images for three layouts — **image-focus**, **image-text-split**, and **two-columns** (when a column uses the `image` pattern) — using Google Gemini 2.5 Flash Image (Nano Banana).

- Runs as part of `scripts/build-deck.sh` (between validate and Slidev build).
- NOT invoked during `scripts/run.sh dev` (avoid token burn during editing).
- Falls back to a theme-aware SVG placeholder on any error or missing API key.
- Content-addressable cache: same prompt + size → deterministic hash → only generates once.

## 2. Architecture

```
slides.md (Claude authors image_prompt in frontmatter)
  │
  ▼
build-deck.sh
  ├─ validate-slides.sh   (Checks 1-10 from SP1 + Check 11 for image_prompt)
  ├─ generate-images.sh   (parses slides, builds prompts, generates or caches)
  └─ run.sh build         (Slidev static output)
        │
        ▼
      dist/
```

`generate-images.sh` is a thin bash wrapper around `lib/generate-images.js`. The JS file parses the slides, reads `<deck>/image-style.txt` for theme style injection, computes content hashes, and decides per-image whether to call the API, use cache, or write a placeholder.

## 3. Frontmatter Schema

Applicable to the three catalog semantics:
- **image-focus** — `layout: default` + `class: image-focus`
- **image-text-split** — `layout: image-left` or `layout: image-right`
- **two-columns.image** — `layout: two-cols-header` with a column whose `pattern: image`

### Typical case (Claude-authored, auto image_path)

```yaml
---
layout: default
class: image-focus
title: "Our Vision"
image_prompt: >
  Minimalist editorial illustration of a team climbing a mountain
  toward sunrise, optimistic atmosphere, no text, no logos
---
```

The `image_path` is auto-resolved to `public/generated/<hash>.png`.

### User-override case

```yaml
---
layout: default
class: image-focus
title: "Our Brand"
image_prompt: >
  Alt-text describing the supplied photo; still required for Check 11
image_path: public/hero.jpg
---
```

`image_path` rules:

| Value | Behavior |
|---|---|
| Omitted | Auto → `public/generated/<hash>.png` |
| Starts with `public/generated/` | Treated as auto path |
| Elsewhere under `public/` | **User override**; file must exist; pipeline leaves it alone |
| Outside `public/` | Check 11 FAILs |

### two-columns frontmatter

Column patterns live in the frontmatter as nested objects (authoritative). Example:

```yaml
---
layout: two-cols-header
class: two-columns
left:
  pattern: image
  image_prompt: Editorial illustration of data pipelines, no text
  # image_path optional — defaults to public/generated/<hash>.png
right:
  pattern: text
  content: Analysis of quarterly revenue trends.
---
```

## 4. Claude Prompt-Writing Guide

### DO
- Write in English (Gemini English performance is stronger).
- Describe subject, composition, mood — the CONTENT of the image.
- Aim for 40–150 characters.
- Include `no text, no logos` as a reinforcement.

### DON'T
- Don't write theme style (color palette, aesthetic). The theme's `image-style.txt` supplies that, automatically.
- Don't name real people / brands / trademarks (content policy risk).
- Don't write fewer than 20 non-whitespace characters (validate FAILs).

### Good examples
- `Minimalist editorial illustration of a team celebrating product launch, optimistic mood, no text, no logos`
- `Abstract geometric diagram representing data streams merging into a single insight, top-down composition, no text`
- `Cozy workspace with laptop and coffee, warm afternoon light, educational tutorial feeling, no text, no logos`

### Bad examples
- `team photo` — too short; no composition
- `team of engineers from Google working on Gemini` — names brand (policy risk)
- `dark cyberpunk with neon colors` — describes style (theme's job)

## 5. Theme Style Injection

Each theme ships an `image-style.txt` that is appended to every prompt for that theme.

| Theme | Style |
|---|---|
| tech-dark | Cyberpunk editorial, dark bg + cyan/magenta neon, high contrast |
| code-focus-light | Editorial technical illustration, light off-white, teal/amber, syntax-highlight aesthetic |
| corporate-navy | Corporate editorial, deep navy blue + white, clean minimal, flat vector |
| minimal-exec | Swiss design poster, warm off-white, muted earth tones, generous negative space |
| edu-warm | Hand-drawn illustration, warm amber + cream, soft shapes, approachable |
| playful-bright | Flat vector, saturated bright colors (teal/coral/yellow), playful geometry |

**Effect**: the final prompt = `<image_prompt>\n\nStyle:\n<theme style>\n\nAspect ratio: WxH. No text...`. Because the theme is part of the prompt, the content hash changes when you switch themes → automatic regeneration, no manual cache clear needed.

## 6. Hash Caching

### Algorithm
```
sha256(finalPrompt + "\x00" + "WxH")  → first 16 hex chars  → filename
```

### Storage
```
<deck>/public/generated/
├── a3f2c8e9b1d4f7e6.png   (or .svg if a placeholder)
├── b4e1d2a312f7e9c5.png
└── ...
```

### Invalidation
- Change `image_prompt` → new hash → regenerates (old file becomes orphaned, untouched)
- Change theme → all hashes change → all regenerate
- Run with `--force` → ignore cache hits

### What to commit
- YES: `public/generated/*.png` and `public/generated/*.svg` — stable hashes, no churn
- NO: `.env` files — `new-presentation.sh` gitignores `.env` by default

### Force full regen
```bash
rm -f <deck>/public/generated/*.png <deck>/public/generated/*.svg
bash scripts/build-deck.sh <deck>
```

## 7. Placeholder Behavior

When real generation is unavailable (no key, API error, content policy block), a theme-aware SVG is written in place of the PNG:

```
┌─────────────────────────────────────────────┐
│  [ bg: theme --color-bg ]                   │
│                                             │
│    <slide title, theme --color-text>        │
│                                             │
│   ──────── (accent line, theme --color-accent) ──── │
│                                             │
│    Image unavailable · <reason>             │
└─────────────────────────────────────────────┘
```

| Trigger | Reason text shown | stderr warn |
|---|---|---|
| `GEMINI_API_KEY` unset | `API key not set` | Full key-setup instructions (printed once) |
| API timeout (30s) | `API timeout (30s)` | Full timeout msg |
| Content-policy rejection | `Content policy rejected` | Full Gemini reason |
| Network error | `Network error` | err.message |
| Other API error | `API error` | HTTP status + body excerpt |

If `style.css` can't be parsed, placeholders use safe defaults (`#f5f5f5` / `#222` / `#888`). Older fixture decks that still use `theme.css` are supported as a fallback.

## 8. API Key Configuration

### Get a key

1. Go to https://aistudio.google.com/app/apikey
2. Sign in with Google; click "Create API key".
3. Copy the key (starts with `AIza…`).
4. Gemini 2.5 Flash Image has a generous free tier; small-deck usage (< 10 images/day) stays well within it.

### Set the key (3 ways, in order of recommendation)

**A. Project `.env` (recommended)**
```bash
# In the deck directory
echo 'GEMINI_API_KEY=AIza...' > .env
```
Then source it before build:
```bash
set -a; . ./.env; set +a
bash scripts/build-deck.sh .
```
`.env` is gitignored automatically by `new-presentation.sh`.

**B. Shell rc (for frequent use)**
```bash
echo 'export GEMINI_API_KEY=AIza...' >> ~/.zshrc
source ~/.zshrc
```

**C. One-shot invocation**
```bash
GEMINI_API_KEY=AIza... bash scripts/build-deck.sh <deck>
```

### Verify the key is live
```bash
bash scripts/generate-images.sh <deck> --dry-run
```
If the output includes "GEMINI_API_KEY not set", the key isn't visible to the script.

### No-key mode
You can run SP2 without a key for rapid iteration: all images become theme-aware placeholders. Useful for:
- Composing slide structure before settling on image prompts
- Committing a deck that doesn't require reviewer to have Gemini access

## 9. Mock Client (Development & Testing)

`gemini-client.js` exposes a `createMockClient(scenario)` factory for test isolation:

```bash
bash scripts/generate-images.sh <deck> --mock <scenario>
```

| Scenario | Behavior |
|---|---|
| `success` | Returns a minimal 1×1 PNG buffer; caller treats as success |
| `timeout` | Throws `GeminiError('timeout')` |
| `content_policy` | Throws `GeminiError('content_policy')` |
| `network` | Throws `GeminiError('network')` |
| `api` | Throws `GeminiError('api')` |

The `--mock` flag is a **command-line switch**, not an environment variable. Reason: it's visible at the call site, so tests and reviewers know exactly what path the code is taking.

The flag is documented in three places:
1. `SKILL.md` — SP2 section
2. This file (§9)
3. Top of `scripts/lib/generate-images.js` as inline comment

## 10. Integration Points

| Script | When generate-images runs |
|---|---|
| `scripts/build-deck.sh` | YES, between validate and slidev build (pass `--skip-images` to disable) |
| `scripts/run.sh dev` | NO (dev mode is read-only for SP2; edit slides freely without burning tokens) |
| `scripts/run.sh build` | NO (use `build-deck.sh` for the full pipeline) |
| `scripts/run.sh export` | NO (`build-deck.sh` builds first; export runs on the built output) |
| `scripts/generate-images.sh` | Manual invocation; support `--dry-run` / `--force` / `--mock` |
| `scripts/new-presentation.sh` | Copies `<theme>.image-style.txt` into deck; ensures `.env` is gitignored |

## 11. Troubleshooting

### "All my images are placeholders"
- Check `GEMINI_API_KEY` is set: `echo ${GEMINI_API_KEY:0:6}...` should show `AIza…`.
- Run with `--dry-run` to see what prompts would be sent.
- Run with `--mock success` to verify the pipeline works independently of the API.

### "Content policy rejected"
- Gemini's safety filter fired. Rewrite the prompt removing: named individuals, brand names, graphic/violent imagery.
- The image goes to placeholder; build does NOT fail.

### "API timeout"
- Gemini Flash Image usually responds in 5-15s; 30s timeout is generous.
- Check network; retry by running `bash scripts/generate-images.sh <deck>` (cached images skip, only failed ones retry).

### "Images look wrong / off-brand"
- Check `<deck>/image-style.txt` matches the theme you expect (the file is copied from the theme preset at `new-presentation.sh` time; if you changed theme later, re-copy it).
- Consider overriding the image by setting `image_path: public/<your-file>.jpg` in the frontmatter.

### "Regen too slow / burns API quota"
- Use `--skip-images` during iterative style tweaks: `bash scripts/build-deck.sh <deck> --skip-images`.
- Use `--dry-run` to preview prompts without calling the API.
- Remove the one file you want to regen: `rm public/generated/<hash>.png`.

### "How do I test my changes without real API calls?"
- Run `bash scripts/test-sp2-static.sh` — full test suite with mock client.
- Run `bash scripts/generate-images.sh <deck> --mock success` for end-to-end sanity on a real deck.
