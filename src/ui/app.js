// UI wiring. Reads the form, calls the engine, renders from the object.
// No persistence (C3-ST-06); no network; no timers; no progress state.
import { planDilution } from '../engine/plan.js';
import { CONCENTRATION_UNITS, VOLUME_UNITS } from '../engine/units.js';

import { notebookText } from '../engine/format.js';
import { CONFIG } from '../config.js';
import { renderDeclarations, renderPlanRegion, renderDerivation } from './render.js';
import { renderBenchSheet } from './sheet.js';
import { renderPageContent } from './page-content.js';
import { parseSharedObject } from '../import/shared-import.js';
import { markDataUri } from './mark.js';
import { renderHeader, renderFooter, renderDisclaimer, renderColophon } from './chrome.js';

const $ = (id) => document.getElementById(id);

/**
 * C3-UN-01. The two concentration selectors start unselected and no plan is
 * computed until each is chosen (acceptance 31), as in C1: a wrong
 * concentration unit is a factor-of-1000 error with nothing on screen to show
 * it. Volume selectors follow the convention C4 shipped and carry µL.
 */
function fillUnits(select, units, preferred, { unselected = false } = {}) {
  select.innerHTML = '';
  if (unselected) {
    const o = document.createElement('option');
    o.value = '';
    o.textContent = '— select —';
    select.appendChild(o);
  }
  for (const u of units) {
    const o = document.createElement('option');
    o.value = u.symbol;
    o.textContent = u.symbol;
    select.appendChild(o);
  }
  select.value = unselected ? '' : preferred;
}

function val(id) {
  return $(id).value;
}

function checked(name) {
  const el = document.querySelector(`input[name="${name}"]:checked`);
  return el ? el.value : '';
}

function readInput() {
  const form = checked('target-form');
  const targetUnit = val('target-unit');
  let target;
  if (form === 'single') target = { form: 'single', value: val('target-single-value'), unit: targetUnit };
  else if (form === 'list') {
    const values = val('target-list-values').split(/[\n,;]+/).map((s) => s.trim()).filter((s) => s !== '');
    target = { form: 'list', values, unit: targetUnit };
  } else target = { form: 'top-factor-count', top: val('tfc-top'), unit: targetUnit, factor: val('tfc-factor'), count: val('tfc-count') };
  const provenance = val('target-provenance');
  const notRecorded = $('diluent-not-recorded').checked;
  return {
    stock: { value: val('stock-value'), unit: val('stock-unit') },
    stockProvenance: val('stock-provenance'),
    stockAvailable: val('stock-available-value').trim() ? { value: val('stock-available-value'), unit: val('stock-available-unit') } : null,
    stockFormulation: val('stock-formulation'),
    target,
    targetProvenance: provenance,
    targetOrigin: provenance && provenance !== 'user' ? { tool: val('target-origin-tool') || (provenance === 'c4' ? 'C4' : ''), resultId: val('target-origin-id') } : null,
    volume: { value: val('volume-value'), unit: val('volume-unit') },
    basis: checked('basis'),
    route: checked('route') || null,
    diluent: notRecorded ? { notRecorded: true } : { name: val('diluent-name') },
    minTransfer: { value: val('min-value'), unit: val('min-unit') },
    maxTransfer: val('max-value').trim() ? { value: val('max-value'), unit: val('max-unit') } : null,
    capacity: val('capacity-value').trim() ? { value: val('capacity-value'), unit: val('capacity-unit') } : null,
  };
}

function pointCount(input) {
  const t = input.target;
  if (t.form === 'single') return t.value.trim() ? 1 : 0;
  if (t.form === 'list') return t.values.length;
  const c = Number(t.count);
  return Number.isInteger(c) && c > 0 ? c : 0;
}

let lastResult = null;
let importState = null; // { mapped, applied: { field: value } } while an import is active

const IMPORT_FIELD_IDS = {
  stock: ['stock-value', 'stock-unit'], stockProvenance: ['stock-provenance'],
  target: ['target-single-value', 'target-list-values', 'target-unit'], targetProvenance: ['target-provenance'],
  volume: ['volume-value', 'volume-unit'], basis: [],
};

