# Theme Library

> Claude reads this during Step 2c (Theme inference) of the workflow.
> Each theme below is also a CSS file in `assets/themes/<name>.css`.
> Pick exactly one theme per deck based on audience + purpose + tone + style_keywords.

## How to choose

1. Identify the primary scenario:
   - **Technical talk** — teaching or pitching a technical topic to technical peers
   - **Leadership reporting** — updating executives / VP / board on product, metrics, decisions
   - **Educational material** — teaching students, course material, workshop
2. Within the scenario, read the two themes' "Use when" / "Avoid when" lists.
3. Choose the closest match. If both fit equally, prefer the one matching more `style_keywords`.
4. If nothing matches across all 6, default to `tech-dark` and note "default fallback, please override" in the brief.

---

## tech-dark

**One-line pitch**: Dark, signal-forward, code-first.

**Palette** (hex values in `assets/themes/tech-dark.css`):
- Background: deep near-black blue
- Primary (headings): ice blue
- Accent (sub-headings, highlights): violet
- Body text: near-white
- Muted: cool grey
- Code background: slightly lighter than the slide background

**Fonts**: Inter (heading + body), JetBrains Mono (code)

**Use when**:
- Technical peers in the room
- Topic leans toward architecture, internals, or deep code
- Dark room / live demo setting
- Style keywords match "科技感" / "dark" / "signal-forward" / "modern-tooling"

**Avoid when**:
- Audience is non-technical or executive
- Printing / greyscale export is the primary consumption
- Content is primarily tables with many numeric columns (contrast fatigue in dark mode)

---

## code-focus-light

**One-line pitch**: Light grey, code-friendly, low eye fatigue for long technical reads.

**Palette** (hex values in `assets/themes/code-focus-light.css`):
- Background: near-white / light grey
- Primary (headings): ink black
- Accent: sky blue
- Body text: dark grey
- Muted: muted grey
- Code background: light grey

**Fonts**: Inter (heading + body), JetBrains Mono (code)

**Use when**:
- Technical peers, but printing or projecting in a bright room
- Long code listings that need maximum readability
- Topic is teaching APIs, refactoring patterns, language features
- Style keywords match "light" / "editorial" / "readable" / "document-grade"

**Avoid when**:
- Low-light room / theatre setting (too bright on a big screen)
- Non-technical audience expecting a more branded look
- The content leans narrative / storytelling rather than code

---

## corporate-navy

**One-line pitch**: Enterprise tone, data-oriented, steady.

**Palette** (hex values in `assets/themes/corporate-navy.css`):
- Background: white
- Primary (headings): deep navy
- Accent: amber (used for key data highlights)
- Body text: near-black
- Muted: grey
- Code background: light grey

**Fonts**: Inter (heading + body), JetBrains Mono (code)

**Use when**:
- Reporting to leadership / VP / board / cross-functional stakeholders
- Content includes KPIs, roadmap, quarterly review, strategy updates
- Style keywords match "professional" / "enterprise" / "data-forward" / "稳重"

**Avoid when**:
- Audience is technical peers wanting dense code
- Content is primarily educational / narrative
- A more minimal / modern look is desired (use minimal-exec instead)

---

## minimal-exec

**One-line pitch**: Black-and-white minimalism, generous whitespace, executive-grade.

**Palette** (hex values in `assets/themes/minimal-exec.css`):
- Background: white
- Primary (headings): pure black
- Accent: restrained red (only for the single most important emphasis)
- Body text: near-black
- Muted: light grey
- Code background: near-white

**Fonts**: Inter bold headings, Inter body, JetBrains Mono code

**Use when**:
- Strategy proposals, board-level decks, C-suite or external-investor material
- Fewer slides, fewer words per slide, maximum impact per element
- Style keywords match "minimal" / "strategic" / "高管" / "board-level"

**Avoid when**:
- Many data tables or dense KPIs (use corporate-navy instead — it handles density better)
- Long lecture-format content (whitespace trades off against teaching thoroughness)
- Dark-room presenting (white screen can glare in a low-light venue)

---

