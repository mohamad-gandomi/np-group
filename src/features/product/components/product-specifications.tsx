import { Box, Hammer, ShieldCheck, Sparkles } from "lucide-react";

import type { Product } from "@/features/catalog/catalog-types";

type Props = { product: Product; depth: number | null; height: number | null; warranty: string; assembly: string; care: string };

export function ProductSpecifications({ product, depth, height, warranty, assembly, care }: Props) {
  if (product.source === "payload") {
    const measurements = product.measurements?.map((item) => `${item.label}: ${new Intl.NumberFormat("fa-IR").format(item.value)} ${item.unit === "unit" ? "عدد" : item.unit}`) ?? [];
    const specifications = product.technicalSpecs?.map((item) => `${item.label}: ${item.value}`) ?? [];
    const items = [
      { icon: Box, title: "مشخصات و ابعاد", content: measurements.length ? measurements : ["ابعاد دقیق با انتخاب مدل مشخص می‌شود."] },
      { icon: Hammer, title: "ساخت و متریال", content: specifications.length ? specifications : ["جزئیات ساخت پس از انتخاب مدل اعلام می‌شود."] },
      { icon: Sparkles, title: "نکات ثبت سفارش", content: [product.orderNotes ?? care] },
      { icon: ShieldCheck, title: "ضمانت و خدمات", content: [`مدت ضمانت: ${warranty}`, assembly, "کنترل کیفیت پیش از ارسال"] },
    ];
    return <div className="grid border-x border-t border-black/10 md:grid-cols-2">{items.map(({ icon: Icon, title, content }) => <section key={title} className="border-b border-black/10 bg-white p-6 sm:p-8 md:odd:border-e"><Icon className="size-5 text-wine" strokeWidth={1.7} /><h2 className="mt-4 text-lg font-medium">{title}</h2><ul className="mt-4 space-y-2 text-sm leading-7 text-muted-foreground">{content.map((item) => <li key={item} className="flex gap-2"><span className="mt-3 size-1 shrink-0 rounded-full bg-wine" />{item}</li>)}</ul></section>)}</div>;
  }
  const items = [
    { icon: Box, title: "مشخصات و ابعاد", content: [`عرض: ${product.width} سانتی‌متر`, `عمق: ${depth} سانتی‌متر`, `ارتفاع: ${height} سانتی‌متر`, product.seats ? `ظرفیت: ${new Intl.NumberFormat("fa-IR").format(product.seats)} نفر` : null].filter((item): item is string => Boolean(item)) },
    { icon: Hammer, title: "ساخت و متریال", content: [`متریال اصلی: ${product.material.join("، ")}`, `مناسب برای: ${product.room.join("، ")}`, assembly] },
    { icon: Sparkles, title: "نگهداری", content: [care] },
    { icon: ShieldCheck, title: "ضمانت و خدمات", content: [`مدت ضمانت: ${warranty}`, "کنترل کیفیت پیش از ارسال", "پشتیبانی پس از تحویل"] },
  ];

  return <div className="grid border-x border-t border-black/10 md:grid-cols-2">{items.map(({ icon: Icon, title, content }) => <section key={title} className="border-b border-black/10 bg-white p-6 sm:p-8 md:odd:border-e"><Icon className="size-5 text-wine" strokeWidth={1.7} /><h2 className="mt-4 text-lg font-medium">{title}</h2><ul className="mt-4 space-y-2 text-sm leading-7 text-muted-foreground">{content.map((item) => <li key={item} className="flex gap-2"><span className="mt-3 size-1 shrink-0 rounded-full bg-wine" />{item}</li>)}</ul></section>)}</div>;
}
