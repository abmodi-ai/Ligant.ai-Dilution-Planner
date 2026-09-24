// Shared result object — C3's expression of it, and a validator.
//
// Handoff check D1 / URS C3-OUT-05 / open item 8. The shared format as shipped
// in the Antigen Density Calculator (C1) and as extended for C4's ordered series
// was NOT in the build package. This module therefore documents the shape C3
// produces and validates every plan against it, so that the confirmation
// against the shared format can be made by comparison when that format is
// available. It does not extend the shared format locally; it records what C3
// needs the shared format to express. The schema
// version string carries "draft" until open item 8 is closed.

export const SCHEMA = 'ligant.bench-tools.result';
export const SCHEMA_VERSION = '1-c3';

function isQuantity(q, allowNullUnit) {
  return q && typeof q === 'object'
    && typeof q.display === 'string'
    && (allowNullUnit || typeof q.unit === 'string')
    && (q.unrounded === null || typeof q.unrounded === 'number');
}

function isScope(s) {
  if (!s || typeof s !== 'object') return false;
  if (!['plan', 'vessel', 'step'].includes(s.level)) return false;
  if (s.level === 'vessel' && typeof s.vessel !== 'string') return false;
  if (s.level === 'step' && (typeof s.vessel !== 'string' || typeof s.from !== 'string')) return false;
  return true;
}

/**
 * Validate a result object. Returns an array of problem strings; empty means
 * the object satisfies the C3 draft of the shared format: an ordered plan,
 * per-step flag scope, vessel labels with each point's source-vessel label, the
 * intermediate as a vessel, the closure residual per vessel, and three
 * concentrations per point (exact, achieved point value, bound).
 */
export function validateResultObject(r) {
  const problems = [];
  const need = (cond, msg) => { if (!cond) problems.push(msg); };
  need(r && typeof r === 'object', 'not an object');
  if (!r) return problems;
  need(r.schema === SCHEMA, `schema is "${r.schema}"`);
  need(r.schemaVersion === SCHEMA_VERSION, `schemaVersion is "${r.schemaVersion}"`);
  need(r.tool === 'C3', 'tool is not C3');
  need(typeof r.engineVersion === 'string' && /^\d+\.\d+\.\d+$/.test(r.engineVersion), 'engineVersion missing or malformed');
  need(['plan', 'rejected', 'incomplete'].includes(r.status), `status "${r.status}"`);
  need(Array.isArray(r.flags), 'flags is not an array');
  need(Array.isArray(r.rejections), 'rejections is not an array');
  need(Array.isArray(r.incomplete), 'incomplete is not an array');
  need(Array.isArray(r.vessels), 'vessels is not an array');
  need(r.precision && r.precision.volumes === 3 && r.precision.concentrations === 6, 'precision not stated as 3 sf / 6 sf');
  need(typeof r.scope === 'string' && /GxP/.test(r.scope), 'scope statement missing');
  need(typeof r.plansNotVerifies === 'string', 'plans-not-verifies statement missing');

  for (const f of r.flags || []) {
    need(typeof f.code === 'string' && /^C3-FL-\d\d$/.test(f.code), `flag code "${f.code}" malformed`);
    need(isScope(f.scope), `flag ${f.code}: scope not resolvable`);
    need(typeof f.message === 'string' && f.message.length > 0, `flag ${f.code}: no message`);
  }
  for (const x of r.rejections || []) {
    need(typeof x.code === 'string' && /^C3-HI-\d\d$/.test(x.code), `rejection code "${x.code}" malformed`);
    need(typeof x.message === 'string' && x.message.length > 0, `rejection ${x.code}: no message`);
    need(isScope(x.scope), `rejection ${x.code}: scope missing`);
  }

  if (r.status !== 'plan') {
    need((r.vessels || []).length === 0, 'a withheld plan must carry no vessels');
    return problems;
  }

  // Plan: ordered vessels with unique labels; every non-stock vessel names its source.
  const labels = new Set();
  const stock = r.vessels.filter((v) => v.kind === 'stock');
  need(stock.length === 1 && r.vessels[0] && r.vessels[0].kind === 'stock', 'exactly one stock vessel, first in order');
  r.vessels.forEach((v, i) => {
    need(typeof v.label === 'string' && v.label.length > 0, `vessel ${i}: no label`);
    need(!labels.has(v.label), `vessel label "${v.label}" is not unique`);
    labels.add(v.label);
    need(['stock', 'intermediate', 'point'].includes(v.kind), `vessel ${v.label}: kind "${v.kind}"`);
    need(Number.isInteger(v.stepsFromStock) && v.stepsFromStock >= 0, `vessel ${v.label}: stepsFromStock`);
    need(Array.isArray(v.flags), `vessel ${v.label}: flags`);
    if (v.kind === 'stock') return;
    if (v.isZero) need(v.sourceLabel === null, `zero point ${v.label} must not name a source`);
    else need(typeof v.sourceLabel === 'string' && labels.has(v.sourceLabel), `vessel ${v.label}: source "${v.sourceLabel}" must be an earlier vessel`);
    need(v.volumes && isQuantity(v.volumes.transferIn) && isQuantity(v.volumes.diluent) && isQuantity(v.volumes.total) && isQuantity(v.volumes.remaining), `vessel ${v.label}: volumes incomplete`);
    need(v.volumes && typeof v.volumes.diluent.derived === 'boolean', `vessel ${v.label}: derived flag missing`);
    need(v.volumes && (v.volumes.residual === null || typeof v.volumes.residual === 'string'), `vessel ${v.label}: residual`);
    need(v.concentration && v.concentration.exact && typeof v.concentration.exact.value === 'number', `vessel ${v.label}: exact concentration`);
    need(v.concentration && v.concentration.achieved && typeof v.concentration.achieved.display === 'string', `vessel ${v.label}: achieved point value`);
    need(v.concentration && v.concentration.bound && ['open', 'derived'].includes(v.concentration.bound.status), `vessel ${v.label}: bound status`);
    if (v.kind === 'point') need(v.concentration.target && typeof v.concentration.target.value === 'string', `point ${v.label}: target echo`);
    if (v.kind === 'intermediate') need(Number.isFinite(v.intermediateFactor) && Array.isArray(v.destinations), `intermediate ${v.label}: factor/destinations`);
  });
  // Every step-scoped flag resolves to a vessel in the plan.
  for (const f of r.flags) {
    if (f.scope.level !== 'plan') need(labels.has(f.scope.vessel), `flag ${f.code}: scope vessel "${f.scope.vessel}" not in plan`);
  }
  need(isQuantity(r.stockConsumed), 'stockConsumed missing');
  need(Array.isArray(r.steps) && r.steps.every((s) => typeof s.from === 'string' && typeof s.to === 'string'), 'steps malformed');
  return problems;
}
