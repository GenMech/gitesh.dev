import { canonicalUrl } from './data.mjs';
import { escapeHtml as e, interpolate, jsonScript, plainText } from './format.mjs';

export function seo(data) {
  const { profile: p, site, projects, experience, toolkit, theme } = data;
  const base = canonicalUrl(site);
  const absolute = (path) => base ? new URL(path, base).href : path;
  const tokens = { name: p.name, role: p.role, city: p.location.city, country: p.location.country };
  const title = interpolate(site.title, tokens);
  const description = interpolate(site.description, tokens);
  const personId = absolute('#person');
  const pageId = absolute('#profile');
  const graph = [
    {
      '@type': 'Person', '@id': personId, name: p.name, alternateName: p.handle,
      jobTitle: p.role, description, ...(base ? { url: base } : {}),
      homeLocation: { '@type': 'Place', name: `${p.location.city}, ${p.location.country}` },
      sameAs: p.socials.map((social) => social.url),
      knowsAbout: [...new Set(toolkit.flatMap((group) => group.items))],
      alumniOf: p.education.map((entry) => ({ '@type': 'EducationalOrganization', name: entry.institution })),
      worksFor: experience.filter((entry) => entry.endDate === null).map((entry) => ({ '@type': 'Organization', name: entry.company })),
    },
    {
      '@type': 'ProfilePage', '@id': pageId, name: title, description,
      ...(base ? { url: base } : {}), dateModified: `${site.updatedAt}T00:00:00+05:30`,
      inLanguage: site.language, mainEntity: { '@id': personId },
      isPartOf: { '@id': absolute('#website') },
      hasPart: projects.map((project) => ({ '@id': absolute(`#project-${project.id}`) })),
    },
    { '@type': 'WebSite', '@id': absolute('#website'), name: title, ...(base ? { url: base } : {}), inLanguage: site.language, publisher: { '@id': personId } },
    ...projects.map((project) => ({
      '@type': 'SoftwareSourceCode', '@id': absolute(`#project-${project.id}`), name: project.name,
      description: project.description, creator: { '@id': personId },
      ...(base ? { url: absolute(`#project-${project.id}`) } : {}),
      keywords: project.technologies.join(', '),
      ...(project.languages.length ? { programmingLanguage: project.languages } : {}),
      ...(project.links.find((link) => link.kind === 'repository') ? { codeRepository: project.links.find((link) => link.kind === 'repository').url } : {}),
    })),
  ];
  const metadata = [
    `<title>${e(title)}</title>`,
    `<meta name="description" content="${e(description)}">`,
    `<meta name="author" content="${e(p.name)}">`,
    `<meta name="theme-color" content="${e(theme.bg)}">`,
    `<meta name="robots" content="${site.indexable ? 'index, follow, max-image-preview:large' : 'noindex, nofollow'}">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:locale" content="${e(site.locale)}">`,
    `<meta property="og:site_name" content="${e(p.name)}">`,
    `<meta property="og:title" content="${e(title)}">`,
    `<meta property="og:description" content="${e(interpolate(site.socialDescription, tokens))}">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${e(title)}">`,
    `<meta name="twitter:description" content="${e(interpolate(site.socialDescription, tokens))}">`,
    ...(base ? [
      `<link rel="canonical" href="${e(base)}">`,
      `<meta property="og:url" content="${e(base)}">`,
      `<meta property="og:image" content="${e(absolute('social-card.png'))}">`,
      '<meta property="og:image:type" content="image/png">',
      '<meta property="og:image:width" content="1200">',
      '<meta property="og:image:height" content="630">',
      `<meta property="og:image:alt" content="${e(interpolate(site.socialImageAlt, tokens))}">`,
      `<meta name="twitter:image" content="${e(absolute('social-card.png'))}">`,
      `<meta name="twitter:image:alt" content="${e(interpolate(site.socialImageAlt, tokens))}">`,
    ] : []),
    ...(site.googleSiteVerification ? [`<meta name="google-site-verification" content="${e(site.googleSiteVerification)}">`] : []),
    ...(site.bingSiteVerification ? [`<meta name="msvalidate.01" content="${e(site.bingSiteVerification)}">`] : []),
    `<script type="application/ld+json">${jsonScript({ '@context': 'https://schema.org', '@graph': graph })}</script>`,
  ].join('\n  ');
  const robots = site.indexable ? `User-agent: *\nAllow: /\n\nSitemap: ${absolute('sitemap.xml')}\n` : 'User-agent: *\nDisallow: /\n';
  const sitemap = site.indexable ? `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${e(base)}</loc><lastmod>${site.updatedAt}</lastmod></url></urlset>\n` : null;
  const profileMarkdown = [
    `# ${p.name}`, `\n${p.role} | ${p.location.city}, ${p.location.country}`, `\n${p.intro}`, ...p.description.map((line) => `\n${line}`),
    '\n## Experience',
    ...experience.flatMap((entry) => [`\n### ${entry.company}`, `${entry.role} | ${entry.startDate} – ${entry.endDate || data.copy.present} | ${entry.location}`, ...entry.highlights.map((item) => `- ${item.lead} ${plainText(item.text)}`)]),
    '\n## Projects',
    ...projects.flatMap((project) => [`\n### ${project.name}`, project.summary, project.description, `Technologies: ${project.technologies.join(', ')}`, ...project.details.map((item) => `- ${item.lead} ${plainText(item.text)}`), project.detailNote, ...project.links.map((link) => `[${link.label}](${link.url})`)]),
    '\n## Toolkit', ...toolkit.map((group) => `- ${group.category}: ${group.items.join(', ')}`),
    '\n## Education', ...p.education.map((entry) => `${entry.degree}, ${entry.institution}, ${entry.location}. ${entry.startDate} – ${entry.endDate}. ${entry.scoreLabel}: ${entry.score}.`),
    '\n## Achievements', ...p.achievements.map((item) => `- ${item.value} ${item.label} — ${item.context}`),
    '\n## Contact', p.contact.title, p.contact.description, `Email: ${p.email}`, ...p.socials.map((social) => `[${social.label}](${social.url})`),
    `\nContent updated: ${site.updatedAt}.`,
  ].filter(Boolean).join('\n') + '\n';
  const llms = `# ${p.name}\n\n> ${description}\n\n## Portfolio\n- [Profile](${base || './'}): Experience, projects, skills, education, and contact.\n- [Plain-text profile](${absolute('profile.md')}): The same factual content in Markdown.\n\n## Projects\n${projects.map((project) => `- [${project.name}](${absolute(`#project-${project.id}`)}): ${project.summary}`).join('\n')}\n`;
  return { metadata, robots, sitemap, profileMarkdown, llms };
}
