# Deploying the Dilution Planner

The tool set's architecture, read from the account's shipped workers on 16 September 2026: **each tool is a Cloudflare Pages project, fronted by a small route worker on `benchtools.ligant.ai` that strips the path prefix and proxies to it.** The siblings are `ligant-molarity-converter-router`, `ligant-antigen-density-calculator-router` and `ligant-antibody-titration-planner-router`, each pointing at `ligant-<slug>.pages.dev`. This tool follows that pattern exactly; `deploy/router/src/index.js` is the same worker with this tool's prefix and upstream.

## Address

The canonical address is **`https://benchtools.ligant.ai/dilution-planner/`**: lowercase, like the three sibling tools, and the one the page declares as canonical, links to and puts in its citation.

The owner also announces it as **`https://benchtools.ligant.ai/Dilution-Planner`**. URL paths are case-sensitive, so the route worker redirects that address, and any other casing of the prefix, with a single 301 to the canonical one. The rest of the path keeps its casing, because asset names are content hashes. `test/router.test.js` covers the redirect and the proxying, and fails against the router without the redirect.

`wrangler.toml` carries a route for each spelling, because the redirect can only run if the request reaches the worker. The Cloudflare documentation available here does not say whether route patterns match case-sensitively. **If the deploy rejects the second route as a duplicate of the first, matching is case-insensitive: delete that line and deploy again.** The worker's redirect covers every casing either way.

## This session could not deploy

Nothing here was deployed. Re-checked on 24 September 2026, with the same result as on 16 September:

| | State |
|---|---|
| **Wrangler** | ✅ Installed and pinned as a dev dependency. `npm run deploy:check` bundles the router offline (1.45 KiB with the casing redirect, no bindings) |
| **Credentials** | ❌ No `CLOUDFLARE_API_TOKEN` in the environment; `wrangler whoami` reports not authenticated |
| **Network** | ❌ `api.cloudflare.com` and `benchtools.ligant.ai` are both refused by the environment's network policy |
| **Connector tools** | ❌ The Cloudflare connector attached here can read workers and manage D1, KV, R2 and Hyperdrive. It has no tool to upload a worker, deploy to Pages, or add a route |

**To deploy from a Claude Code cloud session**, the owner changes two things in the environment's settings (the cloud environment menu in the session's title bar, then Edit), and a new session picks them up:

1. **Network access:** allow `api.cloudflare.com`, either by a broader access level or by adding it to the allowed domains. Access levels are described at https://code.claude.com/docs/en/claude-code-on-the-web. Adding `benchtools.ligant.ai` as well lets the session verify the deployed page (acceptance 22, 28, 29) from the same place.
2. **A Cloudflare API token** under API credentials, or as the environment variable `CLOUDFLARE_API_TOKEN`, which wrangler reads. Scope it to the account that holds the other bench-tool routers, with Workers Scripts: Edit, Cloudflare Pages: Edit and Workers Routes: Edit on the `ligant.ai` zone. A token is never pasted into a chat.

Otherwise, run the commands below on any machine with wrangler logged in to the Ligant account.

Do not use wrangler's suggested `--temporary` flag: it deploys to a throwaway preview account, not to Ligant's.

## Deploy

```bash
npm ci                         # wrangler comes with it; the tool itself has no runtime dependencies
npm test                       # 80 tests, including the router's and the deploy config's
npm run build                  # writes dist/ (index.html, assets/, _headers, LICENSE)
npm run deploy:check           # bundles the router without touching the network

wrangler login                 # or export CLOUDFLARE_API_TOKEN=...

# 1. The Pages project, deployed as the live site. The script names the
#    production branch, Main, itself: left to wrangler, the branch comes from
#    the git checkout, and from any branch but Main the upload becomes a preview
#    that the live address never serves. --project-name must match the router's
#    upstream host (ligant-dilution-planner.pages.dev).
npm run deploy:pages:create    # first time only: creates the project with Main as its production branch
npm run deploy:pages           # wrangler pages deploy dist --project-name ligant-dilution-planner --branch Main

# 2. The route worker on benchtools.ligant.ai/dilution-planner/ (and /Dilution-Planner)
npm run deploy:router          # wrangler deploy --config deploy/router/wrangler.toml

# 3. Both addresses answer as intended
curl -sI https://benchtools.ligant.ai/Dilution-Planner  | grep -iE '^(HTTP|location)'   # 301 -> /dilution-planner/
curl -sI https://benchtools.ligant.ai/dilution-planner/ | grep -iE '^(HTTP|content-security-policy)'   # 200, with frame-ancestors 'none'
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
