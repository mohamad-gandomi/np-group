import assert from "node:assert/strict";

import config from "../../payload.config";
import {
  isPublicStorefrontRecord,
  shouldRevalidateStorefrontChange,
  storefrontRevalidationPlan,
} from "./storefront-revalidation";

assert.equal(isPublicStorefrontRecord({ _status: "published" }, "status"), true);
assert.equal(isPublicStorefrontRecord({ _status: "draft" }, "status"), false);
assert.equal(isPublicStorefrontRecord({ published: true }, "published"), true);
assert.equal(isPublicStorefrontRecord({ published: false }, "published"), false);
assert.equal(isPublicStorefrontRecord({ active: true }, "active"), true);
assert.equal(isPublicStorefrontRecord(undefined, "always"), true);

assert.equal(
  shouldRevalidateStorefrontChange(
    { _status: "published" },
    { _status: "draft" },
    "status",
  ),
  true,
);
assert.equal(
  shouldRevalidateStorefrontChange(
    { _status: "draft" },
    { _status: "published" },
    "status",
  ),
  true,
);
assert.equal(
  shouldRevalidateStorefrontChange({ _status: "draft" }, { _status: "draft" }, "status"),
  false,
);

const plan = storefrontRevalidationPlan(["catalog", "showcase", "catalog"]);
assert.deepEqual(plan.tags, ["payload-catalog", "payload-showcase"]);
assert.equal(plan.paths.filter(({ path }) => path === "/sitemap.xml").length, 1);
assert.ok(plan.paths.some(({ path, type }) => path === "/(frontend)" && type === "layout"));
assert.ok(plan.paths.some(({ path }) => path === "/brands"));
assert.ok(plan.paths.some(({ path }) => path === "/projects"));

const expectedHookedCollections = [
  "users",
  "media",
  "blog-categories",
  "posts",
  "brands",
  "projects",
  "categories",
  "product-series",
  "configuration-groups",
  "configuration-options",
  "products",
  "variants",
  "variantOptions",
  "variantTypes",
];

const resolvedConfig = await config;
const resolvedCollections = resolvedConfig.collections ?? [];
const collectionsBySlug = new Map<string, (typeof resolvedCollections)[number]>(
  resolvedCollections.map((collection) => [collection.slug, collection]),
);

for (const slug of expectedHookedCollections) {
  const collection = collectionsBySlug.get(slug);
  assert.ok(collection, `Expected collection ${slug} to exist`);
  assert.ok(collection.hooks?.afterChange?.length, `${slug} must invalidate after changes`);
  assert.ok(collection.hooks?.afterDelete?.length, `${slug} must invalidate after deletion`);
}

console.info("Storefront revalidation hook verification passed.");
