// C3-FX-12 boundaries either side of and exactly on every numeric §7 and §8
// condition; C3-FX-13 (C3-HI-09 in its four ways); C3-FX-15 (C3-HI-06).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { plan, vessel, codes, rejectCodes } from './helpers.js';

const single = (value, extra = {}) => plan({ target: { form: 'single', value, unit: 'µg/mL' }, ...extra });

test('C3-HI-01 stock ≤ 0', () => {
  assert.deepEqual(rejectCodes(plan({ stock: { value: '0', unit: 'µg/mL' }, target: { form: 'single', value: '0', unit: 'µg/mL' } })), ['C3-HI-01']);
  assert.deepEqual(rejectCodes(plan({ stock: { value: '-1', unit: 'µg/mL' }, target: { form: 'single', value: '-2', unit: 'µg/mL' } })).includes('C3-HI-01'), true);
  assert.equal(plan({ stock: { value: '0.001', unit: 'µg/mL' }, target: { form: 'single', value: '0.0005', unit: 'µg/mL' } }).rejections.some((x) => x.code === 'C3-HI-01'), false);
  const r = plan({ stock: { value: '0', unit: 'µg/mL' }, target: { form: 'single', value: '0', unit: 'µg/mL' } });
  assert.match(r.rejections[0].message, /0 µg\/mL/);
  assert.match(r.rejections[0].message, /cannot be zero or negative/);
});

test('C3-HI-02 target < 0; target = 0 is legal (C3-FL-08)', () => {
  assert.deepEqual(rejectCodes(single('-0.1')), ['C3-HI-02']);
  const zero = single('0');
  assert.equal(zero.status, 'plan');
  assert.deepEqual(codes(zero), ['C3-FL-08']);
  assert.equal(single('0.1').status, 'plan');
});

test('C3-HI-03 target > stock; target = stock is legal (C3-FL-09)', () => {
  assert.deepEqual(rejectCodes(single('1000.001')), ['C3-HI-03']);
  assert.match(single('1000.001').rejections[0].message, /cannot raise a concentration above its stock/);
  const eq = single('1000');
  assert.equal(eq.status, 'plan');
  assert.deepEqual(codes(eq), ['C3-FL-09']);
  const p = vessel(eq, 'P1');
  assert.equal(p.volumes.transferIn.display, '100');
  assert.equal(p.volumes.diluent.display, '0');
  assert.equal(p.factorFromSource.display, '1.00000');
  assert.deepEqual(codes(single('999.999')), []);
});

test('C3-HI-04 stated volume ≤ 0 under any basis', () => {
  for (const basis of ['final', 'diluent']) {
    assert.deepEqual(rejectCodes(plan({ basis, volume: { value: '0', unit: 'µL' } })), ['C3-HI-04'], basis);
    assert.deepEqual(rejectCodes(plan({ basis, volume: { value: '-5', unit: 'µL' } })), ['C3-HI-04'], basis);
    assert.equal(plan({ basis, volume: { value: '0.001', unit: 'µL' } }).rejections.some((x) => x.code === 'C3-HI-04'), false, basis);
  }
  const av = plan({ basis: 'available', route: 'serial', target: { form: 'list', values: ['100', '10'], unit: 'µg/mL' }, volume: { value: '0', unit: 'µL' } });
  assert.deepEqual(rejectCodes(av), ['C3-HI-04']);
  assert.match(av.rejections[0].message, /volume available after onward transfer/);
});

test('C3-HI-05 dilution factor ≤ 1 in the top-factor-count form', () => {
  const tfc = (factor) => plan({ target: { form: 'top-factor-count', top: '100', unit: 'µg/mL', factor, count: 3 }, route: 'serial' });
  assert.deepEqual(rejectCodes(tfc(1)), ['C3-HI-05']);
  assert.deepEqual(rejectCodes(tfc(0.5)), ['C3-HI-05']);
  assert.match(tfc(0.5).rejections[0].message, /1:100 is a factor of 100/);
  assert.equal(tfc(1.001).status, 'plan');
});

