#!/usr/bin/env node
// analyzer.js — Map scenario expectations to grader report metrics and emit pre-filled result.md.
// Usage: node scripts/lib/analyzer.js <scenario-id> <report.json>
//   scenario-id: sp1-01 | sp1-02 | sp1-03 | sp2-01 | sp2-02 | sp2-03
// Output: result.md to stdout
// Does NOT run any shell commands. Zero deps; Node 18+.

import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const [,, scenarioId, reportPath] = process.argv;

if (!scenarioId || !reportPath) {
  process.stderr.write('Usage: node analyzer.js <scenario-id> <report.json>\n');
  process.stderr.write('  scenario-id: sp1-01 | sp1-02 | sp1-03 | sp2-01 | sp2-02 | sp2-03\n');
  process.exit(2);
}

const absReport = resolve(reportPath);
if (!existsSync(absReport)) {
  process.stderr.write(`analyzer.js: report not found: ${reportPath}\n`);
  process.exit(2);
}

let report;
try {
  report = JSON.parse(readFileSync(absReport, 'utf8'));
} catch (e) {
  process.stderr.write(`analyzer.js: invalid JSON: ${e.message}\n`);
  process.exit(2);
}

// ── Expectation definitions ────────────────────────────────────────────────────
// check: function(report) => true (PASS) | false (FAIL) | null (MANUAL)
// evidence: function(report) => string describing the evidence used
// For MANUAL items: check = null, evidence describes what to look for

