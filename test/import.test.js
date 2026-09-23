// C3-FX-09 and the import boundary (C3-ST-01..04, 09). The transport is a pasted
// result object (docs/decisions.md D-2). The C4 object below is written to the C3
// reading of the shared format (docs/D1-shared-object.md).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseSharedObject } from '../src/import/shared-import.js';
import { planDilution } from '../src/engine/plan.js';
import { renderBenchSheet } from '../src/ui/sheet.js';
import { vessel } from './helpers.js';

const C4_OBJECT = {
  schema: 'ligant.bench-tools.result', tool: 'C4', resultId: 'c4-2026-0915-07', engineVersion: '0.5.2',
  series: { points: [{ target: { value: '10', unit: 'µg/mL' } }, { target: { value: '1', unit: 'µg/mL' } }, { target: { value: '0.1', unit: 'µg/mL' } }] },
  stainingVolume: { value: '100', unit: 'µL' }, cellNumber: '1e6', vendorBasis: 'vendor titration recommendation, 5 µL per 10⁶ cells',
  flags: [{ code: 'C4-FL-03', message: 'Point 3 is not directly preparable at the declared minimum transfer; plan an intermediate.', scope: { point: 3 } }],
};

function inputFrom(mapped, extra = {}) {
  return {
    stock: { value: '1000', unit: 'µg/mL' }, stockProvenance: 'vendor-datasheet', diluent: { name: 'stain buffer' },
    minTransfer: { value: '2', unit: 'µL' }, route: 'independent', ...mapped.fields, imported: mapped.imported, ...extra,
  };
}

test('C3-FX-09 a C4 series imported with a flag: C3-FL-07 restates it naming C4; basis fixed to final at the staining volume; receiving volume is the stain with the volume the vessel must already hold', () => {
  const mapped = parseSharedObject(JSON.stringify(C4_OBJECT));
  assert.equal(mapped.error, undefined, mapped.error);
  assert.deepEqual(mapped.fixed, ['target', 'volume', 'basis']);
  const r = planDilution(inputFrom(mapped));
  assert.equal(r.status, 'plan', JSON.stringify(r.rejections));
  assert.equal(r.declarations.basis.key, 'final');
  assert.equal(r.declarations.basis.fixedByImport, true);
  assert.equal(r.declarations.volume.value, '100');
  const fl7 = r.flags.filter((f) => f.code === 'C3-FL-07');
  assert.equal(fl7.length, 1);
  assert.match(fl7[0].message, /Imported from C4 \(result c4-2026-0915-07\): \[C4-FL-03\] Point 3 is not directly preparable/);
  assert.equal(fl7[0].origin.tool, 'C4');
  for (const L of ['P1', 'P2', 'P3']) {
    const v = vessel(r, L);
    assert.equal(v.receiving, 'stain');
    assert.equal(v.volumes.mustAlreadyHold.display, v.volumes.diluent.display);
  }
  // Independent: P1 (f = 100) via I1 at g = 10; P2 (f = 1000) via I2 at g = 100; P3 (f = 10⁴) via I3 at g = 1000; each transfer 10.0 µL, stain 90.0 µL.
  assert.deepEqual(['P1', 'P2', 'P3'].map((L) => vessel(r, L).sourceLabel), ['I1', 'I2', 'I3']);
  assert.equal(vessel(r, 'P3').volumes.mustAlreadyHold.display, '90.0');
  assert.equal(r.declarations.imported.cellNumber, '1e6');
  assert.match(r.declarations.imported.vendorBasis, /vendor titration/);
  // The sheet names the stain and the volume the vessel must already hold, and never calls it diluent.
  const sheet = renderBenchSheet(r, { toolTitle: 'Dilution Planner', publisher: 'Ligant', productLine: 'Ligant Bench Tools', toolId: 'C3' });
  assert.match(sheet, /stain already in vessel:<\/strong> <span class="num">90\.0<\/span> µL/);
  assert.doesNotMatch(sheet, /diluent <span class="num">90\.0/);
});

test('C3-ST-01 a series stripped of its flags is not accepted', () => {
  const { flags, ...stripped } = C4_OBJECT;
  assert.match(parseSharedObject(JSON.stringify(stripped)).error, /stripped of its flags/);
  assert.match(parseSharedObject('not json').error, /not valid JSON/);
  assert.match(parseSharedObject(JSON.stringify({ tool: 'C9', flags: [] })).error, /"tool" is the string "C9"/);
  // The message names what the object actually carried. The deployed C1 emits
  // `tool` as an object, and template coercion used to report that as
  // tool "[object Object]" — a description of JavaScript, not of the paste.
  const liveC1Shape = { tool: { id: 'C1', name: 'Molarity Converter', engineVersion: '0.6.0' }, flags: [] };
  const err = parseSharedObject(JSON.stringify(liveC1Shape)).error;
  assert.doesNotMatch(err, /\[object Object\]/);
  assert.match(err, /an object naming "C1", with keys id, name, engineVersion/);
  assert.match(parseSharedObject(JSON.stringify({ flags: [] })).error, /states no "tool"/);
  assert.match(parseSharedObject(JSON.stringify({ ...C4_OBJECT, stainingVolume: undefined })).error, /staining volume/);
});

test('C3-ST-03 a C1 value imported as the stock carries its provenance and flags', () => {
  const c1 = { schema: 'ligant.bench-tools.result', tool: 'C1', resultId: 'c1-44', concentration: { value: '6.67', unit: 'µM' }, molecularWeight: { value: '150000', unit: 'g/mol', source: 'vendor datasheet' }, massBasis: 'protein', flags: [{ code: 'C1-FL-02', message: 'Molecular weight from vendor datasheet, not measured.' }] };
  const mapped = parseSharedObject(JSON.stringify(c1));
  assert.equal(mapped.error, undefined);
  assert.deepEqual(mapped.fields, { stock: { value: '6.67', unit: 'µM' }, stockProvenance: 'c1' });
  const r = planDilution({ ...mapped.fields, imported: mapped.imported, target: { form: 'single', value: '0.667', unit: 'µM' }, targetProvenance: 'user', volume: { value: '100', unit: 'µL' }, basis: 'final', diluent: { name: 'PBS' }, minTransfer: { value: '2', unit: 'µL' } });
  assert.equal(r.status, 'plan');
  assert.equal(r.declarations.stock.provenance.key, 'c1');
  assert.match(r.flags.find((f) => f.code === 'C3-FL-07').message, /Imported from C1 \(result c1-44\): \[C1-FL-02\]/);
  assert.equal(vessel(r, 'P1').receiving, 'diluent');
});

test('C3-ST-04 replacing an imported declaration is visible on the output, naming what was imported and what replaced it', () => {
  const mapped = parseSharedObject(JSON.stringify(C4_OBJECT));
  const r = planDilution(inputFrom(mapped, { basis: 'diluent', volume: { value: '90', unit: 'µL' }, overrides: [{ field: 'basis', imported: 'final', replaced: 'diluent' }, { field: 'volume', imported: '100 µL', replaced: '90 µL' }] }));
  assert.equal(r.status, 'plan');
  assert.equal(r.declarations.overrides.length, 2);
  assert.equal(r.declarations.basis.fixedByImport, false);
});
