# NPGroup Storefront

A Persian RTL furniture and interiors storefront built with Next.js, React, TypeScript, Tailwind CSS, Payload CMS/Ecommerce, PostgreSQL, and the existing incremental Supabase integration.

## Project development context

Before making architecture, Payload, catalog, or commerce changes, read:

1. `NILPER_CONTEXT.md`
2. `NILPER_TODO.md`
3. `AGENTS.md`

`NILPER_CONTEXT.md` and `NILPER_TODO.md` are the canonical architecture and progress documents. `AGENTS.md` contains generated Next.js framework instructions that must also be followed.

## Local setup

Requirements:

- Node.js and npm
- Docker Desktop for the local Payload PostgreSQL database

Install dependencies and create a local environment file:

```bash
npm ci
cp .env.example .env.local
```

Keep real credentials in the ignored `.env.local` file. The blank `.env.example` is the committed template.

For Payload and local PostgreSQL, configure:

```env
DATABASE_URI=postgres://nilper_payload:YOUR_PASSWORD@127.0.0.1:5433/nilper_payload
PAYLOAD_SECRET=YOUR_LONG_RANDOM_SECRET
PAYLOAD_DB_NAME=nilper_payload
PAYLOAD_DB_USER=nilper_payload
PAYLOAD_DB_PASSWORD=YOUR_PASSWORD
```

Retain the Supabase variables while using the existing customer authentication, profile, address, and legacy order-history flows. New carts and orders are persisted in Payload.

Relevant non-Payload variables are documented in `.env.example`, including:

- `NEXT_PUBLIC_SITE_URL` for metadata and sitemap URLs
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and server-only `SUPABASE_SECRET_KEY`
- `AUTH_DEV_SECRET` for local demo sessions
- `KAVENEGAR_API_KEY`, `KAVENEGAR_OTP_TEMPLATE`, and `SEND_SMS_HOOK_SECRET` for the Supabase SMS hook

Apply `supabase/migrations/20260829000000_account_dashboard.sql` only when provisioning the existing Supabase account schema or preserving legacy order history. Without Supabase configuration, local development supports demo login with OTP `123456`; that fallback is disabled in production.

## Development

For initial setup, start PostgreSQL, seed the representative Payload data, and start Next.js:

```bash
npm run payload:db:start
npm run payload:seed
npm run dev
```

For later sessions, PostgreSQL and Next.js can be started together:

```bash
npm run dev:payload
```

Open the storefront at `http://localhost:3000` and Payload Admin at `http://localhost:3000/admin`.

Payload/PostgreSQL commands:

```bash
npm run payload:db:start
npm run payload:db:status
npm run payload:db:stop
npm run payload:generate
npm run payload:migrate:create -- descriptive-name
npm run payload:migrate
npm run payload:seed
npm run payload:verify:phase3
npm run payload:verify:phase4
npm run payload:verify:phase5
npm run payload:verify:phase8
npm run payload:verify:manual-catalog
```

The uploaded local Payload media directory is ignored by Git.

## Verification

Run the production and regression checks before pushing:

```bash
npm run lint
npm run build
npm run test:journal
npm run test:showcase
```

The journal and showcase tests read the production output, so run `npm run build` first.

Optional live checks can target a running production server:

```bash
JOURNAL_TEST_URL=http://127.0.0.1:3100 npm run test:journal
SHOWCASE_TEST_URL=http://127.0.0.1:3100 npm run test:showcase
```

## Current operational boundaries

- Payload contains Delan plus eight manually curated products with supplied photography. The public shop, category/product pages, filters, search, homepage selections, navigation and sitemap now read those reviewed records through the server repository/mapper boundary.
- No curated product has an authoritative source price, so the current catalog renders inquiry-only. Entering an approved server price activates the existing server-validated configuration cart path without changing the UI model.
- Static fixture products remain only as clearly labeled, non-interactive references on demo brand/project pages; they do not create public catalog routes or participate in checkout.
- Guest carts store only compact product, variant, quantity, and configuration IDs in the browser and are revalidated by the server. Signed-in carts persist in Payload, and sign-in merges any guest selections into the authenticated cart.
- Checkout creates Payload orders from the authenticated server-owned cart inside a database transaction. Payload preserves trusted product, variant, configuration, price, contact, and status snapshots, and exposes Nilper's order lifecycle in Admin.
- Supabase remains active for customer authentication, profile, addresses, and legacy order history until Phase 9 replaces those responsibilities. New orders are written only to Payload.
- `NEXT_PUBLIC_SITE_URL` must be set to the final HTTPS origin before production deployment so metadata and sitemap URLs are correct.
- Shared contact details are maintained in `src/config/site.ts`; the current email address has not been independently verified.
- Temporary editorial images are under `public/placeholders`, and the hero video is under `public/videos/hero.mp4`.

## Contribution

Keep commits focused and use Conventional Commit messages such as `feat:`, `fix:`, `refactor:`, `test:`, `docs:`, or `chore:`.
