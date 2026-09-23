# Nilper Project Context

> Canonical continuity document for AI-assisted development of `mohamad-gandomi/np-group`.
>
> **Read this file before making architectural or backend changes.**

## 1. Source of truth

For all future AI/Codex sessions, use this order:

1. `NILPER_CONTEXT.md` — durable architecture, current implementation facts, domain rules.
2. `NILPER_TODO.md` — canonical execution plan and live progress tracker.
3. `AGENTS.md` — mandatory Next.js agent rules.
4. The actual repository and current Git state.

`NILPER_CONTEXT.md` and `NILPER_TODO.md` are the only Nilper architecture, planning, and progress documents. Superseded plans and verification logs were removed on 2026-09-10 so future sessions do not have to reconcile competing instructions.

Do not rely on previous chat/session memory. The repository and these two documents must be enough to continue the project.

---

## 2. Repository snapshot reviewed

Repository:

```text
mohamad-gandomi/np-group
```

Latest reviewed default branch:

```text
main
```

Latest reviewed default-branch commit:

```text
5cffc82
docs: record Phase 8 commerce migration
```

Important recent commits:

```text
55fa0ce836903ee63f7eae1997388c5fd99ba59d
feat(payload): add dashboard-first Payload preview

70c0062687533e45ca427fce64014d0c47c46df0
docs(payload): record dashboard gate status

cdba415bc2d9045c078f093808816512f2eda7e2
chore(repo): remove obsolete WordPress backend

2126eb5c0dded21016fb500be641f17b9001a0cb
docs: consolidate Nilper project documentation

79ddd109c24b7a24ac879500d9ebaf2a8cc101a4
feat(catalog): define Nilper Payload product domain

8c9a0c8663d5264b3324c3bfd277235aef7789a9
feat(commerce): add configuration-aware cart items

4b82054d389e37cbc26f87127fa8f52858101f9e
feat(commerce): complete Delan Payload vertical slice
```

Phases 0–5, 7, and 8 are merged into `main`; Phase 6 is deferred by owner decision. Phase 9 is complete at implementation commit `9e26d0c` and awaits merge. Phases 10 and 11 are complete in the working tree on `codex/payload-phase-10` and await their Git checkpoint.

The old WordPress/WooCommerce experiment, its Docker setup, plugin and WordPress planning documents have been removed from the repository.

**Do not recreate or revive WordPress unless the architecture is explicitly reopened by the owner because of a proven blocker.**

---

## 3. Current stack

As of the reviewed commit:

```text
Next.js                  16.3.4
React                    19.2.8
TypeScript               5.x
Tailwind CSS             4.x
Payload CMS              3.88.0
Payload Ecommerce        3.88.0
Payload Postgres adapter 3.88.0
PostgreSQL               local/dev via Docker Compose
Customer/account data    Payload CMS + PostgreSQL
Production phone SMS     Kavenegar Verify Lookup
Online payment           Zarinpal server-side adapter
Parcel shipping          Tapin server-side adapter
```

Relevant commands currently exist:

```bash
npm run dev
npm run dev:payload

npm run payload:db:start
npm run payload:db:stop
npm run payload:db:status

npm run payload:generate
npm run payload:migrate:create -- descriptive-name
npm run payload:migrate
npm run payload:seed
npm run payload:verify:phase3
npm run payload:verify:phase4
npm run payload:verify:phase5
npm run payload:verify:phase8
npm run payload:verify:phase9
npm run payload:verify:phase10
npm run payload:verify:phase11

npm run lint
npm run build
npm run test:journal
npm run test:showcase
```

---

## 4. Architecture decision — LOCKED

The selected architecture is:

```text
Browser
  |
  v
Existing Next.js application
  |
  +-- existing public storefront
  |
  +-- Payload Local API / server-side access
  |
  +-- Payload Admin / Payload API routes
  |
  +-- server-side Zarinpal payment adapter
  |
  v
Payload CMS + Payload Ecommerce
  |
  v
PostgreSQL
```

Rules:

- Keep the existing Next.js storefront.
- Do not replace it with a Payload starter.
- Do not create a second frontend.
- Do not create a separate NestJS backend.
- Do not add Medusa, Vendure or WooCommerce.
- Do not create another Admin application.
- Prefer Payload Local API for same-app server-side data access.
- Keep public UI components independent from raw Payload generated document shapes.

The route structure currently separates:

