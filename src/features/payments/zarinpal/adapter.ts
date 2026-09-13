import type { PaymentAdapter } from "@payloadcms/plugin-ecommerce/types";
import type { Endpoint, Payload, PayloadRequest } from "payload";

import type { Transaction } from "@/payload-types";
import { NILPER_COMMERCE_CURRENCY, toPaymentGatewayAmount } from "@/payload/money";
import { createZarinpalClient, type ZarinpalClient, ZarinpalGatewayError } from "./client";
import { finalizeZarinpalOrder } from "./finalize-order";
import {
  cartShippingMode,
  parseShippingDestination,
  parseTapinService,
  quoteCartShipping,
  shippingPlanData,
  totalWithShipping,
} from "@/features/shipping/shipping-plan";
import { ensureTapinShipmentForOrder } from "@/features/shipping/tapin/shipment";
import type { TapinClient } from "@/features/shipping/types";

const ZARINPAL_NAME = "zarinpal";

const relationID = (value: unknown) => {
  if (typeof value === "number") return value;
  if (value && typeof value === "object" && "id" in value && typeof value.id === "number") return value.id;
  return null;
};

const cleanText = (value: unknown, fallback = "") => typeof value === "string" ? value.trim() : fallback;

const siteOrigin = () => {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000";
  const url = new URL(configured);
  if (!["http:", "https:"].includes(url.protocol)) throw new Error("نشانی عمومی سایت معتبر نیست.");
  if (process.env.NODE_ENV === "production" && url.protocol !== "https:") {
    throw new Error("نشانی عمومی سایت برای پرداخت واقعی باید HTTPS باشد.");
  }
  return url.origin;
};

const callbackURL = (transactionID: number) => {
  const url = new URL("/api/payments/zarinpal/callback", siteOrigin());
  url.searchParams.set("transaction", String(transactionID));
  return url.toString();
};

const resultURL = (transactionID: number) => {
  const url = new URL("/payment/zarinpal/result", siteOrigin());
  url.searchParams.set("transaction", String(transactionID));
  return url;
};

const parseTransactionID = (value: unknown) => {
  const id = typeof value === "number" ? value : Number(value);
  if (!Number.isSafeInteger(id) || id <= 0) throw new Error("شناسه تراکنش معتبر نیست.");
  return id;
};

const fetchTransaction = async (payload: Payload, id: number, req?: PayloadRequest) => payload.findByID({
  collection: "transactions",
  id,
  depth: 0,
  overrideAccess: true,
  ...(req ? { req } : {}),
});

async function markTransaction(
  payload: Payload,
  transactionID: number,
  data: Record<string, unknown>,
  req?: PayloadRequest,
) {
  await payload.update({
    collection: "transactions",
    id: transactionID,
    data,
    depth: 0,
    overrideAccess: true,
    ...(req ? { req } : {}),
  });
}

