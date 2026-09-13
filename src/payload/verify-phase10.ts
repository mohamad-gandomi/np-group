import assert from "node:assert/strict";
import { randomInt, randomUUID } from "node:crypto";

import { createLocalReq, getPayload } from "payload";

import config from "../../payload.config";
import { parseCartLineReferences, replaceStorefrontCart } from "../features/cart/payload-cart";
import type { AuthUser } from "../features/auth/session";
import { confirmZarinpalTransaction, zarinpalAdapter } from "../features/payments/zarinpal/adapter";
import type { ZarinpalClient } from "../features/payments/zarinpal/client";
import type { ConfigurationGroup, ConfigurationOption, Product, Transaction, Variant } from "../payload-types";
import { toPaymentGatewayAmount } from "./money";

const payload = await getPayload({ config });
const testPrice = 12_345_678;
const authority = `A${randomUUID().replaceAll("-", "")}`;
const createdCustomerIDs = new Set<number>();
const createdCartIDs = new Set<number>();
const createdTransactionIDs = new Set<number>();
const createdOrderIDs = new Set<number>();
let variant: Variant | undefined;
let originalVariantPrice: number | null | undefined;
let originalVariantPriceEnabled: boolean | null | undefined;
let requestAmount = 0;
let verifyAmount = 0;
let verifyCalls = 0;

const fakeClient: ZarinpalClient = {
  getRedirectURL(value) { return `https://sandbox.zarinpal.com/pg/StartPay/${value}`; },
  async requestPayment(input) {
    requestAmount = input.amountInToman;
    assert.match(input.callbackURL, /\/api\/payments\/zarinpal\/callback\?transaction=\d+$/);
    return { authority, code: 100, fee: 0, feeType: "Merchant" };
  },
  async verifyPayment(input) {
    verifyCalls += 1;
    verifyAmount = input.amountInToman;
    assert.equal(input.authority, authority);
    return { code: 100, referenceID: 987654321, cardPan: "6037-99**-****-1234" };
  },
};

