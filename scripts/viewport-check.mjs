// Acceptance 29 / C3-NF-03 at the reference viewport (1366 × 650 CSS px), full scroll range.
// Technique (as on C1/C4): set the viewport, then measure getBoundingClientRect()
// against innerHeight at each scroll position rather than comparing screenshots.
// Usage: node scripts/viewport-check.mjs [url]   (default http://localhost:5173/)
// Requires the globally installed playwright and the pre-installed Chromium.
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
const browser = await chromium.launch({ ...PW_LAUNCH, args: ['--force-device-scale-factor=1'] });
const context = await browser.newContext({ viewport: { width: 1366, height: 650 }, deviceScaleFactor: 1 });
const page = await context.newPage();
// Acceptance 22 (C3-NF-01). Every request is recorded at the context, so a
// beacon fired as the page is left is caught too, and its body is kept: the
// requirement is that no user-entered data leaves the browser, and that is only
// shown by looking at what was sent.
const requests = [];
context.on('request', (req) => requests.push({ url: req.url(), body: req.postData() || '' }));
await page.goto(url, { waitUntil: 'networkidle' });

// Fill a serial plan with an intermediate and flags so that every structural element exists.
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
// A value no page, beacon or timing figure could contain by chance. If it ever
// appears in a request, something is sending what the user typed.
const SENTINEL = 'zqx-sentinel-typed-7Q3P';
await page.fill('#stock-formulation', SENTINEL);

const info = await page.evaluate(() => ({
  ua: navigator.userAgent, innerWidth: innerWidth, innerHeight: innerHeight, dpr: devicePixelRatio,
  status: document.querySelector('.state-block') ? 'withheld/incomplete' : 'plan',
  vessels: [...document.querySelectorAll('.vessel')].length,
}));
console.log(JSON.stringify(info));

// The one third-party request the owner has allowed (24 September 2026):
// Cloudflare Web Analytics' beacon script, injected by the host. It reports to
// this origin's /cdn-cgi/rum, so its data requests are same-origin.
const ANALYTICS = [/^https:\/\/static\.cloudflareinsights\.com\/beacon\.min\.js(\/|$|\?)/];
const origin = new URL(url).origin;
const external = requests.filter((r) => !r.url.startsWith(origin));
const allowed = external.filter((r) => ANALYTICS.some((re) => re.test(r.url)));
const disallowed = external.filter((r) => !ANALYTICS.some((re) => re.test(r.url)));
console.log(`requests: ${requests.length}; to other origins: ${external.length} (${allowed.length} Cloudflare Web Analytics, ${disallowed.length} other)${disallowed.length ? ' ' + JSON.stringify(disallowed.map((r) => r.url)) : ''}`);

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

// Leave the page, so any beacon sent on pagehide is sent now and recorded.
await page.goto('about:blank').catch(() => {});
await new Promise((r) => setTimeout(r, 1500));
const leaks = requests.filter((r) => r.url.includes(SENTINEL) || r.body.includes(SENTINEL));
const rum = requests.filter((r) => r.url.startsWith(`${origin}/cdn-cgi/rum`));
console.log(`analytics reports sent: ${rum.length}; requests carrying what the user typed: ${leaks.length}${leaks.length ? ' ' + JSON.stringify(leaks.map((r) => r.url)) : ''}`);
await browser.close();
const acceptance22 = disallowed.length === 0 && leaks.length === 0;
console.log(`acceptance 22 (no user-entered data leaves; no third party but the named analytics): ${acceptance22 ? 'PASS' : 'FAIL'}`);
process.exit(violations || !acceptance22 ? 1 : 0);
