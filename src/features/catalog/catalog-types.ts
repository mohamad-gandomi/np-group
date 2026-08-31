export type Availability = "in-stock" | "made-to-order";

export type Product = {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: string;
  room: readonly string[];
  material: readonly string[];
  colors: readonly string[];
  price: number;
  image: string;
  width: number;
  seats?: number;
  availability: Availability;
  isNew: boolean;
  isSale: boolean;
  createdAt: string;
};

export type CatalogCategory = {
  slug: string;
  title: string;
  count: string;
  image: string;
  className: string;
};