function applyImport(mapped) {
  const f = mapped.fields;
  if (f.stock) { $('stock-value').value = f.stock.value; $('stock-unit').value = f.stock.unit; }
  if (f.stockProvenance) $('stock-provenance').value = f.stockProvenance;
  if (f.target) {
    if (f.target.form === 'single') { document.querySelector('input[name="target-form"][value="single"]').checked = true; $('target-single-value').value = f.target.value; }
    else { document.querySelector('input[name="target-form"][value="list"]').checked = true; $('target-list-values').value = f.target.values.join('\n'); }
    $('target-unit').value = f.target.unit;
  }
  if (f.targetProvenance) $('target-provenance').value = f.targetProvenance;
  if (f.targetOrigin) { $('target-origin-tool').value = f.targetOrigin.tool; $('target-origin-id').value = f.targetOrigin.resultId; }
  if (f.volume) { $('volume-value').value = f.volume.value; $('volume-unit').value = f.volume.unit; }
  if (f.basis) document.querySelector(`input[name="basis"][value="${f.basis}"]`).checked = true;
}

function setImportLock(locked, fixed) {
  for (const field of fixed) {
    for (const id of IMPORT_FIELD_IDS[field] || []) $(id).disabled = locked;
    if (field === 'basis') for (const el of document.querySelectorAll('input[name="basis"]')) el.disabled = locked;
    if (field === 'target') for (const el of document.querySelectorAll('input[name="target-form"]')) el.disabled = locked;
  }
}

function importedSnapshot(mapped) {
  const f = mapped.fields;
  const snap = {};
  if (f.stock) snap.stock = `${f.stock.value} ${f.stock.unit}`;
  if (f.stockProvenance) snap.stockProvenance = f.stockProvenance;
  if (f.target) snap.target = f.target.form === 'single' ? `${f.target.value} ${f.target.unit}` : `${f.target.values.join(', ')} ${f.target.unit}`;
  if (f.volume) snap.volume = `${f.volume.value} ${f.volume.unit}`;
  if (f.basis) snap.basis = f.basis;
  return snap;
}

function currentSnapshot(input) {
  const t = input.target;
  return {
    stock: `${input.stock.value} ${input.stock.unit}`, stockProvenance: input.stockProvenance,
    target: t.form === 'single' ? `${t.value} ${t.unit}` : t.form === 'list' ? `${t.values.join(', ')} ${t.unit}` : `top ${t.top} ${t.unit}, factor ${t.factor}, ${t.count} points`,
    volume: `${input.volume.value} ${input.volume.unit}`, basis: input.basis,
  };
}

function syncImport() {
  const text = $('import-text').value.trim();
  const status = $('import-status');
  if (!text) {
    if (importState) { setImportLock(false, importState.mapped.fixed); importState = null; }
    $('import-override-label').hidden = true;
    status.textContent = 'Nothing is fetched; the object is read here and nowhere else. A C4 series fixes the targets, the staining volume and the final-volume basis; a C1 value fixes the stock. Every imported flag is restated on the output.';
    return;
  }
  const mapped = parseSharedObject(text);
  if (mapped.error) {
    if (importState) { setImportLock(false, importState.mapped.fixed); importState = null; }
    $('import-override-label').hidden = true;
    status.textContent = `Import not accepted: ${mapped.error}`;
    return;
  }
  if (!importState || importState.text !== text) {
    applyImport(mapped);
    importState = { text, mapped, imported: importedSnapshot(mapped) };
    $('import-override').checked = false;
  }
  const override = $('import-override').checked;
  setImportLock(!override, mapped.fixed);
  $('import-override-label').hidden = false;
  status.textContent = `Imported from ${mapped.tool}${mapped.imported.resultId ? ` (result ${mapped.imported.resultId})` : ''}: ${mapped.fixed.join(', ')} fixed by import; ${mapped.imported.flags.length} flag${mapped.imported.flags.length === 1 ? '' : 's'} carried.`;
}

function syncConditionalFields(input) {
  const form = checked('target-form');
  document.querySelector('.target-form-single').hidden = form !== 'single';
  document.querySelector('.target-form-list').hidden = form !== 'list';
  document.querySelector('.target-form-tfc').hidden = form !== 'tfc';
  const originShown = !!(input.targetProvenance && input.targetProvenance !== 'user');
  for (const el of document.querySelectorAll('.target-origin')) el.hidden = !originShown;
  const n = pointCount(input);
  const multi = n > 1;
  $('route-field').hidden = !multi;
  if (!multi) for (const el of document.querySelectorAll('input[name="route"]')) el.checked = false;
  const serialMulti = multi && checked('route') === 'serial';
  const availableRadio = document.querySelector('input[name="basis"][value="available"]');
  availableRadio.disabled = !serialMulti;
  $('basis-available-label').classList.toggle('disabled', !serialMulti);
  $('basis-available-reason').hidden = serialMulti;
  // C3-ST-07: no basis silently carried. The test is on the state at this instant,
  // which is what C3-VB-02 asks for, and it makes the outcome order-dependent: a
  // basis change processed BEFORE the route change that would make the third basis
  // available clears the selection, and the later route event enables the radio
  // without re-checking it. A user cannot produce that order — each click's handler
  // runs to completion before the next — but a script setting basis before route can
  // (owner's T7, 17 September 2026; reproduced, four orderings, real clicks safe).
  // Set the route before the basis in automation; do not defer this clear.
  if (!serialMulti && availableRadio.checked) availableRadio.checked = false;
  $('min-suggested').hidden = val('min-value').trim() !== '2' || val('min-unit') !== 'µL';
  $('diluent-name').disabled = $('diluent-not-recorded').checked;
}