const SCENARIOS = {
  'sp1-01': {
    title: 'SP1 Scenario 01 — Technical Talk',
    prompt: 'Explain the Rust async runtime scheduling strategy to a 15-person technical team, 40 minutes, go deep but don\'t be overly academic, style should fit modern tooling aesthetics.',
    expectations: [
      {
        id: 'E1',
        desc: 'Theme is tech-dark OR code-focus-light (must NOT be edu-warm or playful-bright)',
        check: r => {
          const name = r.theme && r.theme.name;
          if (!name) return null; // can't determine — MANUAL
          const forbidden = ['edu-warm', 'playful-bright'];
          const allowed = ['tech-dark', 'code-focus-light'];
          if (forbidden.includes(name)) return false;
          if (allowed.includes(name)) return true;
          return null; // unknown theme — MANUAL
        },
        evidence: r => {
          const name = r.theme && r.theme.name;
          return name ? `theme.name = "${name}"` : 'theme.name = null (check image-style.txt)';
        },
        autoGradable: true,
      },
      {
        id: 'E2',
        desc: 'If deck has ≥5 slides, agenda appears within the first 3 slides',
        check: r => {
          if (r.slides.total < 5) return true; // N/A
          const byLayout = r.slides.by_layout || {};
          return (byLayout['agenda'] || 0) >= 1;
        },
        evidence: r => `slides.total=${r.slides.total}, slides.by_layout.agenda=${(r.slides.by_layout || {})['agenda'] || 0}`,
        autoGradable: true,
      },
      {
        id: 'E3',
        desc: 'At least 3 slides use code-focus OR diagram-primary',
        check: r => {
          const bl = r.slides.by_layout || {};
          return ((bl['code-focus'] || 0) + (bl['diagram-primary'] || 0)) >= 3;
        },
        evidence: r => {
          const bl = r.slides.by_layout || {};
          return `code-focus=${bl['code-focus'] || 0}, diagram-primary=${bl['diagram-primary'] || 0}`;
        },
        autoGradable: true,
      },
      {
        id: 'E4',
        desc: 'At least 1 slide uses image-focus (screenshot/topology) OR big-statement (key conclusion)',
        check: r => {
          const bl = r.slides.by_layout || {};
          return ((bl['image-focus'] || 0) + (bl['big-statement'] || 0)) >= 1;
        },
        evidence: r => {
          const bl = r.slides.by_layout || {};
          return `image-focus=${bl['image-focus'] || 0}, big-statement=${bl['big-statement'] || 0}`;
        },
        autoGradable: true,
      },
      {
        id: 'E5',
        desc: 'section-divider present only if slide count > 20',
        check: r => {
          const bl = r.slides.by_layout || {};
          const hasDivider = (bl['section-divider'] || 0) > 0;
          if (r.slides.total > 20) return true; // allowed in either case
          return !hasDivider; // if ≤20 slides, no section-divider allowed
        },
        evidence: r => {
          const bl = r.slides.by_layout || {};
          return `slides.total=${r.slides.total}, section-divider count=${bl['section-divider'] || 0}`;
        },
        autoGradable: true,
      },
      {
        id: 'E6',
        desc: 'First slide is cover',
        check: r => {
          const bl = r.slides.by_layout || {};
          return (bl['cover'] || 0) >= 1;
        },
        evidence: r => {
          const bl = r.slides.by_layout || {};
          return `slides.by_layout.cover=${bl['cover'] || 0} (grader counts cover slides; position check is MANUAL via slides.md inspection)`;
        },
        autoGradable: true,
      },
      {
        id: 'E7',
        desc: 'If a closing slide exists, it uses layout: end (i.e., closing)',
        check: r => {
          const bl = r.slides.by_layout || {};
          return (bl['closing'] || 0) >= 1 || r.slides.total <= 3;
        },
        evidence: r => {
          const bl = r.slides.by_layout || {};
          return `slides.by_layout.closing=${bl['closing'] || 0}`;
        },
        autoGradable: true,
      },
      {
        id: 'E8',
        desc: 'validate-slides.sh Check 10 reports zero FAIL entries',
        check: r => r.validation.check10_failures.length === 0,
        evidence: r => {
          const f = r.validation.check10_failures;
          return f.length === 0
            ? 'validation.check10_failures = []'
            : `validation.check10_failures = ${JSON.stringify(f)}`;
        },
        autoGradable: true,
      },
      {
        id: 'E9',
        desc: 'run.sh dev renders the first 5 slides without visible overflow',
        check: null,
        evidence: () => 'MANUAL — requires visual browser inspection',
        autoGradable: false,
      },
      {
        id: 'E10',
        desc: 'Slide count falls between 10 and 25 (reasonable for 40 min)',
        check: r => r.slides.total >= 10 && r.slides.total <= 25,
        evidence: r => `slides.total=${r.slides.total}`,
        autoGradable: true,
      },
    ],
  },

  'sp1-02': {
    title: 'SP1 Scenario 02 — Executive Report',
    prompt: 'Q1 2026 product team periodic review for the VP, 10 minutes, highlight 3 key metrics.',
    expectations: [
      {
        id: 'E1',
        desc: 'Theme is corporate-navy OR minimal-exec',
        check: r => {
          const name = r.theme && r.theme.name;
          if (!name) return null;
          return ['corporate-navy', 'minimal-exec'].includes(name);
        },
        evidence: r => `theme.name="${r.theme && r.theme.name}"`,
        autoGradable: true,
      },
      {
        id: 'E2',
        desc: 'agenda appears within the first 3 slides',
        check: r => ((r.slides.by_layout || {})['agenda'] || 0) >= 1,
        evidence: r => `slides.by_layout.agenda=${(r.slides.by_layout || {})['agenda'] || 0}`,
        autoGradable: true,
      },
      {
        id: 'E3',
        desc: 'At least 1 slide uses three-metrics',
        check: r => ((r.slides.by_layout || {})['three-metrics'] || 0) >= 1,
        evidence: r => `slides.by_layout.three-metrics=${(r.slides.by_layout || {})['three-metrics'] || 0}`,
        autoGradable: true,
      },
      {
        id: 'E4',
        desc: 'At least 1 slide uses two-columns OR timeline-horizontal',
        check: r => {
          const bl = r.slides.by_layout || {};
          return ((bl['two-columns'] || 0) + (bl['timeline-horizontal'] || 0)) >= 1;
        },
        evidence: r => {
          const bl = r.slides.by_layout || {};
          return `two-columns=${bl['two-columns'] || 0}, timeline-horizontal=${bl['timeline-horizontal'] || 0}`;
        },
        autoGradable: true,
      },
      {
        id: 'E5',
        desc: 'At least 1 slide uses data-table OR big-statement',
        check: r => {
          const bl = r.slides.by_layout || {};
          return ((bl['data-table'] || 0) + (bl['big-statement'] || 0)) >= 1;
        },
        evidence: r => {
          const bl = r.slides.by_layout || {};
          return `data-table=${bl['data-table'] || 0}, big-statement=${bl['big-statement'] || 0}`;
        },
        autoGradable: true,
      },
      {
        id: 'E6',
        desc: 'Total slide count ≤ 15',
        check: r => r.slides.total <= 15,
        evidence: r => `slides.total=${r.slides.total}`,
        autoGradable: true,
      },
      {
        id: 'E7',
        desc: 'NO section-divider used (deck is ≤ 20)',
        check: r => ((r.slides.by_layout || {})['section-divider'] || 0) === 0,
        evidence: r => `slides.by_layout.section-divider=${(r.slides.by_layout || {})['section-divider'] || 0}`,
        autoGradable: true,
      },
      {
        id: 'E8',
        desc: 'Verbosity is concise or standard (NOT text-heavy)',
        check: r => r.text.avg_words_per_slide <= 80,
        evidence: r => `text.avg_words_per_slide=${r.text.avg_words_per_slide} (≤80 = concise/standard)`,
        autoGradable: true,
      },
      {
        id: 'E9',
        desc: 'First slide is cover; if closing exists, it is closing',
        check: r => {
          const bl = r.slides.by_layout || {};
          return (bl['cover'] || 0) >= 1;
        },
        evidence: r => {
          const bl = r.slides.by_layout || {};
          return `cover=${bl['cover'] || 0}, closing=${bl['closing'] || 0}`;
        },
        autoGradable: true,
      },
      {
        id: 'E10',
        desc: 'validate-slides.sh Check 10 reports zero FAIL entries',
        check: r => r.validation.check10_failures.length === 0,
        evidence: r => {
          const f = r.validation.check10_failures;
          return f.length === 0 ? 'check10_failures=[]' : JSON.stringify(f);
        },
        autoGradable: true,
      },
    ],
  },

  'sp1-03': {
    title: 'SP1 Scenario 03 — Educational Course',
    prompt: 'A first-year university course slide deck on "Data Structures intro: linked lists vs arrays", 45-minute lecture, students should be able to review it independently later.',
    expectations: [
      {
        id: 'E1',
        desc: 'Theme is edu-warm OR playful-bright',
        check: r => {
          const name = r.theme && r.theme.name;
          if (!name) return null;
          return ['edu-warm', 'playful-bright'].includes(name);
        },
        evidence: r => `theme.name="${r.theme && r.theme.name}"`,
        autoGradable: true,
      },
      {
        id: 'E2',
        desc: 'agenda appears within the first 3 slides (learning objectives)',
        check: r => ((r.slides.by_layout || {})['agenda'] || 0) >= 1,
        evidence: r => `slides.by_layout.agenda=${(r.slides.by_layout || {})['agenda'] || 0}`,
        autoGradable: true,
      },
      {
        id: 'E3',
        desc: 'Verbosity is text-heavy (course material)',
        check: r => r.text.avg_words_per_slide > 80,
        evidence: r => `text.avg_words_per_slide=${r.text.avg_words_per_slide} (>80 = text-heavy)`,
        autoGradable: true,
      },
      {
        id: 'E4',
        desc: 'At least 1 two-columns slide with bullets × bullets pattern (linked list vs array)',
        check: r => ((r.slides.by_layout || {})['two-columns'] || 0) >= 1,
        evidence: r => `slides.by_layout.two-columns=${(r.slides.by_layout || {})['two-columns'] || 0}`,
        autoGradable: true,
      },
      {
        id: 'E5',
        desc: 'At least 1 code-focus slide',
        check: r => ((r.slides.by_layout || {})['code-focus'] || 0) >= 1,
        evidence: r => `slides.by_layout.code-focus=${(r.slides.by_layout || {})['code-focus'] || 0}`,
        autoGradable: true,
      },
      {
        id: 'E6',
        desc: 'At least 1 of: image-focus OR image-text-split OR big-statement',
        check: r => {
          const bl = r.slides.by_layout || {};
          return ((bl['image-focus'] || 0) + (bl['image-text-split'] || 0) + (bl['big-statement'] || 0)) >= 1;
        },
        evidence: r => {
          const bl = r.slides.by_layout || {};
          return `image-focus=${bl['image-focus'] || 0}, image-text-split=${bl['image-text-split'] || 0}, big-statement=${bl['big-statement'] || 0}`;
        },
        autoGradable: true,
      },
      {
        id: 'E7',
        desc: 'If slides > 20, section-divider is allowed; if ≤ 20, no divider',
        check: r => {
          const bl = r.slides.by_layout || {};
          const hasDivider = (bl['section-divider'] || 0) > 0;
          if (r.slides.total > 20) return true;
          return !hasDivider;
        },
        evidence: r => {
          const bl = r.slides.by_layout || {};
          return `slides.total=${r.slides.total}, section-divider=${bl['section-divider'] || 0}`;
        },
        autoGradable: true,
      },
      {
        id: 'E8',
        desc: '≥30% of content slides use v-click',
        check: null,
        evidence: () => 'MANUAL — v-click count requires parsing body markup; not exposed in grader metrics',
        autoGradable: false,
      },
      {
        id: 'E9',
        desc: 'First slide is cover',
        check: r => ((r.slides.by_layout || {})['cover'] || 0) >= 1,
        evidence: r => `slides.by_layout.cover=${(r.slides.by_layout || {})['cover'] || 0}`,
        autoGradable: true,
      },
      {
        id: 'E10',
        desc: 'validate-slides.sh Check 10 reports zero FAIL entries',
        check: r => r.validation.check10_failures.length === 0,
        evidence: r => {
          const f = r.validation.check10_failures;
          return f.length === 0 ? 'check10_failures=[]' : JSON.stringify(f);
        },
        autoGradable: true,
      },
    ],
  },

  'sp2-01': {
    title: 'SP2 Scenario 01 — image-focus layout (--mock success + user-override)',
    prompt: 'Make a 7-slide product-vision pitch for our internal engineering team — "unify our build and deploy story in 2026". Include two image-focus slides.',
    expectations: [
      {
        id: 'E1',
        desc: 'Deck contains exactly 2 slides with class: image-focus (one auto, one override)',
        check: r => ((r.slides.by_layout || {})['image-focus'] || 0) === 2,
        evidence: r => `slides.by_layout.image-focus=${(r.slides.by_layout || {})['image-focus'] || 0}`,
        autoGradable: true,
      },
      {
        id: 'E2',
        desc: 'Every image-* slide has a valid image_prompt (Check 11 passes: 3 OK)',
        check: r => r.validation.check11_failures.length === 0,
        evidence: r => {
          const f = r.validation.check11_failures;
          return f.length === 0 ? 'check11_failures=[]' : JSON.stringify(f);
        },
        autoGradable: true,
      },
      {
        id: 'E3',
        desc: 'image_path fields comply: one slide omitted (auto), one points to public/hero.jpg which exists',
        check: r => r.images.missing === 0,
        evidence: r => `images.missing=${r.images.missing}, images.user_provided=${r.images.user_provided}`,
        autoGradable: true,
      },
      {
        id: 'E4',
        desc: 'validate-slides.sh reports 0 FAIL, 0 WARN',
        check: r => r.validation.failed === 0 && r.validation.warnings === 0,
        evidence: r => `validation.failed=${r.validation.failed}, validation.warnings=${r.validation.warnings}`,
        autoGradable: true,
      },
      {
        id: 'E5',
        desc: 'generate-images.sh --mock success exits 0',
        check: null,
        evidence: () => 'MANUAL — requires running generate-images.sh and checking exit code in shell transcript',
        autoGradable: false,
      },
      {
        id: 'E6',
        desc: 'public/generated/ contains exactly 1 PNG, 0 SVG',
        check: r => r.images.auto_generated >= 1 && r.images.placeholders === 0,
        evidence: r => `images.auto_generated=${r.images.auto_generated}, images.placeholders=${r.images.placeholders}`,
        autoGradable: true,
      },
      {
        id: 'E7',
        desc: 'Summary: 1 generated, 0 cached, 0 placeholder, 1 user-provided',
        check: null,
        evidence: () => 'MANUAL — requires checking generate.log for [SP2] Summary line',
        autoGradable: false,
      },
      {
        id: 'E8',
        desc: 'hero.jpg byte-identical before and after the pipeline run',
        check: null,
        evidence: () => 'MANUAL — requires sha256sum comparison of hero.sha256.before vs hero.sha256.after',
        autoGradable: false,
      },
      {
        id: 'E9',
        desc: 'run.sh build exit=0 and dist/index.html exists',
        check: null,
        evidence: () => 'MANUAL — requires running run.sh build and checking exit code + dist/',
        autoGradable: false,
      },
      {
        id: 'E10',
        desc: 'test-sp2-static.sh reports 17 passed, 0 failed',
        check: null,
        evidence: () => 'MANUAL — requires running test-sp2-static.sh and checking final line',
        autoGradable: false,
      },
    ],
  },

  'sp2-02': {
    title: 'SP2 Scenario 02 — image-text-split layout (no-key / placeholder path)',
    prompt: 'Produce an 8-slide architecture intro for a new engineering manager: "How our event pipeline handles 1B events/day".',
    expectations: [
      {
        id: 'E1',
        desc: 'Deck contains 3 image-text-split slides (layout: image-left or image-right)',
        check: r => ((r.slides.by_layout || {})['image-text-split'] || 0) === 3,
        evidence: r => `slides.by_layout.image-text-split=${(r.slides.by_layout || {})['image-text-split'] || 0}`,
        autoGradable: true,
      },
      {
        id: 'E2',
        desc: 'Every image-* slide has a valid image_prompt (Check 11 passes)',
        check: r => r.validation.check11_failures.length === 0,
        evidence: r => `check11_failures=${JSON.stringify(r.validation.check11_failures)}`,
        autoGradable: true,
      },
      {
        id: 'E3',
        desc: 'No image_path overrides used; all images are auto',
        check: r => r.images.user_provided === 0 && r.images.missing === 0,
        evidence: r => `images.user_provided=${r.images.user_provided}, images.missing=${r.images.missing}`,
        autoGradable: true,
      },
      {
        id: 'E4',
        desc: 'validate-slides.sh reports 0 FAIL, 0 WARN',
        check: r => r.validation.failed === 0 && r.validation.warnings === 0,
        evidence: r => `validation.failed=${r.validation.failed}, validation.warnings=${r.validation.warnings}`,
        autoGradable: true,
      },
      {
        id: 'E5',
        desc: 'generate-images.sh exits 0 even with no key',
        check: null,
        evidence: () => 'MANUAL — requires running generate-images.sh with no key and checking exit code',
        autoGradable: false,
      },
      {
        id: 'E6',
        desc: 'public/generated/ contains 0 PNG, 3 SVG',
        check: r => r.images.placeholders === 3 && r.images.auto_generated >= 3,
        evidence: r => `images.placeholders=${r.images.placeholders}, images.auto_generated=${r.images.auto_generated}`,
        autoGradable: true,
      },
      {
        id: 'E7',
        desc: 'Summary line: 0 generated, 0 cached, 3 placeholder, 0 user-provided',
        check: null,
        evidence: () => 'MANUAL — requires checking generate.log for [SP2] Summary line',
        autoGradable: false,
      },
      {
        id: 'E8',
        desc: 'Key-setup hint line is present in stdout',
        check: null,
        evidence: () => 'MANUAL — requires grepping generate.log for "GEMINI_API_KEY not set"',
        autoGradable: false,
      },
      {
        id: 'E9',
        desc: 'run.sh build exit=0 and dist/index.html exists',
        check: null,
        evidence: () => 'MANUAL — requires running run.sh build',
        autoGradable: false,
      },
      {
        id: 'E10',
        desc: 'test-sp2-static.sh reports 17 passed, 0 failed',
        check: null,
        evidence: () => 'MANUAL — requires running test-sp2-static.sh',
        autoGradable: false,
      },
    ],
  },

  'sp2-03': {
    title: 'SP2 Scenario 03 — two-columns.image layout (--mock content_policy + cache-hit)',
    prompt: 'First-year DS course slide deck: "linked lists vs arrays, a visual comparison". Use two side-by-side illustrations.',
    expectations: [
      {
        id: 'E1',
        desc: 'Deck contains 2 two-cols-header slides with at least one column pattern: image each (total 3 image columns)',
        check: r => ((r.slides.by_layout || {})['two-columns'] || 0) === 2,
        evidence: r => `slides.by_layout.two-columns=${(r.slides.by_layout || {})['two-columns'] || 0}`,
        autoGradable: true,
      },
      {
        id: 'E2',
        desc: 'Every image-column has a valid image_prompt (Check 11 passes)',
        check: r => r.validation.check11_failures.length === 0,
        evidence: r => `check11_failures=${JSON.stringify(r.validation.check11_failures)}`,
        autoGradable: true,
      },
      {
        id: 'E3',
        desc: 'No image_path overrides used',
        check: r => r.images.user_provided === 0 && r.images.missing === 0,
        evidence: r => `images.user_provided=${r.images.user_provided}, images.missing=${r.images.missing}`,
        autoGradable: true,
      },
      {
        id: 'E4',
        desc: 'validate-slides.sh reports 0 FAIL, 0 WARN',
        check: r => r.validation.failed === 0 && r.validation.warnings === 0,
        evidence: r => `validation.failed=${r.validation.failed}, validation.warnings=${r.validation.warnings}`,
        autoGradable: true,
      },
      {
        id: 'E5',
        desc: 'Both generate-images.sh rounds exit 0',
        check: null,
        evidence: () => 'MANUAL — requires running both round-1 and round-2 and checking exit codes',
        autoGradable: false,
      },
      {
        id: 'E6',
        desc: 'After round 1, public/generated/ contains 0 PNG, 3 SVG, and stays identical after round 2',
        check: r => r.images.placeholders >= 2 && r.images.auto_generated >= 3,
        evidence: r => `images.placeholders=${r.images.placeholders} (SVG count), images.auto_generated=${r.images.auto_generated}`,
        autoGradable: true,
      },
      {
        id: 'E7',
        desc: 'Round 1 Summary = 0 generated, 0 cached, 3 placeholder, 0 user-provided',
        check: null,
        evidence: () => 'MANUAL — requires generate-round1.log',
        autoGradable: false,
      },
      {
        id: 'E8',
        desc: 'Round 2 Summary = 0 generated, 3 cached, 0 placeholder, 0 user-provided',
        check: null,
        evidence: () => 'MANUAL — requires generate-round2.log',
        autoGradable: false,
      },
      {
        id: 'E9',
        desc: 'run.sh build exit=0 and dist/index.html exists',
        check: null,
        evidence: () => 'MANUAL — requires running run.sh build',
        autoGradable: false,
      },
      {
        id: 'E10',
        desc: 'test-sp2-static.sh reports 17 passed, 0 failed',
        check: null,
        evidence: () => 'MANUAL — requires running test-sp2-static.sh',
        autoGradable: false,
      },
    ],
  },
};

