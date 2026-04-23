---
name: slidev
description: >
  Use when the user wants to create slides, build a presentation or talk,
  make a deck or pitch, export slides to PDF, work with an existing slides.md,
  run slidev dev mode, or build a static slide site. Also applies when the
  user mentions "presentation", "keynote", "talk", "lecture", "deck",
  "slide deck", or asks to turn content into slides.
version: "2.0.0"
author: carbonshow
tags: [presentation, slidev, slides, export, markdown]
platforms: [claude, cursor, gemini]
trace:
  steps: [prepare, strategize, develop, validate, review, export]
  topology: linear
  max_rounds: 1
---

# slidev

You are a presentation engineer specializing in Slidev. You create Markdown-based
slide decks with animations, code highlighting, and Vue interactivity, using a
centralized runner that avoids per-project npm installs.

This skill bundles four scripts for deterministic operations (initialization,
validation, quality review, running). Your job is to make content design decisions
and orchestrate these scripts — not to re-implement their logic in natural language.

## Resolving Paths

Every script in this skill auto-resolves its own location using
`$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)`. You do not need to hard-code
paths. Just find the directory containing this SKILL.md (the skill root) and call
scripts relative to it:

```bash
SKILL_ROOT="<directory containing this SKILL.md>"
bash "$SKILL_ROOT/scripts/new-presentation.sh" ...
bash "$SKILL_ROOT/scripts/validate-slides.sh" ...
bash "$SKILL_ROOT/scripts/run.sh" ...
bash "$SKILL_ROOT/scripts/review-presentation.sh" ...
```

All scripts accept absolute paths for the slides file. Always resolve paths to
absolute before passing them.

---

## Critical Gotchas

These cause silent failures. The `validate-slides.sh` script checks for all of
them automatically, but understanding *why* helps you avoid them while editing.

**1. No `---` inside frontmatter (including comments)**

Slidev uses `---` to delimit frontmatter. A `---` on any line between the opening
and closing delimiters — even inside a YAML comment — silently truncates everything
after it. The YAML parser sees it as "frontmatter ends here" and the rest becomes
orphaned slide content.

```yaml
# BAD — comment contains ---, truncates theme and everything below
# --- Field definitions below ---
theme: default

# GOOD — no --- anywhere in frontmatter body
theme: default
```

**2. `colorSchema: light` is mandatory**

Slidev inherits the operating system's color scheme by default. On machines set to
dark mode, the default theme renders dark text on a dark background — invisible.
Forcing `colorSchema: light` makes the presentation look the same everywhere,
regardless of the viewer's OS settings.

```yaml
colorSchema: light
```

**3. Use `<hr />` not `---` for dividers inside HTML blocks**

Slidev's parser treats `---` as a slide separator at the top level. This parsing
happens *before* HTML is processed, so `---` inside a `<div>` or `<v-click>` block
splits the slide in two and breaks the HTML structure. Use a self-closing `<hr />`
tag instead.

```html
<!-- BAD — splits this into two broken slides -->
<div>
  Section A
  ---
  Section B
</div>

<!-- GOOD — stays inside the same slide -->
<div>
  Section A
  <hr class="my-3 opacity-30" />
  Section B
</div>
```

**4. Mermaid diagrams use ` ```mermaid `, not magic-move**

Mermaid diagrams are rendered via ` ```mermaid ` fenced code blocks. Magic Move
(` ````md magic-move `) is exclusively for animating transitions between **code
snapshots** — it does not render Mermaid, PlantUML, or any other diagram language.
If you put Mermaid syntax inside a magic-move block, it will display as raw text.

**Mermaid SVG overflow**: Mermaid renders SVGs at their natural pixel width.
A diagram with many parallel nodes (e.g., 5+ nodes in `flowchart TB`) will
exceed the slide width — or worse, exceed a `grid grid-cols-2` column width —
and be silently clipped. The starter template includes a CSS safety net
(`.mermaid svg { max-width: 100%; height: auto; }`), but you should also:
- Prefer `flowchart LR` over `flowchart TB` when nodes fan out horizontally
- Use shorter node labels (abbreviate to 1-2 words)
- Add `{scale: 0.6}` for complex diagrams
- **Never** put a wide Mermaid diagram inside a `grid grid-cols-2` column —
  place it in a full-width section instead

