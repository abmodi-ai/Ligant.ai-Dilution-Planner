# Tolerance memo — round-trip tolerance (item 6) and achieved-concentration bound (item 7)

| Field | Value |
|---|---|
| Tool | C3 Dilution Planner, engine 0.3.0 (derivation unchanged since 0.2.0) |
| Status | **Derived here; registration open.** Derived under owner delegation of open items 6 and 7 (A. Modi, 15 September 2026), over the implemented operation set (`docs/operation-sequence.md`); the empirical maxima are evidence only. **Not signed by NADIRA**, so on the owner's instruction of 17 September 2026 the tool states both tolerances as `open` and publishes no value for them (`docs/decisions.md` D-16). This memo is unchanged by that: it is the derivation awaiting her signature at the §7 build review |
| Convention | A register tolerance is the derived analytic bound over the stated operation set; an empirical maximum is evidence the bound is not loose, never the tolerance (C4 build review) |

## 1. Round-trip tolerance, exact concentration (C3-IV-02, acceptance 3 and 6)

**Statement.** Target → plan → recomputed exact concentration returns the target to within **6 ULP of the target per step from stock**, a planned intermediate counting as a step: at a point k steps from stock, |c_exact − c_target| ≤ 6k·ulp(c_target).

**Operation set per step** (as implemented). The exact concentration of a vessel is `c_exact = c_src_exact × (T / V)`. Let u = 2⁻⁵³ be the unit roundoff; every IEEE-754 operation returns its exact result times (1 + δ), |δ| ≤ u.

| Basis | Transfer | Recomputation | Unit roundings |
|---|---|---|---|
| Final volume | `T = (F·c_b)/c_src` — 2 | `T/V`, `× c_src_exact` — 2 (V = F, the same double in T and in T/V, so it cancels exactly) | 4 |
| Available after onward transfer | `V = A + onward` — the rounded V is used both in T and in T/V and cancels; `T = (V·c_b)/c_src` — 2 | 2 | 4 |
| Diluent volume | `c_src − c_b` — 1; `T = (D·c_b)/(…)` — 2 | `V = D + T` — 1, but T's error enters V attenuated by T/(D+T) < 1; `T/V`, `× c_src_exact` — 2 | ≤ 6 |
| Intermediate vessel (any basis) | `T_int = F_int/g` and `F_int` are exact decimals; `toNumber` of each — 2; `T_int/F_int`, `× c_src_exact` — 2; the destination uses the nominal `c_int = c_src/g` — 1 | | 5 |

With c_src_exact = c_src_nominal·(1 + ε_src), the vessel's exact concentration is c_target·(1 + ε_src)·Π(1 + δᵢ), so |ε| ≤ |ε_src| + (number of roundings)·u to first order; second-order terms are of order u² and are absorbed by stating the bound with the integer count. For any double c, c/ulp(c) < 2⁵³ = 1/u, so a relative error of k·u is fewer than k ULP of c. The largest per-step count is six (diluent-volume basis), so the bound is stated uniformly as 6 ULP per step; a point fed through an intermediate is two steps from its source and is covered by 5 + 4 (or 5 + 6) ≤ 12.

Unit conversion adds no rounding to the ratio when stock and target are in the same unit (the common case) and at most one each otherwise (one multiplication by an integer power of ten, exact whenever representable; C3-UN-03). The top-factor-count form derives each target by one division `c / factor`; the derived target is the reference value for that point, so the division does not enter the round-trip error.

**Evidence** (`scripts/empirical-sample.mjs`, 200,000 random inputs, 142,623 plans, all bases and routes, chains to 10 steps): maximum 3 ULP at 1 step, 5 at 2, 6 at 3, 7 at 4, 9 at 5, 11 at 10. Against the bound 6k these are 50–18% of the bound; the per-step count of four roundings is realised (3 ULP observed at one step). Independent reimplementation in Python (`verify/reimplementation.py`) agrees with the engine on all 46 vessels of the reference set within the bound and reproduces every displayed value exactly (acceptance 3).

