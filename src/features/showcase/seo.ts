import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { brands, projects, directoryRecords, type BrandProfile, type Project } from "./data";

export type ShowcaseKind = "projects" | "brands";
export const sectionNames = { projects: "پروژه‌ها", brands: "برندها" };
const descriptions = {
  projects: "مطالعات نمایشی چیدمان و تجهیز فضا؛ از ایده و متریال تا پیشنهاد مبلمان و روشنایی. نمونه‌های فعلی پروژه اجراشده نیستند.",
  brands: "کاوش نام‌ها و مجموعه‌های کاتالوگ نمایشی ان‌پی؛ مبلمان، روشنایی، میز و جزئیات. اطلاعات برندهای فعلی هنوز تأیید نشده‌اند.",
};
export const absoluteShowcaseUrl = (path: string) => new URL(path, siteConfig.url).href;
export const recordTitle = (record: BrandProfile | Project) => "name" in record ? `${record.name}؛ ${record.title}` : record.title;

export function showcaseMetadata(kind: ShowcaseKind, record?: BrandProfile | Project): Metadata {
  const records = kind === "projects" ? directoryRecords(projects) : directoryRecords(brands);
  const index = record ? record.publication.status === "published" : records.some((item) => item.publication.status === "published");
  const title = record ? recordTitle(record) : `${sectionNames[kind]}؛ انتخاب از نگاه فضا`;
  const description = record?.description ?? descriptions[kind];
  const path = `/${kind}${record ? `/${record.slug}` : ""}`;
  const source = record?.image ?? records[0].image;
  const image = { url: source.src, alt: source.alt };
  return {
    title, description, alternates: { canonical: path },
    robots: { index, follow: true, googleBot: { index, follow: true, "max-image-preview": "large" } },
    openGraph: { title, description, url: path, siteName: `گروه ${siteConfig.nameFa}`, type: "website", locale: "fa_IR", images: [image] },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

export function showcaseSchema(kind: ShowcaseKind, record?: BrandProfile | Project) {
  const records = kind === "projects" ? directoryRecords(projects) : directoryRecords(brands);
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
          image: absoluteShowcaseUrl(record.image.src),
          ...(record.publication.status === "published" ? { dateModified: record.publication.updatedAt } : {}),
          ...(kind === "projects" ? { mainEntity: { "@type": "CreativeWork", name: record.title, description: record.description, url, inLanguage: "fa-IR" } } : record.publication.status === "published" && "name" in record ? { mainEntity: { "@type": "Brand", name: record.name, description: record.description, url } } : {}),
        } : {
          mainEntity: { "@type": "ItemList", numberOfItems: records.length, itemListElement: records.map((item, index) => ({ "@type": "ListItem", position: index + 1, name: recordTitle(item), url: absoluteShowcaseUrl(`/${kind}/${item.slug}`) })) },
        }),
      },
    ],
  };
}
