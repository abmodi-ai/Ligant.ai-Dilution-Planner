// Renders the on-screen plan from the result object only (C3-OUT-06).
import { escapeHtml as esc } from './page-content.js';
import { basisSentence, capabilitySentence, diluentSentence } from '../engine/format.js';

const vq = (q) => (q ? `<span class="num">${esc(q.display)}</span> ${esc(q.unit)}` : '—');
const cq = (c) => (c ? `<span class="num">${esc(c.value)}</span> ${esc(c.unit)}` : '—');

export function renderDeclarations(r) {
  const d = r.declarations;
  if (!d || !d.stock.concentration) {
    return '<span class="decl empty">Declarations appear here as they are entered; every step of the plan is shown under them.</span>';
  }
  const items = [];
  const decl = (k, v, cls = '') => items.push(`<span class="decl ${cls}"><b>${esc(k)}</b> ${v}</span>`);
  decl('Stock', `${cq(d.stock.concentration)}${d.stock.provenance ? `, ${esc(d.stock.provenance.label)}` : ''}`);
  if (d.volume && d.basis) decl('Stated volume', `${vq({ display: d.volume.value, unit: d.volume.unit })} as ${esc(d.basis.short)}${d.basis.fixedByImport ? ' (fixed by import)' : ''}`, d.basis.fixedByImport ? 'fixed' : '');
  if (d.route) decl('Route', d.route.notApplicable ? 'single point — no route' : esc(d.route.label.split(' — ')[0]), d.route.notApplicable ? 'absent' : '');
  if (d.diluent) decl('Diluent', d.diluent.notRecorded ? 'not recorded' : esc(d.diluent.name), d.diluent.notRecorded ? 'absent' : '');
  if (d.target.provenance) decl('Targets', `${esc(d.target.provenance.label)}${d.target.origin && d.target.origin.tool ? `, ${esc(d.target.origin.tool)} ${esc(d.target.origin.resultId || '')}` : ''}`);
  const c = d.capability;
  if (c.minTransfer) decl('Min transfer', vq({ display: c.minTransfer.value, unit: c.minTransfer.unit }));
  decl('Max transfer', c.maxTransfer.declared ? vq({ display: c.maxTransfer.value, unit: c.maxTransfer.unit }) : 'not declared', c.maxTransfer.declared ? '' : 'absent');
  decl('Capacity', c.capacity.declared ? vq({ display: c.capacity.value, unit: c.capacity.unit }) : 'not declared', c.capacity.declared ? '' : 'absent');
  decl('Stock available', d.stock.availableVolume.declared ? vq({ display: d.stock.availableVolume.value, unit: d.stock.availableVolume.unit }) : 'not declared', d.stock.availableVolume.declared ? '' : 'absent');
  decl('Formulation', d.stock.formulation.recorded ? esc(d.stock.formulation.text) : 'not recorded', d.stock.formulation.recorded ? '' : 'absent');
  return items.join('');
}

export function renderPlanRegion(r) {
  if (r.status === 'incomplete') {
    return `<div class="state-block incomplete"><h3>No plan yet — declarations incomplete</h3><ul>${r.incomplete.map((i) => `<li>${esc(i.message)}</li>`).join('')}</ul></div>`;
  }
  if (r.status === 'rejected') {
    // Withheld state: the reason occupies the plan's position. No plan is shown. Not a system error; not red.
    return `<div class="state-block withheld"><h3>Plan withheld — the tool declines to compute for a stated physical reason</h3><ul>${r.rejections.map((x) => `<li><span class="code">${esc(x.code)}</span>${esc(x.message)}</li>`).join('')}</ul></div>`;
  }
  const flagsFor = (label) => r.flags.filter((f) => f.scope.vessel === label);
  const parts = [];
  for (const v of r.vessels) parts.push(renderVessel(v, r, flagsFor(v.label)));
  const planFlags = r.flags.filter((f) => f.scope.level === 'plan');
  if (planFlags.length) {
    parts.push(`<ul class="plan-flags" aria-label="plan-level flags">${planFlags.map((f) => `<li><span class="code">${esc(f.code)}</span>${esc(f.message)}</li>`).join('')}</ul>`);
  }
  parts.push(`<p class="plan-summary">Stock consumed, including any intermediate: ${vq(r.stockConsumed)}. ${esc(r.labelScheme)}</p>`);
  return parts.join('');
}

