#!/usr/bin/env node
// grader.js — Parse a deck directory and emit structured metrics JSON.
// Usage: node scripts/lib/grader.js <deck-dir>
// Output: JSON to stdout
// Zero deps; Node 18+.

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { resolve, join, dirname } from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ── Resolve paths ─────────────────────────────────────────────────────────────
const deckDir = resolve(process.argv[2] || '');
if (!deckDir || !existsSync(deckDir)) {
  process.stderr.write(`grader.js: deck directory not found: ${process.argv[2]}\n`);
  process.exit(1);
}

const slidesPath = join(deckDir, 'slides.md');
if (!existsSync(slidesPath)) {
  process.stderr.write(`grader.js: slides.md not found in ${deckDir}\n`);
  process.exit(1);
}

const skillRoot = resolve(__dirname, '..', '..');
const validateSh = join(skillRoot, 'scripts', 'validate-slides.sh');
const reviewSh = join(skillRoot, 'scripts', 'review-presentation.sh');
const parserPath = join(skillRoot, 'scripts', 'lib', 'slides-parser.js');

// ── Import slides-parser.js dynamically ──────────────────────────────────────
// slides-parser.js is an ES module; use dynamic import.
const { parseSlides } = await import(parserPath);

// ── Parse slides.md ──────────────────────────────────────────────────────────
const md = readFileSync(slidesPath, 'utf8');
const slides = parseSlides(md);

// ── Compute slide metrics ─────────────────────────────────────────────────────

// Total slide count: unique slide indices (two-col double-entries count once)
const uniqueIndices = new Set(slides.map(s => s.index));
const totalSlides = uniqueIndices.size;

// Count by semantic layout name
// Semantic name mapping: derive from layout + class tokens, matching layout-catalog semantics.
// We produce the same semantic names as validate-slides.sh Check 10 and the catalog.
function semanticLayout(slide) {
  const layout = slide.frontmatter.layout || 'default';
  const cls = slide.frontmatter.class || '';
  const tokens = new Set(cls.split(/\s+/).filter(Boolean));

  if (layout === 'default' && tokens.has('image-focus')) return 'image-focus';
  if (layout === 'image-left') return 'image-text-split';
  if (layout === 'image-right') return 'image-text-split';
  if (layout === 'two-cols-header' && tokens.has('two-columns')) return 'two-columns';
  if (layout === 'default' && tokens.has('agenda')) return 'agenda';
  if (layout === 'default' && tokens.has('content-bullets')) return 'content-bullets';
  if (layout === 'default' && tokens.has('section-divider')) return 'section-divider';
  if (layout === 'default' && tokens.has('big-statement')) return 'big-statement';
  if (layout === 'default' && tokens.has('code-focus')) return 'code-focus';
  if (layout === 'default' && tokens.has('diagram-primary')) return 'diagram-primary';
  if (layout === 'default' && tokens.has('three-metrics')) return 'three-metrics';
  if (layout === 'default' && tokens.has('data-table')) return 'data-table';
  if (layout === 'default' && tokens.has('timeline-horizontal')) return 'timeline-horizontal';
  if (layout === 'default' && tokens.has('skeleton-hero')) return 'cover'; // deck-level cover
  if (layout === 'cover') return 'cover';
  if (layout === 'end') return 'closing';
  if (layout === 'default' && tokens.has('text-center')) return 'cover'; // first slide default
  return layout || 'default';
}

// Build per-slide record (dedup by index for double-entry two-col slides)
const seenIndices = new Set();
const perSlide = [];
for (const s of slides) {
  if (!seenIndices.has(s.index)) {
    seenIndices.add(s.index);
    perSlide.push(s);
  }
}

const byLayout = {};
for (const s of perSlide) {
  const sem = semanticLayout(s);
  byLayout[sem] = (byLayout[sem] || 0) + 1;
}

// image_slides: slides where isImageSlide=true (unique by index)
const imageSlideIndices = new Set(slides.filter(s => s.isImageSlide).map(s => s.index));
const imageSlidesCount = imageSlideIndices.size;

