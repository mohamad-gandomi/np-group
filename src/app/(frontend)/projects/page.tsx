import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowDown } from "lucide-react";
import { Breadcrumbs, ProjectCard, ProjectConsultation, ShowcaseSchema, faNumber } from "@/features/showcase/components";
import { sectorLabels } from "@/features/showcase/data";
import { ShowcaseExplorer } from "@/features/showcase/explorer";
import { getShowcaseProjects } from "@/features/showcase/payload-showcase-repository";
import { showcaseMetadata } from "@/features/showcase/seo";

export async function generateMetadata() {
  const records = await getShowcaseProjects();
  return showcaseMetadata("projects", undefined, records);
}

export default async function ProjectsPage() {
  const records = await getShowcaseProjects();
  const featured = records[0];
  return <main className="showcase" id="showcase-main" tabIndex={-1}>
    <ShowcaseSchema kind="projects" records={records} />
    <div className="showcase-shell">
      <Breadcrumbs kind="projects" />
      <header className="showcase-masthead"><div><p className="showcase-eyebrow">فضا، فراتر از محصول <span dir="ltr">NP / SPACES</span></p><h1>هر فضا،<br />یک <em>روایت تازه.</em></h1></div><div className="showcase-masthead-note"><p>از مقیاس یک صندلی تا حس یک فضا؛ ایده‌هایی برای دیدنِ مبلمان، نور و جزئیات در کنار هم.</p><a href="#project-directory" className="showcase-text-link">کشف فضاها <ArrowDown size={18} aria-hidden="true" /></a></div></header>
      {featured ? <section className="showcase-featured" aria-labelledby="featured-title"><div className="showcase-featured-image">{featured.image.src ? <Image src={featured.image.src} alt={featured.image.alt} fill sizes="(max-width: 900px) 100vw, 65vw" preload className="object-cover" /> : null}</div><div className="showcase-featured-copy"><p className="showcase-eyebrow">{sectorLabels[featured.sector]}</p><span className="showcase-featured-number" aria-hidden="true">۰۱</span><div><h2 id="featured-title">{featured.title}</h2><p>{featured.description}</p><Link className="showcase-text-link" href={`/projects/${featured.slug}`}>روایت این فضا <ArrowLeft size={18} aria-hidden="true" /></Link></div></div></section> : <div className="showcase-inline-empty"><p>هنوز پروژه‌ای برای نمایش عمومی منتشر نشده است.</p></div>}
      <section id="project-directory" className="showcase-section"><div className="showcase-section-heading"><div><p className="showcase-eyebrow">برای دیدن، برای الهام گرفتن</p><h2>فضاهای قابل کشف</h2></div><span className="showcase-small-label">{faNumber(records.length)} روایت از فضا</span></div><ShowcaseExplorer kind="projects" filters={Object.entries(sectorLabels).map(([value, label]) => ({ value, label }))} entries={records.map((project, index) => ({ id: project.slug, search: `${project.title} ${project.description} ${sectorLabels[project.sector]}`, categories: [project.sector], card: <ProjectCard project={project} index={index} /> }))} /></section>
      <ProjectConsultation />
    </div>
  </main>;
}