test('C3-HI-06 transfer > donating vessel total, strict; a vessel donating its entire contents is legal with remaining 0', () => {
  // Assumptions: stock 1000, serial [750, c2], diluent basis, D = 10, m = 2.
  // P1: T = 10×750/250 = 30, total 40. P2 at 600: T = 10×600/150 = 40 = total -> legal, remaining 0.
  const exact = plan({ target: { form: 'list', values: ['750', '600'], unit: 'µg/mL' }, route: 'serial', basis: 'diluent', volume: { value: '10', unit: 'µL' } });
  assert.equal(exact.status, 'plan', JSON.stringify(exact.rejections));
  assert.equal(vessel(exact, 'P1').volumes.total.display, '40.0');
  assert.equal(vessel(exact, 'P2').volumes.transferIn.display, '40.0');
  assert.equal(vessel(exact, 'P1').volumes.remaining.display, '0.00');
  // The comparison is between the plan's displayed volumes (the transfer as it will be pipetted, the total as
  // C3-DT-04 reports it): 601 gives T = 6010/149 = 40.34 -> 40.3 > 40.0; 599 gives 39.67 -> 39.7.
  const over = plan({ target: { form: 'list', values: ['750', '601'], unit: 'µg/mL' }, route: 'serial', basis: 'diluent', volume: { value: '10', unit: 'µL' } });
  assert.deepEqual(rejectCodes(over), ['C3-HI-06']);
  assert.match(over.rejections[0].message, /40\.3 µL from P1 to P2 exceeds the 40\.0 µL/);
  const under = plan({ target: { form: 'list', values: ['750', '599'], unit: 'µg/mL' }, route: 'serial', basis: 'diluent', volume: { value: '10', unit: 'µL' } });
  assert.equal(under.status, 'plan');
});

test('C3-FX-15 C3-HI-06 with realistic inputs — names both volumes and the vessel label', () => {
  // Stock 1000, serial [200, 180], diluent basis, D = 10 µL, m = 2 µL.
  // Step 1: f = 5, T = 2.50, no intermediate, total = D + Tᵈ = 12.5. Step 2: f = 1.11, T = 90.0 > 12.5.
  const r = plan({ target: { form: 'list', values: ['200', '180'], unit: 'µg/mL' }, route: 'serial', basis: 'diluent', volume: { value: '10', unit: 'µL' } });
  assert.equal(r.status, 'rejected');
  assert.deepEqual(rejectCodes(r), ['C3-HI-06']);
  const x = r.rejections[0];
  assert.match(x.message, /90\.0 µL/);
  assert.match(x.message, /12\.5 µL/);
  assert.match(x.message, /P1/);
  assert.match(x.message, /cannot donate more than it holds/);
  assert.equal(x.quantities.transfer, '90.0');
  assert.equal(x.quantities.total, '12.5');
  assert.equal(x.quantities.vessel, 'P1');
  assert.equal(x.scope.from, 'P1');
  assert.equal(x.scope.vessel, 'P2');
  assert.equal(r.vessels.length, 0); // withheld: no plan is shown
});

test('C3-HI-07 serial route with a target list not strictly decreasing', () => {
  const ser = (values) => plan({ target: { form: 'list', values, unit: 'µg/mL' }, route: 'serial' });
  assert.deepEqual(rejectCodes(ser(['10', '10'])), ['C3-HI-07']);
  assert.deepEqual(rejectCodes(ser(['10', '10.001'])), ['C3-HI-07']);
  assert.equal(ser(['10', '9.999']).status, 'plan');
  assert.match(ser(['10', '10']).rejections[0].message, /P1 \(10 µg\/mL\) and P2 \(10 µg\/mL\)/);
  assert.match(ser(['10', '10']).rejections[0].message, /cannot hold or increase/);
  // A zero point sits outside the chain (C3-DT-09) and does not offend the ordering.
  assert.equal(ser(['10', '0', '1']).status, 'plan');
  // Independent route has no ordering condition.
  assert.equal(plan({ target: { form: 'list', values: ['10', '10'], unit: 'µg/mL' }, route: 'independent' }).status, 'plan');
});

test('C3-HI-08 target and stock of different dimensions — decided from the unit table', () => {
  const r = plan({ stock: { value: '1', unit: 'mg/mL' }, target: { form: 'single', value: '1', unit: 'µM' } });
  assert.deepEqual(rejectCodes(r), ['C3-HI-08']);
  assert.match(r.rejections[0].message, /mg\/mL/);
  assert.match(r.rejections[0].message, /µM/);
  assert.match(r.rejections[0].message, /molecular weight/);
  assert.match(r.rejections[0].message, /C1/);
  assert.equal(plan({ stock: { value: '1', unit: 'mM' }, target: { form: 'single', value: '1', unit: 'µM' } }).status, 'plan');
  assert.equal(plan({ stock: { value: '1', unit: 'g/L' }, target: { form: 'single', value: '1', unit: 'µg/mL' } }).status, 'plan');
});

