// Printable bench sheet (C3-OUT-10, 12, 13; C3-ST-09), rendered from the object only.
// Survives greyscale and photocopying: flags and the withheld/flagged distinction
// are carried by position and presence (a FLAG line inside the vessel's row; a
// double-ruled "withheld" box in the plan's position), never by colour.
import { escapeHtml as esc } from './page-content.js';
import { markSvg } from './mark.js';
import { basisSentence, capabilitySentence, diluentSentence } from '../engine/format.js';

const vq = (q) => (q ? `<span class="num">${esc(q.display)}</span> ${esc(q.unit)}` : '—');
const cq = (c) => (c ? `<span class="num">${esc(c.value)}</span> ${esc(c.unit)}` : '—');

export function renderBenchSheet(r, config) {
  const head = `<div class="sheet-head">${markSvg({ size: 30, variant: 'plain', title: 'Ligant' })}<div>
  <h1>${esc(config.toolTitle)} — bench sheet</h1>
  <p class="pub">${esc(config.publisher)} · ${esc(config.productLine)} · ${esc(config.toolId)} · engine <span class="num">${esc(r.engineVersion)}</span></p>
  <p class="pub">${esc(r.scope)} ${esc(r.plansNotVerifies)}</p>
  </div></div>`;
  if (r.status === 'incomplete') return `${head}<p>No plan: declarations incomplete.</p>`;
  const d = r.declarations;
  const decls = `<h2>Declarations</h2><dl class="decls">
    <dt>Stock</dt><dd>${cq(d.stock.concentration)} — ${esc(d.stock.provenance.label)}${d.stock.availableVolume.declared ? `; available ${esc(d.stock.availableVolume.value)} ${esc(d.stock.availableVolume.unit)}` : '; available volume not declared'}</dd>
    <dt>Stock formulation</dt><dd>${d.stock.formulation.recorded ? esc(d.stock.formulation.text) : 'not recorded'}</dd>
    <dt>Targets</dt><dd>${esc(d.target.provenance.label)}${d.target.origin && d.target.origin.tool ? ` (${esc(d.target.origin.tool)} ${esc(d.target.origin.resultId || '')})` : ''}: ${d.target.values.map((t) => `${esc(t.label)} ${t.value !== null ? `${esc(t.value)} ${esc(t.unit)}` : '(derived)'}`).join('; ')}${d.target.declaredFactor ? `; factor ${esc(String(d.target.declaredFactor))}, ${esc(String(d.target.count))} points` : ''}</dd>
    <dt>Stated volume</dt><dd>${esc(basisSentence(r))}</dd>
    <dt>Route</dt><dd>${d.route ? esc(d.route.label) : 'not declared'}</dd>
    <dt>Diluent</dt><dd>${esc(diluentSentence(r))}</dd>
    <dt>Capability</dt><dd>${esc(capabilitySentence(r))}</dd>
    <dt>Factor convention</dt><dd>${esc(r.factorConvention)}</dd>
    <dt>Order of addition</dt><dd>${esc(r.orderOfAddition)}</dd>
    <dt>Labels</dt><dd>${esc(r.labelScheme)}</dd>
    <dt>Precision</dt><dd>volumes ${r.precision.volumes} sf; concentrations ${r.precision.concentrations} sf; totals and remaining volumes are sums of displayed values, never rounded</dd>
    <dt>Assumption</dt><dd>${esc(r.additivity.statement)} Scope: ${esc(r.additivity.scope.join('; '))}.</dd>
  </dl>`;
  if (r.status === 'rejected') {
    return `${head}${decls}<h2>Plan</h2><div class="withheld"><p><strong>Plan withheld.</strong> The tool declined to compute for a stated physical reason:</p><ul>${r.rejections.map((x) => `<li>[${esc(x.code)}] ${esc(x.message)}</li>`).join('')}</ul></div>`;
  }
  const rows = r.vessels.map((v, i) => {
    const flags = r.flags.filter((f) => f.scope.vessel === v.label).map((f) => `<span class="flag">${esc(f.code)}: ${esc(f.message)}</span>`).join('');
    if (v.kind === 'stock') {
      return `<tr><td class="num">${i + 1}</td><td class="num">${esc(v.label)}</td><td>stock, ${cq(v.concentration.entered)}</td><td>—</td><td>—</td><td>—</td><td>${v.volumes.onward.map((o) => `${vq(o.transfer)} → ${esc(o.to)}`).join('<br>') || 'nothing'}</td><td>—</td><td>${flags}</td></tr>`;
    }
    const vol = v.volumes;
    const contents = v.kind === 'intermediate' ? `intermediate, 1/${v.intermediateFactor} of ${esc(v.sourceLabel)}; ${cq(v.concentration.nominal)} nominal` : v.isZero ? `diluent-only control (target 0)` : `${v.isUndiluted ? 'undiluted stock; ' : ''}target ${cq(v.concentration.target)}; achieved ${esc(v.concentration.achieved.display)} ${esc(v.concentration.achieved.unit)} (${v.concentration.bound.status === 'derived' ? `bound ±${esc(v.concentration.bound.display)}` : 'bound: derivation memo unsigned'})`;
    const receiving = v.receiving === 'stain' ? `<strong>stain already in vessel:</strong> ${vq(vol.mustAlreadyHold)} (cells and buffer; not added by this plan)` : v.isUndiluted ? 'no diluent' : `diluent ${vq(vol.diluent)}`;
    const add = v.isZero ? '—' : `${vq(vol.transferIn)} from <span class="num">${esc(v.sourceLabel)}</span>`;
    const total = `${vq(vol.total)}${vol.closureTarget && !vol.closes ? `<br><span class="small">sum of displayed volumes; prepared to close ${esc(vol.closureTarget)} ${esc(vol.total.unit)} (ρ ${esc(vol.residual)})</span>` : ''}${vol.finalVolume ? '<br><span class="small">final volume = D + Tᵈ</span>' : ''}`;
    const onward = vol.onward.length ? vol.onward.map((o) => `${vq(o.transfer)} → ${esc(o.to)}`).join('<br>') : '—';
    const remaining = vol.onward.length ? vq(vol.remaining) : '—';
    return `<tr><td class="num">${i + 1}</td><td class="num">${esc(v.label)}</td><td>${contents}<br><span class="small">${v.stepsFromStock} step${v.stepsFromStock === 1 ? '' : 's'} from stock</span></td><td>${receiving}</td><td>${add}</td><td>${total}</td><td>${onward}</td><td>${remaining}</td><td>${flags}</td></tr>`;
  }).join('');
  const planFlags = r.flags.filter((f) => f.scope.level === 'plan');
  return `${head}${decls}
  <h2>Vessels in execution order</h2>
  <table>
    <thead><tr><th>#</th><th>Vessel</th><th>What is in it</th><th>Receiving volume (in vessel first)</th><th>Add, and from where</th><th>Total prepared</th><th>Onward</th><th>Remaining</th><th>Flags</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <p class="small">Stock consumed, including any intermediate: ${vq(r.stockConsumed)}.</p>
  ${planFlags.length ? `<h2>Plan-level flags</h2><ul>${planFlags.map((f) => `<li><span class="flag">${esc(f.code)}: ${esc(f.message)}</span></li>`).join('')}</ul>` : ''}
  ${r.notes.length ? `<p class="small">${r.notes.map(esc).join(' ')}</p>` : ''}
  <p class="handfill">Date: ______________ &nbsp; Prepared by: ______________ &nbsp; Stock lot: ______________</p>`;
}
