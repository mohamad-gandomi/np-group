import type { MetadataRoute } from "next";

import { siteConfig } from "@/config/site";
import { getCatalogCategories, getCatalogProducts } from "@/features/catalog/payload-catalog-repository";
import { journalPosts } from "@/features/journal/posts";
import { absoluteJournalUrl } from "@/features/journal/seo";
import { brands, projects } from "@/features/showcase/data";
import { absoluteShowcaseUrl } from "@/features/showcase/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories, products] = await Promise.all([getCatalogCategories(), getCatalogProducts()]);
  const routes = [
    { path: "", priority: 1, changeFrequency: "weekly" as const },
    { path: "/shop", priority: 0.9, changeFrequency: "daily" as const },
    { path: "/about", priority: 0.7, changeFrequency: "monthly" as const },
    { path: "/contact", priority: 0.7, changeFrequency: "monthly" as const },
    ...categories.map((category) => ({ path: `/shop/${category.slug}`, priority: 0.8, changeFrequency: "daily" as const })),
    ...products.map((product) => ({ path: `/shop/${product.category}/${product.slug}`, priority: 0.7, changeFrequency: "weekly" as const })),
  ];
  return [
    ...routes.map((route) => ({ url: `${siteConfig.url}${route.path}`, changeFrequency: route.changeFrequency, priority: route.priority })),
    { url: absoluteJournalUrl("/blog"), lastModified: journalPosts.reduce((latest, post) => post.updatedAt > latest ? post.updatedAt : latest, journalPosts[0].updatedAt), changeFrequency: "weekly", priority: 0.8 },
    ...journalPosts.map((post) => ({ url: absoluteJournalUrl(`/blog/${post.slug}`), lastModified: post.updatedAt, changeFrequency: "monthly" as const, priority: 0.7, images: [absoluteJournalUrl(post.image)] })),
    ...[{ kind: "projects", records: projects }, { kind: "brands", records: brands }].flatMap(({ kind, records }) => {
      const published = records.filter((record) => record.publication.status === "published");
      if (!published.length) return [];
      return [
        { url: absoluteShowcaseUrl(`/${kind}`), changeFrequency: "monthly" as const, priority: 0.7 },
        ...published.flatMap((record) => record.publication.status === "published" ? [{ url: absoluteShowcaseUrl(`/${kind}/${record.slug}`), lastModified: record.publication.updatedAt, changeFrequency: "monthly" as const, priority: 0.6, images: [absoluteShowcaseUrl(record.image.src)] }] : []),
      ];
    }),
  ];
}
