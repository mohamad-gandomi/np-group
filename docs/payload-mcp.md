# Payload content MCP

The application exposes the official Payload MCP endpoint at `/api/mcp`. It is restricted to content and catalog collections and is intended for draft preparation, not publishing or bulk import.

## Create the dedicated identity and key

1. In Payload Admin, create a new user with role **عامل محتوای هوش مصنوعی** (`content-agent`). Use a unique mailbox and a generated password; do not reuse an administrator account.
2. As an administrator, open **مدیریت → API Keys** and create a key assigned to that content-agent user.
3. Enable `find` for the required collections. Raw create, update, and delete tools are unavailable; all writes go through the domain tools.
4. Enable the five domain tools. Store the one-time key in the MCP client's secret storage.

The server additionally rejects keys belonging to any role other than `content-agent`. Content-agent writes to versioned collections are forced to `_status: draft`; boolean-backed content is forced to `published: false`, and the identity can update only already-unpublished boolean-backed records. Publishing stays in Payload Admin.

## Connect a client

Native Streamable HTTP configuration:

```json
{
  "mcpServers": {
    "NPGroup Payload": {
      "type": "http",
      "url": "https://YOUR_PAYLOAD_HOST/api/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_DEDICATED_MCP_KEY"
      }
    }
  }
}
```

For clients without native HTTP support, use `mcp-remote`:

```json
{
  "mcpServers": {
    "NPGroup Payload": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote",
        "https://YOUR_PAYLOAD_HOST/api/mcp",
        "--header",
        "Authorization: Bearer YOUR_DEDICATED_MCP_KEY"
      ]
    }
  }
}
```

Never add `overrideAccess=true` to a production URL. Payload access rules and hooks must remain authoritative.

## Operating rules

- Search before creating any brand, category, attribute, option, product, article, or project.
- Reuse normalized matches. If a label is ambiguous, stop and return it for review.
- A selectable color, wood finish, fabric, or upholstery choice is normally a product attribute, not a variant.
- Create a variant only for a real SKU/model identity such as a distinct catalog code, dimensions, price, inventory, shipping, or manufacturing model.
- Images are optional. Prefer existing media and never block a draft because media is missing.
- Put shared physical values in product `measurements`; put dimensions and fabric consumption that differ by SKU in that variant's `measurements`.
- Send product introductions as plain text unless you already have valid Lexical JSON. The domain tool converts plain text safely.
- Review every returned `created`, `reused`, `updated`, `skipped`, `warnings`, and `needsReview` entry, then verify the saved draft with a find tool before publishing manually.

## Example prompts

### Products from Excel

> Analyze the attached workbook without assuming a fixed layout. First list its sheets/sections and explain which cells or tables represent the product, shared specifications, selectable attributes, related products, media, and real SKU models. Compare all sheets and put contradictions, unclear labels, missing mappings, and unsupported embedded media in `sourceAnalysis.ambiguities` or `sourceAnalysis.unmapped`; do not guess. Before writing, use read-only Payload find tools to search products and variants by slug, catalog code, and SKU and to search normalized brands, categories, attributes, options, and relationships. Reuse exact or confidently normalized matches. Treat colors, fabrics, finishes, and wood choices as attributes. Create variants only for explicit SKU/model identities backed by dimensions, price, inventory, shipping, or manufacturing differences. Put shared facts in `product.technicalSpecs`, shared physical values in `product.measurements`, and SKU-specific dimensions and fabric consumption in each variant's `measurements`. Send the Persian introduction as plain text. Call `catalogCreateProductDraft` only after the analysis is complete; use `updateExistingDraft: true` only when I explicitly ask to repair the single matched draft. Never publish or delete. After the write, find the saved product and variants again and verify every claimed field. Report: interpreted structure, created, reused, updated, skipped, warnings, needsReview, and verification results.

### Repair an existing product draft

> Re-read the source and inspect the existing product and variants first. Prepare a complete corrected mapping, including valid Persian introduction text, shared technical specs, and SKU-specific dimensions/fabric consumption. Report every source conflict before writing. If there is exactly one product match and no unresolved ambiguity, call `catalogCreateProductDraft` with `updateExistingDraft: true`. Do not create a second product, publish, delete, or remove existing variants that are absent from the source. Verify the repaired draft with read-only find tools and report the stored values.

### SEO article

> Create a Persian article about choosing a modern sofa for a small apartment. Primary keyword: «مبل راحتی برای خانه کوچک». Search for substantially similar posts first, find relevant existing products and related articles, write a useful H1/summary/Lexical article body/meta title/meta description/primary topic, prepare useful hero-image alt guidance, and call `contentCreateArticleDraft`. Save as draft only and report unresolved relationships.

### Project from raw text

> Turn the following raw project notes into a structured Persian project profile. Search projects by slug/title first and reuse existing products and a related article where the notes support them. Call `contentCreateProjectDraft`, leave it unpublished, and explain every reused relationship and ambiguity: [PASTE NOTES]
