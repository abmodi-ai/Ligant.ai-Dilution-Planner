# Brand conformance — C3 Dilution Planner

Against **Ligant Brand Guidelines v1.1** (June 2026), supplied 16 September 2026. Handoff §12 makes the Guidelines the source and the shipped C1 tool the reference implementation of them on a bench tool.

## Reference implementation not reachable

Handoff §12.1 directs that palette tokens be extracted from the live C1 tool with `getComputedStyle` rather than retyped. **The live tool could not be reached from this environment**: `https://benchtools.ligant.ai/antigen-density-calculator/` is refused by the session's egress proxy with a 403 (organization policy), so no request reaches the host. C3's chrome is therefore built from the Guidelines' published values directly, which is the source the handoff names first. Two consequences to check when someone with access can open C1 side by side:

1. **Token values** here are the §04 hex values as published. If C1 carries a token the Guidelines do not publish (a panel surface, a focus ring, a disabled state), C3 has chosen its own from the same palette and may differ.
2. **Chrome proportions** — masthead height, panel padding, the vertical cost of the header — are C3's. The masthead/chrome question was already routed to ZURI as a tool-set question (C4 open item 17); C3's is deliberately compact (a 30 px mark, one line) so that the answer, when it lands, can replace it in one place.

## §02 Naming

The brand is **Ligant**, one word, capital L. "Ligant.ai" appears nowhere in prose, the wordmark or the UI. The string appears only as a URL, in the repository link (`src/config.js`), which §02 permits as a web address. The page title, masthead, footer and citation all read "Ligant".

## §03 Logo & wordmark — new in this change

The mark was absent before; C3 showed the name as text. It is now drawn as inline SVG (`src/ui/mark.js`), which is the only form that satisfies the zero-third-party-request rule an asset CDN would break.

| Rule | How it is met |
|---|---|
| Anatomy: ring = the table, six dots = the agents, amber centre = the human who decides | `markSvg()` draws exactly that: one ring, six dots at 60° from the top, one centre |
| Horizontal lockup (mark + "Ligant") is the default for headers | Masthead; footer |
| Mark alone for favicons | `markDataUri()` sets the page favicon; no file request |
| Tile corner radius 22% | `rx="14.08"` on a 64-unit tile |
| Minimum sizes: 16 px favicon, 24 px UI, 120 px lockup | Masthead mark 30 px, footer 22 px with the name beside it, sheet 30 px; the lockup is ~110 px of wordmark plus the mark, over the 120 px minimum |
| Clear space ≥ ¼ of the mark's width | Masthead gap 12 px against a 30 px mark (0.4×) |
| Approved grounds: green primary, navy, off-white | The tile is teal on the navy masthead, on the off-white footer, and on the white sheet |
| Never recolour the tile, rotate, stretch, change the centre, add ".ai" | The mark is one construction, emitted from one function; no transform, no per-context colour |
| The centre uses the brightened gold #E0A416 | `GOLD` in `mark.js`; the single sanctioned brightening, used nowhere else |

## §04 Colour

Every colour in `styles.css` is a published §04 value: the four brand colours, the six neutrals, and #C0392B. Three off-palette values were removed (`#D9D2C5`, `#B9B0A0`, `#F6ECD2`); §08 grants no off-palette colour.

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
