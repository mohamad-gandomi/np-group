import { randomUUID } from "node:crypto";

import { commitTransaction, createLocalReq, getPayload, initTransaction, killTransaction } from "payload";

import config from "../../../payload.config";
import type { AuthUser } from "@/features/auth/session";
import { mapPayloadProduct } from "@/features/catalog/payload-catalog-mapper";
import {
  findActiveStorefrontCart,
  getStorefrontCustomerKey,
} from "@/features/cart/payload-cart";
import type { AccountOrder, OrderStatus } from "@/features/commerce/order-types";
import type { Order, Product as PayloadProduct } from "@/payload-types";
import { NILPER_COMMERCE_CURRENCY } from "@/payload/money";

const MAX_CONTACT_LENGTH = 160;
const NILPER_ORDER_STATUSES = new Set<OrderStatus>([
  "pending_review",
  "confirmed",
  "in_production",
  "ready",
  "shipped",
  "delivered",
  "cancelled",
]);

export class CheckoutRequestError extends Error {}

export type CheckoutContact = {
  name: string;
  phone: string;
  province: string;
  city: string;
  address: string;
  postal: string;
  delivery: "advisor";
  payment: "gateway" | "invoice";
};

const requiredText = (value: unknown, label: string, maxLength = MAX_CONTACT_LENGTH) => {
  if (typeof value !== "string" || !value.trim()) {
    throw new CheckoutRequestError(`${label} الزامی است.`);
  }
  return value.trim().slice(0, maxLength);
};

export function parseCheckoutContact(value: unknown, user: AuthUser): CheckoutContact {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new CheckoutRequestError("اطلاعات ارسال معتبر نیست.");
  }
  const contact = value as Record<string, unknown>;
  const delivery = contact.delivery === "advisor" ? "advisor" : null;
  const payment = contact.payment === "gateway" || contact.payment === "invoice" ? contact.payment : null;
  if (!delivery || !payment) throw new CheckoutRequestError("روش تحویل یا پرداخت معتبر نیست.");

  return {
    name: requiredText(contact.name, "نام و نام خانوادگی", 80),
    phone: requiredText(contact.phone ?? user.phone, "شماره موبایل", 20),
    province: requiredText(contact.province, "استان", 80),
    city: requiredText(contact.city, "شهر", 80),
    address: requiredText(contact.address, "نشانی", 300),
    postal: requiredText(contact.postal, "کد پستی", 20),
    delivery,
    payment,
  };
}

export async function createStorefrontOrder(user: AuthUser, contact: CheckoutContact) {
  const payload = await getPayload({ config });
  const req = await createLocalReq({}, payload);
  const transactionStarted = await initTransaction(req);

  try {
    const cart = await findActiveStorefrontCart(payload, user, req);
    if (!cart?.items?.length) throw new CheckoutRequestError("سبد خرید خالی است.");

    const orderData: Pick<
      Order,
      | "amount"
      | "contactName"
      | "contactPhone"
      | "currency"
      | "deliveryMethod"
      | "items"
      | "orderNumber"
      | "paymentMethod"
      | "shippingAddress"
      | "sourceCart"
      | "status"
      | "storefrontCustomerKey"
    > = {
      items: cart.items,
      amount: cart.subtotal ?? 0,
      currency: NILPER_COMMERCE_CURRENCY.code,
      status: "pending_review",
      orderNumber: `NP-${randomUUID().replaceAll("-", "").slice(0, 10).toUpperCase()}`,
      sourceCart: cart.id,
      storefrontCustomerKey: getStorefrontCustomerKey(user),
      contactName: contact.name,
      contactPhone: contact.phone,
      deliveryMethod: contact.delivery,
      paymentMethod: contact.payment,
      shippingAddress: {
        firstName: contact.name,
        addressLine1: contact.address,
        city: contact.city,
        state: contact.province,
        postalCode: contact.postal,
        country: "IR",
        phone: contact.phone,
      },
    };
    const order = await payload.create({
      collection: "orders",
      data: orderData,
      depth: 2,
      overrideAccess: true,
      req,
    });
    await payload.update({
      collection: "carts",
      id: cart.id,
      data: { purchasedAt: new Date().toISOString() },
      depth: 0,
      overrideAccess: true,
      req,
    });
    if (transactionStarted) await commitTransaction(req);

    return { id: `payload-${order.id}`, orderNumber: order.orderNumber };
  } catch (error) {
    if (transactionStarted) await killTransaction(req);
    throw error;
  }
}

const isNilperStatus = (value: unknown): value is OrderStatus =>
  typeof value === "string" && NILPER_ORDER_STATUSES.has(value as OrderStatus);

export async function getPayloadAccountOrders(user: AuthUser): Promise<AccountOrder[]> {
  const payload = await getPayload({ config });
  const result = await payload.find({
    collection: "orders",
    depth: 2,
    limit: 100,
    overrideAccess: true,
    pagination: false,
    sort: "-createdAt",
    where: { storefrontCustomerKey: { equals: getStorefrontCustomerKey(user) } },
  });

  return result.docs.map((order) => ({
    id: `payload-${order.id}`,
    orderNumber: order.orderNumber,
    status: isNilperStatus(order.status) ? order.status : "pending_review",
    total: order.amount ?? 0,
    createdAt: order.createdAt,
    address: [order.shippingAddress?.state, order.shippingAddress?.city, order.shippingAddress?.addressLine1]
      .filter(Boolean)
      .join("، "),
    items: (order.items ?? []).flatMap((item, index) => {
      const payloadProduct = typeof item.product === "object" ? item.product as PayloadProduct : undefined;
      if (!payloadProduct) return [];
      const mapped = mapPayloadProduct(payloadProduct, {
        configurationGroups: [],
        configurationOptions: [],
        variants: [],
      });
      const color = item.configuration?.find((selection) => selection.groupKey === "wood-finish")?.labelFaSnapshot
        ?? item.configuration?.[0]?.labelFaSnapshot
        ?? "سفارشی";
      return [{
        id: `payload-${order.id}-${item.id ?? index}`,
        productName: item.productTitleSnapshot,
        image: mapped.image,
        color,
        quantity: item.quantity,
        unitPrice: item.unitPriceInTMN,
      }];
    }),
  }));
}

export async function deleteStorefrontOrderForVerification(user: AuthUser, orderID: number) {
  const payload = await getPayload({ config });
  const key = getStorefrontCustomerKey(user);
  const order = await payload.findByID({ collection: "orders", id: orderID, depth: 0, overrideAccess: true });
  if (order.storefrontCustomerKey === key) {
    await payload.delete({ collection: "orders", id: orderID, overrideAccess: true });
  }
}
