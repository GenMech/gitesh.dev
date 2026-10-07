import { mkdir, readFile, writeFile, cp, rm } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { ROOT, loadData, validateData } from '../src/data.mjs';
import { renderSite } from '../src/render.mjs';
import { createSocialCard } from '../src/social-card.mjs';

export async function build({ production = false } = {}) {
  const data = validateData(await loadData(), { production });
  const rendered = await renderSite(data);
  const out = new URL('dist/', ROOT);
  await mkdir(out, { recursive: true });
  await cp(new URL('src/assets/', ROOT), out, { recursive: true });
  const sourceCss = await readFile(new URL('src/assets/styles.css', ROOT), 'utf8');
  const theme = `:root {\n${Object.entries(data.theme).map(([key, value]) => `  --${key}: ${value};`).join('\n')}\n}\n`;
  const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="${data.theme.surface}"/><path d="M28 17H16v30h12M36 17h12v30H36" fill="none" stroke="${data.theme.accent}" stroke-width="4"/><path d="M29 33h6" stroke="${data.theme.secondary}" stroke-width="4"/></svg>\n`;
  const files = {
    'index.html': rendered.html, 'styles.css': theme + sourceCss, 'favicon.svg': favicon,
    'robots.txt': rendered.robots, 'profile.md': rendered.profileMarkdown, 'llms.txt': rendered.llms,
    'social-card.png': createSocialCard(data),
  };
  if (rendered.sitemap) files['sitemap.xml'] = rendered.sitemap;
  else await rm(new URL('sitemap.xml', out), { force: true });
  await Promise.all(Object.entries(files).map(([name, content]) => writeFile(new URL(name, out), content)));
  console.log(`Built portfolio → dist/ (${data.site.indexable ? 'indexable' : 'preview: noindex'}).`);
  return { data, rendered };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { await build({ production: process.argv.includes('--production') }); }
  catch (error) { console.error(`Build failed: ${error.message}`); process.exitCode = 1; }
}