function renderVessel(v, r, flags) {
  const chips = flags.map((f) => `<span class="flag-chip">${esc(f.code)}</span>`).join('');
  const kindWord = v.kind === 'stock' ? 'stock' : v.kind === 'intermediate' ? `intermediate — 1/${v.intermediateFactor} of ${esc(v.sourceLabel)}` : v.isZero ? 'point — diluent alone' : v.isUndiluted ? 'point — undiluted stock' : 'point';
  const meta = v.kind === 'stock' ? '' : v.isZero ? 'not drawn from any vessel' : `drawn from <span class="num">${esc(v.sourceLabel)}</span> · ${v.stepsFromStock} step${v.stepsFromStock === 1 ? '' : 's'} from stock`;
  let grid = '';
  if (v.kind === 'stock') {
    grid = `<div class="vessel-grid">
      <div class="vg"><span class="k">Concentration (as entered)</span><span class="v">${cq(v.concentration.entered)}</span></div>
      <div class="vg"><span class="k">Draw from it</span><span class="v">${v.volumes.onward.length ? v.volumes.onward.map((o) => `${esc(o.transfer.display)} ${esc(o.transfer.unit)} → ${esc(o.to)}`).join('; ') : 'nothing'}</span></div>
    </div>`;
  } else {
    const vol = v.volumes;
    const c = v.concentration;
    const concCell = v.kind === 'intermediate'
      ? `<div class="vg"><span class="k">Concentration (nominal)</span><span class="v">${cq(c.nominal)}</span></div>`
      : `<div class="vg"><span class="k">Target${c.target.asEntered ? ' (as entered)' : ' (from top and factor)'}</span><span class="v">${cq(c.target)}</span></div>`;
    const receiving = v.receiving === 'stain' ? 'Stain already in vessel' : 'Diluent';
    const totalSub = vol.closureTarget && !vol.closes ? `<span class="sub">sum of displayed volumes; prepared to close ${esc(vol.closureTarget)} ${esc(vol.total.unit)}</span>` : (vol.closureTarget ? '<span class="sub">closes exactly</span>' : '');
    grid = `<div class="vessel-grid">
      ${concCell}
      ${v.isZero ? '' : `<div class="vg"><span class="k">Transfer in, from ${esc(v.sourceLabel)}</span><span class="v">${vq(vol.transferIn)}</span><span class="sub">factor ${esc(v.factorFromSource.display)}</span></div>`}
      <div class="vg"><span class="k">${receiving}${vol.diluent.derived ? ' (derived)' : ''}</span><span class="v">${vq(v.receiving === 'stain' ? vol.mustAlreadyHold : vol.diluent)}</span>${v.receiving === 'stain' ? '<span class="sub">the volume the vessel must already hold</span>' : ''}</div>
      <div class="vg"><span class="k">${vol.finalVolume ? 'Final volume (D + Tᵈ)' : 'Total prepared'}</span><span class="v">${vq(vol.total)}</span>${totalSub}</div>
      ${vol.onward.length ? `<div class="vg"><span class="k">Onward</span><span class="v">${vol.onward.map((o) => `${esc(o.transfer.display)} → ${esc(o.to)}`).join('; ')} ${esc(vol.total.unit)}</span></div><div class="vg"><span class="k">Remaining after onward</span><span class="v">${vq(vol.remaining)}</span></div>` : ''}
      ${vol.residual !== null ? `<div class="vg"><span class="k">Closure residual ρ</span><span class="v">${esc(vol.residual)} ${esc(vol.total.unit)}</span></div>` : ''}
      ${v.isZero ? '' : `<div class="vg"><span class="k">Exact concentration</span><span class="v">${esc(c.exact.display)} ${esc(c.exact.unit)}</span><span class="sub">from unrounded volumes</span></div>
      <div class="vg"><span class="k">Achieved (point value)</span><span class="v">${esc(c.achieved.display)} ${esc(c.achieved.unit)}</span><span class="sub">from the displayed volumes, before any pipetting error</span></div>
      <div class="vg"><span class="k">Bound on departure</span><span class="v">±${esc(c.bound.display)}</span><span class="sub">relative, compounded along the chain; registration open</span></div>`}
    </div>`;
  }
  const flagList = flags.length ? `<ul class="vessel-flags">${flags.map((f) => `<li><span class="code">${esc(f.code)}</span>${esc(f.message)}</li>`).join('')}</ul>` : '';
  return `<article class="vessel ${esc(v.kind)}${v.isZero ? ' zero' : ''}" data-label="${esc(v.label)}" data-step="${v.kind === 'stock' ? '' : '1'}">
    <div class="vessel-head"><span class="label">${esc(v.label)}</span><span class="kind">${kindWord}</span><span class="meta">${meta}</span><span class="flags" data-flags="${flags.length}">${chips}</span></div>
    ${grid}${flagList}
  </article>`;
}

