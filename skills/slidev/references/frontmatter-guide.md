# Frontmatter Configuration Guide

## Essential Fields

```yaml
---
title: Your Presentation Title
date: 2026-04-16
theme: default
colorSchema: light
class: text-center
highlighter: shiki
---
```

### Field Descriptions

| Field | Purpose | Example |
|-------|---------|---------|
| `title` | Presentation title | `"My Amazing Talk"` |
| `date` | Creation/update date | `2026-04-16` |
| `theme` | Slidev theme name | `default` (built-in) |
| `colorSchema` | Force light/dark mode | `light` (prevent dark mode override) |
| `class` | Global CSS classes | `text-center` (Tailwind) |
| `highlighter` | Code syntax highlighter | `shiki` (recommended) |

---

## Optional Fields

### Tags and Metadata

```yaml
tags:
  - presentation/topic
  - year/2026
```

### Presentation Behavior

| Field | Purpose | Example | Default |
|-------|---------|---------|---------|
| `transition` | Slide transition effect | `slide-left`, `fade`, `none` | `slide-left` |
| `aspectRatio` | Slide aspect ratio | `16/9`, `4/3` | `16/9` |
| `canvasWidth` | Canvas width in pixels | `980` | `980` |
| `lineNumbers` | Show line numbers in code blocks | `true`, `false` | `false` |
| `drawings` | Enable drawing/annotation in slides | `{ enabled: true }` | `{ enabled: true }` |
| `download` | Show download button in SPA mode | `true`, `"/my-deck.pdf"` | `false` |
| `exportFilename` | Default filename for PDF export | `"my-deck"` | `"slidev-exported"` |
| `info` | Markdown text shown in info dialog | `"## About\nA talk about..."` | `""` |
| `monaco` | Enable Monaco editor in code blocks | `true`, `false` | `true` |
| `remoteAssets` | Download remote assets locally | `true`, `false` | `false` |
| `selectable` | Allow text selection in slides | `true`, `false` | `false` |

### Per-slide Frontmatter

Individual slides can override global settings with their own frontmatter block
between `---` separators:

```yaml
---
layout: two-cols
transition: fade
class: text-left
clicks: 3
---
```

| Field | Purpose | Example |
|-------|---------|---------|
| `layout` | Slide layout template | `default`, `cover`, `center`, `two-cols`, `image`, `image-right` |
| `transition` | Override transition for this slide | `fade`, `slide-up` |
| `class` | CSS classes for this slide | `text-left`, `my-custom-class` |
| `clicks` | Total click count (override auto-detection) | `3` |
| `disabled` | Hide this slide from the deck | `true` |
| `hide` | Same as `disabled` | `true` |

---

## Tips

- Quote YAML values that contain colons or special characters: `title: "My Talk: A Deep Dive"`
- Run `bash scripts/validate-slides.sh <path>` to catch frontmatter errors automatically.
- See SKILL.md "Critical Gotchas" for the full list of pitfalls (colorSchema, `---` inside frontmatter, etc.).

---

## Example: Complete Frontmatter

```yaml
---
title: "Q2 2026 Product Roadmap"
description: "Engineering team quarterly planning"
date: 2026-04-16
tags:
  - planning
  - product
  - quarterly

# Slidev configuration
theme: default
colorSchema: light
class: text-center
highlighter: shiki
transition: slide-left
aspectRatio: 16/9
lineNumbers: false
exportFilename: "q2-roadmap"
download: true
---
```
