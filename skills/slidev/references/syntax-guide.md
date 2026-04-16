# Slidev Syntax Quick Reference

## Common Slide Directives

```yaml
---
layout: cover
class: text-center
---
# Title Slide
```

## Content Elements

### v-click (Incremental Display)

```html
<v-click>First item appears on click</v-click>
<v-click>Second item appears on next click</v-click>
```

### v-mark (Text Highlighting)

```html
<v-mark type="underline" color="orange">underlined</v-mark>
<v-mark type="circle" color="red">circled</v-mark>
<v-mark type="highlight" color="yellow">highlighted</v-mark>
<v-mark type="box">boxed</v-mark>
```

### Code Block with Line Highlighting

```typescript {1|3-4|all}
// Step 1: Line 1 highlighted
function greet(name: string) {
  // Step 2: Lines 3-4 highlighted
  return `Hello, ${name}!`
}
// Step 3: All lines highlighted
```

### Magic Move (Code Animation)

````markdown
```magic-move
```typescript
// Step 1
function add(a, b) {
  return a + b
}
```

```typescript
// Step 2 - with types
function add(a: number, b: number): number {
  return a + b
}
```

```typescript
// Step 3 - with validation
function add(a: number, b: number): number {
  if (typeof a !== 'number') throw new Error('a must be number')
  return a + b
}
```
````

### Vue Components

```vue
<script setup>
import { ref } from 'vue'
const count = ref(0)
</script>

<button @click="count++">Click me</button>
<span>Count: {{ count }}</span>
```

### Two-Column Layout

```html
<div class="grid grid-cols-2 gap-4">
  <div>Left column</div>
  <div>Right column</div>
</div>
```

## Presenter Notes

```html
<!-- This is a presenter note, not visible to audience -->
Remember to mention the three key points here.
```

## Lists and Formatting

```markdown
# Heading 1
## Heading 2
### Heading 3

- Bullet point
  - Nested bullet
- Another point

> Block quote

**Bold text**
*Italic text*
`code`
```

## Important: Avoid These

| ❌ Don't | ✅ Do |
|---------|------|
| Use `---` in HTML blocks | Use `<hr />` instead |
| Use `---` in frontmatter | Ensure frontmatter has only one `---` at end |
| Use `[[wikilinks]]` | Use markdown links `[text](url)` |
| Multiple frontmatter sections | Keep metadata before first slide |

