import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { shopHref, type RawSearchParams } from "@/features/catalog/catalog-query";
import { CatalogView } from "@/features/catalog/components/catalog-view";
import { getCatalogCategories, getCatalogCategory } from "@/features/catalog/payload-catalog-repository";

type Props = { params: Promise<{ category: string }>; searchParams: Promise<RawSearchParams> };

export async function generateStaticParams() {
  return (await getCatalogCategories()).map((category) => ({ category: category.slug }));
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { category: slug } = await params;
  const category = await getCatalogCategory(slug);
  if (!category) return {};
  const query = await searchParams;
  const path = `/shop/${slug}`;
  const hasFilters = Object.keys(query).some((key) => key !== "page");
  return { title: category.title, description: `خرید ${category.title} منتخب برای خانه و پروژه‌های داخلی.`, alternates: { canonical: hasFilters ? path : shopHref(path, query, {}) }, robots: hasFilters ? { index: false, follow: true } : undefined };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { category } = await params;
  if (!await getCatalogCategory(category)) notFound();
  return <CatalogView params={await searchParams} categorySlug={category} />;
}
