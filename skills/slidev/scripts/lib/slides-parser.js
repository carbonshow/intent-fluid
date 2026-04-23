// slides-parser.js — Parse Slidev slides.md into a structured slide list.
// Lightweight YAML frontmatter parser (handles the subset we use).
// Zero deps; Node 18+.

// Parse one frontmatter block (already stripped of --- delimiters) into an object.
// Supports: scalar (key: value), nested object (key:\n  subkey: value),
//           folded block scalar (key: >\n  line1\n  line2),
//           literal block scalar (key: |\n  line1\n  line2).
function parseFrontmatter(text) {
  const fm = {};
  const lines = text.split('\n');
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim() || line.trim().startsWith('#')) { i++; continue; }

    // Match top-level "key: value" or "key:" or "key: >" (no leading spaces)
    const top = line.match(/^([a-zA-Z_][a-zA-Z0-9_-]*):\s*(.*)$/);
    if (top && !line.startsWith(' ')) {
      const key = top[1];
      let val = top[2];

      if (val === '>' || val === '|') {
        // Folded / literal block scalar — collect indented continuation lines
        const collected = [];
        i++;
        while (i < lines.length && (lines[i].startsWith('  ') || lines[i].trim() === '')) {
          collected.push(lines[i].replace(/^  /, ''));
          i++;
        }
        fm[key] = val === '>'
          ? collected.join(' ').replace(/\s+/g, ' ').trim()
          : collected.join('\n').trim();
        continue;
      }

      if (val === '') {
        // Nested object — gather `  subkey: value` lines until dedent
        const obj = {};
        i++;
        while (i < lines.length && (lines[i].startsWith('  ') || lines[i].trim() === '')) {
          const sub = lines[i].match(/^  ([a-zA-Z_][a-zA-Z0-9_-]*):\s*(.*)$/);
          if (sub) obj[sub[1]] = stripQuotes(sub[2]);
          i++;
        }
        fm[key] = obj;
        continue;
      }

      fm[key] = stripQuotes(val);
      i++;
      continue;
    }
    i++;
  }
  return fm;
}

function stripQuotes(v) {
  v = v.trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    return v.slice(1, -1);
  }
  return v;
}

// Split slides.md into individual slide objects { frontmatter, bodyLines }.
// The deck-wide frontmatter (first ---...--- block) is skipped.
// Each subsequent slide may optionally begin with its own ---...--- frontmatter.
// In Slidev format, --- both separates slides AND opens the next slide's FM.
function splitSlides(md) {
  const slides = [];
  const lines = md.split('\n');
  let cursor = 0;

  // Skip the deck-level frontmatter (opening ---...--- block).
  if (lines[0] && lines[0].trim() === '---') {
    cursor = 1;
    while (cursor < lines.length && lines[cursor].trim() !== '---') cursor++;
    cursor++; // move past closing ---
  }

  // Attempt to consume a frontmatter block starting EXACTLY at `cursor`
  // (no skipping of leading blank lines — FM must open immediately).
  // Returns { frontmatter, newCursor } or null if not detected as FM.
  function tryConsumeFM() {
    // Look for a tight FM block starting exactly at `cursor`:
    //   line at cursor must be a `key: value` pattern (no leading blank lines)
    //   a closing --- must exist before any body-shape content
    if (cursor >= lines.length) return null;
    const firstLine = lines[cursor];
    if (!/^[a-zA-Z_][a-zA-Z0-9_-]*:/.test(firstLine)) return null;

    // Scan forward to the closing ---
    let dashPos = cursor;
    while (dashPos < lines.length && lines[dashPos].trim() !== '---') dashPos++;
    if (dashPos >= lines.length) return null;

    // All lines between cursor and dashPos must look like valid FM:
    //   - blank
    //   - comment (# ...)
    //   - top-level key: (with or without value) — keyAtCol0
    //   - 2-indented continuation (for nested objects / block scalars)
    for (let j = cursor; j < dashPos; j++) {
      const l = lines[j];
      if (l.trim() === '') continue;
      if (l.trim().startsWith('#')) continue;
      if (/^[a-zA-Z_][a-zA-Z0-9_-]*:/.test(l)) continue;    // key: at col 0
      if (/^  [a-zA-Z_]/.test(l)) continue;                  // 2-indented nested
      if (/^    /.test(l)) continue;                          // 4-indented (list under nested)
      if (/^  -/.test(l)) continue;                           // 2-indented list item
      // Not FM-shaped — bail
      return null;
    }

    const fmLines = lines.slice(cursor, dashPos);
    return {
      frontmatter: parseFrontmatter(fmLines.join('\n')),
      newCursor: dashPos + 1,
    };
  }

  let currentSlide = { frontmatter: {}, bodyLines: [] };

  while (cursor < lines.length) {
    const line = lines[cursor];

    if (line.trim() === '---') {
      // Flush current slide (if it has content)
      const hasContent = currentSlide.bodyLines.some(l => l.trim() !== '')
                      || Object.keys(currentSlide.frontmatter).length > 0;
      if (hasContent) slides.push(currentSlide);
      currentSlide = { frontmatter: {}, bodyLines: [] };
      cursor++;

      // The separator may open the next slide's FM.
      const fm = tryConsumeFM();
      if (fm) {
        currentSlide.frontmatter = fm.frontmatter;
        cursor = fm.newCursor;
      }
      continue;
    }

    currentSlide.bodyLines.push(line);
    cursor++;
  }

  // Flush the last slide if it has any non-blank content or any frontmatter.
  const hasContent = currentSlide.bodyLines.some(l => l.trim() !== '')
                  || Object.keys(currentSlide.frontmatter).length > 0;
  if (hasContent) slides.push(currentSlide);

  return slides;
}