```markdown
<!-- BAD — Mermaid inside magic-move renders as raw text -->
````md magic-move
flowchart LR
  A --> B
````

<!-- GOOD — standalone Mermaid block -->
```mermaid
flowchart LR
  A --> B
```
```

**5. Content must not overflow the viewport — use density controls**

Slides have a fixed, non-scrollable viewport (default 980×552 px). Content that
extends beyond the visible area is silently clipped — the audience cannot scroll.
But "just split into more slides" is not always the best answer: splitting can
fragment a logical argument, break comparisons, and dilute impact.

Slidev provides three native mechanisms for fitting denser content. Use them
before resorting to splitting:

| Technique | Scope | When to use |
|-----------|-------|-------------|
| `zoom: 0.8` in slide frontmatter | Whole slide | Content-heavy slide with many elements |
| `<Transform :scale="0.7">` component | Single element | One large visual (table/diagram) needs shrinking |
| Mermaid `{scale: 0.6}` | Mermaid block | Complex diagram that overflows on its own |

Combined with CSS utilities (`text-sm`, `compact-table`, `max-h-*`,
`object-contain`), you can fit considerably more content per slide.

**Density tiers** (choose the lightest tier that fits your content):

1. **Normal** (default) — no special sizing. One visual + heading + 1-2 lines.
2. **Compact** — add `zoom: 0.9` to the slide, use `text-sm` on bullet text,
   add `compact-table` class on tables. Fits: visual + 3-4 bullets, or two
   related visuals side-by-side in a `grid grid-cols-2`.
3. **Dense** — add `zoom: 0.75`, wrap heavy elements in `<Transform :scale="0.7">`,
   use `text-xs` for supporting text. Use sparingly — for data-comparison slides,
   architecture overviews, or dashboards where splitting would destroy context.

**Hard limits that still apply regardless of density:**
- Never combine three or more full-size visual elements (diagram + table + image)
- Code blocks ≥ 15 lines should get their own slide (scrolling code is unreadable)
- If text drops below ~11px effective size, split instead — unreadable text is
  worse than an extra slide

---

## Workflow

### Step 1: Initialize Presentation

Before creating the presentation, confirm two things with the user:

1. **Output directory** — where to create the presentation files. Suggest a
   reasonable default based on context (e.g., `./presentations/<topic>/` for
   standalone decks, or `./docs/slides/` if inside an existing project).
2. **Language** — what language the slides should use. If the user does not
   specify, infer from the source material: if the input content is primarily
   in Chinese, write the slides in Chinese; if in English, use English; for
   mixed content, follow the dominant language. When in doubt, ask.

Then run:

```bash
bash "$SKILL_ROOT/scripts/new-presentation.sh" <target_dir> \
  --title "Presentation Title" \
  --author "Author Name"
```

Options:
- `--minimal` — generates a stripped-down template (cover + one content + closing)
  instead of the full demo template. Good when the user already has an outline.
- `--force` — overwrites an existing directory.

The script copies the starter template, substitutes title/date/author, creates
the `public/fonts/` directory, symlinks the shared runner's `node_modules` into
the target directory (so Slidev can find Mermaid, themes, and other plugins),
and ensures the runner is ready.

### Step 2: Content Strategy & Style Decisions

Before writing any slides, produce a **design brief** with both content strategy
AND explicit style decisions (theme, layout per slide, density). This is the
single hardest gate in the workflow — getting it right saves hours of rework.

#### Step 2a: Five-dimension analysis (existing)
Assess the source material across: audience / purpose / key messages /
visual strategy / pacing. Read `references/content-strategy.md` for the framework.

#### Step 2b: Three-parameter capture
Extract three explicit style parameters (defined in detail in
`content-strategy.md §6`):
- **tone** — 1 of: casual / professional / academic / technical / playful / inspirational
- **verbosity** — 1 of: concise / standard / text-heavy
- **style_keywords** — 2-5 free-form tags; infer from source if user didn't supply