## 2. Achieved-concentration bound (C3-IV-07, acceptance 7)

**Statement.** At a vessel with transfer Tᵈ and derived diluent Dᵈ, prepared to close V (the stated F, `A + onwardᵈ`, or F_int), with h_T and h_D half a unit in the last displayed place of Tᵈ and Dᵈ:

  achieved / target = (1 + dep_source)·(1 + ε_T)/(1 + ρ/V), with |ε_T| ≤ h_T/(Tᵈ − h_T) and |ρ| ≤ h_D,

so the vessel's own term is **b = (1 + h_T/(Tᵈ − h_T))/(1 − h_D/V) − 1** and the bound at a point is **Π(1 + bᵢ) − 1 over the vessels from the stock to it** (its source's bound compounded with its own term). Under the diluent-volume basis there is no residual and achieved/target = (1 + ε_T)/(1 + ε_T·T/(D + T)), bounded by |ε_T| for either sign; an undiluted vessel has no term of its own; a zero point has no bound.

**Derivation.** From C3-IV-01, Tᵈ + Dᵈ = V + ρ exactly. The achieved concentration is c_src_ach·Tᵈ/(Tᵈ + Dᵈ) and the target is c_src_nom·T/V (T unrounded), so the ratio is (c_src_ach/c_src_nom)·(Tᵈ/T)·(V/(V + ρ)). |Tᵈ − T| ≤ h_T because Tᵈ is T rounded half away from zero at 3 sf (when the rounding carries into a higher decade the error is smaller still), and T ≥ Tᵈ − h_T, giving the ε_T bound. ρ is the single rounding of the derived volume, |ρ| ≤ h_D (C3-IV-01). The bound is exact in the two magnitudes and makes no first-order approximation; it is evaluated per point from that point's displayed values, so the output states a bound specific to the plan (C3-OUT-03), and the register states its worst case.

**Worst case over leading digit.** Both terms are largest at leading digit 1: h/(x − h) = 0.005/0.995 = 5.03 × 10⁻³ for Tᵈ = 1.00, and h_D/V ≤ 0.005/0.995 for Dᵈ at leading digit 1 in a different decade from Tᵈ. Per step: 1.005025/0.994975 − 1 = **1.01 × 10⁻²**. Where closure is exact, or under the diluent-volume basis: **5.03 × 10⁻³**. Along a chain of n steps: (1.0101)ⁿ − 1, first-order n × 1.01 × 10⁻². At leading digit 9 the per-step worst case is 1.11 × 10⁻³.

**Headline for the tool page (confirmed by this derivation):** a 3-significant-figure plan can carry up to about 1% rounding error per step before any pipetting error.

**Evidence.** Over the same 200,000-sample run: maximum |achieved/target − 1| at one step 8.06 × 10⁻³ (leading digit 1), 6.5 × 10⁻³ (2), 5.9 × 10⁻³ (3), falling to 4.47 × 10⁻³ (9); at 5 steps up to 3.02 × 10⁻² (leading digit 1). The one-step maximum is 80% of the worst case; the chain maxima sit under (1.0101)ⁿ − 1 at every n. The property test `invariance › acceptance 7` checks, at every point of several hundred plans, that |achieved/target − 1| ≤ the stated bound and that the bound compounds as derived.

## 3. Register entries

| Threshold | Value | Basis | Status |
|---|---|---|---|
| Round-trip tolerance, exact concentration | 6 ULP of the target per step from stock (intermediate counts as a step) | §1 | derived |
| Achieved-concentration bound | per vessel (1 + h_T/(Tᵈ − h_T))/(1 − h_D/V) − 1, compounded Π(1 + bᵢ) − 1; worst case 1.01 × 10⁻² per step | §2 | derived |
