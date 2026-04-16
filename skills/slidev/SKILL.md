---
name: slidev
description: >
  Complete workflow for creating Slidev presentations, managing dev/preview/export commands.
  Trigger when user says: "create a Slidev presentation", "make slides", "export to PDF",
  "run dev mode", "build static site". Suitable for all scenarios where users need to create,
  preview, or export slide decks using Slidev.
version: 1.0.0
author: carbonshow
tags: [presentation, slidev, slides, ppt, export]
platforms: [claude, cursor, gemini]
trace:
  steps: [prepare, develop, export, publish]
  topology: linear
  max_rounds: 1
---

# Slidev Workflow

## Overview

Slidev is a web-based presentation framework that lets you write presentations in Markdown with integrated Vue components, animations, and interactivity. This skill handles the complete workflow: initializing projects, managing content, and handling exports.

## Key Features

- **Markdown-based**: Write presentations in familiar Markdown syntax
- **Vue 3 Integration**: Use Vue components, `v-click` animations, `<v-mark>` highlighting
- **Code Animation**: Magic Move for smooth code transitions
- **Multiple Export Formats**: PDF, HTML static sites
- **Hot Reload**: Real-time preview with live editing

---

## Step 1: Determine Target Directory & Create Project

Ask user about presentation topic and intended use. Create directory structure:

```bash
TARGET_DIR="path/to/presentation"
mkdir -p "$TARGET_DIR"
```

## Step 2: Initialize Presentation

Copy template files to the target directory:

```bash
# Copy presentation starter (must be named slides.md)
cp skills/slidev/assets/slidev-starter/slides.md "$TARGET_DIR/slides.md"

# Copy styling (optional, but recommended for consistent theming)
cp skills/slidev/assets/slidev-starter/style.css "$TARGET_DIR/style.css"

# Create fonts directory for custom fonts
mkdir -p "$TARGET_DIR/public/fonts"
```

**Important**: Slidev CLI looks for `slides.md` by default. Keep this naming convention.

---

## Step 3: Pre-flight Checks

### 3a. Verify Node.js Version

```bash
node --version
# Must be >= 18. If lower, ask user to upgrade
```

### 3b. Check for Custom Fonts (Optional)

If using the included template with Chinese font references:

```bash
ls "$TARGET_DIR/public/fonts/"
# Expected: NotoSansSC-Regular.woff2, NotoSansSC-Bold.woff2
```

If fonts are missing, inform user that fallback system fonts will be used. This does not block development or preview.

### 3c. Playwright for PDF Export (Only if Exporting)

Only install when user explicitly requests PDF export:

```bash
npx playwright install chromium
# ~5 minutes first time, then cached
```

---

## Step 4: Customize Presentation Content

Edit `slides.md` with user-provided outline:

1. **Update frontmatter**: `title`, `date`, `tags`
2. **Modify cover slide**: Title, subtitle, author name
3. **Add content slides**: Based on user's outline or provided materials
4. **Clean up template examples**: Remove unused demo pages (v-click, Magic Move, etc.)

### ⚠️ Critical Gotchas

**1. No `---` (dashes) inside frontmatter**

Slidev/YAML uses `---` to mark frontmatter end. Even in comments:

```yaml
# ❌ WRONG - Comment with --- causes truncation
# --- Field definitions below ---
theme: default

# ✅ CORRECT - No --- in frontmatter
theme: default
```

**2. Must include `colorSchema: light`**

Ensures consistent appearance across light/dark system themes:

```yaml
---
colorSchema: light
theme: default
---
```

**3. Use `<hr />` instead of `---` for slide dividers in content**

`---` is a slide separator. Inside `<div>` or `<v-click>`, it breaks HTML parsing:

```html
<!-- ❌ WRONG -->
<div>
  Section A
  ---
  Section B
</div>

<!-- ✅ CORRECT -->
<div>
  Section A
  <hr class="my-3 opacity-30" />
  Section B
</div>
```

