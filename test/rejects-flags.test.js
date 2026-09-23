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
  const tfc = (factor, volume = '100') => plan({ target: { form: 'top-factor-count', top: '100', unit: 'µg/mL', factor, count: 3 }, route: 'serial', volume: { value: volume, unit: 'µL' } });
  assert.deepEqual(rejectCodes(tfc(1)), ['C3-HI-05']);
  assert.deepEqual(rejectCodes(tfc(0.5)), ['C3-HI-05']);
  assert.match(tfc(0.5).rejections[0].message, /1:100 is a factor of 100/);
  // A factor above 1 passes C3-HI-05. At 100 µL it is then withheld by C3-HI-10,
  // because a factor of 1.001 leaves 0.0999 µL of diluent: legal as a factor,
  // unpipettable as a plan. Given a stated volume that leaves a pipettable
  // diluent it plans, which is what C3-HI-05 is about.
  // Every vessel that fails is named, not just the first (R1): at a factor of
  // 1.001 both diluted points leave 0.0999 µL of diluent.
  assert.deepEqual(rejectCodes(tfc(1.001)), ['C3-HI-10', 'C3-HI-10']);
  assert.deepEqual(tfc(1.001).rejections.map((x) => x.quantities.vessel), ['P2', 'P3']);
  assert.equal(tfc(1.001, '3000').status, 'plan');
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

test('C3-FX-13 C3-HI-09 in each of its five ways — the bound that failed is named; no second intermediate (acceptance 16, V4)', () => {
  const stock100 = (extra) => plan({ stock: { value: '100', unit: 'µg/mL' }, ...extra });
  // (1) series floor: f = 5 < 10, direct transfer 1 < 2.
  const floor = stock100({ target: { form: 'single', value: '20', unit: 'µg/mL' }, volume: { value: '5', unit: 'µL' } });
  assert.deepEqual(rejectCodes(floor), ['C3-HI-09']);
  assert.equal(floor.rejections[0].quantities.bound, 'series floor');
  assert.match(floor.rejections[0].message, /series floor, 10/);
  assert.match(floor.rejections[0].message, /remedy is the stated volume/);
  assert.doesNotMatch(floor.rejections[0].message, /recommend/i);
  // (1b) the series floor at its boundary: f = 10 exactly, direct transfer 1 < 2.
  //      C3-DT-06 step 2 takes g < f, so at f = 10 the only candidate is the point
  //      itself and the step is rejected, not planned. URS v0.4.1 step 5 reads
  //      "f < 10"; the boundary is f <= 10 (owner's T3, editorial at v0.4.2).
  const floorExact = stock100({ target: { form: 'single', value: '10', unit: 'µg/mL' }, volume: { value: '10', unit: 'µL' } });
  assert.deepEqual(rejectCodes(floorExact), ['C3-HI-09']);
  assert.equal(floorExact.rejections[0].quantities.bound, 'series floor');
  assert.match(floorExact.rejections[0].message, /series floor, 10/);
  assert.match(floorExact.rejections[0].message, /remedy is the stated volume/);
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
  // (5) the destination diluent bound, added at v0.4.2: an intermediate exists
  //     in the series, but it would leave the destination below the minimum.
  const destDiluent = stock100({ target: { form: 'single', value: '9.9', unit: 'µg/mL' }, volume: { value: '10', unit: 'µL' } });
  assert.deepEqual(rejectCodes(destDiluent), ['C3-HI-09']);
  assert.equal(destDiluent.rejections[0].quantities.bound, 'destination diluent');
  assert.match(destDiluent.rejections[0].message, /destination diluent bound/);
  // The five ways name five different bounds.
  const named = [floor, min, cap, src, destDiluent].map((r) => r.rejections[0].quantities.bound);
  assert.equal(new Set(named).size, 5, `five distinct bounds, got ${named.join(', ')}`);
  for (const r of [floor, floorExact, min, cap, src, destDiluent]) {
    assert.equal(r.vessels.length, 0);
    assert.ok(!r.vessels.some((v) => v.kind === 'intermediate'));
  }
});

