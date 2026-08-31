# Projects and brands — research and build plan

Date: 2026-08-31. Extends the existing Persian RTL storefront and journal.

## Research

- [Fritz Hansen reference projects](https://www.fritzhansen.com/en/inspiration/projects) connect interiors with product selection and project assistance. [Hotel Odeon](https://www.fritzhansen.com/en/inspiration/projects/hotel-odeon) separates the design narrative from factual credits and specifies relevant furniture. Apply the narrative/product connection; do not invent client names, credits, locations, dates, or completed work.
- [Finnish Design Shop brands directory](https://www.finnishdesignshop.com/en-ee/brands.php) provides direct discovery by brand name. Use legible names, search and category discovery, then focused product collections. The directory was available in search results; its full interactive experience was not audited.
- [Google structured-data policies](https://developers.google.com/search/docs/appearance/structured-data/sd-policies) require visible, representative, accurate information. Do not claim official partnerships, reviews, awards, or brand credentials without verification.
- [Schema.org Brand](https://schema.org/Brand) describes a product-labeling identity. Use it only for confirmed brands; demo profiles remain WebPage objects, explicitly described as examples. Project concepts can be described as CreativeWork without attributing real execution to NP.
- Follow the journal's discovery research: readable initial HTML, useful descriptive sections, crawlable internal links, canonical URLs, and truthful structured data support discovery. No special schema or file guarantees chatbot recommendations. Demo content must not compete in search.
- Implementation references: installed Next.js guides for metadata, static params, JSON-LD, Image (responsive sizes, preload instead of deprecated priority), and proxy.

## Decisions

1. Four routes: `/projects`, `/projects/[slug]`, `/brands`, `/brands/[slug]`. Build static pages; only search/filter controls hydrate. Unknown slugs return a localized 404.
2. Projects: quiet editorial masthead, large hospitality feature, asymmetric image grid, sector filter/search, and detail pages with a concise brief, design considerations, inspiration imagery, suggested catalog products, related reading, and consultation links. No lightbox or carousel dependency.
3. Brands: typographic directory with a visual introduction, category/search controls, six profiles based on existing catalog names, actual catalog counts/categories, and related products/concepts. Wordmarks are typography, not claimed official logos.
4. Shared warm paper, dark ink, wine accents, generous RTL spacing, strong focus states, reduced motion, responsive images, and comfortable reading widths. Avoid fake metrics and unimplemented forms.
5. Current catalog is mock data; no verified projects or brand permissions were supplied. All initial profiles/concepts are visibly labeled demo, `noindex, follow`, and excluded from the sitemap. Robots.txt must still allow crawling so noindex can be seen. Publication requires confirmed content/imagery and a recorded approval timestamp and evidence; approval is a content governance step, not an SEO guarantee.
6. When confirmed records exist, directories show published records only and become indexable. Their schema and sitemap use the same selection. Demo routes remain directly previewable but noindex. Do not fabricate update dates.
7. Add canonical, Open Graph/Twitter, breadcrumbs, CollectionPage/ItemList, and appropriate detail schema. Escape JSON-LD. Avoid product offer/review schema for concept suggestions.
8. Connect home, header, footer, product-brand links, project suggestions, brand collections, and journal reading. Public proxy bypass avoids auth roundtrips without changing account protection.

## Validation and launch

- Lint/build, verify static routes, full initial HTML, one H1, unique metadata, structured data, demo disclosures/noindex/sitemap exclusion, valid referenced products, localized 404 and crawler responses.
- Exercise filters/search/empty recovery, navigation and responsive layouts in the browser; check images, overflow and console errors. Recheck the pending journal 404.
- Before indexing: replace mock catalog and concept imagery, verify image rights and real project credits, approve brands/relationships, set production HTTPS origin, then review the publication record. Deployment and Search Console/Bing ownership remain external steps.
