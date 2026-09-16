import Image from "next/image";
import { ArrowDown } from "lucide-react";
import { BrandCard, Breadcrumbs, ProjectConsultation, ShowcaseSchema, faNumber } from "@/features/showcase/components";
import { ShowcaseExplorer } from "@/features/showcase/explorer";
import { getShowcaseBrands } from "@/features/showcase/payload-showcase-repository";
import { showcaseMetadata } from "@/features/showcase/seo";

export async function generateMetadata() {
  const records = await getShowcaseBrands();
  return showcaseMetadata("brands", undefined, records);
}

export default async function BrandsPage() {
  const records = await getShowcaseBrands();
  const categories = [...new Map(records.flatMap((brand) => brand.products).map((product) => [product.category, product.categoryTitle ?? product.category])).entries()]
    .map(([value, label]) => ({ value, label }));
  return <main className="showcase" id="showcase-main" tabIndex={-1}><ShowcaseSchema kind="brands" records={records} /><div className="showcase-shell">
    <Breadcrumbs kind="brands" />
    <header className="showcase-brand-intro"><div className="showcase-brand-intro-copy"><p className="showcase-eyebrow">نام‌ها و نگاه‌ها <span dir="ltr">NP / COLLECTIONS</span></p><h1>انتخاب خوب،<br />از <em>شناخت</em> شروع می‌شود.</h1><p>مبلمان، نور و جزئیات؛ مجموعه‌ها را بشناسید و از میان آن‌ها، انتخاب خودتان را پیدا کنید.</p><a className="showcase-text-link" href="#brand-directory">دیدن برندها <ArrowDown size={18} aria-hidden="true" /></a></div><div className="showcase-brand-intro-image"><Image src="/placeholders/sofa.jpg" alt="کاناپه سبز با پایه چوبی؛ تصویر نمایشی برای معرفی مجموعه‌ها" fill sizes="(max-width: 900px) 100vw, 45vw" preload className="object-cover" /><span dir="ltr">FORM. MATERIAL. EVERYDAY.</span></div></header>
    <section className="showcase-section" id="brand-directory"><div className="showcase-section-heading"><div><p className="showcase-eyebrow">یک مجموعه، نگاه‌های متفاوت</p><h2>فهرست برندها</h2></div><span className="showcase-small-label">{faNumber(records.length)} نام در کاتالوگ</span></div><ShowcaseExplorer kind="brands" filters={categories} entries={records.map((brand) => { const categorySlugs = [...new Set(brand.products.map((product) => product.category))]; return { id: brand.slug, search: `${brand.name} ${brand.title} ${brand.description} ${brand.products.map((product) => product.name).join(" ")} ${brand.products.map((product) => product.categoryTitle).join(" ")}`, categories: categorySlugs, card: <BrandCard brand={brand} products={brand.products} /> }; })} /></section>
    <ProjectConsultation />
  </div></main>;
}
