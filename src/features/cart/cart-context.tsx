"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import type { Product } from "@/features/catalog/catalog-types";
import type {
  CartItem,
  CartLineReference,
  CartProduct,
  CartResponse,
  CartSelection,
} from "@/features/cart/cart-types";

export type { CartConfigurationSelection, CartItem, CartSelection } from "@/features/cart/cart-types";

type CartContextValue = {
  items: CartItem[];
  count: number;
  subtotal: number;
  persistenceError: string;
  addItem: (product: Product, selection: string | CartSelection, quantity?: number) => void;
  updateQuantity: (key: string, quantity: number) => void;
  removeItem: (key: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const priceFormatter = new Intl.NumberFormat("fa-IR");
const CART_STORAGE_KEY = "npgroup-cart-v2";
const LEGACY_CART_STORAGE_KEY = "npgroup-cart-v1";
const MAX_ITEM_QUANTITY = 20;

type CartMode = "authenticated" | "guest" | "loading";

const cartProduct = (product: Product): CartProduct => ({
  id: product.id,
  slug: product.slug,
  name: product.name,
  brand: product.brand,
  category: product.category,
  price: product.price,
  image: product.image,
  availability: product.availability,
  ...(product.source ? { source: product.source } : {}),
  ...(product.payloadProductId ? { payloadProductId: product.payloadProductId } : {}),
});

const itemReference = (item: CartItem): CartLineReference | null => {
  if (!item.product.payloadProductId) return null;
  return {
    productId: item.product.payloadProductId,
    ...(item.variantId ? { variantId: item.variantId } : {}),
    quantity: item.quantity,
    configuration: (item.configuration ?? []).map(({ groupKey, optionId }) => ({ groupKey, optionId })),
  };
};

const itemIdentity = (productId: number, selection: CartSelection) => {
  const configuration = [...(selection.configuration ?? [])]
    .sort((left, right) => left.groupKey.localeCompare(right.groupKey, "en"))
    .map(({ groupKey, optionId }) => [groupKey, optionId]);
  return JSON.stringify([productId, selection.variantId ?? null, configuration]);
};

const storedReferences = (): CartLineReference[] => {
  try {
    const current = window.localStorage.getItem(CART_STORAGE_KEY);
    if (current) {
      const parsed = JSON.parse(current) as { items?: CartLineReference[] };
      return Array.isArray(parsed.items) ? parsed.items : [];
    }

    const legacy = window.localStorage.getItem(LEGACY_CART_STORAGE_KEY);
    if (!legacy) return [];
    const parsed = JSON.parse(legacy) as CartItem[];
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((item) => {
      const reference = itemReference(item);
      return reference ? [reference] : [];
    });
  } catch {
    return [];
  }
};

const saveGuestReferences = (items: CartItem[]) => {
  const references = items.flatMap((item) => {
    const reference = itemReference(item);
    return reference ? [reference] : [];
  });
  try {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify({ version: 2, items: references }));
    window.localStorage.removeItem(LEGACY_CART_STORAGE_KEY);
  } catch {
    // The in-memory cart remains usable when browser storage is unavailable.
  }
};

const clearGuestReferences = () => {
  try {
    window.localStorage.removeItem(CART_STORAGE_KEY);
    window.localStorage.removeItem(LEGACY_CART_STORAGE_KEY);
  } catch {
    // The authenticated Payload cart is already canonical.
  }
};

async function cartRequest(method: "GET" | "POST" | "PUT", items?: CartLineReference[]) {
  const response = await fetch("/api/payload-cart", {
    method,
    ...(items ? {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    } : {}),
  });
  const result = await response.json() as CartResponse & { error?: string };
  return { response, result };
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [persistenceError, setPersistenceError] = useState("");
  const itemsRef = useRef<CartItem[]>([]);
  const modeRef = useRef<CartMode>("loading");
  const latestRevisionRef = useRef(0);
  const persistenceQueueRef = useRef<Promise<void>>(Promise.resolve());

  const applyItems = useCallback((nextItems: CartItem[]) => {
    itemsRef.current = nextItems;
    setItems(nextItems);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const initialize = async () => {
      const localReferences = storedReferences();
      try {
        const { response, result } = await cartRequest("GET");
        if (controller.signal.aborted) return;

        if (response.ok) {
          const merged = localReferences.length ? await cartRequest("POST", localReferences) : { response, result };
          if (!merged.response.ok) throw new Error(merged.result.error || "ادغام سبد خرید انجام نشد.");
          if (controller.signal.aborted) return;
          modeRef.current = "authenticated";
          applyItems(merged.result.items);
          clearGuestReferences();
          return;
        }

        if (response.status !== 401) throw new Error(result.error || "بازیابی سبد خرید انجام نشد.");
        modeRef.current = "guest";
        if (!localReferences.length) {
          applyItems([]);
          return;
        }

        const resolvedResponse = await fetch("/api/payload-cart/resolve", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: localReferences }),
          signal: controller.signal,
        });
        const resolved = await resolvedResponse.json() as CartResponse & { error?: string };
        if (!resolvedResponse.ok) throw new Error(resolved.error || "بازیابی سبد خرید انجام نشد.");
        applyItems(resolved.items);
        saveGuestReferences(resolved.items);
      } catch (error) {
        if (controller.signal.aborted) return;
        modeRef.current = "guest";
        setPersistenceError(error instanceof Error ? error.message : "بازیابی سبد خرید انجام نشد.");
      }
    };
    void initialize();
    return () => controller.abort();
  }, [applyItems]);

  const persist = useCallback((nextItems: CartItem[]) => {
    if (modeRef.current !== "authenticated") {
      saveGuestReferences(nextItems);
      return;
    }

    const references = nextItems.flatMap((item) => {
      const reference = itemReference(item);
      return reference ? [reference] : [];
    });
    const revision = ++latestRevisionRef.current;
    persistenceQueueRef.current = persistenceQueueRef.current
      .catch(() => undefined)
      .then(async () => {
        const { response, result } = await cartRequest("PUT", references);
        if (response.status === 401) {
          modeRef.current = "guest";
          saveGuestReferences(itemsRef.current);
          throw new Error("نشست شما پایان یافته است؛ سبد روی این دستگاه نگهداری شد.");
        }
        if (!response.ok) throw new Error(result.error || "ذخیره سبد خرید انجام نشد.");
        if (revision === latestRevisionRef.current) {
          applyItems(result.items);
          setPersistenceError("");
        }
      })
      .catch((error) => {
        if (revision === latestRevisionRef.current) {
          setPersistenceError(error instanceof Error ? error.message : "ذخیره سبد خرید انجام نشد.");
        }
      });
  }, [applyItems]);

  const commit = useCallback((update: (current: CartItem[]) => CartItem[]) => {
    const nextItems = update(itemsRef.current);
    applyItems(nextItems);
    setPersistenceError("");
    persist(nextItems);
  }, [applyItems, persist]);

  const value = useMemo<CartContextValue>(() => ({
    items,
    count: items.reduce((sum, item) => sum + item.quantity, 0),
    subtotal: items.reduce((sum, item) => sum + (item.product.price ?? 0) * item.quantity, 0),
    persistenceError,
    addItem(product, selection, quantity = 1) {
      const normalized = typeof selection === "string" ? { color: selection } : selection;
      if (!product.payloadProductId) {
        setPersistenceError("این محصول هنوز برای سبد خرید پایدار آماده نشده است.");
        return;
      }
      const key = itemIdentity(product.payloadProductId, normalized);
      commit((current) => {
        const existing = current.find((item) => item.key === key);
        if (existing) {
          return current.map((item) => item.key === key
            ? { ...item, quantity: Math.min(MAX_ITEM_QUANTITY, item.quantity + quantity) }
            : item);
        }
        return [...current, { key, product: cartProduct(product), ...normalized, quantity: Math.min(MAX_ITEM_QUANTITY, quantity) }];
      });
    },
    updateQuantity(key, quantity) {
      commit((current) => quantity <= 0
        ? current.filter((item) => item.key !== key)
        : current.map((item) => item.key === key ? { ...item, quantity: Math.min(MAX_ITEM_QUANTITY, quantity) } : item));
    },
    removeItem(key) { commit((current) => current.filter((item) => item.key !== key)); },
    clear() { commit(() => []); },
  }), [commit, items, persistenceError]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside CartProvider");
  return context;
}