```text
src/app/(frontend)
src/app/(payload)
```

This route-group migration must not change the public URLs.

---

## 5. Dashboard approval

The real Payload Admin dashboard has already been implemented and manually reviewed by Mohamad.

Status:

```text
DASHBOARD APPROVAL: APPROVED
```

The approved Admin includes:

- Persian UI configuration.
- RTL-compatible product editing.
- real Payload Admin, not a mockup.
- product list/edit views.
- product tabs.
- relationships.
- arrays/groups.
- rich text.
- media.
- variants.
- reusable attributes and allowed options.
- save/publish/reopen workflow.

Known non-blocking Admin limitations:

- Payload date presentation is still Gregorian-style.
- Some upstream accessibility strings may contain English text.
- These are cosmetic unless they become a real workflow problem.

Do not spend a new phase redesigning the approved dashboard without a concrete usability requirement.

---

## 6. Current Payload implementation

The stack remains Next.js 16.3.4 + Payload 3.88 + the official ecommerce and import/export plugins + PostgreSQL. Authentication, customer sessions, Kavenegar, Zarinpal and Tapin remain in their existing modules.

Editor catalog collections: Products, Categories, Brands, Attributes, Attribute Options, and Product Variants. Categories are hierarchical and include product families. A product relates to a brand and categories; there is no separate family collection in the active application.

Each category has `showOnStorefront`. At most six categories may enable it; selected categories, ordered by `sortOrder`, are the only category cards and category filters shown on the homepage and shop index. Unselected published categories retain their data and direct storefront routes. Migration `20260923_105612_category_storefront_selection` deterministically selects the first six existing published categories for continuity.

Attribute storage reuses the ecommerce plugin's `variantTypes` (label, unique name, active, sortOrder, helpTextFa) and `variantOptions` (variantType, label, globally unique value, code, groupLabel, image, colorHex, active, sortOrder). These internal API names are compatibility details, presented in Persian as «ویژگی» and «گزینه ویژگی». Palette/family grouping is plain `groupLabel` metadata.

## 7. Product and commerce model

```text
Product
├── productType: simple | variable
├── Brand
├── Categories[]
├── attributes[{ attribute, allowedOptions[], required }]
├── variantAttributes[]
└── Manual Variants[]
```

Simple products have no variants. Variable products select a subset of assigned attributes as their variant identity. Every complete model must contain exactly one allowed option from each defining attribute, with a unique SKU and unique unordered combination. **Attributes do NOT automatically generate Variants.** Non-defining attributes remain selectable customer choices without multiplying SKUs.

The product editor uses Basic Information, Sales, Media, Product Information, Attributes, and a conditional Models tab with Payload's manual join/create/edit interface. The hidden plugin fields `enableVariants` and `variantTypes` are derived compatibility fields. Product changes cannot orphan existing variants; attributes/options in live definitions cannot be deleted or reassigned until dependencies are cleaned up. Empty incomplete drafts may be saved, but cannot be purchased or published as complete models.

Products retain catalogCode, media/gallery, descriptions, flexible measurements and technicalSpecs, lead times, order notes, relatedProducts and matchingProducts. Measurement/specification keys are stable and automatic; row ordering follows the editor's row order. Existing keys remain intact.

`src/payload/catalog-domain.ts` defines domain validation and the canonical `resolveCommerce` resolver. A variant with `priceInTMNEnabled: true` uses its own plugin price; otherwise it inherits the product price. Null shipping, availability and image overrides inherit product values. Existing explicit shipping values remain explicit during migration. No duplicate price storage or inventory counts are introduced.

Cart identity is product + optional real variant + sorted non-variant attribute selections. Existing `configuration` and snapshot field names remain internal compatibility names. The server resolves all prices, SKUs, labels and membership; client prices and labels never become authoritative. The plugin cart save hook is followed by a subtotal calculation from validated snapshot prices, including inheritance.

Persisted order/transaction line snapshots are immutable even if an update explicitly submits replacement items. Historical text and prices do not depend on current catalog records. New items also store `variantTitleSnapshot`; old historical titles are not guessed. Account order pages retain items whose products were deleted and display all saved customer choices. Active carts are revalidated against published records.

Payload draft/publish behavior and storefront cache hooks remain enabled. The storefront presents only real manually created models. Unavailable combinations cannot create a model. Customer choices support grouped palettes, images, and color swatches; model image overrides update the product gallery. Family category routes coexist with existing canonical product URLs.

