# Gitesh Pareek — developer portfolio

The approved dark, single-page portfolio, with a three-block snake logo, live byte counter, and interactive bit playground. Profile content is generated into HTML at build time: no client-side content fetch, framework, runtime dependency, external font, analytics, or API key is needed.

**Requires Node.js 22 or newer.** No installation is needed for the build, development server, or unit tests.

## Run locally

```sh
npm run dev
```

Open http://127.0.0.1:4173. The server watches `data/` and `src/`, rebuilds after changes, and prints when to refresh your browser. Set `PORT` to use another port.

For a self-contained preview that opens directly from disk:

```sh
npm run preview:export
```

Open `.local/portfolio-preview.html`. Regenerate it after edits. Clipboard access depends on the browser's file policy; the email link always remains available.

## Edit content

**Edit `data/` and `src/`. Do not edit `dist/` or `.local/portfolio-preview.html`: these are generated and overwritten.**

| File | What to update |
| --- | --- |
| `data/profile.json` | Name, role, introduction, biography, location/time zone, email, social links, education, achievements, contact copy |
| `data/experience.json` | Employers, roles, dates, highlights; `endDate: null` means current |
| `data/projects.json` | Ordered projects, summaries, descriptions, technologies, implementation details, optional repo/demo links |
| `data/toolkit.json` | Ordered skill categories and their tools |
| `data/copy.json` | Navigation, section labels, footer, playground labels, animation and clipboard messages |
| `data/theme.json` | Neutral backgrounds, text, borders, and accent colors |
| `data/site.json` | Public URL, indexing, search/social descriptions, content update date, optional webmaster verification tokens |

Array order determines display order. Add another experience or project by copying an existing object and assigning a unique lowercase `id`. Dates use `YYYY-MM`; `updatedAt` uses `YYYY-MM-DD`. Detail/highlight text supports `**bold**`; arbitrary HTML is escaped. Keep `updatedAt` aligned with actual content changes.

Metadata supports `{name}`, `{role}`, `{city}`, and `{country}`, so identity edits propagate automatically. An email edit also updates the clipboard action; project edits update structured data and the plain-text profile.

Add a project link without editing the renderer:

```json
"links": [
  { "label": "Source code", "url": "https://github.com/OWNER/REPOSITORY", "kind": "repository" },
  { "label": "Live demo", "url": "https://YOUR-DEPLOYED-SITE", "kind": "demo" }
]
```

Replace these illustrative URLs with verified real links. The current data intentionally omits unknown repository, demo, and LinkedIn URLs. The phone number is not published.

## Edit the design or behavior

- `src/render.mjs`: page components and structure.
- `src/assets/styles.css`: layout, typography, responsive rules; colors come from `data/theme.json`.
- `src/assets/main.js`: DOM behavior using generated configuration.
- `src/assets/byte.mjs` and `logo-snake.mjs`: pure interaction logic.
- `src/partials/logo.html`: pixel G and snake SVG.
- `src/data.mjs`: content validation.
- `src/seo.mjs`: metadata, JSON-LD, crawler files, and text exports.
- `src/social-card.mjs`: data-driven 1200 × 630 PNG using a built-in pixel alphabet.

## Build and publish

`npm run build` generates the static site in `dist/`.

The current configuration is a **non-indexable preview** because the public domain has not been chosen. Before public launch, update `data/site.json`:

```json
"url": "https://YOUR-REAL-DOMAIN/",
"indexable": true
```

Then run:

```sh
npm run build:production
```

This fails clearly if the public URL or indexing configuration is incomplete. Upload **only `dist/`** to a static host. On hosts with a build configuration, use Node 22+, build command `npm run build:production`, and output directory `dist`. No runtime server or environment secrets are needed.

Local `.openai/hosting.json` retains the existing owner-private Sites project and is excluded from Git. It is not needed for GitHub/Vercel deployment. Changing `indexable` does not make a private host public. Do not deploy an indexable build to an owner-private URL and expect discovery.

## Search and AI discovery

The build generates semantic HTML, title/description, canonical and social URLs, an Open Graph/Twitter PNG, a consistent Person/ProfilePage/WebSite/project JSON-LD graph, `robots.txt`, and (for indexable builds) `sitemap.xml`. Optional `llms.txt` and `profile.md` mirror source content and are not treated as ranking guarantees.

See [the search and launch guide](docs/search-and-launch.md) for configuration, current limits, and official guidance.

## Verification

```sh
npm test
npm run check
npm run preview:export
```

Unit checks cover data propagation and escaping, invalid configuration, discovery files, social PNG output, all byte values, and snake behavior. `check` validates content, source syntax, and referenced theme tokens.

Optional real-browser tests use Playwright and an installed Google Chrome:

```sh
npm install -D @playwright/test
npm run test:browser
```

Browser tests include desktop/mobile layouts, keyboard controls, reduced motion, copy fallback, and JavaScript-disabled content. Screenshots go to `.local/`.

Verified in this session: build, 16 unit tests, source checks, standalone bundling, static HTML checks, and the generated social card. Browser tests could not run because Playwright is not installed and npm registry access was unavailable. This sandbox also denied local server binding and Sites Git metadata writes. No public deployment or search indexing has been verified.
