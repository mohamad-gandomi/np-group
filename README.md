# NPGroup Storefront

Persian RTL furniture storefront and operations application built with Next.js 16, React 19, TypeScript, Tailwind CSS 4, Payload CMS/Ecommerce 3.88, and PostgreSQL.

Payload/PostgreSQL owns catalog, editorial, customer, cart, order, payment, and shipping data. The public storefront reads Payload through server-side repositories and stable UI data-transfer objects.

## Local setup

Requirements:

- Node.js and npm
- Docker with Compose

```bash
npm ci
cp .env.example .env.local
```

Set at least:

```env
DATABASE_URI=postgres://nilper_payload:YOUR_PASSWORD@127.0.0.1:5433/nilper_payload
PAYLOAD_SECRET=YOUR_LONG_RANDOM_SECRET
PAYLOAD_DB_NAME=nilper_payload
PAYLOAD_DB_USER=nilper_payload
PAYLOAD_DB_PASSWORD=YOUR_PASSWORD
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

The remaining optional integrations are documented in `.env.example`:

- Kavenegar OTP: `KAVENEGAR_API_KEY`, `KAVENEGAR_OTP_TEMPLATE`
- Zarinpal payments: `ZARINPAL_MERCHANT_ID`, `ZARINPAL_SANDBOX`
- Tapin shipping: the server-only `TAPIN_*` variables
- Payload job HTTP endpoint: `PAYLOAD_JOBS_CRON_SECRET` (at least 32 characters)

Without Kavenegar credentials, development login exposes OTP `123456`; production fails closed. Zarinpal callbacks depend on the final HTTPS `NEXT_PUBLIC_SITE_URL`. Tapin also fails closed until every account field and the provider amount unit are configured.

## Development

The PostgreSQL adapter pushes the current Payload schema automatically outside production.

```bash
npm run payload:db:start
npm run payload:seed
npm run dev
```

Open the storefront at <http://localhost:3000> and Payload Admin at <http://localhost:3000/admin>.

Common commands:

```bash
npm run dev
npm run dev:payload
npm run lint
npm test
npm run build
npm run test:storefront

npm run payload
npm run payload:generate
npm run payload:seed
npm run payload:jobs
npm run payload:db:start
npm run payload:db:status
npm run payload:db:stop
```

`npm run test:storefront` checks generated production output, so run `npm run build` first. The seed is idempotent and installs the curated catalog, journal, brands, projects, and required media.

## Data transfer

Administrators can run JSON import/export from supported Payload collection list menus. Relations use stable slugs, variant `nilperCode`, attribute names, option values, and uploaded media filenames. Import/export files and history are removed after seven days by the Payload job cleanup task.

Production must call Payload's official jobs endpoint regularly:

```text
https://EXAMPLE.com/api/payload-jobs/run?allQueues=true&limit=10&cronSecret=YOUR_SECRET
```

Prefer an `Authorization: Bearer` header where the scheduler supports it. Treat a query-string secret as a credential.

## Database deployment

Development schema push is explicitly disabled when `NODE_ENV=production`. This pre-production repository intentionally has no historical migrations.

Before the first production deployment:

1. Create and review a clean initial migration with `npm run payload:migrate:create -- initial-production-schema`.
2. Commit the generated migration.
3. Back up PostgreSQL and run `npm run payload:migrate` before serving the release.

Repeat the backup/migrate step for later schema changes. Never enable schema push in production.

## Operational rules

- Money is stored as non-negative integer Toman values. Rial conversion occurs only at provider boundaries.
- Products are simple or variable; operational variants are created manually and attributes never generate Cartesian variants.
- The server resolves catalog choices, prices, shipping, payments, and immutable order snapshots.
- Kavenegar delivers OTPs but Payload owns OTP/session/customer state.
- Zarinpal orders are confirmed only after server-side verification of the stored amount.
- Tapin parcel quotes and shipment state are server-owned; freight and mixed carts use manual coordination.
- `NEXT_PUBLIC_SITE_URL` must be the final HTTPS origin in production.
