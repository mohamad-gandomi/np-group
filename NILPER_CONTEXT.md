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
- configuration groups/options.
- save/publish/reopen workflow.

Known non-blocking Admin limitations:

- Payload date presentation is still Gregorian-style.
- Some upstream accessibility strings may contain English text.
- These are cosmetic unless they become a real workflow problem.

Do not spend a new phase redesigning the approved dashboard without a concrete usability requirement.

---

## 6. Current Payload implementation

### `payload.config.ts`

Current important behavior:

- PostgreSQL adapter.
- Payload migrations under `src/payload/migrations`.
- Persian Payload translations.
- Admin user collection: `users`.
- timezone: `Asia/Tehran`.
- Payload Admin metadata configured for Nilper.
- Payload Ecommerce plugin enabled.
- generated types written to `src/payload-types.ts`.

### Base collections already implemented

Current non-commerce collections include:

```text
users
media
brands
categories
product-series
configuration-groups
configuration-options
```

Current concepts already represented:

#### Users

Currently optimized for the Admin/editor preview:

```text
admin
editor
```

Storefront customers use a separate Payload `customers` auth collection and never share the Admin/editor `users` collection. Phone OTP challenges and revocable sessions are private Payload collections; Kavenegar Verify Lookup delivers production SMS while Payload/PostgreSQL owns OTP state.

Payload customers are the canonical storefront identities. Profiles, addresses, carts, and orders link directly to the authenticated customer record; no legacy identity bridge or secondary account datastore remains.

#### Media

Payload upload collection with Persian alt/caption support.

#### Brands

Includes Persian title, slug, description, logo and publication status.

#### Categories

Includes:

- Persian title.
- slug.
- parent relationship.
- image.
- description.
- sort order.
- publication status.

The hierarchy is important because the real Nilper catalog will be deeper than the five current storefront demo categories.

#### Product Series

Represents product families such as:

```text
دلان
داران
ویونا
```

#### Configuration Groups / Options

Already separated from commerce variants.

Examples:

```text
wood-finish
upholstery-palette
```

This separation is a core domain rule and must be preserved.

---

## 7. Current Payload Ecommerce implementation

`src/payload/commerce.ts` currently overrides the official Payload Ecommerce collections rather than replacing the plugin.

### Product fields already represented

Current Product Admin has tabs for:

- identity.
- sales.
- media.
- product information.
- variants/configuration.
- source data.

Important existing fields/concepts include:

```text
title
slug
catalogCode
brand
categories
series

salesMode
availabilityMode

mainImage
gallery

descriptionFa
measurements
technicalSpecs
orderNotesFa
leadTimeFa

configurationGroups
relatedProducts
matchingProducts
```

Sales modes currently include:

```text
direct
inquiry
made_to_order
```

Availability modes currently include:

```text
orderable
in_stock
unavailable
```

### Variant fields already represented

Variants currently support:

```text
product
nilperCode / SKU
title
options
price fields from Payload Ecommerce
variant measurements
manufacturing notes
```

A Nilper SKU/registration code is intentionally separate from fabric/wood/customization choices.

Shared specifications and measurements belong on Product. Measurements that differ by operational registration code belong on Variant. Both use flexible key/label/value structures so furniture, bedroom and dining records do not require hundreds of nullable category-specific columns.

`matchingProducts` records explicit set/coordination relationships from Nilper source material. `relatedProducts` remains available for general merchandising recommendations; the two meanings must not be merged.

Portable catalog operations use the public product `slug` and the unique variant `nilperCode`. Workbook provenance and data-quality-note fields are intentionally not part of the production product/variant domain.

### Commerce features currently configured

Payload Ecommerce currently has foundations for:

- Products.
- Variants.
- Carts.
- Addresses.
- Orders.
- Transactions.
- Payments through provider adapters (Zarinpal first).

Current preview choices:

- carts are hidden from Admin.
- addresses, orders, and transactions are visible in Admin with Nilper-oriented labels and columns.
- guest carts are disabled.
- inventory is intentionally disabled until an authoritative stock-quantity source exists.
- Stripe is not implemented.
- Zarinpal is the first Iranian payment provider; future gateways must be added as separate adapters without changing the canonical Toman model.

Configuration-aware commerce behavior is implemented in `src/payload/cart-configuration.ts`:

- every cart, order, and transaction item stores normalized configuration selections plus readable Persian snapshots.
- one cart-line identity is product + optional variant + normalized `(groupKey, option ID)` selections; input order does not affect matching.
- the server verifies publication state, product/variant ownership, allowed and active groups, option membership/activity, required selections, positive integer quantity, and the current server price.
- client-provided title, code, configuration labels, identity keys, subtotals, amounts, and unit prices are overwritten or ignored.
- cart totals are recalculated against current trusted records; order and transaction snapshots remain historical during updates that do not explicitly replace their items.
- configuration relationship columns are nullable with readable snapshots retained, so later deletion of a source option/group does not erase historical order wording.
- inventory quantities are not checked because inventory is intentionally disabled until an authoritative stock source exists.