### Migration and recovery (2026-09-22)

1. `20260922_083135_unified_catalog_expand`: adds attributes, product type, overrides and combination uniqueness storage.
2. `20260922_090000_unified_catalog_backfill`: preserves plugin IDs; maps legacy customer-choice IDs into the shared storage; backfills product assignments and versions; derives product type from actual variants; converts family records to categories; migrates commerce relationship IDs without changing historical wording.
3. `20260922_123418_unified_catalog_contract`: verifies mapping completeness, archives retired source tables and references under `catalog_legacy`, then removes obsolete active fields/relationships.
4. `20260922_124433_variant_title_snapshots`: adds optional immutable model wording for newly placed orders.

Back up PostgreSQL and stop application writes during deployment. Automatic schema push is disabled in `payload.config.ts`. Retained audit tables are `catalog_migration_map` (including original source JSON) and `catalog_migration_report`. Ambiguous family parents remain unparented; existing product category memberships are preserved. Conflicting category slugs get deterministic family suffixes rather than overwriting unrelated categories. Incomplete legacy drafts are preserved and reported.

The local baseline had 11 products, 25 variants (including an incomplete draft), 2 customer-choice attributes, 12 customer-choice options, 9 families, 34 orders and 24 transactions. A pre-refactor backup is retained in the local PostgreSQL container at `/tmp/catalog-before-unification.dump`. A restored verification database independently replayed the migrations and checked exact historical snapshots, SKU preservation, category links, active-cart remapping and a no-op rerun. Archive data is not an active second catalog model.

The baseline database had dev-pushed schema changes but three missing migration ledger entries. `scripts/reconcile-catalog-baseline.mjs` verifies columns, nullability, types, indexes, foreign-key names and enums against the last pre-refactor snapshot before recording those entries with `--apply`. Do not run it on a normally migrated database.

Catalog migrations are forward-only; restore the full pre-migration backup for rollback. Do not drop the recovery archive until its retention period and external backups have been reviewed.

---

## 8. Currency state

The project storefront uses integer **Toman** values.

Payload Ecommerce uses this finalized application currency:

```text
code: TMN
decimals: 0
label: تومان
```

`src/payload/money.ts` is the single source of truth. Product prices, variant prices, cart subtotals, order amounts and transaction amounts are non-negative integer Toman values. The Payload Ecommerce Provider accepts and formats the zero-decimal `TMN` currency, and the Nilper-facing formatter produces Persian `تومان` output. Local API serialization preserves the same unscaled integer values.

`TMN` is an application code rather than a claim that every external gateway recognizes it as ISO-4217. A payment adapter must explicitly call the centralized gateway conversion and name whether the gateway expects Toman or Rial. Rial conversion is performed only at that boundary by multiplying the validated Toman integer by 10.

Rules:

- Never silently mix Rial and Toman.
- Never scatter `* 10` or `/ 10` conversions across components or adapters.
- Centralize money semantics.
- If Rial is needed at a payment boundary, conversion must be explicit and use the centralized helper.

---

## 9. Product domain rules

A model represents a real operational SKU, price, physical form, or manufacturing identity. Fabric, wood finish and palette choices use the same reusable attribute system, but remain outside variant identity unless explicitly selected in `variantAttributes`. Never generate Cartesian combinations. A variable product may have dozens of customer choices and only a handful of real models.

Shared specifications and measurements belong on Product; physical differences belong on Variant. Keep explicit matching/coordinated products distinct from general related-product recommendations. Preserve integer Toman pricing, published visibility, historical snapshots and existing integration boundaries.

---

## 10. Real source data

Three real Nilper workbooks were previously supplied for architecture/data-model validation:

```text
506.xlsx
886.xlsx
994.xlsx
```

Only Persian data is required for this project.
English fields can be ignored unless the owner explicitly changes the requirement.

### 506 — Viona / ویونا

Evidence includes:

- bar-chair product.
- modern style.
- wood finish choices.
- upholstery choices.
- dimensions.
- registration-code distinctions.
- fabric usage.

This supports separating real variants from configurable finishes/upholstery.

### 886 — Daran / داران

Evidence includes a bedroom family with multiple separately sellable pieces, e.g.:

```text
Category: Daran
  -> Bed
  -> Dresser / Mirror
  -> Bedside table
  -> Stool
```

Do not model the entire family as one giant product.

