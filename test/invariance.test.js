// URS §6 — invariance. C3-IV-01, IV-02 (preliminary shape only; the derived
// tolerance is open item 6), IV-03, IV-04, IV-05, IV-06 (in fixtures-hand),
// IV-08 (C3-FX-14).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { plan, vessel, codes, unroundedSnapshot, sameBits, sameBitsAndConcentration, halfUlp3sf, ulpDistance, D } from './helpers.js';

// Preliminary shape from URS §6 (NOT the tolerance; open item 6): 2–3 ULP per
// step, of order (2n + 1) ULP at point n. Used here only to show that the
// inserted defects of C3-IV-03 are detected by a margin that no plausible
// derived tolerance could absorb.
const PRELIMINARY_ROUND_TRIP_ULP = (stepsFromStock) => 2 * stepsFromStock + 1;

function roundTripErrorsUlp(r) {
  return r.vessels.filter((v) => v.kind === 'point' && !v.isZero).map((v) => {
    const target = r.declarations.target.values[v.pointIndex].internal;
    return { label: v.label, steps: v.stepsFromStock, ulp: ulpDistance(v.concentration.exact.value, target) };
  });
}

const SERIAL3 = { target: { form: 'list', values: ['10', '1', '0.1'], unit: 'µg/mL' }, route: 'serial' };

// Per-basis serial fixtures in which exactly one step needs an intermediate.
//  final/diluent: stock 1000, [10, 1, 0.1], F = 100 (D = 90): step S→P1 has f = 100, direct T = 1 (0.909) µL;
//                 g = 10 gives T_b = 10 µL. m in (1, 10] selects it; m ≤ 0.9 selects none.
//  available:     stock 100, [10, 0.1, 0.01], A = 40: P3: V = 40, T = 4; P2: V = 44, f = 100, direct T = 0.44;
//                 g = 10 gives T_b = 4.4 µL. m in (0.44, 4.4] selects it; m ≤ 0.44 selects none.
const IV08 = {
  final: { base: { ...SERIAL3, basis: 'final', volume: { value: '100', unit: 'µL' } }, withInter: ['1.2', '1.5', '2', '5'], none: ['0.2', '0.5', '0.9'] },
  diluent: { base: { ...SERIAL3, basis: 'diluent', volume: { value: '90', unit: 'µL' } }, withInter: ['1.2', '1.5', '2', '5'], none: ['0.2', '0.5', '0.9'] },
  available: { base: { stock: { value: '100', unit: 'µg/mL' }, target: { form: 'list', values: ['10', '0.1', '0.01'], unit: 'µg/mL' }, route: 'serial', basis: 'available', volume: { value: '40', unit: 'µL' } }, withInter: ['1', '1.5', '2', '4'], none: ['0.1', '0.2', '0.4'] },
};

test('C3-IV-01 closure: at every vessel with a derived volume, Tᵈ + Dᵈ = closure target + ρ exactly, |ρ| ≤ ½ unit of Dᵈ (property over many plans)', () => {
  let checked = 0;
  const stocks = ['1000', '3.7', '250', '0.987'];
  const targetsSets = [['10', '1', '0.1'], ['123', '45.6', '7.89', '0.123'], ['0.5', '0.05'], ['900', '450']];
  const volumes = ['100', '875', '1000', '40', '12.5', '1'];
  for (const stock of stocks) for (const values of targetsSets) for (const volume of volumes) for (const basis of ['final', 'available']) for (const route of ['serial', 'independent']) {
    if (basis === 'available' && route !== 'serial') continue;
    const r = plan({ stock: { value: stock, unit: 'mg/mL' }, target: { form: 'list', values, unit: 'mg/mL' }, volume: { value: volume, unit: 'µL' }, basis, route });
    if (r.status !== 'plan') continue;
    for (const v of r.vessels) {
      if (v.kind === 'stock' || v.isZero || !v.volumes.diluent.derived) continue;
      const Td = D.fromString(v.volumes.transferIn.display);
      const Dd = D.fromString(v.volumes.diluent.display);
      const total = D.fromString(v.volumes.total.display);
      const closure = D.fromString(v.volumes.closureTarget);
      const rho = D.fromString(v.volumes.residual);
      assert.equal(D.cmp(D.add(Td, Dd), total), 0, `${v.label}: total is Tᵈ + Dᵈ`);
      assert.equal(D.cmp(total, D.add(closure, rho)), 0, `${v.label}: total = closure + ρ`);
      assert.ok(D.cmp(D.abs(rho), halfUlp3sf(v.volumes.diluent.display)) <= 0, `${v.label}: |ρ| = ${v.volumes.residual} ≤ ½ unit of ${v.volumes.diluent.display}`);
      // Remaining is total − onwardᵈ, exactly.
      const onward = v.volumes.onward.reduce((a, o) => D.add(a, D.fromString(o.transfer.display)), D.ZERO);
      assert.equal(D.cmp(D.sub(total, onward), D.fromString(v.volumes.remaining.display)), 0, `${v.label}: remaining`);
      checked += 1;
    }
  }
  assert.ok(checked > 100, `checked ${checked} vessels`);
});

