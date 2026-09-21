// C3-FX-01, 02, 04, 05, 06, 07, 08, 10, 11 — hand-calculated fixtures.
// Every fixture states the assumption it was constructed under (C3-FX-16).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { plan, vessel, codes, rejectCodes, ulpDistance, D } from './helpers.js';
import { ROUND_TRIP_ULP_PER_STEP } from '../src/engine/tolerances.js';

test('C3-FX-01 non-round stock, target and final volume — hand calculation to displayed precision', () => {
  // Assumptions: stock 3.7 mg/mL, target 0.123 mg/mL, F = 875 µL, m = 2 µL.
  // T = 875 × 0.123 / 3.7 = 29.08783783… µL -> 29.1 (nearest ties 29.05, 29.15; not within 1 ULP of either)
  // D = 875 − 29.1 = 845.9 -> 846 (ties 845.5, 846.5; not adjacent)  ρ = +0.1
  // total = 29.1 + 846 = 875.1 (never rounded)
  // achieved = 3.7 × 29.1 / 875.1 = 107.67 / 875.1 = 0.12303736… -> 0.123037 (next digit 3)
  const r = plan({ stock: { value: '3.7', unit: 'mg/mL' }, target: { form: 'single', value: '0.123', unit: 'mg/mL' }, volume: { value: '875', unit: 'µL' } });
  assert.equal(r.status, 'plan', JSON.stringify(r.rejections));
  const p = vessel(r, 'P1');
  assert.equal(p.volumes.transferIn.display, '29.1');
  assert.equal(p.volumes.diluent.display, '846');
  assert.equal(p.volumes.diluent.derived, true);
  assert.equal(p.volumes.total.display, '875.1');
  assert.equal(p.volumes.residual, '0.1');
  assert.equal(p.concentration.achieved.display, '0.123037');
  assert.equal(p.concentration.target.value, '0.123'); // echoed as entered (C3-UN-05)
  assert.equal(p.concentration.target.asEntered, true);
  assert.equal(p.factorFromSource.display, '30.0813'); // 3.7/0.123 = 30.08130…
  assert.deepEqual(codes(r), []);
});

test('C3-FX-02 volumes entered as µL and as mL give identical results to displayed precision (C3-IV-06)', () => {
  const a = plan({ stock: { value: '3.7', unit: 'mg/mL' }, target: { form: 'single', value: '0.123', unit: 'mg/mL' }, volume: { value: '875', unit: 'µL' } });
  const b = plan({ stock: { value: '3.7', unit: 'mg/mL' }, target: { form: 'single', value: '0.123', unit: 'mg/mL' }, volume: { value: '0.875', unit: 'mL' }, minTransfer: { value: '0.002', unit: 'mL' } });
  const pa = vessel(a, 'P1'), pb = vessel(b, 'P1');
  const same = (qa, qb) => assert.equal(D.cmp(D.fromString(qa.display), D.shift(D.fromString(qb.display), 3)), 0, `${qa.display} µL vs ${qb.display} mL`);
  same(pa.volumes.transferIn, pb.volumes.transferIn);
  same(pa.volumes.diluent, pb.volumes.diluent);
  same(pa.volumes.total, pb.volumes.total);
  same(pa.volumes.remaining, pb.volumes.remaining);
  assert.equal(pb.volumes.transferIn.display, '0.0291');
  assert.equal(pb.volumes.total.display, '0.8751');
  assert.equal(pa.concentration.achieved.display, pb.concentration.achieved.display);
  assert.equal(b.displayUnits.volume, 'mL');
});

