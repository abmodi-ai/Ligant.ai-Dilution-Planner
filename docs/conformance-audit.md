# C3 Dilution Planner — conformance audit

| Field | Value |
|---|---|
| Specification | URS v0.4.1 (released for build 14 September 2026) |
| Build | commit `a51fa68` on `claude/bench-tool-dev-z4nshl` (engine, tests, UI and docs as audited; this audit is finalised in the commits that follow it on the branch), engine `0.2.0` (see B1). Supersedes the audit at `cff4036` (engine 0.1.0) |
| Date | 15 September 2026 |
| Decisions | Open items decided under owner delegation — `docs/decisions.md` D-1 … D-14. Rows that were "not testable yet" at `cff4036` on items 2, 6, 7 and 8 are now met on those decisions; NADIRA's review of D-1 (the tolerance derivation) is still expected at the §7 build review |
| To | A. Modi (owner), NADIRA (§7 build review) |

Statuses: **met** / **not met** / **not testable yet** (with the gating item). Evidence names a test (`file › test name`), a measurement record, or a rendered artefact with its configuration. Findings are proposed open items in `docs/open-items.md` (P1–P17); they are not spec edits.

## Facts about the shipped build (B1–B9)

| # | Item | Record |
|---|---|---|
| B1 | Commit and engine version; versioning rule | commit `a51fa68` as audited; engine **`0.3.0`** since 17 September 2026 (0.2.0 → 0.3.0: the two tolerances stated open with no published value — A-2, D-17; no calculation behaviour changed). 0.1.0 → 0.2.0 was the per-point achieved bound and registered tolerances in the object, and the import path; rule in `src/engine/version.js`: MINOR changes whenever calculation behaviour changes (any change to the volumes, concentrations, factors, flags, rejects or intermediate selection for a given input); PATCH for changes that cannot alter any output; MAJOR for an incompatible input or object change. Rendering and page changes do not change the engine version |
| B2 | Test-suite composition at commit `a51fa68` (57 tests, all passing; plus the Python comparison of 46 vessels) | hand-calculation 9 (FX-01, 02, 03, 04, 05, 06, 07×2, 08) · closure 1 property test over >100 vessels (IV-01) plus FX-04/05 · invariance 5 (IV-02 against the derived tolerance, IV-04 via FX-06, IV-05, IV-06 via FX-02, acceptance 7 bound property over >200 points) · threshold independence 4 (IV-08 a–d) · inserted defects 1 (IV-03, exceedance against the derived tolerance) · rejects 10 (HI-01…09 incl. FX-13 four ways, FX-15) · flags 7 (FL-01, 02, 03, 04+10, 05, 06, 07; FL-08 and FL-09 inside the HI-02 and HI-03 tests) · boundary: inside the reject and flag tests (FX-12) · negative control 2 (FX-10, FX-11) · import/handoff 4 (FX-09, ST-01, ST-03, ST-04) · state/determinism 4 (ST-08, DT-09, acceptance 18, VB-02) · result object 3 · rounding primitive 7 · units 2 · network 0 automated (`scripts/viewport-check.mjs` records every request; acceptance 22 is deployed-only) · independent reimplementation: `verify/reimplementation.py` (Python), 15 cases, 46 vessels |
| B3 | Coverage | Measured with `node --test --experimental-test-coverage` at commit `a51fa68`: all files 96.05% lines, 86.88% branches, 93.88% functions; `plan.js` 97.97 / 90.53 / 97.50; `tolerances.js` 100 / 90.91 / 100; `decimal.js` 85.60 / 89.19 / 71.43; `result-object.js` 100 / 82.22 / 100; `shared-import.js` 100 / 54.10 / 100; `sheet.js` 96.55 / 60.42 / 91.67. UI modules (`src/ui/app.js`, `render.js`, `page-content.js`) are exercised by the browser scripts, not by the node suite; `sheet.js` is covered through the import test |
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
| C3-IV-02 | met | `fixtures-hand › C3-FX-03`, `invariance › C3-IV-02` within 6 ULP per step from stock (`docs/tolerance-memo.md` §1). The count is the engine's derivation constant; its registration is **open** (A-2) |
| C3-IV-03 | met | `invariance › C3-IV-03`: floor and nudge detected by IV-02 and exceed the derived tolerance by >10⁴×; clamp detected by IV-08 (a) and by IV-02; controls pass |
| C3-IV-04 | met | `FX-06` |
| C3-IV-05 | met | `invariance › C3-IV-05`, incl. through an intermediate |
| C3-IV-06 | met | `FX-02` |
| C3-IV-07 | met | per-point bound `concentration.bound`, computed from that point's own displayed values and compounded along the chain, incl. the residual term; `invariance › acceptance 7` (>200 points); `docs/tolerance-memo.md` §2. Status on the object is now `open` (A-2); the bound itself is unchanged |
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
| C3-CN-01 | **waived** | The register is off the page by owner instruction (D-15, 17 September 2026), and with it the two tolerance rows and the ~1% headline. Still on the page: the assumption with its scope, the intermediate rule with its published consequence, the C3-HI-06 sentence, precision and versions, failure classes, out of scope. The thresholds themselves remain declared in the form and restated in the plan's declarations and on the bench sheet. See A-1 |
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
| C3-NF-03 | met locally; acceptance 29 at deployment | sticky declarations line; flag chips on each step's header row; `viewport-check` 0 violations over the full scroll range. Re-measured after the 21 September restructure (A-7): 0 violations, 62 vessel-head observations, scroll 0..4969 |
| C3-NF-04 | met | `docs/D5` |
| C3-NF-05 | met | synchronous computation on every input event; no progress indicator exists |
| C3-NF-06 | met | standalone; no import dependency |
| C3-NF-07 | met | engine version on output, object, page, sheet; rule in B1 |

