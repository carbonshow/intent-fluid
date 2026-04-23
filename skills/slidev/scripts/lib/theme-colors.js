// theme-colors.js — Extract placeholder-relevant color tokens from theme CSS.
// We look for --color-bg, --color-text, --color-accent inside the first :root block.
// On any parse failure (missing tokens, malformed), return safe defaults.
// Used by placeholder-svg.js when a generated image must be replaced with a fallback.

const DEFAULTS = { bg: '#f5f5f5', text: '#222', accent: '#888' };

export function extractThemeColors(cssText) {
  if (!cssText || typeof cssText !== 'string' || cssText.trim() === '') {
    return { ...DEFAULTS, fallback: true };
  }

  // Grab the first :root block body
  const rootMatch = cssText.match(/:root\s*\{([^}]*)\}/);
  if (!rootMatch) return { ...DEFAULTS, fallback: true };
  const body = rootMatch[1];

  const readToken = (name) => {
    // Pattern: --name: <value>; — value may contain parentheses (rgb/rgba).
    const re = new RegExp(`--${name}:\\s*([^;]+);`, 'm');
    const m = body.match(re);
    return m ? m[1].trim() : null;
  };

  const bg = readToken('color-bg');
  const text = readToken('color-text');
  const accent = readToken('color-accent');

  if (bg && text && accent) {
    return { bg, text, accent, fallback: false };
  }
  return { ...DEFAULTS, fallback: true };
}
