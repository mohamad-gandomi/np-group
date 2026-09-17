# Nilper Payload Migration TODO

This is the execution plan for Codex working locally in `mohamad-gandomi/np-group`.

Before implementation, read these files completely in order:

1. `NILPER_CONTEXT.md`
2. `NILPER_TODO.md`
3. `AGENTS.md`

`NILPER_CONTEXT.md` and `NILPER_TODO.md` are the only canonical Nilper architecture, planning, and progress documents.

## Current State

- **Active phase:** Post-Phase 12 Payload administration and data operations.
- **Dashboard approval:** APPROVED. Do not repeat Phase 0, Phase 1, or the dashboard approval gate.
- **Working foundation:** Existing Next.js storefront + Payload CMS/Ecommerce + PostgreSQL; Payload owns the reviewed catalog, secure phone OTP challenges, customer sessions, profiles, addresses, authenticated carts, payment transactions, orders, and order lifecycle. Kavenegar provides production OTP delivery and Zarinpal is the first server-side payment provider. Supabase has been removed.
- **Next implementation task:** Deploy the pending data-transfer and optional-image migrations, configure Plesk to fetch the secured Payload jobs endpoint every minute, then retry the reviewed post import and perform an authenticated production smoke test. Live Tapin certification remains a separate operational task when credentials and the amount unit are supplied.
- **Later phases:** Payload architecture is locked and Phases 0–5 and 7–12 are complete. Workbook-specific Phase 6 automation remains deferred, while official Payload JSON transfer is available for routine small batches. Homepage editorial sections remain file-backed until the owner explicitly asks to migrate them.

## Latest Session Note

- **Date:** 2026-09-17
- [x] Made every media field available through the official JSON import workflow optional, including post hero/social images, product main/gallery images, project hero/gallery images, brand media, category images, series media and configuration swatches.
- [x] Normalized omitted, `null`, empty-string and whitespace-only imported image references as empty media values. A non-empty filename that cannot be resolved still fails visibly instead of hiding a typo.
- [x] Removed automatic storefront placeholder substitution for missing Payload product, project and brand media. Public cards, galleries, navigation, cart/order views, metadata, structured data and sitemap now preserve an empty image frame without passing an invalid source to `next/image`.
- [x] Added migration `20260917_171851_optional_import_images` for nullable project hero/gallery columns and regenerated Payload types/import map.
- [x] Added `payload:verify:optional-import-images`; the focused optional-image check, Phase 12 no-hero draft verification, TypeScript, lint and production build pass.
- [!] The new migration file is ready, but the local migration runner correctly stopped at Payload's destructive dev-schema warning. Production must run migrations through the normal deployment process before the new release is served.
- **Working-tree checkpoint:** Optional-image import support is implemented but intentionally not committed; latest repository commit remains `6be12b1` (`feat(ops): secure Payload jobs cron endpoint`).
- [x] Added the official Payload import/export plugin for products, variants, posts, projects, brands, categories, series, configuration groups/options, variant types/options, and blog categories.
- [x] Restricted transfer collections, endpoints, jobs access, and list-menu controls to the `admin` role; localized the workflow for the Persian admin and forced portable JSON exports.
- [x] Added stable-reference conversion for slugs, `nilperCode`, configuration keys, variant type/option identities, and media filenames. Images are uploaded through Payload Media before the JSON batch.
- [x] Added background import/export processing, a daily seven-day retention task, the one-shot `payload:jobs` command, Plesk Scheduled Task instructions, and per-collection sample JSON templates.
- [x] Removed `sourceKey`, `sourceMetadata`, all source-quality-note fields, the Admin «منبع داده» section, obsolete source-identity code, and their seed/verification dependencies.
- [x] Generated migration `20260917_101243_nilper_data_transfer`, which creates official import/export/job tables and removes source columns and indexes from products, variants, and their version tables on deployment.
- [x] Regenerated Payload types/import map and passed TypeScript, clean lint, the production build, all Payload Phase 3–5 and 8–12 checks, manual-catalog verification, 6 journal tests, and 13 showcase tests before commit/push.
- [x] Clarified that the import/export collections are seven-day operation histories and renamed their navigation labels accordingly. Replaced the CDN-dependent JSON editor after its Monaco loader failed locally, and made JSON/table previews contained, horizontally scrollable, and left-to-right/left-aligned inside the RTL admin.
- [x] Added an explicit saved-file download action to export history rows and document controls, exposed pending background status when a file is not ready, and removed the empty upload surface from saved export pages.
- [x] Ran the local Payload worker and generated the two surviving project export files. One orphaned job for an already-deleted export history record failed safely and does not affect the surviving records; the scheduled Plesk HTTP trigger remains required in production.
- [x] Updated the showcase regression suite to reflect the Payload-published, indexable brand/project records and their real catalog links introduced by the previous storefront checkpoint.
- [x] Replaced the Plesk npm/SSH worker requirement with Payload's official HTTP jobs endpoint, protected by a server-only secret, constant-time comparison, minimum secret length, HTTPS deployment guidance, and a focused authorization verification script.
- [x] Locally verified the endpoint returns `401` for an invalid secret and `200` for the configured secret. The HTTP-cron implementation is ready for production deployment.
- [!] Local migration status shows the two newest migrations as pending because this development database was synchronized through Payload's development schema push. Production must run the normal `payload:migrate` command before serving the new release.
- **Session checkpoint:** The data-transfer/admin cleanup is complete on `main`; use `git log` for the immutable commit hash.

