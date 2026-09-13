"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, CreditCard, Loader2, MapPin, ShieldCheck, Truck } from "lucide-react";
import { type FormEvent, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { CartLine, useCart } from "@/features/cart/cart-context";
import type { TapinLocation, TapinServiceID } from "@/features/shipping/types";

const priceFormatter = new Intl.NumberFormat("fa-IR");

type ShippingQuote = {
  shippingAmountInTMN: number;
  shippingServiceLabel: string;
  totalInTMN: number;
};

export default function CheckoutPage() {
  const router = useRouter();
  const { cartId, items, shippingMode, subtotal, clear } = useCart();
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"zarinpal" | "invoice">("zarinpal");
  const [locations, setLocations] = useState<TapinLocation[]>([]);
  const [locationsError, setLocationsError] = useState("");
  const [locationsLoading, setLocationsLoading] = useState(false);
  const [provinceCode, setProvinceCode] = useState("");
  const [cityCode, setCityCode] = useState("");
  const [serviceID, setServiceID] = useState<TapinServiceID>("priority");
  const [quote, setQuote] = useState<ShippingQuote>();
  const [quoteLoading, setQuoteLoading] = useState(false);

  const selectedProvince = locations.find((province) => String(province.code) === provinceCode);
  const selectedCity = selectedProvince?.cities.find((city) => String(city.code) === cityCode);
  const payableTotal = quote?.totalInTMN ?? subtotal;

  useEffect(() => {
    if (shippingMode !== "parcel") return;
    const controller = new AbortController();
    // Loading reflects this external request lifecycle.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocationsLoading(true);
    void fetch("/api/shipping/tapin/locations", { signal: controller.signal })
      .then(async (response) => {
        const result = await response.json() as { error?: string; provinces?: TapinLocation[] };
        if (!response.ok || !result.provinces) throw new Error(result.error || "دریافت شهرها انجام نشد.");
        setLocations(result.provinces);
        setLocationsError("");
      })
      .catch((error) => {
        if (!controller.signal.aborted) setLocationsError(error instanceof Error ? error.message : "دریافت شهرها انجام نشد.");
      })
      .finally(() => { if (!controller.signal.aborted) setLocationsLoading(false); });
    return () => controller.abort();
  }, [shippingMode]);

  const shippingSelection = useMemo(() => shippingMode === "parcel" && provinceCode && cityCode
    ? { provinceCode: Number(provinceCode), cityCode: Number(cityCode), serviceID }
    : undefined, [cityCode, provinceCode, serviceID, shippingMode]);

  const requestQuote = async () => {
    if (!shippingSelection) {
      setSubmitError("استان، شهر و سرویس ارسال پستی را انتخاب کنید.");
      return;
    }
    setQuoteLoading(true);
    setSubmitError("");
    try {
      const response = await fetch("/api/shipping/tapin/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ destination: shippingSelection, serviceID }),
      });
      const result = await response.json().catch(() => null) as (ShippingQuote & { error?: string }) | null;
      if (response.status === 401) {
        router.push("/login?next=/checkout");
        return;
      }
      if (!response.ok || !result) {
        setSubmitError(result?.error || "استعلام هزینه ارسال انجام نشد.");
        return;
      }
      setQuote(result);
    } catch {
      setSubmitError("ارتباط با سرویس استعلام ارسال برقرار نشد.");
    } finally {
      setQuoteLoading(false);
    }
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (shippingMode === "parcel" && !shippingSelection) {
      setSubmitError("استان، شهر و سرویس ارسال پستی را انتخاب کنید.");
      return;
    }
    setSubmitting(true);
    setSubmitError("");
    const form = new FormData(event.currentTarget);
    const raw = Object.fromEntries(form) as Record<string, string>;
    const contact = {
      name: raw.name,
      phone: raw.phone,
      address: raw.address,
      postal: raw.postal,
      delivery: raw.delivery,
      payment: raw.payment,
      province: shippingMode === "parcel" ? selectedProvince?.title || "" : raw.province,
      city: shippingMode === "parcel" ? selectedCity?.title || "" : raw.city,
      ...(shippingSelection ? { shipping: shippingSelection } : {}),
    };
    const payingOnline = contact.payment === "zarinpal";
    if (payingOnline && !cartId) {
      router.push("/login?next=/checkout");
      setSubmitting(false);
      return;
    }
    try {
      const response = await fetch(payingOnline ? "/api/payments/zarinpal/initiate" : "/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payingOnline ? {
          cartID: cartId,
          billingAddress: {
            firstName: contact.name,
            addressLine1: contact.address,
            city: contact.city,
            state: contact.province,
            postalCode: contact.postal,
            country: "IR",
            phone: contact.phone,
          },
          ...(shippingSelection ? { shipping: shippingSelection } : {}),
        } : { contact }),
      });
      if (response.status === 401) {
        router.push("/login?next=/checkout");
        return;
      }
      if (!response.ok) {
        const result = await response.json().catch(() => null) as { error?: string; message?: string } | null;
        setSubmitError(result?.error ?? result?.message ?? "ثبت سفارش انجام نشد. لطفاً دوباره تلاش کنید.");
        return;
      }
      if (payingOnline) {
        const result = await response.json() as { redirectURL?: string };
        if (!result.redirectURL) {
          setSubmitError("نشانی انتقال به زرین‌پال دریافت نشد.");
          return;
        }
        window.location.assign(result.redirectURL);
        return;
      }
      setSubmitted(true);
      clear();
    } catch {
      setSubmitError("ارتباط با سرویس ثبت سفارش برقرار نشد. لطفاً دوباره تلاش کنید.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return <main className="min-h-[60vh]"><div className="container-shell py-20 text-center"><div className="mx-auto grid size-16 place-items-center rounded-full bg-wine text-white"><Check className="size-8" /></div><h1 className="mt-7 text-4xl font-medium">درخواست شما ثبت شد</h1><p className="mx-auto mt-4 max-w-lg text-sm leading-7 text-muted-foreground">مشاور NPGroup برای تأیید جزئیات، زمان تحویل و روش پرداخت با شما تماس می‌گیرد.</p><Button asChild className="mt-8 h-12 rounded-none bg-wine px-8 hover:bg-ink"><Link href="/shop">بازگشت به فروشگاه</Link></Button></div></main>;
  }

  return <main className="min-h-[60vh]"><div className="container-shell py-8 sm:py-14">
    <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-semibold tracking-[0.18em] text-wine">پرداخت</p><h1 className="mt-3 text-4xl font-medium sm:text-5xl">تکمیل سفارش</h1></div><Link href="/cart" className="hidden items-center gap-2 text-xs text-muted-foreground hover:text-wine sm:flex"><ArrowRight className="size-4" />بازگشت به سبد</Link></div>
    {items.length ? <form onSubmit={submit} className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
      <div className="min-w-0 space-y-8">
        <section className="border border-black/10 p-6 sm:p-8"><div className="flex items-center gap-3"><MapPin className="size-5 text-wine" /><div><h2 className="text-xl font-medium">اطلاعات تماس و ارسال</h2><p className="mt-1 text-xs text-muted-foreground">برای پیگیری سفارش و هماهنگی تحویل</p></div></div><div className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="text-sm">نام و نام خانوادگی<input required name="name" autoComplete="name" className="mt-2 h-11 w-full border border-black/15 bg-white px-3 text-sm outline-none focus:border-wine" /></label>
          <label className="text-sm">شماره موبایل<input required name="phone" type="tel" inputMode="tel" autoComplete="tel" className="mt-2 h-11 w-full border border-black/15 bg-white px-3 text-sm outline-none focus:border-wine" /></label>
          {shippingMode === "parcel" ? <>
            <label className="text-sm">استان<select required value={provinceCode} onChange={(event) => { setProvinceCode(event.target.value); setCityCode(""); setQuote(undefined); }} disabled={locationsLoading} className="mt-2 h-11 w-full border border-black/15 bg-white px-3 text-sm outline-none focus:border-wine"><option value="">{locationsLoading ? "در حال دریافت…" : "انتخاب استان"}</option>{locations.map((province) => <option key={province.code} value={province.code}>{province.title}</option>)}</select></label>
            <label className="text-sm">شهر<select required value={cityCode} onChange={(event) => { setCityCode(event.target.value); setQuote(undefined); }} disabled={!selectedProvince} className="mt-2 h-11 w-full border border-black/15 bg-white px-3 text-sm outline-none focus:border-wine"><option value="">انتخاب شهر</option>{selectedProvince?.cities.map((city) => <option key={city.code} value={city.code}>{city.title}</option>)}</select></label>
          </> : <>
            <label className="text-sm">استان<input required name="province" autoComplete="address-level1" className="mt-2 h-11 w-full border border-black/15 bg-white px-3 text-sm outline-none focus:border-wine" /></label>
            <label className="text-sm">شهر<input required name="city" autoComplete="address-level2" className="mt-2 h-11 w-full border border-black/15 bg-white px-3 text-sm outline-none focus:border-wine" /></label>
          </>}
          <label className="text-sm sm:col-span-2">نشانی کامل<input required name="address" autoComplete="street-address" className="mt-2 h-11 w-full border border-black/15 bg-white px-3 text-sm outline-none focus:border-wine" /></label>
          <label className="text-sm">کد پستی<input required name="postal" inputMode="numeric" autoComplete="postal-code" className="mt-2 h-11 w-full border border-black/15 bg-white px-3 text-sm outline-none focus:border-wine" /></label>
          {locationsError ? <p role="alert" className="text-xs text-destructive sm:col-span-2">{locationsError}</p> : null}
        </div></section>
        <section className="border border-black/10 p-6 sm:p-8"><div className="flex items-center gap-3"><Truck className="size-5 text-wine" /><div><h2 className="text-xl font-medium">روش تحویل</h2><p className="mt-1 text-xs text-muted-foreground">هزینه ارسال همیشه دوباره در سرور محاسبه می‌شود</p></div></div>
          {shippingMode === "parcel" ? <div className="mt-6 space-y-3">
            <label className="flex cursor-pointer gap-3 border border-black/10 p-4"><input type="radio" name="shippingService" checked={serviceID === "priority"} onChange={() => { setServiceID("priority"); setQuote(undefined); }} className="accent-[var(--wine)]" /><span><span className="block text-sm font-medium">پست پیشتاز تاپین</span><span className="mt-1 block text-xs text-muted-foreground">سرویس سریع‌تر پستی</span></span></label>
            <label className="flex cursor-pointer gap-3 border border-black/10 p-4"><input type="radio" name="shippingService" checked={serviceID === "custom"} onChange={() => { setServiceID("custom"); setQuote(undefined); }} className="accent-[var(--wine)]" /><span><span className="block text-sm font-medium">پست سفارشی تاپین</span><span className="mt-1 block text-xs text-muted-foreground">سرویس اقتصادی‌تر پستی</span></span></label>
            <Button type="button" variant="outline" disabled={!shippingSelection || quoteLoading} onClick={() => void requestQuote()} className="h-11 rounded-none">{quoteLoading ? <Loader2 className="animate-spin" /> : <Truck />}{quoteLoading ? "در حال استعلام" : "استعلام هزینه ارسال"}</Button>
            {quote ? <p className="text-sm text-wine">{quote.shippingServiceLabel}: {priceFormatter.format(quote.shippingAmountInTMN)} تومان</p> : null}
          </div> : <label className="mt-6 flex gap-3 border border-wine bg-wine/5 p-4"><input type="radio" name="delivery" value="advisor" defaultChecked className="accent-[var(--wine)]" /><span><span className="block text-sm font-medium">هماهنگی باربری توسط NPGroup</span><span className="mt-1 block text-xs text-muted-foreground">هزینه باربری بعد از ثبت سفارش جداگانه اعلام می‌شود و در زرین‌پال دریافت نمی‌شود.</span></span></label>}
          {shippingMode === "parcel" ? <input type="hidden" name="delivery" value="advisor" /> : null}
        </section>
        <section className="border border-black/10 p-6 sm:p-8"><div className="flex items-center gap-3"><CreditCard className="size-5 text-wine" /><div><h2 className="text-xl font-medium">روش پرداخت</h2><p className="mt-1 text-xs text-muted-foreground">پرداخت آنلاین پس از تأیید زرین‌پال، سفارش را قطعی می‌کند</p></div></div>
          <label className="mt-6 flex cursor-pointer gap-3 border border-black/10 p-4"><input type="radio" name="payment" value="zarinpal" checked={paymentMethod === "zarinpal"} onChange={() => setPaymentMethod("zarinpal")} className="accent-[var(--wine)]" /><span><span className="block text-sm font-medium">پرداخت آنلاین با زرین‌پال</span><span className="mt-1 block text-xs text-muted-foreground">انتقال امن به درگاه بانکی و بازگشت برای دریافت نتیجه</span></span></label>
          <label className="mt-3 flex cursor-pointer gap-3 border border-black/10 p-4"><input type="radio" name="payment" value="invoice" checked={paymentMethod === "invoice"} onChange={() => setPaymentMethod("invoice")} className="accent-[var(--wine)]" /><span><span className="block text-sm font-medium">فاکتور و پرداخت مرحله‌ای</span><span className="mt-1 block text-xs text-muted-foreground">مناسب سفارش‌های با مبلغ بالا، با هماهنگی مشاور</span></span></label>
        </section>
      </div>
      <aside className="min-w-0 overflow-hidden border border-black/10 bg-secondary/35 p-6 lg:sticky lg:top-32"><h2 className="text-lg font-medium">مرور سفارش</h2><div className="mt-4 max-h-72 space-y-1 overflow-x-hidden overflow-y-auto border-b border-black/10 pb-4 pe-1">{items.map((item) => <CartLine key={item.key} item={item} compact />)}</div><div className="space-y-3 py-5 text-sm"><div className="flex justify-between"><span className="text-muted-foreground">جمع کالاها</span><span>{priceFormatter.format(subtotal)} تومان</span></div><div className="flex justify-between"><span className="text-muted-foreground">ارسال</span><span>{shippingMode === "freight" ? "پس از هماهنگی" : quote ? `${priceFormatter.format(quote.shippingAmountInTMN)} تومان` : "نیازمند استعلام"}</span></div><div className="flex justify-between border-t border-black/10 pt-4 text-base font-semibold"><span>مبلغ قابل پرداخت</span><span className="text-wine">{priceFormatter.format(payableTotal)} تومان</span></div></div>{submitError ? <p role="alert" className="mb-3 text-xs leading-6 text-destructive">{submitError}</p> : null}<Button type="submit" disabled={submitting || (shippingMode === "parcel" && !shippingSelection)} className="h-12 w-full rounded-none bg-wine hover:bg-ink">{submitting ? <Loader2 className="animate-spin" /> : <ShieldCheck />}{submitting ? "در حال پردازش" : paymentMethod === "zarinpal" ? "پرداخت با زرین‌پال" : "ثبت درخواست سفارش"}</Button><p className="mt-4 text-center text-[0.68rem] leading-5 text-muted-foreground">مبلغ کالا و ارسال پستی در سرور محاسبه می‌شود؛ هزینه باربری جداگانه هماهنگ خواهد شد.</p></aside>
    </form> : <div className="border border-dashed border-black/15 py-20 text-center"><h2 className="text-2xl font-medium">سبد خرید خالی است</h2><Button asChild className="mt-7 rounded-none bg-wine hover:bg-ink"><Link href="/shop">بازگشت به فروشگاه</Link></Button></div>}
  </div></main>;
}