test('C3-FX-13 C3-HI-09 in each of its four ways — the bound that failed is named; no second intermediate', () => {
  const stock100 = (extra) => plan({ stock: { value: '100', unit: 'µg/mL' }, ...extra });
  // (1) series floor: f = 5 < 10, direct transfer 1 < 2.
  const floor = stock100({ target: { form: 'single', value: '20', unit: 'µg/mL' }, volume: { value: '5', unit: 'µL' } });
  assert.deepEqual(rejectCodes(floor), ['C3-HI-09']);
  assert.equal(floor.rejections[0].quantities.bound, 'series floor');
  assert.match(floor.rejections[0].message, /series floor, 10/);
  assert.match(floor.rejections[0].message, /remedy is the stated volume/);
  assert.doesNotMatch(floor.rejections[0].message, /recommend/i);
  // (2) minimum not met at any g: f = 10^6, F = 10 -> T_b(10^5) = 1 < 2.
  const min = stock100({ target: { form: 'single', value: '0.0001', unit: 'µg/mL' }, volume: { value: '10', unit: 'µL' } });
  assert.deepEqual(rejectCodes(min), ['C3-HI-09']);
  assert.equal(min.rejections[0].quantities.bound, 'minimum');
  assert.match(min.rejections[0].message, /minimum transfer volume, 2 µL/);
  // (3) capacity exceeded at every g meeting the minimum: f = 10^4, F = 1000, C = 15.
  const cap = stock100({ target: { form: 'single', value: '0.01', unit: 'µg/mL' }, volume: { value: '1000', unit: 'µL' }, capacity: { value: '15', unit: 'µL' } });
  assert.deepEqual(rejectCodes(cap), ['C3-HI-09']);
  assert.equal(cap.rejections[0].quantities.bound, 'capacity');
  assert.match(cap.rejections[0].message, /declared capacity, 15 µL/);
  // (4) source total exceeded (serial): stock 500, [100, 9.5], diluent basis D = 10, m = 2.
  //     P1: T = 2.5, total 12.5. Step 2: f = 10.526, direct 1.05 < 2; g = 10: T_b = 190, F_int = 190, T_int = 19.0 > 12.5.
  const src = plan({ stock: { value: '500', unit: 'µg/mL' }, target: { form: 'list', values: ['100', '9.5'], unit: 'µg/mL' }, route: 'serial', basis: 'diluent', volume: { value: '10', unit: 'µL' } });
  assert.deepEqual(rejectCodes(src), ['C3-HI-09']);
  assert.equal(src.rejections[0].quantities.bound, 'source total');
  assert.match(src.rejections[0].message, /source vessel's total, 12\.5 µL/);
  assert.match(src.rejections[0].message, /19\.0 µL/);
  for (const r of [floor, min, cap, src]) {
    assert.equal(r.vessels.length, 0);
    assert.ok(!r.vessels.some((v) => v.kind === 'intermediate'));
  }
});

test('C3-FL-01 either side of and exactly on the minimum (unrounded transfer)', () => {
  // stock 1000, F = 1000: T = target (µL) exactly.
  const t = (v) => plan({ target: { form: 'single', value: v, unit: 'µg/mL' }, volume: { value: '1000', unit: 'µL' } });
  assert.deepEqual(codes(t('2')), []);
  assert.deepEqual(codes(t('2.001')), []);
  assert.deepEqual(codes(t('1.999')), ['C3-FL-01']);
  assert.equal(vessel(t('1.999'), 'P1').sourceLabel, 'I1');
});

test('C3-FL-02 only where a maximum is declared; either side and exactly on', () => {
  const t = (v, max) => plan({ target: { form: 'single', value: v, unit: 'µg/mL' }, volume: { value: '1000', unit: 'µL' }, maxTransfer: max ? { value: max, unit: 'µL' } : null });
  assert.deepEqual(codes(t('10', '10')), []);
  assert.deepEqual(codes(t('10.001', '10')), ['C3-FL-02']);
  assert.deepEqual(codes(t('9.999', '10')), []);
  assert.deepEqual(codes(t('500', null)), []);
  assert.ok(t('500', null).notes.some((n) => /No maximum single-transfer volume was declared/.test(n)));
  assert.equal(t('500', null).declarations.capability.maxTransfer.declared, false);
});

test('C3-FL-03 only where a capacity is declared; either side and exactly on the vessel total', () => {
  // F = 100, T = 10, D = 90, total 100 (closes exactly).
  const t = (cap) => plan({ capacity: cap ? { value: cap, unit: 'µL' } : null });
  assert.deepEqual(codes(t('100')), []);
  assert.deepEqual(codes(t('100.1')), []);
  assert.deepEqual(codes(t('99.9')), ['C3-FL-03']);
  assert.deepEqual(codes(t(null)), []);
  assert.ok(t(null).notes.some((n) => /No vessel working capacity was declared/.test(n)));
});

test('C3-FL-04 and C3-FL-10 — "not recorded" is accepted, distinguishable from blank, and flagged', () => {
  const r = plan({ stockProvenance: 'not-recorded', diluent: { notRecorded: true } });
  assert.equal(r.status, 'plan');
  assert.deepEqual(codes(r).sort(), ['C3-FL-04', 'C3-FL-10']);
  assert.equal(r.declarations.stock.provenance.key, 'not-recorded');
  assert.equal(r.declarations.diluent.notRecorded, true);
  const blank = plan({ stockProvenance: '', diluent: { name: '' } });
  assert.equal(blank.status, 'incomplete');
  assert.deepEqual(blank.incomplete.map((i) => i.field).sort(), ['diluent', 'stockProvenance']);
});

test('C3-FL-05 diluent-volume basis', () => {
  assert.deepEqual(codes(plan({ basis: 'diluent' })), ['C3-FL-05']);
  assert.deepEqual(codes(plan({ basis: 'final' })), []);
});

test('C3-FL-06 only where available stock is declared; either side and exactly on', () => {
  // consumed = 10.0 µL
  const t = (avail) => plan({ stockAvailable: avail ? { value: avail, unit: 'µL' } : null });
  assert.deepEqual(codes(t('10')), []);
  assert.deepEqual(codes(t('10.01')), []);
  assert.deepEqual(codes(t('9.99')), ['C3-FL-06']);
  assert.match(t('9.99').flags[0].message, /by 0\.01 µL/);
  assert.deepEqual(codes(t(null)), []);
});

test('C3-FL-07 imported flags are restated in full with the origin tool named (interface shape only; C3-FX-09 waits on a real C4 object)', () => {
  const r = plan({
    targetProvenance: 'c4', targetOrigin: { tool: 'C4', resultId: 'c4-test-1' },
    imported: { tool: 'C4', resultId: 'c4-test-1', fixed: ['basis', 'volume', 'target'], flags: [{ code: 'C4-FL-03', message: 'point below the minimum reliable transfer', scope: { point: 1 } }] },
  });
  assert.equal(r.status, 'plan');
  const fl7 = r.flags.filter((f) => f.code === 'C3-FL-07');
  assert.equal(fl7.length, 1);
  assert.match(fl7[0].message, /Imported from C4/);
  assert.match(fl7[0].message, /C4-FL-03/);
  assert.equal(fl7[0].origin.tool, 'C4');
  assert.equal(vessel(r, 'P1').receiving, 'stain');
  assert.equal(vessel(r, 'P1').volumes.mustAlreadyHold.display, '90.0');
  assert.equal(r.declarations.basis.fixedByImport, true);
});

test('acceptance 18 — no plan completes without the required declarations; optional ones are stated absent', () => {
  const empty = plan({ stock: null, stockProvenance: '', target: null, targetProvenance: '', volume: null, basis: '', diluent: null, minTransfer: null });
  assert.equal(empty.status, 'incomplete');
  const fields = empty.incomplete.map((i) => i.field);
  for (const f of ['stock', 'stockProvenance', 'target', 'targetProvenance', 'volume', 'basis', 'diluent', 'minTransfer']) assert.ok(fields.includes(f), f);
  const multi = plan({ target: { form: 'list', values: ['100', '10'], unit: 'µg/mL' }, route: null });
  assert.equal(multi.status, 'incomplete');
  assert.ok(multi.incomplete.some((i) => i.field === 'route'));
  const ok = plan();
  assert.equal(ok.declarations.capability.maxTransfer.declared, false);
  assert.equal(ok.declarations.capability.capacity.declared, false);
  assert.equal(ok.declarations.stock.formulation.recorded, false);
  assert.equal(ok.declarations.route.notApplicable, true); // C3-RT-02
});

test('C3-VB-02 the third basis is unavailable outside a serial multi-point plan, with the reason stated', () => {
  const r = plan({ basis: 'available' });
  assert.equal(r.status, 'incomplete');
  assert.match(r.incomplete.find((i) => i.field === 'basis').message, /serial route with more than one point/);
  const ind = plan({ basis: 'available', route: 'independent', target: { form: 'list', values: ['100', '10'], unit: 'µg/mL' } });
  assert.equal(ind.status, 'incomplete');
});
