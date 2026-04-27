# Slidev Skill — Known Issues

> Discovered during real-world usage (GM report deck, 50 slides, CJK-heavy, text-heavy verbosity, converting from existing Obsidian document with images).

---

## Issue 1: char_count includes markdown formatting in length

**Status**: Fixed
**Severity**: Medium
**File**: `scripts/validate-slides.sh` lines 284-291

**Problem**: The `char_count()` function strips HTML tags via `re.sub(r"<[^>]+>", "")` but does **not** strip markdown formatting (`**bold**`, `*italic*`, `` `code` ``). A 40-character Chinese sentence wrapped in `**...**` counts as 44 characters. In CJK-heavy text-heavy decks, this produces false WARN results that cannot be resolved by shortening content.

**Expected**: `char_count` should measure *visible text length*, stripping both HTML tags and markdown inline formatting.

**Fix applied**: Added `strip_md()` helper that removes `**`, `*`, and backtick wrappers before counting. `char_count()` now calls `strip_md()` first. SP1 static test suite passes (10/10).

---

## Issue 2: No "document-to-slides" conversion workflow

**Status**: Fixed
**Severity**: High
**File**: `SKILL.md` Step 1

**Problem**: The workflow assumes creating presentations from scratch. The most common real-world scenario is converting an existing structured document (Obsidian note, Google Doc, markdown file) into slides. Missing:
- Asset inventory step (which images/videos exist, where are they stored)
- Media migration instructions (copy to `public/`, path conversion)
- Obsidian wikilink (`![[...]]`) to slidev path (`/filename.png`) conversion rules
- Guidance on handling missing/unreachable assets (placeholders, comments)

**Fix applied**: Added "Converting an Existing Document" subsection to Step 1 in SKILL.md, covering: asset inventory, media migration to `public/`, path conversion rules (wikilink → `<img>`), content mapping (H2 → section-divider + slides).

---

## Issue 3: Image handling ignores existing user assets

**Status**: Fixed
**Severity**: High
**File**: `SKILL.md` SP2 section, `references/layout-catalog.md`

**Problem**: SP2 documentation focuses entirely on AI-generated images via Gemini. No guidance exists for the basic case of using existing screenshots, concept art, data charts, or exported diagrams. Specific gaps:
- `image_path` override is mentioned once in layout-catalog but under-documented
- No recommended CSS patterns for sizing existing images within slides
- `image-focus` layout defaults to full-slide coverage, which is wrong for data tables/charts
- No guidance on when to use `image-focus` vs inline `<img>` with sizing classes

**Fix applied**: Added "Using Existing Images (without SP2)" section to SKILL.md after SP2, covering: setup (copy to `public/`), frontmatter for existing images (`image_path` + `image_prompt`), inline `<img>` sizing approach, image sizing tiers table (Small/Medium/Large/Full), and decision guide for which approach to use.

---

## Issue 4: two-columns frontmatter requirement not visible

**Status**: Fixed
**Severity**: Medium
**File**: `SKILL.md` Critical Gotchas, `references/layout-catalog.md`

**Problem**: The `two-columns` layout requires `left:` and `right:` objects with `pattern:` fields in the slide frontmatter for validation to pass. This requirement is buried in layout-catalog.md prose and a single sentence in SKILL.md Step 3 (line ~291). First-time users will write two-columns slides without the frontmatter objects, get FAIL from validate-slides.sh, and have no clear error message pointing to the fix.

**Fix applied**:
- Added Critical Gotcha #6 in SKILL.md with complete YAML frontmatter example showing `left:` and `right:` objects with `pattern:` fields
- Added CRITICAL callout + complete frontmatter YAML example (bullets × table) in layout-catalog.md's two-columns section, before the existing markdown template

---

## Issue 5: No medium-size image layout or guidance

**Status**: Fixed
**Severity**: Medium
**File**: `references/content-design.md`

**Problem**: Only two image size extremes exist:
- `image-focus`: full-slide image (too large for data charts, cost tables, concept sketches)
- `two-columns` image pattern: `max-h-64` (256px, too small for detailed images)

No layout or guidance for the most common case: a **medium-sized image** (~288-384px) with a title above and optional caption below. Users must guess CSS classes.

**Fix applied**: Added "Image Sizing Guide" section to content-design.md with: 4-tier sizing table (Small `max-h-48` / Medium `max-h-72` / Large `max-h-96` / Full `image-focus`), HTML code examples, and a decision tree for choosing the right tier.

---

## Issue 6: Verbosity has no scenario mapping

**Status**: Fixed
**Severity**: Low
**File**: `references/content-strategy.md` §6

**Problem**: The three verbosity levels (concise / standard / text-heavy) are defined with fill-ratio targets but no guidance on when to pick each. Users default to `standard` even when their content (e.g., GM report with detailed reasoning, lecture handout) clearly needs `text-heavy`. No mapping to audience types, purposes, or common presentation scenarios.

**Fix applied**: Added "Choosing verbosity" table to content-strategy.md §6 with 8 common scenarios mapped to recommended verbosity + rationale, plus a rule of thumb ("if the audience will read slides later without the speaker → text-heavy").
