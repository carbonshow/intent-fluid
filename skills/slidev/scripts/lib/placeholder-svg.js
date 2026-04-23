// placeholder-svg.js — Render theme-aware SVG when image generation fails.
// Output: self-contained SVG string; caller writes to disk as .svg.
// Consumed by generate-images.js when GEMINI_API_KEY is missing or the API errors.

function xmlEscape(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function renderPlaceholder({ title = '', reason = '', colors, width, height }) {
  const { bg, text, accent } = colors;
  const titleSafe = xmlEscape(title.trim());
  const reasonSafe = xmlEscape(reason.trim());

  const cx = width / 2;
  const cy = height / 2;
  const titleY = cy - 40;
  const lineY = cy + 10;
  const lineHalf = Math.min(180, width * 0.15);
  const reasonY = cy + 70;

  const titleFontSize = Math.round(Math.min(width, height) * 0.045);
  const reasonFontSize = Math.round(Math.min(width, height) * 0.022);

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">`,
    `<rect width="${width}" height="${height}" fill="${xmlEscape(bg)}"/>`,
    titleSafe
      ? `<text x="${cx}" y="${titleY}" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="${titleFontSize}" font-weight="600" fill="${xmlEscape(text)}">${titleSafe}</text>`
      : '',
    `<line x1="${cx - lineHalf}" y1="${lineY}" x2="${cx + lineHalf}" y2="${lineY}" stroke="${xmlEscape(accent)}" stroke-width="2"/>`,
    `<text x="${cx}" y="${reasonY}" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="${reasonFontSize}" font-weight="400" fill="${xmlEscape(text)}" opacity="0.7">Image unavailable${reasonSafe ? ' · ' + reasonSafe : ''}</text>`,
    `</svg>`,
  ].filter(Boolean).join('\n');
}
