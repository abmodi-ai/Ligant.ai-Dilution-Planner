# B7 — Operation sequence per step, per basis, as implemented

For the tolerance memo (handoff §9 item 1). This is the operation set the analytic bound is taken over. It is what `src/engine/plan.js` does, not what the URS describes; keep the two in step. All concentrations are in the internal scale of their dimension (ng/mL or pM) after one multiplication by an integer power of ten; all volumes in µL likewise. Doubles are IEEE-754 binary64; "Dec" is an exact decimal (`decimal.js`); `round3` is half-away-from-zero to 3 sf on the exact binary expansion.

Notation: c_S stock; c_i target of point i (a double from the entered decimal, or `top / f^k` by repeated division `c = c / factor` in the top-factor-count form); F, D, A the stated volume (Dec, and its double `toNumber`); m the minimum (Dec and double); g a power of ten.

## Common per-vessel operations

| Quantity | Operation |
|---|---|
| Direct transfer, final-volume basis | `T = (F * c_b) / c_src` (one multiplication, one division) |
| Direct transfer, diluent-volume basis | `T = (D * c_b) / (c_src − c_b)` (one subtraction, one multiplication, one division) |
| Direct transfer, available-volume basis | `T = (V * c_b) / c_src`, with `V = A + onward` (one addition; then as above) |
| Displayed transfer | `Tᵈ = round3(T)` (exact expansion, one decimal rounding) |
| Derived diluent (bases 1 and 3, and every intermediate) | `D = closure − Tᵈ` in Dec (exact); `Dᵈ = round3(D)`; closure is F (basis 1), `A + onwardᵈ` (basis 3, exact Dec), or F_int |
| Total | `Tᵈ + Dᵈ` in Dec (exact, never rounded); under basis 2 `D + Tᵈ` |
| Remaining | `total − Σ onwardᵈ` in Dec |
| Residual | `ρ = Dᵈ − D` in Dec |
| Unrounded diluent (object only) | `F − T` / `V − T` in doubles; basis 2: D |
| Unrounded total (object only) | F; `D + T`; `A + onward` |
| Exact concentration | `c_exact = c_src_exact * (T / V_unrounded)` (one division, one multiplication), chained from the stock's entered value; for an undiluted point `c_exact = c_src_exact` |
| Achieved concentration | `c_ach = c_src_ach * (toNumber(Tᵈ) / toNumber(total))`, chained |
| Factor from source (nominal) | `c_src_nominal / c_b` |
| Exact factor from source | `V_unrounded / T` |

Points are planned from the **nominal** (target) concentrations; the exact chain is recomputed from the volumes afterwards. The round-trip error at point n therefore accumulates: per step one division and one multiplication in the transfer, one division and one multiplication in the recomputation, plus the addition in V under basis 3 — the memo's per-step operation set.

## Serial, final-volume and diluent-volume bases (forward)

For i = 1..n over the non-zero targets, source = stock or vessel i−1 with nominal concentration c_{i−1}:

1. `T = transfer(basis, stated, c_{i−1}, c_i)`.
2. If `c_i == c_{i−1}` (undiluted): vessel holds `Tᵈ = round3(stated)` of source, no diluent; skip to 6.
3. If `T < m` (doubles): candidate search (below) or reject C3-HI-09.
4. If an intermediate I is chosen: build I from the source (below); then the point from I with `T_b(g)`.
5. Otherwise build the point from the source with T.
6. Record the source's onward transfer `Tᵈ` (into the point or into I); the point becomes the next source.

## Serial, available-volume basis (backward then forward)

Backward pass, i = n..1, `onward_n = 0`:

1. `V_i = A + onward_{i+1}` (double); closure `A + onward_{i+1}ᵈ` (Dec).
2. `T_i = (V_i * c_i) / c_{i−1}`.
3. If `T_i < m`: candidate search with `T_b(g) = (V_i * c_i) / (c_{i−1} / g)`; the chosen intermediate's transfer from its source, `T_int = F_int / g` (exact Dec), becomes `onward_i` for vessel i−1 (double `toNumber(T_int)`, Dec `round3(T_int)`); condition (iv) is checked after the source is built (it is vacuous under this basis).
4. Else `onward_i = T_i` (double) and `round3(T_i)` (Dec); for an undiluted vessel, `onward_i = V_i` and `round3(A + onward_{i+1}ᵈ)`.

Forward pass builds the vessels in execution order with the recorded feeds: `Dᵢ = (A + onward_{i+1}ᵈ) − Tᵢᵈ`, `Dᵢᵈ = round3(Dᵢ)`, `Vᵢ = Tᵢᵈ + Dᵢᵈ`, `remaining = Vᵢ − onward_{i+1}ᵈ`.

## Independent (any of bases 1, 2)

For each non-zero point from the stock: `T = transfer(basis, stated, c_S, c_i)`; if `T < m`, the candidate list is every g passing (i) and, per point alone, (iii). Points are grouped by their current candidate g; the shared intermediate is sized over the group; if a declared capacity is exceeded by the shared vessel, every member of that group moves to its next candidate and grouping is repeated (deterministic; proposed open item P2). Each intermediate is built once from the stock; each member point is built from it with its own `T_b(g)`.

## Candidate search (C3-DT-06 step 2), per step

For g in {10, 100, …, 10^18} while `g < f` (`f = c_src / c_b`), skipping any g for which `c_src / g > c_b` fails in floating point:

1. `c_int = c_src / g`; `T_b = transfer(basis, statedOrV, c_int, c_b)`.
2. Build the trial intermediate: `Σ = T_b` (plus the other members' `T_b` in a shared independent intermediate); `F_int = max(g·m [exact Dec shift of m], round3(Σ))`; `T_int = F_int / g` (exact Dec shift); `T_intᵈ = round3(T_int)`; `D_int = F_int − T_intᵈ`; `D_intᵈ = round3(D_int)`; `total_int = T_intᵈ + D_intᵈ`.
3. (i) `T_b ≥ m` (doubles). (iii) if C declared: `total_int ≤ C` (Dec). (iv) serial, non-stock source: `T_intᵈ ≤ source total` (Dec).
4. The first g passing all three is taken. If none, reject C3-HI-09 naming the bound that excluded the largest candidate (minimum if (i) still fails there, else capacity or source total), or the series floor when there was no candidate.

The intermediate's exact concentration is `c_src_exact * (toNumber(T_int) / toNumber(F_int))`; the point fed from it uses `c_int = c_src / g` (nominal) for its transfer and `c_int_exact` for its exact chain.

## Comparisons

| Condition | Layer compared |
|---|---|
| C3-HI-01..05, 07, 08 | entered values (doubles of exact decimals) |
| C3-HI-06 | displayed onward transfer vs displayed total (Dec) — strict `>` |
| C3-DT-06 (i), C3-FL-01, C3-FL-02 | unrounded transfer (double) vs declared value (double) |
| C3-DT-06 (iii), C3-FL-03 | displayed total (Dec) vs declared capacity (Dec) |
| C3-DT-06 (iv) | displayed transfer into the intermediate (Dec) vs source's displayed total (Dec) |
| C3-FL-06 | Σ displayed transfers from stock (Dec) vs declared available (Dec) |