### 994 — Delan / دلان

Evidence includes:

- sofa.
- coffee/side tables.
- dining products.
- matching relationships.
- several finishes.
- many fabric palettes.
- single-seat / three-seat distinctions.
- monochrome / polychrome registration codes.
- fabric consumption.

This validates:

- hierarchical family categories.
- multiple Products.
- real Variants.
- non-variant customer attributes.
- related/matching relationships.

### Data entry and transfer status

The owner deferred workbook-specific Excel automation because the files require different extraction rules and manual decisions. The workbooks remain outside the repository and must not be copied into `public/` or committed. Do not add an Excel parser or workbook-specific automation unless the owner explicitly reopens that work with approved mapping rules.

Routine reviewed data transfer uses Payload's official import/export plugin with one JSON array per collection. Administrators may export the current selection/filter or all records, and may create, update, or upsert a small batch. Media files are bulk-uploaded to Payload first; JSON refers to them by filename. Product/post/project relations use `slug`, variants use `nilperCode`, attributes use `name`, and attribute options use globally unique `value` where those stable fields are available.

All media references exposed by this JSON workflow are optional. An omitted value, `null`, an empty string, or whitespace-only text means “leave the image empty”; a non-empty filename must still resolve to exactly one existing Payload Media record. The public storefront preserves the relevant image frame without substituting a misleading placeholder and never passes an empty source to `next/image`. Editors can attach the real media later in Payload.

Imports and exports are admin-only and execute through Payload Jobs. A daily scheduled task deletes import/export files and their administrative records after seven days without deleting imported content. Plesk must fetch Payload's official `/api/payload-jobs/run` endpoint every minute over HTTPS with the server-only `PAYLOAD_JOBS_CRON_SECRET`; the endpoint fails closed unless the secret has at least 32 characters and matches exactly. Other schedulers should send the same secret as a Bearer token. Every deployment must still run `npm run payload:migrate` once before serving the new release.

---

## 11. Current Delan preview

An idempotent Payload seed already exists.

It creates representative preview data for:

- Nilper brand.
- relevant categories.
- Delan family category.
- Delan sofa.
- a lightweight related Delan table record.
- wood-finish configuration.
- upholstery/fabric configuration.
- real-style variant/registration-code records.
- Persian technical specifications.
- supplied Delan product photography plus placeholder media for the lightweight related-product record.

Important:

This seed proves Admin usability and the finalized domain shape, including stable slugs/SKUs, flexible measurements/specifications and explicit matching products. Phase 5 now also maps the primary Delan sofa into the public storefront DTO and existing Product UI.

It is **not** a full product importer and must not be treated as authoritative bulk catalog data.

The Delan main image now comes from the supplied `HSS 994-SET.zip` media package. The lightweight related table record still uses an explicit placeholder until its media is curated.

### Manually curated catalog

Eight additional products were manually reviewed from the supplied workbook/media ZIP packages and added to the idempotent seed:

```text
تخت خواب داران     NBSB 886
تخت خواب ژیوار     NBSB 850
تخت خواب اورامان   NBSB 853
تخت خواب مانی      NBSB 852
صندلی بار ویونا    NDTN506
تخت خواب لاوان     NBSB 885
تخت خواب ماهور     NBSB 851
مبل دایان          NHSS871
```

These records include optimized supplied photography, Persian descriptions and specifications, confirmed dimensions, attribute assignments, source traceability, and 22 distinct operational registration-code variants. No price was present, so every addition remains made-to-order with pricing disabled.

Known inconsistencies remain explicit: the 852 worksheet/width values, 506/507 registration-code mismatch, absent 850 width-180 codes, and duplicate Dayan code `NHSS871002`. Ambiguous records were omitted rather than corrected or duplicated.

The curated records are available in Payload Admin and now drive the public catalog through the Phase 7 Payload repository/mapper boundary.

---

## 12. Current storefront boundary

Phase 7 replaced the hybrid public catalog with a Payload-backed boundary:

```text
reviewed Payload catalog records
    -> server-only Payload Local API repository
    -> storefront taxonomy + DTO mapper
    -> existing catalog, navigation, homepage and Product UI
```

`getCatalogProducts()`, `queryCatalogProducts()`, `getProductBySlug()` and the related category/facet/path helpers live in `src/features/catalog/payload-catalog-repository.ts`. Raw generated Payload shapes remain server-side; `src/features/catalog/payload-catalog-mapper.ts` creates the serializable storefront DTO, and `src/features/catalog/catalog-taxonomy.ts` maps source categories to stable public slugs/titles/room facets.

