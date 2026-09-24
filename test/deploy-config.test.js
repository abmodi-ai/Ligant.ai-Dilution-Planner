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
