// Route worker for benchtools.ligant.ai/dilution-planner/.
//
// Same shape as the shipped routers for the Molarity Converter, the Antigen
// Density Calculator and the Antibody Titration Planner: strip the path prefix
// and proxy to this tool's Pages project, letting the upstream's own headers
// govern caching.
//
// One addition: the tool is also announced as /Dilution-Planner. URL paths are
// case-sensitive, so any casing of the prefix other than the canonical one is
// redirected, once, to the lowercase address the tool cites, links to and
// declares as canonical. The rest of the path keeps its casing: asset names are
// content hashes and case matters in them.
const UPSTREAM_HOST = 'ligant-dilution-planner.pages.dev';
const PREFIX = '/dilution-planner';

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname;
    const folded = path.toLowerCase();
    if ((folded === PREFIX || folded.startsWith(`${PREFIX}/`)) && !path.startsWith(PREFIX)) {
      return Response.redirect(`${url.origin}${PREFIX}${path.slice(PREFIX.length) || '/'}${url.search}`, 301);
    }
    if (path === PREFIX) {
      return Response.redirect(`${url.origin}${PREFIX}/${url.search}`, 301);
    }
    if (!path.startsWith(`${PREFIX}/`)) {
      return fetch(request);
    }
    const upstream = new URL(request.url);
    upstream.hostname = UPSTREAM_HOST;
    upstream.pathname = path.slice(PREFIX.length) || '/';
    const headers = new Headers(request.headers);
    headers.delete('host');
    return fetch(
      new Request(upstream, {
        method: request.method,
        headers,
        body: request.body,
        redirect: 'follow',
        // The upstream's own headers govern caching, not a second layer here: a
        // proxy that caches independently of the origin can keep serving what
        // the origin said before its last deploy, which is exactly the kind of
        // staleness this route exists to avoid introducing.
        cf: { cacheTtl: 0, cacheEverything: false },
      }),
    );
  },
};
