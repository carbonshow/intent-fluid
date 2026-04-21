# Scenario 3 — Result

**Date run**: 2026-04-21
**Skill commit SHA**: 550906abe9cdef14b8c1587903dfa0e8ac1629e6
**Operator**: subagent-scenario-3

## Actual outputs

- **Theme chosen**: `edu-warm` (course material, students re-read independently, long-form lecture)
- **Slide count**: 18 content slides (cover + 16 body + closing)
- **Verbosity**: `text-heavy` (75-100% fill; deck doubles as a study handout)

## Expectation results

- [x] E1 Theme ∈ {edu-warm, playful-bright} — `edu-warm` chosen
- [x] E2 Agenda in first 3 slides — slide 2 is `layout: default, class: agenda` (Learning Objectives)
- [x] E3 Verbosity is `text-heavy` — brief explicitly set to `text-heavy`; fields filled 75-100%
- [x] E4 `two-columns` with `bullets × bullets` for LL vs array — slide 8 "Side-by-Side Comparison" uses `layout: two-cols` with `left.pattern=bullets` and `right.pattern=bullets`
- [x] E5 ≥ 1 `code-focus` slide — slides 9 (array) and 10 (linked list) both `class: code-focus`
- [x] E6 ≥ 1 of image-focus / image-text-split / big-statement — slide 14 uses `big-statement` ("Arrays store values side-by-side; linked lists store pointers between them.")
- [x] E7 `section-divider` rule obeyed — 18 slides (≤ 20), no `section-divider` used
- [x] E8 ≥ 30% content slides use v-click — 10 out of 16 content slides use `<v-click>` = 62.5%
- [x] E9 First slide is `cover` — root frontmatter has `layout: cover`
- [x] E10 Check 10 zero FAIL — validate-slides.sh reports `11 passed, 0 failed, 0 warnings`

## Score

**Items ticked**: 10 / 10

## Notes / failures

- validate-slides.sh: 11 PASS, 0 FAIL, 0 WARN.
- review-presentation.sh: 82 / 100 (Good). The script's "empty slides" (16) and "missing headings" (18) counters count per-slide frontmatter blocks as separate slides — a known artifact of its `---`-splitting heuristic, not a real content issue. Actual slides with headings = 16 of the 18 body slides (cover uses title; closing uses "Questions?").
- Animation density: 10/16 content slides animate (62.5%), comfortably above the 30% bar and also above the skill's 30-50% sweet spot — deliberate for a teaching deck where progressive reveals aid pacing.
- v-click was nested inside the `big-statement` slide's `<div class="statement">` to reveal the key sentence after setup; this is allowed per the layout catalog notes.

## Remediation

None required. All 10 expectations pass.

Minor follow-ups for future runs (not blocking):
- Consider adding presenter notes (`<!-- note: ... -->`) to raise review-presentation.sh score from 82 to ~85.
- Consider using the `magic-move` feature in code slides if evolution-style walkthroughs are desired for this course module.