- **Date:** 2026-09-16
- [x] Added Payload-owned brand editorial fields and a Projects collection, then connected brand/project indexes, detail pages, product relationships, article links, metadata and sitemap records through a cached server-only repository.
- [x] Added the `seller` user role and safe contact fields without granting editorial permissions; product pages now open a responsive consultation dialog backed by active Payload seller records and the main store contact details.
- [x] Added the Accessories homepage category, balanced the desktop category grid, equalized product cards, added a temporary Enamad footer mark and refined article tables.
- [x] Added migration `20260916_084808_storefront_showcase_and_sales_contacts`, regenerated Payload types and seeded seven brands plus three projects for local evaluation.

- **Date:** 2026-09-13
- [x] Completed the owner-approved Phase 12 scope: the journal is now backed by the Payload `posts` collection while preserving all four existing public slugs and the current Persian visual design.
- [x] Added a focused Persian editorial workflow with drafts/autosave/version history, H2–H4 headings, paragraphs, lists, links, blockquotes, inline media and tables, plus featured ordering, related posts, CTA, author and SEO controls.
- [x] Reading time and word count are calculated from Lexical rich text on save; the desktop/mobile table of contents and stable anchor IDs are generated from visible H2 headings with no duplicate editor fields.
- [x] Metadata, canonical URLs, robots control, social images, `BlogPosting`/breadcrumb/collection JSON-LD, homepage cards, project cross-links and the image sitemap now read published Payload data. `OAI-SearchBot` and `ChatGPT-User` are explicitly allowed while Google and other crawlers remain covered by the existing wildcard rule.
- [x] Migrated the four static article bodies and their hero media through the idempotent seed. `src/features/journal/seed-posts.ts` remains seed-only as the preservation source; no runtime route imports it.
- [x] Added and applied idempotent migration `20260913_094955_phase12_dynamic_journal`, regenerated Payload types/import map, and added `payload:verify:phase12` for published content, media population, derived reading data, H2 TOC and public draft isolation; migration status confirms all ten migrations are applied.
- [x] Passed TypeScript, clean lint, production build, Phase 12 Payload verification, all five journal HTML/SEO tests and all twelve showcase regressions.
- **Phase 12 checkpoint:** Committed on `codex/payload-phase-12` as `6d300e4` (`feat(content): migrate journal posts to Payload`).
- [x] Completed Phase 11 with explicit `parcel` and `freight` modes on products and variants; every existing record defaults safely to `freight`.
- [x] Replaced the undocumented HeroPost candidate with a provider-neutral shipping boundary and Tapin, using only the official public location, quote, order-registration, and status-report endpoints.
- [x] Added server-owned parcel weight and Tapin box metadata plus immutable item shipping snapshots so checkout, payment, and later shipment retries do not trust browser prices or mutable catalog data.
- [x] Added official Tapin province/city selection and parcel-service selection to the Persian checkout. Parcel quotes are recalculated on the server; freight and any mixed cart use manual freight coordination with shipping amount zero at checkout.
- [x] Zarinpal now receives product subtotal plus server-quoted Tapin shipping only for all-parcel carts. Freight and mixed carts charge products only.
- [x] Persisted shipping mode, amount, provider, service, destination codes, total weight, box, quote time, shipment ID, tracking code, raw provider status, internal status, failure message, and shipment timestamp on orders; payment transactions keep the quote snapshot.
- [x] Tapin shipment registration runs only after authoritative Zarinpal verification. The order number is sent as Tapin `manual_id`, a local in-flight guard prevents concurrent duplicates, stored shipment IDs make callbacks idempotent, and Tapin duplicate codes remain the provider-side safety boundary.
- [x] Added authenticated customer-owned tracking refresh and mapped Tapin's documented statuses to Nilper shipment states.
- [x] Added and applied migration `20260913_085957_nilper_tapin_shipping`, regenerated Payload types, and added `payload:verify:phase11` coverage for parcel, freight, mixed carts, payment totals, API failure, post-payment creation, tracking, and duplicate prevention.
- [!] Live Tapin certification is blocked only on external configuration: exact `Authorization` header value, shop/employee/kiosk IDs, origin codes, packaging weight, registration mode, and official confirmation whether monetary API fields are Rial or Toman. Missing values fail closed; no endpoint, amount conversion, credential, or shipment is invented.
- [x] Passed TypeScript, clean lint, production build, Phase 10 regression, Phase 11 integration verification, manual-catalog verification, and all 17 journal/showcase tests. Migration status confirms all nine migrations are applied.

