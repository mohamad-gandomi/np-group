import "server-only";

import type { AuthUser } from "@/features/auth/session";
import type { OrderStatus } from "@/features/commerce/order-types";
import { getPayloadAccountOrders } from "@/features/commerce/payload-orders";
import { getPayloadAccountAddresses } from "@/features/account/payload-account";

export type { AccountOrder, OrderStatus } from "@/features/commerce/order-types";
export type { AccountAddress } from "@/features/account/payload-account";

export const statusLabels: Record<OrderStatus, string> = {
  pending_review: "در حال بررسی",
  confirmed: "تأیید شده",
  in_production: "در حال آماده‌سازی",
  ready: "آماده ارسال",
  shipped: "ارسال شده",
  delivered: "تحویل شده",
  cancelled: "لغو شده",
};

export async function getAccountData(user: AuthUser) {
  const [orders, addresses] = await Promise.all([
    getPayloadAccountOrders(user),
    getPayloadAccountAddresses(user),
  ]);
  return { orders, addresses };
}

export async function getOrder(user: AuthUser, id: string) {
  const { orders } = await getAccountData(user);
  return orders.find((order) => order.id === id) ?? null;
}
