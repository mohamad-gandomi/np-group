import { randomUUID } from "node:crypto";

import { commitTransaction, createLocalReq, initTransaction, killTransaction, type Payload, type PayloadRequest } from "payload";

import type { Order, Transaction } from "@/payload-types";
import { NILPER_COMMERCE_CURRENCY } from "@/payload/money";
import { setNilperTrustedCommerceItems } from "@/payload/cart-configuration";

const relationID = (value: unknown) => {
  if (typeof value === "number") return value;
  if (value && typeof value === "object" && "id" in value && typeof value.id === "number") return value.id;
  return null;
};

export async function finalizeZarinpalOrder(
  payload: Payload,
  sourceTransaction: Transaction,
  req?: PayloadRequest,
) {
  const transactionID = sourceTransaction.id;
  const localReq = req ?? await createLocalReq({}, payload);
  const transactionStarted = await initTransaction(localReq);

  try {
    const transaction = await payload.findByID({
      collection: "transactions",
      id: transactionID,
      depth: 0,
      overrideAccess: true,
      req: localReq,
    });
    const linkedOrderID = relationID(transaction.order);
    if (transaction.status === "succeeded" && linkedOrderID) {
      const existing = await payload.findByID({ collection: "orders", id: linkedOrderID, depth: 0, overrideAccess: true, req: localReq });
      if (transactionStarted) await commitTransaction(localReq);
      return existing;
    }

    const cartID = relationID(transaction.cart);
    const customerID = relationID(transaction.customer);
    if (!cartID || !customerID || !transaction.items?.length || !transaction.amount) {
      throw new Error("اطلاعات تراکنش برای ساخت سفارش کامل نیست.");
    }

    const existingOrders = await payload.find({
      collection: "orders",
      depth: 0,
      limit: 1,
      overrideAccess: true,
      pagination: false,
      req: localReq,
      where: { sourceCart: { equals: cartID } },
    });
    let order = existingOrders.docs[0];
    if (order && order.paymentMethod !== "zarinpal") {
      throw new Error("برای این سبد قبلاً سفارشی با روش پرداخت دیگری ثبت شده است.");
    }

    if (!order) {
      const address = transaction.billingAddress;
      const orderData: Pick<
        Order,
        | "amount"
        | "contactName"
        | "contactPhone"
        | "currency"
        | "customer"
        | "deliveryMethod"
        | "items"
        | "orderNumber"
        | "paymentMethod"
        | "paymentTransaction"
        | "shippingAddress"
        | "sourceCart"
        | "status"
        | "shippingMode"
        | "shippingAmountInTMN"
        | "shippingProvider"
        | "shippingServiceID"
        | "shippingServiceLabel"
        | "shippingProvinceCode"
        | "shippingCityCode"
        | "shippingWeightInGrams"
        | "shippingBoxID"
        | "shippingQuotedAt"
        | "shippingStatus"
      > = {
        items: transaction.items,
        amount: transaction.amount,
        currency: NILPER_COMMERCE_CURRENCY.code,
        status: "confirmed",
        orderNumber: `NP-${randomUUID().replaceAll("-", "").slice(0, 10).toUpperCase()}`,
        sourceCart: cartID,
        paymentTransaction: transaction.id,
        customer: customerID,
        contactName: address?.firstName || "مشتری نیلپر",
        contactPhone: address?.phone || "",
        deliveryMethod: "advisor",
        paymentMethod: "zarinpal",
        shippingAddress: address,
        shippingMode: transaction.shippingMode,
        shippingAmountInTMN: transaction.shippingAmountInTMN,
        shippingProvider: transaction.shippingProvider,
        shippingServiceID: transaction.shippingServiceID,
        shippingServiceLabel: transaction.shippingServiceLabel,
        shippingProvinceCode: transaction.shippingProvinceCode,
        shippingCityCode: transaction.shippingCityCode,
        shippingWeightInGrams: transaction.shippingWeightInGrams,
        shippingBoxID: transaction.shippingBoxID,
        shippingQuotedAt: transaction.shippingQuotedAt,
        shippingStatus: transaction.shippingMode === "parcel" ? "shipment_pending" : "manual_coordination",
      };
      setNilperTrustedCommerceItems(localReq, "order", true);
      try {
        order = await payload.create({
          collection: "orders",
          data: orderData,
          depth: 0,
          overrideAccess: true,
          req: localReq,
        });
      } finally {
        setNilperTrustedCommerceItems(localReq, "order", false);
      }
    }

    await payload.update({
      collection: "carts",
      id: cartID,
      data: { purchasedAt: new Date().toISOString() },
      depth: 0,
      overrideAccess: true,
      req: localReq,
    });
    await payload.update({
      collection: "transactions",
      id: transactionID,
      data: { order: order.id, status: "succeeded" },
      depth: 0,
      overrideAccess: true,
      req: localReq,
    });
    if (transactionStarted) await commitTransaction(localReq);
    return order;
  } catch (error) {
    if (transactionStarted) await killTransaction(localReq);
    throw error;
  }
}
