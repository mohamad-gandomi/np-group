"use client";

import { useState } from "react";
import { MapPin } from "lucide-react";
import { siteConfig } from "@/config/site";

export function StoreMap() {
  const [visible, setVisible] = useState(false);
  return <div className="relative min-h-[340px] overflow-hidden border border-black/10 bg-[#eaece4] sm:min-h-[450px]">
    {visible ? <iframe src={siteConfig.mapEmbedUrl} title={`نقشه ${siteConfig.storeName}`} className="absolute inset-0 size-full border-0" loading="lazy" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" /> : <div className="flex min-h-[340px] flex-col items-center justify-center px-7 py-10 text-center sm:min-h-[450px]">
      <span className="mb-6 grid size-16 place-items-center rounded-full border border-[#b9c1b0] bg-white/60 text-[#344330]"><MapPin size={28} strokeWidth={1.3} aria-hidden="true" /></span>
      <p className="text-xs text-muted-foreground">ملاقات در مشهد</p>
      <h3 className="mt-3 text-xl font-medium sm:text-2xl">{siteConfig.storeName}</h3>
      <p className="mt-3 max-w-sm text-sm leading-7 text-muted-foreground">{siteConfig.addressLabel}</p>
      <button type="button" className="mt-7 inline-flex min-h-12 items-center gap-3 bg-[#303c30] px-6 py-3 text-sm text-white hover:bg-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-wine" onClick={() => setVisible(true)}><MapPin size={17} aria-hidden="true" />نمایش نقشه گوگل</button>
      <p className="mt-4 max-w-xs text-[0.68rem] leading-6 text-muted-foreground">با انتخاب این دکمه، نقشه از سرویس گوگل بارگذاری می‌شود.</p>
      <noscript><a className="mt-4 inline-block text-sm underline" href={siteConfig.mapsUrl} target="_blank" rel="noopener noreferrer">مشاهده مکان در گوگل مپ (پنجره جدید)</a></noscript>
    </div>}
  </div>;
}
