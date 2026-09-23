# Brand conformance — C3 Dilution Planner

Against **Ligant Brand Guidelines v1.1** (June 2026), supplied 16 September 2026. Handoff §12 makes the Guidelines the source and the shipped C1 tool the reference implementation of them on a bench tool.

## Reference implementation — read from the published artifact

Handoff §12.1 directs that C3 match C1's chrome, extracting from the live tool rather than retyping. The deployed address `https://benchtools.ligant.ai/antigen-density-calculator/` is refused by this session's egress proxy (403, organization policy), so no HTTP request reaches it. C1 is, however, published as an artifact on the owner's account, and **C3's chrome is taken from that bundle**. Two things came out of it, and one did not.

**Taken: the mark's construction.** C1 draws it on a 32-unit viewBox — tile radius 7.04 (22%), the six agents on a circle of radius 9.2 at 60° from the top, agent radius 2.1, centre radius 3.6, and the table as a closed **hexagon** through the six agents, stroked at 1.7 with round joins. C3's first attempt at the mark drew the table as a **circle**; it is now C1's hexagon, from C1's constants, so the two tools carry an identical mark. C1's `tile` and plain variants are carried over too: C3 uses the tile everywhere on screen and the plain variant on the bench sheet, where an unfilled mark photocopies better than a solid tile.

**Taken: the token vocabulary.** C1 names its custom properties `--brand-teal`, `--brand-teal-pale`, `--brand-amber`, `--brand-amber-mark`, `--brand-offwhite`, `--surface`, `--surface-sunken`, `--surface-inset`, `--text-primary`, `--text-secondary`, `--text-muted`, `--border`, `--border-strong`, `--grid`, `--font`, `--mono`, plus data-viz tokens C3 has no use for (`--series-evidence`, `--series-decision`, `--band-fill`, `--magnitude-1…4`). C3's stylesheet now uses those names, so the two tools share one vocabulary rather than two spellings of one system — §06.06, the design system is infrastructure. C1's lockup markup (`.lockup` wrapping the mark and a `.wordmark` span) is carried over as well.

**Not taken: the values.** C1's bundle contains no palette hex values at all; it reads its tokens from a stylesheet that is not part of the published artifact. So every value in C3 remains the Brand Guidelines §04 value as published, and one thing is still worth checking when someone with access can open the deployed C1: whether its `--surface`, `--surface-sunken`, `--surface-inset` and `--grid` resolve to the same neutrals C3 has chosen for them, since the Guidelines publish the neutral ramp but not which neutral plays which role.

**Also worth noting.** The published C1 artifact loads Inter and IBM Plex Mono from Google Fonts. C3 self-hosts both, as the zero-third-party-request rule requires. If the deployed C1 does the same as its artifact, that is a finding against C1, not a licence for C3 — but it is not evidence about the deployed build, which this session cannot reach.

## Chrome — standard across the tool set

The first pass invented a navy masthead bar. The shipped tools have no bar: the page ground runs from the top, and the chrome is the same on every tool. Corrected against screenshots of the Antigen Density Calculator, the Molarity Converter and the Antibody Titration Planner supplied by the owner on 16 September 2026, and now built as one module (`src/ui/chrome.js`) whose only per-tool inputs are the strings in `src/config.js`.