#### Step 2c: Theme inference
Read `references/theme-library.md`. Match audience + purpose + tone +
style_keywords against the "Use when / Avoid when" lists for the 6 themes.
Choose exactly 1 theme. Note the rationale in the brief.

Fallback: if no theme matches every signal, default to `tech-dark` and
flag "default fallback" in the brief.

#### Step 2d: Per-slide layout assignment
Read `references/layout-catalog.md`. For each slide in the outline, pick
one of the 15 layouts based on the slide's semantic content + the layout's
"When to use / Avoid when" notes. Record the layout choice in the outline
table.

Hard rules (enforced):
- First slide must be `cover`
- `closing` is optional
- `section-divider` only when deck > 20 slides
- `agenda`, if used, within first 3 slides; skip for decks < 5 slides
- `big-statement` ≤ ~10% of deck

#### Step 2e: Design Brief (enriched)
Produce the brief including:
- Audience / Purpose / Language / Estimated slides
- **Style Decisions** section (theme + tone + verbosity + keywords + density tier)
- Key messages (3-5)
- Outline table with columns: # / Heading / Layout / Type / Content summary / Density / Features
- Source material notes (Keep / Compress / Cut / Add)

Show the brief to the user.

#### HARD GATE: user must explicitly confirm
Regardless of how simple the user's intent seems, **wait for explicit user
confirmation** before starting Step 3. Acceptable: "OK", "go", "continue",
"可以", "好的", etc. Silence does NOT count. On modifications, update the
brief and re-display.

> For the full analysis framework, design brief template, pacing guidelines,
> and the Step 2b-e details, read `references/content-strategy.md`.
> For the 6 themes and their selection signals, read `references/theme-library.md`.
> For the 15 layouts and their schemas, read `references/layout-catalog.md`.

### Step 3: Write Content

This is the most important step. Edit `slides.md` based on the approved brief.

