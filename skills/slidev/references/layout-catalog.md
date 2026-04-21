# Layout Catalog

> Claude reads this during Step 2d (per-slide layout assignment) and Step 3
> (writing slides) of the workflow. It also serves as the schema source for
> `validate-slides.sh` Check 10.
>
> Contains 15 semantic layouts. Each layout maps to a built-in Slidev layout
> (sometimes with a `class:` for theme CSS specialization). Layouts CANNOT
> be nested inside each other — for heterogeneous two-column content, use
> the `two-columns` layout with content patterns (see the dedicated section
> at the end of this file).

## Catalog usage rules

1. **First slide must be `cover`.**
2. **`closing` is optional** — skip when the deck has no natural CTA.
3. **`section-divider` is used only when the deck has > 20 slides.**
4. **`agenda`, when used, appears in the first 3 slides.** Skip for decks
   shorter than 5 slides.
5. **`big-statement` is used sparingly** — no more than ~10% of the deck.
6. **User preference overrides any rule** — note overrides in the brief's
   Style Decisions section.

## Field length & verbosity

Every field has a `maxLength` (hard ceiling, in characters; CJK = Latin = 1).
`verbosity` controls how close to the ceiling Claude writes:

- `concise` — target 30-50% of maxLength, prefer fewer array items
- `standard` — target 50-75% of maxLength, mid-range array counts
- `text-heavy` — target 75-100% of maxLength, more array items

`maxLength` does NOT scale with verbosity — it is a hard ceiling regardless.

If a field genuinely cannot be truncated without losing meaning, add
`schema-override: true` to the slide's frontmatter along with a
`<!-- note: ... -->` explaining why. This is a rare escape hatch.

---

## cover

**Semantic role**: Deck entry — title, optional subtitle, author, date, occasion.

**Slidev frontmatter**:
```yaml
layout: cover
```

**When to use**:
- Always the first slide of a deck
- One cover per deck (not repeated)

**Avoid when**:
- Never — this is a required layout for slide 1

**Fields schema**:
- `title`: string, required, maxLength 60 — assertion-style if possible; avoid generic "My Talk"
- `subtitle`: string, optional, maxLength 100 — occasion / subtitle / one-line hook
- `author`: string, optional, maxLength 50 — presenter name(s)
- `date`: string, optional, maxLength 20 — ISO date or human-readable

**Markdown template**:
```markdown
---
layout: cover
---

# {{title}}

{{subtitle}}

<div class="pt-4 text-gray-400">
{{author}} · {{date}}
</div>
```

**Density tier default**: Normal

**Allowed animations**: none (cover should feel static and composed)

---

## agenda

**Semantic role**: Navigation — the 3-7 things this deck/lecture will cover.

**Slidev frontmatter**:
```yaml
layout: default
class: agenda
```

**When to use**:
- Decks with ≥ 5 slides where the audience benefits from a roadmap
- Always place within the first 3 slides (cover → agenda → content, or cover → opener → agenda)
- Teaching scenarios (students expect a syllabus-like preview)
- Reporting scenarios (executives want to know the structure before content)

**Avoid when**:
- Very short decks (< 5 slides) — navigation adds no value
- Placed later than slide 3 — it becomes retrospective, not navigational
- Content that does not partition cleanly into 3-7 named items

**Fields schema**:
- `title`: string, required, maxLength 50 — usually "Agenda", "Today", "What we'll cover", 或 "议程"
- `items`: array of strings, required, 3-7 items, each maxLength 50 — future-section titles, noun-phrase form
- `numbered`: boolean, optional, default true — use numbered list vs plain bullets

**Markdown template**:
```markdown
---
layout: default
class: agenda
---

# {{title}}

1. {{item 1}}
2. {{item 2}}
3. {{item 3}}
4. {{item 4}}
5. {{item 5}}
```

**Density tier default**: Normal

**Allowed animations**: v-click optional on each item (reveals 1-by-1 for teaching tone); skip for executive-report brevity.

---

## section-divider

**Semantic role**: Chapter boundary — signals transition to a new major section.

**Slidev frontmatter**:
```yaml
layout: section
```

**When to use**:
- Only when the deck has > 20 slides and naturally divides into ≥ 2 major sections
- Between the sections, not within them
- Section names should mirror the `agenda` items if one exists

