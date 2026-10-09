import { readFile } from 'node:fs/promises';
import { validateData } from './data.mjs';
import { escapeHtml as e, richText, jsonScript, interpolate, monthLabel } from './format.mjs';
import { seo } from './seo.mjs';
import { icon } from './icons.mjs';

const mailto = (email) => `mailto:${encodeURIComponent(email).replace('%40', '@')}`;
const externalLink = (link) => `<a href="${e(link.url)}" target="_blank" rel="noopener noreferrer">${e(link.label)} <span aria-hidden="true">↗</span></a>`;
const detail = (item) => `${item.lead ? `<strong>${e(item.lead)}</strong> ` : ''}${richText(item.text)}`;

function sectionHeading(id, copy) {
  const section = copy.sections[id];
  return `<div class="section-heading"><h2 id="${id}-title"><span class="code-prefix" aria-hidden="true">~/</span> ${e(section.title)}<span class="code-parens" aria-hidden="true">()</span></h2>${section.note ? `<span class="section-note">${e(section.note)}</span>` : ''}</div>`;
}

function header(p, c) {
  return `<header class="site-header">
    <a class="wordmark" href="#" aria-label="${e(p.name)}, ${e(c.backToTop.toLowerCase())}"><span class="logo-mark" aria-hidden="true">[<span>${e(p.brand.initial)}</span>]</span> <span>${e(p.brand.name)}<span class="muted">${e(p.brand.suffix)}</span></span></a>
    <nav aria-label="${e(c.navigationLabel)}">${c.navigation.map((item) => `<a href="#${e(item.target)}"${item.target === 'playground' ? ' class="nav-playground"' : ''}>${item.icon ? `<span aria-hidden="true">${e(item.icon)}</span> ` : ''}${e(item.label)}</a>`).join('\n')}</nav>
  </header>`;
}

function hero(p, c, logo) {
  return `<section class="hero" aria-labelledby="intro-title">
    <div class="hero-meta"><span class="location"><span class="status-dot" aria-hidden="true"></span> ${e(p.location.city)}, ${e(p.location.country)}</span><span class="timezone">${e(p.location.utcLabel)} <span id="local-time"></span></span></div>
    <div class="hero-title-row">
      <div><p class="hello">${e(p.intro)}</p><h1 id="intro-title">${e(p.name)}<span class="cursor" aria-hidden="true">_</span></h1></div>
      <div class="pixel-mark">${logo}<span aria-hidden="true">${e(c.logo.caption)}</span></div>
    </div>
    <p class="hero-role">${e(p.role)}</p>
    <p class="hero-description">${p.description.map(e).join('<br>')}</p>
    <div class="hero-links">
      <a class="contact-link" href="${e(mailto(p.email))}">${icon('email')} ${e(c.contactLink)}</a>
      ${p.socials.map((social) => `<a href="${e(social.url)}" target="_blank" rel="noopener noreferrer">${social.icon === 'github' ? icon('github') + ' ' : ''}${e(social.label)}</a>`).join('\n')}
    </div>
    <div class="live-counter" id="live-counter" hidden>
      <span class="counter-label">${e(c.counter.label)}</span>
      <span id="live-counter-value" role="timer" aria-live="off" aria-label="${e(interpolate(c.counter.valueLabel, { value: 0 }))}"><span id="live-counter-binary" class="counter-binary" aria-hidden="true">00000000</span><span class="counter-decimal" aria-hidden="true"><span id="live-counter-decimal">000</span> / 255</span></span>
      <button type="button" id="counter-toggle" aria-controls="live-counter-value" aria-label="${e(c.counter.pauseLabel)}">${e(c.counter.pause)}</button>
      <span class="counter-note">${e(c.counter.tickNote)}</span>
    </div>
  </section>`;
}

function work(experience, c) {
  return `<section id="experience" class="section" aria-labelledby="experience-title">${sectionHeading('experience', c)}
    ${experience.map((entry) => `<article class="experience-entry" id="role-${e(entry.id)}">
      <div class="experience-heading"><div><h3>${e(entry.company)}</h3><p class="job-title">${e(entry.role)}</p></div><div class="job-meta"><span><time datetime="${entry.startDate}">${monthLabel(entry.startDate)}</time> — ${entry.endDate ? `<time datetime="${entry.endDate}">${monthLabel(entry.endDate)}</time>` : e(c.present)}</span><span>${e(entry.location)}</span></div></div>
      <ul class="experience-list">${entry.highlights.map((item) => `<li>${detail(item)}</li>`).join('\n')}</ul>
    </article>`).join('\n')}
  </section>`;
}

function projectsSection(projects, c) {
  return `<section id="projects" class="section" aria-labelledby="projects-title">${sectionHeading('projects', c)}
    ${projects.map((project) => `<article class="project" id="project-${e(project.id)}">
      <div class="project-heading"><h3>${e(project.name)}</h3></div>
      <p class="project-summary">${e(project.summary)}</p>
      <p>${e(project.description)}</p>
      <div class="tech-list" aria-label="${e(project.name)} ${e(c.technologiesLabel)}">${project.technologies.map((item) => `<span>${e(item)}</span>`).join('')}</div>
      ${project.links.length ? `<div class="project-links">${project.links.map(externalLink).join(' ')}</div>` : ''}
      <details><summary>${e(c.projectDetails)} <span class="details-symbol" aria-hidden="true">+</span></summary><div class="details-content">
        ${project.details.length > 1 ? `<ul class="project-detail-list">${project.details.map((item) => `<li>${detail(item)}</li>`).join('')}</ul>` : `<p>${detail(project.details[0])}</p>`}
        ${project.detailNote ? `<p class="detail-stack">${e(project.detailNote)}</p>` : ''}
      </div></details>
    </article>`).join('\n')}
  </section>`;
}

