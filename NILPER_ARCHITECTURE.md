# Nilper Backend & Dashboard Architecture

**Status:** LOCKED for implementation validation
**Decision date:** 2026-09-09
**Repository:** `mohamad-gandomi/np-group`
**Primary language/content:** Persian only
**Frontend:** Preserve the existing Next.js storefront and visual design.

---

## 1. Architecture decision

Use the existing Next.js 16 application as the main application and add Payload directly to it.

### Target stack

- **Frontend:** existing Next.js 16 App Router application
- **CMS / Admin / application backend:** Payload CMS
- **Commerce foundation:** `@payloadcms/plugin-ecommerce`, customized for Nilper
- **Database:** PostgreSQL via Payload's official Postgres adapter
- **Admin:** Payload Admin at `/admin`
- **Media:** Payload upload/media collection
- **Authentication:** migrate toward Payload auth with phone OTP/custom strategy; do not break the existing Supabase auth during the first Payload integration step
- **Payments:** custom Iranian payment adapter later; do not build payment integration in the first vertical slice
- **Shipping:** Nilper-specific logic later; Payload Ecommerce currently does not provide native shipping/tax handling

Long-term target:

```text
Browser
  |
  v
Next.js 16 (existing storefront)
  |
  +-- Server Components / Route Handlers / Server Actions where appropriate
  |
  +-- Payload Local API (preferred for same-app server-side access)
  +-- Payload REST API (when a real HTTP boundary is useful)
  |
  v
Payload CMS + Ecommerce Plugin
  |
  v
PostgreSQL
```

Do **not** create a separate Medusa service, NestJS service, WooCommerce instance, or second admin dashboard.

---

## 2. Why Payload was selected

Nilper is not a simple storefront with only `product + price + stock`.

The real product sheets show that the difficult part is **product information and configuration**, including:

- product families / series
- several sellable items in one series
- real Nilper registration/order codes
- technical specifications that differ by category
- dimensions and weight
- wood finishes
- fabrics / upholstery palettes
- order-taking notes
- made-to-order products
- related / matching products
- different configuration rules for furniture, dining, bedroom, lighting, accessories, etc.

Payload is a better fit because the schema can be modeled around this domain and Payload automatically gives us an editable admin UI, API and database layer in the same Next.js application.

The official Ecommerce Plugin still gives us useful commerce primitives such as products, variants, carts, orders, addresses, transactions and payment adapters, but we will override and extend its collections rather than forcing Nilper into a generic T-shirt-style model.

---

## 3. Existing frontend: preserve it

The current repository is already a substantial storefront and must not be replaced with a Payload starter or Ecommerce template.

Current application characteristics:

- Next.js `16.3.2`
- React `19.2.8`
- TypeScript
- Tailwind CSS 4
- shadcn / Radix-based components
- Persian RTL storefront
- existing routes for shop, product, cart, checkout, login, account, projects, brands, blog, etc.
- current Supabase integration for phone auth and order/account persistence
- current catalog/product content is mostly static fixture data

Important existing boundaries:

- `src/features/catalog/catalog-data.ts` is the current static product source.
- `src/features/catalog/catalog-types.ts` is the current storefront product DTO.
- `src/features/product/*` consumes that DTO.
- `src/features/cart/cart-context.tsx` currently owns browser cart state.
- `src/app/api/orders/route.ts` currently creates orders in Supabase.
- `supabase/migrations/20260829000000_account_dashboard.sql` defines the current profile/address/order schema.

### Rule for Codex

**Do not redesign the storefront. Do not replace product pages, cart UI, checkout UI, homepage, typography, colors, routing or component structure unless a backend integration genuinely requires a small change.**

The first goal is to replace data sources behind the current UI, not replace the UI.

Prefer adapters/repositories such as:

```text
Payload document
   -> mapper
StorefrontProduct DTO
   -> existing ProductCard / ProductView / Cart UI
```

The public storefront should remain independent from Payload's generated document shape.

---

## 4. Next.js-specific implementation rule

The repository already contains `AGENTS.md` with Next.js 16 agent instructions.

Before Codex changes Next.js code it must:

1. Read `AGENTS.md`.
2. Read the relevant installed Next.js docs under `node_modules/next/dist/docs/` when an API/convention is involved.
3. Preserve App Router conventions.
4. Prefer server-side Payload Local API access when code runs inside this same Next.js app.
5. Keep client components limited to UI state/interactivity.

Payload officially supports adding itself to an existing Next.js application and currently supports Next.js `16.2.6+`, so the repository's `16.3.2` version is in the supported range.

---

## 5. Domain modeling rule: Variant is NOT every customer choice

This is the most important rule in the project.

### A Variant means

