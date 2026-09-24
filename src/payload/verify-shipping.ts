import assert from "node:assert/strict";
import { randomInt, randomUUID } from "node:crypto";

import { createLocalReq, getPayload } from "payload";

import config from "../../payload.config";
import type { AuthUser } from "../features/auth/session";
import { parseCartLineReferences, replaceStorefrontCart } from "../features/cart/payload-cart";
import { confirmZarinpalTransaction, zarinpalAdapter } from "../features/payments/zarinpal/adapter";
import type { ZarinpalClient } from "../features/payments/zarinpal/client";
import { quoteCartShipping, totalWithShipping } from "../features/shipping/shipping-plan";
import { TapinAPIError } from "../features/shipping/tapin/client";
import { refreshTapinTracking } from "../features/shipping/tapin/shipment";
import type { TapinClient } from "../features/shipping/types";
import type { VariantType, VariantOption, Product, Transaction, Variant } from "../payload-types";

const payload = await getPayload({ config });
const parcelPrice = 8_000_000;
const freightPrice = 12_000_000;
const shippingAmount = 180_000;
const createdCustomerIDs = new Set<number>();
const createdCartIDs = new Set<number>();
const createdTransactionIDs = new Set<number>();
const createdOrderIDs = new Set<number>();
const originalVariants = new Map<number, Pick<Variant, "parcelWeightInGrams" | "priceInTMN" | "priceInTMNEnabled" | "shippingMode" | "tapinBoxID">>();
let quoteCalls = 0;
let createShipmentCalls = 0;
let trackingCalls = 0;
const requestAmounts: number[] = [];
let verifyCalls = 0;

const tapinClient: TapinClient = {
  async getLocations() { return [{ code: 1, title: "تهران", cities: [{ code: 1, title: "تهران" }] }]; },
  async quote(input) {
    quoteCalls += 1;
    assert.equal(input.provinceCode, 1);
    assert.equal(input.cityCode, 1);
    assert.equal(input.boxID, 10);
    assert.equal(input.totalWeightInGrams, 1_500);
    return {
      amountInToman: shippingAmount,
      provider: "tapin",
      providerAmount: shippingAmount * 10,
      providerAmountUnit: "rial",
      serviceID: input.serviceID,
      serviceLabel: "پست پیشتاز",
      totalWeightInGrams: input.totalWeightInGrams + 100,
    };
  },
  async createShipment(input) {
    createShipmentCalls += 1;
    assert.match(input.manualID, /^NP-/);
    assert.equal(input.products.length, 1);
    assert.equal(input.products[0]?.weightInGrams, 1_500);
    return { shipmentID: "2735426", trackingCode: "05102600001264713341122", providerStatus: 2 };
  },
  async trackShipment(shipmentID) {
    trackingCalls += 1;
    assert.equal(shipmentID, "2735426");
    return { shipmentID, trackingCode: "05102600001264713341122", providerStatus: 7, status: "delivered" };
  },
};

const failingTapinClient: TapinClient = {
  ...tapinClient,
  async quote() { throw new TapinAPIError("تاپین موقتاً در دسترس نیست.", 301); },
};

const authorities: string[] = [];
const zarinpalClient: ZarinpalClient = {
  getRedirectURL(authority) { return `https://sandbox.zarinpal.com/pg/StartPay/${authority}`; },
  async requestPayment(input) {
    requestAmounts.push(input.amountInToman);
    const authority = `A${randomUUID().replaceAll("-", "")}`;
    authorities.push(authority);
    return { authority, code: 100, fee: 0, feeType: "Merchant" };
  },
  async verifyPayment({ authority }) {
    verifyCalls += 1;
    assert(authorities.includes(authority));
    return { code: 100, referenceID: 555_000 + verifyCalls };
  },
};

const address = (phone: string) => ({
  firstName: "مشتری آزمون ارسال",
  addressLine1: "خیابان آزمون، پلاک ۱",
  city: "تهران",
  state: "تهران",
  postalCode: "1111111111",
  country: "IR",
  phone,
});

const createCustomer = async () => {
  const customer = await payload.create({
    collection: "customers",
    data: { phone: `+98912${randomInt(10_000_000, 99_999_999)}`, active: true },
    overrideAccess: true,
  });
  createdCustomerIDs.add(customer.id);
  return { customer, user: { id: customer.id, phone: customer.phone } satisfies AuthUser };
};