**Header.** Lockup top left, **linking to `https://ligant.ai/`** as the siblings' does. Tool navigation top right, the current tool as a teal pill on white with a hairline border, the others as muted links that take the inset ground on hover. **"Bench Tools"** in letter-spaced caps beneath the navigation, right-aligned, and a **link to the catalog** — the siblings' casing and behaviour, corrected 17 September 2026. The tool name as a **25 px** navy H1 (the siblings' size; it was 30 px), then **one** paragraph constrained to about 62 characters — the tagline, as C4's masthead takes a single paragraph; the standfirst moved into the method panel on 21 September — then a hairline rule.

**Footer.** Two columns. The left carries, in the house order: what happens to the user's data; no account and no tracking; that visits are counted by the host; the repository with `npm run dev`; the standalone-calculators paragraph with the enterprise contact; the open-source line; the **How to cite** block behind an amber rule with a Copy button; and the Apache 2.0 licence paragraph. The right carries the entity block: Ligant AI Incorporated, the Philadelphia address, and the contact address. The **How to cite** block sits on the sunken ground behind a neutral rule with a Copy button, and the licence paragraph is separated by a hairline — both as the siblings set them (corrected 17 September 2026; the cite block had carried an amber rule, which spends the decision colour on a citation). Below the footer, the research-use callout as `.disclaimer` behind an amber rule, then the `.colophon`: the 16 px mark and `Ligant · Dilution Planner v0.3.0`.

Two places where C3's footer says something the shipped tools do not, because C3 cannot yet make their claim:

- The no-transmission paragraph carries the Molarity Converter's **"Not yet verified at this address"** caveat, since acceptance 22 is unrun until the tool is deployed. Removing that caveat is part of deploying, not part of the build.
- The citation carries **no DOI**. One is minted at release; a placeholder identifier would read as a record that does not exist. The note in the block says so, in place of the shipped tools' explanation that the identifier is text rather than a link so that citing does not disclose a visit.

**In the cards.** Numbered teal step badges on each declaration group, and the amber "suggested, not chosen" dot on the one pre-filled value, both as the shipped tools present them.

One regression caught by the checks and fixed: rounding the results panel with `overflow: hidden` silently disabled `position: sticky` on the declarations bar, so steps became readable without the declarations they were computed under — 49 violations of C3-NF-03 at the reference viewport. **Restated 21 September 2026:** the panels now carry C4's `overflow: hidden`, which is what rounds a panel's contents to its corners, and the one panel holding a sticky child is exempted by `.panel-series { overflow: visible }` — C4's own arrangement for the same collision. Re-measured after the change: 0 violations, 62 vessel-head observations over the full scroll range. The rule is worth stating plainly, because it fails silently: **a clipping ancestor anywhere above the declarations line disables it, and nothing on screen says so until someone scrolls.**

## §02 Naming

The brand is **Ligant**, one word, capital L. "Ligant.ai" appears nowhere in prose, the wordmark or the UI. The string appears only as a URL, in the repository link (`src/config.js`), which §02 permits as a web address. The page title, masthead, footer and citation all read "Ligant".

## §03 Logo & wordmark — new in this change

The mark was absent before; C3 showed the name as text. It is now drawn as inline SVG (`src/ui/mark.js`) from C1's construction, which is the only form that satisfies the zero-third-party-request rule an asset CDN would break.

| Rule | How it is met |
|---|---|
| Anatomy: the table, six dots = the agents, amber centre = the human who decides | `markSvg()` draws C1's construction: the table as a closed hexagon through six agents at 60° from the top, and the centre |
| Horizontal lockup (mark + "Ligant") is the default for headers | Masthead; footer |
| Mark alone for favicons | `markDataUri()` sets the page favicon; no file request |
| Tile corner radius 22% | `rx="7.04"` on C1's 32-unit tile |
| Minimum sizes: 16 px favicon, 24 px UI, 120 px lockup | Masthead mark 30 px, footer 22 px with the name beside it, sheet 30 px; the lockup is ~110 px of wordmark plus the mark, over the 120 px minimum |
| Clear space ≥ ¼ of the mark's width | Masthead gap 12 px against a 30 px mark (0.4×) |
| Approved grounds: green primary, navy, off-white | The tile is teal on the navy masthead, on the off-white footer, and on the white sheet |
| Never recolour the tile, rotate, stretch, change the centre, add ".ai" | One construction, emitted from one function, with C1's constants not re-derived; no transform, no per-context colour |
| The centre uses the brightened gold #E0A416 | `GOLD` in `mark.js`; the single sanctioned brightening, used nowhere else |

## §04 Colour

Every colour in `styles.css` is a published §04 value: the four brand colours, the six neutrals, the mark's brightened gold, and #C0392B. Three off-palette values were removed (`#D9D2C5`, `#B9B0A0`, `#F6ECD2`); §08 grants no off-palette colour. The token *names* are C1's, as above.

| Role | Value | Where |
|---|---|---|
| Navy, authority and chrome | `#1B2A4A` | masthead, headings, data values, vessel labels |
| Teal, evidence-positive and data | `#0D7C66` | links, focus ring, primary button, derived/disclosed statuses |
| Amber, the human decision moment | `#B8860B` | the rule on every flag, the flag chip, the lede rule, the proposed status |
| Off-white ground | `#FAF7F2` | page |
| Slate body / subtle captions / subtle-light rules | `#4F4943` / `#6B6357` / `#8B8678` | body text, help text, borders |
| Red, **system error only** | `#C0392B` | the runtime-error banner, and nothing else |

Two semantic rules are load-bearing here and are met:

- **A §7 reject is not a system error and is not red.** It is the *withheld* state: no plan is shown, the reason occupies the plan's position, marked by a double rule. Nothing about it is coloured red.
- **Amber encodes the human decision moment**, so it marks flags — as a rule, not a fill. The invented amber tint is gone; a flag is now an amber rule on the sanctioned warm neutral. Flagged and withheld remain distinguished structurally (a rule and an attached list, against a double-ruled block in the plan's position), never by colour alone.

**Amber is never type.** At 11 px on off-white it measures 3.05:1, and the §04 accessibility table does not list it as a text colour. The one place it had become type (the "proposed" status) now takes navy text with an amber rule. This was caught by the audit below, not by eye.

## §05 Typography

Inter for all running text and UI; IBM Plex Mono for digits, units, identifiers, vessel labels, reason codes and aligned columns. **Weight contrast is 700 against 400** as the Guidelines require; weight 500 has been removed from the build, and Inter Bold and IBM Plex Mono Bold are now self-hosted (Medium is dropped). 600 appears only where the specimen sanctions it: H3-level headings and the letter-spaced uppercase eyebrow.

The eyebrow is now a real device in the system: fieldset legends, the declaration labels in the sticky bar, table headers and the masthead meta line. It is deliberately **not** applied to the per-vessel data keys — uppercasing them turns the defined symbol ρ into a Latin-looking Ρ, and §06.07 makes scientific accuracy a design constraint.

~~The register's Value column is short values in mono as an aligned column, which is what §05 sanctions; the derivation prose that had been set in mono moved to the Basis column in Inter.~~ **Superseded 17 September 2026:** the constants register is off the page on the owner's instruction (`docs/decisions.md` D-15), so this typographic setting no longer appears anywhere in the build. The shipped C4 still carries the pattern (`.register-table` in its stylesheet), so the tool set and C3 differ here by decision, not by drift.

## §01 What the brand is not

No gradient, glow, glass or shimmer; no mascot; no AI visual language; no emoji in the product UI. The bench sheet's flag marker was a dingbat (⚑) and is now the word **FLAG** against a rule, which also photocopies better. No retired language appears: the build carries no "investor-grade", no composite score, no "days not weeks", and does not use "confidence" anywhere, which also anticipates v2.0 removing it from teal's semantic role.

## §06 Principles, where they bite

- **Communicate, don't decorate** — border, fill and rule are spent by role: a dashed border marks an intermediate the user did not ask for, a dotted one a diluent-only control, a double rule the withheld state, an amber rule a decision. **Changed 17 September 2026:** a flag now carries the amber rule *and* the attention wash (`--attention-wash`, amber at 10%), which reverses this build's earlier reading that a flag is "marked by the rule, not by a fill". The reason is consistency, not decoration: the shipped C4 and C1 both set `.flag` as rule-plus-wash, and a flag chip on a dense vessel card is easy to miss as a 3 px rule alone. The wash is the only fill added; withheld, intermediate and zero-point states remain structural.
- **Design for the moment of bad news first** — the withheld state is designed first and fully: the reason sits where the plan would have been, names the quantities and the physical reason, and is never a greyed-out or struck-through plan.
- **Epistemic neutrality** — the achieved concentration, its bound and the closure residual sit in the same visual register as the target; nothing is styled to look more certain than it is.
- **Scientific accuracy is a design constraint** — see ρ above.

## Accessibility — WCAG 2.1 AA

`npm run check:contrast` measures the rendered page (computed colours, real font sizes, resolved backgrounds), on the plan table and the bench sheet, which are denser than anything in C1.

| Run | Result |
|---|---|
| 16 September 2026, serial plan with an intermediate, a zero point, flags and not-recorded declarations | **40 colour/size combinations, 0 failures.** Tightest passing: 4.8:1 against a 4.5 requirement (button label, the "derived" status, the footer link) |

One failure was found and fixed on the first run: amber at 11 px, 3.05:1.

## Still open

- The masthead and panel chrome vertical cost is a tool-set question routed to ZURI (C4 open item 17); C3's is compact and local until that answer lands.
- The plan table, the printable bench sheet, the intermediate presentation and the "load worked example" state are the four elements C3 needs that C1 does not have (handoff §12.2). Three are built to the constraints listed there; "load worked example" is **not** built, per the instruction to ship without it rather than invent a pattern.
- Brand Guidelines v2.0 is in progress. This build is to v1.1 as published; nothing here depends on the §01 rewrite or on teal's "confidence" role, which the build never used.

## Suite alignment — 17 September 2026

The chrome was built in this repository from screenshots and from C1's published artifact, and had drifted from the tools as deployed. It was re-read from the **Antibody Titration Planner** and the **Antigen Density Calculator** as served (their CSS and JS bundles, fetched and diffed against this build) and brought back into line. What moved:

| Item | Was | Now |
|---|---|---|
| Design tokens | A partial copy inlined in `styles.css`, `--radius: 3px`, no `--radius-sm`, no washes, no neutral ramp names | `src/tokens.css`, the suite's `:root` block copied whole from `benchtools.ligant.ai/tokens.css` and byte-identical to it; C3's own `--tile-radius` stays in `styles.css` |
| Page wrapper | Four elements each with their own max-width and padding | One `.app` wrapper, 1400 px, 24 px inset, as the siblings |
| Class vocabulary | `.site-header`, `.footer-org`, `.cite*`, `.licence`, `.scope-callout`, `.footer-bar`, `.tool-nav-item` | `.masthead`, `.footer-address`, `.footer-citation*`, `.footer-licence`, `.disclaimer`, `.colophon`, `.tool-nav a` / `[aria-current]` |
| Type scale | H1 30 px, eyebrow 10.5 px at 0.07em, body line-height 1.45 | H1 25 px, eyebrow 11 px at 0.14em, body 1.55 — the siblings' values |
| Controls | Every button teal-filled at weight 700; inputs 3 px radius, 5/7 px padding | Default button white with a border (teal reserved for `.primary`); inputs 6 px radius, 7/9 px padding; teal `accent-color` on radios and checkboxes, which had been the browser's blue — an off-palette colour §08 does not grant |
| Favicon | Table stroke 2.2, agents r 2.4, centre r 3.8 | Stroke 2, agents r 2.1, centre r 3.6 — the geometry in the siblings' shipped `favicon.svg`, drawn from the same constants. Still an inline data URI: no icon request |
| Head | Title "Dilution Planner"; no description, canonical, color-scheme, theme-color or social tags | "Ligant · Dilution Planner" plus the siblings' metadata set. No `og:image`: there is no card image for this tool yet, so the summary card is used rather than a link to a file that does not exist |
| Fonts | Six faces: Inter 400/600/700 and IBM Plex Mono 400/600/**700** | Five, as C4 loads: the mono Bold is gone, and the one rule that asked for it (the register status) is 600. The files themselves stay wider than C4's latin subsets — see `fonts/README.md` |
| Skip link | Absent | `.skip-link` to `#main`, as C4 and C1 carry |

Deliberately **not** matched: C4's footer prose, which is newer than C1's and the Molarity Converter's — C3 keeps the wording those two still ship — and C3's "Not yet verified at this address" caveat, which C4 does not need because its acceptance 22 has passed. The meta CSP also stays stricter than the deployed siblings' (`connect-src 'none'`).

**The contrast gate has not been run against this restyle.** `npm run check:contrast` needs Playwright at `/opt/node22`, absent on the machine the work was done on. Every value used is a published §04 value already shipped by tools that passed their own audits, and the one new text colour pairing (muted navigation links on the off-white ground) computes at about 5.5:1, but the gate is unrun and is listed in the conformance audit addendum.
