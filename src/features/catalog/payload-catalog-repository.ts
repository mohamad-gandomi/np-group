import "server-only";

import { unstable_cache } from "next/cache";
import { cache } from "react";
import { getPayload } from "payload";
import type { Where } from "payload";

import config from "../../../payload.config";
import type { Category, VariantType, VariantOption, Product as PayloadProduct, Variant } from "@/payload-types";
import { relationIDs } from "@/payload/catalog-domain";

import { PAGE_SIZE, parseCatalogQuery, type RawSearchParams } from "./catalog-query";
import {
  payloadCategorySlugsForRooms,
  payloadCategorySlugsForStorefront,
  storefrontTaxonomyForPayloadCategory,
} from "./catalog-taxonomy";
import type { CatalogCategory, CatalogFacets, Product } from "./catalog-types";
import { mapPayloadProduct, payloadMediaURL } from "./payload-catalog-mapper";

const CATALOG_REVALIDATE_SECONDS = 300;
const getCatalogPayload = cache(() => getPayload({ config }));

async function loadRelations(product: PayloadProduct) {
  const payload = await getCatalogPayload();
  const groupIDs = (product.attributes ?? []).map((row) => typeof row.attribute === 'number' ? row.attribute : row.attribute.id);
  const optionIDs = (product.attributes ?? []).flatMap((row) => relationIDs(row.allowedOptions));

  const [groups, options, variants] = await Promise.all([
    groupIDs.length
      ? payload.find({
          collection: "variantTypes",
          depth: 0,
          limit: groupIDs.length,
          overrideAccess: false,
          pagination: false,
          where: { id: { in: groupIDs } },
        })
      : Promise.resolve({ docs: [] }),
    groupIDs.length
      ? payload.find({
          collection: "variantOptions",
          depth: 1,
          limit: 100,
          overrideAccess: false,
          pagination: false,
          sort: "sortOrder",
          where: { and: [{ id: { in: optionIDs } }, { active: { equals: true } }] },
        })
      : Promise.resolve({ docs: [] }),
    product.productType === 'variable'
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
    attributes: groups.docs as VariantType[],
    attributeOptions: options.docs as VariantOption[],
    variants: variants.docs as Variant[],
  };
}

async function mapProduct(product: PayloadProduct): Promise<Product> {
  return mapPayloadProduct(product, await loadRelations(product));
}

async function findAllCatalogProducts(): Promise<Product[]> {
  const payload = await getCatalogPayload();
  const result = await payload.find({
    collection: "products",
    depth: 2,
    limit: 100,
    overrideAccess: false,
    pagination: false,
    sort: "-createdAt",
  });
  return Promise.all(result.docs.map(mapProduct));
}

const getCachedCatalogProducts = unstable_cache(
  findAllCatalogProducts,
  ["nilper-payload-catalog-products"],
  { revalidate: CATALOG_REVALIDATE_SECONDS, tags: ["payload-catalog"] },
);

export const getCatalogProducts = cache(() => getCachedCatalogProducts());

async function findProductBySlug(slug: string): Promise<Product | null> {
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
}

const getCachedProductBySlug = unstable_cache(
  findProductBySlug,
  ["nilper-payload-product-by-slug"],
  { revalidate: CATALOG_REVALIDATE_SECONDS, tags: ["payload-catalog"] },
);

export const getProductBySlug = cache((slug: string) => getCachedProductBySlug(slug));

const valueOptions = (values: readonly string[]) => [...new Set(values)]
  .filter(Boolean)
  .sort((left, right) => left.localeCompare(right, "fa"))
  .map((value) => ({ label: value, value }));

type CatalogCategorySource = {
  id: number;
  parentID?: number;
  description: string;
  image: string;
  payloadSlug: string;
  showOnStorefront: boolean;
  sortOrder: number;
  storefrontSlug: string;
  title: string;
};

async function findAllCatalogCategorySources(): Promise<CatalogCategorySource[]> {
  const payload = await getCatalogPayload();
  const result = await payload.find({
    collection: "categories",
    depth: 1,
    limit: 100,
    overrideAccess: false,
    pagination: false,
    sort: "sortOrder",
    where: { published: { equals: true } },
  });

  return (result.docs as Category[]).map((category) => {
    const taxonomy = storefrontTaxonomyForPayloadCategory(category.slug, category.title);
    return {
      id: category.id,
      parentID: typeof category.parent === 'number' ? category.parent : category.parent?.id,
      description: category.descriptionFa ?? "",
      image: payloadMediaURL(category.image) ?? "",
      payloadSlug: category.slug,
      showOnStorefront: category.showOnStorefront === true,
      sortOrder: category.sortOrder ?? 0,
      storefrontSlug: taxonomy.slug,
      title: category.title,
    };
  });
}

const getCachedCatalogCategorySources = unstable_cache(
  findAllCatalogCategorySources,
  ["nilper-payload-catalog-categories"],
  { revalidate: CATALOG_REVALIDATE_SECONDS, tags: ["payload-catalog"] },
);

const getCatalogCategorySources = cache(() => getCachedCatalogCategorySources());

const categoryClasses = [
  "md:col-span-4",
  "md:col-span-4",
  "md:col-span-4",
  "md:col-span-4",
  "md:col-span-4",
  "md:col-span-4",
];

const buildCatalogCategories = (
  products: readonly Product[],
  categorySources: readonly CatalogCategorySource[],
  selectedOnly: boolean,
): CatalogCategory[] => {
  const availableSources = selectedOnly
    ? categorySources.filter((category) => category.showOnStorefront)
    : categorySources;
  const storefrontSlugs = [...new Set([
    ...availableSources.map((category) => category.storefrontSlug),
    ...(selectedOnly ? [] : products.map((product) => product.category)),
  ])];
  const categoryDrafts = storefrontSlugs.map((slug) => {
    const categoryProducts = products.filter((product) => product.categorySlugs?.includes(slug) || product.category === slug);
    const matchingSources = availableSources
      .filter((category) => category.storefrontSlug === slug)
      .sort((left, right) => {
        const rightUsage = categoryProducts.filter((product) => product.payloadCategorySlug === right.payloadSlug).length;
        const leftUsage = categoryProducts.filter((product) => product.payloadCategorySlug === left.payloadSlug).length;
        return rightUsage - leftUsage || left.sortOrder - right.sortOrder;
      });
    const selected = matchingSources[0];
    const firstProduct = categoryProducts[0];
    return {
      slug,
      title: selected?.title ?? firstProduct?.categoryTitle ?? slug,
      description: selected?.description ?? "",
      count: `${new Intl.NumberFormat("fa-IR").format(categoryProducts.length)} محصول`,
      image: selected?.image || matchingSources.find((category) => category.image)?.image || firstProduct?.image || "",
      sortOrder: selected?.sortOrder ?? Number.MAX_SAFE_INTEGER,
    };
  });
  return categoryDrafts
    .sort((left, right) => left.sortOrder - right.sortOrder || left.title.localeCompare(right.title, "fa"))
    .map((category, index): CatalogCategory => ({
      slug: category.slug,
      title: category.title,
      description: category.description,
      count: category.count,
      image: category.image,
      className: categoryClasses[index % categoryClasses.length],
    }));
};

export const getCatalogFacets = cache(async (): Promise<CatalogFacets> => {
  const [products, categorySources] = await Promise.all([
    getCatalogProducts(),
    getCatalogCategorySources(),
  ]);
  const categories = buildCatalogCategories(products, categorySources, true);

  return {
    categories,
    brand: valueOptions(products.map((product) => product.brand)),
    room: valueOptions(products.flatMap((product) => product.room)),
    material: valueOptions(products.flatMap((product) => product.material)),
    color: valueOptions(products.flatMap((product) => product.colors)),
    availability: valueOptions(products.map((product) => product.availability)).map((option) => ({
      ...option,
      label: option.value === "in-stock" ? "آماده ارسال" : "ساخت سفارشی",
    })),
    hasPrices: products.some((product) => product.price !== null),
  };
});

export const getCatalogCategories = cache(async () => {
  const [products, categorySources] = await Promise.all([
    getCatalogProducts(),
    getCatalogCategorySources(),
  ]);
  return buildCatalogCategories(products, categorySources, false);
});

export const getCatalogCategory = cache(async (slug: string) =>
  (await getCatalogCategories()).find((category) => category.slug === slug),
);

const impossibleCondition = (): Where => ({ id: { equals: -1 } });

async function buildCatalogWhere(params: RawSearchParams, category?: string): Promise<Where> {
  const query = parseCatalogQuery(params, category);
  const conditions: Where[] = [];

  if (query.category.length) {
    const sources = await getCatalogCategorySources();
    const selected = new Set(query.category.flatMap(payloadCategorySlugsForStorefront));
    const included = new Set(sources.filter((source) => selected.has(source.payloadSlug)).map((source) => source.id));
    let changed = true;
    while (changed) {
      changed = false;
      for (const source of sources) if (source.parentID && included.has(source.parentID) && !included.has(source.id)) { included.add(source.id); changed = true; }
    }
    const payloadSlugs = [...new Set([...selected, ...sources.filter((source) => included.has(source.id)).map((source) => source.payloadSlug)])];
    conditions.push(payloadSlugs.length ? { "categories.slug": { in: payloadSlugs } } : impossibleCondition());
  }

  if (query.brand.length) conditions.push({ "brand.title": { in: query.brand } });

  if (query.room.length) {
    const payloadSlugs = payloadCategorySlugsForRooms(query.room);
    conditions.push(payloadSlugs.length ? { "categories.slug": { in: payloadSlugs } } : impossibleCondition());
  }

  if (query.material.length) {
    conditions.push({
      or: query.material.map((value) => ({ "technicalSpecs.valueFa": { equals: value } })),
    });
  }

  if (query.color.length) {
    const payload = await getCatalogPayload();
    const options = await payload.find({
      collection: "variantOptions",
      depth: 0,
      limit: 100,
      overrideAccess: false,
      pagination: false,
      where: { label: { in: query.color } },
    });
    const groupIDs = [...new Set(options.docs.map((option) =>
      option.id,
    ))];
    conditions.push(groupIDs.length ? { 'attributes.allowedOptions': { in: groupIDs } } : impossibleCondition());
  }

  if (query.availability.length) {
    const availability = query.availability.flatMap((value) =>
      value === "in-stock" ? ["in_stock"] : value === "made-to-order" ? ["orderable"] : [],
    );
    conditions.push(availability.length ? { availabilityMode: { in: availability } } : impossibleCondition());
  }

  if (query.minPrice || query.maxPrice) {
    const price: Record<string, number> = {};
    if (query.minPrice) price.greater_than_equal = query.minPrice;
    if (query.maxPrice) price.less_than_equal = query.maxPrice;
    conditions.push({ priceInTMNEnabled: { equals: true } }, { priceInTMN: price });
  }

  if (query.search) {
    const words = query.search.split(/\s+/).filter(Boolean);
    conditions.push(...words.map((word): Where => ({
      or: [
        { title: { contains: word } },
        { catalogCode: { contains: word } },
        { "categories.title": { contains: word } },
        { "technicalSpecs.valueFa": { contains: word } },
      ],
    })));
  }

  return conditions.length ? { and: conditions } : {};
}

const payloadSort = (sort?: string) => {
  if (sort === "price-asc") return "priceInTMN";
  if (sort === "price-desc") return "-priceInTMN";
  return "-createdAt";
};

export async function queryCatalogProducts(params: RawSearchParams, category?: string) {
  const payload = await getCatalogPayload();
  const query = parseCatalogQuery(params, category);
  const where = await buildCatalogWhere(params, category);
  let result = await payload.find({
    collection: "products",
    depth: 2,
    limit: PAGE_SIZE,
    overrideAccess: false,
    page: query.page,
    sort: payloadSort(query.sort),
    where,
  });

  if (result.totalPages > 0 && query.page > result.totalPages) {
    result = await payload.find({
      collection: "products",
      depth: 2,
      limit: PAGE_SIZE,
      overrideAccess: false,
      page: result.totalPages,
      sort: payloadSort(query.sort),
      where,
    });
  }

  return {
    products: await Promise.all(result.docs.map(mapProduct)),
    total: result.totalDocs,
    page: result.page ?? 1,
    pageCount: Math.max(1, result.totalPages),
    query,
  };
}

export async function getRelatedProducts(product: Product, limit = 3): Promise<Product[]> {
  if (!product.payloadProductId) return [];
  const payload = await getCatalogPayload();
  const explicitIDs = product.relatedPayloadProductIds ?? [];
  const relatedWhere: Where = explicitIDs.length
    ? { id: { in: explicitIDs } }
    : {
        and: [
          { id: { not_equals: product.payloadProductId } },
          { "categories.slug": { in: payloadCategorySlugsForStorefront(product.category) } },
        ],
      };
  const result = await payload.find({
    collection: "products",
    depth: 2,
    limit,
    overrideAccess: false,
    pagination: false,
    sort: "-createdAt",
    where: relatedWhere,
  });
  return Promise.all(result.docs.map(mapProduct));
}

export const getCatalogProductPaths = cache(async () =>
  (await getCatalogProducts()).map((product) => ({ category: product.category, product: product.slug })),
);