Create a Payload Ecommerce **Variant** when a sellable form has a real operational identity such as one or more of:

- distinct Nilper registration/order code / SKU
- distinct price
- distinct inventory
- materially distinct physical dimensions
- distinct manufacturing/order identity that Nilper treats separately

### A configuration option means

Do **not** generate variants for every selectable:

- fabric
- upholstery palette
- wood finish
- decorative finish
- optional personalization
- other choice that does not create a distinct Nilper SKU/registration code

Those should be modeled as configuration data and a snapshot of the customer's selections must be stored with the cart/order item.

This avoids the combinatorial explosion:

```text
BAD:
product x 20 fabrics x 8 wood finishes x 2 upholstery modes x ...

GOOD:
Product
  -> a small number of real Variants/SKUs
  -> Configuration Groups
       -> selectable options
```

---

## 6. Proposed collections

Names may be refined during implementation, but preserve the concepts and relationships.

### Core auth/admin

#### `users`

Use one Payload auth collection unless a strong reason appears to split editors/customers.

Suggested fields:

- phone
- fullName
- role: `admin | editor | customer`
- active

Long-term authentication goal: phone OTP via Payload custom auth strategy and Kavenegar-compatible SMS flow.

Do not migrate Supabase auth in the first foundation commit. Integrate Payload first, then migrate auth deliberately.

### Content / catalog taxonomy

#### `media`

Payload upload collection.

#### `brands`

- titleFa
- slug
- descriptionFa
- logo
- heroMedia
- published
- SEO fields as needed

#### `categories`

Should support hierarchy, because the final real catalog will likely be deeper than the current five homepage groups.

Suggested fields:

- titleFa
- slug
- parent (self relationship, optional)
- image
- descriptionFa
- sortOrder
- published

Current homepage fixture categories are only presentation-level starting points:

- مبلمان
- روشنایی و لوستر
- پارچه و بافت
- اکسسوری
- میز و کنسول

Do not assume these are the final full taxonomy.

#### `product-series`

Represents families such as:

- دلان
- داران
- ویونا

Suggested fields:

- titleFa
- slug
- descriptionFa
- style
- relatedSeries / matching collections if useful
- media

### Commerce product collections

Use Payload Ecommerce products/variants with collection overrides.

#### `products`

Add Nilper-specific fields to the plugin's product collection.

Suggested additions:

- `titleFa`
- `slug`
- `catalogCode` (catalog-level code, not necessarily sellable SKU)
- `series` relationship
- `brand` relationship
- `categories` relationship
- `salesMode`: `direct | made_to_order | inquiry`
- `availabilityMode`
- `shortDescriptionFa`
- `descriptionFa`
- `technicalSpecs` (structured flexible array/group; see below)
- `dimensions` / dimensions summary where product-level
- `weight` where product-level
- `orderNotesFa`
- `warrantyFa`
- `assemblyFa`
- `careFa`
- `leadTimeFa`
- `gallery`
- `relatedProducts`
- `matchingProducts`
- `configurationGroups`
- `sourceMetadata`
- publish/status fields

Do not bake all furniture-only fields directly into top-level Product columns.

#### `variants`

Extend Payload Ecommerce variants.

Suggested additions:

- `nilperCode` / SKU (unique when known)
- `titleFa`
- variant-specific dimensions
- variant-specific weight
- variant-specific manufacturing notes
- pricing
- inventory where meaningful

A product can have zero or several real variants.

### Product configuration

We need configuration choices that are separate from commerce variants.

#### `configuration-groups`

Examples:

- رنگ چوب
- روکش / پارچه
- رنگ پوششی
- انتخاب نوع پارچه

Suggested fields:

- titleFa
- key
- inputType: `swatch | select | radio | text | number`
- required
- options relationship
- rules / help text

#### `configuration-options`

Suggested fields:

- group relationship
- titleFa
- code (optional internal code)
- swatch/color/media where useful
- additionalPrice (only if actually required and validated)
- active
- sortOrder

For very large fabric catalogues we can later introduce a specialized `fabric-collections` / `fabric-options` model instead of overloading generic options.

### Flexible technical specifications

Real sheets contain different specification keys for different categories. Avoid a giant sparse database table.

Use a controlled structure such as:

```ts
technicalSpecs: [
  {
    key: 'frame-material',
    labelFa: 'جنس اسکلت',
    valueFa: 'چوب راش',
    group: 'construction',
    sortOrder: 10,
  },
]
```

Important specs frequently used for filtering can later be promoted into first-class fields/taxonomies. Do not prematurely normalize every Excel row into its own collection.

---

## 7. Cart item and order item configuration snapshot

Payload Ecommerce supports extending cart items and provides a `cartItemMatcher` so custom item fields can participate in line-item uniqueness.

