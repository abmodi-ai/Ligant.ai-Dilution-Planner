# Engine input model

`planDilution(input)` takes one plain object. Values may be strings (preferred: the entered decimal is held exactly) or numbers. Every quantity carries a unit from the unit table (`src/engine/units.js`); the ASCII spelling `uL`/`uM` is accepted on input.

```js
{
  stock: { value: '3.7', unit: 'mg/mL' },                 // C3-SK-01; required; never defaulted
  stockProvenance: 'coa' | 'vendor-datasheet' | 'measured' | 'c1' | 'c7' | 'not-recorded',   // C3-SK-03; required
  stockAvailable: { value, unit } | null,                  // C3-SK-05; optional
  stockFormulation: string | null,                         // C3-SK-06; optional, recorded not assessed
  target:                                                  // C3-TG-01; exactly one form
      { form: 'single', value, unit }
    | { form: 'list', values: [...], unit }
    | { form: 'top-factor-count', top, unit, factor, count },
  targetProvenance: 'user' | 'c4' | 'other',               // C3-TG-04; required
  targetOrigin: { tool, resultId } | null,                 // required when provenance is not 'user'
  volume: { value, unit },                                 // C3-VB-01; one per plan
  basis: 'final' | 'diluent' | 'available',                // C3-VB-01; 'available' only for serial, >1 point (C3-VB-02)
  route: 'serial' | 'independent' | null,                  // C3-RT-01; required when >1 point; ignored and not recorded for 1 point (C3-RT-02)
  diluent: { name } | { notRecorded: true },               // C3-DL-01; "not recorded" is distinct from blank
  minTransfer: { value, unit },                            // C3-PC-01; required; UI pre-fills 2 µL marked as suggested
  maxTransfer: { value, unit } | null,                     // C3-PC-02; optional, no default
  capacity: { value, unit } | null,                        // C3-PC-03; optional, no default
  imported: null | {                                       // C3-ST-01..04, 09 — interface only (open item 2)
    tool: 'C4' | 'C1', resultId, fixed: ['basis','volume','target'],
    flags: [{ code, message, scope }], stainingVolume, cellNumber, vendorBasis
  },
  overrides: [{ field, imported, replaced }]               // C3-ST-04
}
```

Result: see `src/shared/result-object.js` (validator) and `docs/D1-shared-object.md`. `status` is `'plan'`, `'rejected'` (§7, `rejections[]`, no vessels) or `'incomplete'` (`incomplete[]`, a required declaration is missing — not a §7 condition).

Test-only second argument: `planDilution(input, { defect: 'clamp' | 'floor' | 'nudge' })` inserts a deliberate defect for C3-IV-03. The UI never passes it.
