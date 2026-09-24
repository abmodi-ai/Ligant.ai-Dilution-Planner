import { defineConfig } from 'vite';

// Relative base so the artefact serves under https://benchtools.ligant.ai/<slug>/ unchanged.
// No modulepreload polyfill: it would inject an inline script, which the CSP forbids.
export default defineConfig({
  base: './',
  build: { modulePreload: { polyfill: false }, target: 'es2022' },
  server: { port: 5173, strictPort: true },
});
