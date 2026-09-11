import "server-only";

import { isSupabaseConfigured } from "@/features/auth/auth-config";
import type { AuthUser } from "@/features/auth/session";
import type { AccountOrder, OrderStatus } from "@/features/commerce/order-types";
import { getPayloadAccountOrders } from "@/features/commerce/payload-orders";
import { createClient } from "@/lib/supabase/server";

export type { AccountOrder, OrderStatus } from "@/features/commerce/order-types";
export type AccountAddress = { id: string; title: string; recipient: string; phone: string; city: string; address: string; postalCode: string; isDefault: boolean };

export const statusLabels: Record<OrderStatus, string> = {
  pending_review: "در حال بررسی",
  confirmed: "تأیید شده",
  in_production: "در حال آماده‌سازی",
  ready: "آماده ارسال",
  shipped: "ارسال شده",
  delivered: "تحویل شده",
  cancelled: "لغو شده",
};

const demoOrders: AccountOrder[] = [{
  id: "demo-order",
  orderNumber: "NP-۱۴۰۵-۱۲۰۸",
  status: "in_production",
  total: 189000000,
  createdAt: "2026-08-24T10:30:00.000Z",
  address: "تهران، خیابان ولیعصر، محدوده پارک‌وی",
  items: [{ id: "demo-luna", productName: "کاناپه لونا", image: "/placeholders/sofa.jpg", color: "کرم", quantity: 1, unitPrice: 189000000 }],
}];

const demoAddresses = (user: AuthUser): AccountAddress[] => [{ id: "demo-address", title: "خانه", recipient: user.name ?? "کاربر گروه ان‌پی", phone: user.phone, city: "تهران", address: "خیابان ولیعصر، محدوده پارک‌وی", postalCode: "۱۹۶۷۷۱۳۴۱۱", isDefault: true }];

type OrderRow = { id: string; order_number: string; status: OrderStatus; total: number; created_at: string; address_snapshot: { city?: string; address?: string } | null; order_items: Array<{ id: string; product_name: string; image: string; color: string; quantity: number; unit_price: number }> | null };
type AddressRow = { id: string; title: string; recipient: string; phone: string; city: string; address_line: string; postal_code: string; is_default: boolean };

export async function getAccountData(user: AuthUser) {
  const payloadOrders = await getPayloadAccountOrders(user);
  if (!isSupabaseConfigured) {
    return { orders: payloadOrders.length ? payloadOrders : demoOrders, addresses: demoAddresses(user) };
  }

  const supabase = await createClient();
  const [ordersResult, addressesResult] = await Promise.all([
    supabase.from("orders").select("id, order_number, status, total, created_at, address_snapshot, order_items(id, product_name, image, color, quantity, unit_price)").order("created_at", { ascending: false }),
    supabase.from("addresses").select("id, title, recipient, phone, city, address_line, postal_code, is_default").order("is_default", { ascending: false }),
  ]);

  const legacyOrders: AccountOrder[] = ((ordersResult.data ?? []) as unknown as OrderRow[]).map((order) => ({
    id: order.id,
    orderNumber: order.order_number,
    status: order.status,
    total: order.total,
    createdAt: order.created_at,
    address: [order.address_snapshot?.city, order.address_snapshot?.address].filter(Boolean).join("، "),
    items: (order.order_items ?? []).map((item) => ({ id: item.id, productName: item.product_name, image: item.image, color: item.color, quantity: item.quantity, unitPrice: item.unit_price })),
  }));
  const addresses = ((addressesResult.data ?? []) as unknown as AddressRow[]).map((address) => ({ id: address.id, title: address.title, recipient: address.recipient, phone: address.phone, city: address.city, address: address.address_line, postalCode: address.postal_code, isDefault: address.is_default }));
  const orders = [...payloadOrders, ...legacyOrders]
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
  return { orders, addresses };
}

export async function getOrder(user: AuthUser, id: string) {
  const { orders } = await getAccountData(user);
  return orders.find((order) => order.id === id) ?? null;
}
