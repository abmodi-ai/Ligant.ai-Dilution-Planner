// The deploy scripts and the route worker must agree, or a deploy can succeed
// and still not change the live site.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const scripts = JSON.parse(readFileSync(new URL('../package.json', import.meta.url))).scripts;
const router = readFileSync(new URL('../deploy/router/src/index.js', import.meta.url), 'utf8');
const flag = (cmd, name) => cmd.match(new RegExp(`--${name}[ =](\\S+)`))?.[1] ?? null;

test('deploy:pages always targets the production branch, whatever is checked out', () => {
  // Without --branch, wrangler takes the branch from git, and any branch but the
  // production one becomes a preview deployment the live address never serves.
  assert.equal(flag(scripts['deploy:pages'], 'branch'), 'Main');
});

test('the Pages project is created with the same production branch deploy:pages targets', () => {
  assert.equal(flag(scripts['deploy:pages:create'], 'production-branch'), flag(scripts['deploy:pages'], 'branch'));
  const created = scripts['deploy:pages:create'].match(/pages project create (\S+)/)?.[1];
  assert.equal(created, flag(scripts['deploy:pages'], 'project-name'));
});

test('the router proxies to the Pages project the script deploys', () => {
  const upstream = router.match(/UPSTREAM_HOST\s*=\s*'([^']+)'/)?.[1];
  assert.equal(upstream, `${flag(scripts['deploy:pages'], 'project-name')}.pages.dev`);
});

// ---------------------------------------------------------------------------
// The content security policy, which the page carries twice: in a <meta> for
// any static host, and in public/_headers for Pages, which alone can deliver
// frame-ancestors. A browser enforces both, so a source missing from either is
// blocked — the two have to agree.
// ---------------------------------------------------------------------------
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const headers = readFileSync(new URL('../public/_headers', import.meta.url), 'utf8');
const parse = (policy) => Object.fromEntries(policy.split(';').map((d) => d.trim()).filter(Boolean)
  .map((d) => { const [name, ...values] = d.split(/\s+/); return [name, values]; }));
const metaCsp = parse(html.match(/http-equiv="Content-Security-Policy" content="([^"]+)"/)[1]);
const headerCsp = parse(headers.match(/Content-Security-Policy: (.+)/)[1]);

test('the meta CSP and the header CSP agree, directive by directive', () => {
  const { 'frame-ancestors': fa, ...headerRest } = headerCsp;
  assert.deepEqual(fa, ["'none'"], 'frame-ancestors is delivered by the header, as a meta element cannot');
  assert.deepEqual(metaCsp, headerRest);
});

test('the only third party allowed is Cloudflare Web Analytics, and only its beacon', () => {
  // Owner's decision, 24 September 2026. The beacon's script comes from
  // static.cloudflareinsights.com — injected with a versioned path, so the
  // trailing-slash form is the one that matches it — and it reports to this
  // origin's /cdn-cgi/rum. Nothing else leaves 'self'.
  const thirdParty = [];
  for (const [directive, values] of Object.entries(headerCsp)) {
    for (const v of values) if (/^https?:/.test(v)) thirdParty.push(`${directive} ${v}`);
  }
  assert.deepEqual(thirdParty.sort(), [
    'connect-src https://benchtools.ligant.ai/cdn-cgi/rum',
    'script-src https://static.cloudflareinsights.com/beacon.min.js',
    'script-src https://static.cloudflareinsights.com/beacon.min.js/',
  ]);
  // The rest stays as strict as it was.
  assert.deepEqual(headerCsp['default-src'], ["'self'"]);
  assert.deepEqual(headerCsp['style-src'], ["'self'"]);
  assert.deepEqual(headerCsp['font-src'], ["'self'"]);
  assert.deepEqual(headerCsp['object-src'], ["'none'"]);
  assert.deepEqual(headerCsp['form-action'], ["'none'"]);
  assert.ok(!headerCsp['script-src'].includes("'unsafe-inline'") && !headerCsp['script-src'].includes("'unsafe-eval'"));
  // connect-src is the one exact path, not 'self': the page makes no request of
  // its own, and this keeps it that way.
  assert.ok(!headerCsp['connect-src'].includes("'self'"));
});