**Avoid when**:
- Deck ≤ 20 slides — short decks have natural pacing and dividers slow them
- Used more frequently than every ~8 slides (over-segmentation)
- Transitioning between closely related slides (that's just a new slide, not a new section)

**Fields schema**:
- `section_title`: string, required, maxLength 40 — section name, noun or short phrase
- `section_number`: string, optional, maxLength 10 — e.g., "Part II", "Chapter 3"

**Markdown template**:
```markdown
---
layout: section
---

# {{section_title}}

{{section_number}}
```

**Density tier default**: Normal

**Allowed animations**: none (dividers should be instant, no clicks to advance)

---

## closing

**Semantic role**: Final slide(s) — thank-you, Q&A invitation, call to action.

**Slidev frontmatter**:
```yaml
layout: end
```

**When to use**:
- Optionally as the last slide of any deck
- When there is a natural Q&A, CTA, or farewell moment

**Avoid when**:
- The deck ends on a natural summary or decision-request (`big-statement` may be a better final slide)
- Forcing a "Thank You" when the talk ends on a cliffhanger or open question

**Fields schema**:
- `title`: string, required, maxLength 30 — e.g., "Thank You", "Questions?", "感谢", "Let's Build This"
- `subtitle`: string, optional, maxLength 80 — follow-up detail (contact, next step, Q&A invite)

**Markdown template**:
```markdown
---
layout: end
---

# {{title}}

{{subtitle}}
```

**Density tier default**: Normal

**Allowed animations**: none

---

## big-statement

**Semantic role**: One sentence occupying the whole slide — high-weight decision, key takeaway, or pull-quote.

**Slidev frontmatter**:
```yaml
layout: center
class: big-statement
```

**When to use**:
- The single most important sentence of a section (one per 10 slides max)
- Decision requests in executive decks ("请批准增加 3 人预算")
- Memorable key insights in educational decks ("链表的本质是指针的容器")
- Punch-line after setup; transition from data into argument

**Avoid when**:
- More than ~10% of the deck uses this layout (dilutes emphasis)
- The statement is actually a list or multi-part claim (split into multiple slides or use `content-narrative`)
- The sentence exceeds 120 characters (too long for one-breath delivery)

**Fields schema**:
- `statement`: string, required, maxLength 120 — single sentence, declarative
- `attribution`: string, optional, maxLength 50 — attribution for quotes, or null for own statements

**Markdown template**:
```markdown
---
layout: center
class: big-statement
---

<div class="statement">
{{statement}}
</div>

<div class="attribution">
— {{attribution}}
</div>
```

**Density tier default**: Normal (the design is inherently generous-whitespace; Compact not recommended)

**Allowed animations**: v-click optional on the statement (useful when revealing the punch line after a setup monologue).

---

## content-bullets

**Semantic role**: One claim + 3-5 supporting bullets — the workhorse of most decks.

**Slidev frontmatter**:
```yaml
layout: default
class: content-bullets
```

**When to use**:
- Presenting a claim with discrete supporting points
- When each supporting point is a short phrase, not a paragraph
- For step-by-step reveals via v-click (teaching mode)
- Default choice when unsure between this and `content-narrative`

**Avoid when**:
- Points are interdependent prose that flows naturally — use `content-narrative`
- More than 5 items — consider splitting or restructuring; agenda-style lists go in `agenda`
- Very short (1-2 items) — use `content-narrative` or `big-statement`

**Fields schema**:
- `title`: string, required, maxLength 60 — assertion-style heading
- `subtitle`: string, optional, maxLength 90 — context / sub-claim
- `bullets`: array of strings, required, 3-5 items, each maxLength 90

**Markdown template**:
```markdown
---
layout: default
class: content-bullets
---

# {{title}}

{{subtitle}}

<v-click>

- {{bullet 1}}

</v-click>

<v-click>

- {{bullet 2}}

</v-click>

<v-click>

- {{bullet 3}}

</v-click>
```

**Density tier default**: Normal

**Allowed animations**: v-click per bullet (preferred when teaching); v-mark on the title for emphasis; 30-50% of content-bullets slides should use v-click.

---

## content-narrative

**Semantic role**: One claim + a paragraph of exposition — flowing prose, not discrete points.

**Slidev frontmatter**:
```yaml
layout: default
class: content-narrative
```

**When to use**:
- Concept explanation where sentences build on each other
- Opening background slides / introductions / framing
- When bullet points would fragment the logic

**Avoid when**:
- Content is genuinely a list — use `content-bullets`
- Paragraph exceeds 300 characters — split into multiple slides or use `text-heavy` verbosity + higher density

**Fields schema**:
- `title`: string, required, maxLength 60
- `subtitle`: string, optional, maxLength 90
- `body`: markdown string, required, maxLength 300 — supports inline `**bold**`, `*italic*`, `` `code` `` but NOT fenced code blocks
- `emphasis`: string, optional, maxLength 40 — a phrase within `body` to wrap in `<v-mark>`

**Markdown template**:
```markdown
---
layout: default
class: content-narrative
---

# {{title}}

{{subtitle}}

{{body}}
```

**Density tier default**: Normal (switch to Compact only if body + subtitle is near ceiling)

**Allowed animations**: v-mark on the key phrase (optional); v-click to reveal the body paragraph after the heading (optional, uncommon).

---

## three-metrics

**Semantic role**: Three headline metrics in a horizontal row — big numbers + one-line captions.

**Slidev frontmatter**:
```yaml
layout: default
class: three-metrics
```

**When to use**:
- KPI summaries with exactly 3 headline numbers
- Progress reports: latency / throughput / error rate, or similar triads
- Goals scorecards (target / current / delta)

**Avoid when**:
- More than 3 metrics — use `data-table` for 4+
- Only 1-2 metrics — use `big-statement` or `content-narrative` with inline numbers
- The metrics are not comparable (different scales, unrelated units) — grouping them dilutes the slide

**Fields schema**:
- `title`: string, required, maxLength 60
- `metrics`: array, required, exactly 3 items, each with:
  - `value`: string, required, maxLength 12 — the number itself, including unit suffix if compact (e.g., "42%", "1.2M")
  - `unit`: string, optional, maxLength 15 — separate unit when the value needs breathing room
  - `caption`: string, required, maxLength 40 — what this metric means

**Markdown template**:
```markdown
---
layout: default
class: three-metrics
---

# {{title}}

<div class="metrics-row">
  <div class="metric">
    <div class="metric-value">{{metrics[0].value}}</div>
    <div class="metric-caption">{{metrics[0].caption}}</div>
  </div>
  <div class="metric">
    <div class="metric-value">{{metrics[1].value}}</div>
    <div class="metric-caption">{{metrics[1].caption}}</div>
  </div>
  <div class="metric">
    <div class="metric-value">{{metrics[2].value}}</div>
    <div class="metric-caption">{{metrics[2].caption}}</div>
  </div>
</div>
```

**Density tier default**: Normal

**Allowed animations**: v-click per metric (reveal one-by-one when building suspense); v-mark on the most important metric's caption.

---

## data-table

**Semantic role**: Structured tabular data — 3-10 rows × 2-6 columns.

**Slidev frontmatter**:
```yaml
layout: default
class: data-table
```

**When to use**:
- Comparisons that require seeing rows and columns (feature matrices, KPI vs target)
- More than 3 metrics (where `three-metrics` doesn't fit)
- Data-forward executive reporting

**Avoid when**:
- Fewer than 3 rows — use `three-metrics` or a bullet list instead
- More than 10 rows — split into multiple slides, or use an appendix reference
- More than 6 columns — visually cramped; split by concern
- Inside `two-columns` — for that case use the `table` content pattern (limited to 2-3 cols × 3-6 rows)

**Fields schema**:
- `title`: string, required, maxLength 60
- `columns`: array of strings, required, 2-6 items, each maxLength 20 — column headers
- `rows`: array, required, 3-10 items, each an array of strings matching `columns` length, each cell maxLength 30
- `highlight_column`: integer, optional — 0-indexed column to style with accent color
- `caption`: string, optional, maxLength 80 — footnote / source / sampling note

**Markdown template**:
```markdown
---
layout: default
class: data-table
---

# {{title}}

| {{col 1}} | {{col 2}} | {{col 3}} |
|-----------|-----------|-----------|
| {{r1c1}}  | {{r1c2}}  | {{r1c3}}  |
| {{r2c1}}  | {{r2c2}}  | {{r2c3}}  |
| {{r3c1}}  | {{r3c2}}  | {{r3c3}}  |

<div class="caption">{{caption}}</div>
```

**Density tier default**: Normal. If rows exceed 7 or columns exceed 4, set `density_tier: Compact` on this slide.

**Allowed animations**: v-mark on the header of the highlighted column (optional).

---

## timeline-horizontal

**Semantic role**: Horizontal timeline with 4-6 nodes — roadmap, version history, milestones.

**Slidev frontmatter**:
```yaml
layout: default
class: timeline-horizontal
```

**When to use**:
- Product roadmaps, release timelines, project milestones
- Historical evolution (library versions, standards progression)
- Sequential workflow stages that have time / ordering semantics

**Avoid when**:
- Fewer than 4 nodes — use bullet list instead
- More than 6 nodes — split into two slides or use `data-table`
- No clear ordering — use `content-bullets` or `data-table`
- The relationships are branching, not linear — use `diagram-primary` with Mermaid flowchart

**Fields schema**:
- `title`: string, required, maxLength 60
- `nodes`: array, required, 4-6 items, each with:
  - `label`: string, required, maxLength 20 — short milestone name or date
  - `detail`: string, optional, maxLength 40 — one-line description

**Markdown template**:
```markdown
---
layout: default
class: timeline-horizontal
---

# {{title}}

<div class="timeline">
  <div class="node">
    <div class="node-label">{{nodes[0].label}}</div>
    <div class="node-detail">{{nodes[0].detail}}</div>
  </div>
  <div class="node">
    <div class="node-label">{{nodes[1].label}}</div>
    <div class="node-detail">{{nodes[1].detail}}</div>
  </div>
  <div class="node">
    <div class="node-label">{{nodes[2].label}}</div>
    <div class="node-detail">{{nodes[2].detail}}</div>
  </div>
  <div class="node">
    <div class="node-label">{{nodes[3].label}}</div>
    <div class="node-detail">{{nodes[3].detail}}</div>
  </div>
</div>
```

**Density tier default**: Normal. Use Compact when 6 nodes are present with long labels.

**Allowed animations**: v-click on each node to reveal in order (preferred for teaching roadmaps).

---

## code-focus

**Semantic role**: A code block is the slide's primary visual — code dominates, prose supports.

**Slidev frontmatter**:
```yaml
layout: default
class: code-focus
```

**When to use**:
- Showing an API, function, or pattern in the actual language
- Step-by-step code walkthroughs (with `{1|3-4|all}` highlighting)
- Code evolution (before → after → final, via `magic-move`)

**Avoid when**:
- Code exceeds ~15 lines — split into multiple slides or magic-move variants
- The logic matters more than the syntax — use pseudocode or a diagram
- Audience cannot read the language — pseudocode or a `content-bullets` explanation

**Fields schema**:
- `title`: string, required, maxLength 60 — assertion about the code, not just "Example"
- `subtitle`: string, optional, maxLength 90 — one-line context
- `language`: string, required, maxLength 20 — Shiki language identifier (e.g., `typescript`, `rust`, `python`)
- `code`: string, required — the code itself; must fit Slidev viewport at default font size (aim for ≤ 12 lines)
- `line_highlight`: string, optional, maxLength 30 — Shiki syntax like `{1|3-4|all}` for click-through reveal
- `magic_move`: boolean, optional, default false — if true, `code` is expected to contain multiple snapshots in the magic-move fence
- `trailing_note`: string, optional, maxLength 100 — one-line takeaway under the code

**Markdown template** (single snapshot):
```markdown
---
layout: default
class: code-focus
---

# {{title}}

{{subtitle}}

\`\`\`{{language}} {{line_highlight}}
{{code}}
\`\`\`

{{trailing_note}}
```

**Markdown template** (magic-move):
```markdown
---
layout: default
class: code-focus
---

# {{title}}

````md magic-move
```{{language}}
// snapshot 1
{{code_v1}}
```

```{{language}}
// snapshot 2
{{code_v2}}
```
````
```

**Density tier default**: Normal. Compact when code > 10 lines.

**Allowed animations**: line highlighting (`{1|3-4|all}`) for step-through; magic-move for evolution; avoid v-click on code itself (redundant with Shiki's stepping).

---

## diagram-primary

**Semantic role**: A Mermaid diagram is the slide's primary visual, with title + one-line caption.

**Slidev frontmatter**:
```yaml
layout: default
class: diagram-primary
```

**When to use**:
- Architecture overviews (flowchart LR/TB)
- Sequence diagrams for API or interaction flows
- State machines, ER diagrams, class relationships
- Any programmatically-generated diagram where consistency matters

**Avoid when**:
- A real screenshot or photo exists — use `image-focus`
- The diagram has > 8 nodes or > 5 rows — split or simplify; force-shrinking loses legibility
- Combined with a table or code block on the same slide — dedicate a slide to the diagram

**Fields schema**:
- `title`: string, required, maxLength 60
- `diagram_type`: enum, required — one of: `flowchart LR`, `flowchart TB`, `sequenceDiagram`, `classDiagram`, `erDiagram`, `stateDiagram-v2`, `gantt`, `pie`
- `mermaid_code`: string, required — the Mermaid source between the fenced code block
- `scale`: float, optional, default 1.0 — `{scale: 0.7}` pattern; use 0.65-0.7 if the diagram is dense
- `caption`: string, optional, maxLength 80 — one-line interpretation

**Markdown template**:
```markdown
---
layout: default
class: diagram-primary
---

# {{title}}

\`\`\`mermaid {scale: {{scale}}}
{{mermaid_code}}
\`\`\`

<div class="caption">{{caption}}</div>
```

**Density tier default**: Normal. Compact with `scale: 0.65` for dense diagrams.

**Allowed animations**: none (Mermaid is static SVG; animating parts requires Slidev's draw feature which is out of scope).

---

## image-focus

**Semantic role**: A static image file (png/jpg/svg) is the slide's primary visual — full-slide anchor.

**Slidev frontmatter**:
```yaml
layout: image
class: image-focus
```

**When to use**:
- Screenshots (UI, terminal, dashboard, IDE)
- Photos (product shots, team photos, real-world scenes)
- Illustrations / diagrams created in external tools (Figma, Excalidraw export, etc.)
- Branding moments / emotional anchors

**Avoid when**:
- The image is really a Mermaid-expressible diagram — use `diagram-primary` for version control
- The image + description is really an "explain this image" pairing — use `image-text-split`
- Small inline image — use `two-columns` with `image` content pattern

**Fields schema**:
- `title`: string, optional, maxLength 60 — omit for pure visual-anchor slides
- `image_path`: string, required — relative to the deck's `public/` directory, e.g., `/screenshots/dashboard.png`
- `alt_text`: string, required, maxLength 120 — accessibility; must describe the image content
- `caption`: string, optional, maxLength 80 — one-line caption below the image

**Markdown template**:
```markdown
---
layout: image
image: {{image_path}}
class: image-focus
---

# {{title}}

<div class="caption">{{caption}}</div>
```

Note: Slidev's `image` layout uses `image:` as a frontmatter field (not a field in the body). The image fills the slide as background.

**Density tier default**: Normal

**Allowed animations**: v-click optional on the title/caption reveal; none on the image itself.

---

## image-text-split

**Semantic role**: Image on one side (~55%) + explanatory text on the other (~45%). Unlike `image-focus`, the image is shown AND explained. Unlike `two-columns`, the pairing is specifically "visual-plus-explanation", not comparison.

**Slidev frontmatter**:
```yaml
layout: image-left    # or image-right, based on image_side field
class: image-text-split
```

**When to use**:
- Explaining a UI screenshot (technical: API console / CLI output)
- Walking through a diagram or chart (executive: quarter's headline chart with commentary)
- Concept + illustration in educational material (labeled schematic + explanation)

**Avoid when**:
- Image doesn't need explaining — use `image-focus` (full-width)
- The text is a comparison against another image — use `two-columns` with `image × image` or `image × bullets`
- The text is a full narrative paragraph that happens to have an accompanying figure — use `content-narrative` with inline image or `image-focus` on a separate slide

**Fields schema**:
- `title`: string, required, maxLength 60
- `image_path`: string, required — relative to deck's `public/`
- `image_side`: enum, optional, default `left` — either `left` or `right`; maps to Slidev layout `image-left` vs `image-right`
- `alt_text`: string, required, maxLength 120
- `body`: markdown string, required, maxLength 300 — supports inline formatting and short bullets (`- item`), but no fenced code blocks
- `caption`: string, optional, maxLength 60 — short annotation under the image

**Markdown template** (image on left):
```markdown
---
layout: image-left
image: {{image_path}}
class: image-text-split
---

# {{title}}

<div class="body">

{{body}}

</div>

<div class="caption">{{caption}}</div>
```

**Markdown template** (image on right — use `layout: image-right`):
```markdown
---
layout: image-right
image: {{image_path}}
class: image-text-split
---

# {{title}}

<div class="body">

{{body}}

</div>
```

**Density tier default**: Normal

**Allowed animations**: v-click on body bullets (optional, teaching mode); none on the image.

---
