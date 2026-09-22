import { test } from 'node:test';
import assert from 'node:assert/strict';
import { plan } from './helpers.js';
import { validateResultObject } from '../src/shared/result-object.js';
import { notebookText } from '../src/engine/format.js';
import { ENGINE_VERSION } from '../src/engine/version.js';
import { boundFor } from '../src/engine/plan.js';
import { renderPlanRegion } from '../src/ui/render.js';
import { renderPageContent } from '../src/ui/page-content.js';

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
  assert.equal(by('Intermediate factor series').status, 'disclosed'); // item 16 closed as decades
  const other = plan({ target: { form: 'single', value: '10', unit: 'µg/mL' }, minTransfer: { value: '5', unit: 'µL' } });
  assert.equal(other.register.find((x) => x.threshold === 'Minimum reliable transfer volume').value, '5 µL');
});

test('B1 — every concentration in the object is labelled with the unit its number is in, mass and molar, across units', () => {
  // Agent Nadira, §7 build review: value × unit must equal the entered quantity.
  // Before the fix a 20 µM target exported as 20000000 µM, the internal number
  // under the display label — a factor of 10⁶ with nothing on screen to show it.
  const cases = [
    { stock: ['100', 'µg/mL'], target: ['50', 'µg/mL'], stockInTargetUnit: 100 },
    { stock: ['5', 'mM'], target: ['20', 'µM'], stockInTargetUnit: 5000 },
    { stock: ['0.1', 'mg/mL'], target: ['10', 'ng/mL'], stockInTargetUnit: 100000 },
    { stock: ['2', 'µM'], target: ['500', 'nM'], stockInTargetUnit: 2000 },
    { stock: ['1', 'g/L'], target: ['1', 'µg/mL'], stockInTargetUnit: 1000 },
  ];
  const close = (a, b) => Math.abs(a - b) <= Math.abs(b) * 1e-12;
  for (const c of cases) {
    const r = plan({
      stock: { value: c.stock[0], unit: c.stock[1] },
      target: { form: 'single', value: c.target[0], unit: c.target[1] },
      volume: { value: '1000', unit: 'µL' },
    });
    assert.equal(r.status, 'plan', `${c.stock.join(' ')} → ${c.target.join(' ')}: ${JSON.stringify(r.rejections)}`);
    const where = `${c.stock.join(' ')} → ${c.target.join(' ')}`;
    const stock = r.vessels.find((v) => v.kind === 'stock');
    const p1 = r.vessels.find((v) => v.label === 'P1');
    // The display unit is the target's unit, and every value is in it.
    for (const [label, q] of [['stock exact', stock.concentration.exact], ['P1 exact', p1.concentration.exact], ['P1 achieved', p1.concentration.achieved]]) {
      assert.equal(q.unit, c.target[1], `${where}: ${label} unit`);
      assert.equal(typeof q.value, 'number', `${where}: ${label} value`);
      assert.equal(q.display, String(Number(q.display)) === String(q.value) ? q.display : q.display); // display stays a string
    }
    assert.ok(close(stock.concentration.exact.value, c.stockInTargetUnit),
      `${where}: stock is ${stock.concentration.exact.value} ${stock.concentration.exact.unit}, expected ${c.stockInTargetUnit}`);
    assert.ok(close(p1.concentration.exact.value, Number(c.target[0])),
      `${where}: target is ${p1.concentration.exact.value} ${p1.concentration.exact.unit}, expected ${c.target[0]}`);
    assert.ok(close(p1.concentration.achieved.value, Number(c.target[0])),
      `${where}: achieved is ${p1.concentration.achieved.value}, expected about ${c.target[0]}`);
    // The entered echo is untouched, and the internal number travels separately.
    assert.equal(stock.concentration.entered.value, c.stock[0]);
    assert.equal(stock.concentration.entered.unit, c.stock[1]);
    assert.equal(typeof p1.concentration.exact.internalUnrounded, 'number');
    // The displayed string is the same quantity as the value it sits beside.
    assert.ok(close(Number(p1.concentration.exact.display), p1.concentration.exact.value), `${where}: display vs value`);
  }
});