**Setup first**: run `new-presentation.sh --theme <chosen-theme>` (from the
brief's Style Decisions) to initialize the deck directory with the correct
theme CSS. Then edit `slides.md` in that directory.

**Do:**
1. Follow the outline from the brief row-by-row — each row is one slide.
2. Use the `layout:` and `class:` values from the outline as-is. Look up the
   layout's schema in `layout-catalog.md` for field names + `maxLength`.
3. **Before writing each field, check its `maxLength`**. If your draft exceeds,
   rewrite it shorter. Don't rely on `validate-slides.sh` to catch overflow;
   that's the last-line-of-defense WARN. Aim for the verbosity target:
   concise 30-50% / standard 50-75% / text-heavy 75-100% of maxLength.
4. Array fields (bullets / metrics / nodes): pick the count per verbosity —
   low end for concise, mid for standard, high end for text-heavy.
5. Write headings as assertions ("Revenue Up 23%") not labels ("Q3 Results").
6. Use `v-click` for step-by-step reveals (30-50% of content slides).
7. For `two-columns`, specify `left.pattern` and `right.pattern` (one of:
   text / bullets / code / image / table / metric) in the slide's
   frontmatter, and use the matching `.pattern-<name>` div inside.
8. When a field genuinely cannot be shortened without losing meaning, add
   `schema-override: true` + a `<!-- note: ... -->` explaining why.

**Don't:**
- Dump all user content onto slides verbatim. Distill and restructure.
- Use layouts that aren't in `layout-catalog.md`.
- Invent new `class:` values. Every layout has one prescribed class (or none).
- Nest layouts. Use `two-columns` with content patterns instead.
- Add animations to every slide — it slows delivery.
- Ignore `maxLength` — WARN from Check 10 is a signal your self-check failed.

> For detailed content design principles (narrative arcs, audience adaptation,
> when to use code vs diagrams, visual hierarchy), read `references/content-design.md`.

> For the design brief template and analysis framework, read `references/content-strategy.md`.

> For frontmatter options beyond the essentials, read `references/frontmatter-guide.md`.

### Step 4: Validate

Run structural validation before previewing or exporting:

```bash
bash "$SKILL_ROOT/scripts/validate-slides.sh" <target_dir>/slides.md
```

This checks all Critical Gotchas automatically: frontmatter integrity, `colorSchema`,
`---` misuse, tag pairing, and more. Fix any FAIL items before proceeding.

> If validation fails, read `references/troubleshooting.md` for solutions to
> common issues.

> **Optional visual quality gate**: `bash "$SKILL_ROOT/scripts/audit-visual.sh"`
> runs a Playwright-driven visual audit across all 6 themes × 15 layouts
> (90 geometric checks, ~15 min). Run after theme or layout CSS changes.
> Requires `npx --prefix <runner> playwright install chromium` on first use.

### Step 5: Review Quality

Run the quality review to catch content-level issues that validation does not cover:

```bash
bash "$SKILL_ROOT/scripts/review-presentation.sh" <target_dir>/slides.md
```

This analyzes:
- **Structure**: slide count, layout variety, animation density
- **Content**: words per slide, heading coverage, empty slides, text-heavy slides
- **Score**: 0-100 with grade (Excellent / Good / Fair / Needs Work)

A score below 70 indicates significant issues. Read the suggestions and iterate
on the content. The `--json` flag outputs machine-readable results for scripted
pipelines.

**After fixing issues**, re-run both validate and review to confirm improvements.

### Step 6: Run & Export

All commands use the centralized runner via `run.sh`:

```bash
# Development mode (hot reload, default port 3030)
bash "$SKILL_ROOT/scripts/run.sh" dev <target_dir>/slides.md

# Export to PDF
bash "$SKILL_ROOT/scripts/run.sh" export <target_dir>/slides.md

# Export to PDF with click steps (each v-click = separate page)
bash "$SKILL_ROOT/scripts/run.sh" export <target_dir>/slides.md --with-clicks

# Build static HTML site (self-contained, can be served anywhere)
bash "$SKILL_ROOT/scripts/run.sh" build <target_dir>/slides.md
```

Extra flags are passed through to `@slidev/cli`. Common options:
- `--port 3031` — use a different port for dev mode
- `--with-clicks` — expand animations into separate PDF pages
- `--output filename.pdf` — custom output filename for export

PDF export requires Playwright. If not installed:
```bash
npx playwright install chromium
```

---

## Quality Gate

Before declaring a presentation complete, ensure it passes both automated checks:

```bash
# 1. Structural validation (must be all PASS)
bash "$SKILL_ROOT/scripts/validate-slides.sh" <slides_path>

# 2. Quality review (target: score >= 70, ideally >= 85)
bash "$SKILL_ROOT/scripts/review-presentation.sh" <slides_path>
```

A presentation is ready for delivery when:
- validate-slides.sh reports 0 failures
- review-presentation.sh scores "Good" (70+) or "Excellent" (90+)
- The user has reviewed the content and confirmed it matches their intent

---

## Customization

The starter template is designed to be modified. Here is what users can configure:

### Colors

Edit CSS custom properties in `style.css`:

```css
:root {
  --color-primary: #1E3A5F;   /* Headings, accents */
  --color-accent: #3B7DD8;    /* Sub-headings */
  --color-text: #1A1A2E;      /* Body text */
  --color-bg: #FFFFFF;        /* Background */
  --color-muted: #6B7280;     /* Secondary text */
}
```

### Fonts

1. Place `.woff2` font files in `<target_dir>/public/fonts/`
2. Add `@font-face` declarations in `style.css` (see commented examples in the template)
3. Add the font name to the `.slidev-layout` font-family list

### Themes

The default theme is bundled with the runner. To use a different Slidev theme:
1. Install it in the runner: `cd "$SKILL_ROOT/assets/runner" && npm install @slidev/theme-<name>`
2. Update the `theme:` field in `slides.md` frontmatter
3. Pass the theme path to `run.sh` or update the `THEME` variable in the script

### Dev Server Port

```bash
bash "$SKILL_ROOT/scripts/run.sh" dev slides.md --port 3031
```

---

## Syntax Quick Reference

| Feature | Syntax | Notes |
|---------|--------|-------|
| Step-by-step reveal | `<v-click>content</v-click>` | Click to show next item |
| Text highlighting | `<v-mark type="underline\|circle\|box\|highlight">text</v-mark>` | Visual emphasis on click |
| Code line highlight | ` ```ts {1\|3-4\|all} ` | Step through highlighted lines |
| Code animation | ` ````md magic-move ` blocks | Code-only; not for Mermaid/diagrams |
| Mermaid diagrams | ` ```mermaid ` blocks | Built-in; use `{scale: 0.7}` to shrink |
| Images | `<img src="/file.png" class="w-3/5 mx-auto" />` | Files in `public/`; control size with Tailwind |
| Slide zoom | `zoom: 0.8` in slide frontmatter | Shrink entire slide content uniformly |
| Element scale | `<Transform :scale="0.7">content</Transform>` | Shrink one element; origin defaults top-left |
| Compact table | `<table class="compact-table">` or `{.compact-table}` | Smaller font + padding for dense tables |
| Image containment | `<img class="max-h-80 object-contain" />` | Prevents overflow; auto-scales to fit |
| Vue components | `<script setup>` + template | Full Vue 3 reactivity |
| Two-column layout | `<div class="grid grid-cols-2 gap-4">` | Tailwind CSS available |
| Presenter notes | `<!-- note text -->` | Hidden from audience |

> For full syntax details, read `references/slidev-syntax.md`.

---

## Completion Checklist

- [ ] Design Brief was shown AND explicitly confirmed by the user (hard gate)
- [ ] Theme from the brief was used with `new-presentation.sh --theme <name>`
- [ ] All slides use layouts from `references/layout-catalog.md`
- [ ] `validate-slides.sh` reports 0 failures (0 FAIL entries; WARNs acceptable with justification)
- [ ] Any remaining WARN entries are documented (e.g., "WARN: bullet 5 over
  maxLength — kept intentionally because it's a direct quote; see schema-override")
- [ ] `review-presentation.sh` scores >= 70
- [ ] Cover slide is `layout: cover`; has title, subtitle/author, date
- [ ] Content follows one-idea-per-slide principle
- [ ] User has been shown dev/export/build commands
- [ ] If exporting PDF: Playwright installed and export verified

---

## SP2: Image Generation Pipeline

Slidev auto-generates images for three image-consuming layouts (image-focus, image-text-split, and two-columns with `image` pattern) using Google Gemini 2.5 Flash Image.

### Prerequisites

- Set `GEMINI_API_KEY` environment variable. Without it, images become theme-aware placeholder SVGs.
- Images are produced during `build-deck.sh`; `run.sh dev` never calls the API.
- Generated images live at `<deck>/public/generated/<hash>.png`. Commit them (hash is stable).

### Claude's Job When Authoring Slides

When choosing `layout: default` + `class: image-focus`, `layout: image-left` / `image-right`, or the `image` pattern inside a `two-cols-header` column, you MUST add:

```yaml
image_prompt: >
  <describe the subject + composition + mood, in English, 40–150 chars,
  include "no text, no logos", do NOT describe theme style>
```

The theme's `image-style.txt` automatically appends style direction. Don't duplicate it.

### One-Line Build

```bash
bash scripts/build-deck.sh <deck>
```

This runs validate → generate-images → slidev build, produces `dist/`.

Flags:
- `--skip-images` — skip SP2 (use when iterating slides without burning tokens)
- `--force-images` — regenerate all images, ignore cache

### Key Setup (if GEMINI_API_KEY not set)

The pipeline prints instructions on first run. Quick reference:
1. Get a key: https://aistudio.google.com/app/apikey
2. `export GEMINI_API_KEY=AIza...`
3. Re-run `build-deck.sh`.

### Testing & Mock

`gemini-client.js` exports `createMockClient(scenario)` (scenarios: `success`, `timeout`, `content_policy`, `network`, `api`). Invoke via:
```bash
bash scripts/generate-images.sh <deck> --mock success
```

Full docs: `references/image-generation.md` §9.
Static test suite: `bash scripts/test-sp2-static.sh`.

### Troubleshooting

See `references/image-generation.md` §11.
