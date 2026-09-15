// The tool page's own statements (C3-CN-01, C3-FC-01, acceptance 25–26).
// The two tolerance rows are OPEN with no numeric value until the memo is signed.
import { ENGINE_VERSION, URS_VERSION } from '../engine/version.js';
import { SUGGESTED_MIN_TRANSFER_UL, ADDITIVITY } from '../engine/plan.js';

export const REGISTER = [
  { threshold: 'Achieved-concentration bound', value: 'open — no value stated', basis: 'Analytic, over the displayed-precision rounding of the stated operation set, worst case over leading digit, including the C3-IV-01 residual, compounded along a serial chain. Empirical maximum as evidence only.', status: 'open', note: 'open item 7' },
  { threshold: 'Round-trip tolerance, exact concentration', value: 'open — no value stated', basis: "Analytic over this tool's operation set — a division, a subtraction, the recomputation — and repeated application in serial mode. Not assumed from C1.", status: 'open', note: 'open item 6' },
  { threshold: 'Closure residual, displayed volumes', value: '±½ unit in the last displayed place of the one derived volume per vessel; zero under the diluent-volume basis', basis: 'Analytic, from C3-DT-04: with D = F − Tᵈ and Dᵈ = D + ρ, Tᵈ + Dᵈ = F + ρ exactly; |ρ| ≤ ½ unit in D\'s last displayed place, either sign.', status: 'derived' },
  { threshold: 'Minimum reliable transfer volume', value: `user-declared, ${SUGGESTED_MIN_TRANSFER_UL} µL suggested`, basis: 'Disclosed default, carried from C4', status: 'disclosed' },
  { threshold: 'Maximum single-transfer volume', value: 'user-declared, optional, no default', basis: 'Disclosed. Never alters a planned volume (C3-IV-08 a)', status: 'disclosed' },
  { threshold: 'Vessel working capacity', value: 'user-declared, optional, no default', basis: 'Disclosed', status: 'disclosed' },
  { threshold: 'Intermediate factor series', value: '{10, 100, 1000, …}', basis: 'Inspection: checkable by eye. Consequence published below (C3-DT-06 step 5)', status: 'proposed', note: 'open item 16' },
  { threshold: 'Displayed precision, volumes', value: '3 significant figures', basis: 'Tool-set principle: precision matches the physical act', status: 'disclosed' },
  { threshold: 'Displayed precision, concentrations', value: '6 significant figures, on values that carry information', basis: 'Matches C1; a concentration drives a record, not an act', status: 'disclosed' },
];

export const FAILURE_CLASSES = [
  'A stock concentration that is wrong — mislabelled, degraded, from a different lot, or correct for a different formulation.',
  'Incomplete mixing between serial steps. This is the largest real source of serial dilution error and is invisible in every record the tool produces.',
  'Adsorption of protein to vessel surfaces, significant at low concentrations without a carrier, which makes the achieved concentration lower than the planned one by an amount the tool cannot estimate.',
  'Departure from volume additivity outside the stated scope. Two cases are named: a stock in a co-solvent — glycerol, DMSO, ethanol — diluted at a low factor, where the co-solvent fraction after mixing exceeds about 5% v/v and the excess volume of mixing reaches 1–3%; and a dense suspension of large cells, where the cell volume fraction raises the free-solution concentration above nominal by 1–2%. The tool states the assumption and its scope; it cannot verify either.',
  'A pipette out of calibration. The declared minimum and maximum are statements of intent, not measurements of capability.',
  'Precipitation or instability at any concentration in the plan, including at an intermediate the tool itself introduced.',
  'Diluent incompatibility, which is recorded and not assessed.',
  'Any error in the execution of the plan. The tool states what to combine, and in what order; it does not observe what was combined.',
];

export const HI06_SENTENCE = 'Under the diluent-volume basis a step factor close to 1 requires a transfer many times the stated volume: the transfer into a vessel is D/(f − 1), which is unbounded by the stated volume as the step factor approaches 1.';

export const INTERMEDIATE_RULE = [
  'For a step from a source at concentration cₐ — the stock, or the preceding vessel in serial mode — to a point b with factor f = cₐ/cᵦ whose direct transfer falls below the declared minimum m:',
  'Let Tᵦ(g) be the transfer into vessel b at the remaining factor f/g under the declared basis: F·g/f (final volume); D·g/(f − g) (diluent volume); Vᵦ·g/f with Vᵦ the backward-solved total of b (volume available after onward transfer). Each is increasing in g.',
  'Take the smallest g from the series {10, 100, 1000, …} with g < f such that (i) Tᵦ(g) ≥ m; (iii) where a capacity C is declared, the intermediate\'s total ≤ C; and, in serial mode, (iv) the intermediate\'s transfer from its source does not exceed the source vessel\'s total.',
  'Size the intermediate as max(g·m, the sum of every onward transfer taken from it). Its own transfer from its source is then at or above m by construction.',
  'In serial mode the intermediate sits between the source and b; the source\'s onward transfer is to the intermediate. In independent mode every point requiring the same g shares one intermediate, sized over all of them, and each such point is recorded as drawn from it.',
  'If no g satisfies these conditions the plan is rejected naming the bound that failed; a second intermediate is never chained.',
];

