import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { addItem } from "@payloadcms/plugin-ecommerce";
import { createLocalReq, getPayload } from "payload";

import config from "../../payload.config";
import type { Cart, VariantType, VariantOption, Product, Variant } from "../payload-types";
import { nilperCartItemMatcher } from "./cart-configuration";
import { mapPayloadProduct } from "../features/catalog/payload-catalog-mapper";

const payload = await getPayload({ config });
const runID = randomUUID();
const created: { carts: number[]; customers: number[]; orders: number[]; users: number[] } = { carts: [], customers: [], orders: [], users: [] };
const testPrice = 12_345_678;

let product: Product | undefined;
let variant: Variant | undefined;
let group: VariantType | undefined;
let option: VariantOption | undefined;
let originalProductTitle: string | undefined;
let originalVariantCode: string | undefined;
let originalVariantPrice: number | null | undefined;
let originalVariantPriceEnabled: boolean | null | undefined;
let originalGroupTitle: string | undefined;
let originalOptionTitle: string | undefined;

try {
  await payload.create({
    collection: "users",
    data: {
      email: `storefront-cart-${runID}@example.test`,
      password: `StorefrontCart-${runID}!`,
      fullName: "مدیر آزمون برش دلان",
      role: "admin",
      active: true,
    },
  }).then((user) => created.users.push(user.id));
  const user = await payload.findByID({ collection: "users", id: created.users[0]! });
  const req = await createLocalReq({ user }, payload);
  const customer = await payload.create({
    collection: "customers",
    data: {
      phone: `+989${runID.replace(/[^0-9]/g, "").padEnd(9, "0").slice(0, 9)}`,
      active: true,
    },
  });
  created.customers.push(customer.id);

  const products = await payload.find({
    collection: "products",
    depth: 2,
    limit: 1,
    where: { and: [{ slug: { equals: "delan-sofa" } }, { _status: { equals: "published" } }] },
  });
  product = products.docs[0];
  assert(product, "Run `npm run payload:seed` before storefront cart verification.");
  assert.equal(product._status, "published");
  assert.equal(product.slug, "delan-sofa");
  assert.equal(product.catalogCode, "NHSS 994");

  const groupIDs = (product.attributes ?? []).filter((row) => row.required).map((row) => typeof row.attribute === "number" ? row.attribute : row.attribute.id);
  const [groupsResult, optionsResult, variantsResult] = await Promise.all([
    payload.find({ collection: "variantTypes", depth: 0, pagination: false, where: { id: { in: groupIDs } } }),
    payload.find({ collection: "variantOptions", depth: 0, pagination: false, limit: 100, where: { variantType: { in: groupIDs } } }),
    payload.find({ collection: "variants", depth: 2, pagination: false, limit: 100, where: { and: [{ product: { equals: product.id } }, { _status: { equals: "published" } }] } }),
  ]);
  const groups = groupsResult.docs;
  const options = optionsResult.docs;
  const variants = variantsResult.docs;
  assert.equal(groups.length, 2);
  assert(variants.length >= 2);

  const mapped = mapPayloadProduct(product, {
    attributes: groups,
    attributeOptions: options,
    variants,
  });
  assert.equal(mapped.name, "مبل دلان");
  assert.match(mapped.image, /^\/api\/media\/file\//, "Same-app Payload media must use a local image path.");
  assert(!mapped.image.includes("localhost"), "Storefront image URLs must not capture Payload's local server URL.");
  assert(mapped.description?.includes("نئوکلاسیک"));
  assert.equal(mapped.attributes?.length, 2);
  assert(mapped.attributes?.every((item) => item.options.length > 1));
  assert(mapped.variants?.some((item) => item.code === "NHSS94012"));

  variant = variants[0];
  group = groups[0];
  option = options.find((item) => (typeof item.variantType === "number" ? item.variantType : item.variantType.id) === group!.id);
  assert(variant && group && option);
  originalProductTitle = product.title;
  originalVariantCode = variant.nilperCode;
  originalVariantPrice = variant.priceInTMN;
  originalVariantPriceEnabled = variant.priceInTMNEnabled;
  originalGroupTitle = group.label;
  originalOptionTitle = option.label;

  await payload.update({
    collection: "variants",
    id: variant.id,
    data: { priceInTMNEnabled: true, priceInTMN: testPrice },
  });

  const configuration = groups.map((item) => {
    const selected = options.find((candidate) => (typeof candidate.variantType === "number" ? candidate.variantType : candidate.variantType.id) === item.id);
    assert(selected);
    return { groupKey: item.name, option: selected.id };
  });
  const alternateGroup = groups.find((item) => options.filter((candidate) => (typeof candidate.variantType === "number" ? candidate.variantType : candidate.variantType.id) === item.id).length > 1)!;
  const alternateOptions = options.filter((candidate) => (typeof candidate.variantType === "number" ? candidate.variantType : candidate.variantType.id) === alternateGroup.id);
  const alternateConfiguration = configuration.map((selection) => selection.groupKey === alternateGroup.name
    ? { groupKey: selection.groupKey, option: alternateOptions[1]!.id }
    : selection);

  const cart = await payload.create({ collection: "carts", data: { customer: customer.id, currency: "TMN", items: [] } });
  created.carts.push(cart.id);
  await addItem({ payload, cartsSlug: "carts", cartID: cart.id, req, cartItemMatcher: nilperCartItemMatcher, item: { product: product.id, variant: variant.id, configuration } });
  const combined = await addItem({ payload, cartsSlug: "carts", cartID: cart.id, req, cartItemMatcher: nilperCartItemMatcher, item: { product: product.id, variant: variant.id, configuration: [...configuration].reverse() }, quantity: 2 });
  const combinedCart = combined.cart as Cart;
  assert.equal(combinedCart.items?.length, 1);
  assert.equal(combinedCart.items?.[0]?.quantity, 3);
  const split = await addItem({ payload, cartsSlug: "carts", cartID: cart.id, req, cartItemMatcher: nilperCartItemMatcher, item: { product: product.id, variant: variant.id, configuration: alternateConfiguration } });
  const splitCart = split.cart as Cart;
  assert.equal(splitCart.items?.length, 2);
  assert.equal(splitCart.subtotal, testPrice * 4);

  const trustedLine = splitCart.items?.[0];
  assert(trustedLine);
  const order = await payload.create({
    collection: "orders",
    data: {
      amount: 1,
      currency: "TMN",
      items: [trustedLine],
      status: "pending_review",
      orderNumber: `NP-P5-${runID.slice(0, 8)}`,
      contactName: "مشتری آزمون",
      contactPhone: "09120000000",
      deliveryMethod: "advisor",
      paymentMethod: "invoice",
    },
  });
  created.orders.push(order.id);
  assert.equal(order.amount, testPrice * 3);

  await payload.update({ collection: "products", id: product.id, data: { title: `نام موقت ${runID}` } });
  await payload.update({ collection: "variants", id: variant.id, data: { nilperCode: `TEMP-${runID}`, priceInTMN: testPrice + 1 } });
  await payload.update({ collection: "variantTypes", id: group.id, data: { label: `گروه موقت ${runID}` } });
  await payload.update({ collection: "variantOptions", id: option.id, data: { label: `گزینه موقت ${runID}` } });

  const preserved = await payload.update({ collection: "orders", id: order.id, data: { status: "confirmed" } });
  assert.equal(preserved.amount, testPrice * 3);
  assert.equal(preserved.items?.[0]?.productTitleSnapshot, originalProductTitle);
  assert.equal(preserved.items?.[0]?.variantCodeSnapshot, originalVariantCode);
  assert.equal(preserved.items?.[0]?.unitPriceInTMN, testPrice);
  assert(preserved.items?.[0]?.configuration?.some((selection) => selection.groupLabelFaSnapshot === originalGroupTitle));
  assert(preserved.items?.[0]?.configuration?.some((selection) => selection.labelFaSnapshot === originalOptionTitle));

  payload.logger.info("Storefront cart verification passed: seeded Delan mapping, configuration-aware cart identity/totals, and historical order snapshots.");
} finally {
  for (const id of created.orders.reverse()) await payload.delete({ collection: "orders", id }).catch(() => undefined);
  for (const id of created.carts.reverse()) await payload.delete({ collection: "carts", id }).catch(() => undefined);
  if (product && originalProductTitle) await payload.update({ collection: "products", id: product.id, data: { title: originalProductTitle } }).catch(() => undefined);
  if (variant && originalVariantCode) await payload.update({ collection: "variants", id: variant.id, data: { nilperCode: originalVariantCode, priceInTMNEnabled: originalVariantPriceEnabled, priceInTMN: originalVariantPrice } }).catch(() => undefined);
  if (group && originalGroupTitle) await payload.update({ collection: "variantTypes", id: group.id, data: { label: originalGroupTitle } }).catch(() => undefined);
  if (option && originalOptionTitle) await payload.update({ collection: "variantOptions", id: option.id, data: { label: originalOptionTitle } }).catch(() => undefined);
  for (const id of created.customers.reverse()) await payload.delete({ collection: "customers", id, overrideAccess: true }).catch(() => undefined);
  for (const id of created.users.reverse()) await payload.delete({ collection: "users", id }).catch(() => undefined);
  await payload.destroy();
}
