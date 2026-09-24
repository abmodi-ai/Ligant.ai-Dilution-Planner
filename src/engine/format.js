// Renderers that work from the structured result object only (C3-OUT-06).
// Nothing here computes a volume; every number is read from the object.

function vq(q) {
  return q ? `${q.display} ${q.unit}` : '—';
}

function cq(c) {
  return c ? `${c.value} ${c.unit}` : '—';
}

export function basisSentence(r) {
  const d = r.declarations;
  return `${d.volume.value} ${d.volume.unit}, declared as ${d.basis.label}${d.basis.fixedByImport ? ' (fixed by import)' : ''}.`;
}

export function capabilitySentence(r) {
  const c = r.declarations.capability;
  const parts = [`minimum reliable transfer ${c.minTransfer.value} ${c.minTransfer.unit}`];
  parts.push(c.maxTransfer.declared ? `maximum single transfer ${c.maxTransfer.value} ${c.maxTransfer.unit}` : 'no maximum single-transfer volume declared');
  parts.push(c.capacity.declared ? `vessel working capacity ${c.capacity.value} ${c.capacity.unit}` : 'no vessel working capacity declared');
  return parts.join('; ') + '.';
}

export function diluentSentence(r) {
  const d = r.declarations.diluent;
  return d.notRecorded ? 'Diluent: not recorded.' : `Diluent: ${d.name}.`;
}

export function receivingWord(v) {
  return v.receiving === 'stain' ? 'stain' : 'diluent';
}

/** Instruction sentence for a vessel, from the object. */
export function vesselInstruction(v, r) {
  if (v.kind === 'stock') {
    const on = v.volumes.onward.map((o) => `${vq(o.transfer)} to ${o.to}`).join(', ');
    return `${v.label} — stock, ${cq(v.concentration.entered)}. Draw: ${on || 'nothing'}.`;
  }
  const vol = v.volumes;
  if (v.isZero) {
    return `${v.label} — diluent alone (target 0): place ${vq(vol.diluent)} of diluent. Contains none of the stock.`;
  }
  const what = v.kind === 'intermediate' ? `intermediate at 1/${v.intermediateFactor} of ${v.sourceLabel} (${cq(v.concentration.nominal)} nominal)` : `point, target ${cq(v.concentration.target)}`;
  let s = `${v.label} — ${what}. `;
  if (v.receiving === 'stain') {
    s += `The vessel must already hold ${vq(vol.mustAlreadyHold)} of stain (cells and buffer). Add ${vq(vol.transferIn)} from ${v.sourceLabel}. `;
  } else if (v.isUndiluted) {
    s += `Place ${vq(vol.transferIn)} of ${v.sourceLabel} (undiluted; no diluent). `;
  } else {
    s += `Place ${vq(vol.diluent)} of diluent, then add ${vq(vol.transferIn)} from ${v.sourceLabel}. `;
  }
  s += `Total ${vq(vol.total)}`;
  if (vol.closureTarget && !vol.closes) s += ` (displayed volumes sum to ${vol.total.display}; prepared to close ${vol.closureTarget} ${vol.total.unit}; residual ${vol.residual} ${vol.total.unit})`;
  s += '.';
  if (vol.onward.length) {
    s += ` Onward: ${vol.onward.map((o) => `${vq(o.transfer)} to ${o.to}`).join(', ')}. Remaining ${vq(vol.remaining)}.`;
  }
  return s;
}

/** Plain-text plan for a lab notebook (C3-OUT-11), preserving step order. */
export function notebookText(r) {
  const L = [];
  const d = r.declarations;
  L.push(`Dilution plan — ${r.tool} Dilution Planner, engine ${r.engineVersion} (URS ${r.ursVersion})`);
  L.push(r.scope + ' ' + r.plansNotVerifies);
  L.push('');
  if (r.status === 'incomplete') {
    L.push('No plan: inputs incomplete.');
    for (const i of r.incomplete) L.push(`  - ${i.message}`);
    return L.join('\n');
  }
  L.push('Declarations');
  L.push(`  Stock: ${cq(d.stock.concentration)}; provenance: ${d.stock.provenance.label}${d.stock.availableVolume.declared ? `; available ${d.stock.availableVolume.value} ${d.stock.availableVolume.unit}` : '; available volume not declared'}`);
  L.push(`  Stock formulation: ${d.stock.formulation.recorded ? d.stock.formulation.text : 'not recorded'}`);
  L.push(`  Targets (${d.target.form}; ${d.target.provenance.label}${d.target.origin ? `, ${d.target.origin.tool} ${d.target.origin.resultId || ''}` : ''}): ${d.target.values.map((t) => `${t.label} = ${t.value !== null ? t.value : '(derived)'} ${t.unit}`).join('; ')}`);
  if (d.target.declaredFactor) L.push(`  Declared factor ${d.target.declaredFactor}, ${d.target.count} points`);
  L.push(`  Stated volume: ${basisSentence(r)}`);
  L.push(`  Route: ${d.route ? d.route.label : 'not declared'}`);
  L.push(`  ${diluentSentence(r)}`);
  L.push(`  Capability: ${capabilitySentence(r)}`);
  L.push(`  Factor convention: ${r.factorConvention}`);
  L.push(`  Order of addition: ${r.orderOfAddition}`);
  L.push(`  Precision: volumes ${r.precision.volumes} sf; concentrations ${r.precision.concentrations} sf; rounding ${r.precision.rounding}`);
  L.push(`  ${r.additivity.statement} Scope: ${r.additivity.scope.join('; ')}.`);
  L.push('');
  if (r.status === 'rejected') {
    L.push('Plan withheld');
    for (const x of r.rejections) L.push(`  [${x.code}] ${x.message}`);
    return L.join('\n');
  }
  L.push(`Vessels (${r.labelScheme})`);
  r.vessels.forEach((v, i) => {
    L.push(`  ${i + 1}. ${vesselInstruction(v, r)}`);
    if (v.kind !== 'stock' && !v.isZero) {
      L.push(`     steps from stock ${v.stepsFromStock}; factor from ${v.sourceLabel} ${v.factorFromSource.display}; exact ${v.concentration.exact.display} ${v.concentration.exact.unit}; achieved ${v.concentration.achieved.display} ${v.concentration.achieved.unit}; ${v.concentration.bound.status === 'derived' ? `bound ±${v.concentration.bound.display} relative` : 'bound: derivation memo unsigned'}`);
    }
    for (const f of r.flags.filter((f) => f.scope.vessel === v.label)) L.push(`     FLAG ${f.code}: ${f.message}`);
  });
  L.push(`  Stock consumed: ${vq(r.stockConsumed)}`);
  const planFlags = r.flags.filter((f) => f.scope.level === 'plan');
  if (planFlags.length) {
    L.push('');
    L.push('Plan-level flags');
    for (const f of planFlags) L.push(`  FLAG ${f.code}: ${f.message}`);
  }
  if (r.notes.length) {
    L.push('');
    L.push('Notes');
    for (const n of r.notes) L.push(`  ${n}`);
  }
  return L.join('\n');
}