test('C3-IV-02 round trip — preliminary shape (2n+1 ULP) as a placeholder; the derived tolerance is open item 6', () => {
  const cases = [
    {},
    SERIAL3,
    { ...SERIAL3, basis: 'available', volume: { value: '40', unit: 'µL' }, stock: { value: '100', unit: 'µg/mL' } },
    { target: { form: 'list', values: ['123', '45.6', '7.89', '0.123'], unit: 'µg/mL' }, route: 'serial', stock: { value: '987.6', unit: 'µg/mL' }, volume: { value: '875', unit: 'µL' } },
    { target: { form: 'list', values: ['123', '45.6', '7.89', '0.123'], unit: 'µg/mL' }, route: 'independent', stock: { value: '987.6', unit: 'µg/mL' }, volume: { value: '875', unit: 'µL' } },
    { basis: 'diluent', volume: { value: '90', unit: 'µL' } },
  ];
  for (const c of cases) {
    const r = plan(c);
    assert.equal(r.status, 'plan', JSON.stringify(r.rejections));
    for (const e of roundTripErrorsUlp(r)) {
      assert.ok(e.ulp <= PRELIMINARY_ROUND_TRIP_ULP(e.steps), `${e.label}: ${e.ulp} ULP at ${e.steps} steps`);
    }
  }
});

test('C3-IV-03 the invariance tests can fail: floor and nudge are detected by C3-IV-02; the clamp is detected by C3-IV-08 (a)', () => {
  // Floor: transfers below m are floored to m — the exact concentration departs from the target by a factor.
  const floored = plan({ target: { form: 'single', value: '1', unit: 'µg/mL' } }, { defect: 'floor' });
  const eF = roundTripErrorsUlp(floored)[0];
  assert.ok(eF.ulp > 1e6, `floor: ${eF.ulp} ULP`);
  // Nudge: 1 ppb on the transfer — ~4.5 × 10^6 ULP, far outside any ULP-scale tolerance.
  const nudged = plan({}, { defect: 'nudge' });
  const eN = roundTripErrorsUlp(nudged)[0];
  assert.ok(eN.ulp > 1e5, `nudge: ${eN.ulp} ULP`);
  // Clamp: a transfer above the declared maximum is clamped to it — detected by threshold independence (a).
  const withMax = plan({ target: { form: 'single', value: '500', unit: 'µg/mL' }, maxTransfer: { value: '20', unit: 'µL' } }, { defect: 'clamp' });
  const without = plan({ target: { form: 'single', value: '500', unit: 'µg/mL' } }, { defect: 'clamp' });
  assert.ok(!sameBits(unroundedSnapshot(withMax).P1, unroundedSnapshot(without).P1), 'clamp changes a volume when the maximum is declared — C3-IV-08 (a) fails, as it must');
  // and also by C3-IV-02:
  assert.ok(roundTripErrorsUlp(withMax)[0].ulp > 1e6);
  // Control: without the defect, (a) holds on the same inputs.
  const okMax = plan({ target: { form: 'single', value: '500', unit: 'µg/mL' }, maxTransfer: { value: '20', unit: 'µL' } });
  const okNone = plan({ target: { form: 'single', value: '500', unit: 'µg/mL' } });
  assert.ok(sameBits(unroundedSnapshot(okMax).P1, unroundedSnapshot(okNone).P1));
  assert.deepEqual(codes(okMax), ['C3-FL-02']);
});

