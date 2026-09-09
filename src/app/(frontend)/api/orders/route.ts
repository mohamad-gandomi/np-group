import { randomUUID } from "node:crypto";

import { isSupabaseConfigured } from "@/features/auth/auth-config";
import { getCurrentUser } from "@/features/auth/session";
import { products } from "@/features/catalog/catalog-data";
import { createAdminClient } from "@/lib/supabase/admin";

type OrderRequest = { contact?: Record<string, string>; items?: Array<{ productId?: string; color?: string; quantity?: number }> };
const productMap = new Map(products.map((product) => [product.id, product]));

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  let body: OrderRequest;
  try { body = await request.json() as OrderRequest; } catch { return Response.json({ error: "Invalid request" }, { status: 400 }); }
  const contact = body.contact ?? {};
  const items = (body.items ?? []).flatMap((item) => {
    const product = item.productId ? productMap.get(item.productId) : undefined;
    const quantity = Math.min(20, Math.max(1, Math.floor(Number(item.quantity) || 1)));
    if (!product || !item.color || !product.colors.includes(item.color)) return [];
    return [{ product, color: item.color, quantity }];
  });
  if (!items.length || !contact.name || !contact.city || !contact.address) return Response.json({ error: "Missing order details" }, { status: 400 });
  const total = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  if (!isSupabaseConfigured) return Response.json({ id: "demo-order", orderNumber: `NP-${randomUUID().slice(0, 8).toUpperCase()}` }, { status: 201 });

  const supabase = createAdminClient();
  const { data: order, error } = await supabase.from("orders").insert({
    user_id: user.id,
    status: "pending_review",
    subtotal: total,
    total,
    contact_name: String(contact.name).slice(0, 80),
    contact_phone: String(contact.phone ?? user.phone).slice(0, 20),
    address_snapshot: { province: contact.province, city: contact.city, address: contact.address, postalCode: contact.postal },
    delivery_method: contact.delivery ?? "advisor",
    payment_method: contact.payment ?? "gateway",
  }).select("id, order_number").single();
  if (error || !order) return Response.json({ error: "Could not create order" }, { status: 500 });
  const { error: itemError } = await supabase.from("order_items").insert(items.map(({ product, color, quantity }) => ({ order_id: order.id, product_id: product.id, product_name: product.name, image: product.image, color, quantity, unit_price: product.price })));
  if (itemError) {
    await supabase.from("orders").delete().eq("id", order.id);
    return Response.json({ error: "Could not create order items" }, { status: 500 });
  }
  return Response.json({ id: order.id, orderNumber: order.order_number }, { status: 201 });
}
