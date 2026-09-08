# WordPress content integration

## Current scope

- [ ] Export the current Next.js fixtures as a permanent, import-only sample archive.
- [ ] Import native products, categories, brands, tags, attributes and media without overwriting existing records.
- [ ] Add editable structured project/article fields and brand profile fields.
- [ ] Import 12 sample products, 5 catalog categories, 6 demo brands, 3 demo projects and 4 articles.
- [ ] Serve only published WordPress records through a versioned, paginated public content API; preserve demo noindex rules.
- [ ] Connect all Next.js content consumers, including menu search, filters, product details, homepage listings, metadata and sitemap.
- [ ] Preserve the current visual layout; make only the agreed product purchase/contact behavior changes.
- [ ] Preserve stable legacy product IDs for carts and relationships. Check prices/availability against WordPress on the server.
- [ ] Verify import reruns, admin editing, draft exclusion, newly published slugs, image loading and empty collections.
- [ ] Verify desktop/mobile rendering, lint, production build and existing SEO regression checks.
- [ ] Record the result in focused commits and setup instructions.

The existing checkout remains an order-request flow until the payment/account phase. This phase must not imply that a payment gateway or deferred phone verification is implemented. Authenticated editorial previews and publishing webhooks are subsequent work; development reads are fresh and production content has a short refresh interval in this phase.

Samples keep their existing copy, URLs, ordering and images. Published WordPress status makes demo showcase records viewable, while their separate editorial approval flag keeps them noindex and outside the sitemap. Draft/private records must never be returned by the public API. The manufacturer spreadsheets are not imported by this task.
