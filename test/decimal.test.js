import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as D from '../src/engine/decimal.js';

const s = (x) => D.toString(x);

test('exact expansion of doubles is exact (no rounding on the way in)', () => {
  assert.equal(s(D.fromNumberExact(0.1)), '0.1000000000000000055511151231257827021181583404541015625');
  assert.equal(s(D.fromNumberExact(1.005)), '1.00499999999999989341858963598497211933135986328125');
  assert.equal(s(D.fromNumberExact(987.5)), '987.5');
  assert.equal(s(D.fromNumberExact(0)), '0');
  assert.equal(s(D.fromNumberExact(-2.5)), '-2.5');
});

test('roundSig: half away from zero on the exact value (C3-UN-06)', () => {
  const r = (x, n) => s(D.roundSig(D.fromNumberExact(x), n));
  assert.equal(r(0.125, 2), '0.13'); // exact binary tie -> away from zero
  assert.equal(r(2.5, 1), '3');
  assert.equal(r(-2.5, 1), '-3');
  assert.equal(r(1.005, 3), '1.00'); // below the tie in binary
  assert.equal(r(8.345, 3), '8.35'); // above the tie in binary
  assert.equal(r(2.675, 3), '2.67');
  assert.equal(r(987.5, 3), '988');
  assert.equal(r(999.6, 3), '1000'); // carry renormalises to 3 sf
  assert.equal(r(12.4, 3), '12.4');
  assert.equal(r(40, 3), '40.0');
  assert.equal(r(4.4444, 3), '4.44');
  assert.equal(r(0.0124, 3), '0.0124');
  assert.equal(s(D.roundSig(D.fromString('987.6'), 3)), '988');
  assert.equal(s(D.roundSig(D.fromString('987.4'), 3)), '987');
  assert.equal(s(D.roundSig(D.fromString('987.5'), 3)), '988'); // exact decimal tie
});

test('decimal sums and differences are exact and keep their digits', () => {
  const F = D.fromString('1000');
  const Td = D.fromString('12.4');
  const Dd = D.roundSig(D.sub(F, Td), 3);
  assert.equal(s(Dd), '988');
  assert.equal(s(D.sub(Dd, D.sub(F, Td))), '0.4');
  assert.equal(s(D.add(D.fromString('4.44'), D.fromString('40.0'))), '44.44');
  assert.equal(s(D.padSig(D.add(D.fromString('4.40'), D.fromString('39.6')), 3)), '44.0');
  assert.equal(s(D.padSig(D.add(D.fromString('10'), D.fromString('2.50')), 3)), '12.5');
  assert.equal(s(D.padSig(D.fromString('44.44'), 3)), '44.44');
  assert.equal(s(D.padSig(D.fromString('1000'), 3)), '1000');
  assert.equal(s(D.shift(D.fromString('1'), 3)), '1000');
  assert.equal(s(D.shift(D.fromString('12.4'), -3)), '0.0124');
});

test('fromString rejects non-plain input', () => {
  assert.throws(() => D.fromString('1e3'));
  assert.throws(() => D.fromString('abc'));
  assert.throws(() => D.fromString(''));
  assert.equal(s(D.fromString('.5')), '0.5');
  assert.equal(s(D.fromString('-0.005')), '-0.005');
});
