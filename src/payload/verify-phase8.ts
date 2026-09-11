import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import { getPayload } from "payload";

import config from "../../payload.config";
import type { AuthUser } from "../features/auth/session";
import {
  getStorefrontCart,
  mergeStorefrontCart,
  parseCartLineReferences,
  replaceStorefrontCart,
  resolveCart,
} from "../features/cart/payload-cart";
import { createStorefrontOrder, getPayloadAccountOrders } from "../features/commerce/payload-orders";
import type { ConfigurationGroup, ConfigurationOption, Product, Variant } from "../payload-types";

const payload = await getPayload({ config });
const runID = randomUUID();
const testPrice = 23_456_789;
const user: AuthUser = { id: `phase8-${runID}`, phone: "09120000000" };
const otherUser: AuthUser = { id: `phase8-other-${runID}`, phone: "09120000001" };

let product: Product | undefined;
let variant: Variant | undefined;
let originalVariantPrice: number | null | undefined;
let originalVariantPriceEnabled: boolean | null | undefined;
const createdCartIDs = new Set<number>();
const createdOrderIDs = new Set<number>();

try {
  const products = await payload.find({
    collection: "products",
    depth: 2,
    limit: 1,
    where: { and: [{ slug: { equals: "delan-sofa" } }, { _status: { equals: "published" } }] },
  });
  product = products.docs[0];
  assert(product, "Run `npm run payload:seed` before Phase 8 verification.");

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
  await payload.update({
    collection: "variants",
    id: variant.id,
    data: { priceInTMNEnabled: true, priceInTMN: testPrice },
  });

  const configuration = groups.map((group) => {
    const option = options.find((candidate) =>
      (typeof candidate.group === "number" ? candidate.group : candidate.group.id) === group.id);
    assert(option);
    return { groupKey: group.key, optionId: option.id };
  });
  const references = parseCartLineReferences([{
    productId: product.id,
    variantId: variant.id,
    quantity: 1,
    configuration,
  }]);

  const guest = await resolveCart(references);
  assert.equal(guest.authenticated, false);
  assert.equal(guest.items.length, 1);
  assert.equal(guest.items[0]?.product.name, product.title);
  assert.equal(guest.items[0]?.product.price, testPrice);
  assert.equal(guest.items[0]?.configuration?.length, groups.length);
  assert.match(guest.items[0]?.product.image ?? "", /^\/api\/media\/file\//);

  const empty = await getStorefrontCart(user);
  assert.equal(empty.authenticated, true);
  assert.equal(empty.items.length, 0);

  const created = await replaceStorefrontCart(user, references);
  assert(created.cartId);
  createdCartIDs.add(created.cartId);
  assert.equal(created.subtotal, testPrice);
  assert.equal(created.items[0]?.quantity, 1);

  const rawCart = await payload.findByID({ collection: "carts", id: created.cartId, depth: 0, overrideAccess: true });
  assert.equal(rawCart.customer, null);
  assert.match(rawCart.storefrontCustomerKey ?? "", /^[a-f0-9]{64}$/);

  const merged = await mergeStorefrontCart(user, [{ ...references[0]!, quantity: 2 }]);
  assert.equal(merged.cartId, created.cartId);
  assert.equal(merged.items.length, 1);
  assert.equal(merged.items[0]?.quantity, 3);
  assert.equal(merged.subtotal, testPrice * 3);

  const replaced = await replaceStorefrontCart(user, [{ ...references[0]!, quantity: 2 }]);
  assert.equal(replaced.items[0]?.quantity, 2);
  assert.equal(replaced.subtotal, testPrice * 2);

  const isolated = await getStorefrontCart(otherUser);
  assert.equal(isolated.items.length, 0, "A storefront user must not read another user's cart.");

  const cleared = await replaceStorefrontCart(user, []);
  assert.equal(cleared.items.length, 0);
  assert.equal(cleared.subtotal, 0);

  await replaceStorefrontCart(user, references);
  const submitted = await createStorefrontOrder(user, {
    name: "مشتری آزمون فاز هشت",
    phone: user.phone,
    province: "خراسان رضوی",
    city: "مشهد",
    address: "بلوار وکیل‌آباد",
    postal: "9180000000",
    delivery: "advisor",
    payment: "invoice",
  });
  const orderID = Number(submitted.id.replace("payload-", ""));
  assert(Number.isSafeInteger(orderID));
  createdOrderIDs.add(orderID);
  assert.match(submitted.orderNumber, /^NP-[A-F0-9]{10}$/);

  const submittedOrder = await payload.findByID({ collection: "orders", id: orderID, depth: 0, overrideAccess: true });
  assert.equal(submittedOrder.status, "pending_review");
  assert.equal(submittedOrder.contactName, "مشتری آزمون فاز هشت");
  assert.equal(submittedOrder.contactPhone, user.phone);
  assert.equal(submittedOrder.amount, testPrice);
  assert.equal(typeof submittedOrder.sourceCart, "number");

  const afterCheckout = await getStorefrontCart(user);
  assert.equal(afterCheckout.items.length, 0, "Purchased carts must no longer be returned as active carts.");
  const accountOrders = await getPayloadAccountOrders(user);
  assert.equal(accountOrders.length, 1);
  assert.equal(accountOrders[0]?.id, submitted.id);
  assert.equal(accountOrders[0]?.status, "pending_review");
  assert.equal(accountOrders[0]?.address, "خراسان رضوی، مشهد، بلوار وکیل‌آباد");
  assert.equal((await getPayloadAccountOrders(otherUser)).length, 0);

  const nextCart = await replaceStorefrontCart(user, references);
  assert(nextCart.cartId && nextCart.cartId !== created.cartId);
  createdCartIDs.add(nextCart.cartId);

  await payload.update({ collection: "orders", id: orderID, data: { status: "delivered" }, overrideAccess: true });
  assert.equal((await getPayloadAccountOrders(user))[0]?.status, "delivered");

  assert.throws(
    () => parseCartLineReferences([{ productId: product!.id, quantity: 21, configuration: [] }]),
    /بین/,
  );

  payload.logger.info("Phase 8 verification passed: authenticated Payload carts and orders persist, isolate, transition, and remain visible in the account model.");
} finally {
  for (const id of createdOrderIDs) {
    await payload.delete({ collection: "orders", id, overrideAccess: true }).catch(() => undefined);
  }
  for (const id of createdCartIDs) {
    await payload.delete({ collection: "carts", id, overrideAccess: true }).catch(() => undefined);
  }
  if (variant) {
    await payload.update({
      collection: "variants",
      id: variant.id,
      data: { priceInTMNEnabled: originalVariantPriceEnabled, priceInTMN: originalVariantPrice },
    }).catch(() => undefined);
  }
  await payload.destroy();
}
