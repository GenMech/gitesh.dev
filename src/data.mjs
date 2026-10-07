import { readFile } from 'node:fs/promises';

export const ROOT = new URL('../', import.meta.url);
export const DATA_FILES = ['site', 'profile', 'experience', 'projects', 'toolkit', 'copy', 'theme'];

export async function loadData(root = ROOT) {
  const entries = await Promise.all(DATA_FILES.map(async (name) => {
    try { return [name, JSON.parse(await readFile(new URL(`data/${name}.json`, root), 'utf8'))]; }
    catch (error) { throw new Error(`data/${name}.json: ${error.message}`); }
  }));
  return Object.fromEntries(entries);
}

function fail(path, message) { throw new Error(`${path}: ${message}`); }
function object(value, path) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail(path, 'must be an object');
}
function text(value, path, empty = false) {
  if (typeof value !== 'string' || (!empty && !value.trim())) fail(path, 'must be a nonempty string');
}
function fields(value, path, names, empty = false) {
  object(value, path);
  for (const name of names) text(value[name], `${path}.${name}`, empty);
}
function list(value, path, check, allowEmpty = false) {
  if (!Array.isArray(value) || (!allowEmpty && !value.length)) fail(path, 'must be an array with at least one item');
  value.forEach((item, i) => check(item, `${path}[${i}]`));
}
function month(value, path) {
  if (typeof value !== 'string' || !/^\d{4}-(0[1-9]|1[0-2])$/.test(value)) fail(path, 'use YYYY-MM');
}
function url(value, path, canonical = false) {
  let parsed;
  try { parsed = new URL(value); } catch { fail(path, 'must be an absolute HTTPS URL'); }
  if (parsed.protocol !== 'https:' || parsed.username || parsed.password) fail(path, 'must be HTTPS without embedded credentials');
  if (canonical && (parsed.search || parsed.hash || parsed.port || !parsed.hostname.includes('.') || /^(localhost|127\.|0\.|\[::1\])/.test(parsed.hostname))) {
    fail(path, 'must be a public HTTPS URL without query, fragment, port, or local host');
  }
}
function links(value, path) {
  list(value, path, (link, p) => {
    fields(link, p, ['label', 'url']); url(link.url, `${p}.url`);
    if (link.kind !== undefined && !['repository', 'demo', 'website'].includes(link.kind)) fail(`${p}.kind`, 'use repository, demo, or website');
    if (link.icon !== undefined && !['github', 'external'].includes(link.icon)) fail(`${p}.icon`, 'use github or external');
  }, true);
}

export function canonicalUrl(site) {
  if (!site.url) return null;
  return `${site.url.replace(/\/+$/, '')}/`;
}

