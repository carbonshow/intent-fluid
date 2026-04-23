#!/usr/bin/env node
import { renderPlaceholder } from './placeholder-svg.js';

const assert = (cond, msg) => {
  if (!cond) { console.error('FAIL:', msg); process.exit(1); }
  console.log('PASS:', msg);
};

const svg = renderPlaceholder({
  title: 'Our Vision',
  reason: 'API key not set',
  colors: { bg: '#0B1220', text: '#E5E7EB', accent: '#C084FC' },
  width: 1600,
  height: 900,
});

// Structural checks
assert(svg.startsWith('<svg '), 'starts with <svg');
assert(svg.includes('xmlns="http://www.w3.org/2000/svg"'), 'has xmlns');
assert(svg.includes('viewBox="0 0 1600 900"'), 'has viewBox');
assert(svg.endsWith('</svg>'), 'ends with </svg>');

// Content checks
assert(svg.includes('#0B1220'), 'bg color present');
assert(svg.includes('#E5E7EB'), 'text color present');
assert(svg.includes('#C084FC'), 'accent color present');
assert(svg.includes('Our Vision'), 'title present');
assert(svg.includes('API key not set'), 'reason present');
assert(svg.includes('Image unavailable'), 'standard label present');

// XML escaping
const svg2 = renderPlaceholder({
  title: 'A & B <see>',
  reason: 'ok',
  colors: { bg: '#000', text: '#fff', accent: '#888' },
  width: 800,
  height: 900,
});
assert(svg2.includes('A &amp; B &lt;see&gt;'), 'title XML-escaped');
assert(!svg2.includes('<see>'), 'no raw < in title');

// Empty title
const svg3 = renderPlaceholder({
  title: '',
  reason: 'ok',
  colors: { bg: '#000', text: '#fff', accent: '#888' },
  width: 1600,
  height: 900,
});
assert(svg3.includes('viewBox="0 0 1600 900"'), 'empty title still renders');

console.log('\nAll assertions passed.');
