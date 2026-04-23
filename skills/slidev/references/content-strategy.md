# Content Strategy Guide

> Analyze source material and produce a design brief before writing slides.
> Read this during Step 2 (Content Strategy) of the workflow.

## Why Strategy Before Content

Jumping straight from source material to slides produces decks that are
information dumps — faithful to the original text but ineffective as
presentations. A 5-minute strategy phase prevents hours of rework by answering
"what story are we telling?" before "what goes on slide 7?"

## The Analysis Framework

Before writing any slides, assess the source material across five dimensions.
If any dimension is unclear, ask the user.

### 1. Audience

Who will see this presentation? The audience determines everything: vocabulary,
depth, examples, and what counts as "too much detail."

| Audience type | Characteristics | Implication for slides |
|--------------|----------------|----------------------|
| Technical peers | Share your jargon, want depth | More code/diagrams, less context-setting |
| Mixed technical | Some know the domain, some don't | Explain jargon, use pseudocode over real code |
| Executives | Time-poor, decision-focused | Fewer slides, bigger numbers, clear asks |
| Students/learners | Building mental models | More examples, recap slides, progressive reveal |
| General/external | No assumed knowledge | Analogies, visuals, minimal text |

If unknown, default to **mixed technical** — it works for most internal talks.

### 2. Purpose

What should the audience *do* after this presentation?

| Purpose | Slide strategy |
|---------|---------------|
| **Inform** | Lead with key findings, support with evidence, end with summary |
| **Persuade** | Problem → pain → solution → proof → call to action |
| **Teach** | Concept → example → practice → recap; heavy use of v-click |
| **Report** | Context → data → analysis → recommendations; tables and charts |
| **Inspire** | Story arc, emotional beats, minimal text, strong images |

A deck with unclear purpose wanders. Pin it down in one sentence.

### 3. Emphasis & Key Messages

Extract the 3-5 things the audience must remember after the talk. Everything
else is supporting material — it exists to make these messages stick.

To find key messages from source material:
- Read the source headings — they often signal the author's priorities
- Look for repeated themes across sections
- Identify claims with supporting evidence (these make strong slides)
- Note anything surprising or counterintuitive (high impact)

Discard or compress:
- Background context the audience already knows
- Implementation details that don't serve the narrative
- Lists of items that can be grouped into categories
- Anything that only makes sense when read, not presented

### 4. Visual Strategy

Decide the mix of slide types before writing any content:

| Slide type | Best for | Slidev features |
|-----------|----------|-----------------|
| **Text + bullets** | Key points, arguments | v-click, v-mark |
| **Diagram** | Processes, architectures, relationships | Mermaid flowchart/sequence |
| **Code** | Technical demonstrations, evolution | Line highlighting, magic-move |
| **Image** | Context, emotion, evidence | `<img>` with Tailwind sizing |
| **Table** | Comparisons, data summaries | Markdown tables |
| **Two-column** | Side-by-side comparisons | `grid grid-cols-2` |
| **Center quote** | Key takeaways, transitions | `layout: center` |

Rules:
- No more than 3 consecutive text-only slides (insert a visual to break rhythm)
- Code and diagram slides need a text slide before or after for interpretation
- Opening (first 2 slides) and closing (last 2 slides) set the tone — invest
  more design effort there than in the middle

### 5. Pacing & Rhythm

A good deck alternates between tension and release, detail and overview:

```
[Hook] → [Context] → [Deep dive 1] → [Breather/summary] →
[Deep dive 2] → [Breather] → [Deep dive 3] → [Synthesis] → [Close]
```

**Breather slides** are short — a quote, a single image, a one-line summary.
They give the audience a mental pause between dense sections.

**Transition slides** (`layout: center`) signal a topic shift. Use them between
major sections, not between every slide.

Rough pacing guidelines:
- **5-minute talk**: 5-8 slides. Every slide carries weight. No filler.
- **10-minute talk**: 8-14 slides. One breather in the middle.
- **20-minute talk**: 14-22 slides. Two section breaks with breather slides.
- **30+ minute talk**: Consider splitting into chapters with recap slides.

### 6. Three Explicit Style Parameters (tone / verbosity / style_keywords)

After the 5-dimension analysis, capture three explicit parameters that drive
theme and layout choice downstream:

