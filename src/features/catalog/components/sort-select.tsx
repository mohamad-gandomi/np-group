import Link from "next/link";
import { ArrowUpDown, Check, ChevronDown } from "lucide-react";

import { shopHref, type RawSearchParams } from "../catalog-query";

const sortOptions = [
  { value: "recommended", label: "پیشنهادی" },
  { value: "newest", label: "جدیدترین" },
  { value: "price-asc", label: "کمترین قیمت" },
  { value: "price-desc", label: "بیشترین قیمت" },
] as const;

export function SortSelect({ params, path, className = "" }: { params: RawSearchParams; path: string; className?: string }) {
  const rawSort = params.sort;
  const currentValue = (Array.isArray(rawSort) ? rawSort[0] : rawSort) ?? "recommended";
  const current = sortOptions.find((option) => option.value === currentValue) ?? sortOptions[0];

  return (
    <details className={`group relative ${className}`}>
      <summary aria-label="مرتب‌سازی محصولات" className="flex h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-full border border-black/15 bg-white px-4 text-sm font-sans [&::-webkit-details-marker]:hidden">
        <span className="flex min-w-0 items-center gap-2"><ArrowUpDown className="size-4 shrink-0 text-muted-foreground" /><span className="truncate">{current.label}</span></span>
        <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
      </summary>
      <div className="absolute end-0 top-[calc(100%+0.5rem)] z-50 min-w-52 overflow-hidden rounded-xl border border-black/10 bg-white p-1.5 font-sans shadow-[0_18px_50px_rgba(32,27,28,0.14)]">
        {sortOptions.map((option) => {
          const isCurrent = option.value === current.value;
          return <Link key={option.value} href={shopHref(path, params, { sort: option.value === "recommended" ? undefined : option.value, page: undefined })} replace scroll={false} aria-current={isCurrent ? "true" : undefined} className={`flex min-h-10 items-center justify-between rounded-lg px-3 text-sm font-sans transition-colors hover:bg-secondary ${isCurrent ? "text-wine" : "text-foreground"}`}><span>{option.label}</span>{isCurrent ? <Check className="size-4" /> : null}</Link>;
        })}
      </div>
    </details>
  );
}