export function CartButton() {
  const { items, count, persistenceError, subtotal } = useCart();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  // Route changes should always dismiss the cart sheet.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setOpen(false); }, [pathname]);
  return <Sheet open={open} onOpenChange={setOpen}>
    <SheetTrigger asChild><Button variant="ghost" size="icon-lg" className="relative size-11 rounded-none" aria-label={`سبد خرید، ${count} کالا`}><ShoppingBag className="size-[1.4rem]" />{count > 0 ? <span className="absolute end-0.5 top-0.5 grid min-w-4 place-items-center rounded-full bg-wine px-1 text-[0.58rem] leading-4 text-white">{priceFormatter.format(count)}</span> : null}</Button></SheetTrigger>
    <SheetContent side="left" className="data-[side=left]:w-[92%] bg-white sm:data-[side=left]:w-full sm:max-w-md" dir="rtl">
      <SheetHeader className="border-b px-5 py-6 text-start"><SheetTitle className="text-2xl">سبد خرید</SheetTitle><SheetDescription>{count ? `${priceFormatter.format(count)} کالا برای بررسی شما آماده است.` : "هنوز محصولی به سبد اضافه نکرده‌اید."}</SheetDescription>{persistenceError ? <p role="alert" className="text-xs leading-6 text-destructive">{persistenceError}</p> : null}</SheetHeader>
      <div className="flex-1 overflow-x-hidden overflow-y-auto px-4 py-4 sm:px-5 sm:py-5">{items.length ? <div>{items.map((item) => <CartLine key={item.key} item={item} compact />)}</div> : <div className="grid min-h-64 place-items-center text-center text-sm text-muted-foreground"><ShoppingBag className="mb-3 size-8 text-wine" /><p>سبد خرید شما خالی است.</p></div>}</div>
      {items.length ? <SheetFooter className="border-t bg-secondary/40 px-5 py-5"><div className="flex items-center justify-between text-sm"><span>جمع کالاها</span><strong className="text-lg text-wine">{priceFormatter.format(subtotal)} <span className="text-xs font-normal text-muted-foreground">تومان</span></strong></div><Button asChild className="mt-3 h-12 w-full rounded-none bg-wine hover:bg-ink"><Link href="/cart">مشاهده سبد خرید</Link></Button><Button asChild variant="outline" className="h-11 w-full rounded-none"><Link href="/checkout">ادامه و پرداخت</Link></Button></SheetFooter> : null}
    </SheetContent>
  </Sheet>;
}