// Parse body lines to detect two-cols-header column patterns (::left:: / ::right::).
function parseColumnsFromBody(bodyLines) {
  const result = { left: null, right: null };
  let section = null;
  let sectionObj = null;

  for (const line of bodyLines) {
    const marker = line.match(/^::(left|right)::\s*$/);
    if (marker) {
      if (section && sectionObj) result[section] = sectionObj;
      section = marker[1];
      sectionObj = {};
      continue;
    }
    if (!section) continue;
    const kv = line.match(/^([a-zA-Z_][a-zA-Z0-9_-]*):\s*(.*)$/);
    if (kv) sectionObj[kv[1]] = stripQuotes(kv[2]);
  }
  if (section && sectionObj) result[section] = sectionObj;

  return result;
}

export const IMAGE_LAYOUT_NAMES = new Set(['image-focus', 'image-left', 'image-right']);

function sizeForSlide(layout, columnsType) {
  if (layout === 'two-cols-header' && columnsType === 'image') {
    return { width: 800, height: 900 };
  }
  if (IMAGE_LAYOUT_NAMES.has(layout)) {
    return { width: 1600, height: 900 };
  }
  return null;
}

export function parseSlides(md) {
  const raw = splitSlides(md);
  const result = [];
  raw.forEach((slide, idx) => {
    const layout = slide.frontmatter.layout;
    let isImageSlide = false;
    let columnsType = null;
    let imageSize = null;
    let imageFields = {};

    if (IMAGE_LAYOUT_NAMES.has(layout)) {
      isImageSlide = true;
      imageSize = sizeForSlide(layout, null);
      imageFields = {
        image_prompt: slide.frontmatter.image_prompt,
        // Accept both image_path: and image: for image-left / image-right layouts
        image_path: slide.frontmatter.image_path || slide.frontmatter.image,
      };
    } else if (layout === 'two-cols-header') {
      const cols = parseColumnsFromBody(slide.bodyLines);
      if (cols.left && cols.left.pattern === 'image') {
        columnsType = 'image';
        imageFields = {
          image_prompt: cols.left.image_prompt,
          image_path: cols.left.image_path,
          column: 'left',
        };
      } else if (cols.right && cols.right.pattern === 'image') {
        columnsType = 'image';
        imageFields = {
          image_prompt: cols.right.image_prompt,
          image_path: cols.right.image_path,
          column: 'right',
        };
      }
      if (columnsType === 'image') {
        isImageSlide = true;
        imageSize = sizeForSlide(layout, columnsType);
      }
    }

    result.push({
      index: idx + 1,
      layout,
      frontmatter: slide.frontmatter,
      isImageSlide,
      columnsType,
      imageSize,
      imageFields,
    });
  });
  return result;
}