test('C3-FX-04 transfer and final volume in different decades — both residual signs, and a same-decade exact closure', () => {
  // Assumptions: stock 1000 µg/mL, F = 1000 µL, m = 2 µL; targets 12.4, 12.6 and 500 µg/mL.
  // 12.4: T = 12.4; D = 987.6 -> 988; ρ = +0.4; total 1000.4; achieved = 1000×12.4/1000.4 = 12.39504… -> 12.3950
  // 12.6: T = 12.6; D = 987.4 -> 987; ρ = −0.4; total 12.6 + 987 = 999.6 = F + ρ; achieved = 1000×12.6/999.6 = 12.60504… -> 12.6050
  // 500:  T = 500;  D = 500;  ρ = 0;    total 1000;   achieved 500 exactly
  const up = vessel(plan({ target: { form: 'single', value: '12.4', unit: 'µg/mL' }, volume: { value: '1000', unit: 'µL' } }), 'P1');
  assert.equal(up.volumes.transferIn.display, '12.4');
  assert.equal(up.volumes.diluent.display, '988');
  assert.equal(up.volumes.residual, '0.4');
  assert.equal(up.volumes.total.display, '1000.4');
  assert.equal(up.concentration.achieved.display, '12.3950');
  const down = vessel(plan({ target: { form: 'single', value: '12.6', unit: 'µg/mL' }, volume: { value: '1000', unit: 'µL' } }), 'P1');
  assert.equal(down.volumes.transferIn.display, '12.6');
  assert.equal(down.volumes.diluent.display, '987');
  assert.equal(down.volumes.residual, '-0.4');
  assert.equal(down.volumes.total.display, '999.6');
  assert.equal(down.concentration.achieved.display, '12.6050');
  const same = vessel(plan({ target: { form: 'single', value: '500', unit: 'µg/mL' }, volume: { value: '1000', unit: 'µL' } }), 'P1');
  assert.equal(same.volumes.residual, '0');
  assert.equal(same.volumes.closes, true);
  assert.equal(same.volumes.total.display, '1000');
  assert.equal(same.concentration.achieved.display, '500.000');
  // |ρ| is half a unit in the last displayed place of D (1 -> 0.5) or less.
  for (const v of [up, down]) assert.ok(Math.abs(Number(v.volumes.residual)) <= 0.5);
});

test('C3-FX-05 serial series at "volume available after onward transfer" — backward solve; remaining = A + ρ (handoff §5.1 illustration)', () => {
  // Assumptions: stock 100 µg/mL, serial, targets [10, 1, 0.1] µg/mL, A = 40 µL, m = 2 µL.
  // P3: V = 40, T = 4.00, D = 36.0, total 40.0. P2: V = 44, T = 4.40, D = 39.6, total 44.0, remaining 40.0.
  // P1: V = 44.4, T = 4.44, D = 39.96 -> 40.0 (ρ = +0.04), total 44.44, remaining 40.04 = A + ρ. Achieved P1 = 9.99100.
  const r = plan({ stock: { value: '100', unit: 'µg/mL' }, target: { form: 'list', values: ['10', '1', '0.1'], unit: 'µg/mL' }, volume: { value: '40', unit: 'µL' }, basis: 'available', route: 'serial' });
  assert.equal(r.status, 'plan');
  const p1 = vessel(r, 'P1'), p2 = vessel(r, 'P2'), p3 = vessel(r, 'P3');
  assert.equal(p3.volumes.transferIn.display, '4.00');
  assert.equal(p3.volumes.diluent.display, '36.0');
  assert.equal(p3.volumes.total.display, '40.0');
  assert.equal(p2.volumes.transferIn.display, '4.40');
  assert.equal(p2.volumes.diluent.display, '39.6');
  assert.equal(p2.volumes.total.display, '44.0');
  assert.equal(p2.volumes.remaining.display, '40.0');
  assert.equal(p1.volumes.transferIn.display, '4.44');
  assert.equal(p1.volumes.diluent.display, '40.0');
  assert.equal(p1.volumes.diluent.derivedFrom, '39.96');
  assert.equal(p1.volumes.residual, '0.04');
  assert.equal(p1.volumes.total.display, '44.44');
  assert.equal(p1.volumes.remaining.display, '40.04'); // A + ρ, not the declared A echoed
  assert.equal(p1.concentration.achieved.display, '9.99100');
  assert.equal(p2.concentration.achieved.display, '0.999100'); // the same relative departure carried down
  assert.equal(p3.concentration.achieved.display, '0.0999100');
  assert.equal(p1.concentration.target.value, '10');
  assert.deepEqual(codes(r), []);
  assert.equal(r.stockConsumed.display, '4.44');
});

test('C3-FX-06 same target set serially and independently at a final-volume basis agree on the exact concentration (C3-IV-04)', () => {
  // Assumptions: stock 1000, [100, 50, 25] µg/mL, F = 100 µL, m = 2. Independent transfers 10, 5, 2.5 µL — all ≥ m, no intermediate.
  const ser = plan({ target: { form: 'list', values: ['100', '50', '25'], unit: 'µg/mL' }, route: 'serial' });
  const ind = plan({ target: { form: 'list', values: ['100', '50', '25'], unit: 'µg/mL' }, route: 'independent' });
  for (const L of ['P1', 'P2', 'P3']) {
    assert.equal(vessel(ser, L).concentration.exact.display, vessel(ind, L).concentration.exact.display);
  }
  assert.equal(vessel(ser, 'P2').volumes.transferIn.display, '50.0');
  assert.equal(vessel(ind, 'P2').volumes.transferIn.display, '5.00');
  assert.equal(vessel(ser, 'P3').sourceLabel, 'P2');
  assert.equal(vessel(ind, 'P3').sourceLabel, 'S');
});

