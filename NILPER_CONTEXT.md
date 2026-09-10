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

Latest reviewed commit:

```text
041932ecb51336bf1744faf9b19dc8b81294c4b7
docs: record Phase 3 completion
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
```

Phase 3 is merged into `main`. Phase 4 was completed on branch `codex/payload-phase-4`; its implementation commit is not yet on `main` at this snapshot.

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
Supabase                 still present for existing customer auth/account/order flow
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

Customer/public authentication has **not** been migrated to Payload yet.

Do not confuse the current Payload Admin-user setup with the final customer-auth architecture.

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

sourceKey
sourceMetadata
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
sourceKey
sourceMetadata
```

A Nilper SKU/registration code is intentionally separate from fabric/wood/customization choices.

Shared specifications and measurements belong on Product. Measurements that differ by operational registration code belong on Variant. Both use flexible key/label/value structures so furniture, bedroom and dining records do not require hundreds of nullable category-specific columns.

`matchingProducts` records explicit set/coordination relationships from Nilper source material. `relatedProducts` remains available for general merchandising recommendations; the two meanings must not be merged.

Products and variants carry a unique stable `sourceKey` plus raw source metadata. Spreadsheet imports must derive the key from the stable workbook key, worksheet, entity type and raw product/registration identity. Row numbers, display titles and local filenames are deliberately excluded. Raw worksheet names, codes and inconsistencies remain in source metadata and quality notes.

### Commerce features currently configured

Payload Ecommerce currently has foundations for:

- Products.
- Variants.
- Carts.
- Addresses.
- Orders.
- Transactions.

Current preview choices:

- carts are hidden from Admin.
- addresses are hidden from Admin.
- orders are hidden from Admin.
- transactions are hidden from Admin.
- guest carts are disabled.
- inventory is intentionally disabled until an authoritative stock-quantity source exists.
- Stripe is not implemented.
- Iranian payment is not implemented.

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

### Source-quality rule

The spreadsheets contain apparent inconsistencies.

Never silently repair:

- catalog codes.
- registration codes.
- worksheet names.
- copied labels.
- suspicious numbering.

Retain raw source traceability and add data-quality notes.

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
- source metadata.
- placeholder media.

Important:

This seed proves Admin usability and the finalized Phase 3 domain shape, including stable source identity, flexible measurements/specifications and explicit matching products.

It is **not** a full product importer and must not be treated as authoritative bulk catalog data.

Placeholder images are explicitly not sourced from the Excel files.

---

## 12. Current storefront boundary

The public storefront is still intentionally using its existing static fixture layer.

`src/features/catalog/catalog-data.ts` still contains demo:

- categories.
- products.
- prices.
- materials.
- room filters.
- colors.
- availability.

README also states that product/project/brand/editorial content currently uses static fixtures.

Therefore:

```text
Payload Admin data != public storefront catalog yet
```

This is intentional.

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

## 13. Supabase boundary

Supabase is still present and working.

Current responsibilities include existing public/customer flows such as:

- phone authentication.
- profiles/account data.
- addresses.
- order request persistence.
- order items/status history.

Do not remove Supabase until Payload replacements are complete and verified.

Target migration order:

1. Payload catalog/domain model.
2. Payload configuration-aware cart/order model.
3. Delan end-to-end vertical slice.
4. catalog migration.
5. commerce flow migration.
6. customer/account migration.
7. phone OTP migration.
8. only then remove Supabase.

The final architecture should not keep permanent duplicate sources of truth for the same customer/order data.

---

## 14. Security and integrity rules

Always preserve:

- server-side price validation.
- server-side product/variant/configuration validation.
- access controls.
- no client-trusted price/SKU/inventory.
- server-only secrets.
- historical order snapshots.
- committed Postgres migrations.
- no credentials in source metadata/import files.
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
- Stable source identity and idempotent seed/upsert rules are finalized before bulk import.
- Explicit `matchingProducts` and general `relatedProducts` are separate relationships.
- Migration up/down/up and Phase 3 integration verification passed on a disposable clean database.

### Phase 4 completion

- Configuration-aware item storage is implemented across carts, orders, and transactions.
- Cart matching normalizes selection ordering and separates otherwise-identical lines with different selections.
- Server validation and server-owned prices/totals are enforced.
- Historical product, variant, price, group, and option snapshots are preserved for orders and transactions.
- The data-preserving migration passed clean-database up/down/up verification.
- Phase 3 and Phase 4 Payload verification, seed continuity, TypeScript, lint, production build, journal tests, and showcase tests pass.

### Phase 5 gaps

The Admin-side Delan preview exists, but the true vertical slice is incomplete:

- Payload-backed storefront repository/mapper not completed.
- existing Product UI not yet proven with Payload Delan data.
- existing storefront cart UI is not yet connected to the Payload configuration-aware cart path.
- the generic historical snapshot behavior is proven, but the Delan-specific end-to-end storefront/order slice is not yet proven.
- architecture implementation gate not yet passed.

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
