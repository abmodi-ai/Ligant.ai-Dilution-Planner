# Deploying the Dilution Planner

The tool set's architecture, read from the account's shipped workers on 16 September 2026: **each tool is a Cloudflare Pages project, fronted by a small route worker on `benchtools.ligant.ai` that strips the path prefix and proxies to it.** The siblings are `ligant-molarity-converter-router`, `ligant-antigen-density-calculator-router` and `ligant-antibody-titration-planner-router`, each pointing at `ligant-<slug>.pages.dev`. This tool follows that pattern exactly; `deploy/router/src/index.js` is the same worker with this tool's prefix and upstream.

## This session could not deploy

Nothing here was deployed. Wrangler is installed and the worker builds; what remains is outside the session.

| | State |
|---|---|
| **Wrangler** | ✅ Installed and pinned as a dev dependency (4.132.0). `npm run deploy:check` bundles the router offline — 1.19 KiB, no bindings — so the config and the worker are known good |
| **Credentials** | ❌ `wrangler whoami` reports not authenticated. No `CLOUDFLARE_API_TOKEN`, no `CLOUDFLARE_ACCOUNT_ID`, no `~/.wrangler` |
| **Network** | ❌ `api.cloudflare.com` is refused by this session's egress proxy: `CONNECT tunnel failed, response 403`, an organization policy denial. `benchtools.ligant.ai` is refused the same way. The proxy's own guidance is to report a blocked host rather than route around it, so it is reported here |
| **Connector tools** | ❌ The Cloudflare connector attached here reads workers and manages D1, KV, R2 and Hyperdrive. It has no tool to upload a worker, create a Pages project, deploy to Pages, or add a route |

**To deploy from a session like this one**, both of the following would be needed: `api.cloudflare.com` allowed in the environment's network policy, and a scoped `CLOUDFLARE_API_TOKEN` (Workers Scripts: Edit, Pages: Edit, Workers Routes: Edit) set as an environment variable. Until then the commands below need a machine that has wrangler logged in to the Ligant account.

Do not use wrangler's suggested `--temporary` flag: it deploys to a throwaway preview account, not to Ligant's.

## Deploy

```bash
npm ci                         # wrangler comes with it; the tool itself has no runtime dependencies
npm test                       # 57 tests
npm run build                  # writes dist/ (index.html, assets/, _headers, LICENSE)
npm run deploy:check           # bundles the router without touching the network

wrangler login                 # or export CLOUDFLARE_API_TOKEN=...

# 1. The Pages project. The first deploy creates it; --project-name must match
#    the upstream host in the router (ligant-dilution-planner.pages.dev).
npm run deploy:pages           # wrangler pages deploy dist --project-name ligant-dilution-planner

# 2. The route worker on benchtools.ligant.ai/dilution-planner/
npm run deploy:router          # wrangler deploy --config deploy/router/wrangler.toml
```

Then register the tool wherever the set is listed — `ligant-benchtools-catalog`, and the tool navigation in each sibling's header, which currently lists three tools and will need a fourth.

## After deploying, before the tool is finished

Three acceptance items can only be satisfied at the public address, and one footer sentence is written to be removed by the first of them.

1. **Acceptance 22, no transmission.** `node scripts/viewport-check.mjs https://benchtools.ligant.ai/dilution-planner/` reports every request the page makes, with monitoring registered before page load. It must report zero to other origins. Re-run after any CDN or headers change. **Until this passes, the footer's "Not yet verified at this address" sentence stays**; it is the one claim the build cannot make for itself.
2. **Acceptance 29, the reference viewport.** The same script checks that no step of the plan is visible without its declarations and flags, across the full scroll range at 1366 × 650. Configuration is recorded in `docs/D5-browser-configuration.md`.
3. **Acceptance 28, the bench sheet.** Print it from the deployed page and check it is complete without the application open.

Also worth a pass: `npm run check:contrast` against the deployed address, and confirming the response carries the headers from `public/_headers` — in particular `frame-ancestors 'none'`, which a meta element cannot deliver.

## Headers

`public/_headers` ships with the build and is what sets the response headers on Pages. The route worker passes upstream headers through deliberately and adds no caching of its own, for the reason stated in its comment. `/LICENSE` is given an explicit `text/plain` type: it has no extension, and the footer links to it.
