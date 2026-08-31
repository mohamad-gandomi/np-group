import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowUpLeft } from "lucide-react";
import { categories } from "@/features/catalog/catalog-data";
import { brandProducts, sectorLabels, type BrandProfile, type Project, type ShowcaseImage } from "./data";
import { sectionNames, showcaseSchema, type ShowcaseKind } from "./seo";

export const faNumber = (value: number) => new Intl.NumberFormat("fa-IR").format(value);
export function ShowcaseSchema({ kind, record }: { kind: ShowcaseKind; record?: Project | BrandProfile }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(showcaseSchema(kind, record)).replace(/</g, "\\u003c") }} />;
}
export function Breadcrumbs({ kind, title }: { kind: ShowcaseKind; title?: string }) {
  return <nav className="showcase-breadcrumbs" aria-label="مسیر صفحه"><ol><li><Link href="/">خانه</Link></li><li>{title ? <Link href={`/${kind}`}>{sectionNames[kind]}</Link> : <span aria-current="page">{sectionNames[kind]}</span>}</li>{title && <li><span aria-current="page">{title}</span></li>}</ol></nav>;
}
export function EditorialImage({ image, hero = false, className = "" }: { image: ShowcaseImage; hero?: boolean; className?: string }) {
  return <figure className={`showcase-figure ${className}`}><div className="showcase-image"><Image src={image.src} alt={image.alt} fill sizes={hero ? "(max-width: 1280px) 100vw, 1280px" : "(max-width: 760px) 100vw, 50vw"} preload={hero} className="object-cover" /></div><figcaption>{image.caption}</figcaption></figure>;
}
export function ProjectCard({ project, index = 0 }: { project: Project; index?: number }) {
  return <article className="showcase-project-card"><Link href={`/projects/${project.slug}`} aria-labelledby={`project-${project.slug}`}><div className="showcase-card-image"><Image src={project.image.src} alt={project.image.alt} fill sizes="(max-width: 760px) 100vw, 50vw" className="object-cover" /><span className="showcase-image-tag">{sectorLabels[project.sector]}{project.publication.status === "demo" ? " · کانسپت نمایشی" : ""}</span><span className="showcase-card-arrow"><ArrowUpLeft size={24} aria-hidden="true" /></span></div><div className="showcase-project-card-caption"><span className="showcase-index" aria-hidden="true">{faNumber(index + 1).padStart(2, "۰")}</span><div><h3 id={`project-${project.slug}`}>{project.title}</h3><p>{project.description}</p></div></div></Link></article>;
}
export function BrandCard({ brand }: { brand: BrandProfile }) {
  const collection = brandProducts(brand);
  const labels = categories.filter((category) => collection.some((product) => product.category === category.slug)).map((category) => category.title);
  return <article className="showcase-brand-card"><Link href={`/brands/${brand.slug}`} aria-labelledby={`brand-${brand.slug}`}><div className={`showcase-wordmark showcase-wordmark--${brand.slug}`}><h3 id={`brand-${brand.slug}`} dir="ltr">{brand.name}</h3><span>{brand.title}</span></div><div className="showcase-brand-card-bottom"><div><p>{labels.join(" / ")}</p><span>{faNumber(collection.length)} محصول {brand.publication.status === "demo" ? "نمایشی" : "در کاتالوگ"}</span></div><ArrowUpLeft size={22} aria-hidden="true" /></div></Link></article>;
}
export function ProjectConsultation() {
  return <section className="showcase-consult"><div><p className="showcase-eyebrow">ایده شما، قدم بعدی</p><h2>از فضایی که در ذهن دارید، بگویید.</h2><p>ابعاد، کاربرد و حال‌وهوای دلخواهتان را همراه داشته باشید؛ گفت‌وگو را از همین‌جا شروع کنیم.</p></div><Link className="showcase-button" href="/contact">گفت‌وگو درباره پروژه <ArrowLeft size={18} aria-hidden="true" /></Link></section>;
}
export function ShowcaseNotFound({ kind }: { kind: ShowcaseKind }) {
  return <main className="showcase" id="showcase-main" tabIndex={-1}><div className="showcase-shell showcase-empty"><p className="showcase-eyebrow">۴۰۴ · {sectionNames[kind]}</p><h1>{kind === "projects" ? "این فضا پیدا نشد." : "این برند پیدا نشد."}</h1><p>ممکن است نشانی تغییر کرده باشد. از مجموعه، انتخاب دیگری را کشف کنید.</p><Link className="showcase-button" href={`/${kind}`}>بازگشت به {sectionNames[kind]} <ArrowLeft size={18} aria-hidden="true" /></Link></div></main>;
}
