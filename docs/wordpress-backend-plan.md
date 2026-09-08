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

- [x] Add Docker Compose for WordPress, database and WP-CLI.
- [x] Bind-mount the plugin so PHP edits take effect on the next request.
- [x] Persist the installation and database in Docker volumes; keep generated WordPress files outside Git.
- [x] Bind WordPress to localhost, install WooCommerce and configure Persian administration.
- [x] Provide repeatable setup/start/stop/check commands and local credentials documentation.
- [x] Verify running services and that setup can run again without resetting data.

## Phase 2: product plugin foundation (current task)

- [x] Add a minimal bootstrap with a WooCommerce dependency check.
- [x] Add Persian product fields: purchase mode, piece/meter unit, preparation note, ordered title/value specifications.
- [x] Add a shared seller phone setting.
- [x] Reuse native tags, attributes, variations, pricing and dimensions.
- [x] Enforce contact-only products, positive whole quantities and no online backorders server-side.
- [x] Add an explicit, local-only sample-data command for testing; never auto-import the supplied manufacturer sheets.
- [x] Verify field persistence, purchasing restrictions, variation behavior and live-mounted edits.
- [x] Document what is implemented and what is still planned.

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

Verified 2026-09-08:

- WordPress 7.1/PHP 8.3 and MariaDB 11.4 are healthy on localhost:8080; WooCommerce 11.1.0 and NP Group 0.1.0 are active.
- Persian core and WooCommerce language packs installed. Host-cached official ZIP downloads avoid the container network failure.
- Setup rerun completed without resetting products, account credentials or store configuration.
- PHP syntax checks and 21 integration checks passed, including real Store API cart additions, overselling, contact restrictions, variation inheritance, whole-meter validation and admin mutation protection.
- Browser verified Persian login, product editor, adding/reordering/saving/reloading specification rows and shared phone settings. No browser errors were reported on the checked editor page.
- Native REST index returns HTTP 200. Repository lint and diff whitespace checks passed.
- Four explicitly labeled local sample products created. No manufacturer spreadsheets imported.
- Live-mounted changes were exercised without rebuilding or reinstalling the plugin.
- Plugin PHP modules are at most 77 lines; editor JavaScript is 35 lines. Integration fixtures are isolated from production code.
- Next.js visuals/data sources, Supabase, customer account creation and payment integration remain unchanged and are tracked in later phases.

Commits: `bae1ed8` (checklist), `5045d9a` (plugin), `5c47ee7` (Docker and tests).
