"use client";

import type { ChangeEvent, KeyboardEvent } from "react";
import { useState, useTransition } from "react";
import type { LucideIcon } from "lucide-react";
import { Armchair, BadgeDollarSign, Check, ChevronDown, LayoutGrid, ListFilter, PackageCheck, Palette, Search, Tags } from "lucide-react";
import { useRouter } from "next/navigation";

import type { RawSearchParams } from "../catalog-query";
import { CATALOG_FACET_PREFIX } from "../catalog-query";
import type { CatalogFacets } from "../catalog-types";

type Props = { facets: CatalogFacets; params: RawSearchParams; path: string; showCategories?: boolean };
type FilterGroupProps = {
  defaultOpen?: boolean;
  label: string;
  icon: LucideIcon;
  name: string;
  options: readonly { label: string; value: string; count?: number; swatchColor?: string }[];
  params: RawSearchParams;
  presentation?: "checkbox" | "swatch";
  legacyName?: string;
  onChange: (event: ChangeEvent<HTMLInputElement>, current: readonly string[], legacyName?: string) => void;
};

type FilterGroupDefinition = Omit<FilterGroupProps, "params" | "onChange"> & { placement?: "primary" | "more" };

const optionLabels: Record<string, string> = {
  "in-stock": "آماده ارسال",
  "made-to-order": "ساخت سفارشی",
};
const numberFormatter = new Intl.NumberFormat("fa-IR");

function selected(params: RawSearchParams, key: string) {
  const value = params[key];
  return value ? (Array.isArray(value) ? value : [value]) : [];
}

function FilterGroup({ defaultOpen, label, icon: Icon, name, options, params, presentation = "checkbox", legacyName, onChange }: FilterGroupProps) {
  const [optionQuery, setOptionQuery] = useState("");
  const legacyValues = legacyName ? selected(params, legacyName) : [];
  const current = [...new Set([
    ...selected(params, name),
    ...options.filter((option) => legacyValues.includes(option.label)).map((option) => option.value),
  ])];
  const normalizedQuery = optionQuery.trim().toLocaleLowerCase("fa");
  const visibleOptions = normalizedQuery
    ? options.filter((option) => option.label.toLocaleLowerCase("fa").includes(normalizedQuery))
    : options;
  const [isOpen, setIsOpen] = useState(() => current.length > 0 || defaultOpen === true);

  return (
    <details className="group border-b border-black/10" open={isOpen} onToggle={(event) => setIsOpen(event.currentTarget.open)}>
      <summary className="flex cursor-pointer list-none items-center justify-between py-5 text-sm font-medium [&::-webkit-details-marker]:hidden">
        <span className="flex items-center gap-2">
          <span className={`grid size-7 place-items-center rounded-full ${current.length ? "bg-wine/10 text-wine" : "bg-secondary text-muted-foreground"}`}><Icon className="size-3.5" strokeWidth={1.8} /></span>
          <span>{label}</span>
          {current.length ? <span className="grid size-5 place-items-center rounded-full bg-ink text-[0.65rem] text-white">{numberFormatter.format(current.length)}</span> : null}
        </span>
        <ChevronDown className="size-4 text-muted-foreground transition-transform duration-300 group-open:rotate-180" />
      </summary>
      <div className="space-y-1 pb-5">
        {options.length > 8 ? <label className="mb-3 flex h-10 items-center gap-2 border border-black/10 bg-white px-3 text-muted-foreground focus-within:border-wine">
          <Search className="size-3.5 shrink-0" aria-hidden="true" />
          <span className="sr-only">جست‌وجو در {label}</span>
          <input value={optionQuery} onChange={(event) => setOptionQuery(event.currentTarget.value)} placeholder="جست‌وجوی گزینه" className="min-w-0 flex-1 bg-transparent text-xs text-foreground outline-none placeholder:text-muted-foreground/70" />
        </label> : null}
        {visibleOptions.map((option) => {
          const isChecked = current.includes(option.value);
          return (
            <label key={option.value} className="group/option flex min-h-10 cursor-pointer items-center justify-between rounded-sm px-2 text-sm text-muted-foreground transition-colors hover:bg-secondary/70 hover:text-foreground">
              <span className="flex min-w-0 items-center gap-2">
                {presentation === "swatch" ? <span className="size-4 shrink-0 rounded-full border border-black/15 ring-1 ring-white" style={{ backgroundColor: option.swatchColor ?? "#d8d2ca" }} aria-hidden="true" /> : null}
                <span className="truncate">{option.label}</span>
                {typeof option.count === "number" ? <span className="text-[0.65rem] text-muted-foreground/70">{numberFormatter.format(option.count)}</span> : null}
              </span>
              <span className={`grid size-5 place-items-center border transition-colors ${isChecked ? "border-wine bg-wine text-white" : "border-black/20 bg-white text-transparent group-hover/option:border-black/40"}`}>
                <Check className="size-3.5" strokeWidth={2.5} />
              </span>
              <input className="sr-only" type="checkbox" name={name} value={option.value} checked={isChecked} onChange={(event) => onChange(event, current, legacyName)} />
            </label>
          );
        })}
        {!visibleOptions.length ? <p className="px-2 py-3 text-xs text-muted-foreground">گزینه‌ای پیدا نشد.</p> : null}
      </div>
    </details>
  );
}