export async function confirmZarinpalTransaction(input: {
  authority: string;
  client?: ZarinpalClient;
  payload: Payload;
  req?: PayloadRequest;
  status: string;
  transactionID: number;
  shippingClient?: TapinClient;
}) {
  const { payload, req, transactionID } = input;
  const transaction = await fetchTransaction(payload, transactionID, req) as Transaction;
  const zarinpal = transaction.zarinpal;
  if (transaction.paymentMethod !== ZARINPAL_NAME || !zarinpal?.authority) {
    throw new Error("تراکنش زرین‌پال پیدا نشد.");
  }

  const authority = cleanText(input.authority);
  if (!authority || authority !== zarinpal.authority) {
    throw new Error("شناسه مرجع بازگشتی با تراکنش تطابق ندارد.");
  }

  const existingOrderID = relationID(transaction.order);
  if (transaction.status === "succeeded" && existingOrderID) {
    await ensureTapinShipmentForOrder(payload, existingOrderID, input.shippingClient).catch((error) => {
      payload.logger.error({ err: error, orderID: existingOrderID }, "Tapin shipment creation failed after verified payment");
    });
    return { orderID: existingOrderID, transactionID, status: "succeeded" as const };
  }

  const callbackReceivedAt = new Date().toISOString();
  if (cleanText(input.status).toUpperCase() !== "OK") {
    await markTransaction(payload, transactionID, {
      status: "cancelled",
      zarinpal: { ...zarinpal, callbackReceivedAt, failureMessage: "پرداخت در درگاه تکمیل نشد." },
    }, req);
    return { orderID: null, transactionID, status: "cancelled" as const };
  }

  const amountInToman = transaction.amount;
  if (!amountInToman || transaction.currency !== NILPER_COMMERCE_CURRENCY.code) {
    throw new Error("مبلغ یا واحد پول تراکنش معتبر نیست.");
  }
  const expectedRial = toPaymentGatewayAmount(amountInToman, "rial");
  if (zarinpal.requestedAmountInRial !== expectedRial) {
    await markTransaction(payload, transactionID, {
      status: "failed",
      zarinpal: { ...zarinpal, callbackReceivedAt, failureMessage: "مبلغ ذخیره‌شده تراکنش تطابق ندارد." },
    }, req);
    throw new Error("مبلغ ذخیره‌شده تراکنش تطابق ندارد.");
  }

  let verified;
  try {
    verified = await (input.client ?? createZarinpalClient()).verifyPayment({ amountInToman, authority });
  } catch (error) {
    await markTransaction(payload, transactionID, {
      status: "failed",
      zarinpal: {
        ...zarinpal,
        callbackReceivedAt,
        failureMessage: error instanceof Error ? error.message : "تأیید پرداخت زرین‌پال ناموفق بود.",
      },
    }, req);
    throw error;
  }
  const verifiedAt = new Date().toISOString();
  await markTransaction(payload, transactionID, {
    zarinpal: {
      ...zarinpal,
      callbackReceivedAt,
      verifiedAt,
      providerCode: verified.code,
      referenceID: verified.referenceID ? String(verified.referenceID) : zarinpal.referenceID,
      cardPAN: verified.cardPan,
      cardHash: verified.cardHash,
      feeInRial: verified.fee,
      feeType: verified.feeType,
      failureMessage: null,
    },
  }, req);
  const refreshed = await fetchTransaction(payload, transactionID, req) as Transaction;
  let order;
  try {
    order = await finalizeZarinpalOrder(payload, refreshed, req);
  } catch (error) {
    const cartID = relationID(refreshed.cart);
    const existing = cartID ? await payload.find({
      collection: "orders",
      depth: 0,
      limit: 1,
      overrideAccess: true,
      pagination: false,
      where: { and: [{ sourceCart: { equals: cartID } }, { paymentTransaction: { equals: transactionID } }] },
    }) : null;
    order = existing?.docs[0];
    if (!order) throw error;
    await markTransaction(payload, transactionID, { order: order.id, status: "succeeded" });
  }
  await ensureTapinShipmentForOrder(payload, order.id, input.shippingClient).catch((error) => {
    payload.logger.error({ err: error, orderID: order.id }, "Tapin shipment creation failed after verified payment");
  });
  return { orderID: order.id, transactionID, status: "succeeded" as const };
}

const callbackEndpoint = (client?: ZarinpalClient, shippingClient?: TapinClient): Endpoint => ({
  path: "/callback",
  method: "get",
  handler: async (req) => {
    let transactionID = 0;
    try {
      const url = new URL(req.url || "", siteOrigin());
      transactionID = parseTransactionID(url.searchParams.get("transaction"));
      await confirmZarinpalTransaction({
        payload: req.payload,
        req,
        transactionID,
        authority: cleanText(url.searchParams.get("Authority")),
        status: cleanText(url.searchParams.get("Status")),
        client,
        shippingClient,
      });
    } catch (error) {
      req.payload.logger.error({ err: error, transactionID }, "Zarinpal callback failed");
    }
    return Response.redirect(resultURL(transactionID), 303);
  },
});