try {
  assert.equal(toPaymentGatewayAmount(testPrice, "rial"), testPrice * 10);
  const customer = await payload.create({
    collection: "customers",
    data: { phone: `+98912${randomInt(10_000_000, 99_999_999)}`, active: true },
    overrideAccess: true,
  });
  createdCustomerIDs.add(customer.id);
  const user: AuthUser = { id: customer.id, phone: customer.phone };

  const products = await payload.find({
    collection: "products",
    depth: 2,
    limit: 1,
    where: { and: [{ slug: { equals: "delan-sofa" } }, { _status: { equals: "published" } }] },
  });
  const product = products.docs[0] as Product | undefined;
  assert(product, "Run `npm run payload:seed` before Phase 10 verification.");
  const groupIDs = (product.configurationGroups ?? []).map((value) => typeof value === "number" ? value : value.id);
  const [groupsResult, optionsResult, variantsResult] = await Promise.all([
    payload.find({ collection: "configuration-groups", depth: 0, pagination: false, where: { id: { in: groupIDs } } }),
    payload.find({ collection: "configuration-options", depth: 0, pagination: false, limit: 100, where: { group: { in: groupIDs } } }),
    payload.find({ collection: "variants", depth: 0, pagination: false, limit: 1, where: { and: [{ product: { equals: product.id } }, { _status: { equals: "published" } }] } }),
  ]);
  const groups = groupsResult.docs as ConfigurationGroup[];
  const options = optionsResult.docs as ConfigurationOption[];
  variant = variantsResult.docs[0] as Variant | undefined;
  assert(variant && groups.length && options.length);
  originalVariantPrice = variant.priceInTMN;
  originalVariantPriceEnabled = variant.priceInTMNEnabled;
  await payload.update({ collection: "variants", id: variant.id, data: { priceInTMNEnabled: true, priceInTMN: testPrice } });

  const configuration = groups.map((group) => {
    const option = options.find((candidate) => (typeof candidate.group === "number" ? candidate.group : candidate.group.id) === group.id);
    assert(option);
    return { groupKey: group.key, optionId: option.id };
  });
  const references = parseCartLineReferences([{ productId: product.id, variantId: variant.id, quantity: 1, configuration }]);
  const cartResponse = await replaceStorefrontCart(user, references);
  assert(cartResponse.cartId);
  createdCartIDs.add(cartResponse.cartId);
  const cart = await payload.findByID({ collection: "carts", id: cartResponse.cartId, depth: 2, overrideAccess: true });
  const req = await createLocalReq({ user: customer }, payload);
  const address = {
    firstName: "مشتری آزمون پرداخت",
    addressLine1: "خیابان آزمون",
    city: "تهران",
    state: "تهران",
    postalCode: "1111111111",
    country: "IR",
    phone: customer.phone,
  };
  const adapter = zarinpalAdapter({ client: fakeClient });
  const initiated = await adapter.initiatePayment({
    data: { billingAddress: address as never, cart: cart as never, currency: "TMN", customerEmail: "" },
    req,
    transactionsSlug: "transactions",
  });
  assert.equal(initiated.redirectURL, `https://sandbox.zarinpal.com/pg/StartPay/${authority}`);
  assert.equal(requestAmount, testPrice);

  const found = await payload.find({
    collection: "transactions",
    depth: 0,
    limit: 1,
    overrideAccess: true,
    where: { "zarinpal.authority": { equals: authority } },
  });
  const transaction = found.docs[0] as Transaction | undefined;
  assert(transaction);
  createdTransactionIDs.add(transaction.id);
  assert.equal(transaction.status, "pending");
  assert.equal(transaction.amount, testPrice);
  assert.equal(transaction.zarinpal?.requestedAmountInRial, testPrice * 10);
  assert.equal((await payload.find({ collection: "orders", where: { sourceCart: { equals: cart.id } }, overrideAccess: true })).totalDocs, 0);

  const confirmed = await confirmZarinpalTransaction({ payload, req, transactionID: transaction.id, authority, status: "OK", client: fakeClient });
  assert.equal(confirmed.status, "succeeded");
  assert(confirmed.orderID);
  createdOrderIDs.add(confirmed.orderID);
  assert.equal(verifyAmount, testPrice);
  assert.equal(verifyCalls, 1);
  const order = await payload.findByID({ collection: "orders", id: confirmed.orderID, depth: 0, overrideAccess: true });
  assert.equal(order.status, "confirmed");
  assert.equal(order.paymentMethod, "zarinpal");
  assert.equal(order.paymentTransaction, transaction.id);
  const succeeded = await payload.findByID({ collection: "transactions", id: transaction.id, depth: 0, overrideAccess: true });
  assert.equal(succeeded.status, "succeeded");
  assert.equal(succeeded.zarinpal?.referenceID, "987654321");

  const duplicate = await confirmZarinpalTransaction({ payload, req, transactionID: transaction.id, authority, status: "OK", client: fakeClient });
  assert.equal(duplicate.orderID, confirmed.orderID);
  assert.equal(verifyCalls, 1, "Duplicate callbacks must return the existing order without re-verification.");
  assert.equal((await payload.find({ collection: "orders", where: { sourceCart: { equals: cart.id } }, overrideAccess: true })).totalDocs, 1);

  const clonedItems = transaction.items?.map((sourceItem) => {
    const item = { ...sourceItem, configuration: sourceItem.configuration?.map((sourceSelection) => {
      const selection = { ...sourceSelection };
      delete selection.id;
      return selection;
    }) };
    delete item.id;
    return item;
  });
  const mismatchedAuthority = `M${randomUUID().replaceAll("-", "")}`;
  const mismatched = await payload.create({
    collection: "transactions",
    data: {
      customer: customer.id,
      cart: cart.id,
      items: clonedItems,
      amount: testPrice,
      currency: "TMN",
      paymentMethod: "zarinpal",
      status: "pending",
      zarinpal: { authority: mismatchedAuthority, requestedAmountInRial: testPrice * 10 + 10 },
    },
    overrideAccess: true,
  });
  createdTransactionIDs.add(mismatched.id);
  await assert.rejects(
    confirmZarinpalTransaction({ payload, req, transactionID: mismatched.id, authority: mismatchedAuthority, status: "OK", client: fakeClient }),
    /مبلغ ذخیره‌شده/,
  );
  assert.equal(verifyCalls, 1, "An amount mismatch must be rejected before contacting verification.");
  assert.equal((await payload.findByID({ collection: "transactions", id: mismatched.id, depth: 0, overrideAccess: true })).status, "failed");

  const cancelledAuthority = `C${randomUUID().replaceAll("-", "")}`;
  const cancelled = await payload.create({
    collection: "transactions",
    data: {
      customer: customer.id,
      cart: cart.id,
      items: clonedItems,
      amount: testPrice,
      currency: "TMN",
      paymentMethod: "zarinpal",
      status: "pending",
      zarinpal: { authority: cancelledAuthority, requestedAmountInRial: testPrice * 10 },
    },
    overrideAccess: true,
  });
  createdTransactionIDs.add(cancelled.id);
  const cancelledResult = await confirmZarinpalTransaction({ payload, req, transactionID: cancelled.id, authority: cancelledAuthority, status: "NOK", client: fakeClient });
  assert.equal(cancelledResult.status, "cancelled");
  assert.equal(verifyCalls, 1, "A cancelled gateway return must not be verified or create an order.");

  payload.logger.info("Phase 10 verification passed: trusted Toman/Rial amounts, authoritative confirmation, cancellation, mismatch rejection, provider references, and idempotent callbacks all work.");
} finally {
  for (const id of createdOrderIDs) await payload.delete({ collection: "orders", id, overrideAccess: true }).catch(() => undefined);
  for (const id of createdTransactionIDs) await payload.delete({ collection: "transactions", id, overrideAccess: true }).catch(() => undefined);
  for (const id of createdCartIDs) await payload.delete({ collection: "carts", id, overrideAccess: true }).catch(() => undefined);
  for (const id of createdCustomerIDs) await payload.delete({ collection: "customers", id, overrideAccess: true }).catch(() => undefined);
  if (variant) {
    await payload.update({
      collection: "variants",
      id: variant.id,
      data: { priceInTMNEnabled: originalVariantPriceEnabled, priceInTMN: originalVariantPrice },
    }).catch(() => undefined);
  }
  await payload.destroy();
}