Payload now drives public category/product listings, database-backed filters/search/sort/pagination, product details, related products, homepage selections, desktop/mobile navigation and sitemap entries. Category title, description, image, publication state and ordering come directly from Payload; the taxonomy adapter preserves established public route slugs and room facets only. Product routes are generated from reviewed Payload records. Cached reads keep a five-minute safety TTL, while Payload `afterChange`/`afterDelete` hooks immediately expire the affected catalog, journal, showcase or sales-contact tags and paths after a public record changes.

The hook boundary covers products, variants and their option/type records; catalog taxonomy/configuration; posts and blog categories; brands, projects and media; and public seller-contact data. Draft-only edits remain private and do not churn the public cache, while publishing, editing or deleting a visible record refreshes the next storefront request. Successful official import jobs also perform one final collection-aware invalidation when their history record reaches `completed`; partial, failed, empty and already-completed records do not trigger that final hook. No WebSocket or browser push channel is used: an already-open page updates on its next navigation or reload.

`src/features/catalog/catalog-data.ts` is retained only for catalog fixture and seed compatibility. Public brand and project showcase pages read Payload records through the server-only showcase repository.

Fixture records no longer create public product-detail routes or appear in the shop, navigation, homepage product selection, or sitemap.

Every reviewed Payload product renders its source-backed Persian description, media, operational variant codes, measurements, specifications and configuration choices in the existing Product UI. Missing authoritative dimensions/prices remain explicit instead of receiving category-wide fixture values.

No authoritative price exists in the source workbook or seed. Delan therefore displays an inquiry state. When an administrator supplies an approved server price, the same UI posts product/variant/configuration IDs to `/api/payload-cart/quote`; the server reuses the canonical Phase 4 validator and returns trusted title/code/configuration/price snapshots before the browser cart accepts the line.

The Phase 5 verification assigns a clearly test-only variant price, exercises real Payload cart merging/splitting and totals, creates an order, mutates the source records, verifies historical snapshots, and restores every seeded value. The test price is never retained as catalog data.

Future migration must use an adapter/repository boundary:

```text
Payload generated document
    -> server repository
    -> mapper
    -> StorefrontProduct DTO
    -> existing UI components
```

Do not import raw Payload generated types throughout the UI.

Do not redesign ProductCard/ProductView merely because the data source changes.

---

## 13. Commerce and customer persistence boundary

Phase 8 established the current commerce flow:

```text
guest browser cart (stable IDs only)
    -> server validation / hydration
    -> authenticated Payload cart
    -> transactional Payload order + completed source cart
    -> Payload Admin lifecycle management
```

Guest local storage contains only stable product/variant IDs, quantity, and attribute/option IDs. It is never authoritative for product metadata or prices. Signing in merges those references into the user's Payload cart after server validation.

Storefront sessions authenticate a Payload customer through an opaque random cookie whose keyed hash is stored in PostgreSQL. Customers link directly to profiles, addresses, carts, and orders through Payload relationships.

Checkout accepts contact, delivery, and payment selections only. Invoice checkout creates a pending-review order from the authenticated Payload cart and marks that cart purchased in the same PostgreSQL transaction. Online checkout creates a pending provider transaction first; a confirmed order is created and the cart is completed only after server-side Zarinpal verification succeeds. Client or callback amounts are never authoritative. Unique source-cart and payment-transaction relationships plus transaction state checks make repeated callbacks safe. Orders expose Nilper's lifecycle in Payload Admin: pending review, confirmed, in production, ready, shipped, delivered, and cancelled.

Payload/PostgreSQL is the single source of truth for customer authentication state, profiles, addresses, carts, and orders. Account queries contain no demo fallback and read only records owned by the authenticated Payload customer.

Kavenegar Verify Lookup is a delivery provider only: OTP generation, keyed hashing, expiry, one-time use, attempt/rate enforcement, customer creation, and revocable sessions remain inside Payload/PostgreSQL. Local development may expose OTP `123456`; production fails closed unless Kavenegar is configured.

Supabase packages, helpers, environment variables, proxy/session fallbacks, function code, and obsolete SQL migration were removed after the Payload replacement passed verification. The owner confirmed this is a fresh site, so no legacy customer/order migration or compatibility bridge is required.

