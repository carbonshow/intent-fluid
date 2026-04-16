# Setup & Command Reference

## Environment Setup

### Check Prerequisites

```bash
# Node.js >= 18 required
node --version

# If < 18, update Node:
# macOS: brew install node@18 && brew link node@18
# Or use nvm: nvm install 18 && nvm use 18
```

### Font Setup (Optional)

If using custom fonts, place them in the presentation's `public/fonts/` directory:

```bash
mkdir -p $TARGET_DIR/public/fonts
# Download from Google Fonts: https://fonts.google.com/noto/specimen/Noto+Sans+SC
# Place: NotoSansSC-Regular.woff2, NotoSansSC-Bold.woff2
```

Missing fonts fall back to system fonts - this does NOT block development.

### Playwright for PDF Export (Optional)

Only needed if exporting to PDF:

```bash
npx playwright install chromium
# ~5 minutes first time, then cached
```

---

## Command Reference

All commands execute from the shared runner directory with absolute paths.

```bash
RUNNER="skills/slidev/assets/runner"
THEME="$RUNNER/node_modules/@slidev/theme-default"
SLIDES="/absolute/path/to/slides.md"
```

### Development Mode

```bash
cd "$RUNNER" && npx @slidev/cli "$SLIDES" --theme "$THEME"
```

- Server: `http://localhost:3030`
- Hot reload on file save
- Navigate: Arrow keys or spacebar
- Exit: `Ctrl+C`

### Export to PDF (Standard)

```bash
cd "$RUNNER" && npx @slidev/cli export "$SLIDES" --theme "$THEME"
```

Output: `slides.pdf` (same directory as `slides.md`)

### Export to PDF (With Click Animations)

```bash
cd "$RUNNER" && npx @slidev/cli export "$SLIDES" --theme "$THEME" --with-clicks
```

Each `v-click` becomes a page. Larger file size.

### Build Static Site

```bash
cd "$RUNNER" && npx @slidev/cli build "$SLIDES" --theme "$THEME"
```

Output: `dist/` directory with standalone HTML/CSS/JS
- No Slidev dependency needed to view
- Can be deployed to any static host

---

## Updating Runner Dependencies

```bash
cd "$RUNNER" && npm install
```

Updates @slidev/cli and theme packages to latest versions.

