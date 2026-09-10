import { products } from "./catalog-data";
import type { Product } from "./catalog-types";
import { matchesProductSearch } from "./catalog-search";

export type RawSearchParams = Record<string, string | string[] | undefined>;
export const PAGE_SIZE = 6;

const list = (value: string | string[] | undefined) => value ? (Array.isArray(value) ? value : [value]) : [];
const number = (value: string | string[] | undefined) => Number(Array.isArray(value) ? value[0] : value) || undefined;

export function getCatalogResults(params: RawSearchParams, category?: string, catalogProducts: readonly Product[] = products) {
  const query = {
    search: (Array.isArray(params.q) ? params.q[0] : params.q)?.trim().toLocaleLowerCase("fa"),
    category: category ? [category] : list(params.category),
    brand: list(params.brand), room: list(params.room), material: list(params.material), color: list(params.color),
    availability: list(params.availability), minPrice: number(params.minPrice), maxPrice: number(params.maxPrice),
    sort: Array.isArray(params.sort) ? params.sort[0] : params.sort,
    page: Math.max(1, number(params.page) ?? 1),
  };

  const filtered = catalogProducts.filter((product) =>
    (!query.search || matchesProductSearch(product, query.search)) &&
    (!query.category.length || query.category.includes(product.category)) &&
    (!query.brand.length || query.brand.includes(product.brand)) &&
    (!query.room.length || query.room.some((value) => product.room.includes(value))) &&
    (!query.material.length || query.material.some((value) => product.material.includes(value))) &&
    (!query.color.length || query.color.some((value) => product.colors.includes(value))) &&
    (!query.availability.length || query.availability.includes(product.availability)) &&
    (!query.minPrice || (product.price !== null && product.price >= query.minPrice)) &&
    (!query.maxPrice || (product.price !== null && product.price <= query.maxPrice))
  );

  const sorted = [...filtered].sort((a, b) => sortProducts(a, b, query.sort));
  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const page = Math.min(query.page, pageCount);
  return { products: sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), total: sorted.length, page, pageCount, query };
}

function sortProducts(a: Product, b: Product, sort?: string) {
  if (sort === "price-asc") return (a.price ?? Number.POSITIVE_INFINITY) - (b.price ?? Number.POSITIVE_INFINITY);
  if (sort === "price-desc") return (b.price ?? Number.NEGATIVE_INFINITY) - (a.price ?? Number.NEGATIVE_INFINITY);
  if (sort === "newest") return b.createdAt.localeCompare(a.createdAt);
  return Number(b.isNew) - Number(a.isNew) || b.createdAt.localeCompare(a.createdAt);
}

export function shopHref(path: string, params: RawSearchParams, changes: Record<string, string | string[] | undefined>) {
  const search = new URLSearchParams();
  Object.entries({ ...params, ...changes }).forEach(([key, value]) => {
    if (!value) return;
    (Array.isArray(value) ? value : [value]).forEach((item) => search.append(key, item));
  });
  const query = search.toString();
  return query ? `${path}?${query}` : path;
}
