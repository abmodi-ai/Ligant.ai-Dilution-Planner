// WCAG AA contrast audit (Brand Guidelines §01 "Accessible — WCAG 2.1 AA";
// handoff §12.1: run it on the plan table and the bench sheet, which are denser
// than anything in C1). Measures the rendered page, not the stylesheet.
// Usage: node scripts/contrast-audit.mjs [url]
import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
// Resolve Playwright from the project first and fall back to the global install
// the original build environment carried, so the script runs in both.
const { chromium } = (() => {
  try { return require('playwright'); } catch { return require('/opt/node22/lib/node_modules/playwright'); }
})();
// Likewise the browser: Playwright finds its own download; /opt/pw-browsers is
// the pre-installed one where it exists.
const PW_LAUNCH = existsSync('/opt/pw-browsers/chromium') ? { executablePath: '/opt/pw-browsers/chromium' } : {};

const url = process.argv[2] || 'http://localhost:5173/';
const browser = await chromium.launch(PW_LAUNCH);
const page = await browser.newPage({ viewport: { width: 1366, height: 650 } });
await page.goto(url, { waitUntil: 'networkidle' });
// A plan with every structural element: intermediate, zero point, flags, not-recorded declarations.
await page.fill('#stock-value', '1000');
// C3-UN-01: the concentration units start unselected, so the harness chooses them.
await page.selectOption('#stock-unit', 'µg/mL');
await page.selectOption('#target-unit', 'µg/mL');
await page.selectOption('#stock-provenance', 'not-recorded');
await page.check('input[name="target-form"][value="list"]');
await page.fill('#target-list-values', '10\n1\n0.1\n0');
await page.selectOption('#target-provenance', 'user');
await page.fill('#volume-value', '100');
await page.check('input[name="route"][value="serial"]');
await page.check('input[name="basis"][value="final"]');
await page.check('#diluent-not-recorded');
await page.fill('#max-value', '5');

const results = await page.evaluate(() => {
  const lum = (c) => {
    const [r, g, b] = c.map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const parse = (s) => (s.match(/[\d.]+/g) || []).slice(0, 3).map(Number);
  const alpha = (s) => { const m = s.match(/rgba?\(([^)]+)\)/); const p = m ? m[1].split(',').map(Number) : []; return p.length > 3 ? p[3] : 1; };
  const over = (fg, bg, a) => fg.map((v, i) => v * a + bg[i] * (1 - a));
  const ratio = (a, b) => { const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x); return (l1 + 0.05) / (l2 + 0.05); };
  function bgOf(el) {
    let n = el;
    while (n && n !== document.documentElement) {
      const s = getComputedStyle(n);
      if (alpha(s.backgroundColor) > 0.95) return parse(s.backgroundColor);
      n = n.parentElement;
    }
    return parse(getComputedStyle(document.documentElement).backgroundColor);
  }
  const out = [];
  const seen = new Set();
  for (const el of document.querySelectorAll('.app *, .bench-sheet *')) {
    if (!el.textContent || !el.textContent.trim()) continue;
    const direct = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
    if (!direct) continue;
    const s = getComputedStyle(el);
    if (s.display === 'none' || s.visibility === 'hidden') continue;
    const px = parseFloat(s.fontSize);
    const w = parseInt(s.fontWeight, 10);
    const large = px >= 24 || (px >= 18.66 && w >= 700);
    const bg = bgOf(el);
    const fg = over(parse(s.color), bg, alpha(s.color));
    const r = ratio(fg, bg);
    const need = large ? 3 : 4.5;
    const key = `${s.color}|${s.fontSize}|${s.fontWeight}|${bg.join(',')}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ sample: el.textContent.trim().slice(0, 34), cls: el.className && String(el.className).slice(0, 28), color: s.color, bg: `rgb(${bg.join(',')})`, px, w, ratio: +r.toFixed(2), need, pass: r >= need });
  }
  return out;
});
const fails = results.filter((r) => !r.pass);
console.log(`combinations measured: ${results.length}; failures: ${fails.length}`);
for (const f of fails) console.log(`FAIL ${f.ratio}:1 (need ${f.need}) ${f.px}px/${f.w} ${f.color} on ${f.bg} — .${f.cls} "${f.sample}"`);
const worst = results.filter((r) => r.pass).sort((a, b) => a.ratio - b.ratio).slice(0, 6);
console.log('tightest passing:');
for (const w of worst) console.log(`  ${w.ratio}:1 (need ${w.need}) ${w.px}px/${w.w} .${w.cls} "${w.sample}"`);
await browser.close();
process.exit(fails.length ? 1 : 0);
