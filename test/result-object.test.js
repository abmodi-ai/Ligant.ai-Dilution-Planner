import { test } from 'node:test';
import assert from 'node:assert/strict';
import { plan } from './helpers.js';
import { validateResultObject } from '../src/shared/result-object.js';
import { notebookText } from '../src/engine/format.js';
import { ENGINE_VERSION } from '../src/engine/version.js';

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
      assert.equal(v.concentration.bound.status, 'open');
    }
    assert.equal(r.tolerances.roundTrip.status, 'open');
    assert.equal(r.tolerances.achievedBound.status, 'open');
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
  assert.match(txt, /engine 0\.\d+\.\d+/);
  const rej = notebookText(plan(cases.rejected));
  assert.match(rej, /Plan withheld/);
  assert.match(rej, /C3-HI-06/);
});
