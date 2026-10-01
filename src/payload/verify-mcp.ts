import assert from "node:assert/strict";
import type { Access } from "payload";

import config from "../../payload.config";
import {
  forceContentAgentDraft,
  forceContentAgentUnpublished,
} from "./access";
import {
  canRepairVariantOwnership,
  mcpExposedCollections,
  mcpRawOperationAccess,
  normalizeContentIdentity,
  normalizeMcpRichText,
} from "./mcp";

const resolved = await config;
const collections = new Map<string, NonNullable<typeof resolved.collections>[number]>(
  (resolved.collections ?? []).map((collection) => [collection.slug, collection]),
);

assert.equal(collections.has("imports"), false);
assert.equal(collections.has("exports"), false);
assert.ok(collections.has("payload-mcp-api-keys"));
assert.deepEqual([...mcpExposedCollections].sort(), [
  "blog-categories",
  "brands",
  "categories",
  "media",
  "posts",
  "products",
  "projects",
  "variantOptions",
  "variantTypes",
  "variants",
].sort());

assert.equal(normalizeContentIdentity("Wenge"), normalizeContentIdentity("wenge"));
assert.equal(normalizeContentIdentity("Wenge"), normalizeContentIdentity("ونگه"));
assert.equal(canRepairVariantOwnership(null, 4), true);
assert.equal(canRepairVariantOwnership({ id: 4 }, 4), true);
assert.equal(canRepairVariantOwnership({ id: 9 }, 4), false);
const normalizedRichText = normalizeMcpRichText("پاراگراف اول\n\nپاراگراف دوم") as {
  root: { type: string; children: Array<{ children: Array<{ text: string }> }> };
};
assert.equal(normalizedRichText.root.type, "root");
assert.equal(normalizedRichText.root.children.length, 2);
assert.equal(normalizedRichText.root.children[0]?.children[0]?.text, "پاراگراف اول");

const contentAgent = { id: 100, collection: "users", role: "content-agent" };
const admin = { id: 1, collection: "users", role: "admin" };
const access = async (handler: Access | undefined, user: unknown) => {
  assert.equal(typeof handler, "function");
  return handler!({ req: { user } } as never);
};

const apiKeys = collections.get("payload-mcp-api-keys")!;
assert.equal(await access(apiKeys.access?.read, contentAgent), false);
assert.equal(await access(apiKeys.access?.create, admin), true);
assert.deepEqual(apiKeys.labels, { plural: "کلیدهای دسترسی MCP", singular: "کلید دسترسی MCP" });
const permissionBulkActions = apiKeys.fields.find((field) => (
  field.type === "ui" && field.name === "mcpPermissionBulkActions"
));
assert.ok(permissionBulkActions && permissionBulkActions.type === "ui");
const configuredPermissionPaths = permissionBulkActions.admin?.custom?.permissionPaths as string[] | undefined;
assert.ok(configuredPermissionPaths);
assert.equal(configuredPermissionPaths.length, 16);
assert.equal(configuredPermissionPaths.some((path) => (
  path.endsWith(".create") || path.endsWith(".update") || path.endsWith(".delete")
)), false);
assert.ok(configuredPermissionPaths.includes("products.find"));
assert.ok(configuredPermissionPaths.includes("payload-mcp-tool.catalogCreateProductDraft"));
assert.ok(configuredPermissionPaths.includes("payload-mcp-tool.mediaUploadImage"));
assert.deepEqual(mcpRawOperationAccess, { find: true, create: false, update: false, delete: false });
const configuredRawOperations = apiKeys.fields.flatMap((field) => {
  if (field.type !== "collapsible") return [];
  return field.fields.flatMap((nested) => {
    if (nested.type !== "group" || !("name" in nested) || nested.name === "payload-mcp-tool") return [];
    return nested.fields.flatMap((operation) => "name" in operation ? [operation.name] : []);
  });
});
assert.equal(configuredRawOperations.length, mcpExposedCollections.length);
assert.ok(configuredRawOperations.every((operation) => operation === "find"));

for (const slug of ["products", "variants", "posts"] as const) {
  const collection = collections.get(slug)!;
  assert.ok(collection.versions && typeof collection.versions === "object" && collection.versions.drafts);
  assert.equal(await access(collection.access?.create, contentAgent), true);
  assert.equal(await access(collection.access?.delete, contentAgent), false);
}

for (const slug of ["brands", "categories", "blog-categories", "projects"] as const) {
  const collection = collections.get(slug)!;
  const published = collection.fields.flatMap((field) => field.type === "tabs"
    ? field.tabs.flatMap((tab) => tab.fields)
    : [field]).find((field) => "name" in field && field.name === "published");
  assert.ok(published && "defaultValue" in published && published.defaultValue === false, `${slug} must default unpublished`);
  assert.deepEqual(await access(collection.access?.update, contentAgent), { published: { equals: false } });
}

assert.deepEqual(
  await forceContentAgentDraft({ data: { _status: "published" }, req: { user: contentAgent } } as never),
  { _status: "draft" },
);
assert.deepEqual(
  await forceContentAgentUnpublished({ data: { published: true }, req: { user: contentAgent } } as never),
  { published: false },
);

const posts = collections.get("posts")!;
const postFieldNames = posts.fields.flatMap((field) => field.type === "tabs"
  ? field.tabs.flatMap((tab) => tab.fields).flatMap((field) => "name" in field ? [field.name] : [])
  : "name" in field ? [field.name] : []);
assert.ok(postFieldNames.includes("relatedProducts"));
assert.ok(postFieldNames.includes("relatedBrands"));

console.info("Payload MCP exposure, dedicated-role access, draft enforcement, and normalized identity verification passed.");
