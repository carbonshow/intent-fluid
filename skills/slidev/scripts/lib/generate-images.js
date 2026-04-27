#!/usr/bin/env node
// generate-images.js — SP2 main orchestrator.
//
// Usage:
//   node generate-images.js <deck-dir> [--dry-run] [--force] [--mock <scenario>]
//
// Environment:
//   GEMINI_API_KEY       Required for real generation. If unset, all images become placeholders.
//   GEMINI_MODEL         Default: 'gemini-2.5-flash-image' (overrides only the model ID).
//
// --mock <scenario> replaces the real Gemini client with a deterministic fake that returns:
//   success  → a minimal 1x1 PNG buffer
//   timeout / content_policy / network / api → throws GeminiError with the corresponding code
// See references/image-generation.md §9 and SKILL.md "SP2: Image Generation Pipeline" for full docs.
//
// Exit codes:
//   0 on any completion (placeholders and successes alike)
//   1 on bad args / missing deck / missing slides.md / unknown mock scenario
//   2 on missing image-style.txt (should be caught by validate-slides.sh Check 11 first)

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { parseSlides } from './slides-parser.js';
import { extractThemeColors } from './theme-colors.js';
import { renderPlaceholder } from './placeholder-svg.js';
import { generateImage, createMockClient, GeminiError } from './gemini-client.js';

const argv = process.argv.slice(2);

function parseArgs() {
  const args = { deck: null, dryRun: false, force: false, mock: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--dry-run') args.dryRun = true;
    else if (a === '--force') args.force = true;
    else if (a === '--mock') { args.mock = argv[i + 1]; i++; }
    else if (!a.startsWith('-') && args.deck === null) args.deck = a;
    else { console.error(`[SP2] Unknown arg: ${a}`); process.exit(1); }
  }
  if (!args.deck) {
    console.error('Usage: generate-images.js <deck-dir> [--dry-run] [--force] [--mock <scenario>]');
    process.exit(1);
  }
  return args;
}

function contentHash(finalPrompt, width, height) {
  return crypto
    .createHash('sha256')
    .update(finalPrompt)
    .update('\x00')
    .update(`${width}x${height}`)
    .digest('hex')
    .slice(0, 16);
}

function simplifyRatio(w, h) {
  const gcd = (a, b) => (b ? gcd(b, a % b) : a);
  const g = gcd(w, h);
  return `${w / g}:${h / g}`;
}

function buildFinalPrompt(imagePrompt, themeStyle, width, height) {
  const aspectRatio = simplifyRatio(width, height);
  return [
    (imagePrompt || '').trim(),
    '',
    'Style:',
    (themeStyle || '').trim(),
    '',
    `Aspect ratio: ${aspectRatio}. Target resolution: ${width}x${height}. No text, watermarks, or logos.`,
  ].join('\n');
}

function reasonTextFromCode(code) {
  const map = {
    no_key: 'API key not set',
    timeout: 'API timeout (30s)',
    content_policy: 'Content policy rejected',
    network: 'Network error',
    api: 'API error',
  };
  return map[code] || code;
}

// Rewrite all src/href attributes that reference Vite's public/ directory from the
// relative form ("public/foo.png") to the correct absolute-root URL ("/foo.png").
//
// Vite's public/ directory convention: files under public/ are served at the site root,
// so the correct <img src> is "/generated/hash.png", NOT "public/generated/hash.png".
// Using the relative "public/..." form causes Rollup to treat it as a module import and
// fail at build time with "failed to resolve import" — for both generated images and
// user-provided assets (e.g. public/hero.jpg).
//
// patchAutoSrc: called per-slide (in index order) to replace the first remaining
//   "public/generated/auto.png" literal with the actual hash filename.
//   Must run before patchPublicSrcs so the hash name is in place first.
// patchPublicSrcs: called once after the loop to normalise any remaining
//   src="public/..." or href="public/..." to src="/...". Covers user-provided
//   paths (e.g. public/hero.jpg) that patchAutoSrc does not touch.

