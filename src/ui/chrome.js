// Standard Ligant Bench Tools chrome: the header and the footer, identical in
// structure across the tool set. Only the strings in src/config.js differ
// between tools. Taken from the shipped Antigen Density Calculator, Molarity
// Converter and Antibody Titration Planner.
import { CONFIG, toolUrl, citationText } from '../config.js';
import { markSvg, lockupHtml } from './mark.js';
import { escapeHtml as esc } from './page-content.js';

export function renderHeader() {
  const nav = CONFIG.tools.map((t) => (t.slug === CONFIG.slug
    ? `<span class="tool-nav-item current" aria-current="page">${esc(t.label)}</span>`
    : `<a class="tool-nav-item" href="${esc(toolUrl(t.slug))}">${esc(t.label)}</a>`)).join('');
  return `
    <div class="header-row">
      <a class="lockup" href="${esc(CONFIG.publicBase)}" aria-label="${esc(CONFIG.publisher)}">${markSvg({ size: 28 })}<span class="wordmark">${esc(CONFIG.publisher)}</span></a>
      <div class="header-right">
        <nav class="tool-nav" aria-label="Bench tools">${nav}</nav>
        <span class="bench-tools-mark">Bench tools</span>
      </div>
    </div>
    <h1 class="tool-h1">${esc(CONFIG.toolTitle)}</h1>
    <div class="hero-copy">
      <p>${esc(CONFIG.tagline)}</p>
      <p>${esc(CONFIG.standfirst)}</p>
    </div>`;
}

export function renderFooter() {
  const repo = `<a href="${esc(CONFIG.repositoryUrl)}">${esc(CONFIG.repositoryLabel)}</a>`;
  const mail = `<a href="mailto:${esc(CONFIG.contactEmail)}">${esc(CONFIG.contactEmail)}</a>`;
  return `
    <div class="footer-grid">
      <div class="footer-prose">
        <p>Your data stays in your browser. Everything you enter into this tool is calculated on your own device and never sent anywhere in this build, verified statically and in a real browser against the build. <strong>Not yet verified at this address:</strong> the no-transmission acceptance test is unrun here, and only it can rule out a request inserted after the build. We do not see it, store it, or have any way to retrieve it. Closing the page ends it.</p>
        <p>There is no account and no tracking of you. No login, no sign up, no cookies for advertising, no analytics scripts, and no third-party code of any kind runs on this page.</p>
        <p>We do count visits. Our hosting provider records basic traffic: which pages get opened, how often, and roughly where in the world from. Because we collect nothing about who you are, this is the only signal we have about whether these tools are useful and which one to build next.</p>
        <p>Every figure on this page comes from code you can read, download or run yourself, at ${repo}. Clone it and <code>npm run dev</code> for a local copy.</p>
        <p>These tools are standalone calculators. Ligant's enterprise platform adds reference databases, connected agentic workflows, on-premise language models, and full GxP validation. If your lab needs that, please email us ${mail}.</p>
        <p>Ligant Bench Tools are free and open source, under the licence below.</p>

        <div class="cite">
          <div class="cite-head">
            <div>
              <p class="eyebrow">How to cite</p>
              <p class="cite-lede">Cite the software as below.</p>
            </div>
            <button type="button" id="copy-citation" class="quiet">Copy</button>
          </div>
          <p class="cite-text num" id="citation-text">${esc(citationText())}</p>
          <p class="cite-note">${CONFIG.doi ? 'The identifier is given as text, not as a link: a link that navigated to a publisher would disclose a visit that the rest of the tool is built to prevent.' : 'No identifier is stated: one is minted when the tool is released, and a placeholder would read as a record that does not exist.'}</p>
        </div>

        <p class="licence">Licensed under the Apache License, Version 2.0. You may obtain a copy of the License in the <code>LICENSE</code> file served with this page and distributed with the source. Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" basis, without warranties or conditions of any kind, either express or implied. <strong>Research use only. Not qualified for GxP decision-making.</strong></p>
      </div>

      <address class="footer-org">
        <p class="eyebrow">${esc(CONFIG.legalEntity)}</p>
        ${CONFIG.address.map((l) => `<p>${esc(l)}</p>`).join('')}
        <p>${mail}</p>
      </address>
    </div>

    <div class="scope-callout">
      <p><strong>Research use only. Not qualified for GxP decision-making.</strong> ${esc(CONFIG.scopeNote)}</p>
    </div>

    <div class="footer-bar">
      ${markSvg({ size: 20 })}
      <span>${esc(CONFIG.publisher)} · ${esc(CONFIG.toolTitle)} v${esc(CONFIG.version)}</span>
    </div>`;
}

export { lockupHtml };
