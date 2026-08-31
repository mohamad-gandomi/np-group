# Journal verification — 2026-08-31

## Passed

- ESLint and whitespace checks.
- Production compilation and TypeScript checks.
- Pre-rendered `/blog` and all four article routes, confirmed in the build output and prerender manifest.
- A separate build with non-secret test Supabase settings and `https://example.com` as the canonical origin: editorial pages remained static, account pages became dynamic, and all five generated-HTML tests passed.
- Five generated-HTML regression tests on the final build: crawlable index links, one H1 per page, full article prose, consistent canonical/description/Open Graph metadata, author and date visibility, JSON-LD, valid contents anchors, and sitemap entries with content dates and images.
- Earlier live HTTP suite: all article routes returned 200 with static cache hits and no session cookies; Googlebot received the public article; missing posts returned 404/noindex; account and saved-product routes redirected to login with their return paths intact.
- Desktop (1440px) and mobile (390px) browser review of index and article layouts. No horizontal page overflow; the comparison table scrolls within its own region.
- Topic filtering, text search, empty-state reset, desktop/mobile contents navigation, and copy-link feedback worked in the browser.
- Normal index/article interactions produced no browser warnings or errors during inspection.

## Final check completed with projects/brands

The final live journal suite now passes all seven tests, including Googlebot, OAI-SearchBot, bingbot, article static cache hits, no session cookies, and protected account redirects.

A stricter missing-page test exposed that the earlier check could accept Persian text inside serialized data even when the browser recovery was blank. Section-level boundaries repaired the browser rendering, but the response without JavaScript still lacked visible content. The final implementation uses `dynamicParams = false` with a shared, statically rendered Persian `app/not-found.tsx`. Unknown article URLs return 404/noindex with visible recovery text and a link to `/blog` in the initial HTML. The test removes script contents before asserting the message. The same recovery page serves unknown project and brand URLs.

The production preview is running at `http://127.0.0.1:3100`. The earlier permission timeout no longer blocks verification.

## Limits and launch work

- No live deployment, search-console submission, or remote crawler/firewall validation was performed.
- Local static rendering and browser checks do not establish real-user Core Web Vitals or guarantee rankings or AI citations.
- The article-specific JavaScript chunk is approximately 1.3 KiB gzipped; the index-specific chunk is approximately 1.7 KiB. These figures exclude shared Next.js and storefront bundles; total initial article JavaScript is approximately 271 KiB gzipped.
- The four articles are starter copy. Review editorial attribution, actual publication dates, imagery rights, and the production HTTPS domain before release.