test('C3-IV-05 top-factor-count: the exact factor between consecutive points equals the declared factor at every step (6 sf), stock→top excluded', () => {
  const r = plan({ stock: { value: '1000', unit: 'µg/mL' }, target: { form: 'top-factor-count', top: '100', unit: 'µg/mL', factor: 3, count: 4 }, volume: { value: '300', unit: 'µL' }, route: 'serial' });
  assert.equal(r.status, 'plan', JSON.stringify(r.rejections));
  const p1 = vessel(r, 'P1');
  assert.equal(p1.factorFromPreviousPoint.isStockToTop, true);
  assert.equal(p1.factorFromSource.display, '10.0000'); // derived, stock → top
  for (const L of ['P2', 'P3', 'P4']) {
    const v = vessel(r, L);
    assert.equal(v.factorFromPreviousPoint.declared, 3);
    assert.equal(v.factorFromPreviousPoint.exactDisplay, '3.00000', L);
    assert.equal(v.concentration.target.derivedFromTop, true);
  }
  assert.equal(vessel(r, 'P2').concentration.target.value, '33.3333');
  // Through a planned intermediate (serial): stock 100, top 10, factor 100, count 2, F = 100, m = 2 -> S→P1 direct (10 µL); P1→P2 needs g = 10.
  const r2 = plan({ stock: { value: '100', unit: 'µg/mL' }, target: { form: 'top-factor-count', top: '10', unit: 'µg/mL', factor: 100, count: 2 }, route: 'serial' });
  assert.equal(r2.status, 'plan', JSON.stringify(r2.rejections));
  assert.equal(vessel(r2, 'P2').sourceLabel, 'I1');
  assert.equal(vessel(r2, 'P2').factorFromPreviousPoint.exactDisplay, '100.000');
});

test('C3-FX-14 / C3-IV-08 (a): the maximum single-transfer volume changes no volume in the plan (bit for bit)', () => {
  const bases = [
    {},
    SERIAL3,
    { ...SERIAL3, route: 'independent' },
    { ...SERIAL3, basis: 'available', volume: { value: '40', unit: 'µL' } },
    { ...SERIAL3, basis: 'diluent', volume: { value: '90', unit: 'µL' } },
  ];
  for (const b of bases) {
    const ref = unroundedSnapshot(plan(b));
    for (const max of ['0.5', '5', '50', '1000000']) {
      const s = unroundedSnapshot(plan({ ...b, maxTransfer: { value: max, unit: 'µL' } }));
      assert.deepEqual(Object.keys(s), Object.keys(ref));
      for (const L of Object.keys(ref)) assert.ok(sameBitsAndConcentration(ref[L], s[L]), `${JSON.stringify(b)} max=${max} ${L}`);
    }
  }
});

test('C3-FX-14 / C3-IV-08 (b): varying the minimum within the range selecting the same intermediates changes no volume off the intermediate (and, under the third basis, its source and upstream); no intermediate → nothing changes', () => {
  // Serial [10, 1, 0.1] from 1000, F = 100: direct T at step 1 is 1 µL. m ∈ (1, 10] selects g = 10 (T_b = 10 ≥ m).
  for (const basis of ['final', 'diluent', 'available']) {
    const { base: b, withInter, none } = IV08[basis];
    const ref = plan({ ...b, minTransfer: { value: withInter[0], unit: 'µL' } });
    assert.equal(ref.status, 'plan', JSON.stringify(ref.rejections));
    const I = ref.vessels.filter((v) => v.kind === 'intermediate');
    assert.equal(I.length, 1, `${basis}: one intermediate expected`);
    const inter = I[0];
    const excluded = new Set([inter.label]);
    if (basis === 'available') {
      // its source and every vessel upstream of it
      let src = inter.sourceLabel;
      while (src && src !== 'S') { excluded.add(src); src = vessel(ref, src).sourceLabel; }
    }
    const refS = unroundedSnapshot(ref);
    for (const m of withInter.slice(1)) {
      const r = plan({ ...b, minTransfer: { value: m, unit: 'µL' } });
      assert.equal(r.status, 'plan');
      assert.deepEqual(r.vessels.filter((v) => v.kind === 'intermediate').map((v) => [v.label, v.intermediateFactor, v.sourceLabel]), [[inter.label, inter.intermediateFactor, inter.sourceLabel]], 'same intermediate');
      const s = unroundedSnapshot(r);
      for (const L of Object.keys(refS)) {
        if (excluded.has(L)) continue;
        assert.ok(sameBits(refS[L], s[L]), `${basis} m=${m} ${L}`);
      }
      // The intermediate moved only as the rule predicts: F_int = max(g·m, round3(Σ onward)).
      const vI = vessel(r, inter.label);
      const g = vI.intermediateFactor;
      const gm = D.mulInt(D.fromString(m), g);
      const sumOnward = vI.volumes.onward.reduce((a, o) => a + o.transfer.internalUnrounded, 0);
      const predicted = D.max(gm, D.roundSig(D.fromNumberExact(sumOnward), 3));
      assert.equal(D.cmp(D.fromString(vI.volumes.closureTarget), predicted), 0, `${basis} m=${m}: intermediate total as predicted`);
    }
    // Range over which no intermediate is selected: every vessel identical.
    const ref0 = unroundedSnapshot(plan({ ...b, minTransfer: { value: none[0], unit: 'µL' } }));
    assert.ok(!Object.keys(ref0).some((L) => L.startsWith('I')));
    for (const m of none.slice(1)) {
      const s = unroundedSnapshot(plan({ ...b, minTransfer: { value: m, unit: 'µL' } }));
      assert.deepEqual(Object.keys(s), Object.keys(ref0));
      for (const L of Object.keys(ref0)) assert.ok(sameBitsAndConcentration(ref0[L], s[L]), `${basis} m=${m} ${L}`);
    }
  }
});

