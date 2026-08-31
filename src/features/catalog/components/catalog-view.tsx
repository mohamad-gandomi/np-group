import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { ProductCard } from "@/components/product-card";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import { categories, getCategory } from "../catalog-data";
import { getCatalogResults, type RawSearchParams } from "../catalog-query";
import { ActiveFilters } from "./active-filters";
import { CatalogFilters } from "./catalog-filters";
import { CatalogPagination } from "./catalog-pagination";
import { MobileFilters } from "./mobile-filters";
import { SearchField } from "./search-field";
import { SortSelect } from "./sort-select";

const countFormatter = new Intl.NumberFormat("fa-IR");

export function CatalogView({ params, categorySlug }: { params: RawSearchParams; categorySlug?: string }) {
  const category = categorySlug ? getCategory(categorySlug) : undefined;
  const path = category ? `/shop/${category.slug}` : "/shop";
  const results = getCatalogResults(params, categorySlug);
  const rawSearch = params.q;
  const searchValue = (Array.isArray(rawSearch) ? rawSearch[0] : rawSearch) ?? "";
  const activeFilterCount = ["category", "brand", "room", "material", "color", "availability", "minPrice", "maxPrice"].reduce((total, key) => {
    const value = params[key];
    return total + (Array.isArray(value) ? value.length : value ? 1 : 0);
  }, 0);
  const breadcrumbSchema = { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
    { "@type": "ListItem", position: 1, name: "خانه", item: siteConfig.url },
    { "@type": "ListItem", position: 2, name: "فروشگاه", item: `${siteConfig.url}/shop` },
    ...(category ? [{ "@type": "ListItem", position: 3, name: category.title, item: `${siteConfig.url}${path}` }] : []),
  ] };

  return (
    <main data-page="catalog">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <section className="border-b bg-white py-10 sm:py-14">
        <div className="container-shell">
          <nav className="mb-6 flex items-center gap-2 text-xs text-muted-foreground" aria-label="مسیر صفحه"><Link href="/">خانه</Link><span>/</span>{category ? <><Link href="/shop">فروشگاه</Link><span>/</span><span className="text-foreground">{category.title}</span></> : <span className="text-foreground">فروشگاه</span>}</nav>
          <div className="grid gap-5 lg:grid-cols-[1fr_0.65fr] lg:items-end">
            <div><p className="mb-3 text-xs font-semibold tracking-[0.16em] text-wine">مجموعه محصولات</p><h1 className="text-balance text-4xl font-medium leading-[1.2] sm:text-6xl">{category?.title ?? "فروشگاه ان‌پی"}</h1></div>
            <p className="max-w-xl text-sm leading-7 text-muted-foreground lg:justify-self-end">محصولات منتخب را بر اساس فضا، متریال، رنگ و بودجه پیدا کنید؛ برای انتخاب دقیق‌تر نیز می‌توانید از مشاوره تخصصی استفاده کنید.</p>
          </div>
        </div>
      </section>

      {!category ? <section className="border-b bg-white py-6"><div className="container-shell"><div className="grid auto-cols-[72%] grid-flow-col gap-3 overflow-x-auto pb-2 [scrollbar-width:none] sm:auto-cols-[38%] lg:grid-flow-row lg:grid-cols-5 lg:overflow-visible lg:pb-0">{categories.map((item, index) => <Link key={item.slug} href={`/shop/${item.slug}`} className="group relative min-h-40 overflow-hidden"><Image src={item.image} alt={item.title} fill sizes="(max-width: 640px) 72vw, (max-width: 1024px) 38vw, 20vw" loading={index === 0 ? "eager" : "lazy"} className="object-cover transition-transform duration-500 group-hover:scale-105" /><div className="image-wash absolute inset-0" /><div className="absolute inset-x-0 bottom-0 p-4 text-white"><p className="text-xs text-white/65">{item.count}</p><h2 className="mt-1 text-lg font-medium">{item.title}</h2></div></Link>)}</div></div></section> : null}

      <section id="products" className="bg-card py-8 sm:py-12 lg:py-16">
        <div className="container-shell">
          <div className="mb-6 flex items-end justify-between gap-6">
            <div><p className="text-xs text-muted-foreground">{countFormatter.format(results.total)} محصول</p><h2 className="mt-1 text-2xl font-medium sm:text-3xl">{category?.title ?? "همه محصولات"}</h2></div>
            <div className="hidden w-full max-w-2xl items-center gap-2 lg:flex"><SearchField path={path} value={searchValue} /><SortSelect params={params} path={path} className="w-52 shrink-0" /></div>
          </div>
          <div className="sticky top-0 z-30 -mx-4 mb-6 space-y-2 border-y bg-card/95 px-4 py-3 backdrop-blur lg:hidden">
            <SearchField path={path} value={searchValue} />
            <div className="flex gap-2"><MobileFilters count={results.total} activeCount={activeFilterCount} clearHref={path}><CatalogFilters params={params} path={path} showCategories={!category} /></MobileFilters><SortSelect params={params} path={path} className="min-w-0 flex-1" /></div>
          </div>
          <ActiveFilters params={params} path={path} />
          <div className="grid gap-8 lg:grid-cols-[15rem_1fr] xl:grid-cols-[17rem_1fr]">
            <aside className="hidden lg:block" aria-label="فیلتر محصولات"><div className="filter-scrollbar sticky top-4 max-h-[calc(100svh-2rem)] overflow-y-auto bg-white" dir="ltr"><div className="p-5" dir="rtl"><CatalogFilters params={params} path={path} showCategories={!category} /></div></div></aside>
            <div>
              {results.products.length ? <div className="grid grid-cols-2 gap-x-3 gap-y-7 min-[430px]:gap-x-4 sm:gap-x-5 sm:gap-y-10 md:grid-cols-3 xl:gap-x-6">{results.products.map((product) => <ProductCard key={product.id} product={product} />)}</div> : <div className="grid min-h-80 place-items-center border bg-white p-8 text-center"><div><h2 className="text-2xl font-medium">محصولی پیدا نشد</h2><p className="mt-3 text-sm text-muted-foreground">چند فیلتر را حذف کنید و دوباره ببینید.</p><Button asChild className="mt-6 rounded-none bg-wine"><Link href={path}>پاک کردن فیلترها</Link></Button></div></div>}
              <CatalogPagination page={results.page} pageCount={results.pageCount} params={params} path={path} />
            </div>
          </div>
        </div>
      </section>

      <section className="border-t py-16 sm:py-24"><div className="container-shell flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end"><div><p className="mb-3 text-xs font-semibold tracking-[0.16em] text-wine">نیاز به راهنمایی دارید؟</p><h2 className="max-w-2xl text-3xl font-medium leading-[1.35] sm:text-4xl">انتخاب درست، با یک گفت‌وگو ساده‌تر می‌شود.</h2></div><Button asChild className="h-11 rounded-none bg-wine px-5 hover:bg-ink"><Link href="/#contact">درخواست مشاوره <ArrowLeft /></Link></Button></div></section>
    </main>
  );
}