#### `tone` — 1 of 6
The emotional register of the deck:
- `casual` — conversational, first-person, lower stakes (internal team updates, retros)
- `professional` — balanced, default for most work contexts
- `academic` — thesis-style, citations, measured claims (research talks)
- `technical` — precise, terminology-heavy, deep-implementation (engineering reviews)
- `playful` — light, energetic, visual (workshops, icebreakers)
- `inspirational` — story-driven, emotional peaks (keynotes, manifestos)

If unclear, default to `professional`.

#### `verbosity` — 1 of 3
How densely each slide should be populated:
- `concise` — each slide carries minimal text, generous whitespace (executive readouts)
- `standard` — balanced default (most decks)
- `text-heavy` — slides that also serve as a handout or reference document (lectures, playbooks)

If unclear, default to `standard`.

**Coupling with `maxLength`**: verbosity controls how much of each field Claude
fills (target fill-ratio: concise 30-50%, standard 50-75%, text-heavy 75-100%).
`maxLength` itself is a hard ceiling and does NOT scale with verbosity —
see `layout-catalog.md` for the rules.

#### `style_keywords` — array of 2-5 tags
Free-form style signals the user supplies or Claude infers. Examples:
- `[科技感, 深色, 精准]` — suggests `tech-dark` theme
- `[企业感, 数据向, 稳重]` — suggests `corporate-navy`
- `[温暖, 讲故事, 长时间阅读]` — suggests `edu-warm`

If user does not supply keywords, Claude infers 2-3 from the source material
and audience/purpose. These drive the theme-inference step in `theme-library.md`.

If none can be reasonably inferred, pass an empty array `[]` and note the
fallback in the brief.

## The Design Brief

After analyzing the source material, produce a design brief with this structure
and show it to the user for confirmation before writing slides:

```
## Design Brief: [Presentation Title]

**Audience**: [who]
**Purpose**: [inform/persuade/teach/report/inspire] — [one-sentence goal]
**Language**: [language of the slides]
**Estimated slides**: [N] (~[M] minutes)

### Style Decisions
- **Theme**: `[theme-name from theme-library.md]`
  - Rationale: [one sentence explaining the match against audience/purpose/tone/keywords]
- **Tone**: `[enum from section 6]`
- **Verbosity**: `[concise | standard | text-heavy]`
- **Style keywords**: [list, or empty if not supplied]
- **Density tier default**: [Normal | Compact | Dense]

### Key Messages
1. [message 1]
2. [message 2]
3. [message 3]

### Outline

| # | Heading | Layout | Type | Content summary | Density | Features |
|---|---------|--------|------|-----------------|---------|----------|
| 1 | [Title] | cover | cover | Title + author | Normal | — |
| 2 | [Heading] | content-bullets | text | 3 bullets on X | Normal | v-click |
| 3 | [Heading] | diagram-primary | diagram | Flow: A → B → C | Normal | — |
| 4 | [Heading] | three-metrics | data | 3 KPIs | Normal | — |
| 5 | [Heading] | two-columns | mixed | bullets × table | Compact | — |
| ... | ... | ... | ... | ... | ... | ... |
| N | [Closing] | closing | closing | Q&A | Normal | — |

### Source Material Notes
- **Keep**: [sections/ideas worth featuring]
- **Compress**: [sections to summarize into 1-2 slides]
- **Cut**: [sections not relevant to this audience/purpose]
- **Add**: [things not in the source but needed for the narrative]
```

The outline table is the most important part. Each row becomes one slide.
The user can add, remove, reorder, or change slide types before you start
writing.

## After User Confirms

### Hard gate

The brief is a **hard gate**. Regardless of how simple the user's intent seems,
display the complete Design Brief (with Style Decisions + full outline) and
wait for an **explicit** user confirmation before proceeding to Step 3.

Acceptable confirmations: any clear affirmation — "OK", "continue", "go ahead",
"looks good", "可以", "开始", "好的", etc. Silence does NOT count.

If the user proposes modifications, update the brief and re-display. Only once
the user affirms do you proceed.

### Writing slides

Once confirmed:
1. Run `new-presentation.sh --theme <chosen-theme>` to initialize the deck
2. Write `slides.md` following the outline row by row
3. Each row maps to exactly one slide — with the `layout:` value from the outline
4. Use the Slidev features noted in the outline
5. For each field, check the `maxLength` in `layout-catalog.md` before writing.
   Rewrite shorter if needed; don't rely on `validate-slides.sh` to catch overflow
6. Refer to `references/content-design.md` for space budget and formatting rules

If the user changes the outline significantly, update the key messages and
Style Decisions to match before writing — messages, theme, layouts, and
outline should always be consistent.
