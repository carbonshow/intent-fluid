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
