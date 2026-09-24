// Engine version (C3-NF-07), the tool-set rule in three categories. The same
// rule applies across C1, C4 and C7.
//
//   MAJOR  when any reported number changes at any input — a relation, a
//          rounding, a threshold value, the intermediate rule, a tolerance — or
//          any input moves between planned and rejected (V2), so that a
//          citation to the previous version no longer reproduces. A MAJOR
//          release requires the reference table to be re-checked before release.
//   MINOR  when the result object changes and no number does: fields added or
//          removed, statuses changed, flags added, text in the object.
//   PATCH  when neither the object nor any number changes: page text, styling,
//          build, dependencies.
//
// 1.0.0 (URS v0.4.2, 21 September 2026) is MAJOR on both counts:
//   - inputs that 0.3.0 planned are now rejected. C3-HI-10 withholds any plan
//     whose non-zero diluent is below the declared minimum, and C3-DT-06
//     condition (i) is two-sided under the first and third bases, so a step
//     whose only intermediate would leave a sub-minimum diluent is rejected
//     under C3-HI-09 naming the destination diluent bound.
//   - numbers change at inputs that still plan: every comparison with the
//     minimum now uses the displayed volume (V3), which moves the boundary at
//     which an intermediate is planned, and the signed tolerance memo turns the
//     withheld per-point bound into a displayed number.
// 0.3.0 stated both tolerances open and published no value (MINOR: the object
// changed, no number did). 0.2.0 added the per-point bound and the import path.
// 1.0.1 (24 September 2026), PATCH: the page allows Cloudflare Web Analytics
// through its CSP and says so. No number changes and the object does not change
// beyond this label; the reference table is identical.
export const ENGINE_VERSION = '1.0.1';
export const URS_VERSION = '0.4.2';
export const TOOL_ID = 'C3';
