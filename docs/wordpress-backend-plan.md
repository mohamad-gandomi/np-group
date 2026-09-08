# WordPress backend checklist

## Agreed requirements

- Keep the existing Next.js design, components, layout and responsive styling.
- WordPress manages products, product-related data, brands, projects and structured blog content.
- Static marketing copy, header and footer remain in Next.js. Dynamic listings on these pages will read WordPress data.
- Keep the custom plugin in `wordpress/plugins/np-group` in this repository.
- Use Persian content and admin labels; preserve manufacturer identifiers without requiring English editorial fields.
- Use native WooCommerce products, prices, images, SKUs, dimensions, weights and numerical inventory.
- Use WooCommerce product tags for فضای مناسب.
- Use shared attributes for filters/options and variations for combinations with different prices or stock.
- Use ordered, repeatable title/value rows for additional specifications.
- Products have an explicit online-purchase or contact-only mode. Contact-only products show their price when supplied and still offer contact.
- Track exact showroom pieces with normal quantities (for example, 1). Purchasable variation stock must describe that exact configuration.
- New made-to-order requests are handled by phone; online checkout must not accept backorders.
- Sell sets as listed products. Individual pieces can be requested by phone.
- Fabric prices and inventory are per whole meter; fractional quantities are not allowed.
- Use one shared seller telephone number, configured by the owner.
- Do not interrupt checkout with SMS verification. Account creation/association must not grant account access before later phone verification.
- Choose the Iranian SMS provider and payment gateway later.

## Architecture rules

- Use native WordPress hooks and WooCommerce CRUD APIs rather than duplicating their data model.
- Keep one responsibility per small, clearly named file; no general-purpose framework or oversized plugin class.
- Keep admin rendering, input validation, purchasing rules and public data serialization separate.
- Validate permissions and nonces for admin mutations. Never expose private supplier notes through public APIs.
- Default new products to contact-only until explicitly enabled for online purchase.
- No automatic customer-data deletion on plugin deactivation or uninstall.
- Every phase gets a focused Conventional Commit with relevant validation.

## Phase 1: local development environment (current task)

- [ ] Add Docker Compose for WordPress, database and WP-CLI.
- [ ] Bind-mount the plugin so PHP edits take effect on the next request.
- [ ] Persist the installation and database in Docker volumes; keep generated WordPress files outside Git.
- [ ] Bind WordPress to localhost, install WooCommerce and configure Persian administration.
- [ ] Provide repeatable setup/start/stop/check commands and local credentials documentation.
- [ ] Verify running services and that setup can run again without resetting data.

## Phase 2: product plugin foundation (current task)

- [ ] Add a minimal bootstrap with a WooCommerce dependency check.
- [ ] Add Persian product fields: purchase mode, piece/meter unit, preparation note, ordered title/value specifications.
- [ ] Add a shared seller phone setting.
- [ ] Reuse native tags, attributes, variations, pricing and dimensions.
- [ ] Enforce contact-only products, positive whole quantities and no online backorders server-side.
- [ ] Add an explicit, local-only sample-data command for testing; never auto-import the supplied manufacturer sheets.
- [ ] Verify field persistence, purchasing restrictions, variation behavior and live-mounted edits.
- [ ] Document what is implemented and what is still planned.

## Phase 3: CMS and Next.js integration (later)

- [ ] Map native WooCommerce brands to the existing brand pages; add only missing profile fields.
- [ ] Add projects and product/brand/article relationships.
- [ ] Add structured blog fields matching the existing article renderer.
- [ ] Design a versioned, read-only public content contract with pagination and filtering.
- [ ] Replace fixture imports through a server-side data adapter, preserving frontend layout.
- [ ] Implement authenticated draft previews and authenticated content-change cache refresh.
- [ ] Preserve Persian search, metadata, publication rules, sitemap and missing-page behavior.
- [ ] Compare desktop/mobile screenshots against the existing frontend before accepting integration.

## Phase 4: checkout and customer accounts (later)

- [ ] Select payment gateway and delivery/fee rules; verify their headless compatibility.
- [ ] Use WooCommerce orders, stock reservations, payment confirmation and stock reduction.
- [ ] Create unverified customer records without a checkout OTP step; require later verification for account access.
- [ ] Resolve existing-number and typo handling without overwriting an existing customer's profile or exposing their orders.
- [ ] Select SMS provider and implement provider-independent verification with expiry and rate limits.
- [ ] Replace Supabase only after the WordPress-backed flows are verified.
- [ ] Test repeat payment notifications, failed payments, stock races and account ownership.

## Content review before launch

- [ ] Confirm source spreadsheet code/dimension inconsistencies (for example 506/507 and the دلان table dimensions).
- [ ] Supply real prices, availability, preparation times, phone number and approved images.
- [ ] Confirm which fabric/finish combinations are actually sold online.
- [ ] Decide packed versus assembled dimensions before shipping calculations use the native dimension fields.

## Validation record

Pending implementation.
