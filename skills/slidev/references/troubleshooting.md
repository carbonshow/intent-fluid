# Slidev Troubleshooting Guide

## Common Issues & Solutions

### Dev Server Issues

**Problem: "Port 3030 already in use"**
```bash
# Kill the existing process
lsof -i :3030
kill -9 <PID>

# Then restart
cd skills/slidev/runner && npx @slidev/cli /path/to/slides.md
```

**Problem: "theme not found"**

Ensure you're using absolute paths and pointing to the runner's theme:
```bash
THEME="/Users/wenzhitao/Projects/github/intent-fluid/skills/slidev/runner/node_modules/@slidev/theme-default"
```

**Problem: Changes not auto-reloading**

- Make sure you're editing `slides.md` in the same directory used in the command
- Try a hard refresh in browser (Cmd+Shift+R on Mac)
- Restart the dev server

### Rendering Issues

**Problem: "Element is missing end tag"**

This usually means `---` appeared inside an HTML block:
```yaml
# ❌ WRONG
<div>
  ---
</div>

# ✅ CORRECT
<div>
  <hr />
</div>
```

**Problem: Chinese characters showing as squares**

1. Check font files exist: `ls public/fonts/NotoSansSC-*.woff2`
2. Verify `style.css` references correct font paths
3. Fallback: System fonts will be used (less precise rendering)
4. Download fonts from: https://fonts.google.com/noto/specimen/Noto+Sans+SC

**Problem: v-click or v-mark not working**

- Ensure you're inside a slide (between `---` separators)
- Check for typos in component names (should be lowercase)
- Verify closing tags match opening tags: `</v-click>`, `</v-mark>`

### PDF Export Issues

**Problem: "Playwright not installed"**

```bash
npx playwright install chromium
# Takes ~5 minutes first time, then cached
```

**Problem: PDF export hangs or fails**

- Try basic export first (without `--with-clicks`):
  ```bash
  cd skills/slidev/runner && npx @slidev/cli export /path/to/slides.md --theme /path/to/theme
  ```
- If that fails, check Playwright installation:
  ```bash
  npx playwright install-deps
  ```

**Problem: PDF is empty or corrupted**

- Ensure no syntax errors in slides.md (YAML frontmatter especially)
- Try removing custom fonts temporarily
- Export with verbose output: Add `--debug` flag

### Node.js Issues

**Problem: "Command not found: npx"**

Node.js might not be installed or not in PATH:
```bash
node --version  # Should be >= 18
npm --version   # Should be present
```

If not installed, download from https://nodejs.org (LTS version)

**Problem: "npx: command not found"**

Reinstall or check PATH:
```bash
npm install -g npm  # Update npm
which npm            # Check if it's in PATH
```

## Frontmatter Validation

The frontmatter must:
1. Start with `---` on first line
2. Have NO `---` separators inside it
3. End with `---` on its own line
4. Include `colorSchema: light`

```yaml
# ✅ CORRECT
---
title: My Presentation
theme: default
colorSchema: light
---

# ❌ WRONG - has --- inside
---
title: My Presentation
# --- This breaks the frontmatter
theme: default
---
```

## Performance

If presentations are slow:

1. **Reduce animations**: Fewer `v-click` elements = faster rendering
2. **Check code blocks**: Large code blocks with many lines slow rendering
3. **Optimize images**: Use compressed images, not high-res photos
4. **Clear browser cache**: Cmd+Shift+Delete (Chrome/Firefox)

## Debugging

To see detailed output:

```bash
cd skills/slidev/runner && DEBUG=* npx @slidev/cli /path/to/slides.md
```

Check `slides.md` syntax:
```bash
# Simple YAML validator
cat /path/to/slides.md | head -20
# First line must be ---
# Should see frontmatter fields
```

## When All Else Fails

1. Try a minimal presentation (copy `assets/slidev-starter/slides.md`)
2. Verify Node version: `node --version` should be >= 18
3. Check runner is intact: `ls -la skills/slidev/runner/node_modules/@slidev/cli`
4. Restart terminal/shell completely
5. Create a fresh presentation directory

For support, check:
- Official docs: https://sli.dev/
- GitHub issues: https://github.com/slidevjs/slidev/issues
