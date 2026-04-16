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

### Obsidian Integration

Add these for Obsidian vault compatibility:

```yaml
cssclasses:
  - wide-page
status: in-progress
```

---

## Critical Gotchas

### 1. NO `---` Inside Frontmatter

The `---` delimiter marks frontmatter end. Even in comments:

```yaml
# ❌ BROKEN - Comment contains --- 
# --- Configuration below ---
theme: default

# ✅ CORRECT - No --- anywhere in frontmatter
theme: default
```

### 2. Always Include `colorSchema: light`

Prevents system dark theme from overriding your design:

```yaml
colorSchema: light  # Forces light theme regardless of system settings
```

### 3. Quote Values with Special Characters

```yaml
# ✅ CORRECT - Quoted when needed
title: "My Talk: A Deep Dive"
```

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
cssclasses:
  - wide-page
status: draft

# Slidev configuration
theme: default
colorSchema: light
class: text-center
highlighter: shiki
---
```