export function validateData(data, { production = false } = {}) {
  for (const key of DATA_FILES) if (data[key] === undefined) fail(key, 'missing data file');
  const { site, profile, experience, projects, toolkit, copy, theme } = data;
  fields(site, 'site', ['title', 'description', 'socialDescription', 'socialImageAlt', 'language', 'locale', 'updatedAt']);
  if (!/^[a-z]{2}(?:-[A-Z]{2})?$/.test(site.language)) fail('site.language', 'use a language code such as en');
  if (typeof site.indexable !== 'boolean') fail('site.indexable', 'must be true or false');
  if (site.url !== null) url(site.url, 'site.url', true);
  if ((site.indexable || production) && !site.url) fail('site.url', 'a public HTTPS URL is required to enable indexing or build for production');
  if (production && !site.indexable) fail('site.indexable', 'must be true for an indexable production build');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(site.updatedAt) || !Number.isFinite(Date.parse(site.updatedAt)) || new Date(site.updatedAt).toISOString().slice(0, 10) !== site.updatedAt) fail('site.updatedAt', 'use a real YYYY-MM-DD date');
  fields(site, 'site', ['googleSiteVerification', 'bingSiteVerification'], true);
  fields(profile, 'profile', ['name', 'role', 'handle', 'intro', 'email']);
  if (!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(profile.email)) fail('profile.email', 'must be an email address');
  fields(profile.brand, 'profile.brand', ['initial', 'name', 'suffix']);
  fields(profile.location, 'profile.location', ['city', 'country', 'countryCode', 'timeZone', 'utcLabel']);
  try { new Intl.DateTimeFormat('en', { timeZone: profile.location.timeZone }); } catch { fail('profile.location.timeZone', 'must be an IANA time zone'); }
  list(profile.description, 'profile.description', text);
  links(profile.socials, 'profile.socials');
  fields(profile.contact, 'profile.contact', ['comment', 'title', 'description']);
  list(profile.education, 'profile.education', (entry, path) => {
    fields(entry, path, ['degree', 'institution', 'location', 'score', 'scoreLabel']);
    month(entry.startDate, `${path}.startDate`); month(entry.endDate, `${path}.endDate`);
    if (entry.endDate < entry.startDate) fail(path, 'endDate must follow startDate');
  });
  list(profile.achievements, 'profile.achievements', (entry, path) => fields(entry, path, ['icon', 'value', 'label', 'context']));
  const ids = new Set();
  const id = (value, path) => {
    if (typeof value !== 'string' || !/^[a-z][a-z0-9-]*$/.test(value)) fail(path, 'use a lowercase slug');
    if (ids.has(value)) fail(path, 'duplicate ID');
    ids.add(value);
  };
  const detail = (entry, path) => { fields(entry, path, ['text']); text(entry.lead, `${path}.lead`, true); };
  list(experience, 'experience', (entry, path) => {
    fields(entry, path, ['company', 'role', 'location']); id(entry.id, `${path}.id`);
    month(entry.startDate, `${path}.startDate`);
    if (entry.endDate !== null) { month(entry.endDate, `${path}.endDate`); if (entry.endDate < entry.startDate) fail(path, 'endDate must follow startDate'); }
    list(entry.highlights, `${path}.highlights`, detail);
  });
  list(projects, 'projects', (entry, path) => {
    fields(entry, path, ['name', 'summary', 'description']); id(entry.id, `${path}.id`);
    list(entry.technologies, `${path}.technologies`, text);
    list(entry.languages, `${path}.languages`, text, true);
    list(entry.details, `${path}.details`, detail);
    text(entry.detailNote, `${path}.detailNote`, true); links(entry.links, `${path}.links`);
  });
  list(toolkit, 'toolkit', (entry, path) => { fields(entry, path, ['category']); list(entry.items, `${path}.items`, text); });
  fields(copy, 'copy', ['skipLink', 'navigationLabel', 'contactLink', 'backToTop', 'present', 'projectDetails', 'technologiesLabel', 'footer']);
  list(copy.navigation, 'copy.navigation', (entry, path) => {
    fields(entry, path, ['target', 'label']);
    if (!['experience', 'projects', 'stack', 'playground', 'background', 'contact'].includes(entry.target)) fail(`${path}.target`, 'unknown section');
    if (entry.icon !== undefined) text(entry.icon, `${path}.icon`);
  });
  for (const section of ['experience', 'projects', 'stack', 'playground', 'background']) {
    fields(copy.sections?.[section], `copy.sections.${section}`, ['title']);
    text(copy.sections[section].note, `copy.sections.${section}.note`, true);
  }
  for (const [key, names] of Object.entries({
    logo: ['staticLabel', 'pause', 'resume', 'hint', 'caption'],
    counter: ['label', 'tickNote', 'pause', 'resume', 'pauseLabel', 'resumeLabel', 'valueLabel'],
    playground: ['title', 'description', 'badge', 'legend', 'bitLabel', 'decimal', 'hex', 'ascii', 'presetLabel', 'invert', 'reset', 'noScript', 'caption'],
    clipboard: ['label', 'copiedLabel', 'success', 'failure'],
  })) fields(copy[key], `copy.${key}`, names);
  object(theme, 'theme');
  for (const key of ['bg', 'surface', 'surface-low', 'surface-raised', 'border', 'border-strong', 'text', 'text-soft', 'muted', 'subtle', 'accent', 'accent-muted', 'secondary', 'secondary-dim', 'signal', 'active-bg', 'active-border', 'active-text', 'code']) {
    if (!/^#[0-9a-f]{6}$/i.test(theme[key])) fail(`theme.${key}`, 'use a six-digit hex color');
  }
  for (const [key, value] of Object.entries(theme)) if (!/^[a-z][a-z-]*$/.test(key) || !/^#[0-9a-f]{6}$/i.test(value)) fail('theme', 'keys must be CSS token names and values six-digit hex colors');
  return data;
}
