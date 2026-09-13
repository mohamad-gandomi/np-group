import Link from "next/link";
import { Check, Clock3, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { requireUser } from "@/features/auth/session";
import { getZarinpalPaymentResult } from "@/features/payments/zarinpal/payment-result";

const priceFormatter = new Intl.NumberFormat("fa-IR");

export default async function ZarinpalResultPage({
  searchParams,
}: {
  searchParams: Promise<{ transaction?: string }>;
}) {
  const user = await requireUser();
  const query = await searchParams;
  const result = await getZarinpalPaymentResult(user, Number(query.transaction));
  const succeeded = result.status === "succeeded";
  const pending = result.status === "pending";
  const Icon = succeeded ? Check : pending ? Clock3 : X;
  const title = succeeded
    ? "پرداخت با موفقیت تأیید شد"
    : pending
      ? "پرداخت هنوز در حال بررسی است"
      : result.status === "cancelled"
        ? "پرداخت لغو شد"
        : "پرداخت تأیید نشد";

  return (
    <main className="min-h-[60vh]">
      <div className="container-shell py-20 text-center">
        <div className={`mx-auto grid size-16 place-items-center rounded-full text-white ${succeeded ? "bg-wine" : pending ? "bg-amber-600" : "bg-ink"}`}>
          <Icon className="size-8" />
        </div>
        <h1 className="mt-7 text-3xl font-medium sm:text-4xl">{title}</h1>
        <p className="mx-auto mt-4 max-w-lg text-sm leading-7 text-muted-foreground">
          {succeeded
            ? "سفارش شما پس از تأیید سمت سرور زرین‌پال ثبت شد و از بخش سفارش‌ها قابل پیگیری است."
            : pending
              ? "نتیجه قطعی هنوز ثبت نشده است. چند لحظه دیگر بخش سفارش‌ها را بررسی کنید."
              : "هیچ سفارشی برای این پرداخت قطعی نشده است. می‌توانید به سبد خرید برگردید و دوباره تلاش کنید."}
        </p>
        {result.amount ? <p className="mt-5 text-sm">مبلغ: {priceFormatter.format(result.amount)} تومان</p> : null}
        {result.orderNumber ? <p className="mt-2 text-sm">شماره سفارش: <span dir="ltr">{result.orderNumber}</span></p> : null}
        {result.referenceID ? <p className="mt-2 text-sm">شماره پیگیری زرین‌پال: <span dir="ltr">{result.referenceID}</span></p> : null}
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {succeeded ? <Button asChild className="rounded-none bg-wine hover:bg-ink"><Link href="/account/orders">مشاهده سفارش‌ها</Link></Button> : null}
          <Button asChild variant={succeeded ? "outline" : "default"} className="rounded-none"><Link href={succeeded ? "/shop" : "/cart"}>{succeeded ? "بازگشت به فروشگاه" : "بازگشت به سبد"}</Link></Button>
        </div>
      </div>
    </main>
  );
}
