"use client";

import type { FormEvent } from "react";
import { useTransition } from "react";
import { Search, X } from "lucide-react";
import { useRouter } from "next/navigation";

export function SearchField({ path, value }: { path: string; value: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function updateSearch(nextValue: string) {
    const params = new URLSearchParams(window.location.search);
    const query = nextValue.trim();
    if (query) params.set("q", query);
    else params.delete("q");
    params.delete("page");
    startTransition(() => router.replace(params.size ? `${path}?${params}` : path, { scroll: false }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    updateSearch(new FormData(event.currentTarget).get("q")?.toString() ?? "");
  }

  return (
    <form onSubmit={handleSubmit} role="search" className="relative min-w-0 flex-1">
      <button type="submit" aria-label="اجرای جستجو" className="absolute end-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-wine"><Search className="size-4" /></button>
      <input key={value} name="q" type="search" defaultValue={value} placeholder="جستجو در محصولات..." aria-label="جستجو در محصولات" className="h-11 w-full rounded-full border border-black/15 bg-white pe-11 ps-10 text-sm font-sans outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-wine" />
      {value ? <button type="button" onClick={() => updateSearch("")} aria-label="پاک کردن جستجو" className="absolute start-2 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-wine"><X className="size-3.5" /></button> : null}
      <span className="sr-only" aria-live="polite">{isPending ? "در حال جستجو" : ""}</span>
    </form>
  );
}
