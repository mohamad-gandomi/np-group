import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { products } from "@/features/catalog/catalog-data";
import { getProduct } from "@/features/product/product-details";
import { ProductView } from "@/features/product/components/product-view";

type Props = { params: Promise<{ category: string; product: string }> };

export function generateStaticParams() {
  return products.map((product) => ({ category: product.category, product: product.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category, product: slug } = await params;
  const product = getProduct(category, slug);
  if (!product) return {};
  const path = `/shop/${category}/${slug}`;
  return {
    title: product.name,
    description: `خرید و سفارش ${product.name} از برند ${product.brand}؛ مشاهده مشخصات، متریال، رنگ‌ها و ابعاد محصول.`,
    alternates: { canonical: path },
    openGraph: { title: product.name, description: `${product.name} از مجموعه ${product.brand}`, images: [{ url: product.image }] },
  };
}

export default async function ProductPage({ params }: Props) {
  const { category, product: slug } = await params;
  const product = getProduct(category, slug);
  if (!product) notFound();
  return <ProductView product={product} />;
}