- **Date:** 2026-09-12
- [x] Completed Phase 10 with Zarinpal as the approved first Iranian gateway behind a Payload Ecommerce `PaymentAdapter`; the provider boundary is isolated so additional Iranian adapters can be added later.
- [x] Added server-side request, redirect, callback, verification and order-confirmation flow. Online checkout creates a pending transaction first and creates a confirmed order only after Zarinpal returns an authoritative verification code.
- [x] Kept canonical prices and transaction totals as integer Toman and used the centralized money helper for the single Rial conversion at the provider boundary; callback query values are never trusted for the amount.
- [x] Persisted Zarinpal authority, reference ID, response code, masked card details, fee metadata, callback/verification timestamps and failure state in visible Payload transaction records.
- [x] Made callback handling idempotent through transaction/order state checks and unique source-cart/payment-transaction relationships; cancellations and mismatched stored amounts do not create orders.
- [x] Added the Persian checkout gateway choice and customer-owned result page, server-only environment configuration, migration `20260912_174237`, generated types, README operations, and repeatable `payload:verify:phase10` coverage with a fake gateway client.
- [x] Passed TypeScript, clean lint, production build, Payload Phase 8/9/10 suites, and journal/showcase regressions.
- [x] Completed Phase 9.2: account profile updates, address creation/listing, and order queries now use Payload/PostgreSQL while preserving the existing Persian account UX.
- [x] Completed Phase 9.3: removed Supabase packages, clients, proxy/session fallbacks, Edge Function, SQL migration, environment variables, and README instructions after verifying the Payload replacements.
- [x] Simplified ownership for this fresh site: customers now link directly to profiles, addresses, carts, and orders by Payload customer relationship; obsolete legacy identity and storefront-key bridge fields were removed.
- [x] Added Iran as the supported address country, exposed addresses in Payload Admin with Persian labels and default-address state, and applied `20260912_111822_nilper_payload_account_cutover`.
- [x] Passed TypeScript, clean lint, production build, Phase 4/5/8/9 Payload suites, migration status, journal/showcase regressions, and a live browser flow covering OTP login, profile update, first/default address, overview count, logout, protected-route redirect, and browser error checks.
- [x] Completed Phase 9.1 with a separate Payload `customers` auth collection, private OTP challenge records, and revocable customer session records; existing editorial `users` remain isolated from storefront customers.
- [x] Integrated Kavenegar Verify Lookup directly for production OTP delivery using an approved `%token` template, while keeping OTP generation, hashing, expiry, attempt enforcement, and validation inside Payload/PostgreSQL.
- [x] Added five-minute one-time OTPs, 60-second resend cooldowns, per-phone and per-IP rate limits, five-attempt lockout, keyed hashes for phones/IPs/codes/session tokens, secure HTTP-only cookies, seven-day sessions, and server-side logout revocation.
- [x] Initially introduced a transition identity bridge in Phase 9.1; the owner later confirmed this is a fresh site, so Phase 9.3 removed the bridge and direct Payload customer relationships are now canonical.
- [x] Added and applied `20260912_104215_nilper_customer_auth`, regenerated Payload types, and added a repeatable Phase 9 auth verification suite covering limits, invalid attempts, one-time use, customer creation, authentication, and revocation.
- [x] Verified the live Persian login flow with local OTP `123456`, account-history continuity, logout, protected-route redirect, meaningful page content, no framework error overlay, and no browser console errors.
- [x] Fixed a stale legacy Supabase-cookie redirect loop by leaving authenticated login-page redirection to the server page's verified user lookup.
- [x] Passed TypeScript, lint, production build, Phase 8 and Phase 9 Payload suites, and journal/showcase regressions; Phase 3–5 checks also passed against the new customer relations during implementation.
- [x] Completed Phase 8: authenticated carts and all new checkout orders now persist in Payload while the existing Persian storefront UI remains intact.
- [x] Replaced full browser-stored product objects with a versioned, configuration-aware guest cart containing only stable IDs and quantities; guest selections are revalidated server-side and merged into the signed-in cart.
- [x] Added an opaque, indexed storefront-customer key so current authenticated users can own isolated Payload carts and orders without prematurely replacing the Phase 9 authentication system.
- [x] Replaced Supabase order writes with transactional Payload order creation sourced only from the authenticated server-owned cart; duplicate submission is guarded by a unique source-cart relationship.
- [x] Added Nilper order numbers, contact and fulfillment snapshots, and the statuses pending review, confirmed, in production, ready, shipped, delivered, and cancelled to Payload Admin.
- [x] At the Phase 8 checkpoint, kept legacy Supabase orders readable alongside new Payload orders; completed Phase 9 later replaced this transition layer and removed Supabase.
- [x] Added and applied committed cart/order migrations, regenerated Payload types, updated older verification fixtures, and added a repeatable Phase 8 isolation/persistence/status test.
- [x] Verified TypeScript, lint, production build, Phase 8, manual catalog, journal, and showcase suites; Phase 3–5 regression suites also pass against the evolved schema.
- [x] Completed Phase 7: all public shop categories, product listings, facets, search, filtering, sorting, pagination, product details, related products, homepage selections, header navigation, static product paths and sitemap entries now read reviewed records through the server-only Payload repository/mapper boundary.
- [x] Moved category, brand, room/use, material, color/configuration, availability, price and newest sorting logic to Payload Local API queries; filters with no useful real data are hidden.
- [x] Added a durable storefront taxonomy adapter for mapping source category slugs to stable public routes without exposing generated Payload document types to UI components.
- [x] Added five-minute Next.js catalog caching/revalidation and Payload-backed static product generation while preserving server rendering and existing public URLs.
- [x] Removed stale demo product-detail links from brand/project showcase pages; their fixture cards remain explicitly non-interactive demo references and link only to the current catalog.
- [x] Added the documented Next.js 16 global 404 convention for this app's multiple root layouts, preserving the existing Persian recovery UI for unmatched routes.
- [x] Verified the live shop, search, category, material/color filters, pagination, product detail, related product, homepage, sitemap and localized 404 behavior in a browser and through HTTP with no browser errors or framework overlay.
- [x] Passed TypeScript, lint, production build, Payload Phase 3–5, manual catalog, journal and showcase suites, including their live HTTP checks.
- [x] Manually reviewed the supplied ZIP packages as source material without creating an automated importer or committing any ZIP/XLSX source file.
- [x] Added eight source-backed products: تخت داران، تخت ژیوار، تخت اورامان، تخت مانی، صندلی بار ویونا، تخت لاوان، تخت ماهور و مبل دایان.
- [x] Added 22 operational variants using the registration codes exactly as supplied; wood, upholstery and finish selections remain separate from SKU identity.
- [x] Preserved source anomalies instead of repairing them: 852 worksheet/width inconsistency, 506/507 code mismatch, missing 850 width-180 registration codes, and duplicated Dayan code `NHSS871002`.
- [x] Added optimized product photography for the eight additions and replaced the Delan main placeholder with supplied Delan photography.
- [x] Extended the idempotent seed and added a repeatable manual-catalog verification; two consecutive seed runs produced no duplicate product slugs or variants.
- [x] Verified TypeScript, lint, production build, manual catalog, Payload Phase 3–5, journal, and showcase suites.
- [x] Stopped Phase 6 before implementation at the owner's request because the workbooks require different extraction rules and manual handling.
- [x] Confirmed that no workbook was copied, changed, staged, or committed and no importer dependency or importer code was added.
- [x] Marked the automated Excel import pipeline as deferred; manual Payload catalog preparation is the interim path.
- [x] The later 2026-09-17 admin cleanup removed workbook provenance fields from the production domain and replaced them with stable slug/SKU-based JSON transfer.
- [x] Reused and verified the existing Delan seed foundation without duplicating or bulk-importing workbook records.
- [x] Added the server-only Payload catalog repository and mapper while preserving the existing serializable storefront Product DTO.
- [x] Added Delan to the hybrid shop listing and rendered its real source-backed description, media, variants, specifications and configuration choices in the existing Product UI.
- [x] Added a server cart-quote bridge that reuses Phase 4 validation before a Payload-backed product enters the browser cart.
- [x] Added a repeatable Phase 5 test for Delan mapping, same/different configuration cart identity, trusted totals, and historical order snapshots.
- [x] Kept the production seed price-disabled because the source has no authoritative price; the verification uses and restores a temporary test-only price.
- [x] Normalized same-app Payload media to `/api/media/file/...` paths so `next/image` never captures the local Payload server hostname; added a regression assertion.
- [x] Verified the live `/shop` and `/shop/furniture/delan-sofa` responses, TypeScript, lint, production build, Phase 3–5 suites, journal tests and showcase tests.
- **Phase 7 files added:** `src/features/catalog/catalog-taxonomy.ts`, `src/app/global-not-found.tsx`, and `src/components/not-found-page.tsx`.
- **Files intentionally retained:** `src/features/catalog/catalog-data.ts` remains only for explicitly labeled demo brand/project references; foundational Payload migration history remains required for clean database setup; `AGENTS.md` and its generated Next.js block remain untouched.
- **Current active phase:** Phase 12 blog/post migration completed in the working tree.
- **Latest relevant implementation commit:** `6d300e4` (`feat(content): migrate journal posts to Payload`).
- **Phase 12 checkpoint:** Complete on `codex/payload-phase-12`.
- **Next implementation task:** Author and review posts through Payload Admin; migrate other optional editorial areas only on explicit owner direction. Configure/certify live Tapin separately when its production settings are available.

