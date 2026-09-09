# Nilper Payload Migration TODO — Dashboard First

This is the execution plan for Codex working locally in `mohamad-gandomi/np-group`.

Read `NILPER_ARCHITECTURE.md` completely before starting.

## Why the plan is dashboard-first

The Payload decision is not considered implementation-approved only because the framework works technically.

Before the project goes deep into migrations, product imports, cart logic, auth, or checkout, the developer must see and manually approve the **actual Payload Admin experience** that the Nilper team would use.

This is intentional risk reduction, not throwaway design work.

The first implementation milestone must prove:

- the existing Next.js storefront remains untouched visually
- Payload runs inside the current app
- `/admin` is real Payload Admin, not a custom mockup
- Persian content entry is comfortable
- RTL is correct enough for daily use
- the Products area feels clean and understandable
- relationships, arrays, specs, variants, and configuration controls are usable
- only after manual approval may Codex continue into deeper backend work

If the dashboard is not acceptable, fix or reconsider the admin experience **before** investing in the rest of the migration.

---

# Working rules for Codex

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
- **Hard rule:** after Phase 1, STOP. Do not start Phase 2+ until Mohamad manually approves the dashboard.
- Dashboard preview work must use the real Payload Admin and near-real Nilper fields; do not build a fake standalone dashboard mockup.
- Do not spend time polishing storefront pages during the dashboard validation milestone.

---

# Phase 0 — Baseline and safety

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
- `src/app/api/orders/route.ts`
- `src/features/account/account-data.ts`
- `supabase/migrations/20260829000000_account_dashboard.sql`

Do not start by modifying UI components.

## 0.4 Preserve a clean rollback point

Before Payload changes, ensure the branch is clean and the current app behavior is reproducible.

Do not remove or rewrite Supabase code in this phase.

---

# Phase 1 — ADMIN-FIRST Payload preview (HARD GATE)

**Goal:** get to a realistic, reviewable Nilper admin as early as possible.

This phase intentionally does **not** migrate the storefront, cart, checkout, orders, authentication, or all product data.

The output of Phase 1 is something Mohamad can open locally at `/admin`, click around, create/edit a representative Persian Nilper product, and judge the dashboard before deeper development continues.

## 1.1 Install Payload foundation

The repo currently uses npm and has a `package-lock.json`; keep npm unless there is a concrete incompatibility.

Use current compatible versions of:

```text
payload
@payloadcms/next
@payloadcms/db-postgres
@payloadcms/plugin-ecommerce
@payloadcms/richtext-lexical
@payloadcms/translations
sharp
```

Requirements:

- keep Payload packages version-aligned
- use versions compatible with the installed Next.js and React versions
- do not install GraphQL unless actually needed
- follow current official Payload documentation for adding Payload to an existing Next.js app

## 1.2 Add Payload to the existing Next.js app

Requirements:

- add Payload's supported `(payload)` App Router files without replacing current public routes
- wrap existing `next.config.ts` with `withPayload`
- preserve `experimental.useTypeScriptCli = false`
- create Payload config in the current supported conventional location
- configure the Postgres adapter
- configure Payload secret
- generate Payload types
- keep current storefront routes unchanged

Expected local env shape, adjusted to current Payload naming if needed:

