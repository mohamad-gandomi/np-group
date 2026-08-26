import Image from "next/image";
import Link from "next/link";

import type { products } from "@/data/catalog";

type Product = (typeof products)[number];

export function ProductCard({ product }: { product: Product }) {
  return (
    <article className="group min-w-0">
      <Link href="/shop" className="block">
        <div className="relative aspect-[4/5] overflow-hidden bg-secondary">
          <Image src={product.image} alt={`${product.name} از برند ${product.brand}`} fill sizes="(max-width: 768px) 82vw, 25vw" className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.035]" />
          <span className="absolute start-3 top-3 bg-white/90 px-2.5 py-1 text-[0.62rem] font-medium backdrop-blur">جدید</span>
          <span className="absolute inset-x-3 bottom-3 translate-y-2 bg-wine px-4 py-3 text-center text-xs text-white opacity-0 transition-all group-hover:translate-y-0 group-hover:opacity-100">مشاهده جزئیات</span>
        </div>
        <div className="pt-4">
          <p className="text-[0.62rem] tracking-[0.16em] text-muted-foreground" dir="ltr">{product.brand}</p>
          <div className="mt-1.5 flex items-start justify-between gap-3">
            <h3 className="text-base font-medium sm:text-lg">{product.name}</h3>
            <p className="shrink-0 text-sm font-medium text-wine">{product.price} <span className="text-[0.65rem]">تومان</span></p>
          </div>
        </div>
      </Link>
    </article>
  );
}
