# Dilution Planner (C3) — Ligant Bench Tools

Plans the volumes to combine to reach a stated target concentration, or an ordered set of them, from a stated stock, including any single intermediate a step needs to be pipettable. Built to **URS v0.4.2** (approved, released for build, 21 September 2026), engine **1.0.0**. Research use; not qualified for GxP decision-making. Entirely client-side; zero third-party requests; nothing persists.

## Run

```
npm install          # dev tooling only (Vite); the page has no runtime dependencies
npm run dev          # http://localhost:5173/
npm test             # engine, fixtures, invariance, result object (node --test)
npm run test:coverage
npm run measure:rounding   # D2 record
npm run sample:empirical   # evidence for the tolerance memo (§9 item 3)
npm run check:viewport     # acceptance 29 technique against a running server
npm run check:contrast     # WCAG AA audit of the rendered plan table and bench sheet
npm run check:browser      # acceptance 24 (storage) and 31 (concentration units), in a real browser
npm run verify:reimpl      # acceptance 3: dump the reference set and compare with the Python reimplementation
```

Any static server works too (`npm run serve`).

## Layout

| Path | What |
|---|---|
| `src/engine/decimal.js` | Exact decimal arithmetic; the rounding primitive (half away from zero on the exact binary value) |
| `src/engine/units.js` | Unit table with dimension tags (D3) |
| `src/engine/plan.js` | The engine: inputs in, one structured result object out; §7 rejects, §8 flags, C3-DT-06 intermediate rule |
| `src/engine/format.js` | Notebook text and sentence renderers, from the object only |
| `src/engine/version.js` | Engine version and rule (C3-NF-07) |
| `src/shared/result-object.js` | C3 draft of the shared result object and its validator (D1) |
| `src/ui/` | Form, on-screen plan, bench sheet, tool page statements |
| `src/config.js` | Title, slug, publisher, repository URL, citation — single strings |
| `src/tokens.css` | The suite's shared design tokens, copied whole from `benchtools.ligant.ai/tokens.css` |
| `test/` | Executable fixtures C3-FX-01…16 and invariance tests |
| `docs/` | Day-one records (D1, D2, D5), operation sequence (B7), tolerance memo, decisions, proposed open items (B9), deployment, conformance audit |
| `verify/` | Independent Python reimplementation and the reference set it is compared against (acceptance 3) |
| `src/import/` | Import boundary: pasted C4/C1 result object → C3 input |
| `fonts/` | Self-hosted Inter 400/600/700 and IBM Plex Mono 400/600 (OFL) — the five faces C4 loads |
| `src/ui/mark.js` | The Ligant mark, Council · Ringed, drawn inline (Brand Guidelines §03) |

## Status

Engine **1.0.0**, built to URS v0.4.2 (approved and released for build, 21 September 2026). The v0.4.2 package — C3-HI-10, the two-sided intermediate condition, displayed-volume comparisons, the register in the result object, the executable storage test, concentration units unselected on load, and the three-category version rule — is built and evidenced in `docs/conformance-audit.md` (addendum A-9). The tolerance memo is signed, so both register rows are derived and every point displays its bound; the gate that withholds it while a status is open remains, and is tested both ways.

The reference table was re-checked before release, as a MAJOR release requires: 15 cases, 46 vessels, unchanged, with the displayed bounds now pinned in it, and the independent Python reimplementation agreeing to 0 ULP.

Remaining: the standing privacy text v1.0 to go in verbatim (not yet received); acceptance 22, 28 and 29 at the public address (`docs/deployment.md`); the first-time-user observation (acceptance 27); and Agent Nadira's §7 build review, which this build is for.
