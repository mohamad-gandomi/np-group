# Projects and brands verification — 2026-08-31

## Passed

- ESLint, TypeScript, production build, and `git diff --check`.
- All 11 new routes are pre-rendered: two directories, three project concepts, and six brand profiles.
- Twelve generated-output tests verify one H1, canonical/description/Open Graph/Twitter metadata, JSON-LD, unique HTML IDs, valid anchors, linked content routes, visible demo disclosures, noindex, sitemap exclusion, and product-to-brand navigation.
- Live showcase suite: 13/13 tests passed. Every new route returned 200 with a static cache hit and no auth session cookie. Googlebot, OAI-SearchBot and bingbot received the same demo noindex policy. Missing project and brand URLs returned 404/noindex with Persian recovery text and directory links in actual HTML.
- Live journal regression suite: 7/7 tests passed, including public article/crawler responses, static output, Persian missing-page HTML, and unauthenticated account/saved-route redirects.
- Separate build with non-secret test Supabase settings and `https://example.com` as the canonical origin passed all 12 showcase output tests. Editorial/showcase routes remained static while account routes became dynamic.
- Browser review at desktop widths (1264/1440px) and mobile width (390px): project and brand indexes, project narratives and brand collections. No horizontal document overflow in inspected states.
- Project sector filters, brand category filters, text search, accent-insensitive `meridien` lookup, empty-state recovery, directory-to-detail navigation, and mobile section anchors worked. Active controls have visible focus indicators.
- No warnings or errors in inspected normal project/brand browser interactions. Images and captions were visually checked against existing assets.

## Recovery-page correction

Next.js 16.3.2 initially returned 404 with the localized fallback only in serialized data, leaving an empty HTML error shell. Section-level boundaries fixed the JavaScript browser experience but not the no-JavaScript response. These file-backed routes now use `dynamicParams = false` and a shared, statically rendered Persian `app/not-found.tsx`. Unknown URLs receive useful HTML with links to projects, brands, and the journal. Tests inspect HTML with scripts removed, so serialized content alone cannot satisfy them.

## Performance scope

- No new runtime dependencies. Full project/brand content is server-rendered; only the directory explorer and existing store controls hydrate.
- Each directory-specific page chunk is approximately 1.6 KiB gzipped, excluding shared framework/storefront code. This is not the total JavaScript transfer size.
- Responsive Next Image sizing, fixed aspect ratios, lazy gallery/product images, local fonts, and public proxy bypass are in place.
- Local tests do not establish field Core Web Vitals, production CDN/firewall behavior, rankings, or AI recommendations.

## Release requirements

- Replace demo content and catalog imagery; verify image licensing, project authorship/credits, real brand identity and relationships.
- Set the production HTTPS origin, review visible descriptions and metadata, record content approval, then enable publication/indexing through the publication model.
- Review the rendered output after publication; tests currently intentionally expect the demo records to be noindex.
- No deployment or Git push was performed for this feature. The local preview runs on port 3100.

## Requested layout revision

- Removed the full-width demo notice blocks from project and brand indexes/details. Contextual content labels and the noindex/sitemap policy remain unchanged.
- Project directory cards now have equal dimensions and aligned row starts; the alternating vertical offset is removed.
- Inner brand names inherit RTL alignment while preserving Latin letter order through `bdi`.
- Product, related-project, related-brand and inspiration-image groups on inner pages now use native RTL scroll-snap sliders, with responsive card sizes, keyboard-focusable tracks, labelled arrows, boundary disabling, and reduced-motion support. All cards remain in the initial HTML; controls hide when all cards fit.
- Production build, lint, whitespace checks and all 17 generated-output regression checks passed after the revision.
- Browser checks at 1440px and 390px confirmed matching project image dimensions, aligned first-row positions, RTL brand heading alignment, mobile slider sizing, forward/backward movement and boundary states, no page overflow, and no browser errors in inspected interactions.