test('C3-FL-01 either side of and exactly on the minimum, on the DISPLAYED transfer (C3-PC-01, V3)', () => {
  // stock 1000, F = 1000: T = target (µL) exactly. The comparison is against the
  // volume the bench sets, so 1.995 µL is set as 2.00 µL and is pipettable, and
  // 1.994 µL is set as 1.99 µL and is not.
  const t = (v) => plan({ target: { form: 'single', value: v, unit: 'µg/mL' }, volume: { value: '1000', unit: 'µL' } });
  assert.deepEqual(codes(t('2')), []);
  assert.deepEqual(codes(t('2.001')), []);
  assert.deepEqual(codes(t('1.995')), [], 'displays as 2.00 µL, so it is pipettable');
  assert.deepEqual(codes(t('1.994')), ['C3-FL-01'], 'displays as 1.99 µL, so it is not');
  assert.equal(vessel(t('1.994'), 'P1').sourceLabel, 'I1');
  assert.equal(vessel(t('1.995'), 'P1').sourceLabel, 'S');
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

// ---------------------------------------------------------------------------
// URS v0.4.2: the diluent minimum (C3-HI-10) and the destination diluent bound
// ---------------------------------------------------------------------------

test('C3-FX-17 C3-HI-10 on a direct step — the sub-minimum diluent withholds the plan, and the neighbour exactly at the minimum plans', () => {
  // Stock 100 → 99 µg/mL, minimum 2 µL. At F = 100 the diluent is 1.00 µL.
  const at = (volume) => plan({ stock: { value: '100', unit: 'µg/mL' }, target: { form: 'single', value: '99', unit: 'µg/mL' }, volume: { value: volume, unit: 'µL' } });
  const under = at('100');
  assert.deepEqual(rejectCodes(under), ['C3-HI-10']);
  const x = under.rejections[0];
  assert.equal(x.quantities.vessel, 'P1');
  assert.equal(x.quantities.diluent, '1.00');
  assert.equal(x.quantities.minimum, '2');
  assert.match(x.message, /1\.00 µL of diluent/);
  assert.match(x.message, /below the declared minimum reliable transfer volume of 2 µL/);
  assert.match(x.message, /The remedy is the stated volume\./);
  assert.doesNotMatch(x.message, /recommend/i);
  assert.equal(under.vessels.length, 0, 'withheld: no plan is shown');
  // Neighbour: F = 200 gives transfer 198 µL and diluent 2.00 µL, exactly at the minimum.
  const on = at('200');
  assert.equal(on.status, 'plan');
  assert.equal(vessel(on, 'P1').volumes.diluent.display, '2.00');
  assert.deepEqual(codes(on), []);
});

test('C3-HI-10 boundary either side of the minimum, and the zero-diluent exemption (C3-FX-12)', () => {
  // Stock 100 → 99 µg/mL: the transfer is 99% of the stated volume and stays
  // well above the minimum, so the diluent alone is under test. A factor of 2
  // would not do: there the transfer fails the minimum first and C3-HI-09
  // answers before C3-HI-10 is reached.
  const at = (volume) => plan({ stock: { value: '100', unit: 'µg/mL' }, target: { form: 'single', value: '99', unit: 'µg/mL' }, volume: { value: volume, unit: 'µL' } });
  assert.equal(at('300').status, 'plan', 'diluent 3.00 µL, above');
  assert.equal(at('200').status, 'plan', 'diluent 2.00 µL, exactly on');
  assert.deepEqual(rejectCodes(at('150')), ['C3-HI-10'], 'diluent 1.00 µL, below');
  assert.equal(vessel(at('300'), 'P1').volumes.diluent.display, '3.00');
  assert.equal(at('150').rejections[0].quantities.diluent, '1.00');
  // A zero diluent is not an act and is exempt: target = stock adds none.
  const stockItself = plan({ stock: { value: '1000', unit: 'µg/mL' }, target: { form: 'single', value: '1000', unit: 'µg/mL' }, volume: { value: '100', unit: 'µL' } });
  assert.equal(stockItself.status, 'plan');
  assert.deepEqual(codes(stockItself), ['C3-FL-09']);
  assert.equal(vessel(stockItself, 'P1').volumes.diluent.display, '0');
});

test('C3-FX-18 the destination diluent bound — C3-HI-09 names it differently from the series floor (acceptance 30)', () => {
  const at = (stock, target, volume) => plan({ stock: { value: stock, unit: 'µg/mL' }, target: { form: 'single', value: target, unit: 'µg/mL' }, volume: { value: volume, unit: 'µL' } });
  // f = 10.1: the direct transfer is 0.990 µL, and the only intermediate (g = 10)
  // would leave 0.100 µL of diluent in the destination.
  const main = at('100', '9.9', '10');
  assert.deepEqual(rejectCodes(main), ['C3-HI-09']);
  assert.equal(main.rejections[0].quantities.bound, 'destination diluent');
  assert.match(main.rejections[0].message, /destination diluent bound/);
  assert.match(main.rejections[0].message, /remedy is the stated volume/);
  assert.doesNotMatch(main.rejections[0].message, /series floor/);
  assert.equal(main.vessels.length, 0);
  // Neighbours at a 2 µL minimum: f = 12 is preparable through g = 10; f = 11 is
  // the boundary and fails; f = 10 fails on the series floor, named differently.
  const twelve = at('120', '10', '15');
  assert.equal(twelve.status, 'plan');
  assert.equal(vessel(twelve, 'P1').sourceLabel, 'I1');
  assert.equal(vessel(twelve, 'P1').volumes.transferIn.display, '12.5');
  assert.equal(vessel(twelve, 'P1').volumes.diluent.display, '2.50');
  assert.deepEqual(codes(twelve), ['C3-FL-01']);
  const eleven = at('110', '10', '15');
  assert.deepEqual(rejectCodes(eleven), ['C3-HI-09']);
  assert.equal(eleven.rejections[0].quantities.bound, 'destination diluent');
  const ten = at('100', '10', '10');
  assert.deepEqual(rejectCodes(ten), ['C3-HI-09']);
  assert.equal(ten.rejections[0].quantities.bound, 'series floor');
  assert.match(ten.rejections[0].message, /series floor, 10/);
  assert.doesNotMatch(ten.rejections[0].message, /destination diluent/);
  // The published consequence states a floor per basis (C3-DT-06 step 5, S1).
  assert.match(main.intermediateRule.consequence, /f ≤ 11/);
  assert.match(main.intermediateRule.consequence, /diluent-volume basis/);
});

test('the destination diluent bound does not arise under the diluent-volume basis, where the diluent is stated (S1)', () => {
  // S1's worked example: stock 100 → 9.52381 µg/mL, D = 10 µL, m = 2 µL.
  // Direct transfer 1.05 µL; through I1 at g = 10, a 200 µL intermediate.
  const r = plan({ stock: { value: '100', unit: 'µg/mL' }, target: { form: 'single', value: '9.52381', unit: 'µg/mL' }, basis: 'diluent', volume: { value: '10', unit: 'µL' } });
  assert.equal(r.status, 'plan', JSON.stringify(r.rejections));
  const i1 = vessel(r, 'I1');
  assert.equal(i1.volumes.total.display, '200');
  assert.equal(i1.volumes.transferIn.display, '20.0');
  assert.equal(i1.volumes.diluent.display, '180');
  const p1 = vessel(r, 'P1');
  assert.equal(p1.volumes.transferIn.display, '200');
  assert.equal(p1.volumes.diluent.display, '10'); // the stated D, echoed as entered
  assert.deepEqual(codes(r).sort(), ['C3-FL-01', 'C3-FL-05']);
});

test('R1 — every reject condition that holds is reported together, not just the first', () => {
  // Agent Nadira's example: diluent basis, D = 1 µL, stock 100 → 50 µg/mL. The
  // stated diluent is below the minimum AND the step factor of 2 is below the
  // series floor. A user told only about the step would fix it and then meet the
  // other. Withholding gives the whole reason.
  const r = plan({ stock: { value: '100', unit: 'µg/mL' }, target: { form: 'single', value: '50', unit: 'µg/mL' }, basis: 'diluent', volume: { value: '1', unit: 'µL' } });
  assert.equal(r.status, 'rejected');
  assert.deepEqual(rejectCodes(r).sort(), ['C3-HI-09', 'C3-HI-10']);
  const ten = r.rejections.find((x) => x.code === 'C3-HI-10');
  const nine = r.rejections.find((x) => x.code === 'C3-HI-09');
  assert.equal(ten.quantities.statedDiluent, '1');
  assert.equal(ten.quantities.unit, 'µL');
  assert.match(ten.message, /The remedy is the stated diluent volume\./);
  assert.equal(nine.quantities.bound, 'series floor');
  // Each vessel that fails C3-HI-10 is named, not only the first.
  // At 150 µL both points leave 1.00 µL of diluent, and both are named.
  const many = plan({ stock: { value: '100', unit: 'µg/mL' }, target: { form: 'list', values: ['99', '99.5'], unit: 'µg/mL' }, route: 'independent', volume: { value: '150', unit: 'µL' } });
  assert.deepEqual(rejectCodes(many), ['C3-HI-10', 'C3-HI-10']);
  assert.deepEqual(many.rejections.map((x) => x.quantities.vessel), ['P1', 'P2']);
  // A condition that leaves the plan undefined still stops the arithmetic. The
  // stated diluent is reported beside it, because that condition holds on the
  // declarations whatever the stock is; no step-level reject is invented, since
  // there is nothing to compute past a stock of zero.
  const undefinedPlan = plan({ stock: { value: '0', unit: 'µg/mL' }, target: { form: 'single', value: '0', unit: 'µg/mL' }, basis: 'diluent', volume: { value: '1', unit: 'µL' } });
  assert.deepEqual(rejectCodes(undefinedPlan), ['C3-HI-01']);
  assert.ok(!rejectCodes(undefinedPlan).includes('C3-HI-09'));
  // The stated diluent is not reported here, and correctly: the only point is a
  // zero point, so no point receives D as diluent from a declaration the tool
  // can evaluate (U1 knock-on (a)). Where the plan is computable, the zero
  // point's own diluent is reported against the vessel — see the U1 fixtures.
});

test('K1 — rejection quantities carry the displayed precision and the unit the number is in', () => {
  const at = (stock, target, volume) => plan({ stock: { value: stock, unit: 'µg/mL' }, target: { form: 'single', value: target, unit: 'µg/mL' }, volume: { value: volume, unit: 'µL' } });
  // The message and the object state the same string: 0.100, not 0.10.
  const tenth = at('100', '9.9', '10').rejections[0];
  assert.equal(tenth.quantities.value, '0.100');
  assert.equal(tenth.quantities.unit, 'µL');
  assert.match(tenth.message, /0\.100 µL of diluent/);
  const forty = at('110', '10', '15').rejections[0];
  assert.equal(forty.quantities.value, '1.40');
  assert.match(forty.message, /1\.40 µL of diluent/);
  // The series floor is a factor bound, not a volume, so it carries no unit.
  const floor = at('100', '20', '5').rejections[0];
  assert.equal(floor.quantities.bound, 'series floor');
  assert.equal(floor.quantities.value, 10);
  assert.equal(floor.quantities.unit, null);
  // C3-HI-06's volumes are padded too.
  const hi06 = plan({ target: { form: 'list', values: ['750', '601'], unit: 'µg/mL' }, route: 'serial', basis: 'diluent', volume: { value: '10', unit: 'µL' } });
  assert.equal(hi06.rejections[0].quantities.transfer, '40.3');
  assert.equal(hi06.rejections[0].quantities.total, '40.0');
  // C3-HI-10's diluent likewise.
  const hi10 = at('100', '99', '150').rejections[0];
  assert.equal(hi10.quantities.diluent, '1.00');
  assert.equal(hi10.quantities.unit, 'µL');
  assert.equal(hi10.quantities.minimum, '2');
  assert.equal(hi10.quantities.minimumUnit, 'µL');
});

// ---------------------------------------------------------------------------
// U1: an undiluted point under the diluent-volume basis (Agent Nadira's rule)
// ---------------------------------------------------------------------------

test('U1 — under the diluent-volume basis an undiluted point is the stated volume of stock (C3-FX-12)', () => {
  const at = (D, targets) => plan({
    stock: { value: '100', unit: 'µg/mL' },
    target: Array.isArray(targets) ? { form: 'list', values: targets, unit: 'µg/mL' } : { form: 'single', value: targets, unit: 'µg/mL' },
    route: Array.isArray(targets) ? 'serial' : null,
    basis: 'diluent', volume: { value: D, unit: 'µL' },
  });

  // D = 10 µL: prepared as 10.0 µL of stock, no diluent, and C3-FL-09 says so.
  const ten = at('10', '100');
  assert.equal(ten.status, 'plan', JSON.stringify(ten.rejections));
  const p1 = vessel(ten, 'P1');
  assert.equal(p1.volumes.transferIn.display, '10.0');
  assert.equal(p1.volumes.diluent.display, '0');
  assert.equal(p1.isUndiluted, true);
  const fl09 = ten.flags.find((f) => f.code === 'C3-FL-09');
  assert.match(fl09.message, /the stated diluent volume is taken as the volume of stock for this point/);
  // Knock-on (b): C3-FL-05 no longer claims every vessel exceeds the stated volume.
  const fl05 = ten.flags.find((f) => f.code === 'C3-FL-05');
  assert.match(fl05.message, /each diluted vessel/);
  assert.match(fl05.message, /an undiluted point \(target = stock\) is the stated volume of stock/);

  // D = 1 µL: refused, and for the true reason. The 1 µL of STOCK cannot be
  // pipetted; at f = 1 no intermediate exists, so it is the series floor. Not
  // C3-HI-10, which would name a diluent volume this plan never pipettes.
  const one = at('1', '100');
  assert.deepEqual(rejectCodes(one), ['C3-HI-09']);
  assert.equal(one.rejections[0].quantities.bound, 'series floor');
  assert.match(one.rejections[0].message, /undiluted stock/);
  assert.match(one.rejections[0].message, /below the declared minimum of 2 µL/);
  assert.doesNotMatch(one.rejections[0].message, /diluent/);

  // Mixed: one undiluted point and one diluted point at D = 1 µL. The diluted
  // point does receive the stated diluent, so the declaration-level C3-HI-10
  // fires again — beside the step-level reject (R1).
  const mixed = at('1', ['100', '50']);
  assert.deepEqual(rejectCodes(mixed).sort(), ['C3-HI-09', 'C3-HI-10']);
  const stated = mixed.rejections.find((x) => x.code === 'C3-HI-10');
  assert.equal(stated.quantities.statedDiluent, '1');
  assert.equal(stated.quantities.unit, 'µL');

  // A zero point does pipette the stated diluent, so where it is the only point
  // the vessel itself is named — the declaration-level rule (a) does not hide it.
  const zero = at('1', ['0']);
  assert.deepEqual(rejectCodes(zero), ['C3-HI-10']);
  assert.equal(zero.rejections[0].quantities.vessel, 'P1');
});

test('U1 — the undiluted transfer is checked against the minimum under every basis', () => {
  const undiluted = (basis, volume) => plan({
    stock: { value: '100', unit: 'µg/mL' }, target: { form: 'single', value: '100', unit: 'µg/mL' },
    basis, volume: { value: volume, unit: 'µL' },
  });
  for (const basis of ['final', 'diluent']) {
    assert.equal(undiluted(basis, '10').status, 'plan', basis);
    assert.deepEqual(rejectCodes(undiluted(basis, '1')), ['C3-HI-09'], `${basis} at 1 µL`);
    assert.equal(undiluted(basis, '2').status, 'plan', `${basis} exactly at the minimum`);
  }
});

test('R1 — the three lists, as they go into URS v0.4.3', () => {
  // Each case below pairs its §7 condition with a step-level condition that
  // would also hold (a sub-minimum transfer at a factor below the series floor),
  // so the classification is visible: a condition that stops the calculation
  // admits no step-level reject beside it; one that does not, does.
  const withStepLevelAlsoHolding = (over) => plan({
    stock: { value: '100', unit: 'µg/mL' }, target: { form: 'single', value: '50', unit: 'µg/mL' },
    basis: 'diluent', volume: { value: '1', unit: 'µL' }, ...over,
  });
  const stepLevel = (r) => rejectCodes(r).filter((c) => c === 'C3-HI-06' || c === 'C3-HI-09');

  // 1. Stop the calculation — the plan is undefined and nothing is computed past it.
  const stops = {
    'C3-HI-01': { stock: { value: '0', unit: 'µg/mL' }, target: { form: 'single', value: '0', unit: 'µg/mL' } },
    'C3-HI-02': { target: { form: 'single', value: '-1', unit: 'µg/mL' } },
    'C3-HI-03': { target: { form: 'single', value: '150', unit: 'µg/mL' } },
    'C3-HI-04': { volume: { value: '0', unit: 'µL' } },
    'C3-HI-05': { target: { form: 'top-factor-count', top: '50', unit: 'µg/mL', factor: 1, count: 3 }, route: 'serial' },
    'C3-HI-07': { target: { form: 'list', values: ['50', '50'], unit: 'µg/mL' }, route: 'serial' },
    'C3-HI-08': { target: { form: 'single', value: '1', unit: 'µM' } },
  };
  for (const [code, over] of Object.entries(stops)) {
    const r = withStepLevelAlsoHolding(over);
    assert.ok(rejectCodes(r).includes(code), `${code} raised`);
    assert.deepEqual(stepLevel(r), [], `${code} stops the calculation, so no step-level reject is reported beside it`);
    assert.equal(r.vessels.length, 0, `${code}: no vessels`);
  }

  // 2. Declaration-level — reported beside whatever else holds.
  const declaration = withStepLevelAlsoHolding({});
  assert.deepEqual(rejectCodes(declaration).sort(), ['C3-HI-09', 'C3-HI-10']);
  assert.equal(declaration.rejections.find((x) => x.code === 'C3-HI-10').quantities.statedDiluent, '1');

  // 3. Step-level — every instance, and only where the plan is defined.
  //    C3-HI-10 on derived diluents, across a series: every failing vessel.
  const manyTen = plan({ stock: { value: '100', unit: 'µg/mL' }, target: { form: 'list', values: ['99', '99.5'], unit: 'µg/mL' }, route: 'independent', volume: { value: '150', unit: 'µL' } });
  assert.deepEqual(manyTen.rejections.map((x) => `${x.code}@${x.quantities.vessel}`), ['C3-HI-10@P1', 'C3-HI-10@P2']);
  //    C3-HI-09 in independent mode: the points are independent, so each is judged.
  const manyNine = plan({ stock: { value: '100', unit: 'µg/mL' }, target: { form: 'list', values: ['9.9', '9.8'], unit: 'µg/mL' }, route: 'independent', volume: { value: '10', unit: 'µL' } });
  assert.deepEqual(manyNine.rejections.map((x) => `${x.code}@${x.scope.vessel}`), ['C3-HI-09@P1', 'C3-HI-09@P2']);
  //    In serial mode the chain cannot be computed past a step with no plan, so
  //    it stops there. This is the one place "all of them" is bounded, and it is
  //    bounded by what can be computed, not by a choice to report less.
  const serial = plan({ stock: { value: '100', unit: 'µg/mL' }, target: { form: 'list', values: ['9.9', '1'], unit: 'µg/mL' }, route: 'serial', volume: { value: '10', unit: 'µL' } });
  assert.deepEqual(serial.rejections.map((x) => `${x.code}@${x.scope.vessel}`), ['C3-HI-09@P1']);
  //    C3-HI-06 reports every offending transfer.
  const hi06 = plan({ target: { form: 'list', values: ['750', '601'], unit: 'µg/mL' }, route: 'serial', basis: 'diluent', volume: { value: '10', unit: 'µL' } });
  assert.deepEqual(rejectCodes(hi06), ['C3-HI-06']);
});
