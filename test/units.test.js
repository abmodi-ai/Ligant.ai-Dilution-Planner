import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CONCENTRATION_UNITS, VOLUME_UNITS, dimensionOf, toInternal, DIMENSION, unitInfo } from '../src/engine/units.js';

test('D3: every unit belongs to exactly one dimension, as a field (C3-UN-09)', () => {
  const required = {
    [DIMENSION.MASS_PER_VOLUME]: ['mg/mL', 'µg/mL', 'ng/mL', 'g/L', 'mg/L'],
    [DIMENSION.AMOUNT_PER_VOLUME]: ['M', 'mM', 'µM', 'nM', 'pM'],
    [DIMENSION.VOLUME]: ['µL', 'mL', 'L'],
  };
  for (const [dim, syms] of Object.entries(required)) {
    for (const sym of syms) assert.equal(dimensionOf(sym), dim, sym);
  }
  const all = [...CONCENTRATION_UNITS, ...VOLUME_UNITS];
  const seen = new Set();
  for (const u of all) {
    assert.ok(!seen.has(u.symbol), `duplicate ${u.symbol}`);
    seen.add(u.symbol);
    assert.ok(Object.values(DIMENSION).includes(u.dimension), `${u.symbol} has no dimension`);
    assert.ok(Number.isInteger(Math.log10(u.scale)) && u.scale >= 1, `${u.symbol} scale is a positive power of ten`);
  }
});

test('conversion is one multiplication by an integer power of ten (C3-UN-03)', () => {
  assert.equal(toInternal(1, 'mL'), 1000);
  assert.equal(toInternal(0.1, 'mL'), 100);
  assert.equal(toInternal(1.5, 'L'), 1500000);
  assert.equal(toInternal(12.4, 'µL'), 12.4);
  assert.equal(toInternal(3.7, 'mg/mL'), 3700000);
  assert.equal(toInternal(2, 'uM'), 2000000); // ASCII micro accepted on input
  assert.equal(unitInfo('uL').symbol, 'µL');
  assert.equal(toInternal(1, 'g/L'), toInternal(1, 'mg/mL'));
  assert.equal(toInternal(1, 'mg/L'), toInternal(1, 'µg/mL'));
});
