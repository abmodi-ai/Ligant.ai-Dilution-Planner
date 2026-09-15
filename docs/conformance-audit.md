# C3 Dilution Planner — conformance audit

| Field | Value |
|---|---|
| Specification | URS v0.4.1 (released for build 14 September 2026) |
| Build | commit `cff4036` on `claude/bench-tool-dev-z4nshl`, engine `0.1.0` (see B1; later commits amend only docs and build config unless the engine version changes) |
| Date | 15 September 2026 |
| To | A. Modi (owner), NADIRA (§7 build review) |

Statuses: **met** / **not met** / **not testable yet** (with the gating item). Evidence names a test (`file › test name`), a measurement record, or a rendered artefact with its configuration. Findings are proposed open items in `docs/open-items.md` (P1–P17); they are not spec edits.

## Facts about the shipped build (B1–B9)

| # | Item | Record |
|---|---|---|
| B1 | Commit and engine version; versioning rule | `cff4036`; engine `0.1.0`; rule in `src/engine/version.js`: MINOR changes whenever calculation behaviour changes (any change to the volumes, concentrations, factors, flags, rejects or intermediate selection for a given input); PATCH for changes that cannot alter any output; MAJOR for an incompatible input or object change. Rendering and page changes do not change the engine version |
| B2 | Test-suite composition at `cff4036` (53 tests: 51 pass, 2 todo) | hand-calculation 8 (FX-01, 02, 04, 05, 06, 07×2, 08) · closure 1 property test over >100 vessels (IV-01) plus FX-04/05 · invariance 4 (IV-02 preliminary shape, IV-04 via FX-06, IV-05, IV-06 via FX-02) · threshold independence 4 (IV-08 a–d) · inserted defects 1 (IV-03) · rejects 10 (HI-01…09 incl. FX-13 four ways, FX-15) · flags 7 (FL-01, 02, 03, 04+10, 05, 06, 07; FL-08 and FL-09 are asserted inside the HI-02 and HI-03 tests) · boundary: inside the reject and flag tests (FX-12, either side and exactly on every numeric condition) · negative control 2 (FX-10, FX-11) · state/determinism 4 (ST-08, DT-09, acceptance 18, VB-02) · result object 3 · rounding primitive 7 (D2 measurement 3, decimal 4) · units 2 · network 0 automated tests (`scripts/viewport-check.mjs` records every request; acceptance 22 is deployed-only) · todo 2 (FX-03 item 6; FX-09 item 2) |
| B3 | Coverage | Measured with `node --test --experimental-test-coverage` at `cff4036`: all files 96.95% lines, 89.07% branches, 93.70% functions; `plan.js` 97.95 / 88.98 / 97.40; `decimal.js` 84.80 / 89.04 / 67.86; `result-object.js` 100 / 82.22 / 100. UI modules (`src/ui/*`) are exercised by the browser scripts, not by the node suite, and are not in the figure |
| B4 | Rounding-primitive measurement | `docs/D2-rounding-measurement.md` — Node 22.22.2, V8 12.4.254.21, 16 tie-adjacent cases; the engine rounds on the exact BigInt expansion; `toPrecision` agreed 16/16 but is not used |
| B5 | Shared-object confirmation or escalation | **Escalation** — `docs/D1-shared-object.md`: the shared format was not in the package; C3 emits a validated `1-c3-draft` object and does not extend the format locally; open item 8 stays open |
| B6 | Browser configuration, reference viewport | `docs/D5-browser-configuration.md` — Chromium 141 (Playwright chromium-1194), 1366 × 650 CSS px, DPR 1, zoom 100%, headless; local result 0 violations, 0 cross-origin requests |
| B7 | Operation sequence per step per basis | `docs/operation-sequence.md` |
| B8 | Vessel-label scheme | `S` stock; `I1, I2, …` intermediates in execution order; `P1, P2, …` points in the order entered. Stated on the output, in the object (`labelScheme`) and on the sheet |
| B9 | URS/build disagreements and unmeetable requirements | `docs/open-items.md` P1–P17; the substantive ones are P2 (capacity on a shared intermediate), P3 (undiluted point under the diluent basis), P4 (series floor at f = 10), P5/P6 (comparison layers), P7 (intermediate total displayed), P16 (view on item 16, raised in week 1) |

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
| C3-IV-02 | not testable yet (item 6) | test exists against the preliminary shape (2n+1 ULP) and passes; the derived tolerance is open. Empirical maxima in §Memo below |
| C3-IV-03 | met for detection; tolerance part not testable yet (items 6, 7) | `invariance › C3-IV-03`: floor and nudge detected by IV-02 (>10⁵ ULP); clamp detected by IV-08 (a) and by IV-02; controls pass |
| C3-IV-04 | met | `FX-06` |
| C3-IV-05 | met | `invariance › C3-IV-05`, incl. through an intermediate |
| C3-IV-06 | met | `FX-02` |
| C3-IV-07 | not testable yet (item 7) | the bound is stated per point as **open** (`concentration.bound`); no number stated |
| C3-IV-08 | met | `invariance › C3-IV-08 (a)–(d)`, bit for bit on unrounded volumes, exclusions per E1; intermediate shown to move as `max(g·m, round3(Σ))` |
| C3-HI-01…05, 07, 08 | met | `rejects-flags`, either side and exactly on |
| C3-HI-06 | met | `rejects-flags › C3-HI-06` (equal = legal, remaining 0), `FX-15` |
| C3-HI-09 | met | `FX-13` four ways; bound and value named; no recommendation |
| C3-FL-01…06, 08…10 | met | `rejects-flags`; FL-01 the only flag when an intermediate is planned (`FX-07`) |
| C3-FL-07 | met at interface level; FX-09 not testable yet (item 2) | `rejects-flags › C3-FL-07` with a test-side object |
| C3-FC-01 | met | page section "Failure classes this tool cannot detect", eight items incl. the two additivity cases |
| C3-FX-01, 02, 04–08, 10–15 | met | `fixtures-hand`, `rejects-flags`, `invariance` |
| C3-FX-03 | not testable yet (item 6) | todo test in `fixtures-hand` |
| C3-FX-09 | not testable yet (item 2) | todo test in `fixtures-hand` |
| C3-FX-16 | met | every fixture states its construction assumption in the test body; FX-01 avoids tie-adjacent values |
| C3-CN-01 | met | register on the page with values, bases and statuses; two tolerance rows **open** with no value; assumption with scope; rule with consequence; C3-HI-06 sentence |
| C3-ST-01…04 | not testable yet (item 2) | interface accepts `imported` with flags, fixes basis, records overrides; no transport |
| C3-ST-05 | met | object carries basis, route, labels and sources, step counts, capability values, formulation, flags |
| C3-ST-06 | met | no storage API in shipped code (grep: none); every field is cleared by reload |
| C3-ST-07 | met | every input change recomputes the whole plan from scratch; nothing is retained (no value to mark); the third basis is unchecked, visibly, when it becomes unavailable |
| C3-ST-08 | met | `invariance › C3-ST-08` |
| C3-ST-09 | met at interface level | `rejects-flags › C3-FL-07`: receiving = stain, `mustAlreadyHold` = staining volume − transfer; sheet names it as the stain |
| C3-OUT-01 | met | derivation section: relations, assumptions with scope, input echo with units, engine version |
| C3-OUT-02 | met | declarations bar and derivation, not only the echo |
| C3-OUT-03 | met (bound stated as open) | exact, achieved (point value), bound status, residual where non-zero, per vessel |
| C3-OUT-04 | met | `result-object.test › acceptance 4` |
| C3-OUT-05 | escalation recorded | `docs/D1-shared-object.md` |
| C3-OUT-06 | met | screen, notebook, sheet and object all read from one result; `result-object.test › C3-OUT-06` |
| C3-OUT-07 | met | scope statement on output, page, sheet, footer |
| C3-OUT-08 | met | stated on output, separately |
| C3-OUT-09 | met | "plans preparation … does not verify" on output, page, sheet |
| C3-OUT-10 | met locally | bench sheet rendered (`scripts/out/bench-sheet-fx05.pdf`); acceptance 28 at deployment |
| C3-OUT-11 | met | `notebookText`; copy button with visible fallback |
| C3-OUT-12 | met | one convention stated on the sheet and output; basis labels agree with it |
| C3-OUT-13 | met | unique labels validated; `FX-07` shared source |
| C3-NF-01 | met locally; acceptance 22 not testable yet (item 10) | 0 cross-origin requests on the local build; no `fetch`/XHR/WebSocket in code; CSP `connect-src 'none'` |
| C3-NF-02 | met | no account or login |
| C3-NF-03 | met locally; acceptance 29 not testable yet (item 10) | sticky declarations bar; flag chips on each step's header row; `viewport-check` 0 violations over the full scroll range |
| C3-NF-04 | met | `docs/D5` |
| C3-NF-05 | met | synchronous computation on every input event; no progress indicator exists |
| C3-NF-06 | met | standalone; no import dependency |
| C3-NF-07 | met | engine version on output, object, page, sheet; rule in B1 |

