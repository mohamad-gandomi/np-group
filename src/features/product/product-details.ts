import { categories, products } from "@/features/catalog/catalog-data";
import type { Product } from "@/features/catalog/catalog-types";

type ProductPresentation = {
  description: string;
  depth: number;
  height: number;
  leadTime: string;
  warranty: string;
  assembly: string;
  care: string;
  gallery: readonly string[];
};

const categoryDetails: Record<string, Omit<ProductPresentation, "description" | "gallery">> = {
  furniture: { depth: 94, height: 78, leadTime: "۴ تا ۶ هفته", warranty: "۲۴ ماه", assembly: "تحویل و جانمایی توسط تیم نصب", care: "با جاروبرقی و سری نرم تمیز شود؛ لکه‌ها با دستمال نم‌دار و شوینده ملایم پاک شوند." },
  lighting: { depth: 54, height: 42, leadTime: "۲ تا ۴ هفته", warranty: "۱۸ ماه", assembly: "نصب تخصصی در تهران قابل هماهنگی است", care: "پس از قطع برق با دستمال نرم و خشک تمیز شود؛ از مواد ساینده استفاده نشود." },
  textiles: { depth: 300, height: 1, leadTime: "۳ تا ۵ روز کاری", warranty: "ضمانت اصالت و سلامت", assembly: "بدون نیاز به نصب", care: "نظافت دوره‌ای با مکش ملایم؛ شست‌وشوی تخصصی پیشنهاد می‌شود." },
  accessories: { depth: 4, height: 82, leadTime: "۳ تا ۵ روز کاری", warranty: "۱۲ ماه", assembly: "راهنمای نصب همراه محصول", care: "با پارچه میکروفایبر خشک تمیز شود و از تماس مستقیم با رطوبت دور بماند." },
  tables: { depth: 48, height: 76, leadTime: "۳ تا ۵ هفته", warranty: "۲۴ ماه", assembly: "تحویل و جانمایی توسط تیم نصب", care: "سطح را با دستمال نرم تمیز کنید؛ مایعات و اجسام داغ را مستقیم روی محصول قرار ندهید." },
};

const roomImages: Record<string, string> = {
  "نشیمن": "/placeholders/living.jpg",
  "غذاخوری": "/placeholders/dining.jpg",
  "اتاق خواب": "/placeholders/bedroom.jpg",
  "اتاق کار": "/placeholders/project.jpg",
  "ورودی": "/placeholders/project.jpg",
};

export function getProduct(category: string, slug: string) {
  return products.find((product) => product.category === category && product.slug === slug);
}

export function getProductPresentation(product: Product): ProductPresentation {
  const category = categories.find((item) => item.slug === product.category);
  const defaults = categoryDetails[product.category] ?? categoryDetails.furniture;
  const gallery = [...new Set([product.image, ...product.room.map((room) => roomImages[room]), category?.image, "/placeholders/project.jpg"].filter((image): image is string => Boolean(image)))].slice(0, 3);

  return {
    ...defaults,
    description: `${product.name} از مجموعه ${product.brand} با تناسبات آرام و متریال‌های ${product.material.join(" و ")} طراحی شده است؛ انتخابی ماندگار برای ${product.room.join(" و ")} که کیفیت ساخت را با حضور بصری متعادل همراه می‌کند.`,
    gallery,
  };
}

export function getRelatedProducts(product: Product) {
  return products.filter((item) => item.category === product.category && item.id !== product.id).slice(0, 3);
}
