#!/usr/bin/env node
import { extractThemeColors } from './theme-colors.js';

const assert = (cond, msg) => {
  if (!cond) { console.error('FAIL:', msg); process.exit(1); }
  console.log('PASS:', msg);
};

// Test 1: tech-dark style CSS — hex colors
const techDark = `
:root {
  --color-primary: #7DD3FC;
  --color-accent:  #C084FC;
  --color-text:    #E5E7EB;
  --color-bg:      #0B1220;
  --color-muted:   #9CA3AF;
}
`;
const t1 = extractThemeColors(techDark);
assert(t1.bg === '#0B1220', `tech-dark bg: got ${t1.bg}`);
assert(t1.text === '#E5E7EB', `tech-dark text: got ${t1.text}`);
assert(t1.accent === '#C084FC', `tech-dark accent: got ${t1.accent}`);
assert(t1.fallback === false, 'tech-dark no fallback');

// Test 2: rgb() / rgba() values
const rgbCss = `
:root {
  --color-bg: rgb(20, 30, 40);
  --color-text: rgba(255, 255, 255, 0.9);
  --color-accent: rgb(192, 132, 252);
}
`;
const t2 = extractThemeColors(rgbCss);
assert(t2.bg === 'rgb(20, 30, 40)', `rgb bg: got ${t2.bg}`);
assert(t2.accent === 'rgb(192, 132, 252)', `rgb accent: got ${t2.accent}`);
assert(t2.fallback === false, 'rgb no fallback');

// Test 3: missing tokens → fallback defaults
const partial = `
:root {
  --color-text: #fff;
}
`;
const t3 = extractThemeColors(partial);
assert(t3.fallback === true, 'partial triggers fallback');
assert(t3.bg === '#f5f5f5' && t3.text === '#222' && t3.accent === '#888',
       'fallback returns safe defaults');

// Test 4: empty input
const t4 = extractThemeColors('');
assert(t4.fallback === true, 'empty triggers fallback');
assert(t4.bg === '#f5f5f5', 'empty returns default bg');

// Test 5: null / non-string input
const t5 = extractThemeColors(null);
assert(t5.fallback === true, 'null triggers fallback');

// Test 6: no :root block
const noRoot = `
body { color: red; }
`;
const t6 = extractThemeColors(noRoot);
assert(t6.fallback === true, 'no :root triggers fallback');

console.log('\nAll assertions passed.');
