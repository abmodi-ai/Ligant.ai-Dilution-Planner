// The Ligant mark — "Council · Ringed" (Brand Guidelines v1.1 §03).
// The table is the hexagon, the six dots are the agents, the amber centre is
// the human who decides.
//
// The construction below is C1's, read from the shipped Antigen Density
// Calculator so the two tools carry an identical mark: viewBox 32, tile radius
// 7.04 (22%), agents on a circle of radius 9.2 at 60° from the top, dot radius
// 2.1, centre radius 3.6, table stroke 1.7 with round joins. Do not re-derive
// these numbers; §03 forbids restretching the mark.
//
// Drawn inline as SVG: the zero-third-party-request rule (C3-NF-01, and the
// brand's own published claim) forbids an asset CDN, and an inline drawing also
// survives greyscale printing on the bench sheet.

const AGENT_RING = 9.2;
const AGENT_R = 2.1;
const CENTRE_R = 3.6;
const TILE_RX = 7.04; // 22% of 32

/** The six agents, at 60° from the top of the table. */
const AGENTS = Array.from({ length: 6 }, (_, i) => {
  const a = (-90 + i * 60) * (Math.PI / 180);
  return [16 + AGENT_RING * Math.cos(a), 16 + AGENT_RING * Math.sin(a)];
});

/** The table: the closed hexagon through the six agents. */
const TABLE = `${AGENTS.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(3)},${y.toFixed(3)}`).join(' ')} Z`;

/**
 * @param {object} o
 * @param {number} o.size rendered px (>= 24 in UI, >= 16 as a favicon)
 * @param {'tile'|'plain'} o.variant tile is the default; plain drops the tile and
 *   draws the table and agents in teal, for print and for dense chrome
 * @param {string} o.title accessible name, omitted when the wordmark is beside it
 */
export function markSvg({ size = 28, variant = 'tile', title = '' } = {}) {
  const tile = variant === 'tile';
  const ink = tile ? 'var(--brand-offwhite, #FAF7F2)' : 'var(--brand-teal, #0D7C66)';
  return [
    `<svg class="ligant-mark" width="${size}" height="${size}" viewBox="0 0 32 32" role="${title ? 'img' : 'presentation'}"`,
    title ? ` aria-label="${title}">` : ' aria-hidden="true">',
    tile ? `<rect width="32" height="32" rx="${TILE_RX}" fill="var(--brand-teal, #0D7C66)"/>` : '',
    `<path d="${TABLE}" fill="none" stroke="${ink}" stroke-width="1.7" stroke-linejoin="round"/>`,
    AGENTS.map(([x, y]) => `<circle cx="${x.toFixed(3)}" cy="${y.toFixed(3)}" r="${AGENT_R}" fill="${ink}"/>`).join(''),
    `<circle cx="16" cy="16" r="${CENTRE_R}" fill="var(--brand-amber-mark, #E0A416)"/>`,
    '</svg>',
  ].join('');
}

/** Horizontal lockup — mark + "Ligant". The default for headers (§03). */
export function lockupHtml(size = 28) {
  return `<span class="lockup">${markSvg({ size })}<span class="wordmark">Ligant</span></span>`;
}

/** The mark alone as a data URI, for the favicon. No network request. */
export function markDataUri() {
  const svg = [
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">',
    `<rect width="32" height="32" rx="${TILE_RX}" fill="#0D7C66"/>`,
    // optically thickened at favicon size so the table never fills in (§03)
    `<path d="${TABLE}" fill="none" stroke="#FAF7F2" stroke-width="2.2" stroke-linejoin="round"/>`,
    AGENTS.map(([x, y]) => `<circle cx="${x.toFixed(3)}" cy="${y.toFixed(3)}" r="${AGENT_R + 0.3}" fill="#FAF7F2"/>`).join(''),
    `<circle cx="16" cy="16" r="${CENTRE_R + 0.2}" fill="#E0A416"/>`,
    '</svg>',
  ].join('');
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