test('C3-FX-14 / C3-IV-08 (c): vessel capacity, absent, present and varied within the range selecting the same intermediates, changes no volume', () => {
  for (const basis of ['final', 'diluent', 'available']) {
    const b = { ...IV08[basis].base, minTransfer: { value: IV08[basis].withInter[2], unit: 'µL' } };
    const ref = plan(b);
    assert.equal(ref.status, 'plan');
    const refS = unroundedSnapshot(ref);
    const interKeys = ref.vessels.filter((v) => v.kind === 'intermediate').map((v) => [v.label, v.intermediateFactor]);
    for (const C of ['200', '1000', '50000']) {
      const r = plan({ ...b, capacity: { value: C, unit: 'µL' } });
      assert.equal(r.status, 'plan', `${basis} C=${C}`);
      assert.deepEqual(r.vessels.filter((v) => v.kind === 'intermediate').map((v) => [v.label, v.intermediateFactor]), interKeys);
      const s = unroundedSnapshot(r);
      for (const L of Object.keys(refS)) assert.ok(sameBitsAndConcentration(refS[L], s[L]), `${basis} C=${C} ${L}`);
    }
  }
});

test('C3-FX-14 / C3-IV-08 (d): with an intermediate planned, every vessel other than the intermediate, its source and its destination is identical to the plan with the minimum lowered so that none is planned (third basis: downstream of the destination only)', () => {
  for (const basis of ['final', 'diluent', 'available']) {
    const b = IV08[basis].base;
    const withI = plan({ ...b, minTransfer: { value: IV08[basis].withInter[2], unit: 'µL' } });
    const noI = plan({ ...b, minTransfer: { value: IV08[basis].none[0], unit: 'µL' } });
    assert.equal(withI.status, 'plan'); assert.equal(noI.status, 'plan');
    const I = withI.vessels.filter((v) => v.kind === 'intermediate');
    assert.equal(I.length, 1);
    const inter = I[0];
    const dest = withI.vessels.find((v) => v.sourceLabel === inter.label);
    const excluded = new Set([inter.label, inter.sourceLabel, dest.label]);
    const a = unroundedSnapshot(withI), c = unroundedSnapshot(noI);
    const order = withI.vessels.map((v) => v.label);
    const destPos = order.indexOf(dest.label);
    let compared = 0;
    for (const L of Object.keys(c)) {
      if (excluded.has(L)) continue;
      if (basis === 'available' && order.indexOf(L) < destPos) continue; // upstream vessels legitimately move under the backward solve
      assert.ok(sameBits(a[L], c[L]), `${basis} ${L}`);
      compared += 1;
    }
    assert.ok(compared >= 1, `${basis}: compared ${compared}`);
    if (basis === 'available') {
      // The upstream vessels are shown to have changed only through their onward transfer (V = A + onward).
      for (const L of Object.keys(c)) {
        if (order.indexOf(L) >= destPos || excluded.has(L)) continue;
        const va = vessel(withI, L), vc = vessel(noI, L);
        assert.equal(va.volumes.total.internalUnrounded, 40 + va.volumes.onward[0].transfer.internalUnrounded, `${L} with`);
        assert.equal(vc.volumes.total.internalUnrounded, 40 + vc.volumes.onward[0].transfer.internalUnrounded, `${L} without`);
      }
    }
  }
});

test('C3-ST-08 determinism: same inputs, same outputs, including the choice of intermediate', () => {
  const inputs = [{}, SERIAL3, { ...SERIAL3, route: 'independent' }, { target: { form: 'top-factor-count', top: '1', unit: 'µg/mL', factor: 2, count: 2 }, route: 'independent' }];
  for (const i of inputs) {
    const a = JSON.stringify(plan(i)), b = JSON.stringify(plan(i));
    assert.equal(a, b);
  }
});
