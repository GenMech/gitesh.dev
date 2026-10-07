# Data-driven portfolio

Preserve the approved single-page design, neutral charcoal palette, yellow/mint accents, experience-first order, exact intro, snake logo, and byte controls. Generate HTML at build time rather than loading personal data in the browser.

## Implementation

1. Extract content into `data/profile.json`, `experience.json`, `projects.json`, `toolkit.json`, `copy.json`, `site.json`, and `theme.json`. Source UI and assets live in `src/`; `dist/` becomes generated output.
2. Add a dependency-free Node renderer and validator. Escape all content and reject unsafe URLs, invalid IDs, and incomplete production configuration. Drive contact, dates, controls, and structured data from the same source.
3. Generate page metadata, Person/ProfilePage/WebSite and project JSON-LD, robots.txt, sitemap.xml when a canonical URL is configured, a social PNG, and optional llms.txt/profile.md. Do not fabricate public URLs or enable indexing of an unconfigured preview.
4. Add build/dev/preview scripts and editing/deployment documentation. Keep static hosting portable.
5. Test data propagation, HTML escaping, structured data consistency, URL validation, production gating, sitemap/robots behavior, generated social image, existing byte/snake behavior, and standalone preview integrity. Browser execution remains subject to available tooling and sandbox permissions.

## Search scope

GEO here means generative engine optimization; AEO means answer engine optimization. Use readable factual content and consistent entity information, not hidden keyword text or unsupported ranking claims. A public crawlable host and domain are required for indexing; a local/private preview cannot establish rankings or AI visibility. No custom domain is assumed.
