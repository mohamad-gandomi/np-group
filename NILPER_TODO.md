# Nilper Payload Migration TODO

This is the execution plan for Codex working locally in `mohamad-gandomi/np-group`.

Before implementation, read these files completely in order:

1. `NILPER_CONTEXT.md`
2. `NILPER_TODO.md`
3. `AGENTS.md`

`NILPER_CONTEXT.md` and `NILPER_TODO.md` are the only canonical Nilper architecture, planning, and progress documents.

## Current State

- **Active phase:** Phase 3 — Define the Nilper data model (`[x]` completed); Phase 4 is next but not started.
- **Dashboard approval:** APPROVED. Do not repeat Phase 0, Phase 1, or the dashboard approval gate.
- **Working foundation:** Existing Next.js storefront + Payload CMS/Ecommerce + PostgreSQL; Supabase remains for current customer/account/order flows.
- **Next implementation task:** Begin Phase 4.1 by extending Payload cart items with normalized Nilper configuration snapshots and server-owned identity fields.
- **Later phases:** Phase 4+ remain not started. Phase 3 completion criteria now pass.

## Latest Session Note

- **Date:** 2026-09-10
- [x] Reviewed all representative workbooks (`506.xlsx`, `886.xlsx`, `994.xlsx`) and preserved their raw code/worksheet inconsistencies as source-quality notes.
- [x] Finalized flexible Product/Variant measurements, Persian technical specs, stable import identity, publication/active access rules, and separate matching-product relationships.
- [x] Finalized integer Toman handling through Payload products, variants, Provider formatting, carts, orders, transactions and Local API serialization; centralized the only explicit Toman/Rial payment boundary.
- [x] Finalized inventory as disabled until an authoritative quantity source exists; orderability remains represented by sales and availability modes.
- [x] Added a data-preserving Phase 3 migration and verified migrate up/down/up plus domain tests on a disposable clean PostgreSQL database.
- [x] Verified the idempotent Delan seed, TypeScript, lint, production build, journal tests and showcase tests.
- **Files added:** `src/payload/domain-fields.ts`, `src/payload/money.ts`, `src/payload/source-identity.ts`, `src/payload/verify-phase3.ts`, and migration `20260909_220639_nilper_product_domain`.
- **Files intentionally retained:** existing storefront fixtures and Supabase customer/order flows remain unchanged; `AGENTS.md` and its generated Next.js block remain untouched.
- **Current active phase:** Phase 3 completed; Phase 4 is the next phase and was not started in this session.
- **Latest relevant implementation commit:** `79ddd109c24b7a24ac879500d9ebaf2a8cc101a4` (`feat(catalog): define Nilper Payload product domain`).
- **Next implementation task:** Phase 4.1 — configuration-aware Payload cart item storage and normalized snapshot shape.

## Working rules for Codex

- Do not redesign or replace the existing public frontend.
- Do not delete Supabase integration until its replacement is working and verified.
- Do not bulk-import product data before the Delan vertical slice succeeds.
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

---

# Phase 5 — Delan vertical slice (architecture gate)

Use `994.xlsx` as the primary real source sample.

Do NOT bulk-import the entire workbook automatically yet. Manually/seed a minimal accurate slice to prove the model.

## 5.1 Create Delan series

Create `دلان` as a Product Series.

## 5.2 Create at least one real Delan product

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

Use the registration/order-code section to decide the initial variants.

Example business distinction in the sheet includes:

- تک نفره
- سه نفره
- تک رنگ / چند رنگ
- distinct Nilper registration codes

Before creating a variant, confirm the registration code exactly as written in the source. Do not autocorrect suspicious codes.

## 5.4 Add configuration groups

At minimum:

- wood finish
- fabric/upholstery palette

These must not generate combinatorial variants.

## 5.5 Add source metadata

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

Commit checkpoint:

```text
feat(commerce): complete Delan Payload vertical slice
```

---

# Phase 6 — Source import pipeline

Only start after the architecture gate passes.

## 6.1 Store source files outside public assets

Suggested local/import working path:

```text
data/source-products/
  506.xlsx
  886.xlsx
  994.xlsx
```

Do not expose these files through `public/`.

Decide whether source spreadsheets belong in Git based on client confidentiality. If not, ignore the directory and keep a documented local path.

## 6.2 Build importer as staging + validation, not blind import

Importer responsibilities:

- read Persian values only
- map source workbook/sheet to series/products
- extract raw catalog codes
- extract raw registration codes
- extract descriptions/specifications
- extract dimensions/weights
- extract order notes
- identify potential variants
- identify configuration choices
- retain source metadata
- emit warnings for uncertain mappings

## 6.3 Never auto-fix suspicious data

Known sample anomalies exist.

Generate a report such as:

```text
WARN 994.xlsx / HSS 994: registration code does not obviously match catalog code
WARN 886.xlsx / NBSD585: worksheet/catalog numbering differs
```

Require manual approval/override for questionable identity fields.

## 6.4 Make imports idempotent

Use a stable source key so re-running an import updates/stages the same source record rather than duplicating products.

Never key solely on a human-readable Persian title.

---

# Phase 7 — Replace static catalog data

After enough real products are imported:

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
5. the three sample spreadsheets when working on model/import tasks:
   - `506.xlsx`
   - `886.xlsx`
   - `994.xlsx`
6. local Postgres connection through environment variables (never paste production secrets into prompts)
7. current official Payload docs if Codex needs API-specific verification

Suggested opening prompt for a new Codex session:

> Read `NILPER_CONTEXT.md`, `NILPER_TODO.md`, and `AGENTS.md` completely, then inspect Git and the current implementation. Phase 3 is complete. Continue from Phase 4.1 without repeating the Payload foundation, dashboard review or product-domain work, and do not begin Phase 5 until Phase 4 completion criteria pass.

Keep each session focused on the current phase and update this file before ending.
