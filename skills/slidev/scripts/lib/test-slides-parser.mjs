#!/usr/bin/env node
// test-slides-parser.mjs — inline test for slides-parser.js

import { parseSlides } from './slides-parser.js';

const FIXTURE = `---
title: Demo
colorSchema: light
---

# Cover

---
layout: image-focus
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
---

# Compare

::left::
pattern: image
image_path: public/generated/auto.png
image_prompt: Charts comparing Q1 revenue trends

::right::
pattern: text
content: Analysis
`;

const slides = parseSlides(FIXTURE);

const assert = (cond, msg) => {
  if (!cond) { console.error('FAIL:', msg); process.exit(1); }
  console.log('PASS:', msg);
};

assert(slides.length === 4, `expected 4 slides, got ${slides.length}`);
assert(slides[0].layout === undefined || slides[0].layout === null, 'slide 1 (cover) has no explicit layout');
assert(slides[0].isImageSlide === false, 'slide 1 is not image slide');
assert(slides[1].layout === 'image-focus', 'slide 2 layout image-focus');
assert(slides[1].isImageSlide === true, 'slide 2 is image slide');
assert(slides[1].frontmatter.image_prompt.includes('Mountain'), 'slide 2 prompt captured');
assert(slides[1].imageSize.width === 1600 && slides[1].imageSize.height === 900, 'slide 2 size 1600x900');
assert(slides[2].layout === 'image-left', 'slide 3 layout image-left');
assert(slides[2].isImageSlide === true, 'slide 3 is image slide');
assert(slides[2].imageSize.width === 1600, 'slide 3 size 1600x900');
assert(slides[3].layout === 'two-cols-header', 'slide 4 layout two-cols-header');
assert(slides[3].isImageSlide === true, 'slide 4 is image slide (left.pattern=image)');
assert(slides[3].columnsType === 'image', 'slide 4 columnsType image');
assert(slides[3].imageSize.width === 800 && slides[3].imageSize.height === 900, 'slide 4 size 800x900');

console.log('\nAll assertions passed.');
