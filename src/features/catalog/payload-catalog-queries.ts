import type { Payload, Where } from "payload";

import type {
  Product as PayloadProduct,
  Variant,
  VariantOption,
  VariantType,
} from "@/payload-types";
import { relationID, relationIDs } from "@/payload/catalog-domain";

import type { Product } from "./catalog-types";
import {
  mapPayloadProduct,
  mapPayloadProductListing,
} from "./payload-catalog-mapper";

export const CATALOG_BATCH_SIZE = 250;

// Listing reads deliberately omit rich text, galleries, measurements, related
// products, and joins. Populated documents are restricted to card fields.
export const catalogListingSelect = {
  title: true,
  slug: true,
  productType: true,
  brand: true,
  categories: true,
  technicalSpecs: true,
  attributes: true,
  priceInTMNEnabled: true,
  priceInTMN: true,
  availabilityMode: true,
  shippingMode: true,
  mainImage: true,
  createdAt: true,
} as const;

export const catalogListingPopulate = {
  brands: { title: true, slug: true },
  categories: { title: true, slug: true },
  media: { filename: true, url: true },
} as const;

type CatalogPayload = Pick<Payload, "find">;

const idsForListings = (products: readonly PayloadProduct[]) => ({
  groupIDs: [...new Set(products.flatMap((product) =>
    (product.attributes ?? []).map((row) => relationID(row.attribute)).filter((id): id is number => id !== undefined)))],
  optionIDs: [...new Set(products.flatMap((product) =>
    (product.attributes ?? []).flatMap((row) => relationIDs(row.allowedOptions))))],
  productIDs: products.filter((product) => product.productType === "variable").map((product) => product.id),
});

/** Adds storefront facets and variant-derived prices with three bulk reads per result set. */
export async function mapCatalogProductListings(
  payload: CatalogPayload,
  products: readonly PayloadProduct[],
): Promise<Product[]> {
  if (!products.length) return [];
  const { groupIDs, optionIDs, productIDs } = idsForListings(products);
  const [groups, options, variants] = await Promise.all([
    groupIDs.length
      ? payload.find({
          collection: "variantTypes",
          depth: 1,
          overrideAccess: false,
          pagination: false,
          select: {
            active: true,
            catalogFilterCategories: true,
            catalogFilterEnabled: true,
            catalogFilterLabel: true,
            catalogFilterOrder: true,
            catalogFilterPlacement: true,
            catalogFilterPresentation: true,
            catalogFilterScope: true,
            label: true,
            name: true,
          },
          populate: { categories: { slug: true, title: true } },
          where: { and: [{ id: { in: groupIDs } }, { active: { equals: true } }, { catalogFilterEnabled: { equals: true } }] },
        })
      : Promise.resolve({ docs: [] }),
    optionIDs.length
      ? payload.find({
          collection: "variantOptions",
          depth: 0,
          overrideAccess: false,
          pagination: false,
          select: { active: true, colorHex: true, label: true, sortOrder: true, value: true, variantType: true },
          where: { and: [{ id: { in: optionIDs } }, { active: { equals: true } }] },
        })
      : Promise.resolve({ docs: [] }),
    productIDs.length
      ? payload.find({
          collection: "variants",
          depth: 0,
          overrideAccess: false,
          pagination: false,
          select: {
            availabilityMode: true,
            createdAt: true,
            priceInTMN: true,
            priceInTMNEnabled: true,
            product: true,
          },
          sort: "createdAt",
          where: { product: { in: productIDs } },
        })
      : Promise.resolve({ docs: [] }),
  ]);

  return products.map((product) => mapPayloadProductListing(product, {
    attributes: groups.docs as VariantType[],
    attributeOptions: options.docs as VariantOption[],
    variants: variants.docs as Variant[],
  }));
}

/** Reads every storefront product in bounded pages; no catalog-size hard stop. */
export async function findAllCatalogProductListings(payload: CatalogPayload): Promise<Product[]> {
  const products: Product[] = [];
  let page = 1;
  let hasNextPage = true;

  while (hasNextPage) {
    const result = await payload.find({
      collection: "products",
      depth: 1,
      limit: CATALOG_BATCH_SIZE,
      overrideAccess: false,
      page,
      populate: catalogListingPopulate,
      select: catalogListingSelect,
      sort: "-createdAt",
    });
    products.push(...await mapCatalogProductListings(payload, result.docs as PayloadProduct[]));
    hasNextPage = result.hasNextPage;
    page += 1;
  }

  return products;
}

export async function findCatalogProductPage(
  payload: CatalogPayload,
  args: { limit: number; page: number; sort: string; where: Where },
) {
  const findPage = (page: number) => payload.find({
    collection: "products",
    depth: 1,
    limit: args.limit,
    overrideAccess: false,
    page,
    populate: catalogListingPopulate,
    select: catalogListingSelect,
    sort: args.sort,
    where: args.where,
  });
  let result = await findPage(args.page);
  if (result.totalPages > 0 && args.page > result.totalPages) result = await findPage(result.totalPages);

  return {
    products: await mapCatalogProductListings(payload, result.docs as PayloadProduct[]),
    total: result.totalDocs,
    page: result.page ?? 1,
    pageCount: Math.max(1, result.totalPages),
  };
}

/** Hydrates full detail graphs in three bulk relation reads, regardless of product count. */
export async function mapCatalogProductDetails(
  payload: CatalogPayload,
  products: readonly PayloadProduct[],
): Promise<Product[]> {
  if (!products.length) return [];
  const productIDs = products.map((product) => product.id);
  const groupIDs = [...new Set(products.flatMap((product) =>
    (product.attributes ?? []).map((row) => relationID(row.attribute)).filter((id): id is number => id !== undefined)))];
  const optionIDs = [...new Set(products.flatMap((product) =>
    (product.attributes ?? []).flatMap((row) => relationIDs(row.allowedOptions))))];

  const [groups, options, variants] = await Promise.all([
    groupIDs.length
      ? payload.find({
          collection: "variantTypes",
          depth: 1,
          overrideAccess: false,
          pagination: false,
          populate: { categories: { slug: true, title: true } },
          where: { id: { in: groupIDs } },
        })
      : Promise.resolve({ docs: [] }),
    optionIDs.length
      ? payload.find({
          collection: "variantOptions",
          depth: 1,
          overrideAccess: false,
          pagination: false,
          sort: "sortOrder",
          where: { and: [{ id: { in: optionIDs } }, { active: { equals: true } }] },
        })
      : Promise.resolve({ docs: [] }),
    payload.find({
      collection: "variants",
      depth: 2,
      overrideAccess: false,
      pagination: false,
      sort: "createdAt",
      where: { product: { in: productIDs } },
    }),
  ]);

  return products.map((product) => {
    const productGroupIDs = (product.attributes ?? [])
      .map((row) => relationID(row.attribute))
      .filter((id): id is number => id !== undefined);
    const productOptionIDs = (product.attributes ?? []).flatMap((row) => relationIDs(row.allowedOptions));
    return mapPayloadProduct(product, {
      attributes: (groups.docs as VariantType[]).filter((group) => productGroupIDs.includes(group.id)),
      attributeOptions: (options.docs as VariantOption[]).filter((option) => productOptionIDs.includes(option.id)),
      variants: (variants.docs as Variant[]).filter((variant) => relationID(variant.product) === product.id),
    });
  });
}
