# Local WordPress backend

This is a development environment, separate from the Next.js frontend. Docker Desktop must be running with Linux containers.

```sh
npm run wp:setup
```

Setup creates ignored `wordpress/.env` with random local passwords, starts WordPress and MariaDB, installs WooCommerce, activates NP Group and enables Persian administration. Open **http://localhost:8080/wp-admin/**. The username is `npadmin`; find the password under `WP_ADMIN_PASSWORD` in `wordpress/.env`.

Official plugin/language ZIPs are downloaded through the host's `curl` into ignored `wordpress/.cache`, then installed locally in the container. This works when Docker cannot use the host's network/proxy. Initial downloads require internet; subsequent setup runs reuse the cache. Versions: WordPress 7.1 (PHP 8.3), WP-CLI 2.12, MariaDB 11.4, WooCommerce 11.1.0. Core language-pack versions must be updated alongside the WordPress image when upgrading.

Setup can be run again: it does not reset users, products, settings or passwords. Existing WooCommerce installs are not automatically upgraded. Edit `WP_PORT` before initial setup if 8080 is occupied. Changing the port later also requires updating WordPress `home` and `siteurl` options.

## Daily use

| Command | Purpose |
| --- | --- |
| `npm run wp:start` | Start existing services |
| `npm run wp:stop` | Stop services, preserving all data |
| `npm run wp:status` | Inspect services |
| `npm run wp:logs` | View recent WordPress logs |
| `npm run wp:test` | Run PHP syntax and product integration checks |
| `npm run wp:seed` | Create local-only, clearly labeled sample products |
| `npm run wp:cli -- plugin list` | Run WP-CLI against this installation |

The plugin folder is mounted read-only into WordPress. Edit the repository files and refresh the browser; PHP changes require no rebuild or reinstall. Static admin assets are versioned by modification time. Activate the plugin once during setup. Database and WordPress files live in named Docker volumes, outside Git. Stopping containers preserves uploads and products.

The database has no host port and WordPress binds only to `127.0.0.1`. The setup is **not a production deployment**. Do not use its credentials in production. No payment gateway or SMS sender is configured.

## Scope and conventions

See [the implementation checklist](../docs/wordpress-backend-plan.md). This first version implements product settings and purchasing rules. It does not yet connect Next.js, migrate Supabase, or implement customer accounts, content APIs, projects or structured articles.

Use native WooCommerce tags for فضای مناسب, attributes for shared properties/options, variations for independently priced configurations, and the NP Group product tab for extra specifications and purchase mode. New products default to contact-only. Configure the shared phone at **Settings → تنظیمات ان‌پی**.

Local WooCommerce prices are initially **ریال**, with kg/cm units. This is deliberately explicit: the existing Next.js fixtures display تومان. Currency conversion and gateway units must be settled during frontend/payment integration; do not copy fixture amounts directly into this test store.

Sample products are synthetic test data, not an import of the manufacturer spreadsheets. Tests create temporary products and delete only their own fixtures in a `finally` block. The seed command identifies its products by reserved `NP-LOCAL-` SKUs and does not overwrite them on reruns.