Target migration order:

1. Payload catalog/domain model.
2. Payload configuration-aware cart/order model.
3. Delan end-to-end vertical slice.
4. catalog migration.
5. commerce flow migration.
6. phone OTP migration.
7. profile/address/account-query migration.
8. remove Supabase after verification — complete.

The final architecture should not keep permanent duplicate sources of truth for the same customer/order data.

---

## 14. Security and integrity rules

Always preserve:

- server-side price validation.
- server-side product/variant/configuration validation.
- access controls.
- no client-trusted price/SKU/inventory.
- server-only secrets.
- payment confirmation only after authoritative provider verification of the stored server amount.
- historical order snapshots.
- committed Postgres migrations.
- no credentials in import/export files.
- no silent source-data correction.

Historical orders must not be reconstructed from the current mutable product state.

---

## 15. Current known gaps

At the current reviewed state:

### Phase 3 completion

- The preview schema was evolved through a committed, data-preserving migration rather than recreated.
- Integer Toman behavior was verified through products, variants, Provider formatting, carts, orders, transactions and Local API serialization.
- The only Rial conversion is the explicit payment-gateway boundary.
- Inventory remains disabled because no supplied source contains authoritative stock quantities.
- Flexible Persian technical specs and measurements were checked against the representative 506, 886 and 994 workbooks.
- Stable product slugs and variant registration codes remain the idempotent seed/upsert keys; workbook-specific automated import is deferred.
- Explicit `matchingProducts` and general `relatedProducts` are separate relationships.
- Migration up/down/up and Phase 3 integration verification passed on a disposable clean database.

### Phase 4 completion

- Configuration-aware item storage is implemented across carts, orders, and transactions.
- Cart matching normalizes selection ordering and separates otherwise-identical lines with different selections.
- Server validation and server-owned prices/totals are enforced.
- Historical product, variant, price, group, and option snapshots are preserved for orders and transactions.
- The data-preserving migration passed clean-database up/down/up verification.
- Phase 3 and Phase 4 Payload verification, seed continuity, TypeScript, lint, production build, journal tests, and showcase tests pass.

### Phase 5 completion

- The existing Delan seed is reused; no duplicate source records or bulk importer were created.
- A server-only Payload repository and mapper preserve the storefront DTO boundary.
- Delan is discoverable in the existing shop and renders in the existing Product UI with real source-backed fields.
- Configuration selection and the trusted cart quote bridge are wired into the browser cart without beginning the Phase 8 persistence/checkout migration.
- Real Payload cart identity, quantity merging, configuration splitting, trusted totals, and Delan order snapshots pass the repeatable Phase 5 verification.
- Delan remains inquiry-only until Nilper supplies an authoritative price; the verification price is temporary and restored.
- The Phase 5 architecture implementation gate passed. Payload architecture is **LOCKED**; do not compare or introduce alternative commerce frameworks without a proven blocker.

### Phase 7 completion

- The public catalog now reads reviewed products, categories and filter values from Payload through the established repository/mapper DTO boundary.
- Filtering, sorting and pagination are database-backed; categories, facets and product paths are derived from real catalog records.
- Product details and related products no longer fall back to fixtures.
- Homepage catalog sections, header navigation and the sitemap use the same Payload source.
- Product/static route output uses a five-minute Next.js revalidation policy and preserves SEO/server rendering.
- Demo showcase fixtures remain non-interactive and cannot link to retired catalog product URLs.
- A localized routing-level 404 is enabled for the app's multiple root layouts.
- TypeScript, lint, build, browser/HTTP checks, journal/showcase suites, Payload Phase 3–5 and manual-catalog verification pass.

### Phase 8 completion

- Guest carts persist only compact, versioned ID references in browser storage and are revalidated on the server.
- Authenticated carts persist in Payload, merge guest selections on sign-in, preserve configuration-aware identity, and remain isolated per customer.
- New checkout orders are created only from authenticated server-owned Payload carts; client product data and prices are ignored.
- Order creation and cart completion are atomic, and a unique source-cart relationship prevents duplicate submission.
- Payload Admin exposes Nilper order numbers, contact/fulfillment snapshots, trusted commerce snapshots, and the complete Nilper status lifecycle.
- Account order history reads Payload orders owned directly by the authenticated customer.
- Committed cart/order migrations, generated types, Phase 8 integration verification, TypeScript, lint, build, manual catalog, journal, and showcase checks pass.

