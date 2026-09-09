import type { Metadata } from "next";

import { CatalogView } from "@/features/catalog/components/catalog-view";
import { shopHref, type RawSearchParams } from "@/features/catalog/catalog-query";

type Props = { searchParams: Promise<RawSearchParams> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = await searchParams;
  const hasFilters = Object.keys(params).some((key) => key !== "page");
  return {
    title: "فروشگاه مبلمان و روشنایی",
    description: "خرید مبلمان، روشنایی، میز، پارچه و اکسسوری منتخب با امکان فیلتر بر اساس فضا، متریال، رنگ و قیمت.",
    alternates: { canonical: hasFilters ? "/shop" : shopHref("/shop", params, {}) },
    robots: hasFilters ? { index: false, follow: true } : undefined,
  };
}

export default async function ShopPage({ searchParams }: Props) {
  return <CatalogView params={await searchParams} />;
}