test('C3-FX-07 serial: lower point below the minimum — intermediate per C3-DT-06; source onward is to the intermediate; step count and source vessel', () => {
  // Assumptions: stock 1000 µg/mL, serial [10, 1, 0.1] µg/mL, F = 100 µL, m = 2 µL.
  // Step S→P1: f = 100, direct T = 1 < 2. g = 10: T_b = 100×10/100 = 10 ≥ 2. F_int = max(10×2, 10.0) = 20; T_int = 2.00; D_int = 18.0.
  const r = plan({ target: { form: 'list', values: ['10', '1', '0.1'], unit: 'µg/mL' }, route: 'serial' });
  assert.equal(r.status, 'plan', JSON.stringify(r.rejections));
  assert.deepEqual(r.vessels.map((v) => v.label), ['S', 'I1', 'P1', 'P2', 'P3']);
  const i1 = vessel(r, 'I1'), p1 = vessel(r, 'P1');
  assert.equal(i1.intermediateFactor, 10);
  assert.equal(i1.sourceLabel, 'S');
  assert.equal(i1.volumes.transferIn.display, '2.00');
  assert.equal(i1.volumes.diluent.display, '18.0');
  assert.equal(i1.volumes.total.display, '20.0');
  assert.equal(i1.concentration.nominal.value, '100.000');
  assert.equal(i1.sizedBy, 'g·m');
  assert.equal(p1.sourceLabel, 'I1');
  assert.equal(p1.stepsFromStock, 2);
  assert.equal(p1.volumes.transferIn.display, '10.0');
  assert.equal(vessel(r, 'P2').stepsFromStock, 3);
  assert.equal(vessel(r, 'P3').stepsFromStock, 4);
  // The stock's onward transfer is to the intermediate, not to P1 (C3-DT-03).
  assert.deepEqual(vessel(r, 'S').volumes.onward.map((o) => o.to), ['I1']);
  assert.deepEqual(i1.volumes.onward.map((o) => o.to), ['P1']);
  assert.deepEqual(codes(r), ['C3-FL-01']); // the only flag when an intermediate is planned
  assert.equal(r.flags[0].scope.vessel, 'P1');
  assert.match(r.flags[0].message, /I1/);
});

test('C3-FX-07 independent: two points sharing one intermediate; both name the same source (C3-OUT-13); C3-IV-05 through the intermediate', () => {
  // Assumptions: stock 1000, independent, top 1 µg/mL, factor 2, count 2, F = 100, m = 2.
  // P1: f = 1000, direct 0.1; g = 100: T_b = 10. P2: f = 2000, g = 10: 0.5 ✗; g = 100: T_b = 5 ✓. Shared g = 100.
  // F_int = max(100×2, round3(10 + 5)) = 200; T_int = 2.00; D_int = 198.
  const r = plan({ target: { form: 'top-factor-count', top: '1', unit: 'µg/mL', factor: 2, count: 2 }, route: 'independent' });
  assert.equal(r.status, 'plan', JSON.stringify(r.rejections));
  assert.deepEqual(r.vessels.map((v) => v.label), ['S', 'I1', 'P1', 'P2']);
  const i1 = vessel(r, 'I1');
  assert.equal(i1.intermediateFactor, 100);
  assert.deepEqual(i1.destinations, ['P1', 'P2']);
  assert.equal(i1.volumes.total.display, '200');
  assert.equal(i1.volumes.transferIn.display, '2.00');
  assert.equal(i1.volumes.diluent.display, '198');
  assert.equal(vessel(r, 'P1').sourceLabel, 'I1');
  assert.equal(vessel(r, 'P2').sourceLabel, 'I1');
  assert.equal(vessel(r, 'P1').stepsFromStock, 2);
  assert.equal(vessel(r, 'P2').stepsFromStock, 2);
  assert.equal(vessel(r, 'P1').volumes.transferIn.display, '10.0');
  assert.equal(vessel(r, 'P2').volumes.transferIn.display, '5.00');
  assert.deepEqual(codes(r), ['C3-FL-01', 'C3-FL-01']);
  // Exact factor between P1 and P2 from unrounded volumes equals the declared factor.
  assert.equal(vessel(r, 'P2').factorFromPreviousPoint.exactDisplay, '2.00000');
  assert.equal(vessel(r, 'P2').factorFromPreviousPoint.declared, 2);
});