// ── Resolve scenario ──────────────────────────────────────────────────────────
const scenario = SCENARIOS[scenarioId];
if (!scenario) {
  process.stderr.write(`analyzer.js: unknown scenario-id: ${scenarioId}\n`);
  process.stderr.write(`  Known: ${Object.keys(SCENARIOS).join(', ')}\n`);
  process.exit(2);
}

// ── Grade each expectation ────────────────────────────────────────────────────
const results = [];
let autoGraded = 0;
let autoGradable = 0;

for (const exp of scenario.expectations) {
  if (exp.autoGradable) autoGradable++;
  let passed = null;
  let label = '';

  if (exp.check === null) {
    label = '[ ] MANUAL';
    passed = null;
  } else {
    try {
      const result = exp.check(report);
      if (result === null) {
        label = '[ ] MANUAL';
        passed = null;
      } else if (result === true) {
        label = '[x] AUTO-PASS';
        passed = true;
        autoGraded++;
      } else {
        label = '[x] AUTO-FAIL';
        passed = false;
        autoGraded++;
      }
    } catch (e) {
      label = '[ ] MANUAL';
      passed = null;
    }
  }

  const evidenceStr = exp.evidence(report);
  results.push({ id: exp.id, desc: exp.desc, label, passed, evidenceStr, autoGradable: exp.autoGradable });
}