## Acceptance

| # | Status | Evidence |
|---|---|---|
| 1 | met | `FX-01`, `FX-04`, `FX-05` hand calculations to displayed precision |
| 2 | met | `FX-01` non-round, ties avoided |
| 3 | met | `verify/reimplementation.py` (Python, written from the URS and the operation sequence) agrees with the engine on 46 vessels in 15 cases: unrounded T, V and exact concentration within 6 ULP per step, displayed values and residuals exactly. `npm run verify:reimpl`. Re-run 17 September 2026 after A-2: 0 failures, reference set byte-identical; the harness now takes the ULP count from `src/engine/tolerances.js`, since the object no longer publishes it |
| 4 | met (D-3) | every plan validates against the `1-c3` shared-object expression with per-step flag scope and vessel labels; `result-object.test` |
| 5 | met | `C3-IV-01` property; `FX-04` both signs, different decades, plus same-decade exact closure |
| 6 | met | `C3-FX-03`, `C3-IV-02` within the derived tolerance. The derivation stands; its registration is open (A-2) |
| 7 | met | `invariance › acceptance 7`: achieved departure ≤ stated bound at every point; the bound compounds as derived; never above the worst case for its chain length. The worst case is no longer published on the page or in the object (A-2); the property test still asserts it against `src/engine/tolerances.js` |
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
| 24 | met, with a shared-origin caveat | C3 calls no storage API at all: no `localStorage`, `sessionStorage`, `document.cookie` or `indexedDB` anywhere in `src/`, `index.html`, `scripts/`, `test/` or `verify/`; nothing persists across a reload. The owner's T4 found an 898-byte entry on `localhost:5173` under an 11-character key: it is **C4's**, `c4.state.v1` (`C4-Antibody-Titration-Planner/src/lib/retention.ts`), whose dev server takes Vite's default port 5173 — the same origin. See A-3: on the deployed site every tool shares the origin `https://benchtools.ligant.ai`, so C3 cannot make that entry absent; only C4's removal can |
| 25 | **waived** with C3-CN-01 | assumption, rule with consequence and the C3-HI-06 sentence are on the page; the register is not (D-15, A-1) |
| 26 | met | page failure classes incl. the two additivity cases |
| 27 | not testable yet (observation by A. Modi) | deployed build to be provided |
| 28 | not testable yet (print at deployment) | PDF rendered locally is complete without the application: labels, contents, additions and sources, bases, route, diluent, capability values, order of addition, stain volume for a C4 point |
| 29 | not testable yet (deployment) | local run 0 violations over 0..3685 px with the import fieldset present, configuration in D5. Re-run locally 17 September 2026 after the suite-alignment restyle, on a second machine and a second technique (CDP, not Playwright — see D5): 0 violations over 0..4699 px, 62 vessel-head observations |

## Evidence for the tolerance memo (§9), not tolerances