---

## Step 5: Running Presentations

All commands use the shared Slidev runner environment. Commands must be executed from the runner directory with absolute paths to slides.md.

```bash
RUNNER="skills/slidev/assets/runner"
THEME="$RUNNER/node_modules/@slidev/theme-default"
SLIDES="/absolute/path/to/slides.md"
```

### Development Mode (with hot reload)

```bash
cd "$RUNNER" && npx @slidev/cli "$SLIDES" --theme "$THEME"
```

- Server starts on `http://localhost:3030`
- Edit `slides.md` → auto-refresh browser
- Use arrow keys or spacebar to navigate

### Export to PDF (Basic)

```bash
cd "$RUNNER" && npx @slidev/cli export "$SLIDES" --theme "$THEME"
```

- Outputs `slides.pdf` in same directory as `slides.md`
- One slide per export page
- Animations collapsed into single view

### Export to PDF (With Click Steps)

```bash
cd "$RUNNER" && npx @slidev/cli export "$SLIDES" --theme "$THEME" --with-clicks
```

- Each `v-click` animation becomes a separate page
- Larger file size
- Better for step-by-step presentations

### Build Static HTML Site

```bash
cd "$RUNNER" && npx @slidev/cli build "$SLIDES" --theme "$THEME"
```

- Outputs to `dist/` in slides directory
- Self-contained, can be served anywhere
- No Slidev dependency required to view

---

## Slidev Syntax Reference

Quick reference for common features in presentations:

| Feature | Syntax | Notes |
|---------|--------|-------|
| **Step-by-step reveal** | `<v-click>content</v-click>` | Click to show next item |
| **Text highlighting** | `<v-mark type="underline\|circle\|box\|highlight">text</v-mark>` | Visual emphasis |
| **Code line highlight** | ` ```ts {1\|3-4\|all} ` | Step through highlighted lines |
| **Code animation** | ` ```magic-move ` blocks | Smooth char-level code transitions |
| **Vue components** | `<script setup>` + template | Full Vue 3 reactivity |
| **Two-column layout** | `<div class="grid grid-cols-2 gap-4">` | Tailwind CSS available |
| **Presenter notes** | Text after `<!--` comment marker | Hidden from audience |

---

## Frontmatter Fields

### Obsidian Compatibility

Slidev frontmatter can coexist with Obsidian fields:

```yaml
---
# Obsidian fields
title: My Presentation
tags: [slidev, demo]
date: 2026-04-16

# Slidev fields
theme: default
colorSchema: light
class: text-center
highlighter: shiki
---
```

**Important restrictions**:
- No `---` separators inside frontmatter (breaks parsing)
- No `[[wikilinks]]` in presentation content
- Use `<hr />` not `---` for visual dividers in slides

---

## Publishing & Distribution

After completing the presentation:

1. **For sharing**: Export to PDF or build static HTML
2. **For presenting**: Use dev mode with live display
3. **For archiving**: Commit `slides.md` to version control

Slidev presentations are self-contained text files — version control them alongside project materials.

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "theme not found" | Ensure `--theme` points to absolute path in runner/node_modules |
| PDF export fails | Run `npx playwright install chromium` |
| Chinese characters display wrong | Place font files in `public/fonts/`, update `style.css` |
| Animations not working | Check `v-click` syntax, ensure no stray `---` in content |
| Dev server won't start | Kill existing process on port 3030, check Node version |

---

## Completion Checklist

- [ ] `slides.md` created with correct frontmatter
- [ ] Content outline converted to slides
- [ ] No `---` separators in frontmatter or HTML blocks (use `<hr />`)
- [ ] `colorSchema: light` present in frontmatter
- [ ] Dev mode tested (server starts, hot reload works)
- [ ] If exporting: Playwright installed, PDF export confirmed
- [ ] User provided dev/export command reference
