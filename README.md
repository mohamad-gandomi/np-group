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

- Brand and contact placeholders are in `src/config/site.ts`, `src/app/page.tsx`, and `src/components/layout/`.
- Temporary editorial images live in `public/placeholders`.
- The hero video is in `public/videos/hero.mp4`.

Product, project, brand, and editorial content currently use static fixtures. Checkout creates order requests; payment processing still requires integration.

## Contribution checks

Run `npm run lint` and `npm run build` before pushing. Keep commits focused and use Conventional Commit messages such as `feat: add catalog filters`, `fix: validate checkout input`, or `docs: update setup instructions`.
