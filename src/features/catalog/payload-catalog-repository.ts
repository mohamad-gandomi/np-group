import "server-only";

import { cache } from "react";
import { getPayload } from "payload";

import config from "../../../payload.config";
import type { ConfigurationGroup, ConfigurationOption, Product as PayloadProduct, Variant } from "@/payload-types";

import type { Product } from "./catalog-types";
import { mapPayloadProduct } from "./payload-catalog-mapper";

const getCatalogPayload = cache(() => getPayload({ config }));

async function loadRelations(product: PayloadProduct) {
  const payload = await getCatalogPayload();
  const groupIDs = (product.configurationGroups ?? [])
    .map((group) => typeof group === "number" ? group : group.id);

  const [groups, options, variants] = await Promise.all([
    groupIDs.length
      ? payload.find({
          collection: "configuration-groups",
          depth: 0,
          limit: groupIDs.length,
          overrideAccess: false,
          pagination: false,
          where: { id: { in: groupIDs } },
        })
      : Promise.resolve({ docs: [] }),
    groupIDs.length
      ? payload.find({
          collection: "configuration-options",
          depth: 0,
          limit: 100,
          overrideAccess: false,
          pagination: false,
          sort: "sortOrder",
          where: { group: { in: groupIDs } },
        })
      : Promise.resolve({ docs: [] }),
    product.enableVariants
      ? payload.find({
          collection: "variants",
          depth: 2,
          limit: 100,
          overrideAccess: false,
          pagination: false,
          sort: "createdAt",
          where: { product: { equals: product.id } },
        })
      : Promise.resolve({ docs: [] }),
  ]);

  return {
    configurationGroups: groups.docs as ConfigurationGroup[],
    configurationOptions: options.docs as ConfigurationOption[],
    variants: variants.docs as Variant[],
  };
}

async function mapProduct(product: PayloadProduct): Promise<Product> {
  return mapPayloadProduct(product, await loadRelations(product));
}

export const getCatalogProducts = cache(async (): Promise<Product[]> => {
  const payload = await getCatalogPayload();
  const result = await payload.find({
    collection: "products",
    depth: 2,
    limit: 100,
    overrideAccess: false,
    pagination: false,
    sort: "-createdAt",
  });
  return Promise.all(result.docs.map((product) => mapProduct(product)));
});

export const getProductBySlug = cache(async (slug: string): Promise<Product | null> => {
  const payload = await getCatalogPayload();
  const result = await payload.find({
    collection: "products",
    depth: 2,
    limit: 1,
    overrideAccess: false,
    pagination: false,
    where: { slug: { equals: slug } },
  });
  return result.docs[0] ? mapProduct(result.docs[0]) : null;
});
