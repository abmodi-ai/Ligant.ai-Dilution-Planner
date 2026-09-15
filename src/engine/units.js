// Unit table with dimension tags (handoff check D3; C3-UN-02, C3-UN-09).
//
// Every unit belongs to exactly one dimension, stated as a field, so that
// C3-HI-08 (mixed dimensions) is decidable from the unit alone and never
// inferred from the unit string.
//
// Scale factors are relative to the SMALLEST unit of each dimension and are
// positive integer powers of ten. Converting to the internal scale is then one
// multiplication by an exactly representable integer, correctly rounded and
// exact whenever the product is representable (C3-UN-03). Nothing is divided
// by 1000 on the way in.

export const DIMENSION = Object.freeze({
  MASS_PER_VOLUME: 'mass/volume',
  AMOUNT_PER_VOLUME: 'amount/volume',
  VOLUME: 'volume',
});

// Concentration units. Internal scale: mass/volume in ng/mL; amount/volume in pM.
export const CONCENTRATION_UNITS = Object.freeze([
  { symbol: 'mg/mL', dimension: DIMENSION.MASS_PER_VOLUME, scale: 1e6 },
  { symbol: 'µg/mL', dimension: DIMENSION.MASS_PER_VOLUME, scale: 1e3 },
  { symbol: 'ng/mL', dimension: DIMENSION.MASS_PER_VOLUME, scale: 1 },
  { symbol: 'g/L', dimension: DIMENSION.MASS_PER_VOLUME, scale: 1e6 },
  { symbol: 'mg/L', dimension: DIMENSION.MASS_PER_VOLUME, scale: 1e3 },
  { symbol: 'M', dimension: DIMENSION.AMOUNT_PER_VOLUME, scale: 1e12 },
  { symbol: 'mM', dimension: DIMENSION.AMOUNT_PER_VOLUME, scale: 1e9 },
  { symbol: 'µM', dimension: DIMENSION.AMOUNT_PER_VOLUME, scale: 1e6 },
  { symbol: 'nM', dimension: DIMENSION.AMOUNT_PER_VOLUME, scale: 1e3 },
  { symbol: 'pM', dimension: DIMENSION.AMOUNT_PER_VOLUME, scale: 1 },
]);

// Volume units. Internal scale: µL.
export const VOLUME_UNITS = Object.freeze([
  { symbol: 'µL', dimension: DIMENSION.VOLUME, scale: 1 },
  { symbol: 'mL', dimension: DIMENSION.VOLUME, scale: 1e3 },
  { symbol: 'L', dimension: DIMENSION.VOLUME, scale: 1e6 },
]);

const ALL = [...CONCENTRATION_UNITS, ...VOLUME_UNITS];
const BY_SYMBOL = new Map(ALL.map((u) => [u.symbol, u]));
// Accept the ASCII "u" spelling of micro on input; the table's symbol is canonical.
for (const u of ALL) {
  if (u.symbol.includes('µ')) BY_SYMBOL.set(u.symbol.replace('µ', 'u'), u);
}

export function unitInfo(symbol) {
  const u = BY_SYMBOL.get(symbol);
  if (!u) throw new Error(`unknown unit: "${symbol}"`);
  return u;
}

export function isConcentrationUnit(symbol) {
  const u = BY_SYMBOL.get(symbol);
  return !!u && u.dimension !== DIMENSION.VOLUME;
}

export function isVolumeUnit(symbol) {
  const u = BY_SYMBOL.get(symbol);
  return !!u && u.dimension === DIMENSION.VOLUME;
}

/** Dimension of a unit, from the table field, never from the string. */
export function dimensionOf(symbol) {
  return unitInfo(symbol).dimension;
}

/** Value in the internal scale of its dimension: one multiplication. */
export function toInternal(value, symbol) {
  const u = unitInfo(symbol);
  return u.scale === 1 ? value : value * u.scale;
}

/** Internal-scale value expressed in a unit: one division. Display only. */
export function fromInternal(value, symbol) {
  const u = unitInfo(symbol);
  return u.scale === 1 ? value : value / u.scale;
}

/** Power of ten by which the internal scale exceeds the unit (exact integer). */
export function scaleExponent(symbol) {
  const u = unitInfo(symbol);
  return Math.round(Math.log10(u.scale));
}

export function canonicalSymbol(symbol) {
  return unitInfo(symbol).symbol;
}
