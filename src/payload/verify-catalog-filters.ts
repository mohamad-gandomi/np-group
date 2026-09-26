import assert from "node:assert/strict";

import { catalogAttributeFilters, parseCatalogQuery, shopHref } from "@/features/catalog/catalog-query";
import { buildCatalogAttributeFacets } from "@/features/catalog/catalog-facets";
import { mapPayloadProductListing } from "@/features/catalog/payload-catalog-mapper";
import type { Product, VariantOption, VariantType } from "@/payload-types";

assert.deepEqual(catalogAttributeFilters({
  "f_wood-finish": ["walnut", "oak", "walnut"],
  "f_upholstery-palette": "verona",
  "f_Invalid": "ignored",
  "f_bad_key": "ignored",
}), {
  "wood-finish": ["walnut", "oak"],
  "upholstery-palette": ["verona"],
});

const parsed = parseCatalogQuery({
  color: "گردویی",
  "f_wood-finish": ["walnut", "oak"],
});
assert.deepEqual(parsed.color, ["گردویی"], "legacy color URLs remain accepted");
assert.deepEqual(parsed.attributeFilters, { "wood-finish": ["walnut", "oak"] });

assert.equal(
  shopHref("/shop", { "f_wood-finish": ["walnut", "oak"], page: "3" }, { page: undefined }),
  "/shop?f_wood-finish=walnut&f_wood-finish=oak",
);

const now = new Date().toISOString();
const product = {
  id: 1,
  title: "Chair",
  slug: "chair",
  productType: "simple",
  brand: { id: 1, title: "Brand", slug: "brand", published: true, createdAt: now, updatedAt: now },
  categories: [{ id: 1, title: "Furniture", slug: "furniture", published: true, createdAt: now, updatedAt: now }],
  technicalSpecs: [],
  attributes: [
    { attribute: 1, allowedOptions: [11], required: false },
    { attribute: 2, allowedOptions: [12], required: false },
  ],
  variantAttributes: [],
  priceInTMNEnabled: false,
  availabilityMode: "orderable",
  shippingMode: "freight",
  createdAt: now,
  updatedAt: now,
} as unknown as Product;

const groups = [
  {
    id: 1,
    label: "Wood color",
    name: "wood-finish",
    active: true,
    catalogFilterEnabled: true,
    catalogFilterLabel: "Color",
    catalogFilterPresentation: "swatch",
    catalogFilterPlacement: "primary",
    catalogFilterOrder: 10,
    catalogFilterScope: "categories",
    catalogFilterCategories: [{ id: 1, title: "Furniture", slug: "furniture", published: true, createdAt: now, updatedAt: now }],
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 2,
    label: "Internal configuration",
    name: "internal",
    active: true,
    catalogFilterEnabled: false,
    createdAt: now,
    updatedAt: now,
  },
] as VariantType[];

const options = [
  { id: 11, variantType: 1, label: "Walnut", value: "walnut", active: true, colorHex: "#76513c", createdAt: now, updatedAt: now },
  { id: 12, variantType: 2, label: "Hidden", value: "hidden", active: true, createdAt: now, updatedAt: now },
] as VariantOption[];

const listing = mapPayloadProductListing(product, { attributes: groups, attributeOptions: options, variants: [] });
assert.deepEqual(listing.catalogFacets, [{
  key: "wood-finish",
  label: "Color",
  presentation: "swatch",
  placement: "primary",
  sortOrder: 10,
  scope: "categories",
  categorySlugs: ["furniture"],
  options: [{ label: "Walnut", value: "walnut", swatchColor: "#76513c" }],
}]);
assert.deepEqual(listing.colors, ["Walnut"]);
assert.deepEqual(
  buildCatalogAttributeFacets([listing]),
  [],
  "category-scoped filters stay hidden on the general shop page",
);
assert.equal(
  buildCatalogAttributeFacets([listing], "furniture")[0]?.key,
  "wood-finish",
  "category-scoped filters appear in their selected category",
);

console.info("Catalog filter regression passed.");
