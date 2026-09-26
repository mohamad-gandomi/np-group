import "server-only";

import { unstable_cache } from "next/cache";
import { cache } from "react";
import { getPayload } from "payload";
import type { Where } from "payload";

import config from "../../../payload.config";
import type { Category, Product as PayloadProduct, VariantOption, VariantType } from "@/payload-types";
import { relationID } from "@/payload/catalog-domain";

import { PAGE_SIZE, parseCatalogQuery, type RawSearchParams } from "./catalog-query";
import { buildCatalogAttributeFacets } from "./catalog-facets";
import {
  payloadCategorySlugsForRooms,
  payloadCategorySlugsForStorefront,
  storefrontTaxonomyForPayloadCategory,
} from "./catalog-taxonomy";
import type { CatalogCategory, CatalogFacets, Product } from "./catalog-types";
import { payloadMediaURL } from "./payload-catalog-mapper";
import {
  catalogListingPopulate,
  catalogListingSelect,
  findAllCatalogProductListings,
  findCatalogProductPage,
  mapCatalogProductDetails,
  mapCatalogProductListings,
} from "./payload-catalog-queries";

const CATALOG_REVALIDATE_SECONDS = 300;
const getCatalogPayload = cache(() => getPayload({ config }));

async function findAllCatalogProducts(): Promise<Product[]> {
  const payload = await getCatalogPayload();
  return findAllCatalogProductListings(payload);
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
  if (!result.docs[0]) return null;
  return (await mapCatalogProductDetails(payload, [result.docs[0] as PayloadProduct]))[0] ?? null;
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

export const getCatalogFacets = cache(async (category?: string): Promise<CatalogFacets> => {
  const [products, categorySources] = await Promise.all([
    getCatalogProducts(),
    getCatalogCategorySources(),
  ]);
  const categories = buildCatalogCategories(products, categorySources, true);
  const relevantProducts = category
    ? products.filter((product) => product.category === category || product.categorySlugs?.includes(category))
    : products;

  return {
    categories,
    brand: valueOptions(relevantProducts.map((product) => product.brand)),
    room: valueOptions(relevantProducts.flatMap((product) => product.room)),
    availability: valueOptions(relevantProducts.map((product) => product.availability)).map((option) => ({
      ...option,
      label: option.value === "in-stock" ? "آماده ارسال" : "ساخت سفارشی",
    })),
    attributes: buildCatalogAttributeFacets(relevantProducts, category),
    hasPrices: relevantProducts.some((product) => product.price !== null),
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

  const requestedAttributeFilters = Object.entries(query.attributeFilters);
  if (requestedAttributeFilters.length || query.color.length) {
    const payload = await getCatalogPayload();
    const requestedKeys = requestedAttributeFilters.map(([key]) => key);
    const groupsResult = await payload.find({
      collection: "variantTypes",
      depth: 1,
      overrideAccess: false,
      pagination: false,
      populate: { categories: { slug: true, title: true } },
      where: {
        and: [
          { active: { equals: true } },
          { catalogFilterEnabled: { equals: true } },
          ...(query.color.length ? [] : [{ name: { in: requestedKeys } }]),
        ],
      },
    });
    const visibilityCategory = category ?? (query.category.length === 1 ? query.category[0] : undefined);
    const groups = (groupsResult.docs as VariantType[]).filter((group) => {
      if (group.catalogFilterScope !== "categories") return true;
      if (!visibilityCategory) return false;
      return (group.catalogFilterCategories ?? []).some((value) => {
        if (typeof value === "number") return false;
        return storefrontTaxonomyForPayloadCategory(value.slug, value.title).slug === visibilityCategory;
      });
    });
    const groupIDs = groups.map((group) => group.id);
    const optionsResult = groupIDs.length ? await payload.find({
      collection: "variantOptions",
      depth: 0,
      overrideAccess: false,
      pagination: false,
      where: { and: [{ active: { equals: true } }, { variantType: { in: groupIDs } }] },
    }) : { docs: [] };
    const options = optionsResult.docs as VariantOption[];

    for (const [key, values] of requestedAttributeFilters) {
      const group = groups.find((candidate) => candidate.name === key);
      if (!group) continue;
      const optionIDs = options
        .filter((option) => relationID(option.variantType) === group.id && values.includes(option.value))
        .map((option) => option.id);
      conditions.push(optionIDs.length ? { "attributes.allowedOptions": { in: optionIDs } } : impossibleCondition());
    }

    if (query.color.length) {
      const swatchGroupIDs = new Set(groups
        .filter((group) => group.catalogFilterPresentation === "swatch")
        .map((group) => group.id));
      const optionIDs = options
        .filter((option) => swatchGroupIDs.has(relationID(option.variantType) ?? -1) && query.color.includes(option.label))
        .map((option) => option.id);
      conditions.push(optionIDs.length ? { "attributes.allowedOptions": { in: optionIDs } } : impossibleCondition());
    }
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
  const result = await findCatalogProductPage(payload, {
    limit: PAGE_SIZE,
    page: query.page,
    sort: payloadSort(query.sort),
    where,
  });

  return {
    ...result,
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
    depth: 1,
    limit,
    overrideAccess: false,
    pagination: false,
    populate: catalogListingPopulate,
    select: catalogListingSelect,
    sort: "-createdAt",
    where: relatedWhere,
  });
  return mapCatalogProductListings(payload, result.docs as PayloadProduct[]);
}

export const getCatalogProductPaths = cache(async () =>
  (await getCatalogProducts()).map((product) => ({ category: product.category, product: product.slug })),
);
