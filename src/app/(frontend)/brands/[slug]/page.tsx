import { ShowcaseSlider } from "@/features/showcase/slider";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowDown } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { categories } from "@/features/catalog/catalog-data";
import { BrandCard, Breadcrumbs, ProjectCard, ProjectConsultation, ShowcaseSchema, faNumber } from "@/features/showcase/components";
import { brandProducts, brands, directoryRecords, getBrand, projects } from "@/features/showcase/data";
import { showcaseMetadata } from "@/features/showcase/seo";

type Props = { params: Promise<{ slug: string }> };
export const dynamicParams = false;
export function generateStaticParams() { return brands.map(({ slug }) => ({ slug })); }
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const brand = getBrand((await params).slug);
  if (!brand) return { title: "برند پیدا نشد", robots: { index: false, follow: true } };
  return showcaseMetadata("brands", brand);
}
export default async function BrandPage({ params }: Props) {
  const brand = getBrand((await params).slug);
  if (!brand) notFound();
  const collection = brandProducts(brand);
  const groups = categories.filter((category) => collection.some((product) => product.category === category.slug));
  const concepts = directoryRecords(projects).filter((project) => collection.some((product) => project.productIds.includes(product.id))).slice(0, 2);
  const related = directoryRecords(brands).filter((item) => item.slug !== brand.slug).slice(0, 3);
  return <main className="showcase" id="showcase-main" tabIndex={-1}><ShowcaseSchema kind="brands" record={brand} /><div className="showcase-shell"><Breadcrumbs kind="brands" title={brand.name} />
    <header className={`showcase-brand-hero showcase-brand-hero--${brand.slug}`}><div className="showcase-brand-hero-copy"><p className="showcase-eyebrow">مجموعه {brand.publication.status === "demo" ? "نمایشی" : "منتخب"} / {groups.map((category) => category.title).join(" و ")}</p><h1 dir="rtl"><bdi>{brand.name}</bdi></h1><p className="showcase-brand-tagline">{brand.title}</p><p>{brand.description}</p><a className="showcase-text-link" href="#brand-products">کشف {faNumber(collection.length)} محصول <ArrowDown size={18} aria-hidden="true" /></a></div><figure><div className="showcase-brand-hero-image"><Image src={brand.image.src} alt={brand.image.alt} fill sizes="(max-width: 900px) 100vw, 55vw" preload className="object-cover" /></div><figcaption>{brand.image.caption}</figcaption></figure></header>
    <section className="showcase-brand-story showcase-section"><div><p className="showcase-eyebrow">نگاهی به مجموعه</p><h2>{brand.title}</h2></div><div><p className="showcase-lead">{brand.story}</p><div className="showcase-category-links">{groups.map((category) => <a key={category.slug} href={`#collection-${category.slug}`}>{category.title} <ArrowDown size={16} aria-hidden="true" /></a>)}</div></div></section>
    <section className="showcase-section" id="brand-products"><div className="showcase-section-heading"><div><p className="showcase-eyebrow">انتخاب از مجموعه</p><h2>محصولات <bdi>{brand.name}</bdi></h2></div><Link href={`/shop?brand=${encodeURIComponent(brand.name)}`} className="showcase-text-link">مقایسه در فروشگاه <ArrowLeft size={18} aria-hidden="true" /></Link></div>{groups.map((category) => <section className="showcase-product-group" id={`collection-${category.slug}`} key={category.slug}><h3>{category.title} <span>{faNumber(collection.filter((product) => product.category === category.slug).length)} محصول</span></h3><ShowcaseSlider label={`محصولات ${brand.name}؛ ${category.title}`}>{collection.filter((product) => product.category === category.slug).map((product) => <ProductCard key={product.id} product={product} />)}</ShowcaseSlider></section>)}</section>
    {!!concepts.length && <section className="showcase-section"><div className="showcase-section-heading"><div><p className="showcase-eyebrow">انتخاب در متن فضا</p><h2>ایده‌هایی برای کنار هم چیدن</h2></div><Link className="showcase-text-link" href="/projects">همه فضاها <ArrowLeft size={18} aria-hidden="true" /></Link></div><p className="showcase-section-note">در این مطالعات، محصولاتی از این مجموعه پیشنهاد شده‌اند؛ تصاویر، مدرک اجرای پروژه یا حضور محصول نیستند.</p><ShowcaseSlider variant="projects" label="ایده‌هایی برای کنار هم چیدن">{concepts.map((project, index) => <ProjectCard key={project.slug} project={project} index={index} />)}</ShowcaseSlider></section>}
    <section className="showcase-section"><div className="showcase-section-heading"><h2>نام‌های دیگر، انتخاب‌های تازه</h2><Link href="/brands" className="showcase-text-link">همه برندها <ArrowLeft size={18} aria-hidden="true" /></Link></div><ShowcaseSlider variant="brands" label="برندهای دیگر">{related.map((item) => <BrandCard key={item.slug} brand={item} />)}</ShowcaseSlider></section>
    <ProjectConsultation />
  </div></main>;
}