Guest carts remain disabled. Therefore Payload's guest-cart merge path is outside the current supported boundary; it must be re-evaluated if guest carts are enabled later.

The supplied spreadsheets describe orderability and manufacturing choices, not stock counts. Until a real stock source is connected, use `salesMode` and `availabilityMode`; do not manufacture numeric inventory. Payload inventory can be reconsidered later only for direct/in-stock SKUs with authoritative quantities.

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

Nilper is not a simple `product + price + stock` store.

Real source files show:

- product families / series.
- separately sellable products within a series.
- registration/order codes.
- product-specific specifications.
- dimensions.
- wood finishes.
- upholstery/fabric palettes.
- made-to-order behavior.
- order-taking notes.
- related/matching products.
- different data shapes for furniture, bedroom, dining and other categories.

### Most important rule

```text
Variant != every customer choice
```

Create a **Variant** only when a sellable form has a real operational identity such as:

- distinct Nilper registration/order code.
- distinct SKU.
- distinct price.
- distinct inventory identity.
- materially distinct physical dimensions.
- independently handled manufacturing/order identity.

Use **Configuration Groups / Options** for choices such as:

- fabric.
- upholstery palette.
- wood finish.
- decorative finish.
- other customization that does not create a real operational SKU.

Avoid:

```text
Product × 20 fabrics × 8 wood finishes × ...
```

Prefer:

```text
Product
  -> small number of real Variants
  -> Configuration Groups
       -> Configuration Options
```

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
Series: Daran
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

- Product Series.
- multiple Products.
- real Variants.
- separate Configuration Groups.
- related/matching relationships.

### Data entry and transfer status

The owner deferred workbook-specific Excel automation because the files require different extraction rules and manual decisions. The workbooks remain outside the repository and must not be copied into `public/` or committed. Do not add an Excel parser or workbook-specific automation unless the owner explicitly reopens that work with approved mapping rules.

Routine reviewed data transfer uses Payload's official import/export plugin with one JSON array per collection. Administrators may export the current selection/filter or all records, and may create, update, or upsert a small batch. Media files are bulk-uploaded to Payload first; JSON refers to them by filename. Product/post/project relations use `slug`, variants use `nilperCode`, configuration groups use `key`, and variant types use `name` where those stable fields are available.

All media references exposed by this JSON workflow are optional. An omitted value, `null`, an empty string, or whitespace-only text means “leave the image empty”; a non-empty filename must still resolve to exactly one existing Payload Media record. The public storefront preserves the relevant image frame without substituting a misleading placeholder and never passes an empty source to `next/image`. Editors can attach the real media later in Payload.

Imports and exports are admin-only and execute through Payload Jobs. A daily scheduled task deletes import/export files and their administrative records after seven days without deleting imported content. Plesk must fetch Payload's official `/api/payload-jobs/run` endpoint every minute over HTTPS with the server-only `PAYLOAD_JOBS_CRON_SECRET`; the endpoint fails closed unless the secret has at least 32 characters and matches exactly. Other schedulers should send the same secret as a Bearer token. Every deployment must still run `npm run payload:migrate` once before serving the new release.

---

## 11. Current Delan preview

An idempotent Payload seed already exists.

It creates representative preview data for:

- Nilper brand.
- relevant categories.
- Delan series.
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

These records include optimized supplied photography, Persian descriptions and specifications, confirmed dimensions, configuration relationships, source traceability, and 22 distinct operational registration-code variants. No price was present, so every addition remains made-to-order with pricing disabled.

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

Payload now drives public category/product listings, database-backed filters/search/sort/pagination, product details, related products, homepage selections, desktop/mobile navigation and sitemap entries. Product routes are generated from reviewed Payload records. Cached reads keep a five-minute safety TTL, while Payload `afterChange`/`afterDelete` hooks immediately expire the affected catalog, journal, showcase or sales-contact tags and paths after a public record changes.

The hook boundary covers products, variants and their option/type records; catalog taxonomy/configuration; posts and blog categories; brands, projects and media; and public seller-contact data. Draft-only edits remain private and do not churn the public cache, while publishing, editing or deleting a visible record refreshes the next storefront request. No WebSocket or browser push channel is used: an already-open page updates on its next navigation or reload.

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

Guest local storage contains only stable product/variant IDs, quantity, and configuration group/option IDs. It is never authoritative for product metadata or prices. Signing in merges those references into the user's Payload cart after server validation.

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
