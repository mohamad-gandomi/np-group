import Link from "next/link";

import { ProductCard } from "@/components/product-card";
import { SectionHeading } from "@/components/section-heading";
import { siteConfig } from "@/config/site";
import { getCategory } from "@/features/catalog/catalog-data";
import type { Product } from "@/features/catalog/catalog-types";
import { getProductPresentation, getRelatedProducts } from "../product-details";
import { ProductGallery } from "./product-gallery";
import { ProductSpecifications } from "./product-specifications";
import { ProductSummary } from "./product-summary";

export function ProductView({ product }: { product: Product }) {
  const details = getProductPresentation(product);
  const category = getCategory(product.category);
  const categoryTitle = category?.title ?? "مبلمان خانگی";
  const related = getRelatedProducts(product);
  const path = `/shop/${product.category}/${product.slug}`;
  const schemas = [
    { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
      { "@type": "ListItem", position: 1, name: "خانه", item: siteConfig.url },
      { "@type": "ListItem", position: 2, name: "فروشگاه", item: `${siteConfig.url}/shop` },
      { "@type": "ListItem", position: 3, name: categoryTitle, item: `${siteConfig.url}/shop/${product.category}` },
      { "@type": "ListItem", position: 4, name: product.name, item: `${siteConfig.url}${path}` },
    ] },
    { "@context": "https://schema.org", "@type": "Product", name: product.name, image: details.gallery.map((image) => `${siteConfig.url}${image}`), description: details.description, sku: product.variants?.map((variant) => variant.code).join(", ") || product.id, brand: { "@type": "Brand", name: product.brand }, material: product.material.join("، "), color: product.colors.join("، "), ...(product.width === null ? {} : { width: { "@type": "QuantitativeValue", value: product.width, unitCode: "CMT" } }), ...(product.price === null ? {} : { offers: { "@type": "Offer", url: `${siteConfig.url}${path}`, priceCurrency: "IRR", price: product.price * 10, availability: product.availability === "in-stock" ? "https://schema.org/InStock" : "https://schema.org/PreOrder" } }) },
  ];

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas) }} />
      <div className="container-shell py-6 sm:py-9">
        <nav className="mb-6 flex flex-wrap items-center gap-2 text-xs text-muted-foreground" aria-label="مسیر صفحه"><Link href="/">خانه</Link><span>/</span><Link href="/shop">فروشگاه</Link><span>/</span><Link href={`/shop/${product.category}`}>{categoryTitle}</Link><span>/</span><span className="text-foreground">{product.name}</span></nav>
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.5fr)_minmax(20rem,0.72fr)] lg:items-start xl:gap-12" dir="rtl">
          <ProductGallery images={details.gallery} name={product.name} brand={product.brand} />
          <div dir="rtl"><ProductSummary product={product} description={details.description} depth={details.depth} height={details.height} leadTime={details.leadTime} /></div>
        </div>
      </div>

      <section className="border-y bg-card py-14 sm:py-20"><div className="container-shell"><div className="mb-8 max-w-2xl"><p className="text-xs font-semibold tracking-[0.16em] text-wine">جزئیات محصول</p><h2 className="mt-3 text-3xl font-medium sm:text-4xl">اطلاعاتی برای انتخاب مطمئن‌تر</h2></div><ProductSpecifications product={product} depth={details.depth} height={details.height} warranty={details.warranty} assembly={details.assembly} care={details.care} /></div></section>

      {related.length ? <section className="py-16 sm:py-24"><div className="container-shell"><SectionHeading eyebrow="انتخاب‌های نزدیک" title="محصولات مرتبط" link="مشاهده مجموعه" href={`/shop/${product.category}`} /><div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3">{related.map((item) => <ProductCard key={item.id} product={item} />)}</div></div></section> : null}
    </main>
  );
}
