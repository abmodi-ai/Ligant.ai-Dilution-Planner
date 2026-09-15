# C3 Dilution Planner — conformance audit

| Field | Value |
|---|---|
| Specification | URS v0.4.1 (released for build 14 September 2026) |
| Build | tag `c3-engine-0.2.0` on `claude/bench-tool-dev-z4nshl` (the tagged commit carries this audit and the code it audits), engine `0.2.0` (see B1). Supersedes the audit at `cff4036` (engine 0.1.0) |
| Date | 15 September 2026 |
| Decisions | Open items decided under owner delegation — `docs/decisions.md` D-1 … D-14. Rows that were "not testable yet" at `cff4036` on items 2, 6, 7 and 8 are now met on those decisions; NADIRA's review of D-1 (the tolerance derivation) is still expected at the §7 build review |
| To | A. Modi (owner), NADIRA (§7 build review) |

Statuses: **met** / **not met** / **not testable yet** (with the gating item). Evidence names a test (`file › test name`), a measurement record, or a rendered artefact with its configuration. Findings are proposed open items in `docs/open-items.md` (P1–P17); they are not spec edits.

## Facts about the shipped build (B1–B9)

| # | Item | Record |
|---|---|---|
| B1 | Commit and engine version; versioning rule | tag `c3-engine-0.2.0`; engine `0.2.0` (0.1.0 → 0.2.0: per-point achieved bound and registered tolerances in the object; import path); rule in `src/engine/version.js`: MINOR changes whenever calculation behaviour changes (any change to the volumes, concentrations, factors, flags, rejects or intermediate selection for a given input); PATCH for changes that cannot alter any output; MAJOR for an incompatible input or object change. Rendering and page changes do not change the engine version |
| B2 | Test-suite composition at tag `c3-engine-0.2.0` (57 tests, all passing; plus the Python comparison of 46 vessels) | hand-calculation 9 (FX-01, 02, 03, 04, 05, 06, 07×2, 08) · closure 1 property test over >100 vessels (IV-01) plus FX-04/05 · invariance 5 (IV-02 against the derived tolerance, IV-04 via FX-06, IV-05, IV-06 via FX-02, acceptance 7 bound property over >200 points) · threshold independence 4 (IV-08 a–d) · inserted defects 1 (IV-03, exceedance against the derived tolerance) · rejects 10 (HI-01…09 incl. FX-13 four ways, FX-15) · flags 7 (FL-01, 02, 03, 04+10, 05, 06, 07; FL-08 and FL-09 inside the HI-02 and HI-03 tests) · boundary: inside the reject and flag tests (FX-12) · negative control 2 (FX-10, FX-11) · import/handoff 4 (FX-09, ST-01, ST-03, ST-04) · state/determinism 4 (ST-08, DT-09, acceptance 18, VB-02) · result object 3 · rounding primitive 7 · units 2 · network 0 automated (`scripts/viewport-check.mjs` records every request; acceptance 22 is deployed-only) · independent reimplementation: `verify/reimplementation.py` (Python), 15 cases, 46 vessels |
| B3 | Coverage | Measured with `node --test --experimental-test-coverage` at tag `c3-engine-0.2.0`: all files 96.05% lines, 86.88% branches, 93.88% functions; `plan.js` 97.97 / 90.53 / 97.50; `tolerances.js` 100 / 90.91 / 100; `decimal.js` 85.60 / 89.19 / 71.43; `result-object.js` 100 / 82.22 / 100; `shared-import.js` 100 / 54.10 / 100; `sheet.js` 96.55 / 60.42 / 91.67. UI modules (`src/ui/app.js`, `render.js`, `page-content.js`) are exercised by the browser scripts, not by the node suite; `sheet.js` is covered through the import test |
| B4 | Rounding-primitive measurement | `docs/D2-rounding-measurement.md` — Node 22.22.2, V8 12.4.254.21, 16 tie-adjacent cases; the engine rounds on the exact BigInt expansion; `toPrecision` agreed 16/16 but is not used |
| B5 | Shared-object confirmation or escalation | Escalated on day one (`docs/D1-shared-object.md`: the shared format was not in the package), then **decided under owner delegation** (D-3): C3's validated `1-c3` object is the format C3 ships; the D1 table is the reconciliation map |
| B6 | Browser configuration, reference viewport | `docs/D5-browser-configuration.md` — Chromium 141 (Playwright chromium-1194), 1366 × 650 CSS px, DPR 1, zoom 100%, headless; local result 0 violations, 0 cross-origin requests |
| B7 | Operation sequence per step per basis | `docs/operation-sequence.md` |
| B8 | Vessel-label scheme | `S` stock; `I1, I2, …` intermediates in execution order; `P1, P2, …` points in the order entered. Stated on the output, in the object (`labelScheme`) and on the sheet |
| B9 | URS/build disagreements and unmeetable requirements | `docs/open-items.md` P1–P17, each decided in `docs/decisions.md`; the substantive ones are P2 (capacity on a shared intermediate), P3 (undiluted point under the diluent basis), P4 (series floor at f = 10), P5/P6 (comparison layers), P7 (intermediate total displayed), P16 (view on item 16) |

