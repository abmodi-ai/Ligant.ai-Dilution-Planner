// Tolerance derivations for open items 6 and 7 (docs/tolerance-memo.md), taken
// under owner delegation on 15 September 2026. Each is the analytic bound over
// the stated operation set (docs/operation-sequence.md); the empirical maxima in
// the memo are evidence the bounds are not loose, never the tolerance.
//
// REGISTRATION IS OPEN. The memo is NADIRA's to sign and has not been signed
// (owner's instruction, 17 September 2026), so the result object states both
// tolerances as open and publishes no register value for them. The constants
// below remain the engine's derivation: the per-point bound required by
// C3-OUT-03 is computed from them, and acceptance 3 compares against the
// round-trip count. Restore the published values when the memo is signed.

import * as Dec from './decimal.js';

/**
 * Round-trip tolerance (open item 6), in ULP of the target, at a point k steps
 * from the stock (a planned intermediate counts as a step).
 *
 * Derivation: the exact concentration of a vessel is c_src_exact × (T / V). With
 * T = (V·c_b)/c_src (two roundings) and the recomputation (two roundings), a
 * direct step under the final- and available-volume bases performs four unit
 * roundings whose relative errors add to first order; V cancels exactly because
 * the same double appears in T and in T/V. The diluent-volume basis adds the
 * subtraction (c_src − c_b) and the sum D + T: six. An intermediate vessel adds
 * five (its transfer is an exact decimal shift; toNumber of T_int and F_int, the
 * ratio, the product, and the nominal c_src/g used by its destination). Each
 * rounding is at most u = 2⁻⁵³ relative, and for any double c, c / ulp(c) < 2⁵³,
 * so k unit roundings are fewer than k ULP of the target. The largest per-step
 * count is six; the bound is stated uniformly as 6 ULP per step from stock.
 */
export const ROUND_TRIP_ULP_PER_STEP = 6;

export function roundTripToleranceUlp(stepsFromStock) {
  return ROUND_TRIP_ULP_PER_STEP * stepsFromStock;
}

/**
 * Achieved-concentration bound (open item 7).
 *
 * At a vessel, achieved/target = (1 + dep_src)(1 + ε_T)/(1 + ρ/V) where
 * ε_T = (Tᵈ − T)/T, |Tᵈ − T| ≤ h_T (half a unit in Tᵈ's last displayed place),
 * ρ = Dᵈ − D the closure residual, |ρ| ≤ h_D, and V the volume the derived
 * volume was computed to close. Hence, per vessel,
 *   b = (1 + h_T/(Tᵈ − h_T)) / (1 − h_D/V) − 1,
 * and the departure compounds along the chain as Π(1 + bᵢ) − 1. Under the
 * diluent-volume basis there is no residual; achieved/target is
 * (1 + ε_T)/(1 + ε_T·T/(D + T)), whose departure is bounded by |ε_T| ≤
 * h_T/(Tᵈ − h_T) for either sign; an undiluted vessel has no departure of its own.
 *
 * Worst case over leading digit (both terms at leading digit 1, different
 * decades): 1.0101 × 10⁻² per step; 5.03 × 10⁻³ where closure is exact or under
 * the diluent-volume basis; along a chain of n steps (1.0101)ⁿ − 1, first-order
 * n × 1.01 × 10⁻².
 */
const A1 = 0.005 / 0.995; // h/(x − h) at leading digit 1
export const ACHIEVED_BOUND_PER_STEP_WORST = (1 + A1) / (1 - A1) - 1; // = 1.0101e-2 (1.005025/0.994975 − 1)
export const ACHIEVED_BOUND_PER_STEP_EXACT_CLOSURE = A1; // = 5.025e-3

/** Per-vessel own term b, from the displayed values (Dec) and closure V (Dec or null). */
export function vesselDepartureBound({ Td, Dd, closure, basis, undiluted, zero }) {
  if (zero || undiluted) return 0;
  const hT = Dec.toNumber(Dec.halfUlp(Td));
  const tdn = Dec.toNumber(Td);
  const bT = tdn > hT ? hT / (tdn - hT) : 1; // degenerate guard; never reached for a 3-sf value
  if (basis === 'diluent' || !closure) {
    // achieved/target = (1 + ε_T)/(1 + ε_T·T/(D + T)); its departure is bounded by |ε_T| for either sign.
    return bT;
  }
  const hD = Dec.toNumber(Dec.halfUlp(Dd));
  const V = Dec.toNumber(closure);
  return (1 + bT) / (1 - hD / V) - 1;
}

/** Compound a source's bound with a vessel's own term. */
export function compoundBound(sourceBound, own) {
  return (1 + sourceBound) * (1 + own) - 1;
}

export function worstCaseChain(n) {
  return (1 + ACHIEVED_BOUND_PER_STEP_WORST) ** n - 1;
}
