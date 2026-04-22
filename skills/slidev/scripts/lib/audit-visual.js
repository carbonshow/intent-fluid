#!/usr/bin/env node
/**
 * audit-visual.js — Playwright-driven visual audit of Slidev decks.
 *
 * For every (theme, layout) in THEMES × LAYOUTS:
 *   1. Generate a minimal test deck demonstrating the layout
 *   2. Start Slidev dev server
 *   3. Navigate to the demo slide, screenshot
 *   4. Assert: no overflow, roughly centered, h1 font-size in range,
 *      three-metrics row alignment
 *
 * Usage: node audit-visual.js <skill_root>
 * Output: <skill_root>/evals/visual-audit/<timestamp>/{png, report.json}
 * Exit 0 = all pass, 1 = any fail
 */

const { chromium } = require('playwright');
const { spawn, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const THEMES = [
  'tech-dark', 'code-focus-light', 'corporate-navy',
  'minimal-exec', 'edu-warm', 'playful-bright'
];

// Per-layout minimal demo content
const LAYOUT_DEMOS = {
  'cover': {
    fm: 'layout: cover\nclass: skeleton-hero',
    body: '# Demo Title\n\nSubtitle line'
  },
  'agenda': {
    fm: 'layout: default\nclass: skeleton-list agenda',
    body: '# Agenda\n\n<div class="content">\n\n1. Intro\n2. Middle\n3. End\n\n</div>'
  },
  'section-divider': {
    fm: 'layout: section\nclass: skeleton-hero',
    body: '# Section Break'
  },
  'content-bullets': {
    fm: 'layout: default\nclass: skeleton-list content-bullets',
    body: '# Bullets\n\n<div class="content">\n\n- One\n- Two\n- Three\n\n</div>'
  },
  'content-narrative': {
    fm: 'layout: default\nclass: skeleton-list content-narrative',
    body: '# Narrative\n\n<div class="content">\n\nA paragraph of text that explains the idea.\n\n</div>'
  },
  'two-columns': {
    fm: 'layout: two-cols-header\nclass: two-columns\nleft:\n  pattern: bullets\n  items: [a, b, c]\nright:\n  pattern: bullets\n  items: [x, y, z]',
    body: '# Two Columns\n\n::left::\n\n<div class="pattern-bullets">\n\n- a\n- b\n- c\n\n</div>\n\n::right::\n\n<div class="pattern-bullets">\n\n- x\n- y\n- z\n\n</div>'
  },
  'three-metrics': {
    fm: 'layout: default\nclass: skeleton-data three-metrics',
    body: '# Metrics\n\n<div class="data-body">\n\n<div class="metrics-row">\n  <div class="metric"><div class="metric-value">42</div><div class="metric-caption">A</div></div>\n  <div class="metric"><div class="metric-value">88</div><div class="metric-caption">B</div></div>\n  <div class="metric"><div class="metric-value">99</div><div class="metric-caption">C</div></div>\n</div>\n\n</div>'
  },
  'data-table': {
    fm: 'layout: default\nclass: skeleton-data data-table',
    body: '# Data\n\n<div class="data-body">\n\n| Col1 | Col2 |\n|---|---|\n| a | 1 |\n| b | 2 |\n\n</div>'
  },
  'timeline-horizontal': {
    fm: 'layout: default\nclass: skeleton-data timeline-horizontal',
    body: '# Timeline\n\n<div class="data-body">\n\n<div class="timeline">\n  <div class="node"><div class="node-label">Q1</div></div>\n  <div class="node"><div class="node-label">Q2</div></div>\n  <div class="node"><div class="node-label">Q3</div></div>\n</div>\n\n</div>'
  },
  'code-focus': {
    fm: 'layout: default\nclass: skeleton-code-diagram code-focus',
    body: '# Code\n\n<div class="content-body">\n\n```javascript\nconst x = 42;\n```\n\n</div>'
  },
  'diagram-primary': {
    fm: 'layout: default\nclass: skeleton-code-diagram diagram-primary',
    body: '# Diagram\n\n<div class="content-body">\n\n```mermaid\nflowchart LR\n  A --> B\n```\n\n</div>\n\n<div class="caption">A flow</div>'
  },
  'image-focus': {
    fm: 'layout: default\nclass: image-focus',
    body: '<div class="image-wrapper"><img src="https://placehold.co/1920x1080" alt="placeholder" /></div>\n\n# Image Focus\n\n<div class="caption">Caption</div>'
  },
  'image-text-split': {
    fm: 'layout: image-left\nimage: https://placehold.co/960x1080\nclass: image-text-split',
    body: '# Split\n\nText on the right side.\n\n<div class="caption">Caption</div>'
  },
  'big-statement': {
    fm: 'layout: center\nclass: skeleton-hero big-statement',
    body: '<div class="statement">One bold idea.</div>'
  },
  'closing': {
    fm: 'layout: end\nclass: skeleton-hero',
    body: '# Thank You\n\nQuestions?'
  }
};

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function auditOne(theme, layout, scratchDir, outDir, skillRoot) {
  const deckDir = path.join(scratchDir, `${theme}_${layout}`);
  const newPres = path.join(skillRoot, 'scripts/new-presentation.sh');

  spawnSync('bash', [newPres, deckDir, '--theme', theme, '--title', `Audit ${theme}/${layout}`],
            { stdio: 'pipe' });

  const demo = LAYOUT_DEMOS[layout];
  const slides = `---
title: ${layout} audit
colorSchema: light
highlighter: shiki
---

# ${layout} / ${theme}

---
${demo.fm}
---

${demo.body}
`;
  fs.writeFileSync(path.join(deckDir, 'slides.md'), slides);

  const port = 4000 + Math.floor(Math.random() * 500);
  const runSh = path.join(skillRoot, 'scripts/run.sh');
  const server = spawn('bash', [runSh, 'dev', path.join(deckDir, 'slides.md'), '--port', String(port)],
                       { stdio: 'pipe', detached: true });
  let serverReady = false;
  server.stdout.on('data', (d) => {
    if (d.toString().includes('http://localhost:')) serverReady = true;
  });
  const start = Date.now();
  while (!serverReady && Date.now() - start < 45000) await sleep(200);
  if (!serverReady) {
    try { process.kill(-server.pid); } catch (e) {}
    return { theme, layout, status: 'ERROR', errors: ['dev server did not start within 45s'] };
  }
  await sleep(1500);  // extra settle time for slow vite compilation

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  const errors = [];
  try {
    await page.goto(`http://localhost:${port}/2`, { waitUntil: 'domcontentloaded', timeout: 40000 });
    await page.waitForSelector('.slidev-layout', { timeout: 10000, state: 'attached' });
    await sleep(1500);

    // Slidev dev server renders all slides into the DOM; we need the currently
    // visible one. Pick the .slidev-layout whose bounding box is non-empty and
    // visible in the viewport.
    const visibleSlideHandle = await page.evaluateHandle(() => {
      const all = document.querySelectorAll('.slidev-layout');
      for (const el of all) {
        const r = el.getBoundingClientRect();
        const style = getComputedStyle(el);
        if (r.width > 100 && r.height > 100 &&
            style.visibility !== 'hidden' && style.display !== 'none' &&
            style.opacity !== '0') {
          return el;
        }
      }
      return all[all.length - 1] || null;  // fallback to last (often the demo)
    });

    // Assertion 1: no child element overflows the visible slide bounds
    const overflow = await page.evaluate((slideEl) => {
      if (!slideEl) return 'no visible slide';
      const lr = slideEl.getBoundingClientRect();
      for (const el of slideEl.querySelectorAll('*')) {
        const r = el.getBoundingClientRect();
        if (r.width === 0 && r.height === 0) continue;
        if (r.right > lr.right + 2 || r.bottom > lr.bottom + 2) {
          return `${el.tagName}.${(el.className || '').toString().slice(0, 40)} overflows`;
        }
      }
      return null;
    }, visibleSlideHandle);
    if (overflow) errors.push(`overflow: ${overflow}`);

    // Assertion 2: vertical centering (skip hero + image-focus)
    if (!['cover', 'section-divider', 'big-statement', 'closing', 'image-focus'].includes(layout)) {
      const dev = await page.evaluate((slideEl) => {
        if (!slideEl) return 0;
        const kids = Array.from(slideEl.children).filter(c => c.offsetHeight > 0);
        if (kids.length === 0) return 0;
        const lr = slideEl.getBoundingClientRect();
        const centers = kids.map(c => { const r = c.getBoundingClientRect(); return (r.top + r.bottom) / 2; });
        const avgCenter = centers.reduce((a, b) => a + b, 0) / centers.length;
        const layoutCenter = (lr.top + lr.bottom) / 2;
        return Math.abs(avgCenter - layoutCenter) / lr.height;
      }, visibleSlideHandle);
      if (dev > 0.3) errors.push(`vertical off-center ${Math.round(dev * 100)}%`);
    }

    // Assertion 3: h1 font-size in sensible range
    const h1Size = await page.evaluate((slideEl) => {
      if (!slideEl) return null;
      const h1 = slideEl.querySelector('h1');
      return h1 ? parseFloat(getComputedStyle(h1).fontSize) : null;
    }, visibleSlideHandle);
    if (h1Size !== null && (h1Size < 35 || h1Size > 140)) {
      errors.push(`h1 font-size ${h1Size}px out of [35, 140]`);
    }

    // Assertion 4: three-metrics row alignment
    if (layout === 'three-metrics') {
      const misalign = await page.evaluate((slideEl) => {
        if (!slideEl) return 'no visible slide';
        const items = slideEl.querySelectorAll('.metric');
        if (items.length === 0) return 'no .metric elements';
        const tops = Array.from(items).map(i => i.getBoundingClientRect().top);
        const diff = Math.max(...tops) - Math.min(...tops);
        return diff > 4 ? `metric tops vary ${diff.toFixed(1)}px` : null;
      }, visibleSlideHandle);
      if (misalign) errors.push(misalign);
    }

    await page.screenshot({ path: path.join(outDir, `${theme}_${layout}.png`), fullPage: false });
  } catch (e) {
    errors.push(`page error: ${e.message}`);
  } finally {
    await browser.close();
    try { process.kill(-server.pid); } catch (e) {}
  }

  return {
    theme, layout,
    status: errors.length === 0 ? 'PASS' : 'FAIL',
    errors
  };
}

async function main() {
  const skillRoot = process.argv[2] || path.resolve(__dirname, '../..');
  const onlyArg = process.argv.indexOf('--only');
  const only = onlyArg >= 0 ? process.argv[onlyArg + 1] : null;  // format: "theme/layout"
  const ts = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').slice(0, 19);
  const outDir = path.join(skillRoot, 'evals', 'visual-audit', ts);
  fs.mkdirSync(outDir, { recursive: true });
  const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'sp1v2-audit-'));

  const layouts = Object.keys(LAYOUT_DEMOS);
  const results = [];
  const pairs = [];
  for (const theme of THEMES) {
    for (const layout of layouts) {
      if (only) {
        const [t, l] = only.split('/');
        if (theme !== t || layout !== l) continue;
      }
      pairs.push([theme, layout]);
    }
  }
  for (const [theme, layout] of pairs) {
    process.stderr.write(`  ${theme} × ${layout}... `);
    const r = await auditOne(theme, layout, scratch, outDir, skillRoot);
    results.push(r);
    process.stderr.write(`${r.status}${r.errors.length ? ' (' + r.errors.join('; ') + ')' : ''}\n`);
  }

  fs.writeFileSync(path.join(outDir, 'report.json'), JSON.stringify({ results }, null, 2));
  fs.rmSync(scratch, { recursive: true, force: true });

  const failures = results.filter(r => r.status !== 'PASS');
  console.log(`\nVisual audit: ${results.length - failures.length}/${results.length} PASS`);
  console.log(`Report: ${path.relative(process.cwd(), outDir)}/report.json`);
  process.exit(failures.length === 0 ? 0 : 1);
}

main().catch(e => { console.error(e); process.exit(2); });
