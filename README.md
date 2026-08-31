# NPGroup Storefront

A Persian RTL furniture and interiors storefront built with Next.js, React, TypeScript, and Tailwind CSS. Includes a filterable catalog, product pages, cart, checkout, phone OTP login, and account pages backed by Supabase when configured.

## Run locally

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Production verification:

```bash
npm run lint
npm run build
```

## Configuration

- Set `NEXT_PUBLIC_SITE_URL` to the final HTTPS domain for metadata and sitemap URLs.
- Configure `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and the server-only `SUPABASE_SECRET_KEY` for authentication and order persistence.
- Apply `supabase/migrations/20260829000000_account_dashboard.sql` to your Supabase database.
- The SMS hook is in `supabase/functions/send-sms/index.js`. Its Kavenegar and webhook secrets belong in the Supabase function environment.
- Without Supabase, `npm run dev` supports a local demo login using OTP `123456`. This fallback is disabled in production, and demo orders are not persisted.
- Keep real credentials in ignored environment files. Commit only the blank `.env.example` template.

## Content to replace

- Shared contact details are in `src/config/site.ts`. Store address, phone and hours were checked against the supplied Google Maps listing on 2026-08-31; see `docs/contact-verification.md`. The existing email remains unverified. Review brand copy in `src/app/page.tsx` and `src/components/layout/` before launch.
- Temporary editorial images live in `public/placeholders`.
- The hero video is in `public/videos/hero.mp4`.

Product, project, brand, and editorial content currently use static fixtures. Checkout creates order requests; payment processing still requires integration.

## Contribution checks

Run `npm run lint` and `npm run build` before pushing. Keep commits focused and use Conventional Commit messages such as `feat: add catalog filters`, `fix: validate checkout input`, or `docs: update setup instructions`.

## Journal

The Persian journal lives at `/blog`, with static article pages at `/blog/[slug]`. Content is maintained in `src/features/journal/posts.ts`; each entry contains its URL slug, category, real publication/update dates, image description, summary, sections, and related articles. Reading time is calculated from the content. No CMS or additional runtime dependency is required.

Search and topic filters enhance the index; full article text and links render on the server. Article metadata, JSON-LD, homepage links, and sitemap entries use the same content source. The public header does not read auth cookies, and blog requests skip session refresh; account pages and order APIs retain their existing authentication checks.

Review the starter editorial copy and existing placeholder imagery before publishing. Set `NEXT_PUBLIC_SITE_URL` before a production build, then submit the sitemap and validate live URLs with search tools. See `docs/blog-plan.md` for research sources, design decisions, and launch checks. Search rankings and AI citations are not guaranteed by technical SEO.

After building, run `npm run test:journal` to verify the generated article HTML, metadata, internal anchors, and sitemap. With a production server running, `JOURNAL_TEST_URL=http://127.0.0.1:3100 npm run test:journal` also checks HTTP status codes, crawler access, static responses, and account redirects.

## Projects and brands

`/projects` and `/brands` are static directories with searchable, filterable cards. Their detail pages connect design ideas, catalog products, brand collections, and journal reading. Content lives in `src/features/showcase/data.ts`; client-safe brand names and product links live in `brand-registry.ts`. No new runtime dependencies were added.

All initial projects and brands are **demo content**. They retain contextual concept labels and captions, return `noindex, follow`, and are omitted from the sitemap. The full-width demo notice banners were removed at the user’s request. Images are inspiration/catalog placeholders, not evidence of completed NP work or brand partnerships. Do not change a record to `published` until its copy, imagery rights, credits and relationships have been confirmed. The publication type requires `updatedAt`, `verification.approvedAt`, and `verification.evidence` (an internal reference, never credentials or personal data). These fields record editorial review; they cannot verify it automatically. Remove demo-specific wording and replace placeholder products before publishing.

Directories show published entries once any exist; otherwise they remain demo previews. Metadata, structured lists and sitemap inclusion follow the same publication selection. The public proxy bypass covers blog, projects and brands only; account and order protection is unchanged.

Run `npm run test:showcase` after building. To add live status/crawler/404 checks: `SHOWCASE_TEST_URL=http://127.0.0.1:3100 npm run test:showcase`. The current regression fixtures intentionally expect demo/noindex output; update those expectations when real content is approved. See `docs/projects-brands-plan.md` for research and launch requirements.

File-backed blog, project and brand details use `dynamicParams = false`: adding a record requires a rebuild. Unknown slugs use the shared Persian `src/app/not-found.tsx`, which renders useful recovery links even without JavaScript. See `docs/projects-brands-verification.md` for the completed checks and remaining launch work.
