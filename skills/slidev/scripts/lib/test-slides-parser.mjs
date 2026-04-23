#!/usr/bin/env node
// test-slides-parser.mjs — inline test for slides-parser.js

import { parseSlides, IMAGE_LAYOUT_NAMES } from './slides-parser.js';

const FIXTURE = `---
title: Demo
colorSchema: light
---

# Cover

---
layout: default
class: image-focus
title: Vision
image_prompt: Mountain climbing illustration, optimistic
---

content

---
layout: image-left
image: /hero.png
class: image-text-split
image_prompt: Editorial diagram of data flow pipelines
---

# Explained

body

---
layout: two-cols-header
class: two-columns
left:
  pattern: image
  image_path: public/generated/auto.png
  image_prompt: Charts comparing Q1 revenue trends
right:
  pattern: text
  content: Analysis
---

# Compare
`;

const slides = parseSlides(FIXTURE);

const assert = (cond, msg) => {
  if (!cond) { console.error('FAIL:', msg); process.exit(1); }
  console.log('PASS:', msg);
};

assert(slides.length === 4, `expected 4 slides, got ${slides.length}`);
assert(slides[0].layout === undefined, 'slide 1 (cover) layout is undefined (not null)');
assert(slides[0].isImageSlide === false, 'slide 1 is not image slide');
assert(slides[1].layout === 'default', 'slide 2 layout default');
assert(slides[1].frontmatter.class === 'image-focus', 'slide 2 class image-focus');
assert(slides[1].isImageSlide === true, 'slide 2 is image slide (layout=default + class=image-focus)');
assert(slides[1].frontmatter.image_prompt.includes('Mountain'), 'slide 2 prompt captured');
assert(slides[1].imageSize.width === 1600 && slides[1].imageSize.height === 900, 'slide 2 size 1600x900');
assert(slides[2].layout === 'image-left', 'slide 3 layout image-left');
assert(slides[2].isImageSlide === true, 'slide 3 is image slide');
assert(slides[2].imageSize.width === 1600, 'slide 3 size 1600x900');
assert(slides[2].imageFields.image_path === '/hero.png', 'slide 3 image_path aliased from image: key');
assert(slides[3].layout === 'two-cols-header', 'slide 4 layout two-cols-header');
assert(slides[3].isImageSlide === true, 'slide 4 is image slide (left.pattern=image in frontmatter)');
assert(slides[3].columnsType === 'image', 'slide 4 columnsType image');
assert(slides[3].imageSize.width === 800 && slides[3].imageSize.height === 900, 'slide 4 size 800x900');
assert(slides[3].imageFields.column === 'left', 'slide 4 column is left');

// ---- Edge case tests (bug fixes from spec review) ----

// IMAGE_LAYOUT_NAMES export: the set now represents only the direct Slidev
// layout names that imply an image slide (image-left / image-right).
// image-focus uses layout: default + class: image-focus (class-based detection).
assert(IMAGE_LAYOUT_NAMES instanceof Set, 'IMAGE_LAYOUT_NAMES is exported and is a Set');
assert(IMAGE_LAYOUT_NAMES.size === 2, 'IMAGE_LAYOUT_NAMES has 2 members (image-left, image-right)');
assert(IMAGE_LAYOUT_NAMES.has('image-left') && IMAGE_LAYOUT_NAMES.has('image-right'),
       'IMAGE_LAYOUT_NAMES contains image-left and image-right');

// Bug 2: body starting with key:value must not be misread as FM
const BODY_KV_FIXTURE = `---
title: Deck
---

# Cover

---

a: b

more content

---

# Third Slide
`;
const bodyKvSlides = parseSlides(BODY_KV_FIXTURE);
assert(bodyKvSlides.length === 3, `body-starts-with-kv: expected 3 slides, got ${bodyKvSlides.length}`);
assert(Object.keys(bodyKvSlides[1].frontmatter).length === 0, 'slide 2 has no frontmatter (was misread as {a:b})');
assert(bodyKvSlides[2].frontmatter !== undefined, 'slide 3 exists');

// Bug 3: empty input
const empty = parseSlides('');
assert(empty.length === 0, `empty input should return [], got ${empty.length} slides`);

// Regression: only deck FM (no slides) → 0 slides
const onlyDeckFm = parseSlides(`---
title: Deck
---
`);
assert(onlyDeckFm.length === 0, `only-deck-fm: expected 0 slides, got ${onlyDeckFm.length}`);

// Regression: only one slide (no separators at all after deck FM) → 1 slide
const oneSlide = parseSlides(`---
title: Deck
---

# Cover

body text
`);
assert(oneSlide.length === 1, `one-slide: expected 1, got ${oneSlide.length}`);

// Bug 4 coverage: two-cols-header with no image column → isImageSlide false
const TEXT_COLS_FIXTURE = `---
title: Deck
---

---
layout: two-cols-header
class: two-columns
left:
  pattern: text
  content: A
right:
  pattern: text
  content: B
---

# Comparison
`;
const textCols = parseSlides(TEXT_COLS_FIXTURE);
assert(textCols.length === 1, `two-cols no-image: expected 1 slide, got ${textCols.length}`);
assert(textCols[0].isImageSlide === false, 'two-cols with no image column: isImageSlide=false');
assert(textCols[0].columnsType === null, 'two-cols with no image column: columnsType=null');

console.log('\nAll assertions passed.');
