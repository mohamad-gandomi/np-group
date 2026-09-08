# NP Group plugin

Small, native WordPress modules. No build step, Composer dependency or custom framework.

| File | Responsibility |
| --- | --- |
| `np-group.php` | Dependency check and hook registration |
| `includes/product-data.php` | Shared product settings, variation inheritance, specification normalization |
| `includes/purchase-rules.php` | Classic cart/purchase rules using WooCommerce stock |
| `includes/store-api-rules.php` | Store API validation, including pre-rounding quantity checks |
| `includes/admin/product-fields.php` | Product-tab hooks and permission/nonce-checked saving |
| `includes/admin/views/` | Escaped, server-rendered editor markup |
| `includes/admin/settings.php` | Shared seller telephone setting |
| `assets/product-fields.js` | Add, remove and reorder specification rows |

## Stored data

NP-specific product metadata: `_np_purchase_mode` (`online` or `contact`), `_np_sale_unit` (`piece` or `meter`), `_np_lead_time` (plain text), `_np_specifications` (ordered `{title, value}` rows, maximum 100). Variations inherit these settings from their parent. Their native prices, dimensions and stock stay in WooCommerce.

`np_group_seller_phone` is the shared site option. The field accepts Persian/Arabic digits and stores normalized digits for future telephone links. No default real phone number is invented.

The specification list is public descriptive content, not a place for private supplier notes. All rows are plain text and blank/incomplete rows are omitted. No custom public content endpoint has been added yet. Native WooCommerce APIs remain available with their usual access controls.

## Current purchasing rules

- Missing purchase mode means contact-only.
- Price is never erased when changing to contact mode.
- Contact-only products and their variations cannot be bought online.
- Online backorders are disabled. Native WooCommerce handles inventory totals and reservations.
- Positive whole quantities only; fabric quantities represent meters.
- The admin tab is implemented for WooCommerce's standard product editor.

No public theme templates, Next.js components, customer authentication or payment gateway behavior are replaced by this version. Contact-button rendering and Persian availability labels will be wired into the existing Next.js design during integration. Deactivation preserves all settings and products.
