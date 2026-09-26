import assert from "node:assert/strict";
import type { Payload } from "payload";

import {
  CATALOG_BATCH_SIZE,
  findAllCatalogProductListings,
  findCatalogProductPage,
} from "@/features/catalog/payload-catalog-queries";
import type { Product, Variant, VariantOption, VariantType } from "@/payload-types";

const PRODUCT_COUNT = CATALOG_BATCH_SIZE * 2 + 1;
const now = new Date().toISOString();
const products = Array.from({ length: PRODUCT_COUNT }, (_, index): Product => ({
  id: index + 1,
  title: `Product ${index + 1}`,
  slug: `product-${index + 1}`,
  productType: "variable",
  brand: { id: 1, title: "Brand", slug: "brand", published: true, createdAt: now, updatedAt: now },
  categories: [{ id: 1, title: "Furniture", slug: "furniture", published: true, createdAt: now, updatedAt: now }],
  salesMode: "direct",
  availabilityMode: "orderable",
  shippingMode: "freight",
  priceInTMNEnabled: false,
  descriptionFa: { root: { type: "root", children: [], direction: null, format: "", indent: 0, version: 1 } },
  attributes: [{ attribute: 1, allowedOptions: [index + 1], required: false, id: `attribute-${index + 1}` }],
  variantAttributes: [1],
  enableVariants: true,
  variantTypes: [1],
  _status: "published",
  createdAt: now,
  updatedAt: now,
}));

const calls: string[] = [];
const mockPayload = {
  find: async (args: Record<string, unknown>) => {
    const collection = String(args.collection);
    calls.push(collection);
    if (collection === "products") {
      const limit = Number(args.limit);
      const page = Number(args.page);
      const start = (page - 1) * limit;
      const docs = products.slice(start, start + limit);
      const totalPages = Math.ceil(products.length / limit);
      return {
        docs,
        hasNextPage: page < totalPages,
        page,
        totalDocs: products.length,
        totalPages,
      };
    }
    const ids = ((args.where as { id?: { in?: number[] } })?.id?.in ??
      ((args.where as { and?: Array<{ id?: { in?: number[] } }> })?.and?.[0]?.id?.in ?? []));
    if (collection === "variantTypes") {
      return { docs: ids.map((id): VariantType => ({
        id,
        label: "Color",
        name: "color",
        active: true,
        catalogFilterEnabled: true,
        catalogFilterLabel: "Color",
        catalogFilterPresentation: "swatch",
        catalogFilterPlacement: "primary",
        catalogFilterOrder: 10,
        createdAt: now,
        updatedAt: now,
      })) };
    }
    if (collection === "variantOptions") {
      return { docs: ids.map((id): VariantOption => ({
        id,
        label: `Color ${id}`,
        value: `color-${id}`,
        variantType: 1,
        colorHex: "#000000",
        active: true,
        createdAt: now,
        updatedAt: now,
      })) };
    }
    const productIDs = (args.where as { product?: { in?: number[] } })?.product?.in ?? [];
    if (collection === "variants") {
      return { docs: productIDs.map((id): Variant => ({
        id,
        product: id,
        title: `Variant ${id}`,
        options: [id],
        nilperCode: `SKU-${id}`,
        priceInTMNEnabled: true,
        priceInTMN: id,
        _status: "published",
        createdAt: now,
        updatedAt: now,
      })) };
    }
    throw new Error(`Unexpected collection ${collection}`);
  },
} as unknown as Pick<Payload, "find">;

const listings = await findAllCatalogProductListings(mockPayload);
assert.equal(listings.length, PRODUCT_COUNT, "all products beyond the first 100 must be returned");
assert.equal(listings.at(-1)?.slug, `product-${PRODUCT_COUNT}`);
assert.equal(calls.filter((call) => call === "products").length, 3);
assert.equal(calls.filter((call) => call === "variantTypes").length, 3);
assert.equal(calls.filter((call) => call === "variantOptions").length, 3);
assert.equal(calls.filter((call) => call === "variants").length, 3);
assert.equal(calls.length, 12, "relation reads must be per batch, not per product");

calls.length = 0;
const page = await findCatalogProductPage(mockPayload, { limit: 6, page: 999, sort: "-createdAt", where: {} });
assert.equal(page.total, PRODUCT_COUNT);
assert.equal(page.pageCount, Math.ceil(PRODUCT_COUNT / 6));
assert.equal(page.page, page.pageCount, "out-of-range pages resolve to the final real page");
assert.equal(page.products.length, PRODUCT_COUNT % 6);
assert.equal(calls.filter((call) => call === "products").length, 2);
assert.ok(calls.length <= 5, "page mapping must use a bounded number of relation reads");

console.info(`Catalog scalability regression passed for ${PRODUCT_COUNT} mocked products in batched queries.`);
