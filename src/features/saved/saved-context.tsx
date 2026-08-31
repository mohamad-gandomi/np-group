"use client";

import Link from "next/link";
import { Bookmark } from "lucide-react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import type { Product } from "@/features/catalog/catalog-types";
import { cn } from "@/lib/utils";

type SavedContextValue = {
  items: Product[];
  count: number;
  isSaved: (productId: string) => boolean;
  toggle: (product: Product) => void;
  remove: (productId: string) => void;
};

const SavedContext = createContext<SavedContextValue | null>(null);
const numberFormatter = new Intl.NumberFormat("fa-IR");

export function SavedProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Product[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("npgroup-saved-v1");
      if (saved) {
        // Saved products are browser-owned state and load after hydration.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setItems(JSON.parse(saved) as Product[]);
      }
    } catch {
      window.localStorage.removeItem("npgroup-saved-v1");
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) window.localStorage.setItem("npgroup-saved-v1", JSON.stringify(items));
  }, [hydrated, items]);

  const value = useMemo<SavedContextValue>(() => ({
    items,
    count: items.length,
    isSaved: (productId) => items.some((item) => item.id === productId),
    toggle: (product) => setItems((current) => current.some((item) => item.id === product.id) ? current.filter((item) => item.id !== product.id) : [...current, product]),
    remove: (productId) => setItems((current) => current.filter((item) => item.id !== productId)),
  }), [items]);

  return <SavedContext.Provider value={value}>{children}</SavedContext.Provider>;
}

export function useSaved() {
  const context = useContext(SavedContext);
  if (!context) throw new Error("useSaved must be used inside SavedProvider");
  return context;
}

export function SavedButton({ href }: { href: string }) {
  const { count } = useSaved();
  return (
    <Button asChild variant="ghost" size="icon-lg" className="relative size-11 rounded-none" aria-label={`محصولات ذخیره‌شده، ${count} محصول`}>
      <Link href={href} prefetch={false}>
        <Bookmark className="size-[1.35rem]" />
        {count > 0 ? <span className="absolute end-0.5 top-0.5 grid min-w-4 place-items-center rounded-full bg-wine px-1 text-[0.58rem] leading-4 text-white">{numberFormatter.format(count)}</span> : null}
      </Link>
    </Button>
  );
}

export function ProductSaveButton({ product, className }: { product: Product; className?: string }) {
  const { isSaved, toggle } = useSaved();
  const saved = isSaved(product.id);
  return (
    <Button
      type="button"
      variant="outline"
      size="icon-lg"
      onClick={() => toggle(product)}
      aria-label={saved ? `حذف ${product.name} از ذخیره‌شده‌ها` : `ذخیره ${product.name}`}
      aria-pressed={saved}
      className={cn("rounded-none bg-white/92 shadow-sm backdrop-blur hover:border-wine hover:text-wine", className)}
    >
      <Bookmark className={cn("size-5", saved && "fill-current text-wine")} />
    </Button>
  );
}