try {
  const productResult = await payload.find({
    collection: "products",
    depth: 2,
    limit: 1,
    where: { and: [{ slug: { equals: "delan-sofa" } }, { _status: { equals: "published" } }] },
  });
  const product = productResult.docs[0] as Product | undefined;
  assert(product, "Run `npm run payload:seed` before shipping verification.");
  assert.equal(product.shippingMode ?? "freight", "freight", "Existing products must default safely to freight.");

  const variantsResult = await payload.find({
    collection: "variants",
    depth: 0,
    limit: 2,
    pagination: false,
    where: { and: [{ product: { equals: product.id } }, { _status: { equals: "published" } }] },
  });
  const [parcelVariant, freightVariant] = variantsResult.docs as Variant[];
  assert(parcelVariant && freightVariant, "Shipping verification needs two seeded Delan variants.");
  for (const variant of [parcelVariant, freightVariant]) {
    originalVariants.set(variant.id, {
      parcelWeightInGrams: variant.parcelWeightInGrams,
      priceInTMN: variant.priceInTMN,
      priceInTMNEnabled: variant.priceInTMNEnabled,
      shippingMode: variant.shippingMode,
      tapinBoxID: variant.tapinBoxID,
    });
  }
  await payload.update({
    collection: "variants",
    id: parcelVariant.id,
    data: { shippingMode: "parcel", parcelWeightInGrams: 1_500, tapinBoxID: 10, priceInTMNEnabled: true, priceInTMN: parcelPrice },
  });
  await payload.update({
    collection: "variants",
    id: freightVariant.id,
    data: { shippingMode: "freight", parcelWeightInGrams: null, tapinBoxID: null, priceInTMNEnabled: true, priceInTMN: freightPrice },
  });

  const groupIDs = (product.attributes ?? []).filter((row) => row.required).map((row) => typeof row.attribute === "number" ? row.attribute : row.attribute.id);
  const [groupsResult, optionsResult] = await Promise.all([
    payload.find({ collection: "variantTypes", depth: 0, pagination: false, where: { id: { in: groupIDs } } }),
    payload.find({ collection: "variantOptions", depth: 0, pagination: false, limit: 100, where: { variantType: { in: groupIDs } } }),
  ]);
  const groups = groupsResult.docs as VariantType[];
  const options = optionsResult.docs as VariantOption[];
  const configuration = groups.map((group) => {
    const option = options.find((candidate) => (typeof candidate.variantType === "number" ? candidate.variantType : candidate.variantType.id) === group.id);
    assert(option);
    return { groupKey: group.name, optionId: option.id };
  });
  const line = (variantID: number, quantity = 1) => ({ productId: product.id, variantId: variantID, quantity, configuration });

  const parcelIdentity = await createCustomer();
  const parcelCartResponse = await replaceStorefrontCart(parcelIdentity.user, parseCartLineReferences([line(parcelVariant.id)]));
  assert(parcelCartResponse.cartId);
  createdCartIDs.add(parcelCartResponse.cartId);
  assert.equal(parcelCartResponse.shippingMode, "parcel");
  const parcelCart = await payload.findByID({ collection: "carts", id: parcelCartResponse.cartId, depth: 0, overrideAccess: true });
  const parcelPlan = await quoteCartShipping({
    client: tapinClient,
    destination: { provinceCode: 1, cityCode: 1 },
    items: parcelCart.items ?? [],
    serviceID: "priority",
    subtotalInToman: parcelCart.subtotal ?? 0,
  });
  assert.equal(parcelPlan.mode, "parcel");
  assert.equal(parcelPlan.amountInToman, shippingAmount);
  assert.equal(totalWithShipping(parcelCart.subtotal ?? 0, parcelPlan), parcelPrice + shippingAmount);

  const parcelReq = await createLocalReq({ user: parcelIdentity.customer }, payload);
  const adapter = zarinpalAdapter({ client: zarinpalClient, shippingClient: tapinClient });
  const initiated = await adapter.initiatePayment({
    data: {
      billingAddress: address(parcelIdentity.customer.phone) as never,
      cart: parcelCart as never,
      currency: "TMN",
      customerEmail: "",
      shipping: { provinceCode: 1, cityCode: 1, serviceID: "priority" },
    } as never,
    req: parcelReq,
    transactionsSlug: "transactions",
  });
  assert.equal(requestAmounts.at(-1), parcelPrice + shippingAmount, "Zarinpal must receive products plus server-quoted parcel shipping.");
  const parcelTransactionResult = await payload.find({ collection: "transactions", depth: 0, limit: 1, overrideAccess: true, where: { "zarinpal.authority": { equals: authorities.at(-1) } } });
  const parcelTransaction = parcelTransactionResult.docs[0] as Transaction | undefined;
  assert(parcelTransaction);
  createdTransactionIDs.add(parcelTransaction.id);
  assert.equal(parcelTransaction.shippingAmountInTMN, shippingAmount);
  assert.equal(parcelTransaction.amount, parcelPrice + shippingAmount);
  assert.equal(createShipmentCalls, 0, "No Tapin shipment may be created before successful Zarinpal verification.");
  await payload.update({ collection: "variants", id: parcelVariant.id, data: { priceInTMN: parcelPrice + 250_000 } });
  const parcelConfirmed = await confirmZarinpalTransaction({
    payload,
    req: parcelReq,
    transactionID: parcelTransaction.id,
    authority: authorities.at(-1)!,
    status: "OK",
    client: zarinpalClient,
    shippingClient: tapinClient,
  });
  assert(parcelConfirmed.orderID);
  createdOrderIDs.add(parcelConfirmed.orderID);
  const parcelOrder = await payload.findByID({ collection: "orders", id: parcelConfirmed.orderID, depth: 0, overrideAccess: true });
  assert.equal(parcelOrder.shippingProvider, "tapin");
  assert.equal(parcelOrder.amount, parcelPrice + shippingAmount, "The paid transaction snapshot must survive later catalog price changes.");
  assert.equal(parcelOrder.items?.[0]?.unitPriceInTMN, parcelPrice);
  assert.equal(parcelOrder.shippingShipmentID, "2735426");
  assert.equal(parcelOrder.shippingTrackingCode, "05102600001264713341122");
  assert.equal(createShipmentCalls, 1, "A shipment is created only after successful Zarinpal verification.");

  await confirmZarinpalTransaction({
    payload,
    req: parcelReq,
    transactionID: parcelTransaction.id,
    authority: authorities.at(-1)!,
    status: "OK",
    client: zarinpalClient,
    shippingClient: tapinClient,
  });
  assert.equal(createShipmentCalls, 1, "Duplicate callbacks must not create a duplicate Tapin shipment.");
  const tracked = await refreshTapinTracking(payload, parcelOrder.id, tapinClient);
  assert.equal(tracked.status, "delivered");
  assert.equal(trackingCalls, 1);
  await payload.update({ collection: "variants", id: parcelVariant.id, data: { priceInTMN: parcelPrice } });

  const freightIdentity = await createCustomer();
  const freightCartResponse = await replaceStorefrontCart(freightIdentity.user, parseCartLineReferences([line(freightVariant.id)]));
  assert(freightCartResponse.cartId);
  createdCartIDs.add(freightCartResponse.cartId);
  const freightCart = await payload.findByID({ collection: "carts", id: freightCartResponse.cartId, depth: 0, overrideAccess: true });
  const quoteCallsBeforeFreight = quoteCalls;
  const freightPlan = await quoteCartShipping({ items: freightCart.items ?? [], subtotalInToman: freightCart.subtotal ?? 0, client: tapinClient });
  assert.equal(freightPlan.mode, "freight");
  assert.equal(freightPlan.amountInToman, 0);
  assert.equal(quoteCalls, quoteCallsBeforeFreight, "Freight must not call Tapin pricing.");
  const freightReq = await createLocalReq({ user: freightIdentity.customer }, payload);
  const freightInitiated = await adapter.initiatePayment({
    data: { billingAddress: address(freightIdentity.customer.phone) as never, cart: freightCart as never, currency: "TMN", customerEmail: "" },
    req: freightReq,
    transactionsSlug: "transactions",
  });
  createdTransactionIDs.add(Number(freightInitiated.transactionID));
  assert.equal(requestAmounts.at(-1), freightPrice, "Freight Zarinpal payments charge products only.");

  const mixedIdentity = await createCustomer();
  const mixedCartResponse = await replaceStorefrontCart(mixedIdentity.user, parseCartLineReferences([line(parcelVariant.id), line(freightVariant.id)]));
  assert(mixedCartResponse.cartId);
  createdCartIDs.add(mixedCartResponse.cartId);
  assert.equal(mixedCartResponse.shippingMode, "freight", "A mixed cart must be treated entirely as freight.");
  const mixedCart = await payload.findByID({ collection: "carts", id: mixedCartResponse.cartId, depth: 0, overrideAccess: true });
  const mixedPlan = await quoteCartShipping({ items: mixedCart.items ?? [], subtotalInToman: mixedCart.subtotal ?? 0, client: tapinClient });
  assert.equal(mixedPlan.mode, "freight");
  assert.equal(mixedPlan.amountInToman, 0);

  const failureIdentity = await createCustomer();
  const failureCartResponse = await replaceStorefrontCart(failureIdentity.user, parseCartLineReferences([line(parcelVariant.id)]));
  assert(failureCartResponse.cartId);
  createdCartIDs.add(failureCartResponse.cartId);
  const failureCart = await payload.findByID({ collection: "carts", id: failureCartResponse.cartId, depth: 0, overrideAccess: true });
  await assert.rejects(
    quoteCartShipping({
      items: failureCart.items ?? [],
      subtotalInToman: failureCart.subtotal ?? 0,
      destination: { provinceCode: 1, cityCode: 1 },
      serviceID: "priority",
      client: failingTapinClient,
    }),
    /موقتاً در دسترس نیست/,
  );

  assert(initiated.redirectURL);
  payload.logger.info("Shipping verification passed: parcel, freight, mixed-cart fallback, payment totals, API failure, post-payment shipment creation, tracking, and duplicate prevention all work.");
} finally {
  for (const id of createdOrderIDs) await payload.delete({ collection: "orders", id, overrideAccess: true }).catch(() => undefined);
  for (const id of createdTransactionIDs) await payload.delete({ collection: "transactions", id, overrideAccess: true }).catch(() => undefined);
  for (const id of createdCartIDs) await payload.delete({ collection: "carts", id, overrideAccess: true }).catch(() => undefined);
  for (const id of createdCustomerIDs) await payload.delete({ collection: "customers", id, overrideAccess: true }).catch(() => undefined);
  for (const [id, original] of originalVariants) {
    await payload.update({ collection: "variants", id, data: original }).catch(() => undefined);
  }
  await payload.destroy();
}