Nilper needs this.

Conceptual cart/order item:

```ts
{
  product: productId,
  variant: variantId,
  quantity: 1,
  configuration: [
    { groupKey: 'wood-finish', optionId: '...', labelFa: 'گردویی' },
    { groupKey: 'fabric', optionId: '...', labelFa: 'LAVENDAR' },
  ]
}
```

Two items with the same product/variant but different configuration must become different cart lines.

### Critical validation during the vertical slice

Codex must verify whether the Ecommerce Plugin automatically preserves all overridden custom cart item fields when an order is created.

- If yes, use that mechanism.
- If not, add an explicit server-side order snapshot field/hook so configuration cannot be lost.

Never reconstruct a historical order from the current product configuration. Orders must preserve the configuration selected at purchase time.

---

## 8. Real source-data examples and what they prove

Three actual Nilper Excel workbooks were reviewed. They are source examples, not a complete catalog.

### `506(1).xlsx` — Viona / ویونا

Sheet: `NDTN506`

Persian source shows:

- bar chair / صندلی بار
- modern style
- plywood frame, beech legs
- multiple wood finishes including walnut, wenge, honey/natural and coated colors
- upholstery is based on Nilper's domestic upholstery variety file
- dimensions such as seat height/width/depth and total height
- two registration codes for different finish/order modes
- fabric usage information

This is evidence that wood finish/upholstery choice should not automatically become hundreds of variants.

### `886(1).xlsx` — Daran / داران bedroom family

Sheets include separate sellable pieces such as:

- bed
- dresser/mirror
- bedside table
- stool

Each piece has its own technical fields and some have multiple registration codes depending on construction/finish.

This is evidence for:

```text
Series (Daran)
  -> Product (Bed)
  -> Product (Dresser)
  -> Product (Bedside Table)
  -> Product (Stool)
```

not one giant product record.

### `994(1).xlsx` — Delan / دلان family

Includes:

- sofa
- matching coffee/side tables
- dining table
- dining chair
- matching relationships between them
- neoclassical style
- several wood finishes
- large list of compatible fabric palettes
- single-seat / three-seat product forms
- monochrome / polychrome registration codes
- fabric usage quantities

This is evidence for both **real variants** and **configuration groups**, plus `matchingProducts` / series relationships.

---

## 9. Source-data quality: never silently "fix" Excel

The sample workbooks contain apparent inconsistencies such as sheet/catalog/code naming differences. These may be typos, legacy codes, or business conventions.

Examples include cases where:

- a worksheet name and catalog code text differ by a digit
- a registration code prefix/number does not exactly match the worksheet title
- some labels appear copied from a related product

Codex/import scripts must **not silently normalize these values**.

Every imported document should be able to retain source traceability, for example:

```ts
sourceMetadata: {
  file: '994(1).xlsx',
  sheet: 'HSS 994',
  catalogCodeRaw: '...',
  importedAt: '...',
  dataQualityNotes: ['registration code requires manual verification'],
}
```

Create a staging/validation report for questionable records rather than guessing.

---

## 10. Persian-only data

The English columns in the supplied spreadsheets are not required for this project.

Rules:

- model and import Persian content only
- do not create duplicate `titleEn`, `descriptionEn`, etc. unless a future requirement explicitly appears
- slugs can remain Latin for stable URLs where appropriate
- do not introduce multilingual content architecture just because Payload supports localization

Admin interface Persian support / RTL can be configured separately from content localization.

Payload provides Persian (`fa`) translations and RTL-related configuration options. Validate current Admin RTL behavior during the foundation spike and fix only project-specific issues; do not fork Payload Admin.

---

## 11. Currency decision: Toman validation checkpoint

The existing storefront displays prices as **تومان** and existing fixture/order values are stored as integer Toman amounts.

Payload Ecommerce allows custom currency objects (`code`, `decimals`, `label`, `symbol`), but its docs describe `code` as an ISO 4217 code. Toman does not have a standard ISO 4217 code.

Do not hide this issue.

During the vertical slice, test a custom zero-decimal Toman configuration in Payload Ecommerce. If the plugin accepts the custom application code cleanly across product fields, carts, formatting and transactions, document the chosen code and use it consistently.

If the plugin or a payment adapter requires strict ISO currency behavior, choose a deliberate conversion strategy (for example IRR at the payment boundary) while keeping storefront display semantics consistent.

**Never mix Rial and Toman values silently.**

Add explicit helper/type names such as `amountToman` or a centralized Money abstraction if needed.

---

## 12. Supabase migration strategy

Current Supabase usage is useful working code and must not be deleted on day one.

Current responsibilities include:

- phone authentication
- profiles
- addresses
- orders
- order items
- order status history

### Migration rule