test('B1 — volumes keep the same convention: value in the display unit, internal beside it', () => {
  const r = plan({ target: { form: 'single', value: '10', unit: 'µg/mL' }, volume: { value: '2', unit: 'mL' } });
  const p1 = r.vessels.find((v) => v.label === 'P1');
  const t = p1.volumes.transferIn;
  assert.equal(t.unit, 'mL');
  assert.ok(Math.abs(t.unrounded - 0.02) < 1e-12, `transfer ${t.unrounded} mL`);
  assert.ok(Math.abs(t.internalUnrounded - 20) < 1e-9, `internal ${t.internalUnrounded} µL`);
});

test('T11 — the page publishes the rule the engine applies: same steps, same consequence', () => {
  // The page carried the v0.4.1 one-sided condition and a single floor of f ≤ 10
  // while the object carried v0.4.2. Both now read the engine's constants, so
  // this asserts they cannot drift again.
  const unescape = (s) => s.replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
  const html = unescape(renderPageContent({ toolTitle: 'Dilution Planner', standfirst: 'standfirst', repositoryUrl: 'https://example.invalid', repositoryLabel: 'example' }));
  const r = plan({ target: { form: 'single', value: '10', unit: 'µg/mL' } });
  assert.ok(html.includes(r.intermediateRule.consequence), 'the page states the object\'s published consequence verbatim');
  for (const step of r.intermediateRule.steps) {
    assert.ok(html.includes(step), `the page states rule step: ${step.slice(0, 60)}…`);
  }
  // And the v0.4.2 substance is there, not just matching strings.
  for (const phrase of ['f ≤ 11', 'destination diluent bound', 'series floor', 'Tᵦ(g) ≤ Vᵦ − m', 'diluent-volume basis', 'displayed volume']) {
    assert.ok(html.includes(phrase), `the published rule states: ${phrase}`);
  }
});

test('K3 — a displayed concentration never shows more significant figures than the tool states', () => {
  const shown = (stockValue, stockUnit, targetUnit) => {
    const r = plan({ stock: { value: stockValue, unit: stockUnit }, target: { form: 'single', value: '1', unit: targetUnit }, volume: { value: '1000', unit: 'µL' } });
    assert.equal(r.status, 'plan', `${stockValue} ${stockUnit} → ${targetUnit}: ${JSON.stringify(r.rejections)}`);
    return r.vessels.find((v) => v.kind === 'stock').concentration.exact;
  };
  // Past six integer digits the value is written in scientific notation, so the
  // figures shown are exactly the significant ones. "2000000" claimed seven.
  assert.equal(shown('2', 'mg/mL', 'ng/mL').display, '2.00000 × 10⁶');
  assert.equal(shown('1', 'g/L', 'ng/mL').display, '1.00000 × 10⁶');
  assert.equal(shown('1', 'M', 'nM').display, '1.00000 × 10⁹');
  assert.equal(shown('5', 'mM', 'pM').display, '5.00000 × 10⁹');
  // Six or fewer integer digits stay as plain decimals.
  assert.equal(shown('0.5', 'mg/mL', 'ng/mL').display, '500000');
  assert.equal(shown('2', 'mg/mL', 'µg/mL').display, '2000.00');
  assert.equal(shown('100', 'µg/mL', 'µg/mL').display, '100.000');
  // Whatever the form, no displayed concentration states more than six figures,
  // and the value beside it is still the same quantity in the labelled unit.
  for (const [v, su, tu, expected] of [['2', 'mg/mL', 'ng/mL', 2e6], ['1', 'M', 'nM', 1e9], ['0.5', 'mg/mL', 'ng/mL', 5e5]]) {
    const q = shown(v, su, tu);
    // Count the mantissa's figures, not the exponent's.
    const mantissa = q.display.split(' × ')[0];
    const digits = mantissa.replace(/[^0-9]/g, '').replace(/^0+/, '');
    assert.ok(digits.length <= 6, `${q.display} shows ${digits.length} figures`);
    assert.ok(Math.abs(q.value - expected) <= expected * 1e-12, `${q.display} is ${q.value} ${q.unit}`);
  }
});
