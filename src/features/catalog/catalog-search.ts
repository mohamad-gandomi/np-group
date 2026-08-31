import { categories } from "./catalog-data";
import type { Product } from "./catalog-types";

const normalize = (value: string) => value.toLocaleLowerCase("fa").normalize("NFD").replace(/[\u0300-\u036f\u064b-\u065f]/g, "").replace(/ي/g, "ی").replace(/ك/g, "ک").replace(/[\u200c\s]+/g, " ").trim();

// The menu preview and catalog must agree when a search is carried across.
export function matchesProductSearch(product: Product, query: string) {
  const text = normalize([product.name, product.brand, product.category, categories.find((item) => item.slug === product.category)?.title ?? "", ...product.room, ...product.material, ...product.colors].join(" "));
  return normalize(query).split(" ").filter(Boolean).every((word) => text.includes(word));
}
