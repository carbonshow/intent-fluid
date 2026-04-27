#!/usr/bin/env node
// comparator.js — Diff two grader report JSON files and emit diff.md to stdout.
// Usage: node scripts/lib/comparator.js <report-a.json> <report-b.json>
// Exit 0 = no FAILs; exit 1 = at least one FAIL.
// Zero deps; Node 18+.

import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const [,, pathA, pathB] = process.argv;

if (!pathA || !pathB) {
  process.stderr.write('Usage: node comparator.js <report-a.json> <report-b.json>\n');
  process.exit(2);
}

function loadReport(p) {
  const abs = resolve(p);
  if (!existsSync(abs)) {
    process.stderr.write(`comparator.js: file not found: ${p}\n`);
    process.exit(2);
  }
  try {
    return JSON.parse(readFileSync(abs, 'utf8'));
  } catch (e) {
    process.stderr.write(`comparator.js: invalid JSON in ${p}: ${e.message}\n`);
    process.exit(2);
  }
}

const a = loadReport(pathA);
const b = loadReport(pathB);

// ── Change entries ────────────────────────────────────────────────────────────
// Each entry: { level: 'FAIL'|'WARN'|'INFO'|'PASS', field, aVal, bVal, note }
const changes = [];

function get(obj, dotPath) {
  return dotPath.split('.').reduce((o, k) => (o == null ? null : o[k]), obj);
}

function numChange(aVal, bVal) {
  if (aVal === bVal) return 0;
  if (typeof aVal === 'number' && typeof bVal === 'number') return bVal - aVal;
  return null;
}

// slides.total — INFO
{
  const av = get(a, 'slides.total');
  const bv = get(b, 'slides.total');
  const delta = numChange(av, bv);
  if (delta !== 0) {
    const sign = delta > 0 ? `+${delta}` : `${delta}`;
    changes.push({ level: 'INFO', field: 'slides.total', aVal: av, bVal: bv, note: `(${sign})` });
  }
}

// slides.by_layout.* — INFO on any change
{
  const aLayouts = get(a, 'slides.by_layout') || {};
  const bLayouts = get(b, 'slides.by_layout') || {};
  const allKeys = new Set([...Object.keys(aLayouts), ...Object.keys(bLayouts)]);
  for (const k of [...allKeys].sort()) {
    const av = aLayouts[k] || 0;
    const bv = bLayouts[k] || 0;
    if (av !== bv) {
      const delta = bv - av;
      const sign = delta > 0 ? `+${delta}` : `${delta}`;
      changes.push({ level: 'INFO', field: `slides.by_layout.${k}`, aVal: av, bVal: bv, note: `(${sign})` });
    }
  }
}

// images.placeholders — WARN if increased
{
  const av = get(a, 'images.placeholders') || 0;
  const bv = get(b, 'images.placeholders') || 0;
  if (bv > av) {
    changes.push({
      level: 'WARN', field: 'images.placeholders', aVal: av, bVal: bv,
      note: `(${bv - av} images fell back to SVG placeholder)`,
    });
  } else if (bv !== av) {
    changes.push({ level: 'INFO', field: 'images.placeholders', aVal: av, bVal: bv, note: '' });
  }
}

// images.missing — FAIL if any > 0
{
  const av = get(a, 'images.missing') || 0;
  const bv = get(b, 'images.missing') || 0;
  if (bv > 0) {
    changes.push({
      level: 'FAIL', field: 'images.missing', aVal: av, bVal: bv,
      note: `(${bv} image_path declared but file absent)`,
    });
  } else if (bv !== av) {
    changes.push({ level: 'INFO', field: 'images.missing', aVal: av, bVal: bv, note: '' });
  }
}

// validation.failed — FAIL if increased, PASS if decreased
{
  const av = get(a, 'validation.failed') || 0;
  const bv = get(b, 'validation.failed') || 0;
  if (bv > av) {
    changes.push({
      level: 'FAIL', field: 'validation.failed', aVal: av, bVal: bv,
      note: `(+${bv - av} new validation failures)`,
    });
  } else if (bv < av) {
    changes.push({
      level: 'PASS', field: 'validation.failed', aVal: av, bVal: bv,
      note: `(${av - bv} fewer failures)`,
    });
  }
}

// review.score — WARN if decreased >= 5, FAIL if decreased >= 15
{
  const av = get(a, 'review.score');
  const bv = get(b, 'review.score');
  if (typeof av === 'number' && typeof bv === 'number' && av !== bv) {
    const drop = av - bv;
    if (drop >= 15) {
      changes.push({
        level: 'FAIL', field: 'review.score', aVal: av, bVal: bv,
        note: `(dropped ${drop} points — significant regression)`,
      });
    } else if (drop >= 5) {
      changes.push({
        level: 'WARN', field: 'review.score', aVal: av, bVal: bv,
        note: `(dropped ${drop} points)`,
      });
    } else {
      changes.push({
        level: 'INFO', field: 'review.score', aVal: av, bVal: bv,
        note: `(${bv > av ? '+' : ''}${bv - av})`,
      });
    }
  }
}

// theme.name — INFO if changed
{
  const av = get(a, 'theme.name');
  const bv = get(b, 'theme.name');
  if (av !== bv) {
    changes.push({ level: 'INFO', field: 'theme.name', aVal: av, bVal: bv, note: '' });
  } else {
    changes.push({ level: 'INFO', field: 'theme.name', aVal: av, bVal: bv, note: '(unchanged)' });
  }
}

// ── Build output ─────────────────────────────────────────────────────────────
const failCount = changes.filter(c => c.level === 'FAIL').length;
const warnCount = changes.filter(c => c.level === 'WARN').length;
const infoCount = changes.filter(c => c.level === 'INFO' || c.level === 'PASS').length;

const lines = [];
lines.push('# Eval Comparator: A → B');
lines.push('');
lines.push('## Summary');
lines.push(`- FAILs: ${failCount}  WARNs: ${warnCount}  INFOs: ${infoCount}`);
lines.push('');
lines.push('## Changes');

// Order: FAIL first, then WARN, then PASS, then INFO
const order = ['FAIL', 'WARN', 'PASS', 'INFO'];
const sorted = [...changes].sort((x, y) => {
  const xi = order.indexOf(x.level);
  const yi = order.indexOf(y.level);
  return xi - yi;
});

for (const c of sorted) {
  const aStr = c.aVal === null ? 'null' : String(c.aVal);
  const bStr = c.bVal === null ? 'null' : String(c.bVal);
  const noteStr = c.note ? `  ${c.note}` : '';
  lines.push(`- ${c.level.padEnd(5)} ${c.field}: ${aStr} → ${bStr}${noteStr}`);
}

lines.push('');
lines.push('## Verdict');

if (failCount > 0) {
  lines.push(`FAIL — ${failCount} failure(s) detected; review required`);
} else if (warnCount > 0) {
  lines.push(`WARN — ${warnCount} warning(s); review recommended`);
} else {
  lines.push('OK — no regressions detected');
}
lines.push('');

process.stdout.write(lines.join('\n'));
process.exit(failCount > 0 ? 1 : 0);