function compute() {
  syncImport();
  const input = readInput();
  syncConditionalFields(input);
  const final = readInput();
  if (importState) {
    final.imported = importState.mapped.imported;
    const now = currentSnapshot(final);
    final.overrides = importState.mapped.fixed
      .filter((field) => importState.imported[field] !== undefined && now[field] !== importState.imported[field])
      .map((field) => ({ field, imported: importState.imported[field], replaced: now[field] }));
  }
  const r = planDilution(final);
  lastResult = r;
  const derivation = renderDerivation(r);
  $('declarations-content').innerHTML = renderDeclarations(r);
  $('plan-region').innerHTML = renderPlanRegion(r);
  $('derivation').innerHTML = derivation;
  $('bench-sheet').innerHTML = renderBenchSheet(r, CONFIG);
  const noPlan = r.status === 'incomplete';
  $('plan-actions').hidden = noPlan;
  $('object-panel').hidden = noPlan;
  $('derivation-panel').hidden = !derivation;
  $('object-text').textContent = noPlan ? '' : JSON.stringify(r, null, 2);
  $('notebook-text').value = noPlan ? '' : notebookText(r);
}

function init() {
  document.title = `${CONFIG.publisher} · ${CONFIG.toolTitle}`;
  // Standard chrome; the mark is drawn inline (§03) so no asset request leaves the page.
  $('site-header').innerHTML = renderHeader();
  $('site-footer').innerHTML = renderFooter();
  $('disclaimer').innerHTML = renderDisclaimer();
  $('colophon').innerHTML = renderColophon();
  $('favicon').href = markDataUri();
  $('copy-citation').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText($('citation-text').textContent);
      $('copy-citation').textContent = 'Copied';
      setTimeout(() => { $('copy-citation').textContent = 'Copy'; }, 2000);
    } catch {
      const r = document.createRange();
      r.selectNodeContents($('citation-text'));
      const sel = getSelection();
      sel.removeAllRanges();
      sel.addRange(r);
    }
  });
  $('page-content-body').innerHTML = renderPageContent(CONFIG);

  fillUnits($('stock-unit'), CONCENTRATION_UNITS, 'µg/mL', { unselected: true });
  fillUnits($('target-unit'), CONCENTRATION_UNITS, 'µg/mL', { unselected: true });
  for (const id of ['stock-available-unit', 'volume-unit', 'min-unit', 'max-unit', 'capacity-unit']) fillUnits($(id), VOLUME_UNITS, 'µL');

  const form = $('plan-form');
  form.addEventListener('input', compute);
  form.addEventListener('change', compute);
  form.addEventListener('submit', (e) => e.preventDefault());

  $('copy-notebook').addEventListener('click', async () => {
    if (!lastResult) return;
    const text = notebookText(lastResult);
    try {
      await navigator.clipboard.writeText(text);
      $('copy-notebook').textContent = 'Copied';
      setTimeout(() => { $('copy-notebook').textContent = 'Copy for notebook'; }, 2000);
      $('notebook-fallback').hidden = true;
      $('copy-status').hidden = true;
    } catch {
      // The text still has to reach the notebook, so it is shown to be copied by hand.
      $('notebook-fallback').hidden = false;
      $('copy-status').hidden = false;
      $('copy-status').textContent = 'Clipboard unavailable; the text is below.';
    }
  });
  $('print-sheet').addEventListener('click', () => window.print());
  compute();
}

window.addEventListener('error', (e) => {
  // A system error, not a reject: this is the only place the restricted red is used.
  const el = $('system-error');
  el.hidden = false;
  el.textContent = `System error: ${e.message}. The plan shown may be stale; reload the page.`;
});

init();
