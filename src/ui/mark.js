// The Ligant mark — "Council · Ringed" (Brand Guidelines v1.1 §03).
// The ring is the table, the six dots are the agents, the amber centre is the
// human who decides. Drawn inline as SVG: the zero-third-party-request rule
// (C3-NF-01 and the brand's own published claim) forbids an asset CDN, and an
// inline drawing also survives greyscale printing on the bench sheet.
//
// Construction is fixed. The tile is never recoloured, rotated, stretched, and
// the centre is never changed (§03 misuse). Tile corner radius 22% of width.
// Minimum sizes: 16px favicon, 24px in UI, 120px wide for the lockup.

const TEAL = '#0D7C66';       // §04 approved ground, primary
const OFF_WHITE = '#FAF7F2';  // ring and dots
const GOLD = '#E0A416';       // the single sanctioned brightening, for small-form punch (§04)

/** Six agents at 60° intervals, starting at the top of the table. */
function dots(cx, cy, r, dotR) {
  let out = '';
  for (let i = 0; i < 6; i++) {
    const a = (-90 + i * 60) * (Math.PI / 180);
    out += `<circle cx="${(cx + r * Math.cos(a)).toFixed(3)}" cy="${(cy + r * Math.sin(a)).toFixed(3)}" r="${dotR}" fill="${OFF_WHITE}"/>`;
  }
  return out;
}

/**
 * The mark on its tile, as an SVG string.
 * @param {number} size rendered size in px (>= 24 in UI, >= 16 for a favicon)
 * @param {string} title accessible name, or '' when the name sits beside it
 */
export function markSvg(size = 28, title = '') {
  const label = title ? `<title>${title}</title>` : '';
  const role = title ? 'img' : 'presentation';
  return `<svg class="ligant-mark" width="${size}" height="${size}" viewBox="0 0 64 64" role="${role}"${title ? '' : ' aria-hidden="true"'} focusable="false">${label}`
    + `<rect width="64" height="64" rx="14.08" fill="${TEAL}"/>`
    + `<circle cx="32" cy="32" r="19" fill="none" stroke="${OFF_WHITE}" stroke-width="2.4"/>`
    + dots(32, 32, 19, 3.6)
    + `<circle cx="32" cy="32" r="5.4" fill="${GOLD}"/>`
    + `</svg>`;
}

/** Horizontal lockup — mark + "Ligant". The default for headers (§03). */
export function lockupHtml(size = 28) {
  return `<span class="ligant-lockup">${markSvg(size, '')}<span class="ligant-wordmark">Ligant</span></span>`;
}

/** The mark alone as a data URI, for the favicon (no network request). */
export function markDataUri() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">`
    + `<rect width="64" height="64" rx="14.08" fill="${TEAL}"/>`
    + `<circle cx="32" cy="32" r="19" fill="none" stroke="${OFF_WHITE}" stroke-width="3.2"/>` // optically thickened at favicon size (§03)
    + dots(32, 32, 19, 4)
    + `<circle cx="32" cy="32" r="5.8" fill="${GOLD}"/>`
    + `</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
