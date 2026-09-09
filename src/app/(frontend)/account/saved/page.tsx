"use client";

import Link from "next/link";
import { Bookmark } from "lucide-react";

import { ProductCard } from "@/components/product-card";
import { Button } from "@/components/ui/button";
import { useSaved } from "@/features/saved/saved-context";

export default function SavedProductsPage() {
  const { items } = useSaved();

  return (
    <section>
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-wine">ذخیره‌شده‌ها</p>
          <h2 className="mt-2 text-2xl font-medium">انتخاب‌های موردعلاقه شما</h2>
        </div>
        <span className="text-xs text-muted-foreground">{new Intl.NumberFormat("fa-IR").format(items.length)} محصول</span>
      </div>

      {items.length ? (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-3">
          {items.map((product) => <ProductCard key={product.id} product={product} />)}
        </div>
      ) : (
        <div className="mt-6 border border-dashed border-black/15 bg-white py-16 text-center">
          <Bookmark className="mx-auto size-10 text-wine" />
          <h3 className="mt-4 text-xl font-medium">هنوز محصولی ذخیره نکرده‌اید</h3>
          <p className="mt-2 text-sm text-muted-foreground">محصولات دلخواهتان را برای مقایسه و بررسی بعدی نگه دارید.</p>
          <Button asChild className="mt-6 rounded-none bg-wine px-6 hover:bg-ink"><Link href="/shop">مشاهده محصولات</Link></Button>
        </div>
      )}
    </section>
  );
}
