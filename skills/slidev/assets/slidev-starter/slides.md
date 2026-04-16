---
title: My Presentation
tags:
  - presentation/demo
  - year/2026
date: 2026-04-16
theme: default
colorSchema: light
class: text-center
highlighter: shiki
---

# My Presentation

Subtitle or occasion

<div class="pt-4 text-gray-400">
Your Name · Date
</div>

---
layout: default
---

# Content Page

This is the main content area, supporting standard Markdown:

- First key point
- Second key point
- Third key point

> Quote or emphasis

---
layout: default
---

# Step-by-Step Reveal (v-click)

Click mouse/spacebar to reveal content progressively:

<v-click>

**Step 1**: First content appears

</v-click>

<v-click>

**Step 2**: Then this content appears

</v-click>

<v-click>

**Step 3**: Finally this content appears

</v-click>

---
layout: default
---

# Text Highlighting (v-mark)

`v-mark` adds underlines, circles, or highlights on click - great for emphasizing points during presentations:

This is regular text where <v-mark type="underline" color="orange">this part is underlined</v-mark> on click.

<v-click>

Click again to see <v-mark type="circle" color="red">circle highlight</v-mark> effect.

</v-click>

<v-click>

You can also use <v-mark type="highlight" color="yellow">bright highlights</v-mark> like a marker.

</v-click>

<!-- v-mark type options: underline / circle / highlight / strike-through / box -->

---
layout: default
---

# Code with Line Highlighting (Shiki)

Shiki syntax highlighting with progressive line reveal; click to step through highlighted lines:

```typescript {1|3-4|all}
// First click highlights line 1, second click lines 3-4, third click all
function greet(name: string): string {
  const message = `Hello, ${name}!`
  return message
}
```

---
layout: default
---

# Code Animation (Shiki Magic Move)

Magic Move smoothly animates transitions between code snippets - perfect for showing evolution or refactoring.
Use ````magic-move```` to wrap multiple code blocks:

````md
```magic-move
```typescript
// Step 1: Initial version
function add(a, b) {
  return a + b
}
```

```typescript
// Step 2: Add type annotations
function add(a: number, b: number): number {
  return a + b
}
```

```typescript
// Step 3: Add validation
function add(a: number, b: number): number {
  if (typeof a !== 'number' || typeof b !== 'number') throw new Error('invalid')
  return a + b
}
```
```
````

<!-- Each click transitions smoothly to next code snippet -->

---
layout: default
---

# Two-Column Layout

<div class="grid grid-cols-2 gap-8">

<div>

**Left: Text & bullets**

- Point A
- Point B
- Point C

</div>

<div>

**Right: Code or diagram**

```python
def hello():
    print("right column")
```

</div>

</div>

---
layout: default
---

# Interactive Vue Component

Slidev runs on Vite + Vue 3 - write interactive components directly in slides:

<script setup>
import { ref } from 'vue'
const count = ref(0)
</script>

<div class="flex items-center gap-4 mt-8">
  <button
    class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
    @click="count++"
  >
    Click +1
  </button>
  <span class="text-2xl font-bold">{{ count }}</span>
</div>

<!-- Great for live demos, real-time data, or interactive examples -->

---
layout: center
class: text-center
---

# Thank You

Questions & Discussion
