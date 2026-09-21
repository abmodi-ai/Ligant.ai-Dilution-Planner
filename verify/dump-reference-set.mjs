// Dumps the reference set (inputs + the engine's unrounded and displayed values)
// for the independent reimplementation (acceptance 3). Run: node verify/dump-reference-set.mjs > verify/reference-set.json
import { planDilution } from '../src/engine/plan.js';
// The round-trip ULP count is the engine's derivation constant. It is no longer
// published in the result object: its registration is open until the memo is
// signed (docs/tolerance-memo.md), but acceptance 3 still compares against it.
import { ROUND_TRIP_ULP_PER_STEP } from '../src/engine/tolerances.js';

const base = { stock: { value: '1000', unit: 'µg/mL' }, stockProvenance: 'coa', targetProvenance: 'user', diluent: { name: 'PBS' }, minTransfer: { value: '2', unit: 'µL' }, volume: { value: '100', unit: 'µL' }, basis: 'final' };
const cases = {
  'FX-01': { ...base, stock: { value: '3.7', unit: 'mg/mL' }, target: { form: 'single', value: '0.123', unit: 'mg/mL' }, volume: { value: '875', unit: 'µL' } },
  'FX-04a': { ...base, target: { form: 'single', value: '12.4', unit: 'µg/mL' }, volume: { value: '1000', unit: 'µL' } },
  'FX-04b': { ...base, target: { form: 'single', value: '12.6', unit: 'µg/mL' }, volume: { value: '1000', unit: 'µL' } },
  'FX-05': { ...base, stock: { value: '100', unit: 'µg/mL' }, target: { form: 'list', values: ['10', '1', '0.1'], unit: 'µg/mL' }, volume: { value: '40', unit: 'µL' }, basis: 'available', route: 'serial' },
  'FX-06s': { ...base, target: { form: 'list', values: ['100', '50', '25'], unit: 'µg/mL' }, route: 'serial' },
  'FX-06i': { ...base, target: { form: 'list', values: ['100', '50', '25'], unit: 'µg/mL' }, route: 'independent' },
  'FX-07s': { ...base, target: { form: 'list', values: ['10', '1', '0.1'], unit: 'µg/mL' }, route: 'serial' },
  'FX-07i': { ...base, target: { form: 'list', values: ['1', '0.5'], unit: 'µg/mL' }, route: 'independent' },
  'FX-08': { ...base, volume: { value: '90', unit: 'µL' }, basis: 'diluent', target: { form: 'single', value: '100', unit: 'µg/mL' } },
  'FX-11': { ...base, target: { form: 'list', values: ['100', '10', '1', '0.1'], unit: 'µg/mL' }, route: 'serial' },
  'NR-serial': { ...base, stock: { value: '987.6', unit: 'µg/mL' }, target: { form: 'list', values: ['123', '45.6', '7.89', '0.123', '0.0123'], unit: 'µg/mL' }, route: 'serial', volume: { value: '875', unit: 'µL' } },
  'NR-diluent': { ...base, stock: { value: '987.6', unit: 'µg/mL' }, target: { form: 'list', values: ['123', '45.6', '7.89', '0.123'], unit: 'µg/mL' }, route: 'serial', basis: 'diluent', volume: { value: '90', unit: 'µL' } },
  'NR-available': { ...base, stock: { value: '100', unit: 'µg/mL' }, target: { form: 'list', values: ['10', '0.1', '0.01'], unit: 'µg/mL' }, volume: { value: '40', unit: 'µL' }, basis: 'available', route: 'serial' },
  'NR-independent': { ...base, stock: { value: '3.7', unit: 'mg/mL' }, target: { form: 'list', values: ['0.123', '0.0123', '0.00123'], unit: 'mg/mL' }, route: 'independent', volume: { value: '875', unit: 'µL' } },
  'TFC': { ...base, target: { form: 'top-factor-count', top: '100', unit: 'µg/mL', factor: 3, count: 4 }, route: 'serial', volume: { value: '300', unit: 'µL' } },
};
const out = {};
for (const [name, input] of Object.entries(cases)) {
  const r = planDilution(input);
  if (r.status !== 'plan') throw new Error(`${name}: ${r.status}`);
  out[name] = {
    input,
    ulpPerStep: ROUND_TRIP_ULP_PER_STEP,
    targets: r.declarations.target.values.map((t) => t.internal),
    vessels: r.vessels.filter((v) => v.kind !== 'stock').map((v) => ({
      label: v.label, kind: v.kind, source: v.sourceLabel, steps: v.stepsFromStock, g: v.intermediateFactor,
      T: v.volumes.transferIn.internalUnrounded, V: v.volumes.total.internalUnrounded, cExact: v.concentration.exact.value,
      Td: v.volumes.transferIn.display, Dd: v.volumes.diluent.display, total: v.volumes.total.display, residual: v.volumes.residual,
    })),
  };
}
console.log(JSON.stringify(out, null, 1));
