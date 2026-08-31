import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowDown } from "lucide-react";
import { Breadcrumbs, ProjectCard, ProjectConsultation, ShowcaseSchema, faNumber } from "@/features/showcase/components";
import { projects, directoryRecords, sectorLabels } from "@/features/showcase/data";
import { ShowcaseExplorer } from "@/features/showcase/explorer";
import { showcaseMetadata } from "@/features/showcase/seo";

export const metadata = showcaseMetadata("projects");

export default function ProjectsPage() {
  const records = directoryRecords(projects);
  const featured = records[0];
  return <main className="showcase" id="showcase-main" tabIndex={-1}>
    <ShowcaseSchema kind="projects" />
    <div className="showcase-shell">
      <Breadcrumbs kind="projects" />
      <header className="showcase-masthead"><div><p className="showcase-eyebrow">فضا، فراتر از محصول <span dir="ltr">NP / SPACES</span></p><h1>هر فضا،<br />یک <em>روایت تازه.</em></h1></div><div className="showcase-masthead-note"><p>از مقیاس یک صندلی تا حس یک فضا؛ ایده‌هایی برای دیدنِ مبلمان، نور و جزئیات در کنار هم.</p><a href="#project-directory" className="showcase-text-link">کشف فضاها <ArrowDown size={18} aria-hidden="true" /></a></div></header>
      <section className="showcase-featured" aria-labelledby="featured-title"><div className="showcase-featured-image"><Image src={featured.image.src} alt={featured.image.alt} fill sizes="(max-width: 900px) 100vw, 65vw" preload className="object-cover" /></div><div className="showcase-featured-copy"><p className="showcase-eyebrow">{sectorLabels[featured.sector]} {featured.publication.status === "demo" ? " / مطالعه نمایشی" : ""}</p><span className="showcase-featured-number" aria-hidden="true">۰۱</span><div><h2 id="featured-title">{featured.title}</h2><p>{featured.description}</p><Link className="showcase-text-link" href={`/projects/${featured.slug}`}>روایت این فضا <ArrowLeft size={18} aria-hidden="true" /></Link></div></div></section>
      <section id="project-directory" className="showcase-section"><div className="showcase-section-heading"><div><p className="showcase-eyebrow">برای دیدن، برای الهام گرفتن</p><h2>فضاهای قابل کشف</h2></div><span className="showcase-small-label">{faNumber(records.length)} روایت از فضا</span></div><ShowcaseExplorer kind="projects" filters={Object.entries(sectorLabels).map(([value, label]) => ({ value, label }))} entries={records.map((project, index) => ({ id: project.slug, search: `${project.title} ${project.description} ${sectorLabels[project.sector]}`, categories: [project.sector], card: <ProjectCard project={project} index={index} /> }))} /></section>
      <ProjectConsultation />
    </div>
  </main>;
}
