---
title: SP2 Fixture
colorSchema: light
---

# SP2 Fixture Deck

A 4-slide fixture exercising the three image-consuming layouts.

---
layout: default
class: image-focus
title: Team Vision
image_prompt: Team of climbers ascending a mountain toward sunrise, hopeful editorial illustration, no text no logos
---

<div class="image-wrapper">
  <img src="public/generated/auto.png" alt="Climbers toward sunrise" />
</div>

# Team Vision

---
layout: image-left
class: image-text-split
title: Data Flow
image_prompt: Abstract editorial diagram of data flowing through pipelines, curved arrows, no text
---

# Data Flow

<div class="body">

The pipeline transforms raw events into ranked insights through four stages.

</div>

---
layout: two-cols-header
class: two-columns
title: User Override Demo
left:
  pattern: image
  image_path: public/hero.jpg
  image_prompt: User supplied photo placeholder text here should still be long enough
  alt_text: User-provided hero image
  caption: user
right:
  pattern: text
  content: The left column uses a user-supplied image at public/hero.jpg; generate-images.js must leave it alone.
---

# User Override Demo

::left::

<img src="public/hero.jpg" alt="User-provided hero image" />

::right::

The left column uses a user-supplied image at public/hero.jpg.
