# Dilution Planner

Plans the volumes to combine to reach a stated target concentration, or an
ordered set of them, from a stated stock — including the intermediate dilution
a step needs when the transfer it asks for is too small to pipette.

A free bench tool from [Ligant](https://ligant.ai), part of Ligant Bench Tools.
It runs entirely in your browser. The one third party it loads is Cloudflare Web
Analytics, which counts visits and reads nothing you enter.

**Use it at [benchtools.ligant.ai/dilution-planner/](https://benchtools.ligant.ai/dilution-planner/)**,
or run it on your own machine — see [Running it](#running-it).

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
not a plan. Where the tool cannot produce something the bench can execute, it
withholds the plan and names every bound that failed.

## What it does not do

It plans preparation. It does not prepare it, does not observe what was
pipetted, does not analyse the resulting data, and **cannot detect a stock
concentration that is wrong** — mislabelled, degraded, from a different lot, or
correct for a different formulation.

The page lists in full the eight classes of failure the tool cannot detect,
including incomplete mixing between serial steps, the largest real source of
serial dilution error, which is invisible in every record the tool produces.

Out of scope: volumetric preparation (diluent added to a mark rather than
pipetted), mass ↔ molar conversion, titration series design, and reconstitution
of a dry solute.

## Method

Six declarations, none defaulted or inferred: the stock concentration and where
it came from, the target or targets and where they came from, one preparation
volume and **what that volume is the volume of**, the diluent, the minimum
volume your pipette delivers reliably, and — where more than one point is
planned — the route, serial or independent. The minimum is pre-filled at 2 µL as
a visibly marked suggestion rather than as a standard. A maximum single
transfer, a vessel working capacity, the available stock volume and the stock
formulation are optional, and their absence is stated on the output.

Both concentration unit menus start unselected, and no plan is computed until
each is chosen: a wrong concentration unit is a factor-of-1000 error with
nothing on screen to show it.

Each vessel reports the transfer in and where it came from, the diluent, the
total prepared, what is drawn onward and what remains, the exact concentration
from unrounded volumes, the **achieved concentration the displayed volumes
actually make**, the bound on its departure from target, and the closure
residual where it is not zero. The plan can be copied as notebook text, printed
as a bench sheet, and exported as a structured result object that carries every
quantity unrounded, with its unit, and every threshold the tool applies.

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
diluent, so no intermediate exists for a step with a factor of 11 or less under
the final-volume and available-volume bases, or 10 or less under the
diluent-volume basis. Such a step is refused, naming which bound failed.

### The arithmetic

Volumes are carried as exact decimals, not as doubles. Rounding is **half away
from zero, applied to the exact binary value**. Volumes display at 3 significant
figures and concentrations at 6; a concentration needing more integer digits
than that is written in scientific notation, so the figures shown are the
significant ones.

Every comparison of a volume with your declared minimum uses the **displayed**
volume — the volume the bench actually sets. A transfer of 1.995 µL is set as
2.00 µL and is pipettable; one of 1.994 µL is set as 1.99 µL and is not.

One volume per vessel is derived and rounded once, so the displayed volumes
close to the stated volume up to a residual of ±½ unit in the last displayed
place, which is reported rather than hidden.

Two tolerances apply, derived analytically over the operation set:

| Tolerance | Value |
|---|---|
| Round-trip, exact concentration | 6 ULP of the target per step from stock, a planned intermediate counting as a step |
| Achieved-concentration bound | Per vessel `(1 + h(T)/(Tᵈ − h(T)))/(1 − h(D)/V) − 1`, compounded along the chain. Worst-case bound 1.01 × 10⁻² per step |

**A 3-significant-figure plan can carry up to about 1% rounding error per step
before any pipetting error.** That is why the achieved value is shown beside
every target, with its own bound.

Same inputs, same outputs: nothing reads a clock or a random source.

## Privacy

Everything is computed in your browser. Nothing you enter is transmitted, and
there is no account. The typefaces are self-hosted and the source contains no
network call of any kind.

**The tool stores nothing in your browser.** It sets no cookie, reads none, and
keeps no site data of any kind: a reload starts an empty page rather than
returning declarations made under conditions that may since have changed. The
hosted page shares its domain with other Ligant sites, and cookies they set may
be present in your browser there; this tool neither sets nor reads them.

**One third-party script runs on the hosted page: Cloudflare Web Analytics**,
added by the host to count visits. It records which page was opened, how often,
roughly where from, and how quickly it loaded. By Cloudflare's documentation it
uses no cookie or `localStorage` and does not fingerprint by IP or User-Agent. It
reports to the site's own `/cdn-cgi/rum`. The page's content security policy —
in `index.html` and in `public/_headers` — allows that one script and that one
endpoint and nothing else outside the page's own address, so it is there to
read. A copy you run yourself never loads it.

You can confirm all of this in your browser's developer tools: the Network tab
shows every request the page makes, and the Application tab shows that it keeps
nothing.

## Running it

**What you need:** Node 22 or newer, and npm.

```sh
git clone https://github.com/abmodi-ai/Ligant.ai-Dilution-Planner.git
cd Ligant.ai-Dilution-Planner
npm install      # development tooling only; the page itself has no runtime dependencies
npm run dev      # then open http://localhost:5173/
```

To build a static copy you can host anywhere:

```sh
npm run build    # writes dist/
npm run preview  # serves dist/ locally to check it
```

The page is plain HTML and native ES modules, so any static web server can also
serve the source folder directly (`npm run serve`).

## Layout

| Path | What |
|---|---|
| `index.html`, `styles.css` | The page and its stylesheet |
| `src/engine/` | The calculation: exact decimals, units, the planning rules, tolerances, notebook text |
| `src/ui/` | The form, the on-screen plan, the bench sheet and the page's statements |
| `src/tokens.css` | The design tokens shared across Ligant Bench Tools |
| `src/config.js` | Title, publisher, repository and citation — one string each |
| `CITATION.cff` | Citation metadata for GitHub and Zenodo |
| `fonts/` | Self-hosted Inter and IBM Plex Mono, with their SIL Open Font Licence texts |
| `public/` | Files served as they are: the response headers and the licence |

## Limitations

**The tool plans one intermediate per step and never chains a second.** Where a
single intermediate cannot make a step pipettable, the plan is withheld and the
bound that failed is named, and the remedy is the stated volume.

It plans pipetted preparation only: diluent added to a mark is out of scope.

## How to cite

> Modi, A.B. (2026). Dilution Planner (v1.1.1) [Computer software].
> Ligant AI Incorporated. benchtools.ligant.ai/dilution-planner/

The footer of the tool carries this same line with a one-click copy button,
generated from the same constants in `src/config.js`, so the page and this
README cannot disagree. `CITATION.cff` carries it for GitHub's "Cite this
repository" button and for Zenodo, which archives each release. There is no DOI yet; one is minted when the tool is
released. Cite the version: it is also on every plan the tool produces, in the
structured object and on the bench sheet, so a plan can be traced to the code
that produced it.

## Licence

Apache 2.0, for its express patent grant. A copy is served with the page and
distributed with the source. The typefaces are under the SIL Open Font Licence,
whose texts are in `fonts/`.

**Research use only. Not qualified for GxP decision-making.**