function MoreFilterGroups({ groups, params, onChange }: { groups: readonly FilterGroupDefinition[]; params: RawSearchParams; onChange: FilterGroupProps["onChange"] }) {
  const hasSelection = groups.some((group) => selected(params, group.name).length > 0 || Boolean(group.legacyName && selected(params, group.legacyName).length));
  const [isOpen, setIsOpen] = useState(hasSelection);

  return <details className="group/more border-b border-black/10" open={isOpen} onToggle={(event) => setIsOpen(event.currentTarget.open)}>
    <summary className="flex cursor-pointer list-none items-center justify-between py-5 text-sm font-medium [&::-webkit-details-marker]:hidden">
      <span className="flex items-center gap-2"><span className="grid size-7 place-items-center rounded-full bg-secondary text-muted-foreground"><ListFilter className="size-3.5" strokeWidth={1.8} /></span><span>فیلترهای بیشتر</span></span>
      <ChevronDown className="size-4 text-muted-foreground transition-transform duration-300 group-open/more:rotate-180" />
    </summary>
    <div className="border-t border-black/5 ps-2">{groups.map((group) => <FilterGroup key={group.name} {...group} params={params} onChange={onChange} />)}</div>
  </details>;
}

export function CatalogFilters({ facets, params, path, showCategories = true }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function navigate(search: URLSearchParams) {
    search.delete("page");
    const query = search.toString();
    startTransition(() => router.replace(query ? `${path}?${query}` : path, { scroll: false }));
  }

  function updateChoice(event: ChangeEvent<HTMLInputElement>, current: readonly string[], legacyName?: string) {
    const { checked, name, value } = event.currentTarget;
    const search = new URLSearchParams(window.location.search);
    const values = current.filter((item) => item !== value);
    if (checked) values.push(value);
    search.delete(name);
    if (legacyName) search.delete(legacyName);
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

  const groups = ([
    ...(showCategories ? [{ defaultOpen: true, label: "دسته‌بندی", icon: LayoutGrid, name: "category", options: facets.categories.map(({ slug, title }) => ({ label: title, value: slug })) }] : []),
    { defaultOpen: true, label: "برند", icon: Tags, name: "brand", options: facets.brand },
    { defaultOpen: true, label: "فضا", icon: Armchair, name: "room", options: facets.room },
    { defaultOpen: true, label: "وضعیت موجودی", icon: PackageCheck, name: "availability", options: facets.availability.map((option) => ({ ...option, label: optionLabels[option.value] ?? option.label })) },
    ...facets.attributes.map((facet) => ({
      defaultOpen: facet.placement === "primary",
      label: facet.label,
      icon: facet.presentation === "swatch" ? Palette : ListFilter,
      name: `${CATALOG_FACET_PREFIX}${facet.key}`,
      options: facet.options,
      presentation: facet.presentation,
      placement: facet.placement,
      ...(facet.presentation === "swatch" ? { legacyName: "color" } : {}),
    })),
  ] as FilterGroupDefinition[]).filter((group) => {
    const hasSelection = selected(params, group.name).length > 0 || Boolean(group.legacyName && selected(params, group.legacyName).length);
    return group.name === "category" ? group.options.length > 0 : group.options.length > 1 || hasSelection;
  });
  const primaryGroups = groups.filter((group) => group.placement !== "more");
  const moreGroups = groups.filter((group) => group.placement === "more");

  return (
    <div className={`h-full transition-opacity ${isPending ? "pointer-events-none opacity-60" : "opacity-100"}`} aria-busy={isPending}>
      <div className="flex items-center justify-between border-b border-black/10 pb-4 lg:pt-1">
        <p className="text-xs text-muted-foreground">انتخاب شما خودکار اعمال می‌شود</p>
        <span className="sr-only" aria-live="polite">{isPending ? "در حال بروزرسانی محصولات" : ""}</span>
      </div>
      {primaryGroups.map((group) => <FilterGroup key={group.name} {...group} params={params} onChange={updateChoice} />)}
      {moreGroups.length ? <MoreFilterGroups groups={moreGroups} params={params} onChange={updateChoice} /> : null}
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