export function renderDerivation(r) {
  if (r.status === 'incomplete' || !r.declarations || !r.declarations.stock.concentration) return '';
  const d = r.declarations;
  const echo = [];
  const row = (k, v) => echo.push(`<dt>${esc(k)}</dt><dd>${v}</dd>`);
  row('Stock concentration', `${cq(d.stock.concentration)} — ${esc(d.stock.provenance.label)}`);
  row('Available stock volume', d.stock.availableVolume.declared ? vq({ display: d.stock.availableVolume.value, unit: d.stock.availableVolume.unit }) : 'not declared');
  row('Stock formulation', d.stock.formulation.recorded ? esc(d.stock.formulation.text) : 'not recorded');
  row('Target form', esc(d.target.form) + (d.target.declaredFactor ? `; declared factor <span class="num">${esc(String(d.target.declaredFactor))}</span>, ${esc(String(d.target.count))} points` : ''));
  row('Targets', d.target.values.map((t) => `<span class="num">${esc(t.label)}</span> ${t.value !== null ? `<span class="num">${esc(t.value)}</span> ${esc(t.unit)}` : '(derived from the top)'}`).join('; '));
  row('Target provenance', esc(d.target.provenance.label) + (d.target.origin && d.target.origin.tool ? ` — ${esc(d.target.origin.tool)} ${esc(d.target.origin.resultId || '')}` : ''));
  row('Stated volume and basis', esc(basisSentence(r)) + ` The stated volume is ${esc(d.basis.statedVolumeIs)}.`);
  row('Route', d.route ? esc(d.route.label) : 'not declared');
  row('Diluent', esc(diluentSentence(r)));
  row('Capability', esc(capabilitySentence(r)));
  for (const o of d.overrides) row('Replaced import', `${esc(o.field)}: imported ${esc(String(o.imported))}, replaced by ${esc(String(o.replaced))}`);
  return `
    <h3>Relations applied — ${esc(d.basis.short)}</h3>
    <ul>${r.relations.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>
    <p>${esc(r.factorConvention)}. ${esc(r.orderOfAddition)}</p>
    <h3>Assumptions</h3>
    <p>${esc(r.additivity.statement)} Scope: ${esc(r.additivity.scope.join('; '))}. Status: ${esc(r.additivity.status)}.</p>
    <h3>Inputs as entered</h3>
    <dl class="echo">${echo.join('')}</dl>
    ${r.notes.length ? `<p class="notes">${r.notes.map(esc).join(' ')}</p>` : ''}
    <p>Displayed precision: volumes ${r.precision.volumes} significant figures; concentrations ${r.precision.concentrations} significant figures. Rounding: ${esc(r.precision.rounding)}. Engine <span class="num">${esc(r.engineVersion)}</span>. ${esc(r.scope)} ${esc(r.plansNotVerifies)}</p>`;
}
