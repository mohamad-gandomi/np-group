import type { CatalogCategory, Product } from "./catalog-types";

export const categories = [
  { slug: "furniture", title: "مبلمان", count: "۱۲۸ محصول", image: "/placeholders/living.jpg", className: "md:col-span-7 md:row-span-2" },
  { slug: "lighting", title: "روشنایی و لوستر", count: "۸۴ محصول", image: "/placeholders/lighting.jpg", className: "md:col-span-5" },
  { slug: "textiles", title: "پارچه و بافت", count: "۶۲ محصول", image: "/placeholders/sofa.jpg", className: "md:col-span-5" },
  { slug: "accessories", title: "اکسسوری", count: "۴۶ محصول", image: "/placeholders/project.jpg", className: "md:col-span-5" },
  { slug: "tables", title: "میز و کنسول", count: "۳۸ محصول", image: "/placeholders/dining.jpg", className: "md:col-span-7" },
] satisfies readonly CatalogCategory[];

export const products = [
  { id: "luna", slug: "luna-sofa", name: "کاناپه لونا", brand: "NOMA", category: "furniture", room: ["نشیمن"], material: ["پارچه", "چوب"], colors: ["کرم", "قهوه‌ای"], price: 189000000, image: "/placeholders/sofa.jpg", width: 228, seats: 3, availability: "made-to-order", isNew: true, isSale: false, createdAt: "2026-08-20" },
  { id: "arta", slug: "arta-pendant", name: "آویز آرتا", brand: "LUMIA", category: "lighting", room: ["غذاخوری", "نشیمن"], material: ["فلز", "شیشه"], colors: ["مشکی", "طلایی"], price: 48500000, image: "/placeholders/lighting.jpg", width: 54, availability: "in-stock", isNew: true, isSale: false, createdAt: "2026-08-18" },
  { id: "vera", slug: "vera-chair", name: "صندلی ورا", brand: "FORMA", category: "furniture", room: ["نشیمن", "اتاق کار"], material: ["پارچه", "چوب"], colors: ["سبز", "کرم"], price: 34800000, image: "/placeholders/living.jpg", width: 74, seats: 1, availability: "in-stock", isNew: true, isSale: false, createdAt: "2026-08-15" },
  { id: "aura", slug: "aura-console", name: "میز کنسول اورا", brand: "CASA N", category: "tables", room: ["ورودی", "نشیمن"], material: ["چوب", "سنگ"], colors: ["قهوه‌ای", "کرم"], price: 76200000, image: "/placeholders/dining.jpg", width: 160, availability: "made-to-order", isNew: true, isSale: false, createdAt: "2026-08-12" },
  { id: "nova", slug: "nova-table-lamp", name: "چراغ رومیزی نوا", brand: "LUMIA", category: "lighting", room: ["اتاق خواب", "اتاق کار"], material: ["فلز"], colors: ["مشکی"], price: 22400000, image: "/placeholders/lighting.jpg", width: 32, availability: "in-stock", isNew: false, isSale: true, createdAt: "2026-07-20" },
  { id: "ara", slug: "ara-lounge-chair", name: "صندلی راحتی آرا", brand: "NOMA", category: "furniture", room: ["نشیمن", "اتاق خواب"], material: ["پارچه", "چوب"], colors: ["طوسی", "کرم"], price: 58900000, image: "/placeholders/living.jpg", width: 86, seats: 1, availability: "made-to-order", isNew: false, isSale: false, createdAt: "2026-07-14" },
  { id: "saya", slug: "saya-mirror", name: "آینه دکوراتیو سایا", brand: "ATELIER", category: "accessories", room: ["ورودی", "اتاق خواب"], material: ["شیشه", "فلز"], colors: ["طلایی"], price: 18700000, image: "/placeholders/project.jpg", width: 82, availability: "in-stock", isNew: false, isSale: false, createdAt: "2026-07-08" },
  { id: "nika", slug: "nika-dining-table", name: "میز غذاخوری نیکا", brand: "CASA N", category: "tables", room: ["غذاخوری"], material: ["چوب"], colors: ["قهوه‌ای"], price: 92000000, image: "/placeholders/dining.jpg", width: 210, seats: 6, availability: "made-to-order", isNew: false, isSale: false, createdAt: "2026-06-28" },
  { id: "mero", slug: "mero-bench", name: "نیمکت مرو", brand: "FORMA", category: "furniture", room: ["ورودی", "اتاق خواب"], material: ["پارچه", "فلز"], colors: ["کرم", "مشکی"], price: 39800000, image: "/placeholders/bedroom.jpg", width: 125, seats: 2, availability: "in-stock", isNew: false, isSale: true, createdAt: "2026-06-20" },
  { id: "ravi", slug: "ravi-rug", name: "فرش راوی", brand: "MÉRIDIEN", category: "textiles", room: ["نشیمن", "اتاق خواب"], material: ["پشم"], colors: ["کرم", "قرمز"], price: 68400000, image: "/placeholders/sofa.jpg", width: 200, availability: "in-stock", isNew: false, isSale: false, createdAt: "2026-06-10" },
  { id: "linea", slug: "linea-floor-lamp", name: "چراغ ایستاده لینئا", brand: "LUMIA", category: "lighting", room: ["نشیمن", "اتاق کار"], material: ["فلز"], colors: ["مشکی", "طلایی"], price: 41600000, image: "/placeholders/lighting.jpg", width: 44, availability: "made-to-order", isNew: false, isSale: false, createdAt: "2026-05-22" },
  { id: "dora", slug: "dora-side-table", name: "میز کنارمبلی دورا", brand: "ATELIER", category: "tables", room: ["نشیمن", "اتاق خواب"], material: ["سنگ", "فلز"], colors: ["کرم", "طلایی"], price: 29600000, image: "/placeholders/dining.jpg", width: 48, availability: "in-stock", isNew: false, isSale: true, createdAt: "2026-05-14" },
] satisfies readonly Product[];

export const filterOptions = {
  brand: [...new Set(products.map((product) => product.brand))],
  room: [...new Set(products.flatMap((product) => product.room))],
  material: [...new Set(products.flatMap((product) => product.material))],
  color: [...new Set(products.flatMap((product) => product.colors))],
} as const;

export function getCategory(slug: string) {
  return categories.find((category) => category.slug === slug);
}
