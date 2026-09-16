// Acceptance 29 / C3-NF-03 at the reference viewport (1366 × 650 CSS px), full scroll range.
// Technique (as on C1/C4): set the viewport, then measure getBoundingClientRect()
// against innerHeight at each scroll position rather than comparing screenshots.
// Usage: node scripts/viewport-check.mjs [url]   (default http://localhost:5173/)
// Requires the globally installed playwright and the pre-installed Chromium.
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('/opt/node22/lib/node_modules/playwright');

const url = process.argv[2] || 'http://localhost:5173/';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--force-device-scale-factor=1'] });
const context = await browser.newContext({ viewport: { width: 1366, height: 650 }, deviceScaleFactor: 1 });
const page = await context.newPage();
const requests = [];
page.on('request', (req) => requests.push(req.url()));
await page.goto(url, { waitUntil: 'networkidle' });

// Fill a serial plan with an intermediate and flags so that every structural element exists.
await page.fill('#stock-value', '1000');
await page.selectOption('#stock-provenance', 'not-recorded');
await page.check('input[name="target-form"][value="list"]');
await page.fill('#target-list-values', '10\n1\n0.1\n0');
await page.selectOption('#target-provenance', 'user');
await page.fill('#volume-value', '100');
await page.check('input[name="route"][value="serial"]');
await page.check('input[name="basis"][value="final"]');
await page.check('#diluent-not-recorded');
await page.fill('#max-value', '5');

const info = await page.evaluate(() => ({
  ua: navigator.userAgent, innerWidth: innerWidth, innerHeight: innerHeight, dpr: devicePixelRatio,
  status: document.querySelector('.state-block') ? 'withheld/incomplete' : 'plan',
  vessels: [...document.querySelectorAll('.vessel')].length,
}));
console.log(JSON.stringify(info));

const external = requests.filter((u) => !u.startsWith(new URL(url).origin));
console.log(`requests: ${requests.length}; to other origins: ${external.length}${external.length ? ' ' + JSON.stringify(external) : ''}`);

const scrollMax = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
let violations = 0;
for (let y = 0; y <= scrollMax + 50; y += 50) {
  await page.evaluate((yy) => scrollTo(0, yy), y);
  const res = await page.evaluate(() => {
    const H = innerHeight;
    const decl = document.getElementById('declarations-bar').getBoundingClientRect();
    const declVisible = decl.top >= 0 && decl.bottom <= H && decl.height > 0;
    const out = [];
    for (const v of document.querySelectorAll('.vessel[data-step="1"]')) {
      const head = v.querySelector('.vessel-head').getBoundingClientRect();
      const headVisible = head.top >= 0 && head.bottom <= H;
      if (!headVisible) continue;
      const flags = v.querySelector('.flags').getBoundingClientRect();
      const flagsVisible = flags.top >= 0 && flags.bottom <= H;
      out.push({ label: v.dataset.label, declVisible, flagsVisible });
    }
    return out;
  });
  for (const r of res) if (!r.declVisible || !r.flagsVisible) { violations++; console.log(`violation at scroll ${y}: ${JSON.stringify(r)}`); }
}
console.log(`scroll range 0..${scrollMax}; step visibility violations: ${violations}`);
await page.screenshot({ path: 'scripts/out/viewport-1366x650.png' }).catch(() => {});
await browser.close();
process.exit(violations ? 1 : 0);
