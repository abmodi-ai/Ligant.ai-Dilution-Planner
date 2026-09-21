// Acceptance 24 (storage) and acceptance 31 (concentration units unselected on
// load), both of which the specification puts in a real browser rather than in
// the node suite. URS v0.4.2, decisions D and H1.
//
// Usage: node scripts/browser-checks.mjs [url]   (default http://localhost:5173/)
import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = (() => {
  try { return require('playwright'); } catch { return require('/opt/node22/lib/node_modules/playwright'); }
})();
const PW_LAUNCH = existsSync('/opt/pw-browsers/chromium') ? { executablePath: '/opt/pw-browsers/chromium' } : {};

const url = process.argv[2] || 'http://localhost:5173/';
const FOREIGN_KEY = 'zz.another-tool.state';
const FOREIGN_VALUE = 'written by a sibling tool on the shared origin';

const browser = await chromium.launch(PW_LAUNCH);
const context = await browser.newContext({ viewport: { width: 1366, height: 650 } });
const page = await context.newPage();
let failures = 0;
const check = (ok, label, detail = '') => {
  if (!ok) failures += 1;
  console.log(`${ok ? 'pass' : 'FAIL'}  ${label}${detail ? ` — ${detail}` : ''}`);
};

// C3-ST-06 is "neither read nor write", so reading is instrumented rather than
// inferred from what survives: a real getItem on this origin is recorded.
await context.addInitScript(() => {
  window.__storageReads = [];
  for (const store of ['localStorage', 'sessionStorage']) {
    const target = window[store];
    const realGet = target.getItem.bind(target);
    // Non-enumerable, or the instrumentation itself would show up as a stored key.
    Object.defineProperty(target, 'getItem', {
      configurable: true,
      enumerable: false,
      value: (k) => { window.__storageReads.push(`${store}.getItem(${k})`); return realGet(k); },
    });
  }
});

await page.goto(url, { waitUntil: 'networkidle' });

// ---- acceptance 31: the concentration units start unselected ---------------
const units = await page.evaluate(() => ({
  stock: document.getElementById('stock-unit').value,
  target: document.getElementById('target-unit').value,
  volume: document.getElementById('volume-unit').value,
}));
check(units.stock === '' && units.target === '', 'acceptance 31: stock and target concentration units unselected on load',
  `stock "${units.stock}", target "${units.target}"`);
check(units.volume !== '', 'acceptance 31: volume units follow the convention C4 shipped', `volume "${units.volume}"`);

// Everything but the units, so that the units are the only thing withheld.
await page.fill('#stock-value', '1000');
await page.selectOption('#stock-provenance', 'not-recorded');
await page.fill('#target-single-value', '10');
await page.selectOption('#target-provenance', 'user');
await page.fill('#volume-value', '100');
await page.check('input[name="basis"][value="final"]');
await page.check('#diluent-not-recorded');
const beforeUnits = await page.evaluate(() => ({
  vessels: document.querySelectorAll('.vessel').length,
  incomplete: document.body.textContent.includes('a unit must be selected'),
}));
check(beforeUnits.vessels === 0 && beforeUnits.incomplete,
  'acceptance 31: no plan is computed until both units are chosen',
  `${beforeUnits.vessels} vessels, message shown: ${beforeUnits.incomplete}`);

await page.selectOption('#stock-unit', 'µg/mL');
await page.selectOption('#target-unit', 'µg/mL');
const afterUnits = await page.evaluate(() => document.querySelectorAll('.vessel').length);
check(afterUnits > 0, 'acceptance 31: the plan computes once both are chosen', `${afterUnits} vessels`);

// ---- acceptance 24: neither read nor written -------------------------------
await page.evaluate(([k, v]) => {
  localStorage.clear();
  sessionStorage.clear();
  localStorage.setItem(k, v);
  window.__storageReads = [];
}, [FOREIGN_KEY, FOREIGN_VALUE]);

// A full session: every declaration, a serial plan with an intermediate and a
// zero point, the basis and route changed, the object opened, then a reload.
await page.check('input[name="target-form"][value="list"]');
await page.fill('#target-list-values', '10\n1\n0.1\n0');
await page.check('input[name="route"][value="serial"]');
await page.fill('#max-value', '5');
await page.fill('#capacity-value', '500');
await page.fill('#stock-available-value', '50');
await page.fill('#stock-formulation', 'PBS, 50% glycerol');
await page.check('input[name="basis"][value="diluent"]');
await page.check('input[name="basis"][value="final"]');
await page.check('input[name="route"][value="independent"]');
await page.check('input[name="route"][value="serial"]');
await page.click('#object-panel summary').catch(() => {});
await page.reload({ waitUntil: 'networkidle' });

const after = await page.evaluate(([k]) => ({
  local: Object.fromEntries(Object.entries(localStorage)),
  sessionKeys: Object.keys(sessionStorage),
  reads: window.__storageReads || [],
  stockAfterReload: document.getElementById('stock-value').value,
  foreign: localStorage.getItem(k),
}), [FOREIGN_KEY]);

const keys = Object.keys(after.local);
check(keys.length === 1 && keys[0] === FOREIGN_KEY, 'acceptance 24: only the seeded key remains in local storage', keys.join(', ') || '(empty)');
check(after.foreign === FOREIGN_VALUE, 'acceptance 24: the seeded key is unchanged');
check(after.sessionKeys.length === 0, 'acceptance 24: session storage is empty', after.sessionKeys.join(', ') || '(empty)');
// The reload's own read of the seeded key by the harness is the only one allowed.
const c3Reads = after.reads.filter((r) => !r.includes(FOREIGN_KEY));
check(c3Reads.length === 0, 'acceptance 24: C3 read nothing from origin storage', c3Reads.join(', ') || '(no reads)');
check(after.stockAfterReload === '', 'C3-ST-06: nothing is restored after a reload', `stock field "${after.stockAfterReload}"`);

await browser.close();
console.log(failures ? `\n${failures} check(s) failed` : '\nall browser acceptance checks passed');
process.exit(failures ? 1 : 0);
