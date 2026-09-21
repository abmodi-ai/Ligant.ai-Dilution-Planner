import { test } from 'node:test';
import assert from 'node:assert/strict';
import { plan } from './helpers.js';
import { validateResultObject } from '../src/shared/result-object.js';
import { notebookText } from '../src/engine/format.js';
import { ENGINE_VERSION } from '../src/engine/version.js';
import { boundFor } from '../src/engine/plan.js';
import { renderPlanRegion } from '../src/ui/render.js';

const cases = {
  single: {},
  serial: { target: { form: 'list', values: ['10', '1', '0.1'], unit: 'µg/mL' }, route: 'serial' },
  independentShared: { target: { form: 'top-factor-count', top: '1', unit: 'µg/mL', factor: 2, count: 2 }, route: 'independent' },
  available: { stock: { value: '100', unit: 'µg/mL' }, target: { form: 'list', values: ['10', '1', '0.1'], unit: 'µg/mL' }, volume: { value: '40', unit: 'µL' }, basis: 'available', route: 'serial' },
  diluent: { basis: 'diluent', volume: { value: '90', unit: 'µL' } },
  zeroAndUndiluted: { target: { form: 'list', values: ['1000', '100', '0'], unit: 'µg/mL' }, route: 'serial' },
  rejected: { target: { form: 'list', values: ['200', '180'], unit: 'µg/mL' }, route: 'serial', basis: 'diluent', volume: { value: '10', unit: 'µL' } },
  incomplete: { stock: null },
};

test('acceptance 4 — every plan validates against the C3 draft of the shared format; JSON-serialisable; units on every quantity', () => {
  for (const [name, c] of Object.entries(cases)) {
    const r = plan(c);
    const problems = validateResultObject(r);
    assert.deepEqual(problems, [], `${name}: ${problems.join('; ')}`);
    const json = JSON.stringify(r);
    assert.ok(json.length > 0);
    assert.equal(r.engineVersion, ENGINE_VERSION);
    for (const v of r.vessels) {
      if (v.kind === 'stock') continue;
      for (const k of ['transferIn', 'diluent', 'total', 'remaining']) assert.equal(typeof v.volumes[k].unit, 'string', `${name} ${v.label} ${k}`);
      assert.equal(typeof v.concentration.exact.unit, 'string');
      assert.equal(v.concentration.bound.status, 'derived');
    }
    assert.equal(r.tolerances.roundTrip.status, 'derived');
    assert.equal(r.tolerances.achievedBound.status, 'derived');
  }
});

test('the validator rejects a plan whose flag scope does not resolve', () => {
  const r = plan(cases.serial);
  const bad = JSON.parse(JSON.stringify(r));
  bad.flags.push({ code: 'C3-FL-02', scope: { level: 'step', vessel: 'P9', from: 'S' }, message: 'x' });
  assert.ok(validateResultObject(bad).some((p) => /P9/.test(p)));
  bad.vessels[1].label = 'S';
  assert.ok(validateResultObject(bad).some((p) => /not unique/.test(p)));
});

test('C3-OUT-06 / C3-OUT-11 — the notebook text is rendered from the object only and preserves step order', () => {
  const r = plan(cases.serial);
  const txt = notebookText(r);
  const order = r.vessels.map((v) => v.label);
  let last = -1;
  for (const L of order) {
    const idx = txt.indexOf(`. ${L} —`);
    assert.ok(idx > last, `${L} in order`);
    last = idx;
  }
  assert.match(txt, /C3-FL-01/);
  assert.match(txt, /[Nn]ot qualified for GxP/);
  assert.match(txt, /does not verify what was prepared/);
  assert.match(txt, /engine \d+\.\d+\.\d+/);
  const rej = notebookText(plan(cases.rejected));
  assert.match(rej, /Plan withheld/);
  assert.match(rej, /C3-HI-06/);
});

test('acceptance 32 — the bound displays only while its register status is derived; the achieved value displays in both states', () => {
  const r = plan({ target: { form: 'single', value: '10', unit: 'µg/mL' } });
  const p1 = r.vessels.find((v) => v.label === 'P1');
  // Signed: the number travels in the object and is displayed.
  assert.equal(p1.concentration.bound.status, 'derived');
  assert.equal(typeof p1.concentration.bound.relative, 'number');
  assert.match(p1.concentration.bound.display, /^\d\.\d\d × 10⁻[⁰¹²³⁴⁵⁶⁷⁸⁹]$/);
  const shown = renderPlanRegion(r);
  assert.match(shown, /Bound on departure/);
  assert.match(shown, /±/);
  assert.doesNotMatch(shown, /derivation memo unsigned/);
  // Unsigned: null in the object (V1), and the page says why instead of showing
  // a number. Nothing else about the point changes — the achieved point value is
  // a computation and is displayed in both states.
  const withheld = boundFor({ bound: 0.01, boundOwn: 0.005, isZero: false }, 'open');
  assert.equal(withheld.status, 'open');
  assert.equal(withheld.relative, null);
  assert.equal(withheld.display, null);
  assert.equal(withheld.withheld, 'derivation memo unsigned');
  const openPlan = JSON.parse(JSON.stringify(r));
  for (const v of openPlan.vessels) {
    if (v.concentration && v.concentration.bound) v.concentration.bound = { ...withheld };
  }
  const gated = renderPlanRegion(openPlan);
  assert.match(gated, /bound: derivation memo unsigned/);
  assert.doesNotMatch(gated, /Bound on departure<\/span><span class="v">±/);
  for (const page of [shown, gated]) assert.match(page, /Achieved \(point value\)/);
});

test('C3-CN-01 — the register is in the result object, generated from this plan, with value, basis and status', () => {
  const r = plan({ target: { form: 'single', value: '10', unit: 'µg/mL' }, capacity: { value: '500', unit: 'µL' } });
  assert.ok(Array.isArray(r.register));
  for (const row of r.register) {
    assert.ok(row.threshold && row.basis && row.status, `register row incomplete: ${JSON.stringify(row)}`);
    assert.ok(['derived', 'measured', 'disclosed', 'proposed', 'open'].includes(row.status), row.status);
  }
  const by = (name) => r.register.find((x) => x.threshold === name);
  // Generated, not copied: the declared values are this plan's own.
  assert.equal(by('Vessel working capacity').value, '500 µL');
  assert.equal(by('Minimum reliable transfer volume').value, '2 µL');
  assert.match(by('Maximum single-transfer volume').value, /not declared for this plan/);
  // And the thresholds the engine computes with.
  assert.equal(by('Displayed precision, volumes').value, '3 significant figures');
  assert.equal(by('Round-trip tolerance, exact concentration').status, 'derived');
  assert.match(by('Round-trip tolerance, exact concentration').value, /6 ULP of the target per step/);
  assert.match(by('Round-trip tolerance, exact concentration').value, /engine's internal unit/);
  assert.equal(by('Intermediate factor series').status, 'proposed');
  const other = plan({ target: { form: 'single', value: '10', unit: 'µg/mL' }, minTransfer: { value: '5', unit: 'µL' } });
  assert.equal(other.register.find((x) => x.threshold === 'Minimum reliable transfer volume').value, '5 µL');
});