### Phase 9 completion

- Payload has a dedicated customer auth collection, private OTP challenges, and revocable customer sessions; Admin/editor users remain separate.
- Iranian phone numbers are normalized consistently, OTPs expire after five minutes and are one-time, resend and request rates are limited, invalid attempts lock after five tries, and only keyed hashes are stored for OTP-sensitive identifiers and tokens.
- Production SMS delivery uses Kavenegar Verify Lookup with an approved `%token` template; no provider credential or OTP state is exposed to the client.
- Customer profiles, addresses, carts, and orders link directly to the authenticated Payload customer.
- Account profile updates, address creation/listing, order queries, session revocation, and protected account access use Payload/PostgreSQL while preserving the Persian account UX.
- Iran is the supported commerce address country; addresses are manageable in Payload Admin and record default-address state.
- The owner confirmed this is a fresh site, so obsolete legacy identity/storefront-key fields and all Supabase code/configuration were removed instead of migrated.
- The committed account-cutover migration, generated types, Phase 9 integration verification, affected Phase 4/5/8 suites, TypeScript, lint, and production build pass.

### Phase 10 completion

- Zarinpal is the approved first Iranian gateway and is isolated behind Payload Ecommerce's `PaymentAdapter`, so later gateways can be added as peers.
- Payment request and verification calls run only on the server. The merchant ID is read from `ZARINPAL_MERCHANT_ID`; sandbox selection is explicit through `ZARINPAL_SANDBOX`.
- Canonical cart, transaction, and order amounts remain integer Toman. Zarinpal receives Rial only through the centralized `toPaymentGatewayAmount` boundary.
- Online checkout persists a pending transaction before redirecting to Zarinpal. The callback matches the stored authority, verifies the stored amount with Zarinpal, records the provider reference, and creates a confirmed order only after an authoritative success/already-verified response.
- Cancelled, malformed, failed, and amount-mismatched returns do not create orders. Existing successful transaction/order links and unique database relationships make repeated callbacks idempotent.
- The Persian checkout exposes Zarinpal and invoice paths, while the payment result page reads only customer-owned server state instead of trusting query-string success claims.
- Migration `20260912_174237`, generated types, the fake-provider Phase 10 integration suite, affected Phase 8/9 suites, TypeScript, clean lint, production build, journal, and showcase checks pass.

### Phase 11 completion

- Products and variants explicitly use `parcel` or `freight`; defaults and migrated existing rows are safely `freight`.
- Fully parcel carts use the documented Tapin location and quote APIs. Parcel weight, box ID, destination codes, service and quote are server-owned snapshots.
- Freight and mixed carts receive manual shipping coordination after checkout, with zero shipping charged through Zarinpal. Parcel carts add a fresh server-side Tapin quote to the trusted product subtotal.
- The checkout never supplies a trusted shipping price. Payment initiation recalculates from the authenticated Payload cart before creating the Zarinpal transaction.
- Tapin shipment registration is deferred until authoritative Zarinpal verification. Stable order-number `manual_id`, local concurrency control, persisted shipment IDs, and provider duplicate rejection prevent duplicate shipments.
- Orders persist method, amount, provider, service, destination, weight/box, quote, shipment, tracking, provider/internal status, failure details and creation time; tracking refresh is customer-owned.
- Migration `20260913_085957_nilper_tapin_shipping`, generated types, TypeScript, lint, production build, Phase 10 regression, the Phase 11 fake-provider suite, manual-catalog verification, and all 17 journal/showcase tests pass; migration status confirms all nine migrations are applied.
- Live Tapin activation remains fail-closed until the owner supplies the panel authorization/shop/employee/kiosk/origin settings and Tapin confirms whether API monetary fields use Rial or Toman. The implementation does not guess credentials, conversion, or endpoints.

### Phase 12 journal completion

