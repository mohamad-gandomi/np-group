import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getCatalogProductPaths, getProductBySlug, getRelatedProducts } from "@/features/catalog/payload-catalog-repository";
import { ProductView } from "@/features/product/components/product-view";

type Props = { params: Promise<{ category: string; product: string }> };

export const revalidate = 300;

export function generateStaticParams() {
  return getCatalogProductPaths();
}

async function resolveProduct(category: string, slug: string) {
  const payloadProduct = await getProductBySlug(slug);
  return payloadProduct?.category === category ? payloadProduct : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category, product: slug } = await params;
  const product = await resolveProduct(category, slug);
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
  const product = await resolveProduct(category, slug);
  if (!product) notFound();
  return <ProductView product={product} relatedProducts={await getRelatedProducts(product)} />;
}
