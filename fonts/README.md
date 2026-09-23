# Self-hosted typefaces

Brand rule: zero third-party requests. Both faces are served from this
directory; nothing is fetched from a font CDN.

| Face | Use | Files | Licence |
|---|---|---|---|
| Inter 4.1 | Prose, labels, flag text, UI | Inter-Regular/SemiBold/Bold.woff2 | SIL OFL 1.1 (LICENSE-Inter.txt) |
| IBM Plex Mono 1.1.0 | Data values, units, parameters, vessel labels, reason codes | IBMPlexMono-Regular/SemiBold.woff2 | SIL OFL 1.1 (LICENSE-IBM-Plex-Mono.txt) |

Sources: github.com/rsms/inter (release 4.1), github.com/IBM/plex (ibm-plex-mono 1.1.0).

**Five faces, as the tool set loads them.** C4 self-hosts Inter 400/600/700 and
IBM Plex Mono 400/600 (`@fontsource`, latin subsets), and nothing in either tool
sets mono at 700, so the Plex Mono Bold that C3 used to serve was dropped on
21 September 2026: the one rule that asked for it (the register status) is 600,
as the §05 pairing intends.

**The files here are a wider subset than C4's, deliberately.** `@fontsource`
ships latin-only files and declares no `unicode-range`, so C4 falls back to the
system stack for ρ, ≤, →, the modifier letter ᵈ and the superscript digits. This
page is dense with exactly those characters, and §06.07 makes scientific
accuracy a design constraint. Both tools carry Inter 4.1, so all shared Latin
text renders identically; C3 simply also has the glyphs it needs.
