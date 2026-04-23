# Slidev Troubleshooting Guide

> **Path convention**: Throughout this guide, `<skill-root>` refers to the directory
> containing this skill's `SKILL.md` (e.g., the `skills/slidev/` directory).
> Resolve it to an absolute path before use.

## Common Issues & Solutions

### Dev Server Issues

**Problem: "Port 3030 already in use"**
```bash
# Kill the existing process
lsof -i :3030
kill -9 <PID>

# Then restart
RUNNER="<skill-root>/assets/runner"
cd "$RUNNER" && npx @slidev/cli /path/to/slides.md --theme "$RUNNER/node_modules/@slidev/theme-default"
```

**Problem: "theme not found"**

Ensure you are using absolute paths and pointing to the runner's theme:
```bash
RUNNER="<skill-root>/assets/runner"
THEME="$RUNNER/node_modules/@slidev/theme-default"
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

**Problem: Custom font characters showing as squares**

1. Check font files exist in your presentation's `public/fonts/` directory
2. Verify `style.css` references correct font paths
3. Fallback: System fonts will be used (less precise rendering)
4. For CJK fonts, download from: https://fonts.google.com/noto/specimen/Noto+Sans+SC

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
  RUNNER="<skill-root>/assets/runner"
  cd "$RUNNER" && npx @slidev/cli export /path/to/slides.md --theme "$RUNNER/node_modules/@slidev/theme-default"
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

### Runner Issues

**Problem: Runner has no node_modules**

Run the setup script:
```bash
bash <skill-root>/scripts/setup-runner.sh
```

This will install all dependencies. Requires Node.js >= 18.

## Frontmatter Validation

Run the validation script to catch all frontmatter issues automatically:

```bash
bash <skill-root>/scripts/validate-slides.sh /path/to/slides.md
```

See SKILL.md "Critical Gotchas" for the full list of known pitfalls.

## Performance

If presentations are slow:

1. **Reduce animations**: Fewer `v-click` elements = faster rendering
2. **Check code blocks**: Large code blocks with many lines slow rendering
3. **Optimize images**: Use compressed images, not high-res photos
4. **Clear browser cache**: Cmd+Shift+Delete (Chrome/Firefox)

## Debugging

To see detailed output:

```bash
RUNNER="<skill-root>/assets/runner"
cd "$RUNNER" && DEBUG=* npx @slidev/cli /path/to/slides.md
```

## When All Else Fails

1. Try a minimal presentation (copy `<skill-root>/assets/slidev-starter/slides.md`)
2. Verify Node version: `node --version` should be >= 18
3. Check runner is intact: `ls -la <skill-root>/assets/runner/node_modules/@slidev/cli`
4. Restart terminal/shell completely
5. Create a fresh presentation directory

For support, check:
- Official docs: https://sli.dev/
- GitHub issues: https://github.com/slidevjs/slidev/issues

## SP1 Theme & Layout Issues

### Theme CSS not applied

**Problem**: deck renders with browser default fonts / no color variables seem to take effect.

**Diagnosis**:
1. Check the deck's `style.css` matches the theme file:
   ```bash
   diff <target>/style.css <skill-root>/assets/themes/<name>.css
   ```
   If they differ, the initialization was wrong or the user manually edited.
2. Check the deck's Slidev frontmatter does NOT override `class` with something that breaks the theme selectors.
3. Check browser DevTools "Elements" tab — the `.slidev-layout` element should show `background`, `color`, and `--color-primary` from the theme.

**Fix**:
- Re-run initialization: `bash scripts/new-presentation.sh <target> --theme <name> --force`
- This overwrites `style.css` with the theme's current version.

### Switching themes on an existing deck

**Problem**: user decides mid-work to switch from `tech-dark` to `corporate-navy`.

**Fix**:
- Re-run `new-presentation.sh <target> --theme corporate-navy --force`
- The `--force` flag tells the script to overwrite `style.css` while preserving `slides.md` (but back up `slides.md` yourself first to be safe — the script does not preserve `slides.md` if it's inside the overwritten tree in earlier versions).
- Alternative (safer): manually replace `<target>/style.css` with a copy of `assets/themes/corporate-navy.css`.

### Check 10: FAIL — "unknown layout"

**Problem**: a slide uses `layout: foobar` and Check 10 rejects it.

**Fix**:
- Change `layout:` to one of the 15 catalog layouts (see `references/layout-catalog.md`).
- If the content truly doesn't fit any layout, this is a signal to rethink the slide's purpose.
- If the layout is a Slidev built-in you want to use without a class, it's permitted as long as it's one of: `default`, `cover`, `center`, `two-cols`, `image`, `image-left`, `image-right`, `section`, `end`. But prefer catalog layouts for consistency.

### Check 10: FAIL — "class X requires layout Y but got Z"

**Problem**: a slide has `class: three-metrics` but `layout: center` (mismatch).

**Fix**:
- Fix the pair — `class: three-metrics` requires `layout: default`. See the mapping table in §6.3 of the SP1 spec / `layout-catalog.md`.

### Check 10: WARN — field exceeds maxLength

**Problem**: a bullet or paragraph goes over the layout's field `maxLength`.

**Fix (preferred)**: shorten the field. Check the verbosity setting in the deck's brief — maybe the deck is "concise" and the bullet should be much shorter.

**Fix (alternative)**: switch to a layout with a looser limit. For example, a 110-character bullet doesn't fit in `content-bullets` (maxLength 90) but fits in `content-narrative` (body maxLength 300).

**Fix (escape hatch)**: add `schema-override: true` to the slide's frontmatter plus `<!-- note: ... -->` explaining why. Use sparingly.

### Check 10: FAIL — two-columns pattern missing or invalid

**Problem**: a `two-columns` slide has `left.pattern: paragraphs` (not in the enum).

**Fix**: use one of the 6 valid patterns: `text`, `bullets`, `code`, `image`, `table`, `metric`. "paragraphs" is close to `text`; use `text` with a 250-char maxLength content field.

### Check 10: WARN — code pattern > 8 lines or table pattern > 6 rows

**Problem**: content pattern inside `two-columns` exceeds its sub-limit.

**Fix**: promote to a standalone layout. For code > 8 lines, use `code-focus` as its own slide. For table > 6 rows, use `data-table` as its own slide.
