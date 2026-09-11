import type { Product } from "@/features/catalog/catalog-types";

type ProductPresentation = {
  description: string;
  depth: number | null;
  height: number | null;
  leadTime: string;
  warranty: string;
  assembly: string;
  care: string;
  gallery: readonly string[];
};

export function getProductPresentation(product: Product): ProductPresentation {
  const measurement = (key: string) => product.measurements?.find((item) => item.key === key)?.value ?? null;
  return {
    description: product.description ?? "",
    depth: measurement("depth"),
    height: measurement("height"),
    leadTime: product.leadTime ?? "پس از بررسی مدل و پیکربندی",
    warranty: "طبق شرایط رسمی نیلپر",
    assembly: product.technicalSpecs?.find((item) => item.key === "delivery")?.value ?? "پس از ثبت سفارش هماهنگ می‌شود",
    care: product.technicalSpecs?.find((item) => item.group === "care")?.value ?? "راهنمای نگهداری هنگام ثبت سفارش اعلام می‌شود",
    gallery: product.gallery?.length ? product.gallery : [product.image],
  };
}
