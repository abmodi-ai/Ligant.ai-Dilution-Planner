# Brand conformance — C3 Dilution Planner

Against **Ligant Brand Guidelines v1.1** (June 2026), supplied 16 September 2026. Handoff §12 makes the Guidelines the source and the shipped C1 tool the reference implementation of them on a bench tool.

## Reference implementation — read from the published artifact

Handoff §12.1 directs that C3 match C1's chrome, extracting from the live tool rather than retyping. The deployed address `https://benchtools.ligant.ai/antigen-density-calculator/` is refused by this session's egress proxy (403, organization policy), so no HTTP request reaches it. C1 is, however, published as an artifact on the owner's account, and **C3's chrome is taken from that bundle**. Two things came out of it, and one did not.

**Taken: the mark's construction.** C1 draws it on a 32-unit viewBox — tile radius 7.04 (22%), the six agents on a circle of radius 9.2 at 60° from the top, agent radius 2.1, centre radius 3.6, and the table as a closed **hexagon** through the six agents, stroked at 1.7 with round joins. C3's first attempt at the mark drew the table as a **circle**; it is now C1's hexagon, from C1's constants, so the two tools carry an identical mark. C1's `tile` and plain variants are carried over too: C3 uses the tile everywhere on screen and the plain variant on the bench sheet, where an unfilled mark photocopies better than a solid tile.

**Taken: the token vocabulary.** C1 names its custom properties `--brand-teal`, `--brand-teal-pale`, `--brand-amber`, `--brand-amber-mark`, `--brand-offwhite`, `--surface`, `--surface-sunken`, `--surface-inset`, `--text-primary`, `--text-secondary`, `--text-muted`, `--border`, `--border-strong`, `--grid`, `--font`, `--mono`, plus data-viz tokens C3 has no use for (`--series-evidence`, `--series-decision`, `--band-fill`, `--magnitude-1…4`). C3's stylesheet now uses those names, so the two tools share one vocabulary rather than two spellings of one system — §06.06, the design system is infrastructure. C1's lockup markup (`.lockup` wrapping the mark and a `.wordmark` span) is carried over as well.

**Not taken: the values.** C1's bundle contains no palette hex values at all; it reads its tokens from a stylesheet that is not part of the published artifact. So every value in C3 remains the Brand Guidelines §04 value as published, and one thing is still worth checking when someone with access can open the deployed C1: whether its `--surface`, `--surface-sunken`, `--surface-inset` and `--grid` resolve to the same neutrals C3 has chosen for them, since the Guidelines publish the neutral ramp but not which neutral plays which role.

**Also worth noting.** The published C1 artifact loads Inter and IBM Plex Mono from Google Fonts. C3 self-hosts both, as the zero-third-party-request rule requires. If the deployed C1 does the same as its artifact, that is a finding against C1, not a licence for C3 — but it is not evidence about the deployed build, which this session cannot reach.

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

The register's Value column is short values in mono as an aligned column, which is what §05 sanctions; the derivation prose that had been set in mono moved to the Basis column in Inter.

## §01 What the brand is not

No gradient, glow, glass or shimmer; no mascot; no AI visual language; no emoji in the product UI. The bench sheet's flag marker was a dingbat (⚑) and is now the word **FLAG** against a rule, which also photocopies better. No retired language appears: the build carries no "investor-grade", no composite score, no "days not weeks", and does not use "confidence" anywhere, which also anticipates v2.0 removing it from teal's semantic role.

## §06 Principles, where they bite

- **Communicate, don't decorate** — border, fill and rule are spent by role: a dashed border marks an intermediate the user did not ask for, a dotted one a diluent-only control, a double rule the withheld state, an amber rule a decision.
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
