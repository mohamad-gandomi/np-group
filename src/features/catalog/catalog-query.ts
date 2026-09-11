export type RawSearchParams = Record<string, string | string[] | undefined>;
export const PAGE_SIZE = 6;

const list = (value: string | string[] | undefined) => value ? (Array.isArray(value) ? value : [value]) : [];
const number = (value: string | string[] | undefined) => Number(Array.isArray(value) ? value[0] : value) || undefined;

export function parseCatalogQuery(params: RawSearchParams, category?: string) {
  return {
    search: (Array.isArray(params.q) ? params.q[0] : params.q)?.trim(),
    category: category ? [category] : list(params.category),
    brand: list(params.brand), room: list(params.room), material: list(params.material), color: list(params.color),
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