export function CartLine({ item, compact = false }: { item: CartItem; compact?: boolean }) {
  const { updateQuantity, removeItem } = useCart();
  const price = item.product.price ?? 0;
  const choices = item.configuration?.map((selection) => `${selection.groupLabel}: ${selection.optionLabel}`).join(" · ");
  return <div className={`grid border-b border-black/10 ${compact ? "grid-cols-[4rem_minmax(0,1fr)] gap-x-3 gap-y-3 py-4" : "grid-cols-[5.5rem_minmax(0,1fr)] gap-4 py-5 sm:grid-cols-[7rem_minmax(0,1fr)] sm:items-center"}`}><div className="relative aspect-square overflow-hidden bg-secondary"><Image src={item.product.image} alt={item.product.name} fill sizes={compact ? "64px" : "112px"} className="object-cover" /></div><div className="min-w-0"><div className="flex items-start justify-between gap-2"><div className="min-w-0"><Link href={`/shop/${item.product.category}/${item.product.slug}`} className={`block truncate font-medium hover:text-wine ${compact ? "text-sm" : "text-base sm:text-lg"}`}>{item.product.name}</Link><p className="mt-1 truncate text-xs text-muted-foreground">{item.product.brand}{item.variantLabel ? ` · ${item.variantLabel}` : ` · رنگ ${item.color}`}</p>{choices ? <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">{choices}</p> : null}<p className="mt-1 text-xs text-muted-foreground">{item.product.availability === "in-stock" ? "آماده ارسال" : "ساخت سفارشی"}</p></div><Button type="button" variant="ghost" size="icon-xs" onClick={() => removeItem(item.key)} className="shrink-0 text-muted-foreground hover:text-wine" aria-label={`حذف ${item.product.name}`}>{compact ? <X /> : <Trash2 />}</Button></div>{compact ? null : <div className="mt-4 flex flex-wrap items-center justify-between gap-3"><QuantityControl value={item.quantity} onChange={(value) => updateQuantity(item.key, value)} /><strong className="whitespace-nowrap text-sm text-wine sm:text-base">{priceFormatter.format(price * item.quantity)} <span className="text-xs font-normal text-muted-foreground">تومان</span></strong></div>}</div>{compact ? <div className="col-span-2 flex items-center justify-between gap-3"><QuantityControl value={item.quantity} onChange={(value) => updateQuantity(item.key, value)} compact /><strong className="whitespace-nowrap text-sm text-wine">{priceFormatter.format(price * item.quantity)} <span className="text-[0.62rem] font-normal text-muted-foreground">تومان</span></strong></div> : null}</div>;
}

export function QuantityControl({ value, onChange, compact = false }: { value: number; onChange: (value: number) => void; compact?: boolean }) {
  return <div className={`inline-flex items-center border border-black/15 bg-white shadow-[0_2px_8px_rgb(32_27_28/0.04)] ${compact ? "h-8" : "h-10"}`}><Button type="button" variant="ghost" size={compact ? "icon-xs" : "icon-sm"} className="rounded-none hover:bg-wine/10 hover:text-wine" onClick={() => onChange(Math.max(1, value - 1))} aria-label="کاهش تعداد"><Minus /></Button><input aria-label="تعداد" type="number" min={1} max={MAX_ITEM_QUANTITY} inputMode="numeric" value={value} onChange={(event) => onChange(Math.min(MAX_ITEM_QUANTITY, Math.max(1, Number(event.target.value) || 1)))} className={`w-10 border-x border-black/10 bg-transparent text-center text-sm font-medium outline-none focus:bg-wine/5 focus:text-wine ${compact ? "h-8" : "h-10"}`} /><Button type="button" variant="ghost" size={compact ? "icon-xs" : "icon-sm"} disabled={value >= MAX_ITEM_QUANTITY} className="rounded-none hover:bg-wine/10 hover:text-wine" onClick={() => onChange(Math.min(MAX_ITEM_QUANTITY, value + 1))} aria-label="افزایش تعداد"><Plus /></Button></div>;
}