// empty: slides with no body text (fewer than 3 words after stripping markup)
function bodyText(slide) {
  return slide.bodyLines.join(' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/[#*`>|_~\[\]]/g, ' ')
    .trim();
}

// We need bodyLines from the raw parse. slides-parser doesn't expose bodyLines on the result
// directly — we need to re-parse for body content. We'll re-read the raw slides from
// the parser internals. Since parseSlides only returns the final processed records (no bodyLines),
// we parse the md ourselves with a lightweight split for body analysis.

function splitSlidesForBody(md) {
  const lines = md.split('\n');
  const SEP = '---';
  let cursor = 0;
  const result = [];

  // Skip deck-level frontmatter
  if (lines[0] && lines[0].trim() === SEP) {
    cursor = 1;
    while (cursor < lines.length && lines[cursor].trim() !== SEP) cursor++;
    cursor++;
  }

  let currentFM = {};
  let currentBody = [];
  let inFM = false;
  let peekFM = false;

  function tryReadFM(startCursor) {
    const firstLine = lines[startCursor];
    if (!firstLine || !/^[a-zA-Z_][a-zA-Z0-9_-]*:/.test(firstLine)) return null;
    let dashPos = startCursor;
    while (dashPos < lines.length && lines[dashPos].trim() !== SEP) dashPos++;
    if (dashPos >= lines.length) return null;
    const fmLines = lines.slice(startCursor, dashPos).join('\n');
    const fm = {};
    for (const line of fmLines.split('\n')) {
      const m = line.match(/^([a-zA-Z_][a-zA-Z0-9_-]*):\s*(.*)$/);
      if (m && !line.startsWith(' ')) fm[m[1]] = m[2].trim().replace(/^['"]|['"]$/g, '');
    }
    return { fm, newCursor: dashPos + 1 };
  }

  function flush() {
    const hasContent = currentBody.some(l => l.trim() !== '') || Object.keys(currentFM).length > 0;
    if (hasContent) result.push({ fm: currentFM, body: currentBody.join('\n') });
    currentFM = {};
    currentBody = [];
  }

  while (cursor < lines.length) {
    const line = lines[cursor];
    if (inFM) {
      if (line.trim() === SEP) { inFM = false; }
      cursor++;
      continue;
    }
    if (line.trim() === SEP) {
      flush();
      cursor++;
      peekFM = true;
      continue;
    }
    if (peekFM) {
      peekFM = false;
      const parsed = tryReadFM(cursor);
      if (parsed) {
        currentFM = parsed.fm;
        cursor = parsed.newCursor;
        inFM = false;
        continue;
      }
    }
    currentBody.push(line);
    cursor++;
  }
  flush();
  return result;
}

const rawSlides = splitSlidesForBody(md);

function wordCount(text) {
  return text.split(/\s+/).filter(Boolean).length;
}

function longestBulletChars(text) {
  let max = 0;
  for (const line of text.split('\n')) {
    const m = line.match(/^\s*-\s+(.+)$/);
    if (m) {
      const clean = m[1].replace(/<[^>]*>/g, '').trim();
      if (clean.length > max) max = clean.length;
    }
  }
  return max;
}

let totalWords = 0;
let emptyCount = 0;
let noHeadingCount = 0;
let maxBulletChars = 0;

for (const s of rawSlides) {
  const text = s.body.replace(/<[^>]*>/g, ' ').replace(/[#*`>|_~\[\]]/g, ' ').trim();
  const wc = wordCount(text);
  totalWords += wc;
  if (wc < 3) emptyCount++;
  if (!/^\s*#{1,3}\s/m.test(s.body)) noHeadingCount++;
  const b = longestBulletChars(s.body);
  if (b > maxBulletChars) maxBulletChars = b;
}

const avgWordsPerSlide = totalSlides > 0 ? Math.round((totalWords / totalSlides) * 10) / 10 : 0;

// ── Image metrics ─────────────────────────────────────────────────────────────
// Collect all image slides from the parser output (includes double-entry two-col)
let autoGenerated = 0;
let userProvided = 0;
let placeholders = 0;
let missingCount = 0;

const generatedDir = join(deckDir, 'public', 'generated');

function filesInDir(dir, ext) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter(f => f.endsWith(ext)).map(f => join(dir, f));
}

const svgFiles = new Set(filesInDir(generatedDir, '.svg'));
const pngFiles = new Set(filesInDir(generatedDir, '.png'));

for (const s of slides) {
  if (!s.isImageSlide) continue;
  const imgPath = s.imageFields && (s.imageFields.image_path);
  if (!imgPath) {
    // No image_path declared: auto-generated slot
    autoGenerated++;
  } else {
    // image_path declared: user-provided
    const absPath = resolve(deckDir, imgPath);
    if (existsSync(absPath)) {
      userProvided++;
    } else {
      missingCount++;
    }
  }
}

// Placeholders: .svg files in public/generated/
placeholders = svgFiles.size;

// ── Shell out to validate-slides.sh ──────────────────────────────────────────
let validateExitCode = 0;
let validateStdout = '';
try {
  validateStdout = execFileSync('bash', [validateSh, slidesPath], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
} catch (err) {
  validateExitCode = err.status || 1;
  validateStdout = (err.stdout || '') + (err.stderr || '');
}

// Parse validate stdout
let valPassed = 0;
let valFailed = 0;
let valWarnings = 0;
const check10Failures = [];
const check11Failures = [];

for (const line of validateStdout.split('\n')) {
  // Result summary line: "Result: N passed, N failed, N warnings"
  const summary = line.match(/^Result:\s+(\d+)\s+passed,\s+(\d+)\s+failed,\s+(\d+)\s+warn/i);
  if (summary) {
    valPassed = parseInt(summary[1], 10);
    valFailed = parseInt(summary[2], 10);
    valWarnings = parseInt(summary[3], 10);
    continue;
  }
  // Check 10 FAIL lines: "  FAIL  Check 10 — <message>"
  const c10 = line.match(/^\s+FAIL\s+Check 10\s+[—-]\s+(.+)$/);
  if (c10) { check10Failures.push(c10[1].trim()); continue; }
  // Check 11 FAIL lines: "  FAIL  Check 11 — <message>"
  const c11 = line.match(/^\s+FAIL\s+Check 11\s+[—-]\s+(.+)$/);
  if (c11) { check11Failures.push(c11[1].trim()); }
}

// ── Shell out to review-presentation.sh ──────────────────────────────────────
let reviewScore = null;
let reviewGrade = null;
try {
  const reviewStdout = execFileSync('bash', [reviewSh, slidesPath], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  for (const line of reviewStdout.split('\n')) {
    // "Score: 97 / 100  (Excellent)"
    const m = line.match(/^Score:\s+(\d+)\s+\/\s+100\s+\(([^)]+)\)/);
    if (m) {
      reviewScore = parseInt(m[1], 10);
      reviewGrade = m[2].trim();
      break;
    }
  }
} catch (err) {
  // review exits 1 when score < 70; still parse stdout
  const out = (err.stdout || '') + '';
  for (const line of out.split('\n')) {
    const m = line.match(/^Score:\s+(\d+)\s+\/\s+100\s+\(([^)]+)\)/);
    if (m) {
      reviewScore = parseInt(m[1], 10);
      reviewGrade = m[2].trim();
      break;
    }
  }
}

// ── Git SHA ───────────────────────────────────────────────────────────────────
let sha = null;
try {
  sha = execFileSync('git', ['rev-parse', 'HEAD'], {
    cwd: skillRoot,
    encoding: 'utf8',
  }).trim();
} catch (_) {
  sha = null;
}

// ── Theme info ────────────────────────────────────────────────────────────────
// Read deck-level frontmatter for theme name
function deckFrontmatter(md) {
  const lines = md.split('\n');
  if (!lines[0] || lines[0].trim() !== '---') return {};
  let end = 1;
  while (end < lines.length && lines[end].trim() !== '---') end++;
  const fm = {};
  for (const line of lines.slice(1, end)) {
    const m = line.match(/^([a-zA-Z_][a-zA-Z0-9_-]*):\s*(.+)$/);
    if (m) fm[m[1]] = m[2].trim().replace(/^['"]|['"]$/g, '');
  }
  return fm;
}

const deckFM = deckFrontmatter(md);
// theme name comes from image-style.txt (deck's active theme), or frontmatter `theme`
const imageStylePath = join(deckDir, 'image-style.txt');
let themeName = null;
if (existsSync(imageStylePath)) {
  // image-style.txt contains the style text, not the theme name.
  // The theme name is stored in the deck's frontmatter `theme` key OR
  // inferred from a theme comment. Use frontmatter `theme` if present.
  themeName = deckFM.theme || null;
} else {
  themeName = deckFM.theme || null;
}
const imageStylePresent = existsSync(imageStylePath);

// ── Assemble report ───────────────────────────────────────────────────────────
const report = {
  deck: deckDir,
  sha,
  timestamp: new Date().toISOString(),
  slides: {
    total: totalSlides,
    by_layout: byLayout,
    image_slides: imageSlidesCount,
    empty: emptyCount,
    no_heading: noHeadingCount,
  },
  text: {
    total_words: totalWords,
    avg_words_per_slide: avgWordsPerSlide,
    longest_bullet_chars: maxBulletChars,
  },
  images: {
    auto_generated: autoGenerated,
    user_provided: userProvided,
    placeholders,
    missing: missingCount,
  },
  validation: {
    exit_code: validateExitCode,
    passed: valPassed,
    failed: valFailed,
    warnings: valWarnings,
    check10_failures: check10Failures,
    check11_failures: check11Failures,
  },
  review: {
    score: reviewScore,
    grade: reviewGrade,
  },
  theme: {
    name: themeName,
    image_style_present: imageStylePresent,
  },
};

process.stdout.write(JSON.stringify(report, null, 2) + '\n');