## Requirements

| ID | Status | Evidence |
|---|---|---|
| C3-SK-01 | met | `plan.js normalise` — required, unit required; `rejects-flags › acceptance 18` |
| C3-SK-02 | met | no default, placeholder or suggestion in `index.html` (`#stock-value` empty; help text states it) |
| C3-SK-03 | met | six options, required; `acceptance 18` |
| C3-SK-04 | met | `declarations.stock.provenance.key = 'not-recorded'` vs `incomplete` for blank; `rejects-flags › C3-FL-04 and C3-FL-10` |
| C3-SK-05 | met | `rejects-flags › C3-FL-06` |
| C3-SK-06 | met | optional field; output states "not recorded" when absent (`notes`, declarations); `acceptance 18` |
| C3-TG-01 | met | three forms, radio-exclusive in UI; engine rejects unknown form |
| C3-TG-02 | met | `rejects-flags › C3-HI-08` |
| C3-TG-03 | met | list form: `factorFromSource.display` derived; no `declaredFactor`; `invariance › C3-IV-05` |
| C3-TG-04 | met | required; origin tool and id required when imported; shown in declarations and sheet |
| C3-VB-01 | met | one volume per plan; three-option single-select with the exact labels (`BASIS`, `index.html`) |
| C3-VB-02 | met | UI disables the third option with the reason visible; engine: `rejects-flags › C3-VB-02` |
| C3-VB-03 | met | `fixtures-hand › C3-FX-08` (`finalVolume` stated) |
| C3-VB-04 | met | `total`/`remaining` from displayed values under every basis; `FX-05` remaining 40.04 ≠ A; render labels "Total prepared" / "Remaining after onward" |
| C3-VB-05 | met | `ADDITIVITY` on output, object and sheet; `statedVolumeIs` per basis |
| C3-VB-06 | met | page and form state pipetted-only; volumetric in out-of-scope list |
| C3-RT-01 | met | required for >1 point; `acceptance 18` |
| C3-RT-02 | met | single point: route not recorded (`route.notApplicable`); field hidden |
| C3-RT-03 | met | no pre-selection; label says so |
| C3-RT-04 | met | `stepsFromStock`, `sourceLabel` derived from the constructed plan; `FX-07` (2, 3, 4 steps; shared source) |
| C3-RT-05 | met | `factorConvention` on output; `factorFromSource.display` per step |
| C3-DL-01 | met | required; "not recorded" accepted, distinguishable, raises FL-10 |
| C3-DL-02 | met | free text; no validation |
| C3-PC-01 | met | required; pre-fill 2 µL marked "Suggested default" and hidden once changed |
| C3-PC-02 | met | optional, no default; FL-02 not evaluated when absent, note emitted; `rejects-flags › C3-FL-02` |
| C3-PC-03 | met | optional, no default; FL-03 and (iii) not applied when absent, note emitted; `C3-FL-03` |
| C3-PC-04 | met | `capabilitySentence` in declarations bar, derivation, notebook, sheet |
| C3-UN-01 | met | every numeric field paired with a unit select |
| C3-UN-02 | met | `units.test › D3` |
| C3-UN-03 | met | one multiplication by an integer power of ten; `units.test` |
| C3-UN-04 | met | 3 sf on every displayed volume; derived volumes not given extra figures (`FX-04` 988, `FX-05` 40.0) |
| C3-UN-05 | met | 6 sf on intermediate concentration, factors, achieved; target echoed as entered (`FX-01` "0.123", `FX-05` "10") |
| C3-UN-06 | met | `docs/D2`; `rounding-measurement.test`, `decimal.test` |
| C3-UN-07 | met | `unrounded`, `internalUnrounded`, `concentration.exact.value` in the object; `result-object.test` |
| C3-UN-08 | met | `precision` in object; stated on screen, notebook and sheet |
| C3-UN-09 | met | `units.test › D3` — dimension as a table field |
| C3-DT-01 | met | per vessel: transfer in, diluent, total, remaining, concentration |
| C3-DT-02 | met | `relationsFor(basis)` displayed for the declared basis only |
| C3-DT-03 | met | `FX-05` (backward solve; A + onward); `FX-07` serial (stock's onward is to I1) |
| C3-DT-04 | met | `FX-04` (both signs), `FX-05`, `FX-08` (none derived), `invariance › C3-IV-01` (total = Tᵈ + Dᵈ = closure + ρ exactly) |
| C3-DT-05 | met | `FX-07`; `invariance › C3-IV-05` second case (stock → top step through an intermediate) |
| C3-DT-06 | met | rule and consequence on the page; deterministic (`ST-08`); unique g (`evaluateCandidates` takes the first passing g) |
| C3-DT-07 | met | `FX-13`: rejected in all four ways, no second intermediate |
| C3-DT-08 | met | `stockConsumed` includes intermediates (`FX-07` 2.00 µL via I1) |
| C3-DT-09 | met | `fixtures-hand › C3-DT-09` |
| C3-IV-01 | met | `invariance › C3-IV-01` property test; `FX-04` |
| C3-IV-02 | met | `fixtures-hand › C3-FX-03`, `invariance › C3-IV-02` within 6 ULP per step from stock (`docs/tolerance-memo.md` §1) |
| C3-IV-03 | met | `invariance › C3-IV-03`: floor and nudge detected by IV-02 and exceed the derived tolerance by >10⁴×; clamp detected by IV-08 (a) and by IV-02; controls pass |
| C3-IV-04 | met | `FX-06` |
| C3-IV-05 | met | `invariance › C3-IV-05`, incl. through an intermediate |
| C3-IV-06 | met | `FX-02` |
| C3-IV-07 | met | per-point bound `concentration.bound` from the registered derivation, compounded along the chain, incl. the residual term; `invariance › acceptance 7` (>200 points); `docs/tolerance-memo.md` §2 |
| C3-IV-08 | met | `invariance › C3-IV-08 (a)–(d)`, bit for bit on unrounded volumes, exclusions per E1; intermediate shown to move as `max(g·m, round3(Σ))` |
| C3-HI-01…05, 07, 08 | met | `rejects-flags`, either side and exactly on |
| C3-HI-06 | met | `rejects-flags › C3-HI-06` (equal = legal, remaining 0), `FX-15` |
| C3-HI-09 | met | `FX-13` four ways; bound and value named; no recommendation |
| C3-FL-01…06, 08…10 | met | `rejects-flags`; FL-01 the only flag when an intermediate is planned (`FX-07`) |
| C3-FL-07 | met | `import.test › C3-FX-09` (C4 object with a flag, restated naming C4 and the result id); `rejects-flags › C3-FL-07` |
| C3-FC-01 | met | page section "Failure classes this tool cannot detect", eight items incl. the two additivity cases |
| C3-FX-01, 02, 04–08, 10–15 | met | `fixtures-hand`, `rejects-flags`, `invariance` |
| C3-FX-03 | met | `fixtures-hand › C3-FX-03`, seven plans, ≥20 points |
| C3-FX-09 | met (D-2) | `import.test › C3-FX-09` — pasted C4 object written to the C3 reading of the shared format |
| C3-FX-16 | met | every fixture states its construction assumption in the test body; FX-01 avoids tie-adjacent values |
| C3-CN-01 | met | register on the page with values, bases and statuses; the two tolerance rows **derived** with their values and the memo named; the ~1% headline; assumption with scope; rule with consequence; C3-HI-06 sentence |
| C3-ST-01…04 | met (D-2, pasted-object transport) | `import.test`: flags required (ST-01); basis fixed to final at the staining volume and shown as fixed (ST-02); C1 value with provenance and flags (ST-03); replacement named on the output (ST-04) |
| C3-ST-05 | met | object carries basis, route, labels and sources, step counts, capability values, formulation, flags |
| C3-ST-06 | met | no storage API in shipped code (grep: none); every field is cleared by reload |
| C3-ST-07 | met | every input change recomputes the whole plan from scratch; nothing is retained (no value to mark); the third basis is unchecked, visibly, when it becomes unavailable |
| C3-ST-08 | met | `invariance › C3-ST-08` |
| C3-ST-09 | met | `import.test › C3-FX-09`: receiving = stain, `mustAlreadyHold` = staining volume − transfer on output, object and sheet; never called diluent |
| C3-OUT-01 | met | derivation section: relations, assumptions with scope, input echo with units, engine version |
| C3-OUT-02 | met | declarations bar and derivation, not only the echo |
| C3-OUT-03 | met | exact, achieved (point value), bound (value, compounded), residual where non-zero, per vessel |
| C3-OUT-04 | met | `result-object.test › acceptance 4` |
| C3-OUT-05 | met on D-3 | escalated on day one; C3's object adopted as shipped (`docs/D1-shared-object.md`, `docs/decisions.md` D-3) |
| C3-OUT-06 | met | screen, notebook, sheet and object all read from one result; `result-object.test › C3-OUT-06` |
| C3-OUT-07 | met | scope statement on output, page, sheet, footer |
| C3-OUT-08 | met | stated on output, separately |
| C3-OUT-09 | met | "plans preparation … does not verify" on output, page, sheet |
| C3-OUT-10 | met locally | bench sheet rendered (`scripts/out/bench-sheet-fx05.pdf`); acceptance 28 at deployment |
| C3-OUT-11 | met | `notebookText`; copy button with visible fallback |
| C3-OUT-12 | met | one convention stated on the sheet and output; basis labels agree with it |
| C3-OUT-13 | met | unique labels validated; `FX-07` shared source |
| C3-NF-01 | met locally; acceptance 22 at deployment | 0 cross-origin requests on the local build incl. the import path (the pasted object is parsed in the page); no `fetch`/XHR/WebSocket in code; CSP `connect-src 'none'` |
| C3-NF-02 | met | no account or login |
| C3-NF-03 | met locally; acceptance 29 at deployment | sticky declarations bar; flag chips on each step's header row; `viewport-check` 0 violations over the full scroll range |
| C3-NF-04 | met | `docs/D5` |
| C3-NF-05 | met | synchronous computation on every input event; no progress indicator exists |
| C3-NF-06 | met | standalone; no import dependency |
| C3-NF-07 | met | engine version on output, object, page, sheet; rule in B1 |

## Acceptance

| # | Status | Evidence |
|---|---|---|
| 1 | met | `FX-01`, `FX-04`, `FX-05` hand calculations to displayed precision |
| 2 | met | `FX-01` non-round, ties avoided |
| 3 | met | `verify/reimplementation.py` (Python, written from the URS and the operation sequence) agrees with the engine on 46 vessels in 15 cases: unrounded T, V and exact concentration within 6 ULP per step, displayed values and residuals exactly. `npm run verify:reimpl` |
| 4 | met (D-3) | every plan validates against the `1-c3` shared-object expression with per-step flag scope and vessel labels; `result-object.test` |
| 5 | met | `C3-IV-01` property; `FX-04` both signs, different decades, plus same-decade exact closure |
| 6 | met | `C3-FX-03`, `C3-IV-02` within the derived tolerance |
| 7 | met | `invariance › acceptance 7`: achieved departure ≤ stated bound at every point; bound compounds as registered; never above the worst case for its chain length |
| 8 | met | `C3-IV-03`; each inserted defect exceeds the derived tolerance; clamp detected by C3-IV-08 |
| 9 | met | `C3-IV-08 (a)–(d)` |
| 10 | met | `FX-06` |
| 11 | met | `C3-IV-05` |
| 12 | met | every §7 condition rejected naming quantity and reason |
| 13 | met | `FX-10`, `FX-11` no flags |
| 14 | met | reason codes resolvable to the step (`scope.vessel`, `scope.from`); FL-07 via `C3-FX-09` |
| 15 | met | boundary tests in `rejects-flags` incl. target = stock, target = 0, transfer = donating total |
| 16 | met | `FX-13` |
| 17 | met | `FX-15` |
| 18 | met | `rejects-flags › acceptance 18` |
| 19 | met (D-2) | `import.test › C3-FX-09`: FL-07 raised, basis fixed per ST-02, stain named with the volume the vessel must already hold, every imported flag restated with C4 named |
| 20 | met | whole-plan recompute on every change; no retained value |
| 21 | met | labels and sources on output, object and sheet; `FX-07` shared source |
| 22 | not testable yet (deployment) | slug decided (D-4); local build: 19 same-origin requests, 0 cross-origin, monitoring registered before load. To be run against `https://benchtools.ligant.ai/dilution-planner/` once deployed and after any CDN change |
| 23 | met | `C3-ST-08`; no state |
| 24 | met | no storage API; nothing persists |
| 25 | met | page register, assumption, rule with consequence, C3-HI-06 sentence |
| 26 | met | page failure classes incl. the two additivity cases |
| 27 | not testable yet (observation by A. Modi) | deployed build to be provided |
| 28 | not testable yet (print at deployment) | PDF rendered locally is complete without the application: labels, contents, additions and sources, bases, route, diluent, capability values, order of addition, stain volume for a C4 point |
| 29 | not testable yet (deployment) | local run 0 violations over 0..3685 px with the import fieldset present, configuration in D5 |

## Evidence for the tolerance memo (§9), not tolerances

`node scripts/empirical-sample.mjs 200000` (142,623 plans; seeded LCG; stocks 0.01–10⁴, factors 1.5–100, 1–5 points, all three bases, both routes): maximum round-trip error 3.00 ULP at 1 step, 5.00 at 2, 6.00 at 3, 7.00 at 4, 9.00 at 5, 11.00 at 10 steps — 18–50% of the registered 6k. Maximum |achieved/target − 1| at one step: 8.06 × 10⁻³ (leading digit 1) falling to 4.47 × 10⁻³ (leading digit 9), 80% of the registered per-step worst case; along chains up to 3.02 × 10⁻² at 5 steps, under (1.0101)⁵ − 1 = 5.15 × 10⁻². These are evidence that the bounds are not loose; they are not the tolerances. The memo is `docs/tolerance-memo.md`.

## Not established by this build

Acceptance 22, 28 and 29 need the deployed address; acceptance 27 needs an observed first-time user. Decision D-1 (the tolerance derivation) was NADIRA's to own and is presented for her review.
