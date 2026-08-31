import type { MetadataRoute } from "next";

import { siteConfig } from "@/config/site";
import { categories, products } from "@/features/catalog/catalog-data";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    { path: "", priority: 1, changeFrequency: "weekly" as const },
    { path: "/shop", priority: 0.9, changeFrequency: "daily" as const },
    { path: "/about", priority: 0.7, changeFrequency: "monthly" as const },
    { path: "/contact", priority: 0.7, changeFrequency: "monthly" as const },
    ...categories.map((category) => ({ path: `/shop/${category.slug}`, priority: 0.8, changeFrequency: "daily" as const })),
    ...products.map((product) => ({ path: `/shop/${product.category}/${product.slug}`, priority: 0.7, changeFrequency: "weekly" as const })),
  ];
  return routes.map((route) => ({ url: `${siteConfig.url}${route.path}`, lastModified: new Date(), changeFrequency: route.changeFrequency, priority: route.priority }));
}
