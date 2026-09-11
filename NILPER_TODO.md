# Nilper Payload Migration TODO

This is the execution plan for Codex working locally in `mohamad-gandomi/np-group`.

Before implementation, read these files completely in order:

1. `NILPER_CONTEXT.md`
2. `NILPER_TODO.md`
3. `AGENTS.md`

`NILPER_CONTEXT.md` and `NILPER_TODO.md` are the only canonical Nilper architecture, planning, and progress documents.

## Current State

- **Active phase:** Phase 7 is complete; Phase 8 is ready but has not begun.
- **Dashboard approval:** APPROVED. Do not repeat Phase 0, Phase 1, or the dashboard approval gate.
- **Working foundation:** Existing Next.js storefront + Payload CMS/Ecommerce + PostgreSQL; Supabase remains for current customer/account/order flows.
- **Next implementation task:** Begin Phase 8.1 by replacing the browser-only cart boundary with authenticated, configuration-aware Payload cart persistence while preserving the existing UI and Supabase flows until their replacements pass verification.
- **Later phases:** Phase 8+ remain not started. Payload architecture is locked and Phase 7 storefront catalog migration is complete.

## Latest Session Note

- **Date:** 2026-09-11
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
- [x] Preserved the existing Delan source metadata and stable identity fields because current seeded records, migrations, and verification suites actively depend on them.
- [x] Reused and verified the existing `994.xlsx` / `HSS 994` Delan seed foundation without duplicating or bulk-importing records.
- [x] Added the server-only Payload catalog repository and mapper while preserving the existing serializable storefront Product DTO.
- [x] Added Delan to the hybrid shop listing and rendered its real source-backed description, media, variants, specifications and configuration choices in the existing Product UI.
- [x] Added a server cart-quote bridge that reuses Phase 4 validation before a Payload-backed product enters the browser cart.
- [x] Added a repeatable Phase 5 test for Delan mapping, same/different configuration cart identity, trusted totals, and historical order snapshots.
- [x] Kept the production seed price-disabled because the source has no authoritative price; the verification uses and restores a temporary test-only price.
- [x] Normalized same-app Payload media to `/api/media/file/...` paths so `next/image` never captures the local Payload server hostname; added a regression assertion.
- [x] Verified the live `/shop` and `/shop/furniture/delan-sofa` responses, TypeScript, lint, production build, Phase 3–5 suites, journal tests and showcase tests.
- **Phase 7 files added:** `src/features/catalog/catalog-taxonomy.ts`, `src/app/global-not-found.tsx`, and `src/components/not-found-page.tsx`.
- **Files intentionally retained:** `src/features/catalog/catalog-data.ts` remains only for explicitly labeled demo brand/project references and the legacy Supabase order endpoint until later migration; Supabase customer/order flows remain active; `AGENTS.md` and its generated Next.js block remain untouched.
- **Current active phase:** Phase 7 completed; Phase 8 is ready and not started.
- **Latest relevant implementation commit:** `0a64eb6` (`refactor(catalog): switch storefront from fixtures to Payload`).
- **Next implementation task:** Start Phase 8.1 with authenticated Payload cart persistence and keep the existing browser/cart UI stable.

## Working rules for Codex

- Do not redesign or replace the existing public frontend.
- Do not delete Supabase integration until its replacement is working and verified.
- Do not build or run an Excel product importer unless the owner explicitly reopens the deferred Phase 6 work.
- Do not treat every fabric/wood/color choice as a Variant.
- Do not silently correct source Excel codes or names.
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
- [x] Stable source identity and raw traceability implemented for idempotent future imports.
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

## 5.5 Add source metadata

**Existing foundation: [x] File, sheet, raw identities, and data-quality notes are seeded.**

The seeded/imported document must retain traceability:

```text
source file: 994.xlsx
source sheet: HSS 994
```

Include a place for `dataQualityNotes`.

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

