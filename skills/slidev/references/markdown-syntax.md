# Slidev Markdown Syntax

## Slide Separator

Separate slides with three dashes on their own line:

```markdown
# Slide One Content

---

# Slide Two Content
```

**Important**: Never use `---` inside slide content (divs, v-click, etc). Use `<hr />` instead.

---

## Slide Layouts

Specify layout at top of slide:

```markdown
---
layout: default
---

# Content using default layout
```

Common layouts:
- `default` - Standard content slide
- `title-slide` - Title/cover slide  
- `center` - Center-aligned content
- `two-cols` - Two-column layout

---

## Text Formatting

```markdown
# Heading 1
## Heading 2
### Heading 3

**bold** or __bold__
*italic* or _italic_
~~strikethrough~~

`inline code`

[link text](https://example.com)
```

---

## Lists

### Unordered

```markdown
- Item 1
- Item 2
  - Nested item
  - Another nested
- Item 3
```

### Ordered

```markdown
1. First step
2. Second step
3. Third step
```

---

## Code Blocks

### Basic Syntax Highlighting

````markdown
```javascript
function hello(name) {
  return `Hello, ${name}!`
}
```
````

### Line-by-Line Highlighting

Click advances through highlighted lines:

````markdown
```typescript {1|3-4|all}
// Line 1 highlighted first
function greet(name: string) {
  const msg = `Hello, ${name}`
  return msg
}
// Then lines 3-4, then all
```
````

Syntax: `{1|2-3|all}` means:
- Click 1: highlight line 1
- Click 2: highlight lines 2-3
- Click 3: highlight all

---

## Magic Move (Code Animation)

Smooth animation between code snippets:

````markdown
```magic-move
```python
def add(a, b):
    return a + b
```

```python
def add(a: int, b: int) -> int:
    """Add two integers"""
    return a + b
```

```python
def add(a: int, b: int) -> int:
    """Add two integers with validation"""
    if not isinstance(a, int) or not isinstance(b, int):
        raise TypeError("Arguments must be integers")
    return a + b
```
```
````

Each click smoothly animates from one code block to the next.

---

## Interactive Elements

### Step-by-Step Reveal (v-click)

```html
<v-click>
First click reveals this
</v-click>

<v-click>
Second click reveals this
</v-click>
```

### Text Highlighting (v-mark)

```html
This text is <v-mark type="underline" color="orange">underlined</v-mark>

And this is <v-mark type="circle" color="red">circled</v-mark>

Types: underline, circle, highlight, box, strike-through
Colors: red, orange, yellow, green, blue, purple, etc.
```

---

## Quotes and Callouts

```markdown
> This is a blockquote
> It can span multiple lines
```

---

## Images

```markdown
![alt text](path/to/image.png)

# With custom size
![alt text](path/to/image.png){width=300px}
```

---

## Tables

```markdown
| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
| Cell A1  | Cell A2  | Cell A3  |
| Cell B1  | Cell B2  | Cell B3  |
```

---

## HTML in Markdown

Standard HTML works directly:

```html
<div class="my-class">
  <p>Custom styling with HTML</p>
</div>

<hr class="my-3 opacity-30" />
```

Use for layout, styling, or when Markdown is too limited.

