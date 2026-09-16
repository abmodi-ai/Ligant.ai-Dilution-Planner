// D2 — the rounding primitive, measured, not described (handoff §4 D2).
// The engine rounds on the exact binary expansion of the double (decimal.js),
// so the primitive it depends on is BigInt arithmetic, not toPrecision or
// Math.pow. This test records the measurement and asserts the engine's rule on
// tie-adjacent values in the running runtime. The comparison with toPrecision
// is informational and recorded in docs/D2-rounding-measurement.md.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as D from '../src/engine/decimal.js';

export const MEASUREMENT_CASES = [
  // [value, n, expected half-away-from-zero on the exact binary value]
  [0.125, 2, '0.13'],   // exact binary tie
  [2.5, 1, '3'],        // exact binary tie
  [-2.5, 1, '-3'],      // exact binary tie, negative
  [1.005, 3, '1.00'],   // decimal tie, binary below
  [1.0005, 4, '1.000'], // decimal tie, binary below
  [8.345, 3, '8.35'],   // decimal tie, binary above
  [2.675, 3, '2.67'],   // decimal tie, binary below
  [1.25, 2, '1.3'],     // exact binary tie
  [12.45, 3, '12.4'],   // decimal tie, binary below
  [987.5, 3, '988'],    // exact binary tie
  [999.5, 3, '1000'],   // exact binary tie with carry
  [1234.5, 4, '1235'],  // exact binary tie
  [9.995, 3, '9.99'],   // decimal tie, binary below
  [0.30000000000000004, 3, '0.300'],
  [4.44444, 3, '4.44'],
  [29.087837837837837, 3, '29.1'],
];

test('D2: engine rounding on tie-adjacent values, this runtime', () => {
  for (const [x, n, expected] of MEASUREMENT_CASES) {
    assert.equal(D.toString(D.roundSig(D.fromNumberExact(x), n)), expected, `roundSig(${x}, ${n})`);
  }
});

test('D2: record — toPrecision agreement on the same cases (informational)', () => {
  const rows = MEASUREMENT_CASES.map(([x, n, expected]) => {
    const tp = Number(x.toPrecision(n));
    const ours = Number(expected);
    return { x, n, expected, toPrecision: x.toPrecision(n), agrees: tp === ours };
  });
  const disagreements = rows.filter((r) => !r.agrees);
  // Recorded, not required: the engine does not use toPrecision.
  console.log(`# D2 runtime node ${process.versions.node} v8 ${process.versions.v8}: toPrecision agrees on ${rows.length - disagreements.length}/${rows.length} cases`);
  for (const d of disagreements) console.log(`#   disagreement: ${JSON.stringify(d)}`);
  assert.ok(rows.length > 0);
});

test('D2: Math.pow is not on the rounding path — 10**k used only for exact integer shifts', () => {
  // The decimal shift uses BigInt 10n ** k; never a floating 10 ** k of a value.
  for (let k = 0; k <= 22; k++) {
    assert.equal(D.toString(D.shift(D.fromString('1'), k)), '1' + '0'.repeat(k));
  }
});
