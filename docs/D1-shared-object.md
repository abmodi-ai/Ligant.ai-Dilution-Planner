# D1 — Shared result object (open item 8): answer in writing, day one

**Question (handoff §4 D1).** Confirm that the shared format — as shipped in the Antigen Density Calculator (C1) and as extended for C4's ordered series — can express: an ordered plan; per-step flag scope; vessel labels with each point's source-vessel label; the intermediate as a vessel; the closure residual per vessel; three concentrations per point (exact, achieved point value, bound). If it can, record how. If it cannot, stop and escalate (C3-OUT-05).

**Answer.** The shared format itself — its schema, or a sample of the C1 result object — was **not in the build package** (handoff §1 lists C1 and C4 URS v0.5 for conventions, not the object definition). Neither confirmation nor refutation is possible from the package, and neither is asserted here. This is recorded as an **escalation**, not as a confirmation:

- Open item 8 remains open. Acceptance 4 is recorded as *not testable yet* against the shared format.
- The format has **not** been extended, patched or relaxed locally. C3 emits a documented, versioned object (`schemaVersion: "1-c3-draft"`, `src/shared/result-object.js`) that is validated on every plan and carries everything D1 lists. It is C3's *statement of need*, to be reconciled against the shared format when that is supplied — by mapping, not by extension. The `draft` suffix is removed only when NADIRA and the C4 developer confirm the shared format expresses each item below.
- If C4's open item on the same question is resolved narrowly (ordered series with point-level flag scope but without vessel labels, source labels or the intermediate as a vessel), C3 re-opens it, as C3-OUT-05 requires.

**What C3 needs the shared format to express, and how the draft object expresses it.**

| Need | Where in the C3 draft object |
|---|---|
| An ordered plan | `vessels[]` in execution order; `steps[]` (every transfer, in order) |
| Per-step flag scope | `flags[].scope = { level: 'plan' \| 'vessel' \| 'step', vessel, from }`; a step is identified by its destination vessel label and its source; `vessels[].flags` mirrors the codes |
| Vessel labels; each point's source-vessel label | `vessels[].label` (unique; scheme in `labelScheme`), `vessels[].sourceLabel`; intermediates list `destinations[]` |
| The intermediate as a vessel | `vessels[].kind = 'intermediate'`, with `intermediateFactor`, `sizedBy`, the same `volumes` and `concentration` records as a point |
| The closure residual per vessel | `vessels[].volumes.residual` (string, exact decimal; `null` where no volume is derived), `closureTarget`, `closes` |
| Three concentrations per point | `concentration.exact` (unrounded double, from unrounded volumes), `concentration.achieved` (point value from displayed volumes, 6 sf display), `concentration.bound` (`status: 'open', openItem: 7` until the memo is signed) |
| Units on every quantity (C3-OUT-04) | every volume `{ display, unit, unrounded, internalUnrounded }`; every concentration `{ value, unit }` |
| Unrounded values (C3-UN-07) | `unrounded`/`internalUnrounded` on every volume; `concentration.exact.value` |
| Reason codes | the requirement ID is the code (`C3-FL-05`, `C3-HI-06`), following the C1 scheme as the handoff directs unless the shared object dictates otherwise |
| Handoff fields (C3-ST-05) | `declarations.basis`, `.route`, `.capability`, `.stock.formulation`, `.diluent`, `vessels[].stepsFromStock`, `flags[]` |
| Imported provenance (C3-ST-01, 03, 04) | `declarations.imported`, `declarations.overrides[]`, `flags[]` with `code: 'C3-FL-07'` and `origin` |

**Ask.** A. Modi / NADIRA: supply the shared-format definition or a C1 result object and, when available, a C4 object with an ordered series. The reconciliation is then a mapping exercise recorded in this file; the validator in `src/shared/result-object.js` is re-pointed at the confirmed format.

**Decision, 15 September 2026 (owner delegation; `docs/decisions.md` D-3).** C3's object is adopted as the format C3 ships, `schemaVersion` `1-c3`. Acceptance 4 is met against it. The table above is the reconciliation map for when the C1/C4 definition arrives; the C4 and C1 shapes C3 *reads* are in `src/import/shared-import.js`.
