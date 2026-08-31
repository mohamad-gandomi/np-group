"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight, Maximize2, X } from "lucide-react";
import { useEffect, useState, type TouchEvent } from "react";

import { Button } from "@/components/ui/button";

export function ProductGallery({ images, name, brand }: { images: readonly string[]; name: string; brand: string }) {
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const image = images[active] ?? images[0];

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setLightbox(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const move = (delta: number) => setActive((current) => (current + delta + images.length) % images.length);
  const onTouchEnd = (event: TouchEvent) => { if (touchStart === null) return; const delta = event.changedTouches[0].clientX - touchStart; if (Math.abs(delta) > 40) { event.preventDefault(); move(delta > 0 ? -1 : 1); } setTouchStart(null); };

  return <div className="min-w-0">
    <div className="space-y-3" dir="ltr">
      <button type="button" aria-label="نمایش تصویر بزرگ" className="relative block w-full cursor-zoom-in overflow-hidden bg-secondary p-0 text-start aspect-[4/5] sm:aspect-[7/6] lg:h-[clamp(28rem,calc(100svh-19rem),36rem)] lg:aspect-auto" onClick={() => setLightbox(true)} onTouchStart={(event) => setTouchStart(event.touches[0].clientX)} onTouchEnd={onTouchEnd}>
        <Image src={image} alt={`${name} از برند ${brand}`} fill priority sizes="(max-width: 640px) 100vw, (max-width: 1024px) 78vw, 58vw" className="object-cover" />
      </button>
      <div className="flex gap-2 overflow-x-auto pb-1">{images.map((item, index) => <button type="button" key={item} onClick={() => setActive(index)} className={`relative aspect-square w-20 shrink-0 overflow-hidden border-2 bg-secondary transition sm:w-20 ${active === index ? "border-wine" : "border-transparent opacity-65 hover:opacity-100"}`} aria-label={`نمایش تصویر ${new Intl.NumberFormat("fa-IR").format(index + 1)}`} aria-current={active === index}><Image src={item} alt="" fill sizes="80px" className="object-cover" /></button>)}</div>
    </div>
    <div className="mt-3 flex items-center justify-between border-t border-black/10 pt-3" dir="ltr"><div className="flex items-center gap-2"><Button type="button" variant="outline" size="icon-sm" onClick={() => move(-1)} className="rounded-none" aria-label="تصویر قبلی"><ChevronLeft /></Button><span className="min-w-14 text-center text-xs font-medium text-muted-foreground">{new Intl.NumberFormat("fa-IR").format(active + 1)} / {new Intl.NumberFormat("fa-IR").format(images.length)}</span><Button type="button" variant="outline" size="icon-sm" onClick={() => move(1)} className="rounded-none" aria-label="تصویر بعدی"><ChevronRight /></Button></div><Button type="button" variant="outline" size="icon-sm" onClick={() => setLightbox(true)} className="rounded-none" aria-label="نمایش تصویر بزرگ"><Maximize2 /></Button></div>
    {lightbox ? <div role="dialog" aria-modal="true" aria-label={`تصویر بزرگ ${name}`} className="fixed inset-0 z-[100] grid place-items-center bg-ink/90 p-4" onClick={() => setLightbox(false)}><div className="relative h-[min(88vh,52rem)] w-full max-w-6xl" onClick={(event) => event.stopPropagation()}><Image src={image} alt={`${name} از برند ${brand}`} fill sizes="100vw" className="object-contain" /><Button type="button" variant="outline" size="icon-lg" onClick={() => setLightbox(false)} className="absolute end-2 top-2 rounded-full border-white/40 bg-white/90 text-ink" aria-label="بستن تصویر"><X /></Button>{images.length > 1 ? <><Button type="button" variant="outline" size="icon-lg" onClick={() => move(-1)} className="absolute start-2 top-1/2 rounded-full border-white/40 bg-white/90 text-ink" aria-label="تصویر قبلی"><ChevronRight /></Button><Button type="button" variant="outline" size="icon-lg" onClick={() => move(1)} className="absolute end-2 top-1/2 rounded-full border-white/40 bg-white/90 text-ink" aria-label="تصویر بعدی"><ChevronLeft /></Button></> : null}</div></div> : null}
  </div>;
}
