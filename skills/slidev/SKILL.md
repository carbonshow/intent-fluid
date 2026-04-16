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

**5. One visual element per slide — no overflow**

Slides have a fixed viewport (default 980×552 px). A Mermaid diagram, a large
image, or a table each consume significant vertical space. Combining any two of
these on one slide — or adding substantial text below a visual — will push content
below the visible area. The audience cannot scroll.

Rule of thumb for a single slide:
- **Diagram + 1 sentence** — OK
- **Diagram + bullet list** — will likely overflow; split into two slides
- **Image + table** — will overflow; never combine
- **Mermaid with subgraph** — use `{scale: 0.7}` or simpler layout (LR over TB)

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

### Step 2: Content Strategy

Before writing any slides, analyze the source material and produce a design brief.
This prevents the most common failure mode: creating a faithful text dump of the
source instead of an effective presentation.

If the user provides a document, directory, or URL as source material, read it
and assess across five dimensions:

1. **Audience** — who will see this? (technical peers / executives / students / general)
2. **Purpose** — what should the audience do after? (inform / persuade / teach / report)
3. **Key messages** — the 3-5 things the audience must remember
4. **Visual strategy** — mix of slide types (text, diagram, code, image, table)
5. **Pacing** — estimated slide count and rhythm (deep dives, breathers, transitions)

Then produce a **design brief** with an outline table (one row per slide) and
show it to the user. Wait for confirmation or adjustments before writing slides.
If the user's intent is simple enough ("just make it quick"), you can propose the
brief and proceed without waiting, but always show the brief.

> For the full analysis framework, design brief template, and pacing guidelines,
> read `references/content-strategy.md`.

### Step 3: Write Content

This is the most important step. Edit `slides.md` based on the user's materials.

**Do:**
1. Start with the narrative arc — what story do these slides tell?
2. One idea per slide. If a slide needs two sentences to describe, split it.
3. Write headings as assertions ("Revenue Up 23%") not labels ("Q3 Results").
4. Use `v-click` for step-by-step reveals on complex slides (aim for 30-50% of
   content slides to use animations).
5. Keep text density at 40-80 words per content slide.

**Don't:**
- Dump all user content onto slides verbatim. Distill and restructure.
- Use more than 5 bullet points per slide.
- Add animations to every slide — it slows delivery.
- Exceed 120 words on any single slide without good reason.

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
| Vue components | `<script setup>` + template | Full Vue 3 reactivity |
| Two-column layout | `<div class="grid grid-cols-2 gap-4">` | Tailwind CSS available |
| Presenter notes | `<!-- note text -->` | Hidden from audience |

> For full syntax details, read `references/slidev-syntax.md`.

---

## Completion Checklist

- [ ] `validate-slides.sh` reports 0 failures
- [ ] `review-presentation.sh` scores >= 70
- [ ] Cover slide has title, subtitle/author, and date
- [ ] Content follows one-idea-per-slide principle
- [ ] User has been shown dev/export/build commands
- [ ] If exporting PDF: Playwright installed and export verified
