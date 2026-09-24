// The route worker in deploy/router: prefix stripping, the trailing-slash
// redirect, pass-through, and the canonical-casing redirect for the announced
// address /Dilution-Planner.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import router from '../deploy/router/src/index.js';

const BASE = 'https://benchtools.ligant.ai';

async function route(path) {
  const seen = [];
  const realFetch = globalThis.fetch;
  globalThis.fetch = async (req) => { seen.push(req); return new Response('upstream', { status: 200 }); };
  try {
    const res = await router.fetch(new Request(`${BASE}${path}`));
    return { res, upstream: seen[0] ? new URL(seen[0].url) : null };
  } finally {
    globalThis.fetch = realFetch;
  }
}

test('the announced address /Dilution-Planner redirects once to the canonical lowercase path', async () => {
  for (const [from, to] of [
    ['/Dilution-Planner', '/dilution-planner/'],
    ['/Dilution-Planner/', '/dilution-planner/'],
    ['/DILUTION-PLANNER', '/dilution-planner/'],
    ['/dilution-Planner/?x=1', '/dilution-planner/?x=1'],
  ]) {
    const { res, upstream } = await route(from);
    assert.equal(res.status, 301, from);
    assert.equal(res.headers.get('location'), `${BASE}${to}`, from);
    assert.equal(upstream, null, `${from} must not reach the upstream before redirecting`);
  }
});

test('the rest of the path keeps its casing: asset names are content hashes', async () => {
  const { res } = await route('/Dilution-Planner/assets/index-BG6HAFNj.js');
  assert.equal(res.status, 301);
  assert.equal(res.headers.get('location'), `${BASE}/dilution-planner/assets/index-BG6HAFNj.js`);
});

test('the bare canonical prefix redirects to its trailing-slash form', async () => {
  const { res } = await route('/dilution-planner?y=2');
  assert.equal(res.status, 301);
  assert.equal(res.headers.get('location'), `${BASE}/dilution-planner/?y=2`);
});

test('canonical paths are proxied to the Pages project with the prefix stripped', async () => {
  for (const [from, to] of [
    ['/dilution-planner/', '/'],
    ['/dilution-planner/assets/index-BG6HAFNj.js', '/assets/index-BG6HAFNj.js'],
    ['/dilution-planner/LICENSE', '/LICENSE'],
  ]) {
    const { res, upstream } = await route(from);
    assert.equal(res.status, 200, from);
    assert.equal(upstream.hostname, 'ligant-dilution-planner.pages.dev', from);
    assert.equal(upstream.pathname, to, from);
  }
});

test('paths that are not this tool pass through untouched', async () => {
  for (const path of ['/molarity-converter/', '/dilution-plannerx', '/']) {
    const { res, upstream } = await route(path);
    assert.equal(res.status, 200, path);
    assert.equal(upstream.hostname, 'benchtools.ligant.ai', path);
    assert.equal(upstream.pathname, path, path);
  }
});
