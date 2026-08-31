import Image from "next/image";
import Link from "next/link";

import type { Product } from "@/features/catalog/catalog-types";
import { ProductSaveButton } from "@/features/saved/saved-context";

const priceFormatter = new Intl.NumberFormat("fa-IR");
const colorValues: Record<string, string> = { "کرم": "#d8cbb7", "قهوه‌ای": "#76543c", "مشکی": "#1f2022", "طلایی": "#b69a59", "سبز": "#677565", "طوسی": "#aaa8a4", "قرمز": "#8f3035" };

export function ProductCard({ product }: { product: Product }) {
  return (
    <article className="group relative min-w-0">
      <Link href={`/shop/${product.category}/${product.slug}`} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wine focus-visible:ring-offset-4">
        <div className="relative aspect-[4/5] overflow-hidden bg-secondary">
          <Image src={product.image} alt={`${product.name} از برند ${product.brand}`} fill sizes="(max-width: 768px) 82vw, 25vw" className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.035]" />
          {product.isNew ? <span className="absolute start-2.5 top-2.5 rounded-full bg-white/90 px-2.5 py-1 text-[0.6rem] font-medium shadow-sm backdrop-blur sm:start-3 sm:top-3">جدید</span> : null}
          {product.isSale ? <span className="absolute start-2.5 top-2.5 rounded-full bg-wine px-2.5 py-1 text-[0.6rem] font-medium text-white shadow-sm sm:start-3 sm:top-3">ویژه</span> : null}
        </div>
        <div className="border-x border-b border-black/[0.07] bg-white px-3 pb-3.5 pt-3 sm:px-4 sm:pb-4 sm:pt-4">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-[0.58rem] font-medium tracking-[0.15em] text-muted-foreground sm:text-[0.62rem]" dir="ltr">{product.brand}</p>
            <p className="flex shrink-0 items-center gap-1 text-[0.62rem] text-muted-foreground"><span className={`size-1.5 rounded-full ${product.availability === "in-stock" ? "bg-emerald-600" : "bg-amber-500"}`} />{product.availability === "in-stock" ? "آماده ارسال" : "سفارشی"}</p>
          </div>
          <h3 className="mt-2 line-clamp-2 min-h-11 text-sm font-medium leading-6 sm:min-h-0 sm:text-lg">{product.name}</h3>
          <p className="mt-2.5 whitespace-nowrap text-sm font-semibold text-wine sm:text-base">{priceFormatter.format(product.price)} <span className="text-[0.62rem] font-normal text-muted-foreground sm:text-xs">تومان</span></p>
          <div className="mt-3 flex items-center gap-1.5" aria-label={`رنگ‌های ${product.name}`}>{product.colors.map((color) => <span key={color} title={color} className="size-3 rounded-full border border-black/15 ring-1 ring-white sm:size-3.5" style={{ backgroundColor: colorValues[color] ?? "#d8d2ca" }} />)}</div>
        </div>
      </Link>
      <ProductSaveButton product={product} className="absolute end-2.5 top-2.5 z-20 size-9 border-white/60 sm:end-3 sm:top-3 sm:size-10" />
    </article>
  );
}
