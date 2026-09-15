// Page-level configuration. Single strings, sourced here and nowhere else.
// Tool naming convention (brand prefix vs standalone name) is open with the
// slug (handoff §12.3); the title is one configurable string until decided.
export const CONFIG = Object.freeze({
  toolTitle: 'Dilution Planner',
  toolId: 'C3',
  productLine: 'Ligant Bench Tools',
  publisher: 'Ligant',
  // Public slug is open item 10; assigned by A. Modi. Empty until then.
  slug: '',
  publicBase: 'https://benchtools.ligant.ai/',
  // GitHub org slug is under review for a rename; one string, not hard-coded elsewhere.
  repositoryUrl: 'https://github.com/abmodi-ai/ligant.ai-dilution-planner',
  // Citation string is set with the naming convention; placeholder shape only.
  citation: 'Ligant Bench Tools, Dilution Planner (C3). Research use; not qualified for GxP decision-making.',
});
