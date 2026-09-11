"use client";

import type { ChangeEvent, KeyboardEvent } from "react";
import { useTransition } from "react";
import type { LucideIcon } from "lucide-react";
import { Armchair, BadgeDollarSign, Check, ChevronDown, Layers3, LayoutGrid, PackageCheck, Palette, Tags } from "lucide-react";
import { useRouter } from "next/navigation";

import type { RawSearchParams } from "../catalog-query";
import type { CatalogFacets } from "../catalog-types";

type Props = { facets: CatalogFacets; params: RawSearchParams; path: string; showCategories?: boolean };
type FilterGroupProps = {
  label: string;
  icon: LucideIcon;
  name: string;
  options: readonly { label: string; value: string }[];
  params: RawSearchParams;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
};

const optionLabels: Record<string, string> = {
  "in-stock": "آماده ارسال",
  "made-to-order": "ساخت سفارشی",
};

function selected(params: RawSearchParams, key: string) {
  const value = params[key];
  return value ? (Array.isArray(value) ? value : [value]) : [];
}

function FilterGroup({ label, icon: Icon, name, options, params, onChange }: FilterGroupProps) {
  const current = selected(params, name);

  return (
    <details className="group border-b border-black/10" open>
      <summary className="flex cursor-pointer list-none items-center justify-between py-5 text-sm font-medium [&::-webkit-details-marker]:hidden">
        <span className="flex items-center gap-2">
          <span className={`grid size-7 place-items-center rounded-full ${current.length ? "bg-wine/10 text-wine" : "bg-secondary text-muted-foreground"}`}><Icon className="size-3.5" strokeWidth={1.8} /></span>
          <span>{label}</span>
          {current.length ? <span className="grid size-5 place-items-center rounded-full bg-ink text-[0.65rem] text-white">{new Intl.NumberFormat("fa-IR").format(current.length)}</span> : null}
        </span>
        <ChevronDown className="size-4 text-muted-foreground transition-transform duration-300 group-open:rotate-180" />
      </summary>
      <div className="space-y-1 pb-5">
        {options.map((option) => {
          const isChecked = current.includes(option.value);
          return (
            <label key={option.value} className="group/option flex min-h-10 cursor-pointer items-center justify-between rounded-sm px-2 text-sm text-muted-foreground transition-colors hover:bg-secondary/70 hover:text-foreground">
              <span>{option.label}</span>
              <span className={`grid size-5 place-items-center border transition-colors ${isChecked ? "border-wine bg-wine text-white" : "border-black/20 bg-white text-transparent group-hover/option:border-black/40"}`}>
                <Check className="size-3.5" strokeWidth={2.5} />
              </span>
              <input className="sr-only" type="checkbox" name={name} value={option.value} checked={isChecked} onChange={onChange} />
            </label>
          );
        })}
      </div>
    </details>
  );
}

export function CatalogFilters({ facets, params, path, showCategories = true }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function navigate(search: URLSearchParams) {
    search.delete("page");
    const query = search.toString();
    startTransition(() => router.replace(query ? `${path}?${query}` : path, { scroll: false }));
  }

  function updateChoice(event: ChangeEvent<HTMLInputElement>) {
    const { checked, name, value } = event.currentTarget;
    const search = new URLSearchParams(window.location.search);
    const values = search.getAll(name).filter((item) => item !== value);
    if (checked) values.push(value);
    search.delete(name);
    values.forEach((item) => search.append(name, item));
    navigate(search);
  }

  function updatePrice(name: "minPrice" | "maxPrice", value: string) {
    const search = new URLSearchParams(window.location.search);
    const normalized = value.replace(/[^0-9]/g, "");
    if (normalized) search.set(name, normalized);
    else search.delete(name);
    navigate(search);
  }

  function handlePriceKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") return;
    event.preventDefault();
    event.currentTarget.blur();
  }

  const groups = [
    ...(showCategories ? [{ label: "دسته‌بندی", icon: LayoutGrid, name: "category", options: facets.categories.map(({ slug, title }) => ({ label: title, value: slug })) }] : []),
    { label: "برند", icon: Tags, name: "brand", options: facets.brand },
    { label: "فضا", icon: Armchair, name: "room", options: facets.room },
    { label: "متریال", icon: Layers3, name: "material", options: facets.material },
    { label: "رنگ", icon: Palette, name: "color", options: facets.color },
    { label: "وضعیت موجودی", icon: PackageCheck, name: "availability", options: facets.availability.map((option) => ({ ...option, label: optionLabels[option.value] ?? option.label })) },
  ].filter((group) => group.name === "category" ? group.options.length > 0 : group.options.length > 1);

  return (
    <div className={`h-full transition-opacity ${isPending ? "pointer-events-none opacity-60" : "opacity-100"}`} aria-busy={isPending}>
      <div className="flex items-center justify-between border-b border-black/10 pb-4 lg:pt-1">
        <p className="text-xs text-muted-foreground">انتخاب شما خودکار اعمال می‌شود</p>
        <span className="sr-only" aria-live="polite">{isPending ? "در حال بروزرسانی محصولات" : ""}</span>
      </div>
      {groups.map((group) => <FilterGroup key={group.name} {...group} params={params} onChange={updateChoice} />)}
      {facets.hasPrices ? <details className="group" open>
        <summary className="flex cursor-pointer list-none items-center justify-between py-5 text-sm font-medium [&::-webkit-details-marker]:hidden">
          <span className="flex items-center gap-2"><span className={`grid size-7 place-items-center rounded-full ${selected(params, "minPrice").length || selected(params, "maxPrice").length ? "bg-wine/10 text-wine" : "bg-secondary text-muted-foreground"}`}><BadgeDollarSign className="size-3.5" strokeWidth={1.8} /></span><span>بازه قیمت</span></span>
          <ChevronDown className="size-4 text-muted-foreground transition-transform duration-300 group-open:rotate-180" />
        </summary>
        <div className="grid grid-cols-2 gap-2 pb-3">
          <input key={`min-${selected(params, "minPrice")[0] ?? ""}`} inputMode="numeric" defaultValue={selected(params, "minPrice")[0]} placeholder="از قیمت" aria-label="حداقل قیمت" onBlur={(event) => updatePrice("minPrice", event.currentTarget.value)} onKeyDown={handlePriceKeyDown} className="h-11 min-w-0 border border-black/15 bg-white px-3 text-xs outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-wine" />
          <input key={`max-${selected(params, "maxPrice")[0] ?? ""}`} inputMode="numeric" defaultValue={selected(params, "maxPrice")[0]} placeholder="تا قیمت" aria-label="حداکثر قیمت" onBlur={(event) => updatePrice("maxPrice", event.currentTarget.value)} onKeyDown={handlePriceKeyDown} className="h-11 min-w-0 border border-black/15 bg-white px-3 text-xs outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-wine" />
        </div>
      </details> : null}
    </div>
  );
}
