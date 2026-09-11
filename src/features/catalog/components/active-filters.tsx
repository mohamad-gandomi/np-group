import Link from "next/link";
import { RotateCcw, X } from "lucide-react";

import { shopHref, type RawSearchParams } from "../catalog-query";
import type { CatalogFacets } from "../catalog-types";

const filterKeys = ["category", "brand", "room", "material", "color", "availability"] as const;
type Chip = { key: string; value: string; label: string; remaining?: string[] };

export function ActiveFilters({ facets, params, path }: { facets: CatalogFacets; params: RawSearchParams; path: string }) {
  const labels: Record<string, string> = {
    ...Object.fromEntries(facets.categories.map((category) => [category.slug, category.title])),
    ...Object.fromEntries([facets.brand, facets.room, facets.material, facets.color, facets.availability].flat().map((option) => [option.value, option.label])),
  };
  const chips: Chip[] = filterKeys.flatMap((key) => {
    const raw = params[key];
    const values = raw ? (Array.isArray(raw) ? raw : [raw]) : [];
    return values.map((value) => ({ key, value, label: labels[value] ?? value, remaining: values.filter((item) => item !== value) }));
  });
  if (params.minPrice) chips.push({ key: "minPrice", value: String(params.minPrice), label: `از ${params.minPrice}` });
  if (params.maxPrice) chips.push({ key: "maxPrice", value: String(params.maxPrice), label: `تا ${params.maxPrice}` });
  if (!chips.length) return null;

  return <div className="mb-6 flex flex-wrap items-center gap-2" aria-label="فیلترهای فعال">{chips.map(({ key, value, label, remaining }) => <Link key={`${key}-${value}`} href={shopHref(path, params, { [key]: remaining, page: undefined })} aria-label={`حذف فیلتر ${label}`} className="inline-flex min-h-9 items-center gap-2 rounded-full border border-black/10 bg-white px-3 text-xs transition-colors hover:border-wine hover:text-wine"><span>{label}</span><X className="size-3" /></Link>)}<Link href={path} aria-label="حذف همه فیلترها" title="حذف همه فیلترها" className="grid size-9 place-items-center rounded-full border border-wine/20 bg-wine/5 text-wine transition-colors hover:bg-wine hover:text-white"><RotateCcw className="size-3.5" /></Link></div>;
}
