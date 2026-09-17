import assert from "node:assert/strict";
import { getPayload } from "payload";

import config from "../../payload.config";
import { manualCatalogProducts } from "./manual-catalog";

const payload = await getPayload({ config });

for (const expected of manualCatalogProducts) {
  const result = await payload.find({
    collection: "products",
    depth: 2,
    limit: 2,
    overrideAccess: true,
    where: { slug: { equals: expected.slug } },
  });
  assert.equal(result.totalDocs, 1, `${expected.slug} must resolve to exactly one product.`);

  const product = result.docs[0];
  assert(product, `${expected.slug} was not found.`);
  assert.equal(product.title, expected.title);
  assert.equal(product.catalogCode, expected.catalogCode);
  assert.equal(product._status, "published");
  assert.equal(product.salesMode, "made_to_order", `${expected.slug} sales mode must remain made_to_order.`);
  assert.equal(product.availabilityMode, "orderable");
  assert.equal(product.priceInTMNEnabled, false);
  const mainImage = product.mainImage;
  assert(mainImage && typeof mainImage === "object", `${expected.slug} must have populated media.`);
  assert.equal(mainImage.filename, expected.image.filename);

  const variants = await payload.find({
    collection: "variants",
    depth: 1,
    limit: 100,
    overrideAccess: true,
    pagination: false,
    where: { product: { equals: product.id } },
  });
  assert.deepEqual(
    variants.docs.map((variant) => variant.nilperCode).sort(),
    expected.variants.map((variant) => variant.code).sort(),
    `${expected.slug} variants must match the manually reviewed source codes.`,
  );
  assert(variants.docs.every((variant) => variant.priceInTMNEnabled === false));
}

payload.logger.info(`Verified ${manualCatalogProducts.length} manually curated products without invented prices or duplicate slugs.`);
await payload.destroy();
