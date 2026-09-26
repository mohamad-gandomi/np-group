export type RawSearchParams = Record<string, string | string[] | undefined>;
export const PAGE_SIZE = 6;
export const CATALOG_FACET_PREFIX = "f_";

const list = (value: string | string[] | undefined) => value ? (Array.isArray(value) ? value : [value]) : [];
const number = (value: string | string[] | undefined) => Number(Array.isArray(value) ? value[0] : value) || undefined;
const validFacetKey = /^[a-z0-9][a-z0-9-]{0,63}$/;

export function catalogAttributeFilters(params: RawSearchParams) {
  return Object.fromEntries(Object.entries(params).flatMap(([key, value]) => {
    if (!key.startsWith(CATALOG_FACET_PREFIX)) return [];
    const facetKey = key.slice(CATALOG_FACET_PREFIX.length);
    if (!validFacetKey.test(facetKey)) return [];
    const values = [...new Set(list(value).filter(Boolean))];
    return values.length ? [[facetKey, values] as const] : [];
  }));
}

export function parseCatalogQuery(params: RawSearchParams, category?: string) {
  return {
    search: (Array.isArray(params.q) ? params.q[0] : params.q)?.trim(),
    category: category ? [category] : list(params.category),
    brand: list(params.brand), room: list(params.room), color: list(params.color),
    attributeFilters: catalogAttributeFilters(params),
    availability: list(params.availability), minPrice: number(params.minPrice), maxPrice: number(params.maxPrice),
    sort: Array.isArray(params.sort) ? params.sort[0] : params.sort,
    page: Math.max(1, number(params.page) ?? 1),
  };
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