export const INTERMEDIATE_CONSEQUENCE = 'Published consequence of the decade series: a step whose factor does not exceed the smallest series value (f ≤ 10) has no intermediate, since the intermediate would be the point itself. Such a step is rejected under C3-HI-09, and the remedy is the stated volume, not an intermediate. The message names the bound that failed; it recommends no value.';

export function renderPageContent(config) {
  const esc = escapeHtml;
  const rows = REGISTER.map((r) => `<tr><td>${esc(r.threshold)}</td><td class="num">${esc(r.value)}</td><td>${esc(r.basis)}</td><td><span class="status ${r.status}">${esc(r.status)}</span>${r.note ? ` <span class="help-inline">(${esc(r.note)})</span>` : ''}</td></tr>`).join('');
  return `
<p>${esc(config.toolTitle)} plans the volumes to combine to reach a stated target concentration, or an ordered set of them, from a stated stock, including any single intermediate dilution a step needs to be pipettable. It plans preparation; it does not verify what was prepared. <strong>Research use. Not qualified for GxP decision-making.</strong></p>
<p>Entirely client-side: no user-entered data leaves the browser, and the page makes no request to any third party. No account. Nothing persists across a reload.</p>

<h3>Constants register</h3>
<table>
<thead><tr><th>Threshold</th><th>Value</th><th>Basis</th><th>Status</th></tr></thead>
<tbody>${rows}</tbody>
</table>
<p class="help">Statuses are derived, measured, disclosed, proposed or open. The two tolerances are open: they are being derived in a memo, and no numeric tolerance is stated on this page until it is signed.</p>

<h3>Assumption — volume additivity</h3>
<table>
<thead><tr><th>Assumption</th><th>Scope</th><th>Basis</th><th>Status</th></tr></thead>
<tbody><tr><td>Volume additivity</td><td>${esc(ADDITIVITY.scope.join('; '))}</td><td>Excess molar volume of dilute aqueous buffers &lt; 10⁻³ relative, within the achieved-concentration bound at every leading digit but the highest. Out-of-scope cases named under failure classes, item 4.</td><td><span class="status disclosed">disclosed</span></td></tr></tbody>
</table>
<p>The stated volume is a volume of solution under the final-volume and available-volume bases and a volume of diluent under the diluent-volume basis. The diluent volume the tool computes is always a volume of diluent; the final volume it computes is always a volume of solution. Every basis describes pipetted volumes: the tool does not plan volumetric preparation in which the diluent is added to a mark rather than pipetted.</p>

<h3>Intermediate selection rule</h3>
<ol>${INTERMEDIATE_RULE.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>
<p><strong>${esc(INTERMEDIATE_CONSEQUENCE)}</strong></p>

<h3>On the diluent-volume basis</h3>
<p>${esc(HI06_SENTENCE)}</p>

<h3>Failure classes this tool cannot detect</h3>
<p>The tool guarantees that the plan's arithmetic is correct, that every step is preparable within the declared bounds, and that the volume basis, route, source vessel and provenance are recorded. It cannot detect:</p>
<ol>${FAILURE_CLASSES.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>

<h3>Precision, rounding and versions</h3>
<p>Volumes are displayed to 3 significant figures; concentrations that carry information to 6. Rounding is half away from zero, applied to the exact binary value. Every reported total and remaining volume is a sum or difference of displayed values and is never rounded. The unrounded values are carried in the result object.</p>
<p>Engine <span class="num">${esc(ENGINE_VERSION)}</span> — changes whenever calculation behaviour changes. Built to URS <span class="num">${esc(URS_VERSION)}</span>. Reference viewport 1366 × 650 CSS px.</p>

<h3>Out of scope</h3>
<ul>
<li>Mass ↔ molar conversion (C1). Titration series design (C4). The direct per-point stock volume for a C4 point that is already preparable (C4). Reconstitution of a dry solute (C7). Multi-component cocktails with overage (C5).</li>
<li>Per-point stated volumes; volumetric (make-up-to-mark) preparation; plans needing more than one intermediate for a single step; mixing technique, incubation, temperature; diluent formulation or compatibility; carrier protein selection.</li>
</ul>`;
}

export function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
