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
cdba415bc2d9045c078f093808816512f2eda7e2
chore(repo): remove obsolete WordPress backend
```

Important recent commits:

```text
55fa0ce836903ee63f7eae1997388c5fd99ba59d
feat(payload): add dashboard-first Payload preview

70c0062687533e45ca427fce64014d0c47c46df0
docs(payload): record dashboard gate status

cdba415bc2d9045c078f093808816512f2eda7e2
chore(repo): remove obsolete WordPress backend
```

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
npm run payload:migrate
npm run payload:seed

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
dimensions
technicalSpecs
orderNotesFa
leadTimeFa

configurationGroups
relatedProducts

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
variant dimensions
manufacturing notes
sourceCodeRaw
dataQualityNotes
```

A Nilper SKU/registration code is intentionally separate from fabric/wood/customization choices.

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
- inventory is currently disabled.
- Stripe is not implemented.
- Iranian payment is not implemented.

These are not necessarily all final business decisions.

---

## 8. Currency state

The project storefront uses integer **Toman** values.

Payload currently has a preview custom currency:

```text
code: TMN
decimals: 0
label: تومان
```

This is **NOT YET A FINAL VALIDATED MONEY DECISION**.

Phase 3 must validate the currency through the real commerce path before real catalog prices are imported.

Required validation:

- product price field.
- variant price field.
- cart subtotal.
- order amount.
- transaction amount.
- formatting.
- serialization/API behavior.
- future payment-adapter boundary.
- whether any Payload/plugin/provider boundary requires strict ISO-4217 semantics.

Rules:

- Never silently mix Rial and Toman.
- Never scatter `* 10` or `/ 10` conversions across components.
- Centralize money semantics.
- If IRR is needed at a payment boundary, conversion must be explicit and documented.

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
506(1).xlsx
886(1).xlsx
994(1).xlsx
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

This seed was built to prove Admin usability and the early domain shape.

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

### Phase 3 gaps

- Existing preview schema must be treated as a baseline and finalized, not recreated.
- Toman/TMN requires end-to-end validation.
- Inventory policy is not decided; Payload inventory is currently disabled.
- Technical specs must be checked against all representative real product types.
- Stable import identity/idempotency rules must be finalized before bulk import.
- `relatedProducts` exists; whether Nilper needs a distinct `matchingProducts` relationship should be decided based on real workflow/data rather than added automatically.
- Phase 3 schema changes need clean migrations and clean-database verification.

### Phase 4 gaps

No final configuration-aware Payload cart item model / matcher / server validation has been completed.

### Phase 5 gaps

The Admin-side Delan preview exists, but the true vertical slice is incomplete:

- Payload-backed storefront repository/mapper not completed.
- existing Product UI not yet proven with Payload Delan data.
- configuration-aware cart path not completed.
- historical order configuration snapshot not proven.
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
