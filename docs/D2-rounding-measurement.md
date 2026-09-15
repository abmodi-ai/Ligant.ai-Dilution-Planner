# D2 — Rounding primitive: measurement record

**Rule (C3-UN-06):** half away from zero, applied to the exact binary value.

**Primitive used by the engine.** The engine does not round with `toPrecision`, `toFixed` or `Math.round`, and `Math.pow` is not on the rounding path. `src/engine/decimal.js` expands the IEEE-754 double exactly (mantissa × 2^e, rewritten as an integer BigInt × 10^k) and rounds the exact decimal digit string: the first dropped digit ≥ 5 rounds the magnitude up; a tie is exact because the value is held exactly. Power-of-ten shifts are BigInt operations (`10n ** k`), never floating multiplications. The same primitive rounds displayed volumes (3 sf) and concentrations (6 sf), and does the exact decimal arithmetic of the displayed layer (totals, remaining volumes, residuals).

**Measured, not described.** Run `npm run measure:rounding` (script `scripts/measure-rounding.mjs`); the cases are also asserted in `test/rounding-measurement.test.js`.

| Runtime | Value |
|---|---|
| Node | 22.22.2 |
| V8 | 12.4.254.21-node.39 |
| Platform | linux/x64 |
| Date | 15 September 2026 |

| value | n | exact binary expansion (first 30 digits) | engine roundSig | toPrecision (same runtime) | agree |
|---|---|---|---|---|---|
| 0.125 | 2 | 0.125 | 0.13 | 0.13 | yes |
| 2.5 | 1 | 2.5 | 3 | 3 | yes |
| -2.5 | 1 | -2.5 | -3 | -3 | yes |
| 1.005 | 3 | 1.0049999999999998934185896359… | 1.00 | 1.00 | yes |
| 1.0005 | 4 | 1.0004999999999999449329379785… | 1.000 | 1.000 | yes |
| 8.345 | 3 | 8.3450000000000006394884621840… | 8.35 | 8.35 | yes |
| 2.675 | 3 | 2.6749999999999998223643160599… | 2.67 | 2.67 | yes |
| 1.25 | 2 | 1.25 | 1.3 | 1.3 | yes |
| 12.45 | 3 | 12.449999999999999289457264239… | 12.4 | 12.4 | yes |
| 987.5 | 3 | 987.5 | 988 | 988 | yes |
| 999.5 | 3 | 999.5 | 1000 | 1.00e+3 | yes |
| 1234.5 | 4 | 1234.5 | 1235 | 1235 | yes |
| 9.995 | 3 | 9.9949999999999992184029906638… | 9.99 | 9.99 | yes |
| 0.30000000000000004 | 3 | 0.3000000000000000444089209850… | 0.300 | 0.300 | yes |
| 4.44444 | 3 | 4.4444400000000001682565198279… | 4.44 | 4.44 | yes |
| 29.08783783783784 | 3 | 29.087837837837838605992146767… | 29.1 | 29.1 | yes |

**Findings.**

1. Exact binary ties (0.125, 2.5, 987.5, 999.5, 1234.5) round away from zero under the engine's primitive, as the rule requires.
2. Decimal-looking ties (1.005, 2.675, 12.45, 9.995) are not ties in binary; the engine rounds them according to the binary value (down in these cases, up for 8.345), as the rule requires. A primitive that rounded the *decimal* string as typed would give 1.01, 2.68, 12.5, 10.0 — that is the binary-vs-decimal-tie finding from C4, and it is why user entries are held as exact decimals (`Dec.fromString`) and only computed quantities are expanded from doubles.
3. V8's `toPrecision` agreed with the rule on all 16 cases in this runtime. This is recorded, not relied on: the engine's result does not depend on it and would not change on an engine where it disagrees.
4. The carry case 999.5 → 1000 renormalises to three significant digits ("1000", last place 10). Because a 3-sf display of a value ≥ 1000 does not carry its last place in the string, tests derive the half-unit from the 3-sf rule rather than from the string (`halfUlp3sf` in `test/helpers.js`).
