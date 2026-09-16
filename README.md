# Dilution Planner (C3) — Ligant Bench Tools

Plans the volumes to combine to reach a stated target concentration, or an ordered set of them, from a stated stock, including any single intermediate a step needs to be pipettable. Built to **URS v0.4.1** (released for build 14 September 2026). Research use; not qualified for GxP decision-making. Entirely client-side; zero third-party requests; nothing persists.

## Run

```
npm install          # dev tooling only (Vite); the page has no runtime dependencies
npm run dev          # http://localhost:5173/
npm test             # engine, fixtures, invariance, result object (node --test)
npm run test:coverage
npm run measure:rounding   # D2 record
npm run sample:empirical   # evidence for the tolerance memo (§9 item 3)
npm run check:viewport     # acceptance 29 technique against a running server
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
| `test/` | Executable fixtures C3-FX-01…16 and invariance tests |
| `docs/` | Day-one records (D1, D2, D5), operation sequence (B7), tolerance memo, decisions, proposed open items (B9), deployment, conformance audit |
| `verify/` | Independent Python reimplementation and the reference set it is compared against (acceptance 3) |
| `src/import/` | Import boundary: pasted C4/C1 result object → C3 input |
| `fonts/` | Self-hosted Inter and IBM Plex Mono (OFL) |

## Status

Complete for everything a developer can establish. The open items were decided under owner delegation on 15 September 2026 (`docs/decisions.md`): tolerances derived and registered (`docs/tolerance-memo.md`), pasted-object import for C4/C1, the C3 result object adopted as shipped, slug `dilution-planner`. An independent Python reimplementation (`verify/`) agrees with the engine on the reference set. Remaining for people and deployment: acceptance 22, 28, 29 at the public address (`docs/deployment.md`) and the first-time-user observation (acceptance 27). `docs/conformance-audit.md` is the row-by-row status.
