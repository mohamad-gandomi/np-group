# NPGroup Storefront

A Persian RTL furniture and interiors storefront built with Next.js, React, TypeScript, Tailwind CSS, Payload CMS/Ecommerce, and PostgreSQL.

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

Relevant non-Payload variables are documented in `.env.example`, including:

- `NEXT_PUBLIC_SITE_URL` for metadata and sitemap URLs
- `KAVENEGAR_API_KEY` and `KAVENEGAR_OTP_TEMPLATE` for direct OTP delivery through Kavenegar Verify Lookup. The template must be approved in Kavenegar and contain `%token`.
- `ZARINPAL_MERCHANT_ID` and `ZARINPAL_SANDBOX` for server-side Zarinpal requests and verification. Keep sandbox enabled for local testing and never expose the merchant ID through a `NEXT_PUBLIC_*` variable.
- `TAPIN_*` variables for server-side parcel quotes, registration, and tracking. Obtain the exact authorization value, shop/employee/kiosk IDs, origin codes, packaging weight, registration mode, and confirmed amount unit from the Tapin integration panel/support; none may use a `NEXT_PUBLIC_*` prefix.

Without Kavenegar configuration, local development uses the visible demo OTP `123456`; that fallback is disabled in production. Production phone login requires both Kavenegar variables.

Zarinpal callbacks are generated from `NEXT_PUBLIC_SITE_URL`. Production payments therefore require its final public HTTPS origin and `ZARINPAL_SANDBOX=false`.

Tapin parcel mode remains fail-closed until all required account values are configured and `TAPIN_AMOUNT_UNIT` is explicitly confirmed as `rial` or `toman`. The public checkout obtains official province/city codes and quotes through the server; the browser never supplies a trusted shipping price. See the [official Tapin API reference](https://api.tapin.ir/api/v2/public/doc/).

## Development

For initial setup, start PostgreSQL, seed the representative Payload data, and start Next.js:

```bash
npm run payload:db:start
npm run payload:migrate
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
npm run payload:jobs
npm run payload:seed
npm run payload:verify:phase3
npm run payload:verify:phase4
npm run payload:verify:phase5
npm run payload:verify:phase8
npm run payload:verify:phase9
npm run payload:verify:phase10
npm run payload:verify:phase11
npm run payload:verify:phase12
npm run payload:verify:manual-catalog
```

The uploaded local Payload media directory is ignored by Git.

## Payload data import and export

Administrators can import or export selected records from the list menu of products, manual variants, attributes, attribute options, brands, categories, posts, projects, and blog categories. Each JSON file contains an array for one collection.

Upload images to «رسانه‌ها» first, then refer to exact filenames in JSON. Portable identifiers are product/brand/category `slug`, variant `nilperCode`, attribute `name`, and attribute-option `value`. Update/upsert automatically uses these stable keys. Templates and import order are in [`templates/data-transfer`](templates/data-transfer/README.md).

## Product management

Products explicitly have type **Simple** or **Variable**, a brand, and hierarchical categories. Assign reusable attributes and their allowed options on the product. For a variable product, select which assigned attributes define its manually created variants. Other attributes remain customer choices (fabric, finish, etc.). **Attributes do NOT automatically generate Variants.**

Categories include a **Show on homepage and shop** switch. Editors may select at most six; only those selected categories appear in the homepage category grid and the shop's category cards/filters, ordered by `sortOrder`. Other published categories and their direct routes remain available.

Each model has a unique SKU and one option per defining attribute. A model inherits product pricing, availability, shipping and media unless overridden. Product-level measurements and specifications remain flexible; internal keys and row order are automatic. Simple products have no variant controls.

The ecommerce plugin's internal `variantTypes` / `variantOptions` storage is presented as «ویژگی» / «گزینه ویژگی». The storefront and server share authoritative commerce resolution; checkout, authentication, payment and shipping integrations remain in place. Orders and transactions keep immutable text, SKU, choice and price snapshots.

Catalog migrations follow expand → backfill → contract. Back up PostgreSQL, stop application writes during deployment, and run `npm run payload:migrate` before serving the new release. Schema push is disabled. Former editor collections are archived under `catalog_legacy`; ID mappings and migration warnings remain in `catalog_migration_map` and `catalog_migration_report`. Rollback requires restoring the pre-migration backup. See [NILPER_CONTEXT.md](NILPER_CONTEXT.md) for the migration and verification record.

Run `npm run payload:verify:catalog` for the unified model regression suite. To test a restored pre-refactor database, use `node scripts/verify-catalog-migration.mjs nilper_catalog_migration_verify_SUFFIX`; the script refuses the application database. `scripts/reconcile-catalog-baseline.mjs` is only for an existing dev-pushed database with an out-of-date migration ledger: it verifies the baseline before `--apply` records the three already-present migrations.

Imports and exports run through Payload's background jobs. Their uploaded/generated files and admin history are removed automatically after seven days; imported content is not removed.

For Plesk deployment:

1. Deploy the application and run `npm ci`, `npm run build`, and `npm run payload:migrate` in the configured Node.js environment.
2. Generate a random URL-safe secret of at least 32 characters and set it as `PAYLOAD_JOBS_CRON_SECRET` in the same production environment as the Node.js application.
3. In **Websites & Domains → Scheduled Tasks**, create a **Fetch a URL** task every minute using HTTPS:

```text
https://EXAMPLE.com/api/payload-jobs/run?allQueues=true&limit=10&cronSecret=YOUR_SECRET
```

Payload's official jobs endpoint processes queued imports/exports and schedules the daily retention cleanup. It fails closed when the secret is missing or shorter than 32 characters, accepts the exact secret through the Plesk URL, and continues to allow authenticated administrators. Treat the complete cron URL as a credential because web-server access logs may contain its query string; rotate the secret if it is exposed. Other schedulers should prefer `Authorization: Bearer YOUR_SECRET` instead of the query parameter.

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
- Invoice checkout creates a pending Payload order from the authenticated server-owned cart. Online checkout uses a provider-neutral Payload payment adapter with Zarinpal as the first gateway; it creates the order only after server-side amount verification, stores the authority/reference IDs, and handles repeated callbacks idempotently.
- Products and variants default to manual freight. Fully parcel-eligible carts use server-recalculated Tapin quotes and add that amount to the Zarinpal total; freight and mixed carts charge products only and receive a manual freight quote after checkout. A Tapin shipment is registered only after successful Zarinpal verification, with duplicate prevention and stored shipment/tracking state.
- Payload owns customer phone OTP challenges, revocable sessions, profiles, addresses, carts, and orders. Kavenegar Verify Lookup is the production OTP delivery provider.
- Journal posts are created and edited under «مطالب مجله» in Payload Admin. Publish status controls public visibility; reading time, word count and the H2 table of contents are automatic. Run `npm run payload:seed` once on a clean database to install the four original posts and their media.
- Customer carts, orders, profiles, and addresses are linked directly to the authenticated Payload customer record; no secondary account datastore or legacy identity bridge is used.
- `NEXT_PUBLIC_SITE_URL` must be set to the final HTTPS origin before production deployment so metadata, sitemap URLs, and payment callbacks are correct.
- Shared contact details are maintained in `src/config/site.ts`; the current email address has not been independently verified.
- Temporary editorial images are under `public/placeholders`, and the hero video is under `public/videos/hero.mp4`.

## Contribution

Keep commits focused and use Conventional Commit messages such as `feat:`, `fix:`, `refactor:`, `test:`, `docs:`, or `chore:`.
