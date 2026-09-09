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

Retain the Supabase variables when using the existing customer authentication, account, address, and order-request flows.

Relevant non-Payload variables are documented in `.env.example`, including:

- `NEXT_PUBLIC_SITE_URL` for metadata and sitemap URLs
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and server-only `SUPABASE_SECRET_KEY`
- `AUTH_DEV_SECRET` for local demo sessions
- `KAVENEGAR_API_KEY`, `KAVENEGAR_OTP_TEMPLATE`, and `SEND_SMS_HOOK_SECRET` for the Supabase SMS hook

Apply `supabase/migrations/20260829000000_account_dashboard.sql` when provisioning the existing Supabase account/order schema. Without Supabase configuration, local development supports demo login with OTP `123456`; that fallback is disabled in production.

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
npm run payload:migrate
npm run payload:seed
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

- The public catalog, product, project, brand, and editorial pages still use their existing repository fixtures.
- Payload Admin and the Delan preview currently validate the CMS/product-management foundation; they are not yet the public storefront data source.
- Supabase remains active for the existing customer-facing authentication, profile, address, and order-request behavior.
- `NEXT_PUBLIC_SITE_URL` must be set to the final HTTPS origin before production deployment so metadata and sitemap URLs are correct.
- Shared contact details are maintained in `src/config/site.ts`; the current email address has not been independently verified.
- Temporary editorial images are under `public/placeholders`, and the hero video is under `public/videos/hero.mp4`.

## Contribution

Keep commits focused and use Conventional Commit messages such as `feat:`, `fix:`, `refactor:`, `test:`, `docs:`, or `chore:`.