`node scripts/empirical-sample.mjs 200000` (142,623 plans; seeded LCG; stocks 0.01–10⁴, factors 1.5–100, 1–5 points, all three bases, both routes): maximum round-trip error 3.00 ULP at 1 step, 5.00 at 2, 6.00 at 3, 7.00 at 4, 9.00 at 5, 11.00 at 10 steps — 18–50% of the registered 6k. Maximum |achieved/target − 1| at one step: 8.06 × 10⁻³ (leading digit 1) falling to 4.47 × 10⁻³ (leading digit 9), 80% of the registered per-step worst case; along chains up to 3.02 × 10⁻² at 5 steps, under (1.0101)⁵ − 1 = 5.15 × 10⁻². These are evidence that the bounds are not loose; they are not the tolerances. The memo is `docs/tolerance-memo.md`.

## Brand (handoff §12)

Recorded in `docs/brand-conformance.md`: Brand Guidelines v1.1 §02 naming, §03 the mark (new in this build, drawn inline), §04 colour (every value published; three off-palette values removed; amber never used as type), §05 typography (700 against 400, weight 500 removed, Bold weights self-hosted), §01 exclusions and §06 principles. WCAG 2.1 AA measured on the rendered plan table and bench sheet: 40 combinations, 0 failures (`npm run check:contrast`). The live C1 tool could not be reached from this environment (egress policy), so the two things to check against it when someone with access can are listed there.

## Not established by this build

Acceptance 22, 28 and 29 need the deployed address; acceptance 27 needs an observed first-time user. Decision D-1 (the tolerance derivation) was NADIRA's to own and is presented for her review.

## Addendum — 17 September 2026

Changes made after the audit above, on the owner's spot check of the dev build and their instructions of the same day (`docs/decisions.md` D-15…D-18). Engine `0.3.0`. The 57-test suite passes, the Python comparison is unchanged at 46 vessels / 0 failures, and no calculation behaviour changed.

| # | Row affected | What changed |
|---|---|---|
| A-1 | C3-CN-01, acceptance 25 | The constants register is **off the page** by owner instruction (D-15). Both rows are **waived**, not met. Nothing else in the About section changed. This is a deliberate divergence from the tool set, which carries the register as a house pattern |
| A-2 | C3-IV-02, C3-IV-07, acceptance 3, 6, 7 | The two tolerances are **open**, not derived, and publish no value (D-16). The memo's derivation and the engine constants are unchanged, so every measured bound and every test threshold is unchanged; only the registration status and the published values moved. The per-point bound remains on every point (C3-OUT-03) with status `open` |
| A-3 | acceptance 24 | C3 writes no storage. The entry the owner found on `localhost:5173` is C4's `c4.state.v1`, written by the C4 dev build on Vite's default port. **On the deployed site all four tools share one origin** (`https://benchtools.ligant.ai`; an origin is scheme + host + port, the path is irrelevant), so C4's entry will be present there too and C3 cannot remove it. Acceptance 24 should be read as "C3 writes nothing, and any entry on the shared origin is named to its writer" |
| A-4 | acceptance 29, D5 | Re-run locally at 1366 × 650 after the restyle, by a second technique on a second machine: 0 violations, 62 vessel-head observations, scroll 0..4699. Configuration in `docs/D5-browser-configuration.md`. This is not the deployed run, and it is not `scripts/viewport-check.mjs` |
| A-5 | B1, engine version | 0.2.0 → 0.3.0 (D-17) |
| A-6 | Brand | The page chrome was aligned with the shipped siblings on the same day: shared tokens extracted to `src/tokens.css`, masthead/footer/disclaimer/colophon class vocabulary, control primitives, favicon geometry, skip link and page metadata. One §07 reading is reversed — flags now carry an amber rule **and** the attention wash, as C4 and C1 do. `docs/brand-conformance.md` records it |

**Unrun here, and not waived.** `npm run check:contrast` (the WCAG AA gate) and `scripts/viewport-check.mjs` both require Playwright at `/opt/node22` with the Chromium at `/opt/pw-browsers`, neither of which exists on the machine these changes were made on. The restyle touched nearly every text element, so the contrast gate needs a run on a machine that has them before the §7 review.

### A-7 — the page rebuilt on C4's structure, 21 September 2026

The chrome alignment of 17 September (A-6) matched the header, the footer and the control primitives; the page beneath them was still C3's own. On the owner's instruction — match C4's fonts, page structure, header and footer, "need to look identical UI/UX" — the layout itself was rebuilt from **C4's source** (`C4-Antibody-Titration-Planner/src/`), not from its deployed bundle.

