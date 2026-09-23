"use client";

import { useState } from "react";
import type { Product } from "@/features/catalog/catalog-types";
import type { SalesContact } from "../payload-sales-contacts";
import { ProductGallery } from "./product-gallery";
import { ProductSummary } from "./product-summary";

export function ProductPurchase({ product, gallery, description, depth, height, leadTime, salesContacts }: {
  product: Product; gallery: readonly string[]; description: string; depth: number | null; height: number | null; leadTime: string; salesContacts: readonly SalesContact[];
}) {
  const [variantID, setVariantID] = useState<number>();
  const variantImage = product.variants?.find((variant) => variant.id === variantID)?.image;
  const images = variantImage ? [variantImage, ...gallery.filter((image) => image !== variantImage)] : gallery;
  return <div className="grid gap-8 lg:grid-cols-[minmax(0,1.5fr)_minmax(20rem,0.72fr)] lg:items-start xl:gap-12" dir="rtl">
    <ProductGallery key={variantImage ?? "product"} images={images} name={product.name} brand={product.brand} />
    <div dir="rtl"><ProductSummary product={product} description={description} depth={depth} height={height} leadTime={leadTime} salesContacts={salesContacts} onVariantChange={setVariantID} /></div>
  </div>;
}
