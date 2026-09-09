import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, PackageOpen } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getAccountData, statusLabels } from "@/features/account/account-data";
import { requireUser } from "@/features/auth/session";

const price = new Intl.NumberFormat("fa-IR");
const date = new Intl.DateTimeFormat("fa-IR", { year: "numeric", month: "long", day: "numeric" });

export default async function OrdersPage() {
  const user = await requireUser();
  const { orders } = await getAccountData(user);
  return <section><div className="flex items-end justify-between gap-4"><div><p className="text-xs font-semibold text-wine">سفارش‌های من</p><h2 className="mt-2 text-2xl font-medium">تاریخچه سفارش‌ها</h2></div><span className="text-xs text-muted-foreground">{new Intl.NumberFormat("fa-IR").format(orders.length)} سفارش</span></div><div className="mt-6 space-y-4">{orders.map((order) => <article key={order.id} className="border border-black/10 bg-white p-5 sm:p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><Link href={`/account/orders/${order.id}`} className="font-semibold hover:text-wine" dir="ltr">{order.orderNumber}</Link><p className="mt-2 text-xs text-muted-foreground">{date.format(new Date(order.createdAt))}</p></div><span className="border border-wine/20 bg-wine/5 px-3 py-1.5 text-xs text-wine">{statusLabels[order.status]}</span></div><div className="mt-5 flex items-center gap-3 overflow-hidden border-y border-black/10 py-4">{order.items.slice(0, 3).map((item) => <div key={item.id} className="relative size-16 shrink-0 overflow-hidden bg-secondary"><Image src={item.image} alt={item.productName} fill sizes="64px" className="object-cover" /></div>)}<div className="min-w-0 flex-1"><p className="truncate text-sm">{order.items.map((item) => item.productName).join("، ")}</p><p className="mt-1 text-xs text-muted-foreground">{new Intl.NumberFormat("fa-IR").format(order.items.reduce((sum, item) => sum + item.quantity, 0))} کالا</p></div></div><div className="mt-4 flex flex-wrap items-center justify-between gap-4"><p className="text-sm">مبلغ کل: <strong className="text-wine">{price.format(order.total)} تومان</strong></p><Button asChild variant="outline" size="sm" className="rounded-none"><Link href={`/account/orders/${order.id}`}>مشاهده جزئیات <ArrowLeft /></Link></Button></div></article>)}{orders.length === 0 ? <div className="border border-dashed border-black/15 bg-white py-16 text-center"><PackageOpen className="mx-auto size-9 text-wine" /><h3 className="mt-4 text-xl font-medium">سفارشی برای نمایش نیست</h3><Button asChild className="mt-6 rounded-none bg-wine"><Link href="/shop">شروع خرید</Link></Button></div> : null}</div></section>;
}
