# NP Group journal: research and implementation plan

Prepared 2026-08-31. Scope: a Persian editorial index at `/blog` and full articles at `/blog/[slug]`.

## Research findings

- Google applies its normal search requirements to AI Overviews and AI Mode. Indexable text, internal links, good page experience, and structured data consistent with visible content matter. There is no special AI schema or required AI text file, and neither indexing nor citations are guaranteed. Source: https://developers.google.com/search/docs/appearance/ai-features
- `BlogPosting` supports descriptive headlines, representative images, identifiable authors, and actual publication/modification timestamps. Schema must describe what readers actually see. Source: https://developers.google.com/search/docs/appearance/structured-data/article
- Performance targets: LCP <= 2.5 s, INP < 200 ms, CLS < 0.1. Local checks are diagnostic; real-user data after deployment is needed to establish field performance. Source: https://developers.google.com/search/docs/appearance/core-web-vitals
- The installed Next.js 16.3.2 guides recommend Server Component metadata, `generateStaticParams` with awaited params, native JSON-LD scripts with `<` escaped, and responsive `next/image` assets.
- OpenAI's bots documentation could not be retrieved during research because of repeated TLS timeouts. Do not infer a citation guarantee or silently change AI training permissions. The existing wildcard crawler permission already permits public article URLs; validate individual search agents and hosting firewall behavior before launch.

## Decisions

1. Use typed repository content initially, with no new runtime packages or CMS dependency. Keep content separate from rendering so a CMS can be added later.
2. Pre-render the index and all article pages. Keep full prose, metadata, links, and JSON-LD in initial HTML; unknown slugs return a genuine 404.
3. Remove the shared header's request-time user lookup. Public account links lead to the already protected account routes, which still handle login redirects. This avoids making editorial pages dynamic when Supabase is configured. Keep authentication and authorization on protected routes and APIs.
4. Public `/blog` requests do not need session refresh. Skip the auth proxy for that exact path and its children, without broadening any protected route access.
5. Preserve the brand's Ravi font, ink/red palette, and square detailing, with a warm paper background, large images, restrained motion, and generous line spacing.
6. Index: editorial masthead, featured article, accessible topic/search controls, article cards, and an editorial note. No endless scrolling, fake engagement counts, or subscription form without a backend.
7. Article: breadcrumbs, category, title, description, visible author/date/read time, image with caption, quick answer, anchored contents, readable sections, optional comparison/checklist, related articles, and copy/share tools. Reading remains possible without JavaScript.
8. SEO: self-canonical URLs, unique metadata, Open Graph/Twitter images, `BlogPosting`/`BreadcrumbList` JSON-LD, `CollectionPage` for the index, article sitemap entries with actual content dates, and crawlable home/header/footer links.
9. AI discovery: use clear question-led sections, concise summaries, truthful editorial authorship, and useful original content. Do not add `llms.txt`, fabricated expertise, keyword stuffing, or promise AI recommendations.
10. Use four starter editorial drafts to demonstrate the complete experience. Review copy and image rights before public release. No fabricated human author, research citations, product testing, or external credentials.

## Verification

- Lint and production build; confirm static blog output even with Supabase environment variables set.
- Inspect initial HTML for full prose, one H1, canonical, description, image metadata, structured data, and matching dates/authors.
- Check every post URL, missing-slug 404, image loading, sitemap entries, and crawler responses.
- Exercise search, topic selection, empty-state recovery, table-of-contents links, and copy-link feedback.
- Inspect desktop/mobile layouts, keyboard focus, contrast, reduced-motion handling, and horizontal overflow.
- Compare authenticated-route protection after the public header/proxy changes.

## Launch checklist

- Set `NEXT_PUBLIC_SITE_URL` to the real HTTPS origin before building. Localhost URLs are only development defaults.
- Approve editorial copy, dates, attribution, and licensed imagery; add real expertise and project photography as available.
- Confirm hosting/CDN allow search crawling and do not add `noindex` or authentication to public articles.
- Verify Google Search Console/Bing Webmaster ownership, submit the sitemap, and inspect representative URLs and rich results.
- Measure field Core Web Vitals and search/referral performance after deployment. These external setup steps are not implied by a local build.
