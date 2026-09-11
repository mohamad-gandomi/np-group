export type OrderStatus =
  | "pending_review"
  | "confirmed"
  | "in_production"
  | "ready"
  | "shipped"
  | "delivered"
  | "cancelled";

export type AccountOrderItem = {
  id: string;
  productName: string;
  image: string;
  color: string;
  quantity: number;
  unitPrice: number;
};

export type AccountOrder = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  total: number;
  createdAt: string;
  address: string;
  items: AccountOrderItem[];
};