```env
DATABASE_URI=
PAYLOAD_SECRET=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Do **not** remove Supabase variables yet.

## 1.3 Connect local/dev Postgres

Use an actual local/dev Postgres database.

If Postgres already exists locally, use it.

Only add Docker Compose if it genuinely improves local setup; do not introduce infrastructure merely for style.

Acceptance check:

- Payload can connect
- initial schema/migrations can run
- `/admin` can create the first admin user

## 1.4 Configure the actual Payload Admin for Persian/RTL

Use current Payload i18n/admin capabilities and `@payloadcms/translations` where appropriate.

Important distinction:

- **Admin UI language / RTL** is required.
- **Multilingual product content** is not required.
- Nilper product content can be Persian-only.

Configure the smallest maintainable solution that makes Admin genuinely comfortable in Persian.

Test RTL across:

- main admin navigation/sidebar
- dashboard cards
- list/table views
- search/filter controls
- create/edit forms
- text and textarea fields
- rich text if present
- select fields
- relationship selectors
- arrays
- groups
- tabs if used
- dialogs/modals
- validation messages
- save/publish controls

Do not accept a dashboard where only the text is Persian but layout controls remain confusingly LTR.

Minor cosmetic issues can be documented, but structural RTL problems must be fixed before approval.

## 1.5 Configure a representative real Product Admin, not a fake mockup

To judge the dashboard properly, the preview form must resemble Nilper's eventual product workflow.

Create only the minimum supporting collections needed to make the form realistic. These may include:

- `users`
- `media`
- `brands`
- `categories`
- `product-series`
- Payload Ecommerce `products`
- Payload Ecommerce `variants`
- minimal `configuration-groups`
- minimal `configuration-options`

Do not finalize the entire domain yet. This is a usability spike.

The representative Product edit screen should expose enough real Nilper concepts to evaluate the UI.

### Identity

- Persian product title
- slug
- brand
- category
- product series
- publish/status state

### Sales behavior

- sales mode, e.g. direct purchase / inquiry / made-to-order
- availability
- base/visible price where appropriate

### Media

- main image
- gallery

### Product information

- Persian description
- technical specifications using a repeatable array/group
- dimensions
- lead/order notes

### Commerce complexity preview

- at least one real-style Variant concept based on SKU / registration code
- configuration groups such as wood finish and fabric/upholstery
- relationships to related products where practical

The purpose is to answer:

> Would the Nilper team actually enjoy managing a complex product here every day?

## 1.6 Seed only a small dashboard preview dataset

Do **not** bulk import Excel files.

Create a tiny representative dataset, preferably around **Delan** because it exposes the complexity we care about.

Enough preview data to make Admin meaningful:

- 1 brand
- 2–3 categories if useful for navigation preview
- 1 series (`دلان`)
- 1 representative product
- 2 real-style variants/SKUs if confidently identifiable
- several wood finish options
- several fabric/upholstery options
- a few Persian technical specs
- 2–3 media placeholders or existing safe images

Source names/codes must remain traceable when taken from the sample workbook.

Do not pretend uncertain Excel mappings are verified.

## 1.7 Make Admin organization clean enough to judge

Use Payload-supported Admin configuration to make the information architecture understandable.

Review:

- collection names in Persian where appropriate
- navigation grouping
- collection ordering
- field labels
- field descriptions/help text
- tabs/groups only when they improve scanning
- list view columns
- representative product list view
- representative product edit view

Avoid heavy custom dashboard code at first.

First evaluate what standard Payload can do with clean configuration. Add custom Admin components/CSS only where they solve a real usability problem.

## 1.8 Do not integrate storefront yet

During Phase 1:

- keep `catalog-data.ts` working
- keep current cart working
- keep current checkout working
- keep Supabase authentication/orders working
- do not replace ProductCard/ProductView data sources
- do not alter homepage catalog behavior

The public frontend must remain a stable reference while Admin is being evaluated.

## 1.9 Phase 1 acceptance criteria

All of these must be true before asking for approval.

### Technical

- `npm run dev` works
- existing public homepage still loads
- current storefront remains visually unchanged
- `/admin` loads real Payload Admin
- first admin user works
- Postgres works
- generated types/migrations work
- `npm run lint` passes or only has explicitly documented pre-existing failure
- `npm run build` passes or only has explicitly documented pre-existing failure

### Dashboard usability

- Admin can be used in Persian comfortably
- main layout direction feels correct in RTL
- Persian input cursor/alignment feels correct
- lists/tables are readable
- dialogs and relationship pickers are usable
- Product create/edit form is not visually chaotic
- Variant fields are understandable
- wood/fabric configuration UI is understandable
- technical-spec array/group editing is understandable
- long Persian values do not break the form
- saving and reopening the sample product works

### Review instructions Codex must print

At the end of the run, Codex must tell Mohamad exactly:

1. command to start local app
2. local Admin URL
3. how to create/login as admin
4. which sample product to open
5. which screens to inspect
6. any known RTL limitations
7. any intentionally unfinished fields
8. files changed in Phase 1

Commit checkpoint:

```text
feat(payload): add dashboard-first Payload preview
```

---

# Phase 2 — MANUAL DASHBOARD APPROVAL GATE

**Codex must not automatically execute this phase.**

Mohamad manually opens the local dashboard and reviews it before deeper development.

## Review checklist

Open `/admin` and explicitly judge:

### General dashboard

- [ ] overall visual quality is acceptable
- [ ] sidebar/navigation feels clear
- [ ] Persian labels look natural
- [ ] RTL feels native rather than patched
- [ ] spacing and typography are acceptable
- [ ] dialogs/dropdowns do not feel broken

### Products

- [ ] product list is easy to scan
- [ ] create/edit screen is understandable
- [ ] long Persian descriptions are comfortable to edit
- [ ] images/gallery are easy to manage
- [ ] categories/brands/series relationships are clear
- [ ] technical specifications are easy to add/reorder/edit

### Complex Nilper data

- [ ] Variant vs configuration distinction is understandable in Admin
- [ ] SKU/registration code is visible and easy to manage
- [ ] wood finish editing is comfortable
- [ ] fabric/upholstery editing is comfortable
- [ ] made-to-order/direct/inquiry behavior can be understood by an editor

## Approval outcomes

### APPROVED

If Mohamad approves the dashboard:

- mark Dashboard Gate approved
- continue to Phase 3
- keep Payload as the locked architecture unless a proven technical blocker appears

### APPROVED WITH CHANGES

If the architecture is good but Admin needs improvement:

- list concrete UI problems
- fix only those issues
- re-run the dashboard review
- do not continue to Phase 3 until approved

### REJECTED

If Payload Admin fundamentally feels wrong for Nilper even after reasonable customization:

- stop the deeper migration
- do not delete Supabase/current storefront code
- document exactly why it failed
- reconsider the backend/admin decision before more sunk cost is created

This gate is intentionally early so rejection is still cheap.

---

# Phase 3 — Define the Nilper data model

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

Use `994(1).xlsx` as the primary real source sample.

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
source file: 994(1).xlsx
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
  506(1).xlsx
  886(1).xlsx
  994(1).xlsx
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
WARN 994(1).xlsx / HSS 994: registration code does not obviously match catalog code
WARN 886(1).xlsx / NBSD585: worksheet/catalog numbering differs
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
- Payload Admin has passed explicit manual Persian/RTL/dashboard approval before deeper implementation
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
2. `NILPER_ARCHITECTURE.md`
3. `NILPER_TODO.md`
4. the three sample spreadsheets when working on model/import tasks:
   - `506(1).xlsx`
   - `886(1).xlsx`
   - `994(1).xlsx`
5. local Postgres connection through environment variables (never paste production secrets into prompts)
6. current official Payload docs if Codex needs API-specific verification

Suggested opening prompt for a new Codex session:

> Read `AGENTS.md`, `NILPER_ARCHITECTURE.md`, and `NILPER_TODO_DASHBOARD_FIRST.md` first. Inspect the existing repository before editing. Start with Phase 0 and Phase 1 only. This is an ADMIN-FIRST validation run: preserve the current storefront and Supabase behavior, add Payload to the existing Next.js app, connect local Postgres, configure the real Payload Admin with a representative Nilper product form, make Persian/RTL usable, seed only preview data, and STOP at the Dashboard Approval Gate. Do not migrate storefront data, cart, checkout, auth, orders, or remove Supabase. Run lint/build and summarize exactly how I can open and review `/admin` locally.

After Phase 1 is reviewed, start a new focused Codex request for the next phase instead of asking one agent run to perform the entire migration.

## Current Implementation Status

- **Last updated:** 2026-09-09
- **Current phase:** Phase 1 complete; stopped before the Phase 2 manual approval decision.
- **Last completed checkpoint:** `feat(payload): add dashboard-first Payload preview` (`55fa0ce836903ee63f7eae1997388c5fd99ba59d`).
- **What is working:** Payload 3.88.0 in the existing Next.js 16.3.4 app; local PostgreSQL; generated types/import map; a clean-schema migration; Persian/RTL Admin; active admin login; idempotent Delan preview seed; products, real SKU-style variants, configuration groups/options, relationships, arrays, rich text, media placeholders, save/publish/reopen; unchanged storefront; green type check, lint, production build, journal tests, and showcase tests.
- **Completed Phase 0:** [x] isolated branch; [x] green baseline; [x] existing boundaries reviewed; [x] storefront and Supabase rollback reference preserved.
- **Completed Phase 1:** [x] Payload foundation; [x] supported route groups; [x] local Postgres workflow; [x] Persian/RTL Admin; [x] representative Nilper Product editor; [x] traceable `994.xlsx` Delan preview; [x] browser interaction review; [x] final verification.
- **Intentionally unchanged:** storefront fixtures and UI, cart, checkout, public account/auth flows, orders, Supabase, payments, shipping, and all bulk-import behavior.
- **Known issues / blockers:** no technical blocker to dashboard review. Toman is preview-only until Phase 3 validation. Minor upstream mixed-language accessibility strings and Gregorian-style Admin date formatting remain cosmetic. The current Payload release is still flagged by npm for its default unlock policy; this project explicitly restricts unlock access to admins. Other remaining audit findings are low/moderate transitive development/admin dependencies.
- **Next allowed action:** Mohamad manually reviews `/admin` and records `APPROVED`, `APPROVED WITH CHANGES`, or `REJECTED`. Do not start Phase 3+ before that decision.
- **Dashboard approval status:** **NOT REVIEWED**