## Working rules for Codex

- Do not redesign or replace the existing public frontend.
- Do not reintroduce Supabase or a second customer/account datastore without an explicit architecture decision.
- Do not build or run an Excel product importer unless the owner explicitly reopens the deferred Phase 6 work.
- Do not treat every fabric/wood/color choice as a Variant.
- Do not add workbook-specific Excel automation unless the owner explicitly reopens that work.
- Keep commits small and focused.
- Run lint/build/tests at meaningful checkpoints.
- Read root `AGENTS.md` before editing Next.js code.
- For Next.js 16 APIs/conventions, inspect the relevant docs inside `node_modules/next/dist/docs/`.
- Use current official Payload docs while implementing; do not guess APIs from older Payload versions.

---

# Phase 0 — Baseline and safety

**Status: [x] Completed**

## 0.1 Create an implementation branch

Recommended:

```bash
git checkout -b feat/payload-foundation
```

## 0.2 Record baseline

Run before modifications:

```bash
npm ci
npm run lint
npm run build
npm run test:journal
npm run test:showcase
```

Record any pre-existing failures separately; do not attribute them to Payload.

## 0.3 Read existing implementation

At minimum inspect:

- `AGENTS.md`
- `package.json`
- `next.config.ts`
- `.env.example`
- `README.md`
- `src/features/catalog/catalog-types.ts`
- `src/features/catalog/catalog-data.ts`
- `src/features/catalog/catalog-query.ts`
- `src/features/product/`
- `src/features/cart/cart-context.tsx`
- `src/app/(frontend)/api/orders/route.ts`
- `src/features/account/account-data.ts`
- `supabase/migrations/20260829000000_account_dashboard.sql`

Do not start by modifying UI components.

---

# Phase 1 — Payload foundation inside the existing Next.js app

**Status: [x] Completed**

## 1.1 Install Payload dependencies

The repo currently uses npm and has a `package-lock.json`; keep npm unless there is a concrete incompatibility.

Expected packages include the current compatible versions of:

```text
payload
@payloadcms/next
@payloadcms/db-postgres
@payloadcms/plugin-ecommerce
@payloadcms/richtext-lexical
@payloadcms/translations
sharp
```

GraphQL is optional; do not install it unless actually used.

Use versions compatible with the installed Next.js `16.3.4` and React versions. Let the package manager resolve a coherent Payload package version set; all `@payloadcms/*` packages should stay version-aligned.

## 1.2 Add Payload to the existing app

Follow the **current official "Adding to an existing app"** documentation.

Requirements:

- add Payload's required `(payload)` App Router files without replacing current routes
- wrap the existing `next.config.ts` with `withPayload`
- preserve current `experimental.useTypeScriptCli = false`
- create Payload config in the conventional supported location
- configure Postgres adapter
- add a Payload secret
- add generated Payload types

Potential env variables (exact names should follow current Payload version):