## Acceptance

| # | Status | Evidence |
|---|---|---|
| 1 | met | `FX-01`, `FX-04`, `FX-05` hand calculations to displayed precision |
| 2 | met | `FX-01` non-round, ties avoided |
| 3 | not testable yet (item 6) | comparison tolerance is the item-6 bound; unrounded values are in the object ready for comparison |
| 4 | escalation recorded (item 8) | D1; every plan validates against the C3 draft |
| 5 | met | `C3-IV-01` property; `FX-04` both signs, different decades, plus same-decade exact closure |
| 6 | not testable yet (item 6) | preliminary-shape check passes |
| 7 | not testable yet (item 7) | bound stated as open per point |
| 8 | met for detection | `C3-IV-03`; exceedance measured against the preliminary shape pending items 6/7 |
| 9 | met | `C3-IV-08 (a)–(d)` |
| 10 | met | `FX-06` |
| 11 | met | `C3-IV-05` |
| 12 | met | every §7 condition rejected naming quantity and reason |
| 13 | met | `FX-10`, `FX-11` no flags |
| 14 | met (FL-07 at interface level) | reason codes resolvable to the step (`scope.vessel`, `scope.from`) |
| 15 | met | boundary tests in `rejects-flags` incl. target = stock, target = 0, transfer = donating total |
| 16 | met | `FX-13` |
| 17 | met | `FX-15` |
| 18 | met | `rejects-flags › acceptance 18` |
| 19 | not testable yet (item 2) | interface test only |
| 20 | met | whole-plan recompute on every change; no retained value |
| 21 | met | labels and sources on output, object and sheet; `FX-07` shared source |
| 22 | not testable yet (item 10) | local: 0 cross-origin requests with monitoring before load |
| 23 | met | `C3-ST-08`; no state |
| 24 | met | no storage API; nothing persists |
| 25 | met | page register, assumption, rule with consequence, C3-HI-06 sentence |
| 26 | met | page failure classes incl. the two additivity cases |
| 27 | not testable yet (observation by A. Modi) | deployed build to be provided |
| 28 | not testable yet (print at deployment) | PDF rendered locally is complete without the application: labels, contents, additions and sources, bases, route, diluent, capability values, order of addition, stain volume for a C4 point |
| 29 | not testable yet (item 10) | local run 0 violations, configuration in D5 |

## Evidence for the tolerance memo (§9), not tolerances

`node scripts/empirical-sample.mjs 200000` (142,623 plans; seeded LCG; stocks 0.01–10⁴, factors 1.5–100, 1–5 points, all three bases, both routes): maximum round-trip error 3.00 ULP at 1 step, 5.00 at 2, 6.00 at 3, 7.00 at 4, 9.00 at 5, 11.00 at 10 steps — inside the preliminary (2n + 1) shape at every chain length. Maximum |achieved/target − 1| at one step: 8.06 × 10⁻³ (leading digit 1) falling to 4.47 × 10⁻³ (leading digit 9); along chains, first-order additive, up to 3.02 × 10⁻² at 5 steps with leading digit 1. These are evidence that the bound is not loose; they are not the tolerance and are not on the tool page.