// ── Emit result.md ────────────────────────────────────────────────────────────
const lines = [];
const ts = new Date().toISOString().slice(0, 10);

lines.push(`# ${scenario.title} — Result`);
lines.push('');
lines.push(`**Date:** ${ts}  `);
lines.push(`**Report:** ${absReport}  `);
lines.push(`**Auto-graded:** ${autoGraded} / ${autoGradable} auto-gradable (${scenario.expectations.length} total)`);
lines.push('');
lines.push('---');
lines.push('');
lines.push('## Expectations');
lines.push('');

for (const r of results) {
  const check = r.passed === true ? '✅' : r.passed === false ? '❌' : '[ ]';
  const manualNote = r.label.includes('MANUAL') ? ' _(MANUAL)_' : ` _(${r.label})_`;
  lines.push(`- ${check} **${r.id}** ${r.desc}${manualNote}`);
  lines.push(`  - Evidence: ${r.evidenceStr}`);
}

lines.push('');
lines.push('---');
lines.push('');
lines.push('## Score');

const autoPass = results.filter(r => r.passed === true).length;
const autoFail = results.filter(r => r.passed === false).length;
const manual = results.filter(r => r.passed === null).length;
const totalChecked = autoPass + autoFail;

lines.push('');
lines.push(`- Auto-graded: ${autoPass} pass, ${autoFail} fail (of ${autoGradable} auto-gradable)`);
lines.push(`- MANUAL items remaining: ${manual}`);
lines.push(`- Total checked: ${totalChecked} / ${scenario.expectations.length}`);
lines.push('');
lines.push('_Fill in MANUAL items by running the steps in scenario.md._');
lines.push('');

process.stdout.write(lines.join('\n'));