test('C3-FX-08 diluent-volume basis — final volume stated and exceeding D by the transfer; target reached exactly; no residual', () => {
  // Assumptions: stock 1000, target 100 µg/mL, D = 90 µL, m = 2. T = 90×100/900 = 10.0; final volume 100.
  const r = plan({ volume: { value: '90', unit: 'µL' }, basis: 'diluent' });
  assert.equal(r.status, 'plan');
  const p = vessel(r, 'P1');
  assert.equal(p.volumes.transferIn.display, '10.0');
  assert.equal(p.volumes.diluent.display, '90');
  assert.equal(p.volumes.diluent.derived, false);
  assert.equal(p.volumes.finalVolume.display, '100');
  assert.equal(p.volumes.total.display, '100');
  assert.equal(p.volumes.residual, null);
  assert.equal(p.volumes.closes, null);
  assert.equal(p.concentration.achieved.display, '100.000');
  assert.equal(p.concentration.target.value, '100');
  assert.deepEqual(codes(r), ['C3-FL-05']);
});

test('C3-FX-10 negative control, single step — no flags raised', () => {
  const r = plan();
  assert.equal(r.status, 'plan');
  assert.deepEqual(codes(r), []);
  assert.deepEqual(rejectCodes(r), []);
  assert.equal(vessel(r, 'P1').volumes.transferIn.display, '10.0');
});

test('C3-FX-11 negative control, serial series of four points — no flags raised', () => {
  const r = plan({ target: { form: 'list', values: ['100', '10', '1', '0.1'], unit: 'µg/mL' }, route: 'serial' });
  assert.equal(r.status, 'plan');
  assert.deepEqual(codes(r), []);
  assert.deepEqual(r.vessels.map((v) => v.label), ['S', 'P1', 'P2', 'P3', 'P4']);
  for (const L of ['P1', 'P2', 'P3', 'P4']) assert.equal(vessel(r, L).volumes.transferIn.display, '10.0');
});

test('C3-DT-09 a target of zero is diluent alone, outside the chain, and raises C3-FL-08', () => {
  const r = plan({ target: { form: 'list', values: ['100', '10', '0'], unit: 'µg/mL' }, route: 'serial' });
  assert.equal(r.status, 'plan');
  const z = vessel(r, 'P3');
  assert.equal(z.isZero, true);
  assert.equal(z.sourceLabel, null);
  assert.equal(z.volumes.diluent.display, '100');
  assert.equal(z.volumes.transferIn.display, '0');
  assert.deepEqual(codes(r), ['C3-FL-08']);
  assert.deepEqual(vessel(r, 'P2').volumes.onward, []);
});

test('C3-FX-03 target → plan → recomputed exact concentration within the derived round-trip tolerance (6 ULP per step from stock)', () => {
  // Assumptions: the register tolerance derived in docs/tolerance-memo.md; a planned intermediate counts as a step.
  const cases = [
    {},
    { target: { form: 'list', values: ['10', '1', '0.1'], unit: 'µg/mL' }, route: 'serial' },
    { target: { form: 'list', values: ['10', '1', '0.1'], unit: 'µg/mL' }, route: 'independent' },
    { stock: { value: '100', unit: 'µg/mL' }, target: { form: 'list', values: ['10', '1', '0.1'], unit: 'µg/mL' }, volume: { value: '40', unit: 'µL' }, basis: 'available', route: 'serial' },
    { stock: { value: '987.6', unit: 'µg/mL' }, target: { form: 'list', values: ['123', '45.6', '7.89', '0.123', '0.0123'], unit: 'µg/mL' }, route: 'serial', volume: { value: '875', unit: 'µL' } },
    { stock: { value: '987.6', unit: 'µg/mL' }, target: { form: 'list', values: ['123', '45.6', '7.89', '0.123'], unit: 'µg/mL' }, route: 'serial', basis: 'diluent', volume: { value: '90', unit: 'µL' } },
    { target: { form: 'top-factor-count', top: '100', unit: 'µg/mL', factor: 3.3, count: 6 }, route: 'serial', volume: { value: '300', unit: 'µL' } },
  ];
  let points = 0;
  for (const c of cases) {
    const r = plan(c);
    assert.equal(r.status, 'plan', JSON.stringify(r.rejections));
    assert.equal(r.tolerances.roundTrip.status, 'derived'); // memo signed 21 September 2026
    for (const v of r.vessels) {
      if (v.kind !== 'point' || v.isZero) continue;
      const target = r.declarations.target.values[v.pointIndex].internal;
      const err = ulpDistance(v.concentration.exact.internalUnrounded, target);
      assert.ok(err <= ROUND_TRIP_ULP_PER_STEP * v.stepsFromStock, `${v.label}: ${err} ULP at ${v.stepsFromStock} steps`);
      points += 1;
    }
  }
  assert.ok(points >= 20);
});