| Was | Now (C4's pattern) |
|---|---|
| One `Declarations` panel of `fieldset`/`legend` groups in a 404 px rail | One `.panel` per declaration group, each with a `.panel-head` carrying the teal step circle and an `h2`, in a 50/50 `.layout` |
| Value and unit inline in a `.qty` flex pair, the unit labelled only for screen readers | C4's `.field-row`: two labelled fields side by side, the unit's label visible |
| The About section below both columns | A `.method-panel` titled "Method, conventions and limits", last in the left column, in C4's `.prose` voice |
| One output panel holding plan, derivation and object | C4's `.rail`: "The plan" (actions in the panel head), then "Derivation", then "Structured result" behind a `details`/`summary` disclosure |
| The masthead carried the tagline and the standfirst | One paragraph, as C4's masthead takes; the standfirst opens the method panel |

**Not adopted, deliberately:** C4's collapse-when-answered declaration panels. That control exists for C4's own measured problem (its input column is ~1700 px whatever the point count) and is welded to machinery C3 does not have — retained values, per-panel confirmation, `retention.ts`. C3 has no persistence at all (C3-ST-06), and C3 recomputes on every `input` event, so a panel that collapses on completion would collapse under the reader's cursor mid-entry. C4's guidance pins (`?` popovers) were not adopted either: C3 states the same help inline, where several of those sentences are required text.

**A defect found and fixed in passing.** The target unit `<select>` lived inside the single-concentration field, so choosing "explicit list" or "top concentration, factor and count" hid it while the plan still used its value — a reader wanting nM targets in list form could not set the unit, and the list form's help pointed at a control that was not on screen. Measured before the fix (unit visible: single `true`, list `false`, top-factor-count `false`) and after (`true`, `true`, `true`). The unit is now its own field, below the form-specific inputs, in all three forms. It is a pre-existing defect, not a consequence of the restructure.

**Verified after the change:** 57/57 tests; acceptance 3 unchanged; sticky declarations 0 violations at 1366 × 650; print renders the bench sheet alone with its table, seven flags and the mark; the built page makes 8 same-origin requests and none elsewhere; single-column order at 1000 px is inputs → plan → method.

### A-8 — evidence returned against the v0.4.2 package, 21 September 2026

Engine 1.0.0 is **not** built. The reasons are in `docs/open-items.md` under "Returned against URS v0.4.2": the attached specification is a draft whose own open item 21 gates the build package, and the memo signature that item 2c of the covering email relies on is recorded in that same document as not yet received. Everything in the package that does not depend on those two gates was done, and is evidenced here.

| Item | Evidence |
|---|---|
| Acceptance 3 — record the observed difference, not just the pass (item 2e) | `verify/reimplementation.py` now reports it. Measured 21 September 2026: **0 ULP** maximum difference on the unrounded values across 46 vessels in 15 cases, and **0 of 138** displayed values differing. The two implementations agree bit-for-bit; 6k ULP is the criterion, not the result |
| Tolerance memo — M1 and the three wording edits (item 2d) | Applied to `docs/tolerance-memo.md`: the round-trip reference value is named as the target converted to the engine's internal unit, with the reason it matters (ulp depends on magnitude); the second-order-terms sentence is replaced by the binade argument; the 3 ULP observation is stated as evidence the bound is not loose rather than as the count being reached; 1.01 × 10⁻² is called the worst-case bound throughout, with a sentence saying no single vessel realises it. The register row in the memo reads open until signed, consistent with R2 |
| WCAG AA contrast gate (item 3) | **Run, and it passes.** 46 colour/size/weight combinations measured on the filled plan and the bench sheet, **0 failures**; tightest passing 5.13:1 against a 4.5 requirement (`.skip-link`, the current-tool pill, the step number, the register status). The measurement is `scripts/contrast-audit.mjs`'s own function, unmodified, executed over the Chrome DevTools Protocol because this machine has no Playwright. The script itself still cannot run here |
| URS open item 19 — does the live C4 page still restore inputs from storage? | **Yes. Confirmed in a browser against `https://benchtools.ligant.ai/antibody-titration-planner/` on 21 September 2026.** With storage cleared and one foreign key seeded, typing into the staining-volume field wrote `c4.state.v1` within about a second; after a reload the value was restored into the field and the "from your last visit" marker was present. The seeded foreign key was neither altered nor removed. C4 finding B2 is live in production |
| Commits (item 3) | The work of 17–21 September is committed on branch `c3/v0.4.1-findings`, one commit per finding: T1 register, T7 ordering, T3 fixture, T2 tolerances with engine 0.3.0, the suite/C4 UI alignment, and the records |
