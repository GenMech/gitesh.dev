# Search, answer engines, and public launch

## What is implemented

- All professional content is present in the initial HTML, including expandable project details. JavaScript enhances the page but is not needed to read it.
- One descriptive H1, ordered semantic sections, stable project anchors, accessible links, and real heading text.
- Configurable title and description; metadata identity tokens resolve from the profile data.
- Canonical URL and consistent absolute social URLs when `site.url` is configured.
- Open Graph and Twitter card metadata plus a generated 1200 × 630 PNG. Inspect `dist/social-card.png` after editing the profile. The included pixel alphabet is designed for the current English-language content.
- `Person`, `ProfilePage`, `WebSite`, and `SoftwareSourceCode` entities generated from the same data as the visible page. No invented reviews, ratings, customer counts, FAQs, or project URLs.
- Public `robots.txt` and a single-page sitemap with the actual content-update date. Preview mode explicitly disables indexing and omits the sitemap.
- Optional Markdown profile and `llms.txt` for consumers that use them. These repeat the visible facts rather than adding hidden promotional claims.

## GEO and AEO

Here GEO means generative engine optimization, and AEO means answer engine optimization. The implementation emphasizes accessible source text, specific engineering evidence, stable identity links, and consistent machine-readable data.

Google says its AI search features use the same underlying SEO practices and do not require special AI markup or machine-readable files. Structured data should agree with visible content. [Google AI features guidance](https://developers.google.com/search/docs/appearance/ai-features)

`ProfilePage` connects the portfolio to its named person; it does not promise a search enhancement. [Google profile-page guidance](https://developers.google.com/search/docs/appearance/structured-data/profile-page)

The project entities describe source-code projects and known technologies. Repository URLs are included only when supplied in project links. [Schema.org SoftwareSourceCode](https://schema.org/SoftwareSourceCode)

## Before public launch

1. Set the actual HTTPS domain in `data/site.json` and set `indexable` to `true`. Run `npm run build:production` and deploy `dist/` to that public origin.
2. Confirm that the home page, social image, robots.txt, and sitemap.xml return successfully without login or hosting-level crawler blocks. If hosting under a subdirectory, publish robots.txt at the domain root; crawlers do not use a subdirectory robots.txt.
3. Verify domain ownership in Google Search Console and Bing Webmaster Tools. The optional verification tokens in `site.json` add their HTML metadata. Submit `/sitemap.xml`, inspect the deployed URL, and validate its structured data.

Robots.txt controls crawling; it is not an access-control mechanism. A public build must be accessible to crawlers, and a private Sites audience must be changed deliberately through hosting controls before search discovery is possible. [Google robots.txt guidance](https://developers.google.com/search/docs/crawling-indexing/robots/intro)

Search indexing, rankings, and inclusion in AI-generated answers are external outcomes. They cannot be verified from a local file or guaranteed by metadata. This work prepares the site for discovery; the public URL and successful deployment remain required.
