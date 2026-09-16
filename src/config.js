// Page-level configuration. Single strings, sourced here and nowhere else.
// Tool naming convention (brand prefix vs standalone name) is open with the
// slug (handoff §12.3); the title is one configurable string until decided.
export const CONFIG = Object.freeze({
  toolTitle: 'Dilution Planner',
  toolId: 'C3',
  productLine: 'Ligant Bench Tools',
  publisher: 'Ligant',
  // Public slug (open item 10): decided under owner delegation, 15 September 2026 — docs/decisions.md D-4.
  slug: 'dilution-planner',
  publicBase: 'https://benchtools.ligant.ai/',
  // GitHub org slug is under review for a rename; one string, not hard-coded elsewhere.
  repositoryUrl: 'https://github.com/abmodi-ai/ligant.ai-dilution-planner',
  // Naming convention (docs/decisions.md D-4): standalone tool name, Ligant as publisher.
  citation: 'Dilution Planner (C3), Ligant Bench Tools, published by Ligant. https://benchtools.ligant.ai/dilution-planner/ — research use; not qualified for GxP decision-making.',
});