function toolkitSection(toolkit, c) {
  return `<section id="stack" class="section" aria-labelledby="stack-title">${sectionHeading('stack', c)}
    <dl class="stack-table">${toolkit.map((group) => `<div><dt>${e(group.category)}</dt><dd>${group.items.map((item) => `<span>${e(item)}</span>`).join('')}</dd></div>`).join('\n')}</dl>
  </section>`;
}

function playground(c) {
  const p = c.playground;
  return `<section id="playground" class="section playground-section" aria-labelledby="playground-title">${sectionHeading('playground', c)}
    <div class="byte-lab">
      <div class="lab-heading"><div><h3>${e(p.title)}</h3><p>${e(p.description)}</p></div><span class="byte-badge">${e(p.badge)}</span></div>
      <fieldset id="bit-controls"><legend>${e(p.legend)}</legend><div class="bit-grid">
        ${Array.from({ length: 8 }, (_, index) => {
          const bit = 7 - index; const on = Boolean(71 & (1 << bit));
          return `<div class="bit-column"><button type="button" class="bit" data-bit="${bit}" aria-label="${e(interpolate(p.bitLabel, { bit, value: 2 ** bit }))}" aria-pressed="${on}" disabled>${on ? 1 : 0}</button><span aria-hidden="true">${2 ** bit}</span></div>`;
        }).join('\n')}
      </div></fieldset>
      <div class="byte-values" aria-live="polite" aria-atomic="true"><div><span class="value-label">${e(p.decimal)}</span><output id="byte-decimal">71</output></div><div><span class="value-label">${e(p.hex)}</span><output id="byte-hex">0x47</output></div><div><span class="value-label">${e(p.ascii)}</span><output id="byte-ascii">G</output></div></div>
      <div class="lab-footer"><code><span class="syntax-keyword">const</span> byte = <span id="byte-binary">0b01000111</span>;</code><div class="lab-actions">
        ${[['G', 71], ['P', 80]].map(([letter, value]) => `<button type="button" data-preset="${value}" aria-label="${e(interpolate(p.presetLabel, { letter }))}" disabled>${letter}</button>`).join('')}
        <button type="button" id="invert-byte" disabled>${e(p.invert)}</button><button type="button" id="reset-byte" disabled>${e(p.reset)}</button>
      </div></div>
      <noscript><p class="noscript-note">${e(p.noScript)}</p></noscript>
    </div>
    <p class="lab-caption"><span aria-hidden="true">//</span> ${e(p.caption)}</p>
  </section>`;
}

function background(p, c) {
  return `<section id="background" class="section background-section" aria-labelledby="background-title">${sectionHeading('background', c)}
    ${p.education.map((entry) => `<div class="education"><div><h3>${e(entry.degree)}</h3><p>${e(entry.institution)}, ${e(entry.location)}</p></div><div class="job-meta"><span><time datetime="${entry.startDate}">${entry.startDate.slice(0, 4)}</time> — <time datetime="${entry.endDate}">${entry.endDate.slice(0, 4)}</time></span><span>${e(entry.scoreLabel)} <strong>${e(entry.score)}</strong></span></div></div>`).join('\n')}
    <div class="achievements">${p.achievements.map((item) => `<p><span class="achievement-icon" aria-hidden="true">${e(item.icon)}</span><span><strong>${e(item.value)}</strong> ${e(item.label)}<br><span class="muted">${e(item.context)}</span></span></p>`).join('')}</div>
  </section>`;
}

function contact(p, c) {
  return `<section id="contact" class="contact-section" aria-labelledby="contact-title">
    <p class="contact-comment">${e(p.contact.comment)}</p><h2 id="contact-title">${e(p.contact.title)}</h2><p>${e(p.contact.description)}</p>
    <div class="email-row"><a href="${e(mailto(p.email))}">${e(p.email)} <span aria-hidden="true">↗</span></a><button id="copy-email" type="button" aria-label="${e(c.clipboard.label)}" hidden>${icon('copy')}</button></div><p id="copy-status" class="copy-status" role="status"></p>
  </section>`;
}

export async function renderSite(data) {
  validateData(data);
  const { profile: p, copy: c } = data;
  const discovery = seo(data);
  const logo = (await readFile(new URL('./partials/logo.html', import.meta.url), 'utf8')).replace('{{logoLabel}}', e(c.logo.staticLabel));
  const runtime = { email: p.email, timeZone: p.location.timeZone, copy: c };
  const html = `<!doctype html>
<html lang="${e(data.site.language)}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  ${discovery.metadata}
  <link rel="icon" href="./favicon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="./styles.css">
  <link rel="alternate" type="text/markdown" href="./profile.md" title="${e(p.name)}">
  <script id="portfolio-config" type="application/json">${jsonScript(runtime)}</script>
  <script type="module" src="./main.js"></script>
</head>
<body>
  <a class="skip-link" href="#main">${e(c.skipLink)}</a>
  <div class="page-shell">
    ${header(p, c)}
    <main id="main">
      ${hero(p, c, logo)}
      ${work(data.experience, c)}
      ${projectsSection(data.projects, c)}
      ${toolkitSection(data.toolkit, c)}
      ${playground(c)}
      ${background(p, c)}
      ${contact(p, c)}
    </main>
    <footer><span>© <span id="year">${new Date().getFullYear()}</span> ${e(p.name)}</span><a href="#" class="back-to-top">${e(c.backToTop)} <span aria-hidden="true">↑</span></a><span class="footer-note">${e(c.footer)}</span></footer>
  </div>
</body>
</html>\n`;
  return { html, ...discovery };
}
