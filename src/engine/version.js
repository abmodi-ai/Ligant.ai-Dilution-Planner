// Engine version (C3-NF-07). Rule applied: MAJOR.MINOR.PATCH.
//   MINOR changes whenever calculation behaviour changes — any change to the
//   volumes, concentrations, factors, flags, rejects or intermediate selection
//   the engine produces for a given input.
//   PATCH changes for a change that cannot alter any output (comments, message
//   wording that carries the same quantities, performance).
//   MAJOR changes when the input model or the result object shape changes
//   incompatibly.
// Rendering and page changes do not change the engine version.
// 0.3.0: the two tolerances are stated open, not derived, and publish no value
// (the memo is unsigned; owner's instruction, 17 September 2026). No calculation
// behaviour changed — volumes, concentrations, factors, flags, rejects and
// intermediate selection are identical for every input — but the object's
// content did, and two builds must not emit different tolerance blocks under one
// engine version. The object's shape is unchanged: the register fields are
// present and null. MINOR is the conservative reading of the rule below, which
// does not name an output change that is not a calculation change.
export const ENGINE_VERSION = '0.3.0'; // 0.2.0: per-point achieved bound and registered tolerances in the object; import interface
export const URS_VERSION = '0.4.1';
export const TOOL_ID = 'C3';
