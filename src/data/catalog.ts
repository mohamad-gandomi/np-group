export const categories = [
  { title: "مبلمان", count: "۱۲۸ محصول", image: "/placeholders/living.jpg", className: "md:col-span-7 md:row-span-2" },
  { title: "روشنایی و لوستر", count: "۸۴ محصول", image: "/placeholders/lighting.jpg", className: "md:col-span-5" },
  { title: "پارچه و بافت", count: "۶۲ محصول", image: "/placeholders/sofa.jpg", className: "md:col-span-5" },
  { title: "اکسسوری", count: "۴۶ محصول", image: "/placeholders/project.jpg", className: "md:col-span-5" },
  { title: "میز و کنسول", count: "۳۸ محصول", image: "/placeholders/dining.jpg", className: "md:col-span-7" },
] as const;

export const products = [
  { name: "کاناپه لونا", brand: "NOMA", category: "مبلمان", price: "۱۸۹٬۰۰۰٬۰۰۰", image: "/placeholders/sofa.jpg" },
  { name: "آویز آرتا", brand: "LUMIA", category: "روشنایی", price: "۴۸٬۵۰۰٬۰۰۰", image: "/placeholders/lighting.jpg" },
  { name: "صندلی ورا", brand: "FORMA", category: "مبلمان", price: "۳۴٬۸۰۰٬۰۰۰", image: "/placeholders/living.jpg" },
  { name: "میز کنسول اورا", brand: "CASA N", category: "میز و کنسول", price: "۷۶٬۲۰۰٬۰۰۰", image: "/placeholders/dining.jpg" },
  { name: "چراغ رومیزی نوا", brand: "LUMIA", category: "روشنایی", price: "۲۲٬۴۰۰٬۰۰۰", image: "/placeholders/lighting.jpg" },
  { name: "صندلی راحتی آرا", brand: "NOMA", category: "مبلمان", price: "۵۸٬۹۰۰٬۰۰۰", image: "/placeholders/living.jpg" },
  { name: "آینه دکوراتیو سایا", brand: "ATELIER", category: "اکسسوری", price: "۱۸٬۷۰۰٬۰۰۰", image: "/placeholders/project.jpg" },
  { name: "میز غذاخوری نیکا", brand: "CASA N", category: "میز و کنسول", price: "۹۲٬۰۰۰٬۰۰۰", image: "/placeholders/dining.jpg" },
] as const;

export const spaces = [
  { title: "نشیمن", image: "/placeholders/living.jpg" },
  { title: "غذاخوری و آشپزخانه", image: "/placeholders/dining.jpg" },
  { title: "اتاق خواب", image: "/placeholders/bedroom.jpg" },
] as const;