export function zarinpalAdapter(options: { client?: ZarinpalClient; shippingClient?: TapinClient } = {}): PaymentAdapter {
  const client = options.client;
  const shippingClient = options.shippingClient;
  return {
    name: ZARINPAL_NAME,
    label: "زرین‌پال",
    group: {
      name: ZARINPAL_NAME,
      type: "group",
      label: "اطلاعات زرین‌پال",
      admin: { condition: (data) => data?.paymentMethod === ZARINPAL_NAME },
      fields: [
        { name: "authority", type: "text", label: "Authority", unique: true, index: true },
        { name: "referenceID", type: "text", label: "شماره پیگیری زرین‌پال", index: true },
        { name: "requestedAmountInRial", type: "number", label: "مبلغ ارسالی (ریال)", min: 10_000 },
        { name: "providerCode", type: "number", label: "کد پاسخ زرین‌پال" },
        { name: "cardPAN", type: "text", label: "شماره کارت ماسک‌شده" },
        { name: "cardHash", type: "text", label: "هش کارت", admin: { hidden: true } },
        { name: "feeInRial", type: "number", label: "کارمزد (ریال)", min: 0 },
        { name: "feeType", type: "text", label: "نوع کارمزد" },
        { name: "callbackReceivedAt", type: "date", label: "زمان بازگشت از درگاه" },
        { name: "verifiedAt", type: "date", label: "زمان تأیید پرداخت" },
        { name: "failureMessage", type: "textarea", label: "خطای پرداخت" },
      ],
    },
    endpoints: [callbackEndpoint(client, shippingClient)],
    initiatePayment: async ({ data, req }) => {
      if (!req.user || req.user.collection !== "customers") throw new Error("برای پرداخت باید وارد حساب شوید.");
      const customerID = req.user.id;
      const ownedCart = await req.payload.findByID({
        collection: "carts",
        id: data.cart.id,
        depth: 0,
        overrideAccess: true,
        req,
      });
      const cartCustomerID = relationID(ownedCart.customer);
      if (cartCustomerID !== customerID) throw new Error("سبد خرید متعلق به این مشتری نیست.");
      if (data.currency !== NILPER_COMMERCE_CURRENCY.code || !ownedCart.subtotal || ownedCart.subtotal <= 0) {
        throw new Error("مبلغ سبد خرید معتبر نیست.");
      }
      if (!ownedCart.items?.length) throw new Error("سبد خرید خالی است.");

      const existingOrder = await req.payload.find({
        collection: "orders",
        depth: 0,
        limit: 1,
        overrideAccess: true,
        pagination: false,
        where: { sourceCart: { equals: data.cart.id } },
      });
      if (existingOrder.docs.length) throw new Error("این سبد قبلاً به سفارش تبدیل شده است.");

      const address = data.billingAddress;
      if (!cleanText(address?.firstName) || !cleanText(address?.phone) || !cleanText(address?.addressLine1)) {
        throw new Error("اطلاعات تماس و نشانی برای پرداخت کامل نیست.");
      }
      const shippingInput = (data as unknown as { shipping?: Record<string, unknown> }).shipping;
      const mode = cartShippingMode(ownedCart.items);
      const plan = await quoteCartShipping({
        ...(mode === "parcel"
          ? {
              destination: parseShippingDestination(shippingInput),
              serviceID: parseTapinService(shippingInput?.serviceID),
            }
          : {}),
        client: shippingClient,
        items: ownedCart.items,
        subtotalInToman: ownedCart.subtotal,
      });
      const amountInToman = totalWithShipping(ownedCart.subtotal, plan);
      const flattenedItems = (ownedCart.items as unknown as NonNullable<Transaction["items"]>).map((item) => {
        const productID = relationID(item.product);
        const variantID = relationID(item.variant);
        if (!productID) throw new Error("محصول تراکنش معتبر نیست.");
        const snapshots = { ...item };
        delete snapshots.product;
        delete snapshots.variant;
        return { ...snapshots, product: productID, ...(variantID ? { variant: variantID } : {}) };
      }) as NonNullable<Transaction["items"]>;
      const transaction = await req.payload.create({
        collection: "transactions",
        data: {
          customer: customerID,
          amount: amountInToman,
          billingAddress: address,
          cart: data.cart.id,
          currency: NILPER_COMMERCE_CURRENCY.code,
          items: flattenedItems,
          paymentMethod: ZARINPAL_NAME,
          status: "pending",
          zarinpal: { requestedAmountInRial: toPaymentGatewayAmount(amountInToman, "rial") },
          ...shippingPlanData(plan),
        },
        depth: 0,
        overrideAccess: true,
        req,
      });

      try {
        const gateway = client ?? createZarinpalClient();
        const requested = await gateway.requestPayment({
          amountInToman,
          callbackURL: callbackURL(Number(transaction.id)),
          description: `پرداخت سفارش نیلپر - سبد ${data.cart.id}`,
          mobile: cleanText(address.phone),
        });
        await markTransaction(req.payload, Number(transaction.id), {
          zarinpal: {
            requestedAmountInRial: toPaymentGatewayAmount(amountInToman, "rial"),
            authority: requested.authority,
            providerCode: requested.code,
            feeInRial: requested.fee,
            feeType: requested.feeType,
          },
        }, req);
        return {
          message: "درخواست پرداخت ایجاد شد.",
          redirectURL: gateway.getRedirectURL(requested.authority),
          transactionID: transaction.id,
        };
      } catch (error) {
        await markTransaction(req.payload, Number(transaction.id), {
          status: "failed",
          zarinpal: { failureMessage: error instanceof Error ? error.message : "ایجاد درخواست پرداخت ناموفق بود." },
        }, req).catch(() => undefined);
        if (error instanceof ZarinpalGatewayError) throw error;
        throw new Error("ایجاد درخواست پرداخت ناموفق بود.");
      }
    },
    confirmOrder: async ({ data, req }) => {
      if (!req.user || req.user.collection !== "customers") throw new Error("برای تأیید پرداخت باید وارد حساب شوید.");
      const transactionID = parseTransactionID(data.transactionID);
      const transaction = await fetchTransaction(req.payload, transactionID, req);
      if (relationID(transaction.customer) !== req.user.id || relationID(transaction.cart) !== parseTransactionID(data.cartID)) {
        throw new Error("تراکنش پرداخت متعلق به این مشتری یا سبد نیست.");
      }
      const result = await confirmZarinpalTransaction({
        payload: req.payload,
        req,
        transactionID,
        authority: cleanText(data.authority),
        status: cleanText(data.status, "OK"),
        client,
        shippingClient,
      });
      if (!result.orderID) throw new Error("پرداخت تکمیل نشده است.");
      return { message: "پرداخت تأیید و سفارش ثبت شد.", orderID: result.orderID, transactionID: result.transactionID };
    },
  };
}