- Public journal posts are owned by the Payload `posts` collection; runtime blog, homepage journal cards, project article links, metadata and sitemap no longer import the static article array.
- Posts use Payload Lexical rich text with an intentionally small editorial surface: H2–H4, paragraphs, lists, links, blockquotes, inline media and tables. Drafts, autosave and version history are enabled, and unauthenticated readers can access only published posts.
- Reading time and word count are derived from the rich-text body at save time. The visible table of contents and anchor IDs are derived from H2 headings at render time; editors do not maintain duplicate navigation fields.
- Each post owns its stable slug, category, description, quick answer, hero media/caption, body, takeaway, CTA, related posts, author identity, featured ordering and optional SEO title/description/social image/topic/no-index controls.
- Public output preserves one H1 and server-rendered prose, and emits self-canonical metadata, crawler controls, sitemap image/date data and `BlogPosting`, breadcrumb and collection JSON-LD. OpenAI search/user crawlers are explicitly allowed; ranking or chatbot recommendation is never represented as guaranteed.
- The four original Persian articles and hero images are installed idempotently by the Payload seed. `src/features/journal/seed-posts.ts` is seed-only migration material and must not be used by runtime routes.
- Migration `20260913_094955_phase12_dynamic_journal`, generated types/import map, Phase 12 verification, TypeScript, clean lint, production build, journal SEO/HTML tests and showcase regressions pass.

### Payload showcase and sales-contact completion

- Brand editorial fields and the new `projects` collection own the public brand/project copy, imagery, ordering, publication state and product/article relationships.
- `/brands`, `/brands/[slug]`, `/projects` and `/projects/[slug]` read published Payload data through `src/features/showcase/payload-showcase-repository.ts`; their established presentation and static calls to action remain intact.
- Active Payload users with the `seller` role and a phone number are exposed through a narrow public contact DTO for the product consultation dialog. Editorial access remains limited to administrators and editors.
- The idempotent seed installs the Accessories category, seven showcase brands and three showcase projects. Migration `20260916_084808_storefront_showcase_and_sales_contacts` carries the schema changes for clean databases.

### Remaining boundary after the gate

- Workbook-specific Excel automation remains deferred by owner decision; routine reviewed JSON import/export is available to administrators through Payload.
- Eight additional manually curated products and their real images are live through the Payload-backed storefront catalog.
- Brand and project showcase pages are Payload-backed; remaining catalog fixtures are seed/compatibility material rather than a public runtime source.
- Payload owns authenticated cart persistence and all new checkout orders; guest browser storage is ID-only and non-authoritative.
- Payload/PostgreSQL is the only customer/account/commerce datastore; Kavenegar remains an OTP delivery provider, not an identity store.
- Phase 12 blog/post migration and the separately authorized brand/project showcase migration are complete. Homepage editorial sections remain file-backed; live Tapin certification remains an external operational dependency.

---

## 16. Documentation continuity protocol

Every future Codex/AI session must:

### Before coding

1. Read `NILPER_CONTEXT.md`.
2. Read `NILPER_TODO.md`.
3. Read `AGENTS.md`.
4. Inspect `git status`, recent commits and the relevant current implementation.
5. Reconcile documentation with code before making changes.
6. Do not repeat completed tasks merely because they appear in an older document.

### During work

- Work on the earliest unfinished task in the current phase unless explicitly instructed otherwise.
- Do not jump phases silently.
- Keep changes focused.
- Run verification at meaningful checkpoints.
- Use official current Payload/Next.js docs when API behavior is uncertain.

### Before ending a session

Update `NILPER_TODO.md`:

- mark completed items `[x]`.
- mark partial items `[~]`.
- mark blockers `[!]`.
- leave future items `[ ]`.
- add concise implementation notes where necessary.
- update `Current State`.
- update last relevant commit SHA if a commit was made.
- never delete completed history.

Update `NILPER_CONTEXT.md` only when a **durable project fact or architecture/domain decision changes**.

Examples:

- currency strategy finalized.
- inventory strategy finalized.
- new permanent collection added.
- authentication architecture changed.
- migration order changed for a proven reason.

Do not fill this file with ordinary session logs.

---

## 17. Verification expectations

At meaningful checkpoints run the applicable checks:

```bash
npm run payload:generate
npm run payload:migrate

npm run lint
npm run build
npm run test:journal
npm run test:showcase
```

For schema/migration work, also test from a clean/dev database when practical.

For Admin/domain changes, verify actual create/edit/save/reopen behavior.

For storefront integration, verify existing public URLs and visuals remain stable.

---

## 18. Reopening architecture

Do not reopen Payload vs Medusa vs Vendure vs WooCommerce vs NestJS discussion because of preference or novelty.

Reopen the architecture only if an implementation test exposes a **proven blocker** that cannot be reasonably solved within the current architecture.

Record the blocker with evidence before proposing a framework change.
