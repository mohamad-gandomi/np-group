import Image from "next/image";
import { ArrowDown } from "lucide-react";
import { categories } from "@/features/catalog/catalog-data";
import { BrandCard, Breadcrumbs, ProjectConsultation, ShowcaseSchema, faNumber } from "@/features/showcase/components";
import { brandProducts, brands, directoryRecords } from "@/features/showcase/data";
import { ShowcaseExplorer } from "@/features/showcase/explorer";
import { showcaseMetadata } from "@/features/showcase/seo";

export const metadata = showcaseMetadata("brands");
export default function BrandsPage() {
  const records = directoryRecords(brands);
  return <main className="showcase" id="showcase-main" tabIndex={-1}><ShowcaseSchema kind="brands" /><div className="showcase-shell">
    <Breadcrumbs kind="brands" />
    <header className="showcase-brand-intro"><div className="showcase-brand-intro-copy"><p className="showcase-eyebrow">نام‌ها و نگاه‌ها <span dir="ltr">NP / COLLECTIONS</span></p><h1>انتخاب خوب،<br />از <em>شناخت</em> شروع می‌شود.</h1><p>مبلمان، نور و جزئیات؛ مجموعه‌ها را بشناسید و از میان آن‌ها، انتخاب خودتان را پیدا کنید.</p><a className="showcase-text-link" href="#brand-directory">دیدن برندها <ArrowDown size={18} aria-hidden="true" /></a></div><div className="showcase-brand-intro-image"><Image src="/placeholders/sofa.jpg" alt="کاناپه سبز با پایه چوبی؛ تصویر نمایشی برای معرفی مجموعه‌ها" fill sizes="(max-width: 900px) 100vw, 45vw" preload className="object-cover" /><span dir="ltr">FORM. MATERIAL. EVERYDAY.</span></div></header>
    <section className="showcase-section" id="brand-directory"><div className="showcase-section-heading"><div><p className="showcase-eyebrow">یک مجموعه، نگاه‌های متفاوت</p><h2>فهرست برندها</h2></div><span className="showcase-small-label">{faNumber(records.length)} نام در کاتالوگ</span></div><ShowcaseExplorer kind="brands" filters={categories.map((category) => ({ value: category.slug, label: category.title }))} entries={records.map((brand) => { const collection = brandProducts(brand); const categorySlugs = [...new Set(collection.map((product) => product.category))]; return { id: brand.slug, search: `${brand.name} ${brand.title} ${brand.description} ${collection.map((product) => product.name).join(" ")} ${categories.filter((category) => categorySlugs.includes(category.slug)).map((category) => category.title).join(" ")}`, categories: categorySlugs, card: <BrandCard brand={brand} /> }; })} /></section>
    <ProjectConsultation />
  </div></main>;
}
