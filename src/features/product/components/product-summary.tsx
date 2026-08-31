"use client";

import Link from "next/link";
import { ArrowLeft, Check, ClipboardPenLine, MessageCircle, PackageCheck, Ruler, Truck } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import type { Product } from "@/features/catalog/catalog-types";
import { QuantityControl, useCart } from "@/features/cart/cart-context";
import { ProductSaveButton } from "@/features/saved/saved-context";

const priceFormatter = new Intl.NumberFormat("fa-IR");
const colorValues: Record<string, string> = { "کرم": "#d8cbb7", "قهوه‌ای": "#76543c", "مشکی": "#1f2022", "طلایی": "#b69a59", "سبز": "#677565", "طوسی": "#aaa8a4", "قرمز": "#8f3035" };

export function ProductSummary({ product, description, depth, height, leadTime }: { product: Product; description: string; depth: number; height: number; leadTime: string }) {
  const { addItem } = useCart();
  const [color, setColor] = useState(product.colors[0] ?? "پیش‌فرض");
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const addToCart = () => { addItem(product, color, quantity); setAdded(true); window.setTimeout(() => setAdded(false), 2400); };
  return (
    <div className="lg:sticky lg:top-6">
      <p className="text-xs font-semibold tracking-[0.18em] text-wine" dir="ltr">{product.brand}</p>
      <h1 className="mt-3 text-4xl font-medium leading-[1.25] sm:text-5xl">{product.name}</h1>
      <p className="mt-5 text-sm leading-7 text-muted-foreground">{description}</p>
      <p className="mt-7 text-2xl font-semibold text-wine">{priceFormatter.format(product.price)} <span className="text-sm font-normal text-muted-foreground">تومان</span></p>

      <div className="mt-7 border-y border-black/10 py-5">
        <div className="flex items-center justify-between gap-4 text-sm"><span className="flex items-center gap-2"><PackageCheck className="size-4 text-wine" />وضعیت سفارش</span><span className="font-medium">{product.availability === "in-stock" ? "آماده ارسال" : `ساخت سفارشی · ${leadTime}`}</span></div>
        <div className="mt-4 flex items-center justify-between gap-4 text-sm"><span className="flex items-center gap-2"><Ruler className="size-4 text-wine" />ابعاد کلی</span><span className="font-medium" dir="rtl">{product.width} × {depth} × {height} سانتی‌متر</span></div>
      </div>

      <fieldset className="mt-6"><legend className="text-sm font-medium">رنگ‌های قابل سفارش <span className="font-normal text-muted-foreground">· {color}</span></legend><div className="mt-3 flex flex-wrap gap-3">{product.colors.map((option) => <label key={option} className="cursor-pointer"><input type="radio" name={`color-${product.id}`} value={option} checked={color === option} onChange={() => setColor(option)} className="peer sr-only" /><span className="flex items-center gap-2 rounded-full border border-black/10 bg-white py-2 pe-3 ps-2 text-xs transition peer-checked:border-wine peer-checked:text-wine peer-checked:[&_.color-check]:opacity-100"><span className="grid size-6 place-items-center rounded-full border border-black/10" style={{ backgroundColor: colorValues[option] ?? "#d8d2ca" }}><Check className="color-check size-3 text-white opacity-0 drop-shadow transition-opacity" /></span>{option}</span></label>)}</div></fieldset>

      <div className="mt-7 flex items-center justify-between border border-black/15 bg-secondary/25 px-3 py-2"><span className="text-sm">تعداد</span><QuantityControl value={quantity} onChange={setQuantity} /></div>
      <div className="mt-3 grid grid-cols-[1fr_auto] gap-2"><Button onClick={addToCart} className="h-12 rounded-none bg-wine text-sm hover:bg-ink">{added ? "به سبد اضافه شد ✓" : product.availability === "in-stock" ? "افزودن به سبد خرید" : "ثبت سفارش و هماهنگی"}<ArrowLeft /></Button><ProductSaveButton product={product} className="size-12 bg-white" /></div>
      <Button asChild variant="outline" className="mt-3 h-11 w-full rounded-none"><Link href="/#contact"><ClipboardPenLine className="size-4" />درخواست مشاوره خرید</Link></Button>
      <a href={siteConfig.phoneHref} className="mt-3 flex h-11 items-center justify-center gap-2 border border-black/15 text-sm transition-colors hover:border-wine hover:text-wine"><MessageCircle className="size-4" />گفت‌وگو با مشاور</a>
      <div className="mt-5 grid gap-3 border-y border-black/10 py-4 text-xs text-muted-foreground"><p className="flex items-center gap-2"><Truck className="size-4 text-wine" />هزینه و زمان ارسال پس از انتخاب شهر محاسبه می‌شود.</p><p className="flex items-center gap-2"><PackageCheck className="size-4 text-wine" />ضمانت اصالت، کنترل کیفیت و پشتیبانی پس از تحویل</p></div>
      <p className="mt-4 text-center text-xs leading-6 text-muted-foreground">برای بررسی پارچه، رنگ و ابعاد سفارشی با شما هماهنگ می‌کنیم.</p>
    </div>
  );
}
