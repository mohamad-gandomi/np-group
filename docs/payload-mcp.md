# Payload content MCP

The application exposes the official Payload MCP endpoint at `/api/mcp`. It is restricted to content and catalog collections and is intended for draft preparation, not publishing or bulk import.

## Create the dedicated identity and key

1. In Payload Admin, create a new user with role **عامل محتوای هوش مصنوعی** (`content-agent`). Use a unique mailbox and a generated password; do not reuse an administrator account.
2. As an administrator, open **مدیریت → API Keys** and create a key assigned to that content-agent user.
3. Enable `find`, `create`, and `update` only for the required collections. Delete is not available in the MCP schema and is also denied by Payload access control.
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
- Review every returned `created`, `reused`, `updated`, `warnings`, and `needsReview` entry before publishing manually.

## Example prompts

### Products from Excel

> Read the attached Excel workbook and identify its product rows, taxonomy, customer-selectable attributes, and real SKU models. Before creating anything, use `catalogFindExisting` to inspect Payload. Reuse existing brands, categories, attributes, and options after normalizing spelling and formatting. Treat wood colors, fabric palettes, and finishes as product attributes unless the sheet gives a distinct SKU/dimensions/price/shipping/manufacturing identity. Then call `catalogCreateProductDraft`. Do not publish. Return a table of created, reused, and unresolved records.

### SEO article

> Create a Persian article about choosing a modern sofa for a small apartment. Primary keyword: «مبل راحتی برای خانه کوچک». Search for substantially similar posts first, find relevant existing products and related articles, write a useful H1/summary/Lexical article body/meta title/meta description/primary topic, prepare useful hero-image alt guidance, and call `contentCreateArticleDraft`. Save as draft only and report unresolved relationships.

### Project from raw text

> Turn the following raw project notes into a structured Persian project profile. Search projects by slug/title first and reuse existing products and a related article where the notes support them. Call `contentCreateProjectDraft`, leave it unpublished, and explain every reused relationship and ambiguity: [PASTE NOTES]
