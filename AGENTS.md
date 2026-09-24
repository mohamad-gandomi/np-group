<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# NPGroup project rules

- Stack: Next.js 16, React 19, TypeScript, Tailwind CSS 4, Payload CMS/Ecommerce 3.88, and PostgreSQL.
- Payload/PostgreSQL is the source of truth for catalog, content, commerce, and customer data.
- Preserve the current Persian RTL storefront and public URLs unless a redesign or route change is explicitly requested.
- Store application money as non-negative integer Toman values. Convert to Rial only at an explicit provider boundary through src/payload/money.ts.
- Products use manually curated simple/variable models. Attributes do not automatically generate variants.
- Keep public UI code behind the existing server repository/DTO boundaries; do not spread generated Payload document shapes into components.
- Trust server-resolved products, configurations, prices, shipping, payments, and historical order snapshots—not browser values.
- Inspect only files relevant to the task. Avoid package-lock.json, generated files, migration snapshots, history, and unrelated code unless required.
- Use the installed Next.js and Payload documentation when current API behavior is uncertain.
- Run focused checks while developing. Run the full appropriate regression/build checks before a checkpoint.