1. Add Payload successfully without breaking existing storefront/Supabase behavior.
2. Move catalog/product data to Payload.
3. Validate cart/order flow using the Payload commerce model.
4. Migrate customer/account/order persistence.
5. Implement Payload phone OTP auth.
6. Only after all required paths work, remove Supabase packages, env variables, migration files and old API code.

Final architecture should not keep two permanent sources of truth for users/orders.

---

## 13. Content outside commerce

Current blog/projects/brands are file-backed fixture/content systems and the site already works.

Do not migrate everything to Payload immediately.

Priority order:

1. Payload foundation
2. Products / variants / configurations
3. real catalog querying
4. cart/order commerce flow
5. auth/account migration
6. payment/shipping
7. then optionally migrate Brands, Projects and Blog into Payload when there is a real content-management need

This keeps Phase 1 focused on launch rather than CMS perfection.

---

## 14. First vertical slice: Delan

Before bulk-importing data, prove the architecture using one real family: **Delan / دلان**.

Vertical slice must demonstrate:

1. Payload runs inside the existing Next.js repository.
2. `/admin` works.
3. Postgres migrations work.
4. one Delan series record exists.
5. at least one Delan product exists.
6. real Nilper registration codes are represented as variants when appropriate.
7. wood finish and fabric are represented as configurations, not variant explosion.
8. existing public product UI renders Payload data through a mapper/DTO.
9. selected configuration creates distinct cart lines.
10. a test order preserves a complete configuration snapshot.
11. Persian text and RTL Admin editing are usable.
12. lint + build + existing tests pass.

Only after this slice is clean should we bulk-import the remaining spreadsheets/catalog.

---

## 15. Explicit non-goals for the first slice

Do not do these yet:

- redesign the storefront
- migrate every static page to Payload
- import all products
- implement SEO overhaul
- implement production Iranian payment gateway
- implement full shipping-rate engine
- remove Supabase immediately
- build a separate custom admin
- create every possible product variation
- invent/correct questionable Nilper source codes

---

## 16. Clean-code boundaries

Recommended project boundaries after integration:

```text
src/
  app/
    (frontend)/           # existing public app routes after route-group migration if needed
    (payload)/            # Payload-provided Admin/API route group

  payload/
    collections/
    fields/
    access/
    hooks/
    ecommerce/
    migrations/
    import/

  features/
    catalog/
      catalog-repository.ts
      catalog-mappers.ts
      catalog-types.ts      # storefront DTOs, not Payload document types
    product/
    cart/
    account/

  lib/
    payload/
    money/
```

Exact paths may differ from Payload's current template requirements. Follow current official Payload structure and the repository's Next.js 16 rules rather than forcing this sketch literally.

### Data-access principle

UI components should not import Payload collection types directly everywhere.

Prefer:

```text
Payload generated type
 -> server query/repository
 -> mapper
 -> StorefrontProduct
 -> component
```

This makes the frontend stable even if the admin schema evolves.

---

## 17. Security / data integrity rules

- Prices used for checkout must always be re-read and validated server-side.
- Never trust price, stock, SKU or configuration validity from client JSON.
- Payment secrets remain server-only.
- Use Payload access control for admin/customer ownership.
- Historical order items must be snapshots.
- Validate configuration options against the product before cart/order creation.
- Keep Postgres migrations committed.
- Never store credentials inside import files, Git history or source metadata.

---

## 18. Current official documentation references

Use current docs during implementation rather than relying on model memory:

- Payload installation / adding to existing Next.js app: https://payloadcms.com/docs/getting-started/installation
- Payload Ecommerce overview: https://payloadcms.com/docs/ecommerce/overview
- Ecommerce plugin configuration: https://payloadcms.com/docs/ecommerce/plugin
- Ecommerce frontend/cart APIs: https://payloadcms.com/docs/ecommerce/frontend
- Payment adapters: https://payloadcms.com/docs/ecommerce/payments
- Payload custom auth strategies: https://payloadcms.com/docs/authentication/custom-strategies
- Payload i18n: https://payloadcms.com/docs/configuration/i18n
- Payload localization / RTL locale behavior: https://payloadcms.com/docs/configuration/localization

---

## 19. Locked decision / reopening criteria

This architecture is considered locked after the Delan vertical slice succeeds.

Do not reopen the framework decision because another framework looks interesting.

Reopen only if the vertical slice proves a serious blocker such as:

- Payload cannot represent the required product/configuration model without unacceptable hacks
- order item configuration cannot be preserved reliably
- Persian/RTL Admin is unusable and cannot be corrected reasonably
- required commerce behavior fundamentally conflicts with the plugin architecture
- unacceptable performance or deployment limitation is demonstrated with evidence

Otherwise continue with Payload.
