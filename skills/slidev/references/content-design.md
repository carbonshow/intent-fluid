# Presentation Content Design Guide

> Universal principles for structuring effective slide decks. Domain-agnostic —
> works for technical talks, business pitches, educational lectures, or any topic.
> Read this when designing slide content in Step 2 of the workflow.

## Narrative Arc

Every presentation tells a story. Choose the arc that fits your purpose:

| Arc | Structure | Best for |
|-----|-----------|----------|
| Problem → Solution | Hook → Problem → Evidence → Solution → CTA | Pitches, proposals |
| Tutorial | Concept → Steps → Demo → Recap | Workshops, how-tos |
| Journey | Before → Turning point → After → Lessons | Case studies, retrospectives |
| Briefing | Context → Findings → Analysis → Recommendations | Reports, status updates |

If unsure, default to **Problem → Solution** — it works for most contexts.

## One Idea Per Slide

The single most impactful rule: each slide should communicate **one idea**. If you
need two sentences to describe what a slide is about, split it into two slides.

Signs a slide is overloaded:
- More than 5 bullet points
- More than 100 words of body text
- Two distinct topics sharing one heading
- Audience needs to read before they can listen

## Headline Discipline

Slide headings should be assertions, not labels:

| Weak (label) | Strong (assertion) |
|--------------|-------------------|
| "Q3 Results" | "Q3 Revenue Up 23%" |
| "Architecture" | "Three Services Replace the Monolith" |
| "Next Steps" | "Ship v2 by March" |

An audience member skimming only headings should grasp the full story.

## Text Density Guidelines

| Slide type | Target word count | Notes |
|-----------|------------------|-------|
| Title/cover | 10-20 | Title + subtitle + name |
| Key point | 30-60 | Heading + 3-5 bullets or short paragraph |
| Evidence/data | 20-40 | Let the chart/code speak; text supports |
| Quote | 15-30 | Quote + attribution only |
| Closing | 10-20 | Takeaway + call to action |

General rule: **40-80 words per content slide**. If a slide exceeds 120 words,
it probably needs splitting.

## When to Use Animations (v-click)

Animations control the audience's attention. Use them deliberately:

**Use v-click when:**
- Revealing a step-by-step process (each step builds on the previous)
- Showing a before/after comparison
- Delivering a punchline after setup
- Walking through code line by line

**Skip v-click when:**
- The slide has a simple list the audience can absorb at a glance
- The content is reference material (people will screenshot it)
- You are short on time — clicks slow delivery

**Guideline**: Aim for 30-50% of content slides to use animations. Below 20%
feels static; above 70% feels like every click is a speed bump.

## When to Use Code Examples

Code slides are powerful in technical talks but risky in general ones:

- **Show code** when the audience writes code and the syntax matters
- **Show pseudocode** when the logic matters but the language does not
- **Show a diagram** when the relationships matter more than the implementation
- **Show a bullet list** when the concept is simple enough to state in words

For code, use **line highlighting** (`{1|3-4|all}`) to guide focus. Never show
a full code block and expect the audience to find the important part themselves.

**Magic Move** is ideal for showing code evolution — refactoring, adding types,
progressive enhancement. Use it instead of side-by-side comparisons.

## Visual Hierarchy

Guide the eye with size and weight:

1. **Heading** — largest, bold, colored (set by theme)
2. **Key phrase** — use `<v-mark>` to highlight within body text
3. **Body text** — normal weight
4. **Supporting detail** — smaller or muted color

Use **two-column layouts** (`grid grid-cols-2`) when comparing two things or
pairing text with a visual. Avoid more than two columns — slides are not
spreadsheets.

## Whitespace

Resist the urge to fill every pixel. Whitespace:
- Signals importance (fewer items = each matters more)
- Reduces cognitive load
- Looks professional

If a slide feels cramped, remove content rather than shrinking font size.

## Adapting to Audience

| Audience | Adjust |
|----------|--------|
| Technical peers | More code, deeper detail, fewer explanations of basics |
| Mixed technical | Pseudocode over real code, explain jargon, more diagrams |
| Executives | Fewer slides, bigger numbers, clear recommendations, no code |
| Students | More examples, more animations, recap slides between sections |

When in doubt, ask: "What does the audience need to **do** after this talk?"
Shape every slide toward that action.
