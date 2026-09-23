# Dilution Planner

Plans the volumes to combine to reach a stated target concentration, or an
ordered set of them, from a stated stock — including the intermediate dilution a
step needs when the transfer it asks for is too small to pipette.

A free bench tool from [Ligant](https://ligant.ai), part of Ligant Bench Tools.
It runs entirely in your browser and contacts no third party.

**Not yet deployed.** The address is decided —
`benchtools.ligant.ai/dilution-planner/` — and does not serve this tool yet.
Until it does, run it locally: see [Running it](#running-it).

## Why this exists

A dilution is arithmetic a spreadsheet performs correctly and records
incompletely.

Three things decide what a set of volumes means, and none of them is visible in
the numbers afterwards. **What the stated volume is the volume of** — the final
volume of the vessel, the diluent you pipette into it, or the volume that has to
remain after the next point is drawn off. **Whether the series was prepared
serially or independently**, and from which vessel each point came. **Whether
the plan is preparable at all** by the pipette in your hand.

A spreadsheet returns a clean column of volumes whichever of those was meant. If
"100 µL" was the diluent and someone reads it as the final volume, every
concentration below it is wrong by a factor that depends on the step, and
nothing on the page says so. This tool requires all three declarations, computes
from them, and puts them in the record beside the volumes.

It also refuses. A plan whose diluent is 1 µL when your pipette starts at 2 µL is
not a plan, and a warning printed beside unusable numbers is not a caveat but
decoration. Where the tool cannot produce something the bench can execute, it
withholds the plan and names the bound that failed.

## What it does not do

It plans preparation. It does not prepare it, does not observe what was
pipetted, does not analyse the resulting data, and **cannot detect a stock
concentration that is wrong** — mislabelled, degraded, from a different lot, or
correct for a different formulation.

The page lists, in full, the eight classes of failure the tool cannot detect,
including incomplete mixing between serial steps, which is the largest real
source of serial dilution error and is invisible in every record the tool
produces. That list is a requirement of the specification rather than a
disclaimer, and it is tested for on every build.

Volumetric preparation — diluent added to a mark rather than pipetted — is out
of scope, as is mass ↔ molar conversion (that is the Molarity Converter),
titration series design (the Antibody Titration Planner), and reconstitution of
a dry solute.

## Method

Six declarations, none defaulted or inferred: the stock concentration and where
it came from, the target or targets and where they came from, one preparation
volume and **what that volume is the volume of**, the diluent, the minimum
volume your pipette delivers reliably, and — where more than one point is
planned — the route, serial or independent. The minimum is pre-filled at 2 µL as
a visibly marked suggestion rather than as a standard. A maximum single transfer,
a vessel working capacity, the available stock volume and the stock formulation
are optional, and their absence is stated on the output rather than passed over.

Both concentration unit menus start unselected, and no plan is computed until
each is chosen. A wrong concentration unit is a factor-of-1000 error with
nothing on screen to show it.

Each vessel reports the transfer in and where it came from, the diluent, the
total prepared, what is drawn onward and what remains, the exact concentration
from unrounded volumes, the **achieved concentration the displayed volumes
actually make**, the bound on its departure from target, and the closure
residual where it is not zero.

Three conventions are stated on the page, because each is read both ways at a
bench:

- **Dilution factor is final volume ÷ stock volume.** A dilution of 1 in 100 is
  a factor of 100.
- **The receiving vessel holds the diluent**, and the stock or intermediate is
  added to it.
- **S** is the stock; **I1, I2, …** are intermediates in execution order;
  **P1, P2, …** are the requested points in the order entered.

### Intermediates

Where a step's transfer falls below your declared minimum, the tool plans a
single intermediate from the decade series {10, 100, 1000, …}, sized so that its
own transfer is at or above the minimum, and never chains a second one. The
destination must hold at least the minimum of **both** the transfer and its
diluent, so the published consequence is that no intermediate exists for a step
with a factor of 11 or less under the final-volume and available-volume bases,
or 10 or less under the diluent-volume basis. Such a step is refused, naming
which bound failed — the series floor and the destination diluent bound are
different reasons and are reported as such.

### The arithmetic

Volumes are carried as exact decimals, not as doubles. Rounding is **half away
from zero, applied to the exact binary value**, computed from the decimal
expansion of the double rather than by calling `toPrecision`, which cannot tell
you whether a value was really halfway. Volumes display at 3 significant
figures, concentrations at 6; a concentration needing more integer digits than
that is written in scientific notation, so the figures shown are the significant
ones.

Every comparison of a volume with your declared minimum uses the **displayed**
volume — the volume the bench actually sets. A transfer of 1.995 µL is set as
2.00 µL and is pipettable; one of 1.994 µL is set as 1.99 µL and is not.

One volume per vessel is derived and rounded once, so the displayed volumes
close to the stated volume up to a residual of ±½ unit in the last displayed
place, which is reported rather than hidden. Totals and remaining volumes are
sums of displayed values and are never rounded again.

Two tolerances are registered, derived analytically over the implemented
operation set rather than sampled, and signed off on 21 September 2026:

| Tolerance | Value |
|---|---|
| Round-trip, exact concentration | 6 ULP of the target per step from stock, a planned intermediate counting as a step. The reference value is the target in the engine's internal unit |
| Achieved-concentration bound | Per vessel `(1 + h(T)/(Tᵈ − h(T)))/(1 − h(D)/V) − 1`, compounded along the chain. Worst-case bound 1.01 × 10⁻² per step |

**A 3-significant-figure plan can carry up to about 1% rounding error per step
before any pipetting error.** That is larger than most people expect, and it is
why the achieved value is shown beside every target with its own bound.

## Reproducibility

Same inputs, same outputs. Nothing reads a clock or a random source, and nothing
persists between runs.

- **72 tests**, including the specification's fixtures asserted value by value, a
  negative control asserted to raise no flag at all, boundary cases either side
  of and exactly on every numeric condition, and every rejection and flag.
- An **independent Python reimplementation** in `verify/`, written from the
  specification rather than translated from the JavaScript, compared over 15
  cases and 46 vessels. Observed agreement: **0 ULP**, 0 of 138 displayed values
  differing, and 0 of 138 unit labels differing — the labels are compared too,
  because two implementations can agree on a number and disagree on what it
  means.
- **Threshold independence** as executable tests: declaring or varying the
  maximum transfer, or the vessel capacity, changes no volume in the plan, bit
  for bit on unrounded values.
- Checks **confirmed capable of failing** by inserting the defect they exist to
  catch and showing it is detected, then reverting.

## Privacy

Everything is computed in your browser. Nothing you enter is transmitted, there
is no account, and the page contacts no third party at all: the typefaces are
self-hosted, there is no analytics script, and the source contains no network
call of any kind. The built page makes 8 requests, all to its own origin.

**Nothing is stored in your browser either.** No cookie, no site data of any
kind. A reload starts an empty page rather than returning declarations you made
under conditions that may since have changed. `npm run check:browser` enforces
that in a real browser: it instruments every storage accessor *before any page
script runs*, seeds a key belonging to another tool, drives a full session and a
reload, and fails on a single call — a read as readily as a write, because the
requirement forbids both.

All of that is a claim about the build. The stronger claim, about the page as
served, needs a run against the deployed address, and **that run has not been
made, because the tool is not deployed**. The footer says so in those terms
rather than claiming what has not been checked. A CDN or a host default can
inject what a build does not contain, which is why the check belongs at the
address and is re-run after every deploy.

## Running it

**What you need:** Node 22 or newer, and npm. Python 3 for the reimplementation
comparison. A browser build for the three gates that drive one.

```sh
npm install            # dev tooling only; the page itself has no runtime dependencies
npm run dev            # http://localhost:5173/
npm run build          # static site to dist/
npm test               # 72 tests: engine, fixtures, invariance, result object, object units
npm run verify:reimpl  # the independent Python comparison
```

The page is plain HTML and native ES modules, so any static server will serve
the source tree unbundled (`npm run serve`).

The three gates that drive a real browser need Chromium once:

```sh
npx playwright install chromium
```

```sh
npm run check:viewport  # no step is visible without its declarations, at 1366 × 650
npm run check:contrast  # WCAG 2.1 AA over the rendered plan and the bench sheet
npm run check:browser   # storage, and the unselected concentration units
```

`npm run dev`, `npm run build` and `npm test` do not need it.

Two more record the evidence behind the tolerances rather than gating the build:
`npm run measure:rounding` and `npm run sample:empirical`.

### Verifying a deployment

The browser gates take a URL, and the storage check installs its instrumentation
before any page script, so both run against a deployed address unchanged:

```sh
npm run check:viewport -- https://benchtools.ligant.ai/dilution-planner/
node scripts/browser-checks.mjs https://benchtools.ligant.ai/dilution-planner/
```

Those runs are what acceptance 22 and 24 require, and they are what removes the
"not yet verified at this address" sentence from the footer. Re-run them after
every deploy and after any CDN change: the claim is about the page as served, so
it lapses the moment that page changes.

## Layout

| Path | What |
|---|---|
| `src/engine/plan.js` | The engine: inputs in, one structured result object out; the rejects, the flags, the intermediate rule |
| `src/engine/decimal.js` | Exact decimal arithmetic and the rounding primitive |
| `src/engine/tolerances.js` | The two derived tolerances, and the switch the bound's display is gated on |
| `src/engine/format.js` | Notebook text and sentences, rendered from the result object only |
| `src/ui/` | Form, on-screen plan, bench sheet, page statements, and the chrome shared with the sibling tools |
| `src/config.js` | Title, slug, publisher, repository, citation — one string each |
| `test/` | The specification's fixtures and the invariance tests |
| `verify/` | The independent Python reimplementation and the reference set it is compared against |
| `docs/` | The conformance audit, the decisions, the tolerance memo, the open items, deployment |
| `fonts/` | Self-hosted Inter 400/600/700 and IBM Plex Mono 400/600 (OFL) |

## Status and limitations

Built against **C3 URS v0.4.2**, engine **1.0.0**, tagged `v1.0.0`. The §7
scientific build review closed on 22 September 2026. `docs/conformance-audit.md`
is the row-by-row status and `docs/decisions.md` records every decision with its
reasoning.

| Item | State |
|---|---|
| The two tolerances | **Derived and signed**, 21 September 2026. Every point displays its own bound; the gate that withholds it while a derivation is unsigned remains, and is tested both ways |
| Acceptance 22 and 24, at the address | **Not run.** They require the deployed build, which does not exist yet |
| Acceptance 28 and 29, at the address | **Not run**, for the same reason. Both pass locally |
| Acceptance 27, first-time use | **Not run.** It needs a person, not a script |
| The C4 / C1 import path | **Dark in 1.0.0.** The field is hidden: the only real C1 object that exists cannot be imported, because C1 emits `tool` as an object where this importer expects a string. The importer and its validation stay behind the hidden section, and the transport format is a specification decision rather than one for whichever field names an importer assumes |
| The constants register | In the result object, generated by the same computation as the plan, and in this repository at the tagged version. It is not on the page, by owner decision |
| Small volumes in large units | A 4 µL transfer displays as 0.00400 mL when the volume unit is mL. Correct, and not what a pipette is set to. A tool-set decision, pending across C1, C3 and C4 |

One limitation worth knowing before you use it: **the tool plans one
intermediate per step and never chains a second.** Where a single intermediate
cannot make a step pipettable, the plan is withheld and the bound that failed is
named, and the remedy is the stated volume rather than a deeper chain.

## How to cite

> Modi, A.B. (2026). Dilution Planner (v1.0.0) [Computer software].
> Ligant AI Incorporated. benchtools.ligant.ai/dilution-planner/

The footer of the tool carries this same line with a one-click copy button,
generated from the same constants in `src/config.js` that the build uses, so the
page and this README cannot disagree.

**There is no DOI yet.** One is minted when the tool is released, and the page
says so rather than showing a placeholder that would read as a record that does
not exist. Cite the version: `v1.0.0` names the exact artefact, and the engine
version is on the output, in the structured object and on the bench sheet, so a
plan can be traced back to the code that produced it.

## Licence

Apache 2.0, for its express patent grant. A copy is served with the page and
distributed with the source.

**Research use only. Not qualified for GxP decision-making.**