- [x] Existing Delan series, sofa, operational variants, configuration groups and source metadata reused and verified.
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
- retain raw codes and uncertainty notes when data is entered manually;
- do not silently correct suspicious catalog or registration identities;
- preserve existing `sourceKey` and `sourceMetadata` fields used by the Delan seed and current migrations;
- reopen this phase only when the owner supplies explicit workbook-by-workbook mapping and approval rules.

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
- [x] The legacy Supabase order endpoint retains its fixture lookup until Phase 8 replaces that commerce boundary; no catalog surface depends on it.
- [x] Browser/HTTP verification and all applicable regression and Payload integrity suites pass.

Commit checkpoint:

```text
refactor(catalog): switch storefront from fixtures to Payload
```

---

# Phase 8 — Commerce flow migration

## 8.1 Migrate cart persistence

Move from browser-only product objects in localStorage toward Payload Ecommerce cart persistence.

Preserve the current cart UI.

Avoid storing full mutable product objects as the long-term canonical cart representation.

## 8.2 Migrate checkout/order creation

Replace the current custom `/api/orders` Supabase persistence with Payload commerce flow once the Payload path is complete.

Preserve existing Persian checkout UX unless a required data field must be added.

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

---

# Phase 9 — Customer auth/account migration

Do this after product/cart/order architecture is stable.

## 9.1 Phone OTP with Payload

Implement a Payload custom auth strategy or supported auth flow for phone OTP.

Reuse Kavenegar-compatible SMS behavior as appropriate.

Security requirements:

- short OTP TTL
- one-time use
- rate limiting
- attempt limit
- hashed/secure server-side OTP state
- no OTP secrets in client bundle
- normalize Iranian phone numbers consistently

## 9.2 Migrate profiles/addresses/account queries

Replace Supabase account data layer with Payload.

Preserve existing account page UX.

## 9.3 Remove Supabase only after verification

When Payload handles all required responsibilities:

- remove `@supabase/*` packages
- remove Supabase clients/helpers
- remove Supabase env variables
- remove old migration/function files if no longer used
- remove old order API implementation
- update README

Commit checkpoint:

```text
refactor(auth): migrate customer account from Supabase to Payload
```

---

# Phase 10 — Iranian payment adapter

Not part of the first architecture validation.

When ready:

- choose the approved Iranian gateway/provider
- implement Payload Ecommerce `PaymentAdapter`
- implement server-side initiate/verify/confirm flow
- verify returned amount server-side
- handle duplicate callbacks idempotently
- record provider transaction/reference IDs
- confirm order only after authoritative payment verification

Do not expose secrets to the client.

---

# Phase 11 — Shipping / delivery

Payload Ecommerce does not currently provide native shipping calculations.

Model Nilper's real business process instead of inventing generic shipping rules.

Likely modes may include:

- coordination by advisor for large furniture/made-to-order products
- calculated or fixed shipping for smaller direct-purchase products
- city/province-dependent handling
- pickup if Nilper requires it

Clarify actual business rules before implementing a complex engine.

---

# Phase 12 — Optional content migration

Only after commerce launch work is stable.

Possible later Payload collections:

- blog/posts
- projects
- brands (if not already migrated for catalog)
- homepage/editorial sections

Current file-backed content can remain until editing it through Admin has real value.

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

The three source workbooks are not a required session input while Phase 6 is deferred. Do not request, copy, inspect, or automate them unless the owner explicitly reopens that work.

Suggested opening prompt for a new Codex session:

> Read `NILPER_CONTEXT.md`, `NILPER_TODO.md`, and `AGENTS.md` completely, then inspect Git and the current implementation. Phases 0–5 and Phase 7 are complete, the architecture is locked, and Phase 6 is deferred by the owner; do not build an Excel importer. Continue with the earliest unfinished Phase 8 task without removing Supabase until its replacement is working and verified.

Keep each session focused on the current phase and update this file before ending.
