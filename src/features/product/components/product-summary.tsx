"use client";

import Link from "next/link";
import { ArrowLeft, Check, ClipboardPenLine, MessageCircle, PackageCheck, Ruler, Truck } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import type { Product } from "@/features/catalog/catalog-types";
import type { CartConfigurationSelection } from "@/features/cart/cart-context";
import { QuantityControl, useCart } from "@/features/cart/cart-context";
import { ProductSaveButton } from "@/features/saved/saved-context";
import { brandPath } from "@/features/showcase/brand-registry";

const priceFormatter = new Intl.NumberFormat("fa-IR");
const colorValues: Record<string, string> = { "کرم": "#d8cbb7", "قهوه‌ای": "#76543c", "مشکی": "#1f2022", "طلایی": "#b69a59", "سبز": "#677565", "طوسی": "#aaa8a4", "قرمز": "#8f3035" };

type QuoteResponse = {
  error?: string;
  item?: {
    unitPriceInTMN?: number;
    productTitleSnapshot?: string;
    variantCodeSnapshot?: string | null;
    configuration?: {
      groupKey: string;
      groupLabelFaSnapshot: string;
      option?: number;
      optionCodeSnapshot?: string | null;
      labelFaSnapshot: string;
    }[];
  };
};

export function ProductSummary({ product, description, depth, height, leadTime }: { product: Product; description: string; depth: number | null; height: number | null; leadTime: string }) {
  const { addItem } = useCart();
  const [color, setColor] = useState(product.colors[0] ?? "پیش‌فرض");
  const [variantId, setVariantId] = useState<number | undefined>();
  const [configuration, setConfiguration] = useState<Record<string, number>>({});
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [adding, setAdding] = useState(false);
  const [cartError, setCartError] = useState("");
  const selectedVariant = product.variants?.find((variant) => variant.id === variantId);
  const hasPricedVariant = product.variants?.some((variant) => variant.price !== null) === true;
  const awaitingVariant = Boolean(product.variants?.length) && !selectedVariant && hasPricedVariant;
  const effectivePrice = selectedVariant ? selectedVariant.price : awaitingVariant ? null : product.price;
  const priceUnavailable = !awaitingVariant && effectivePrice === null;
  const groupsComplete = (product.configurationGroups ?? []).every((group) => !group.required || configuration[group.key]);
  const variantComplete = !product.variants?.length || Boolean(selectedVariant);
  const dimensions = useMemo(() => {
    const measurements = selectedVariant?.measurements ?? product.measurements ?? [];
    const find = (key: string) => measurements.find((measurement) => measurement.key === key)?.value;
    return { width: find("width") ?? product.width, depth: find("depth") ?? depth, height: find("height") ?? height };
  }, [depth, height, product.measurements, product.width, selectedVariant]);

  const addToCart = async () => {
    if (product.source !== "payload") {
      addItem(product, color, quantity);
      setAdded(true);
      window.setTimeout(() => setAdded(false), 2400);
      return;
    }
    if (!product.payloadProductId || !variantComplete || !groupsComplete || effectivePrice === null) return;

    setAdding(true);
    setCartError("");
    try {
      const requestedConfiguration = (product.configurationGroups ?? []).map((group) => ({
        groupKey: group.key,
        option: configuration[group.key],
      }));
      const response = await fetch("/api/payload-cart/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.payloadProductId,
          variantId: selectedVariant?.id,
          quantity,
          configuration: requestedConfiguration,
        }),
      });
      const quote = await response.json() as QuoteResponse;
      if (!response.ok || !quote.item || typeof quote.item.unitPriceInTMN !== "number") {
        throw new Error(quote.error || "اعتبارسنجی انتخاب‌ها انجام نشد.");
      }
      const trustedConfiguration: CartConfigurationSelection[] = (quote.item.configuration ?? []).map((selection) => ({
        groupKey: selection.groupKey,
        groupLabel: selection.groupLabelFaSnapshot,
        optionId: selection.option!,
        optionLabel: selection.labelFaSnapshot,
        ...(selection.optionCodeSnapshot ? { optionCode: selection.optionCodeSnapshot } : {}),
      }));
      addItem(
        { ...product, price: quote.item.unitPriceInTMN, name: quote.item.productTitleSnapshot ?? product.name },
        {
          color: trustedConfiguration.find((selection) => selection.groupKey === "wood-finish")?.optionLabel ?? "سفارشی",
          ...(selectedVariant ? {
            variantId: selectedVariant.id,
            variantLabel: selectedVariant.label,
            variantCode: quote.item.variantCodeSnapshot ?? selectedVariant.code,
          } : {}),
          configuration: trustedConfiguration,
        },
        quantity,
      );
      setAdded(true);
      window.setTimeout(() => setAdded(false), 2400);
    } catch (error) {
      setCartError(error instanceof Error ? error.message : "افزودن به سبد انجام نشد.");
    } finally {
      setAdding(false);
    }
  };
  return (
    <div className="lg:sticky lg:top-6">
      <Link href={brandPath(product.brand)} className="inline-block text-xs font-semibold tracking-[0.18em] text-wine underline-offset-4 hover:underline" dir="ltr" aria-label={`مشاهده مجموعه ${product.brand}`}>{product.brand}</Link>
      <h1 className="mt-3 text-4xl font-medium leading-[1.25] sm:text-5xl">{product.name}</h1>
      <p className="mt-5 text-sm leading-7 text-muted-foreground">{description}</p>
      <p className="mt-7 text-2xl font-semibold text-wine">{awaitingVariant ? "برای مشاهده قیمت، مدل را انتخاب کنید" : effectivePrice === null ? "قیمت پس از انتخاب و تأیید مشاور" : <>{priceFormatter.format(effectivePrice)} <span className="text-sm font-normal text-muted-foreground">تومان</span></>}</p>

      <div className="mt-7 border-y border-black/10 py-5">
        <div className="flex items-center justify-between gap-4 text-sm"><span className="flex items-center gap-2"><PackageCheck className="size-4 text-wine" />وضعیت سفارش</span><span className="font-medium">{product.availability === "in-stock" ? "آماده ارسال" : `ساخت سفارشی · ${leadTime}`}</span></div>
        <div className="mt-4 flex items-center justify-between gap-4 text-sm"><span className="flex items-center gap-2"><Ruler className="size-4 text-wine" />ابعاد کلی</span><span className="font-medium" dir="rtl">{dimensions.width != null && dimensions.depth != null && dimensions.height != null ? `${dimensions.width} × ${dimensions.depth} × ${dimensions.height} سانتی‌متر` : "وابسته به مدل انتخابی"}</span></div>
      </div>

      {product.variants?.length ? <fieldset className="mt-6"><legend className="text-sm font-medium">مدل محصول</legend><div className="mt-3 grid gap-2">{product.variants.map((variant) => <label key={variant.id} className="cursor-pointer"><input type="radio" name={`variant-${product.id}`} value={variant.id} checked={variantId === variant.id} onChange={() => setVariantId(variant.id)} className="peer sr-only" /><span className="flex items-center justify-between border border-black/10 bg-white px-4 py-3 text-sm transition peer-checked:border-wine peer-checked:bg-wine/5 peer-checked:text-wine"><span>{variant.label}</span><span dir="ltr" className="text-xs">{variant.code}</span></span></label>)}</div></fieldset> : null}

      {product.configurationGroups?.map((group) => <fieldset className="mt-6" key={group.key}><legend className="text-sm font-medium">{group.label}{group.required ? <span className="text-wine"> *</span> : null}</legend>{group.helpText ? <p className="mt-1 text-xs leading-5 text-muted-foreground">{group.helpText}</p> : null}<div className="mt-3 flex flex-wrap gap-3">{group.options.map((option) => <label key={option.id} className="cursor-pointer"><input type="radio" name={`${group.key}-${product.id}`} value={option.id} checked={configuration[group.key] === option.id} onChange={() => setConfiguration((current) => ({ ...current, [group.key]: option.id }))} className="peer sr-only" /><span className="flex items-center gap-2 rounded-full border border-black/10 bg-white py-2 pe-3 ps-2 text-xs transition peer-checked:border-wine peer-checked:text-wine peer-checked:[&_.color-check]:opacity-100">{group.inputType === "swatch" ? <span className="grid size-6 place-items-center rounded-full border border-black/10" style={{ backgroundColor: option.swatchColor ?? "#d8d2ca" }}><Check className="color-check size-3 text-white opacity-0 drop-shadow transition-opacity" /></span> : null}{option.label}</span></label>)}</div></fieldset>)}

      {!product.configurationGroups?.length ? <fieldset className="mt-6"><legend className="text-sm font-medium">رنگ‌های قابل سفارش <span className="font-normal text-muted-foreground">· {color}</span></legend><div className="mt-3 flex flex-wrap gap-3">{product.colors.map((option) => <label key={option} className="cursor-pointer"><input type="radio" name={`color-${product.id}`} value={option} checked={color === option} onChange={() => setColor(option)} className="peer sr-only" /><span className="flex items-center gap-2 rounded-full border border-black/10 bg-white py-2 pe-3 ps-2 text-xs transition peer-checked:border-wine peer-checked:text-wine peer-checked:[&_.color-check]:opacity-100"><span className="grid size-6 place-items-center rounded-full border border-black/10" style={{ backgroundColor: colorValues[option] ?? "#d8d2ca" }}><Check className="color-check size-3 text-white opacity-0 drop-shadow transition-opacity" /></span>{option}</span></label>)}</div></fieldset> : null}

      <div className="mt-7 flex items-center justify-between border border-black/15 bg-secondary/25 px-3 py-2"><span className="text-sm">تعداد</span><QuantityControl value={quantity} onChange={setQuantity} /></div>
      <div className="mt-3 grid grid-cols-[1fr_auto] gap-2">{priceUnavailable ? <Button asChild className="h-12 rounded-none bg-wine text-sm hover:bg-ink"><Link href="/#contact">استعلام قیمت و ثبت درخواست <ArrowLeft /></Link></Button> : <Button onClick={addToCart} disabled={adding || !variantComplete || !groupsComplete || effectivePrice === null} className="h-12 rounded-none bg-wine text-sm hover:bg-ink">{adding ? "در حال اعتبارسنجی…" : added ? "به سبد اضافه شد ✓" : !variantComplete ? "مدل را انتخاب کنید" : !groupsComplete ? "انتخاب‌ها را کامل کنید" : product.availability === "in-stock" ? "افزودن به سبد خرید" : "افزودن سفارش سفارشی"}<ArrowLeft /></Button>}<ProductSaveButton product={product} className="size-12 bg-white" /></div>
      {cartError ? <p role="alert" className="mt-2 text-xs leading-6 text-destructive">{cartError}</p> : null}
      <Button asChild variant="outline" className="mt-3 h-11 w-full rounded-none"><Link href="/#contact"><ClipboardPenLine className="size-4" />درخواست مشاوره خرید</Link></Button>
      <a href={siteConfig.phoneHref} className="mt-3 flex h-11 items-center justify-center gap-2 border border-black/15 text-sm transition-colors hover:border-wine hover:text-wine"><MessageCircle className="size-4" />گفت‌وگو با مشاور</a>
      <div className="mt-5 grid gap-3 border-y border-black/10 py-4 text-xs text-muted-foreground"><p className="flex items-center gap-2"><Truck className="size-4 text-wine" />هزینه و زمان ارسال پس از انتخاب شهر محاسبه می‌شود.</p><p className="flex items-center gap-2"><PackageCheck className="size-4 text-wine" />ضمانت اصالت، کنترل کیفیت و پشتیبانی پس از تحویل</p></div>
      <p className="mt-4 text-center text-xs leading-6 text-muted-foreground">برای بررسی پارچه، رنگ و ابعاد سفارشی با شما هماهنگ می‌کنیم.</p>
    </div>
  );
}
