# D5 — Browser configuration for the reference viewport (open item 11)

Reference viewport: **1366 × 650 CSS px** (C3-NF-04). This record closes the same item carried from C4 v0.5 once for both tools, for the *local* build; the deployed re-verification (acceptance 29) uses the identical configuration against the public address once the slug is assigned.

| Setting | Value |
|---|---|
| Browser | Chromium, Playwright build `chromium-1194`, reports `HeadlessChrome/141.0.0.0` |
| Executable | `/opt/pw-browsers/chromium` (pre-installed; no download) |
| Driver | Playwright (global install, `/opt/node22/lib/node_modules/playwright`) |
| Mode | headless, new context, no extensions, no stored state |
| Viewport | `{ width: 1366, height: 650 }` CSS px; `innerWidth`/`innerHeight` confirmed 1366/650 at run time |
| Device scale factor | 1 (`--force-device-scale-factor=1`; `devicePixelRatio` confirmed 1) |
| Zoom | 100% (no page zoom applied) |
| Media | screen |
| Network monitoring | `page.on('request')` registered before `page.goto`, i.e. before page load |
| Command | `node scripts/viewport-check.mjs http://localhost:5173/` |

**Technique** (as on C1/C4): resize the window, then at every scroll position from 0 to the full scroll height in 50 px steps, measure `getBoundingClientRect()` of each step's header row against `innerHeight`; wherever a step header is fully visible, require the sticky declarations bar and that step's flag chips (which sit on the header row) to be fully visible too. Screenshots are taken for the record but are not the check.

**Result on the local build, 15 September 2026** (serial plan with an intermediate, a zero point, a not-recorded provenance and diluent, and a declared maximum, so that every structural element exists):

```
{"ua":"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/141.0.0.0 Safari/537.36","innerWidth":1366,"innerHeight":650,"dpr":1,"status":"plan","vessels":6}
requests: 17; to other origins: 0
scroll range 0..3497; step visibility violations: 0
```

The seventeen requests are the page, stylesheet, module scripts and the six self-hosted font files, all same-origin. This satisfies the *shape* of acceptance 22 and 29; neither is satisfied until the run is repeated against `https://benchtools.ligant.ai/<slug>/` after deployment, and again after any CDN change.

## Interim re-run, 17 September 2026 (local, second machine, second technique)

After the suite-alignment restyle and the removal of the constants register, the check was repeated on the machine where those changes were made. Playwright is **not** installed there (`/opt/node22` and `/opt/pw-browsers` do not exist), so `scripts/viewport-check.mjs` could not run; its logic was reimplemented over the Chrome DevTools Protocol and driven against the same filled plan.

| Setting | Value |
|---|---|
| Browser | Google Chrome 152.0.7977.84, `--headless=new` |
| Driver | Chrome DevTools Protocol directly (no Playwright available) |
| Host | macOS, Darwin 25.6.0 |
| Viewport | `Emulation.setDeviceMetricsOverride` 1366 × 650 CSS px, confirmed at run time |
| Device scale factor | 1 |
| Media | screen (print rendering checked separately with `Emulation.setEmulatedMedia`) |
| Plan under test | the same one the script fills: stock 1000, serial [10, 1, 0.1, 0], 100 µL final, maximum 5 µL, provenance and diluent not recorded |

```
scroll range 0..4699; vessel-head observations 62; violations 0
```

This is an interim record for the restyle, not a replacement for the row above and not the deployed run. Acceptance 29 still needs `scripts/viewport-check.mjs` against the public address on a machine with the Playwright configuration recorded above.
