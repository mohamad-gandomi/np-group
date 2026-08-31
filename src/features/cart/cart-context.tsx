"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import type { Product } from "@/features/catalog/catalog-types";

export type CartItem = { key: string; product: Product; color: string; quantity: number };

type CartContextValue = {
  items: CartItem[];
  count: number;
  subtotal: number;
  addItem: (product: Product, color: string, quantity?: number) => void;
  updateQuantity: (key: string, quantity: number) => void;
  removeItem: (key: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const priceFormatter = new Intl.NumberFormat("fa-IR");

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("npgroup-cart-v1");
      if (saved) {
        // The cart is browser-owned state; load it after the server-rendered shell hydrates.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setItems(JSON.parse(saved) as CartItem[]);
      }
    } catch {
      window.localStorage.removeItem("npgroup-cart-v1");
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) window.localStorage.setItem("npgroup-cart-v1", JSON.stringify(items));
  }, [hydrated, items]);

  const value = useMemo<CartContextValue>(() => ({
    items,
    count: items.reduce((sum, item) => sum + item.quantity, 0),
    subtotal: items.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
    addItem(product, color, quantity = 1) {
      const key = `${product.id}-${color}`;
      setItems((current) => {
        const existing = current.find((item) => item.key === key);
        if (existing) return current.map((item) => item.key === key ? { ...item, quantity: item.quantity + quantity } : item);
        return [...current, { key, product, color, quantity }];
      });
    },
    updateQuantity(key, quantity) {
      setItems((current) => quantity <= 0 ? current.filter((item) => item.key !== key) : current.map((item) => item.key === key ? { ...item, quantity } : item));
    },
    removeItem(key) { setItems((current) => current.filter((item) => item.key !== key)); },
    clear() { setItems([]); },
  }), [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside CartProvider");
  return context;
}

export function CartButton() {
  const { items, count, subtotal } = useCart();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  // Route changes should always dismiss the cart sheet.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setOpen(false); }, [pathname]);
  return <Sheet open={open} onOpenChange={setOpen}>
    <SheetTrigger asChild><Button variant="ghost" size="icon-lg" className="relative size-11 rounded-none" aria-label={`سبد خرید، ${count} کالا`}><ShoppingBag className="size-[1.4rem]" />{count > 0 ? <span className="absolute end-0.5 top-0.5 grid min-w-4 place-items-center rounded-full bg-wine px-1 text-[0.58rem] leading-4 text-white">{priceFormatter.format(count)}</span> : null}</Button></SheetTrigger>
    <SheetContent side="left" className="data-[side=left]:w-[92%] bg-white sm:data-[side=left]:w-full sm:max-w-md" dir="rtl">
      <SheetHeader className="border-b px-5 py-6 text-start"><SheetTitle className="text-2xl">سبد خرید</SheetTitle><SheetDescription>{count ? `${priceFormatter.format(count)} کالا برای بررسی شما آماده است.` : "هنوز محصولی به سبد اضافه نکرده‌اید."}</SheetDescription></SheetHeader>
      <div className="flex-1 overflow-x-hidden overflow-y-auto px-4 py-4 sm:px-5 sm:py-5">{items.length ? <div>{items.map((item) => <CartLine key={item.key} item={item} compact />)}</div> : <div className="grid min-h-64 place-items-center text-center text-sm text-muted-foreground"><ShoppingBag className="mb-3 size-8 text-wine" /><p>سبد خرید شما خالی است.</p></div>}</div>
      {items.length ? <SheetFooter className="border-t bg-secondary/40 px-5 py-5"><div className="flex items-center justify-between text-sm"><span>جمع کالاها</span><strong className="text-lg text-wine">{priceFormatter.format(subtotal)} <span className="text-xs font-normal text-muted-foreground">تومان</span></strong></div><Button asChild className="mt-3 h-12 w-full rounded-none bg-wine hover:bg-ink"><Link href="/cart">مشاهده سبد خرید</Link></Button><Button asChild variant="outline" className="h-11 w-full rounded-none"><Link href="/checkout">ادامه و پرداخت</Link></Button></SheetFooter> : null}
    </SheetContent>
  </Sheet>;
}

export function CartLine({ item, compact = false }: { item: CartItem; compact?: boolean }) {
  const { updateQuantity, removeItem } = useCart();
  return <div className={`grid border-b border-black/10 ${compact ? "grid-cols-[4rem_minmax(0,1fr)] gap-x-3 gap-y-3 py-4" : "grid-cols-[5.5rem_minmax(0,1fr)] gap-4 py-5 sm:grid-cols-[7rem_minmax(0,1fr)] sm:items-center"}`}><div className="relative aspect-square overflow-hidden bg-secondary"><Image src={item.product.image} alt={item.product.name} fill sizes={compact ? "64px" : "112px"} className="object-cover" /></div><div className="min-w-0"><div className="flex items-start justify-between gap-2"><div className="min-w-0"><Link href={`/shop/${item.product.category}/${item.product.slug}`} className={`block truncate font-medium hover:text-wine ${compact ? "text-sm" : "text-base sm:text-lg"}`}>{item.product.name}</Link><p className="mt-1 truncate text-xs text-muted-foreground">{item.product.brand} · رنگ {item.color}</p><p className="mt-1 text-xs text-muted-foreground">{item.product.availability === "in-stock" ? "آماده ارسال" : "ساخت سفارشی"}</p></div><Button type="button" variant="ghost" size="icon-xs" onClick={() => removeItem(item.key)} className="shrink-0 text-muted-foreground hover:text-wine" aria-label={`حذف ${item.product.name}`}>{compact ? <X /> : <Trash2 />}</Button></div>{compact ? null : <div className="mt-4 flex flex-wrap items-center justify-between gap-3"><QuantityControl value={item.quantity} onChange={(value) => updateQuantity(item.key, value)} /><strong className="whitespace-nowrap text-sm text-wine sm:text-base">{priceFormatter.format(item.product.price * item.quantity)} <span className="text-xs font-normal text-muted-foreground">تومان</span></strong></div>}</div>{compact ? <div className="col-span-2 flex items-center justify-between gap-3"><QuantityControl value={item.quantity} onChange={(value) => updateQuantity(item.key, value)} compact /><strong className="whitespace-nowrap text-sm text-wine">{priceFormatter.format(item.product.price * item.quantity)} <span className="text-[0.62rem] font-normal text-muted-foreground">تومان</span></strong></div> : null}</div>;
}

export function QuantityControl({ value, onChange, compact = false }: { value: number; onChange: (value: number) => void; compact?: boolean }) {
  return <div className={`inline-flex items-center border border-black/15 bg-white shadow-[0_2px_8px_rgb(32_27_28/0.04)] ${compact ? "h-8" : "h-10"}`}><Button type="button" variant="ghost" size={compact ? "icon-xs" : "icon-sm"} className="rounded-none hover:bg-wine/10 hover:text-wine" onClick={() => onChange(Math.max(1, value - 1))} aria-label="کاهش تعداد"><Minus /></Button><input aria-label="تعداد" type="number" min={1} inputMode="numeric" value={value} onChange={(event) => onChange(Math.max(1, Number(event.target.value) || 1))} className={`w-10 border-x border-black/10 bg-transparent text-center text-sm font-medium outline-none focus:bg-wine/5 focus:text-wine ${compact ? "h-8" : "h-10"}`} /><Button type="button" variant="ghost" size={compact ? "icon-xs" : "icon-sm"} className="rounded-none hover:bg-wine/10 hover:text-wine" onClick={() => onChange(value + 1)} aria-label="افزایش تعداد"><Plus /></Button></div>;
}
