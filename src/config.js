// Page-level configuration. Single strings, sourced here and nowhere else.
// The chrome (header, tool navigation, footer) is standard across Ligant Bench
// Tools; see src/ui/chrome.js. Anything here that differs between tools is the
// only thing a sibling tool changes.
export const CONFIG = Object.freeze({
  toolTitle: 'Dilution Planner',
  toolId: 'C3',
  productLine: 'Ligant Bench Tools',
  publisher: 'Ligant',
  legalEntity: 'Ligant AI Incorporated',
  version: '1.1.1', // moves with the engine
  slug: 'dilution-planner',
  publicBase: 'https://benchtools.ligant.ai/',
  // The lockup links to the company site and the suite mark to the catalog, as
  // on the shipped siblings.
  homeUrl: 'https://ligant.ai/',
  suiteLabel: 'Bench Tools',
  repositoryUrl: 'https://github.com/abmodi-ai/Ligant.ai-Dilution-Planner',
  repositoryLabel: 'github.com/abmodi-ai/Ligant.ai-Dilution-Planner',
  contactEmail: 'hello@ligant.ai',
  address: ['3675 Market Street', 'Suite 200', 'Philadelphia PA 19104'],
  // The DOI is minted at release; until then the citation carries no DOI rather
  // than a placeholder that would read as a record.
  doi: null,
  citationAuthor: 'Modi, A.B.',
  citationYear: '2026',
  // Sibling tools, in the order the shipped tools list them. The current tool is
  // marked by `slug` above and is not a link.
  tools: [
    { label: 'Antibody titration', slug: 'antibody-titration-planner' },
    { label: 'Molarity', slug: 'molarity-converter' },
    { label: 'Antigen density', slug: 'antigen-density-calculator' },
    { label: 'Dilution', slug: 'dilution-planner' },
  ],
  // The one-line summary under the title, and the paragraph that follows it.
  tagline: 'Plans the volumes to combine to reach a stated target concentration, or an ordered set of them, from a stated stock, including any single intermediate dilution a step needs to be pipettable. Every value is computed deterministically by arithmetic you can read. No model and no inference is applied to any reported number.',
  standfirst: 'A dilution is arithmetic a spreadsheet performs correctly and records incompletely. What the stated volume is the volume of, whether the series was prepared serially or independently and from which vessel, and whether the plan is preparable at all are invisible in the resulting numbers. This tool asks for all three and puts them in the result.',
  // The scope statement, in this tool's own terms (the house callout).
  scopeNote: 'This tool plans the preparation of a dilution or a dilution series. It does not prepare it, does not observe what was pipetted, does not analyse the resulting data, and cannot detect a stock concentration that is wrong. All computation is performed locally in this browser. Nothing you enter is transmitted.',
});

export function toolUrl(slug) {
  return `${CONFIG.publicBase}${slug}/`;
}

export function citationText() {
  const base = `${CONFIG.citationAuthor} (${CONFIG.citationYear}). ${CONFIG.toolTitle} (v${CONFIG.version}) [Computer software]. ${CONFIG.legalEntity}. ${CONFIG.publicBase.replace('https://', '')}${CONFIG.slug}/`;
  return CONFIG.doi ? `${base} doi:${CONFIG.doi}` : base;
}