function patchAutoSrc(slidesPath, actualRel) {
  // actualRel is "public/generated/<hash>.png" (or .svg) — strip the "public/" prefix.
  const publicUrl = actualRel.replace(/^public\//, '/');
  const AUTO_REL = 'public/generated/auto.png';
  const content = fs.readFileSync(slidesPath, 'utf8');
  if (content.includes(AUTO_REL)) {
    fs.writeFileSync(slidesPath, content.replace(AUTO_REL, publicUrl), 'utf8');
  }
}

function patchPublicSrcs(slidesPath) {
  const content = fs.readFileSync(slidesPath, 'utf8');
  const patched = content.replace(/\b(src|href)="public\//g, '$1="/');
  if (patched !== content) {
    fs.writeFileSync(slidesPath, patched, 'utf8');
  }
}

function writePlaceholderTo(targetPath, { title, reason, colors, width, height }) {
  const svg = renderPlaceholder({ title, reason, colors, width, height });
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  // Slidev happily displays .svg via <img>. Rewrite .png hash paths to .svg for mime honesty.
  let finalPath = targetPath;
  if (targetPath.endsWith('.png')) finalPath = targetPath.replace(/\.png$/, '.svg');
  fs.writeFileSync(finalPath, svg, 'utf8');
  return finalPath;
}

function resolveThemeName(themeStyleContent, themesAbsDir) {
  try {
    const files = fs.readdirSync(themesAbsDir);
    for (const f of files) {
      if (!f.endsWith('.image-style.txt')) continue;
      const full = path.join(themesAbsDir, f);
      const content = fs.readFileSync(full, 'utf8').trim();
      if (content === themeStyleContent.trim()) {
        return f.replace(/\.image-style\.txt$/, '');
      }
    }
  } catch { /* ignore */ }
  return null;
}

function printKeyHint(n) {
  console.warn(`[SP2] Found ${n} image${n === 1 ? '' : 's'} to generate`);
  console.warn(`[SP2] ⚠  GEMINI_API_KEY not set — using placeholders for all images.`);
  console.warn(`[SP2]`);
  console.warn(`[SP2] To enable real image generation:`);
  console.warn(`[SP2]   1. Get a key:  https://aistudio.google.com/app/apikey`);
  console.warn(`[SP2]   2. Set it:     export GEMINI_API_KEY=AIza...`);
  console.warn(`[SP2]   3. Re-run:     ./scripts/build-deck.sh <deck>`);
  console.warn(`[SP2]`);
  console.warn(`[SP2] Full guide: skills/slidev/references/image-generation.md`);
  console.warn(`[SP2]`);
  console.warn(`[SP2] Continuing with placeholders...`);
}

async function main() {
  const args = parseArgs();
  const deckDir = path.resolve(args.deck);

  // Validate deck
  const slidesPath = path.join(deckDir, 'slides.md');
  if (!fs.existsSync(slidesPath)) {
    console.error(`[SP2] slides.md not found: ${slidesPath}`);
    process.exit(1);
  }

  const imageStylePath = path.join(deckDir, 'image-style.txt');
  if (!fs.existsSync(imageStylePath)) {
    console.error(`[SP2] image-style.txt not found in deck: ${imageStylePath}`);
    console.error(`[SP2] Run new-presentation.sh to scaffold a deck, or copy the theme's image-style file.`);
    process.exit(2);
  }

  const themePath = path.join(deckDir, 'theme.css');
  let colors;
  if (fs.existsSync(themePath)) {
    colors = extractThemeColors(fs.readFileSync(themePath, 'utf8'));
  } else {
    colors = extractThemeColors('');
  }

  const md = fs.readFileSync(slidesPath, 'utf8');
  const themeStyle = fs.readFileSync(imageStylePath, 'utf8').trim();

  const slides = parseSlides(md);
  const imageSlides = slides.filter(s => s.isImageSlide);

  // Resolve theme name. This file lives at <skillRoot>/scripts/lib/generate-images.js.
  // Themes directory: <skillRoot>/assets/themes/
  const themesAbsDir = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..', 'assets', 'themes');
  const themeName = resolveThemeName(themeStyle, themesAbsDir) || 'unknown';

  console.log(`[SP2] Deck: ${deckDir}`);
  console.log(`[SP2] Theme: ${themeName}`);
  console.log(`[SP2] Found ${imageSlides.length} image${imageSlides.length === 1 ? '' : 's'} to process`);

  if (imageSlides.length === 0) {
    console.log('[SP2] No image-consuming slides; nothing to do.');
    return;
  }

  // Select client
  let client;
  if (args.mock) {
    try {
      client = createMockClient(args.mock);
    } catch (err) {
      console.error(`[SP2] ${err.message}`);
      process.exit(1);
    }
  } else {
    client = { generateImage };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  const hasKey = !!apiKey;
  const isDryRun = args.dryRun;

  if (!hasKey && !args.mock && !isDryRun) {
    printKeyHint(imageSlides.length);
  }

  let generated = 0, cached = 0, placeholder = 0, userProvided = 0;

  for (const slide of imageSlides) {
    const { width, height } = slide.imageSize;
    const imagePrompt = slide.imageFields.image_prompt;
    const explicitPath = slide.imageFields.image_path;
    const title = slide.frontmatter.title || '';

    const finalPrompt = buildFinalPrompt(imagePrompt, themeStyle, width, height);
    const hash = contentHash(finalPrompt, width, height);

    const autoRel = `public/generated/${hash}.png`;

    // User override detection: explicit image_path that is NOT in public/generated/
    if (explicitPath && !explicitPath.startsWith('public/generated/')) {
      const absUser = path.join(deckDir, explicitPath);
      if (!fs.existsSync(absUser)) {
        console.warn(`[SP2] ⚠ slide ${slide.index}: user image_path ${explicitPath} does not exist (skipping)`);
      } else {
        console.log(`[SP2] ✓ slide ${slide.index} (${slide.layout}) user-provided: ${explicitPath}`);
      }
      userProvided++;
      continue;
    }

    const targetRel = explicitPath || autoRel;
    const targetAbs = path.join(deckDir, targetRel);

    // Cache hit (png or svg)
    const cacheHitPng = fs.existsSync(targetAbs);
    const svgSibling = targetAbs.replace(/\.png$/, '.svg');
    const cacheHitSvg = fs.existsSync(svgSibling);
    if ((cacheHitPng || cacheHitSvg) && !args.force) {
      const existing = cacheHitPng ? targetRel : targetRel.replace(/\.png$/, '.svg');
      console.log(`[SP2] ✓ slide ${slide.index} (${slide.layout}) cached: ${existing}`);
      patchAutoSrc(slidesPath, existing);
      cached++;
      continue;
    }

    if (isDryRun) {
      console.log(`[SP2 DRY-RUN] slide ${slide.index} would ${hasKey ? 'call API' : 'placeholder'} → ${targetRel}`);
      continue;
    }

    if (!hasKey && !args.mock) {
      const p = writePlaceholderTo(targetAbs, {
        title, reason: reasonTextFromCode('no_key'), colors, width, height,
      });
      console.warn(`[SP2] ⚠ slide ${slide.index} placeholder: ${path.relative(deckDir, p)} (no key)`);
      patchAutoSrc(slidesPath, path.relative(deckDir, p));
      placeholder++;
      continue;
    }

    try {
      const buf = await client.generateImage({
        prompt: finalPrompt, width, height, apiKey, timeoutMs: 30000,
      });
      fs.mkdirSync(path.dirname(targetAbs), { recursive: true });
      fs.writeFileSync(targetAbs, buf);
      console.log(`[SP2] ✓ slide ${slide.index} (${slide.layout}) generated: ${targetRel}`);
      patchAutoSrc(slidesPath, targetRel);
      generated++;
    } catch (err) {
      const code = (err instanceof GeminiError) ? err.code : 'api';
      const p = writePlaceholderTo(targetAbs, {
        title, reason: reasonTextFromCode(code), colors, width, height,
      });
      console.warn(`[SP2] ⚠ slide ${slide.index} placeholder: ${path.relative(deckDir, p)} (${code}: ${err.message})`);
      patchAutoSrc(slidesPath, path.relative(deckDir, p));
      placeholder++;
    }
  }

  // Rewrite all src="public/..." references to src="/..." (Vite public-dir convention).
  // Covers auto-generated images, cached images, placeholders, and user-provided assets.
  if (!isDryRun) patchPublicSrcs(slidesPath);

  console.log(`[SP2] Summary: ${generated} generated, ${cached} cached, ${placeholder} placeholder, ${userProvided} user-provided`);
}

main().catch(err => {
  console.error(`[SP2] Fatal: ${err.message}`);
  process.exit(1);
});
