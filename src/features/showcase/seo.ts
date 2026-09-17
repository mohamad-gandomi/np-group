import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import type { BrandProfile, Project } from "./data";

export type ShowcaseKind = "projects" | "brands";
export const sectionNames = { projects: "پروژه‌ها", brands: "برندها" };
const descriptions = {
  projects: "پروژه‌ها و مطالعات چیدمان و تجهیز فضا؛ از ایده و متریال تا پیشنهاد مبلمان و روشنایی.",
  brands: "کاوش برندها و مجموعه‌های منتخب ان‌پی؛ مبلمان، روشنایی، میز و جزئیات.",
};
export const absoluteShowcaseUrl = (path: string) => new URL(path, siteConfig.url).href;
export const recordTitle = (record: BrandProfile | Project) => "name" in record ? `${record.name}؛ ${record.title}` : record.title;

export function showcaseMetadata(kind: ShowcaseKind, record?: BrandProfile | Project, records: readonly (BrandProfile | Project)[] = []): Metadata {
  const index = record ? record.publication.status === "published" : records.length > 0;
  const title = record ? recordTitle(record) : `${sectionNames[kind]}؛ انتخاب از نگاه فضا`;
  const description = record?.description ?? descriptions[kind];
  const path = `/${kind}${record ? `/${record.slug}` : ""}`;
  const source = record?.image.src ? record.image : records.find((item) => item.image.src)?.image;
  const images = source ? [{ url: source.src, alt: source.alt }] : undefined;
  return {
    title, description, alternates: { canonical: path },
    robots: { index, follow: true, googleBot: { index, follow: true, "max-image-preview": "large" } },
    openGraph: { title, description, url: path, siteName: `گروه ${siteConfig.nameFa}`, type: "website", locale: "fa_IR", ...(images ? { images } : {}) },
    twitter: { card: images ? "summary_large_image" : "summary", title, description, ...(images ? { images } : {}) },
  };
}

export function showcaseSchema(kind: ShowcaseKind, record?: BrandProfile | Project, records: readonly (BrandProfile | Project)[] = []) {
  const url = absoluteShowcaseUrl(`/${kind}${record ? `/${record.slug}` : ""}`);
  const crumbs = [{ name: "خانه", item: absoluteShowcaseUrl("/") }, { name: sectionNames[kind], item: absoluteShowcaseUrl(`/${kind}`) }, ...(record ? [{ name: recordTitle(record), item: url }] : [])];
  return {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "BreadcrumbList", "@id": `${url}#breadcrumbs`, itemListElement: crumbs.map((crumb, index) => ({ "@type": "ListItem", position: index + 1, ...crumb })) },
      {
        "@type": record ? "WebPage" : "CollectionPage", "@id": url, url,
        name: record ? recordTitle(record) : sectionNames[kind], description: record?.description ?? descriptions[kind], inLanguage: "fa-IR",
        breadcrumb: { "@id": `${url}#breadcrumbs` },
        ...(record ? {
          ...(record.image.src ? { image: absoluteShowcaseUrl(record.image.src) } : {}),
          ...(record.publication.status === "published" ? { dateModified: record.publication.updatedAt } : {}),
          ...(kind === "projects" ? { mainEntity: { "@type": "CreativeWork", name: record.title, description: record.description, url, inLanguage: "fa-IR" } } : record.publication.status === "published" && "name" in record ? { mainEntity: { "@type": "Brand", name: record.name, description: record.description, url } } : {}),
        } : {
          mainEntity: { "@type": "ItemList", numberOfItems: records.length, itemListElement: records.map((item, index) => ({ "@type": "ListItem", position: index + 1, name: recordTitle(item), url: absoluteShowcaseUrl(`/${kind}/${item.slug}`) })) },
        }),
      },
    ],
  };
}
