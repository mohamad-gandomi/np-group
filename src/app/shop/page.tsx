import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, SlidersHorizontal } from "lucide-react";

import { ProductCard } from "@/components/product-card";
import { SectionHeading } from "@/components/section-heading";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { categories, products } from "@/data/catalog";

export const metadata = {
  title: "فروشگاه",
  description: "مجموعه‌ای از مبلمان، روشنایی و جزئیات انتخاب‌شده برای فضاهای ماندگار.",
};

export default function ShopPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="bg-ink py-20 text-white sm:py-28 lg:py-36">
          <div className="container-shell grid gap-10 lg:grid-cols-[1fr_0.8fr] lg:items-end">
            <div>
              <p className="mb-5 flex items-center gap-2 text-xs tracking-[0.16em] text-white/65"><span className="h-px w-8 bg-wine" /> فروشگاه ام‌پی</p>
              <h1 className="text-balance max-w-4xl text-5xl font-medium leading-[1.15] tracking-tight sm:text-7xl">انتخاب‌هایی برای <span className="text-wine">ماندن.</span></h1>
            </div>
            <p className="max-w-md border-t border-white/20 pt-6 text-sm leading-8 text-white/65 lg:border-t-0 lg:border-e lg:pe-8 lg:pt-0 sm:text-base">محصولات را بر اساس دسته‌بندی ببینید و برای انتخاب دقیق‌تر، از مشاوره تخصصی ام‌پی کمک بگیرید.</p>
          </div>
        </section>

        <section className="border-b py-14 sm:py-20">
          <div className="container-shell">
            <SectionHeading eyebrow="دسته‌بندی‌ها" title="برای شروع، یک مسیر انتخاب کنید" />
            <div className="grid gap-3 md:grid-cols-5 lg:gap-5">
              {categories.map((category) => (
                <Link key={category.title} href="#products" className="group relative min-h-56 overflow-hidden">
                  <Image src={category.image} alt={`دسته‌بندی ${category.title}`} fill sizes="(max-width: 768px) 100vw, 20vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />
                  <div className="image-wash absolute inset-0" />
                  <div className="absolute inset-x-0 bottom-0 p-5 text-white"><p className="mb-1 text-xs text-white/65">{category.count}</p><h2 className="text-xl font-medium">{category.title}</h2></div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section id="products" className="bg-card py-14 sm:py-20 lg:py-28">
          <div className="container-shell">
            <div className="mb-8 flex flex-wrap items-end justify-between gap-5 md:mb-12">
              <div>
                <p className="mb-3 flex items-center gap-2 text-[0.68rem] font-semibold tracking-[0.16em] text-wine"><span className="h-px w-8 bg-wine" /> مجموعه منتخب</p>
                <h2 className="text-3xl font-medium sm:text-5xl">محصولات ام‌پی</h2>
              </div>
              <Button variant="outline" className="h-10 rounded-none gap-2"><SlidersHorizontal className="size-4" /> فیلتر و مرتب‌سازی</Button>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-6 lg:gap-y-14">
              {products.map((product) => <ProductCard key={product.name} product={product} />)}
            </div>
          </div>
        </section>

        <section className="border-t py-16 sm:py-24">
          <div className="container-shell flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
            <div><p className="mb-3 text-xs font-semibold tracking-[0.16em] text-wine">نیاز به راهنمایی دارید؟</p><h2 className="max-w-2xl text-3xl font-medium leading-[1.35] sm:text-4xl">انتخاب درست، با یک گفت‌وگو ساده‌تر می‌شود.</h2></div>
            <Button asChild className="h-11 rounded-none bg-wine px-5 hover:bg-ink"><Link href="/#contact">درخواست مشاوره <ArrowLeft /></Link></Button>
          </div>
        </section>
      </main>
    </>
  );
}
