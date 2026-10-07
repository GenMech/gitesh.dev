import test from 'node:test';
import assert from 'node:assert/strict';
import { loadData, validateData } from '../src/data.mjs';
import { renderSite } from '../src/render.mjs';
import { createSocialCard } from '../src/social-card.mjs';

const base = await loadData();
const publicData = () => {
  const data = structuredClone(base);
  data.site.url = 'https://portfolio.test/';
  data.site.indexable = true;
  return data;
};
const schema = (html) => JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);

test('public build renders profile, projects and toolkit before any JavaScript runs', async () => {
  const data = publicData();
  const { html, robots, sitemap } = await renderSite(data);
  for (const project of data.projects) assert.ok(html.includes(project.name));
  assert.ok(html.indexOf('id="experience"') < html.indexOf('id="projects"'));
  assert.ok(html.includes('FastAPI'));
  assert.ok(html.includes('<link rel="canonical" href="https://portfolio.test/">'));
  assert.ok(html.includes('name="robots" content="index, follow'));
  assert.ok(robots.includes('Allow: /'));
  assert.ok(robots.includes('Sitemap: https://portfolio.test/sitemap.xml'));
  assert.ok(sitemap.includes('<loc>https://portfolio.test/</loc>'));
  assert.ok(sitemap.includes(`<lastmod>${data.site.updatedAt}</lastmod>`));
});

test('one content edit updates page, JSON-LD, reader summary and runtime configuration', async () => {
  const data = publicData();
  data.profile.name = 'Updated Person';
  data.profile.email = 'updated@example.test';
  data.projects[0].name = 'Updated Project';
  data.projects[0].description = 'A revised description.';
  data.profile.contact.title = 'A revised invitation';
  data.copy.clipboard.success = 'Copied the updated contact';
  const result = await renderSite(data);
  const graph = schema(result.html)['@graph'];
  assert.ok(result.html.includes('<title>Updated Person'));
  assert.ok(result.html.includes('A revised invitation'));
  assert.ok(result.html.includes('mailto:updated@example.test'));
  assert.equal(graph.find((n) => n['@type'] === 'Person').name, 'Updated Person');
  assert.equal(graph.find((n) => n['@type'] === 'SoftwareSourceCode').description, 'A revised description.');
  assert.ok(result.profileMarkdown.includes('Updated Project'));
  assert.ok(result.llms.includes('Updated Person'));
  const runtime = JSON.parse(result.html.match(/<script id="portfolio-config" type="application\/json">([\s\S]*?)<\/script>/)[1]);
  assert.equal(runtime.email, 'updated@example.test');
  assert.equal(runtime.copy.clipboard.success, 'Copied the updated contact');
});

test('HTML, attributes, and JSON script contexts escape content safely', async () => {
  const data = publicData();
  data.profile.name = 'A < B & "C" </script><script>alert(1)</script>';
  data.projects[0].details[0].text = 'Use **typed inputs** and <img src=x onerror=alert(1)>.';
  const { html } = await renderSite(data);
  assert.ok(!html.includes('<script>alert(1)</script>'));
  assert.ok(!html.includes('<img src=x'));
  assert.ok(html.includes('<strong>typed inputs</strong>'));
  assert.ok(html.includes('&lt;img src=x'));
  assert.equal(schema(html)['@graph'].find((n) => n['@type'] === 'Person').name, data.profile.name);
});

test('unconfigured previews do not fabricate a canonical URL or advertise indexing', async () => {
  const data = structuredClone(base);
  data.site.url = null;
  data.site.indexable = false;
  const result = await renderSite(data);
  assert.ok(result.html.includes('name="robots" content="noindex, nofollow"'));
  assert.ok(!result.html.includes('rel="canonical"'));
  assert.equal(result.sitemap, null);
  assert.ok(result.robots.includes('Disallow: /'));
  assert.ok(!result.html.includes('https://example.com'));
  assert.throws(() => validateData(data, { production: true }), /public.*URL|indexable/i);
});

test('invalid URLs, duplicate project IDs, bad dates and incomplete content fail clearly', () => {
  for (const url of ['javascript:alert(1)', 'http://example.com', 'https://user:pass@example.com', 'https://example.com/path?x=1', 'https://localhost']) {
    const data = publicData(); data.site.url = url;
    assert.throws(() => validateData(data), /site.url/);
  }
  const badLink = publicData(); badLink.profile.socials[0].url = 'javascript:alert(1)';
  assert.throws(() => validateData(badLink), /socials/);
  const duplicate = publicData(); duplicate.projects.push(structuredClone(duplicate.projects[0]));
  assert.throws(() => validateData(duplicate), /duplicate/i);
  const badDate = publicData(); badDate.experience[0].startDate = '2024-13';
  assert.throws(() => validateData(badDate), /startDate/);
  const missing = publicData(); delete missing.projects[0].description;
  assert.throws(() => validateData(missing), /projects.*description/);
});

test('subdirectory hosting uses one canonical base for all discovery assets', async () => {
  const data = publicData(); data.site.url = 'https://portfolio.test/about';
  const result = await renderSite(data);
  assert.ok(result.html.includes('href="https://portfolio.test/about/"'));
  assert.ok(result.html.includes('content="https://portfolio.test/about/social-card.png"'));
  assert.ok(result.sitemap.includes('<loc>https://portfolio.test/about/</loc>'));
  assert.ok(result.robots.includes('https://portfolio.test/about/sitemap.xml'));
});

test('social card is a real 1200 × 630 PNG', () => {
  const png = createSocialCard(base);
  assert.equal(png.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
  assert.equal(png.readUInt32BE(16), 1200);
  assert.equal(png.readUInt32BE(20), 630);
  assert.ok(png.length > 1000);
});
