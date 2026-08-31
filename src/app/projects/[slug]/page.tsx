import { ShowcaseSlider } from "@/features/showcase/slider";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { brandPath } from "@/features/showcase/brand-registry";
import { Breadcrumbs, EditorialImage, ProjectCard, ProjectConsultation, ShowcaseSchema } from "@/features/showcase/components";
import { directoryRecords, getProject, projectProducts, projects, sectorLabels } from "@/features/showcase/data";
import { showcaseMetadata } from "@/features/showcase/seo";
import { journalPosts } from "@/features/journal/posts";

type Props = { params: Promise<{ slug: string }> };
// All content is known at build time; unknown URLs use the static Persian 404.
export const dynamicParams = false;
export function generateStaticParams() { return projects.map(({ slug }) => ({ slug })); }
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const project = getProject((await params).slug);
  if (!project) return { title: "فضا پیدا نشد", robots: { index: false, follow: true } };
  return showcaseMetadata("projects", project);
}
export default async function ProjectPage({ params }: Props) {
  const project = getProject((await params).slug);
  if (!project) notFound();
  const collection = projectProducts(project);
  const brandNames = [...new Set(collection.map((product) => product.brand))];
  const article = journalPosts.find((post) => post.slug === project.articleSlug);
  const related = directoryRecords(projects).filter((item) => item.slug !== project.slug).slice(0, 2);
  return <main className="showcase" id="showcase-main" tabIndex={-1}>
    <ShowcaseSchema kind="projects" record={project} />
    <div className="showcase-shell"><Breadcrumbs kind="projects" title={project.title} />
      <header className="showcase-detail-heading"><p className="showcase-eyebrow">{sectorLabels[project.sector]} / {project.publication.status === "demo" ? "کانسپت نمایشی" : "روایت پروژه"}</p><h1>{project.title}</h1><p>{project.description}</p><nav className="showcase-anchor-nav" aria-label="بخش‌های پروژه"><a href="#project-story">ایده و رویکرد</a><a href="#project-gallery">تصاویر الهام</a><a href="#project-products">پیشنهاد محصولات</a></nav></header>
      <EditorialImage image={project.image} hero className="showcase-detail-hero" />
      <section id="project-story" className="showcase-story showcase-section"><aside><p className="showcase-eyebrow">پالت پیشنهادی</p><div className="showcase-palette">{project.palette.map((swatch) => <div key={swatch.name}><span style={{ backgroundColor: swatch.color }} /><p>{swatch.name}</p></div>)}</div><dl className="showcase-facts"><div><dt>نوع فضا</dt><dd>{sectorLabels[project.sector]}</dd></div><div><dt>وضعیت محتوا</dt><dd>{project.publication.status === "demo" ? "مطالعه نمایشی؛ اجرا نشده توسط ان‌پی" : "محتوای تأییدشده"}</dd></div><div><dt>محصولات</dt><dd>انتخاب پیشنهادی برای بررسی تناسب</dd></div></dl></aside><div className="showcase-prose"><p className="showcase-eyebrow">از ایده تا انتخاب</p><h2>نگاه به این فضا</h2><p className="showcase-lead">{project.brief}</p>{project.approach.map((step, index) => <section className="showcase-approach" key={step.title}><span aria-hidden="true">۰{index + 1}</span><div><h3>{step.title}</h3><p>{step.text}</p></div></section>)}</div></section>
      <section className="showcase-section" id="project-gallery"><div className="showcase-section-heading"><div><p className="showcase-eyebrow">دفتر تصویر</p><h2>برداشت‌های دیگر از یک ایده</h2></div><p>تصاویر مستقل برای مطالعه رنگ، فرم و چیدمان</p></div><ShowcaseSlider variant="gallery" label="تصاویر الهام">{project.gallery.map((item) => <EditorialImage key={item.src} image={item} />)}</ShowcaseSlider></section>
      <section id="project-products" className="showcase-section"><div className="showcase-section-heading"><div><p className="showcase-eyebrow">از فضا به محصول</p><h2>برای نزدیک شدن به این حال‌وهوا</h2></div><Link href="/shop" className="showcase-text-link">همه محصولات <ArrowLeft size={18} aria-hidden="true" /></Link></div><p className="showcase-section-note">این محصولات پیشنهاد چیدمان هستند؛ حضور آن‌ها در تصاویر یا استفاده در یک پروژه واقعی تأیید نشده است.</p><ShowcaseSlider label="محصولات پیشنهادی">{collection.map((product) => <ProductCard key={product.id} product={product} />)}</ShowcaseSlider><div className="showcase-brand-links"><span>مجموعه‌های مرتبط</span>{brandNames.map((name) => <Link key={name} href={brandPath(name)} dir="ltr">{name}<ArrowUpLeftSmall /></Link>)}</div></section>
      {article && <aside className="showcase-reading"><p className="showcase-eyebrow">از مجله ان‌پی</p><Link href={`/blog/${article.slug}`}>{article.title}<ArrowLeft size={22} aria-hidden="true" /></Link><p>{article.description}</p></aside>}
      {!!related.length && <section className="showcase-section"><div className="showcase-section-heading"><h2>روایت بعدی را ببینید</h2><Link href="/projects" className="showcase-text-link">همه فضاها <ArrowLeft size={18} aria-hidden="true" /></Link></div><ShowcaseSlider variant="projects" label="روایت‌های دیگر">{related.map((item, index) => <ProjectCard key={item.slug} project={item} index={index} />)}</ShowcaseSlider></section>}
      <ProjectConsultation />
    </div>
  </main>;
}
function ArrowUpLeftSmall() { return <ArrowLeft size={14} aria-hidden="true" />; }
