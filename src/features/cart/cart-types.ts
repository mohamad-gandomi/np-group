import type { Product } from "@/features/catalog/catalog-types";

export type CartConfigurationSelection = {
  groupKey: string;
  groupLabel: string;
  optionId: number;
  optionLabel: string;
  optionCode?: string;
};

export type CartSelection = {
  color: string;
  variantId?: number;
  variantLabel?: string;
  variantCode?: string;
  configuration?: readonly CartConfigurationSelection[];
};

export type CartProduct = Pick<
  Product,
  | "availability"
  | "brand"
  | "category"
  | "id"
  | "image"
  | "name"
  | "payloadProductId"
  | "price"
  | "slug"
  | "source"
>;

export type CartItem = CartSelection & {
  key: string;
  product: CartProduct;
  quantity: number;
};

export type CartLineReference = {
  productId: number;
  variantId?: number;
  quantity: number;
  configuration: { groupKey: string; optionId: number }[];
};

export type CartResponse = {
  authenticated: boolean;
  cartId?: number;
  items: CartItem[];
  subtotal: number;
};

