import Link from "next/link";
import { RotateCcw, X } from "lucide-react";

import { CATALOG_FACET_PREFIX, shopHref, type RawSearchParams } from "../catalog-query";
import type { CatalogFacets } from "../catalog-types";

const filterKeys = ["category", "brand", "room", "color", "availability"] as const;
type Chip = { key: string; value: string; label: string; remaining?: string[] };

export function ActiveFilters({ facets, params, path }: { facets: CatalogFacets; params: RawSearchParams; path: string }) {
  const labelsByKey: Record<string, Record<string, string>> = {
    category: Object.fromEntries(facets.categories.map((category) => [category.slug, category.title])),
    brand: Object.fromEntries(facets.brand.map((option) => [option.value, option.label])),
    room: Object.fromEntries(facets.room.map((option) => [option.value, option.label])),
    availability: Object.fromEntries(facets.availability.map((option) => [option.value, option.label])),
    color: Object.fromEntries(facets.attributes
      .filter((facet) => facet.presentation === "swatch")
      .flatMap((facet) => facet.options.map((option) => [option.label, option.label]))),
  };
  const chips: Chip[] = filterKeys.flatMap((key) => {
    const raw = params[key];
    const values = raw ? (Array.isArray(raw) ? raw : [raw]) : [];
    return values.map((value) => ({ key, value, label: labelsByKey[key]?.[value] ?? value, remaining: values.filter((item) => item !== value) }));
  });
  for (const facet of facets.attributes) {
    const key = `${CATALOG_FACET_PREFIX}${facet.key}`;
    const raw = params[key];
    const values = raw ? (Array.isArray(raw) ? raw : [raw]) : [];
    const labels = Object.fromEntries(facet.options.map((option) => [option.value, option.label]));
    chips.push(...values.map((value) => ({ key, value, label: labels[value] ?? value, remaining: values.filter((item) => item !== value) })));
  }
  if (params.minPrice) chips.push({ key: "minPrice", value: String(params.minPrice), label: `از ${params.minPrice}` });
  if (params.maxPrice) chips.push({ key: "maxPrice", value: String(params.maxPrice), label: `تا ${params.maxPrice}` });
  if (!chips.length) return null;

  return <div className="mb-6 flex flex-wrap items-center gap-2" aria-label="فیلترهای فعال">{chips.map(({ key, value, label, remaining }) => <Link key={`${key}-${value}`} href={shopHref(path, params, { [key]: remaining, page: undefined })} aria-label={`حذف فیلتر ${label}`} className="inline-flex min-h-9 items-center gap-2 rounded-full border border-black/10 bg-white px-3 text-xs transition-colors hover:border-wine hover:text-wine"><span>{label}</span><X className="size-3" /></Link>)}<Link href={path} aria-label="حذف همه فیلترها" title="حذف همه فیلترها" className="grid size-9 place-items-center rounded-full border border-wine/20 bg-wine/5 text-wine transition-colors hover:bg-wine hover:text-white"><RotateCcw className="size-3.5" /></Link></div>;
}