## edu-warm

**One-line pitch**: Warm cream background, serif heading, long-read friendly.

**Palette** (hex values in `assets/themes/edu-warm.css`):
- Background: cream / warm off-white
- Primary (headings): warm brown
- Accent: pumpkin orange
- Body text: warm near-black
- Muted: warm grey
- Code background: pale amber

**Fonts**: Merriweather (serif, heading), Inter (body), JetBrains Mono (code)

**Use when**:
- Teaching material that students will re-read independently
- Humanities / writing / concept-heavy lessons
- Long lecture formats (30+ minutes)
- Style keywords match "warm" / "讲述" / "humanities" / "深度阅读"

**Avoid when**:
- Break-ice / workshop / short-duration kids' content (use playful-bright)
- Corporate or formal reporting contexts
- Audience is strictly technical peers (tone will feel mismatched)

---

## playful-bright

**One-line pitch**: Bright palette, rounded typography, workshop and break-ice vibe.

**Palette** (hex values in `assets/themes/playful-bright.css`):
- Background: white
- Primary: violet
- Accent: gold
- Body text: dark grey
- Muted: grey
- Code background: pale violet

**Fonts**: Nunito (heading + body), Fira Code (code)

**Use when**:
- Workshops, summer camps, coding bootcamps, creative classroom settings
- Younger audience or break-ice moments in internal training
- Style keywords match "playful" / "轻快" / "creative" / "workshop"

**Avoid when**:
- Formal reporting / board-level material
- Long-form lecture where tonal consistency matters
- Dense technical deep-dives (tone will undercut gravity)

---

## Failure modes

- **No style_keywords supplied** → infer from audience + purpose + tone alone. Note in brief.
- **No theme matches every signal** → pick the nearest on audience-scenario axis. If still ambiguous, default `tech-dark`. Note "default fallback, please override if needed".
- **User overrides the brief's theme** → accept, do not re-infer.
- **User asks for a theme not in the 6** → explain the 6 options, note that SP4 (future) may introduce more.

---

## Token System (v2)

All 6 themes inherit from `assets/themes/_skeleton.css` via `@import` and override
the per-theme tokens. The skeleton provides geometric layout classes (skeleton-hero,
skeleton-list, skeleton-data, skeleton-code-diagram) + dedicated CSS for media
layouts (image-focus, image-text-split, two-columns) — themes only differ in
colors, fonts, and tiny aesthetic touches.

### Color tokens (themes override)
- `--color-primary` — headings, brand accent
- `--color-accent` — subheadings, markers, links
- `--color-text` — body text
- `--color-bg` — slide background
- `--color-muted` — captions, metadata
- `--color-code-bg` — code block background
- `--color-border` — table dividers, card borders
- `--color-on-primary` — text laid on top of primary-color surfaces (e.g. image-focus title)
- `--color-overlay` — image-focus gradient dimming

### Typography tokens (inherited from skeleton; override only if theme needs different scale)
- `--text-caption` (0.844rem) / `--text-body` (1.125rem) / `--text-subtitle` (1.5rem)
- `--text-h3` (2rem) / `--text-h2` (2.667rem) / `--text-h1` (3.555rem) / `--text-hero` (4.741rem)
- Perfect Fourth 1.333×, body=18px baseline

### Spacing tokens (inherited; 0.5rem base)
- `--space-1` (8px) / `--space-2` (16px) / `--space-3` (24px)
- `--space-4` (32px) / `--space-5` (48px) / `--space-6` (64px)

### Adding a new theme

1. Create `assets/themes/<name>.css`
2. First non-comment line: `@import url('./_skeleton.css');`
3. Override `:root` with color + font tokens (9 color vars + 3 font stacks)
4. Copy the "Theme Aesthetics" block from `tech-dark.css` (layout classes that consume tokens)
5. Add `<name>` to `AVAILABLE_THEMES` in `scripts/new-presentation.sh`
6. Add a section here documenting the theme's intent signals
7. Run `bash scripts/test-sp1-static.sh` then `bash scripts/audit-visual.sh` to verify
