import type { Product } from "@/features/catalog/catalog-types";

type ProductPresentation = {
  description: string;
  leadTime: string;
  warranty: string;
  assembly: string;
  care: string;
  gallery: readonly string[];
};

export function getProductPresentation(product: Product): ProductPresentation {
  return {
    description: product.description ?? "",
    leadTime: product.leadTime ?? "پس از بررسی مدل و پیکربندی",
    warranty: "طبق شرایط رسمی نیلپر",
    assembly: product.technicalSpecs?.find((item) => item.key === "delivery")?.value ?? "زمان و شیوه تحویل و نصب، پس از ثبت سفارش توسط مشاور با شما هماهنگ می‌شود.",
    care: product.technicalSpecs?.find((item) => item.key === "care")?.value ?? "راهنمای نگهداری هنگام ثبت سفارش اعلام می‌شود",
    gallery: product.gallery?.length ? product.gallery : product.image ? [product.image] : [],
  };
}