```env
DATABASE_URI=
PAYLOAD_SECRET=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Do not remove Supabase variables yet.

## 1.3 Local Postgres

Use an actual local/dev Postgres database.

If the developer already has Postgres, use it.

Only add Docker Compose if it is genuinely useful; do not introduce infrastructure just for style.

## 1.4 First Admin

Acceptance criteria:

- app starts with `npm run dev`
- public homepage still loads unchanged
- `/admin` loads Payload Admin
- first admin user can be created
- Payload can connect to Postgres
- migrations/schema generation works
- no visual rewrite of the storefront

Commit checkpoint:

```text
feat(payload): add Payload foundation to existing Next app
```

---

# Phase 2 — Admin Persian/RTL usability spike

**Status: [x] Completed and manually approved**

## 2.1 Enable Persian Admin language where supported

Use `@payloadcms/translations` and current Payload i18n configuration.

Goal: Admin users should be able to work comfortably with Persian content.

## 2.2 RTL check

Do not enable multilingual content just to get RTL.

Test current Payload capabilities and use the smallest supported configuration/customization necessary.

Check:

- labels
- text inputs
- relationship selectors
- arrays/groups
- product edit form
- variant edit form
- tables/lists
- dialogs

Document minor cosmetic RTL issues; fix only issues that block actual use.

Acceptance criteria: an editor can create/edit a Persian product without layout becoming confusing.

---

# Phase 3 — Define the Nilper data model

**Status: [x] Completed**

Do not import Excel yet.

## 3.1 Create base collections

Implement/configure:

- `users`
- `media`
- `brands`
- `categories`
- `product-series`
- product/variant collections based on Payload Ecommerce overrides
- `configuration-groups`
- `configuration-options`

Use access controls from the beginning.

## 3.2 Ecommerce plugin setup

Configure the current official `@payloadcms/plugin-ecommerce`.

Use/override its commerce collections rather than copying plugin internals.

Enable only what is useful, including:

- products
- variants
- carts
- addresses
- orders
- transactions
- inventory where meaningful

Do not implement Stripe.

## 3.3 Toman currency spike — MUST resolve before real prices

The current site uses integer Toman prices.

Test a custom zero-decimal Toman currency object through:

- product price fields
- variant price fields
- Ecommerce Provider
- cart subtotal
- transaction/order amount
- price formatter

If it works cleanly, document the chosen application currency code and centralize it.

If the plugin requires strict ISO currency semantics at some boundary, document the Rial/Toman conversion strategy before continuing.

Acceptance criteria:

- there is exactly one source of truth for money units
- no implicit `/ 10` or `* 10` scattered around components

## 3.4 Technical specs

Implement a flexible Persian technical-spec structure rather than category-specific hundreds of nullable fields.

Example shape:

```ts
{
  key: 'frame-material',
  labelFa: 'جنس اسکلت',
  valueFa: 'چوب راش',
  group: 'construction',
  sortOrder: 10,
}
```

Promote fields to first-class properties only when needed for filtering/business logic.

Commit checkpoint:

```text
feat(catalog): define Nilper Payload product domain
```

Completion record:

- [x] Base and commerce collections finalized with editorial/public access controls.
- [x] Flexible shared Product specs and Product/Variant measurements implemented.
- [x] Variant operational identity remains separate from configuration choices.
- [x] Stable product slugs and unique variant registration codes implemented for idempotent seed and JSON transfer operations.
- [x] Explicit matching-product relationships separated from general recommendations.
- [x] Integer `TMN` application currency and explicit gateway-unit conversion finalized.
- [x] Inventory policy finalized without inventing quantities absent from source data.
- [x] Data-preserving migration and clean-database up/down/up verification passed.

---

# Phase 4 — Cart configuration extension

**Status: [x] Completed**

## 4.1 Add custom configuration to cart items

Extend Payload Ecommerce cart collection/items so a line can store selected Nilper configuration.

Target concept:

```ts
configuration: [
  {
    groupKey: 'wood-finish',
    option: '<relationship/id>',
    labelFaSnapshot: 'گردویی',
  },
  {
    groupKey: 'fabric',
    option: '<relationship/id>',
    labelFaSnapshot: 'LAVENDAR',
  },
]
```

Use stable IDs plus readable snapshots where appropriate.

## 4.2 Implement a custom `cartItemMatcher`

Same product + same variant + different configuration = separate cart line.

Same product + same variant + same configuration = same line and quantity can increment.

Normalize configuration ordering before comparison.

## 4.3 Validate on server

On add-to-cart / checkout server path:

- product exists and is published
- variant belongs to product
- requested configuration group is allowed for product
- option belongs to that group and is active
- all required groups have selections
- price is read from server data
- inventory is checked when applicable

Never trust client-sent price.

Completion record:

- [x] Stable group/option relationships and readable Persian snapshots added to carts, orders, and transactions.
- [x] Product/variant/configuration identity is normalized before cart-line matching.
- [x] Same configuration merges quantities; different wood/fabric selections split lines.
- [x] Current records and required selections are validated on the server.
- [x] Unit prices, subtotals, and order/transaction amounts are server-owned integer Toman values.
- [x] Historical order/transaction snapshots remain unchanged when source product/configuration records are edited.
- [x] Inventory validation is intentionally not applicable while Payload inventory remains disabled for lack of authoritative quantities.
- [x] Migration and integration verification passed on both the development database and a disposable clean database.

---

# Phase 5 — Delan vertical slice (architecture gate)

**Status: [x] Completed; architecture implementation gate passed**

Use `994.xlsx` as the primary real source sample.

Do NOT bulk-import the entire workbook automatically yet. Manually/seed a minimal accurate slice to prove the model.

## 5.1 Create Delan series

**Existing foundation: [x] Present in the idempotent seed; verify, do not recreate.**

Create `دلان` as a Product Series.

## 5.2 Create at least one real Delan product

**Existing foundation: [x] Seeded from `994.xlsx` / `HSS 994`; verify, do not recreate.**

Recommended first product: Delan sofa from sheet `HSS 994`.

Persian data to represent includes:

- catalog identity
- product name: دلان
- style: نئوکلاسیک
- use: پذیرایی
- Persian description
- frame/base/back/seat materials and other Persian specifications
- wood finish choices
- compatible fabric palettes
- order-taking notes
- dimensions
- related matching coffee/side table and dining records can be added as relationships later in the slice

## 5.3 Create real variants only

**Existing foundation: [x] Source-traceable operational codes are seeded without correcting the recorded 940/994 inconsistency.**

Use the registration/order-code section to decide the initial variants.

Example business distinction in the sheet includes:

- تک نفره
- سه نفره
- تک رنگ / چند رنگ
- distinct Nilper registration codes

Before creating a variant, confirm the registration code exactly as written in the source. Do not autocorrect suspicious codes.

## 5.4 Add configuration groups

**Existing foundation: [x] Wood finish and upholstery palette groups are seeded separately from variants.**

At minimum:

- wood finish
- fabric/upholstery palette

These must not generate combinatorial variants.

## 5.5 Stable catalog identity

**Current foundation: [x] Products use stable unique slugs and variants use unique Nilper registration codes.**

Workbook provenance and data-quality-note fields were removed from the production schema on 2026-09-17. Reviewed facts belong in the actual catalog fields; portable JSON transfer uses stable business identifiers rather than database IDs where practical.

## 5.6 Expose through a storefront repository

Create a Payload-backed catalog repository and mapper.

Suggested conceptual API:

```ts
getCatalogProducts(...): Promise<StorefrontProduct[]>
getProductBySlug(...): Promise<StorefrontProduct | null>
```

Keep the existing storefront DTO (or deliberately evolve it once) instead of passing raw Payload docs into all UI components.

## 5.7 Render Delan in the existing Product UI

Do not redesign ProductView.

Adapt current presentation logic so Payload fields are displayed in the existing design.

Remove category-wide fake details only for the Payload-backed product path when real fields exist.

## 5.8 Cart integration

Add a Delan configuration to cart and prove:

- different wood finishes create distinct cart lines when appropriate
- different fabric choices create distinct cart lines
- quantity changes work
- totals remain server-validatable

## 5.9 Order snapshot test

Create a test order and prove that after product/configuration records are edited, the old order still shows the originally selected:

- product title
- SKU/registration code
- price
- wood finish
- fabric
- quantity

### Architecture gate

If all Phase 5 acceptance criteria pass, mark Payload architecture **LOCKED** and do not compare frameworks again.

Completion record:

- [x] Existing Delan series, sofa, operational variants and configuration groups reused and verified.
- [x] Server-only Payload repository and mapper implemented without leaking generated Payload types through UI components.
- [x] Delan included in the hybrid shop listing and rendered through the existing Product UI.
- [x] Real Persian content replaces fixture-derived descriptions/specifications on the Payload product path.
- [x] Missing authoritative dimensions/prices stay explicit; no fake Delan price was introduced.
- [x] Configuration selections are validated by the server before a trusted line enters the browser cart.
- [x] Delan cart merge/split, quantity, and trusted total behavior verified against real seeded IDs.
- [x] Delan order snapshots remain historical after product, variant, group, option and price changes.
- [x] Production build and all applicable regression suites pass.
- [x] Payload architecture is **LOCKED** after the vertical-slice gate.

Commit checkpoint:

```text
feat(commerce): complete Delan Payload vertical slice
```

---

# Phase 6 — Automated source import pipeline

**Status: [!] Deferred by owner on 2026-09-10; intentionally omitted from the current execution plan**

The supplied workbooks use different structures and require workbook-specific decisions plus manual review. No automated Excel importer, staging pipeline, source directory, or import dependency should be added now.

Current rules:

- keep the source workbooks outside the repository and outside `public/`;
- enter and review catalog records manually in Payload for the current implementation;
- do not silently correct suspicious catalog or registration identities;
- reopen this phase only when the owner supplies explicit workbook-by-workbook mapping and approval rules.

Separate from the deferred Excel pipeline, routine small-batch administration now uses Payload's official JSON import/export plugin. It is admin-only, supports selected/filtered exports plus create/update/upsert imports, resolves portable relationships, runs in the background, and deletes transfer files after seven days.

---

# Phase 7 — Replace static catalog data

**Status: [x] Completed**

After enough real products are entered and reviewed manually in Payload:

## 7.1 Remove runtime dependence on `catalog-data.ts`

Migrate:

- category listing
- product listing
- filters
- search
- product detail
- related products
- homepage selected products

from fixture arrays to Payload queries.

Do not delete fixture data until all affected pages have Payload replacements.

## 7.2 Server-side catalog queries

Move filtering/sorting/pagination from in-memory arrays to database-backed queries.

Current filters to preserve where they have real data:

- category
- brand
- room/use
- material
- color/configuration where sensible
- availability
- price range
- sort/newest

Do not force a filter merely because the demo fixture had it. Real catalog data decides final filters.

## 7.3 Dynamic product generation/caching

Current product pages use fixture-backed static params. Rework only as needed for Payload-backed dynamic catalog while retaining good SEO/server rendering.

Follow Next.js 16 current caching/rendering rules, not older Next.js assumptions.

Completion record:

- [x] Shop category and product listings, live facets, search, detail pages, related products, homepage selections, navigation and sitemap use reviewed Payload records through the storefront DTO mapper.
- [x] Filtering, sorting and pagination run through Payload Local API queries rather than loading and filtering fixture arrays in memory.
- [x] Real-data facets preserve category, brand, room/use, material, color/configuration, availability and price behavior only when useful values exist.
- [x] Product routes are generated from Payload records, remain server-rendered/SEO-safe and revalidate on a five-minute cache policy.
- [x] Demo showcase fixture cards are retained only as labeled, non-interactive references; they no longer create broken shop product URLs.
- [x] The former Supabase order endpoint no longer uses fixture lookup; Phase 8 replaced that commerce boundary with server-owned Payload cart/order creation.
- [x] Browser/HTTP verification and all applicable regression and Payload integrity suites pass.

Commit checkpoint:

```text
refactor(catalog): switch storefront from fixtures to Payload
```

---

# Phase 8 — Commerce flow migration

**Status: [x] Completed**

## 8.1 Migrate cart persistence

Move from browser-only product objects in localStorage toward Payload Ecommerce cart persistence.

Preserve the current cart UI.

Avoid storing full mutable product objects as the long-term canonical cart representation.

Completion record:

- [x] Guest storage is versioned and contains only product/variant IDs, quantity, and normalized configuration IDs.
- [x] Guest references are revalidated through the server before display or checkout use.
- [x] Authenticated carts persist in Payload and remain isolated by an opaque one-way storefront-customer key.
- [x] Signing in merges the guest cart into the authenticated cart without trusting client prices or product snapshots.
- [x] Existing cart presentation and configuration-aware line identity remain intact.

## 8.2 Migrate checkout/order creation

Replace the current custom `/api/orders` Supabase persistence with Payload commerce flow once the Payload path is complete.

Preserve existing Persian checkout UX unless a required data field must be added.

Completion record:

- [x] `/api/orders` accepts contact/fulfillment input only and creates orders from the authenticated Payload cart.
- [x] Product, variant, configuration, title, code, and price snapshots are validated and owned by the server.
- [x] Order creation and cart completion use one Payload/PostgreSQL transaction.
- [x] A unique source-cart relationship prevents duplicate orders from repeated submissions.
- [x] At the Phase 8 checkpoint, new Payload orders and legacy Supabase history rendered together during the transition; Phase 9 later removed the legacy source.

## 8.3 Order statuses

Map Nilper's useful lifecycle, likely including the current states:

- pending review
- confirmed
- in production / preparing
- ready
- shipped
- delivered
- cancelled

Do not assume Payload defaults match Nilper; extend the order model/admin safely.

Completion record:

- [x] Payload orders support pending review, confirmed, in production, ready, shipped, delivered, and cancelled.
- [x] Orders are visible in Payload Admin with order number, customer contact, delivery/payment selections, trusted item snapshots, and status.
- [x] Existing rows are migrated safely and the status transition path is covered by the Phase 8 verification.

Commit checkpoint:

```text
refactor(commerce): migrate storefront carts and orders to Payload
```

---

# Phase 9 — Customer auth/account migration

Do this after product/cart/order architecture is stable.

## 9.1 Phone OTP with Payload — complete (2026-09-12)

Implement a Payload custom auth strategy or supported auth flow for phone OTP.

Reuse Kavenegar-compatible SMS behavior as appropriate.

Security requirements:

- [x] short OTP TTL
- [x] one-time use
- [x] rate limiting
- [x] attempt limit
- [x] hashed/secure server-side OTP state
- [x] no OTP secrets in client bundle
- [x] normalize Iranian phone numbers consistently

Completion record:

- [x] Payload custom customer auth strategy uses opaque, hashed, revocable session tokens.
- [x] Kavenegar Verify Lookup is the production delivery provider; Payload/PostgreSQL remains authoritative for OTP state.
- [x] Phase 9.1 initially preserved linked legacy identities; the fresh-site decision in Phase 9.3 later removed this temporary bridge.
- [x] Local development remains testable with visible OTP `123456`; the fallback is disabled in production.
- [x] Supabase was retained until its Payload replacements passed verification, then removed in Phase 9.3.

## 9.2 Migrate profiles/addresses/account queries — complete (2026-09-12)

Replace Supabase account data layer with Payload.

Preserve existing account page UX.

Completion record:

- [x] Profile updates persist on the authenticated Payload customer.
- [x] Address creation and account address queries use Payload Ecommerce addresses linked directly to the customer.
- [x] Account order queries use Payload orders only; empty accounts render honestly without demo records.
- [x] The existing account overview, profile, addresses, order list, and order-detail UI contract is preserved.

## 9.3 Remove Supabase only after verification — complete (2026-09-12)

When Payload handles all required responsibilities:

- [x] remove `@supabase/*` packages
- [x] remove Supabase clients/helpers
- [x] remove Supabase env variables
- [x] remove old migration/function files if no longer used
- [x] confirm the active order API already uses Payload and contains no Supabase implementation
- [x] update README

Completion record:

- [x] The fresh-site decision removed the need to retain or migrate legacy Supabase customer and order data.
- [x] Direct Payload customer relationships replaced temporary identity/storefront-key bridge fields.
- [x] The Phase 9 suite covers OTP security, sessions, profiles, addresses, account queries, and revocation; affected Phase 4, 5, and 8 commerce suites pass against the cutover schema.

Commit checkpoint:

```text
refactor(auth): migrate customer account from Supabase to Payload
```

---

# Phase 10 — Iranian payment adapter — complete (2026-09-12)

Not part of the first architecture validation.

When ready:

- [x] Chose Zarinpal as the approved first Iranian gateway/provider, while keeping an adapter boundary for future providers.
- [x] Implemented a Payload Ecommerce `PaymentAdapter`.
- [x] Implemented server-side initiate/verify/confirm flow using the current official Zarinpal REST contract.
- [x] Verify the stored transaction amount server-side and convert Toman to Rial only through `toPaymentGatewayAmount`.
- [x] Handle duplicate callbacks idempotently, including Zarinpal's already-verified response.
- [x] Record provider authority and transaction/reference IDs with operational response metadata.
- [x] Confirm an order only after authoritative payment verification; cancelled, failed, malformed, and amount-mismatched returns create no order.

The merchant ID remains server-only. `NEXT_PUBLIC_SITE_URL` supplies the callback origin, and production requires HTTPS with sandbox explicitly disabled.

---

# Phase 11 — Shipping / delivery — complete (2026-09-13)

- [x] Products and operational variants have `shippingMode: parcel | freight`; the default and migration backfill are `freight`.
- [x] Parcel products require trusted weight and Tapin box metadata before they can enter a valid cart.
- [x] An all-parcel cart uses Tapin's documented public province/city and price APIs with selectable custom/priority postal service.
- [x] Freight carts are quoted manually after checkout and Zarinpal charges products only.
- [x] Any mixed parcel/freight cart is treated entirely as freight for now.
- [x] Shipping prices from the browser are ignored. Quote and payment initiation both recalculate from the authenticated server-owned cart and trusted item snapshots.
- [x] Parcel shipping is added to the Zarinpal amount; freight remains zero at the payment boundary.
- [x] Tapin shipment registration occurs only after successful Zarinpal verification and uses the Nilper order number as the stable provider `manual_id`.
- [x] Duplicate callbacks cannot create a second local shipment; concurrent attempts share one in-flight operation and the provider receives the same deterministic manual ID.
- [x] Orders persist shipping method, amount, provider, service, destination codes, weight, box, quote time, shipment ID, tracking code, provider/internal statuses, failure state, and creation timestamp.
- [x] Customer-owned tracking refresh uses Tapin's documented status-report endpoint.
- [x] Provider failures preserve the successful payment/order and persist an actionable shipment failure instead of claiming shipment success.
- [x] Migration, generated types, TypeScript, lint, production build, Phase 10 regression, Phase 11 parcel/freight/mixed/payment/failure/duplicate/tracking verification, manual catalog, and all 17 journal/showcase tests pass; all nine migrations are applied.
- [!] Live calls require Tapin panel credentials and explicit confirmation of the API amount unit. The adapter and deterministic fakes are complete; missing production configuration fails closed.

Do not start Phase 12 without a separate owner instruction.

---

# Phase 12 — Optional content migration — blog/posts complete (2026-09-13)

Only after commerce launch work is stable.

Owner-approved scope completed:

- [x] Added Payload `posts` with draft, autosave and version support and public access restricted to published documents.
- [x] Added a simple Lexical writing surface with H2–H4, paragraphs, lists, links, blockquotes, images and tables.
- [x] Added hero media/caption, category, quick answer, closing takeaway, CTA, author, related-post, featured/order and focused SEO fields.
- [x] Calculate reading time and word count automatically from the body.
- [x] Build the table of contents and collision-safe anchors automatically from H2 headings.
- [x] Preserve the four existing article URLs and migrate their complete Persian content/media through an idempotent seed.
- [x] Drive blog index, detail, homepage journal cards, project article cross-links and sitemap from published Payload records through a server-only cached repository.
- [x] Keep one visible H1, crawlable server-rendered prose, canonical/robots/social metadata and `BlogPosting`, breadcrumb and collection structured data.
- [x] Add explicit OpenAI search crawler access without adding speculative AI-only markup or promising rankings.
- [x] Apply migration, regenerate types/import map, and pass Payload, TypeScript, lint, production build, journal and showcase verification.

Possible later editorial collections, only on explicit owner request:

- [x] projects
- [x] brand editorial pages (catalog brands already live in Payload)
- [ ] homepage/editorial sections

The blog runtime no longer reads static article data. The original snapshot remains only as a seed source so clean databases can receive the four established articles without copying content into a second roadmap.

---

# Definition of Done for architecture task

The original task **"Decide and lock Nilper backend & dashboard architecture"** can be considered technically decided now, but implementation validation is complete only when:

- Payload runs in the existing repo
- existing frontend remains visually intact
- Postgres works
- Payload Admin is usable with Persian data
- Delan product family is represented cleanly
- real variants are separate from configuration options
- cart supports configuration-aware item identity
- order preserves configuration snapshot
- Toman handling is explicitly resolved
- lint/build/tests pass

After that, stop evaluating Medusa/Vendure/WooCommerce/NestJS unless a proven blocker appears.

---

# Information Codex should be given at session start

Give Codex these inputs together:

1. the local `np-group` repository
2. `NILPER_CONTEXT.md`
3. `NILPER_TODO.md`
4. `AGENTS.md`
5. local Postgres connection through environment variables (never paste production secrets into prompts)
6. current official Payload docs if Codex needs API-specific verification

The source workbooks are not a required session input while workbook automation is deferred. Do not request, copy, inspect, or automate them unless the owner explicitly reopens that work. Use the official Payload JSON transfer workflow for reviewed operational batches.

Suggested opening prompt for a new Codex session:

> Read `NILPER_CONTEXT.md`, `NILPER_TODO.md`, and `AGENTS.md` completely, then inspect Git and the current implementation. Phases 0–5 and 7–12 are complete and the architecture is locked. Workbook-specific Phase 6 automation is deferred; use the admin-only official Payload JSON transfer workflow for reviewed batches and do not reintroduce Supabase. Journal posts are managed through Payload; migrate other optional editorial areas only on explicit owner direction. Live Tapin activation still requires the documented production account settings and confirmed API amount unit.

Keep each session focused on the current phase and update this file before ending.
