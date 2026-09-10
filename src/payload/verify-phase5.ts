import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { addItem } from "@payloadcms/plugin-ecommerce";
import { createLocalReq, getPayload } from "payload";

import config from "../../payload.config";
import type { Cart, ConfigurationGroup, ConfigurationOption, Product, Variant } from "../payload-types";
import { nilperCartItemMatcher } from "./cart-configuration";
import { mapPayloadProduct } from "../features/catalog/payload-catalog-mapper";

const payload = await getPayload({ config });
const runID = randomUUID();
const created: { carts: number[]; orders: number[]; users: number[] } = { carts: [], orders: [], users: [] };
const testPrice = 12_345_678;

let product: Product | undefined;
let variant: Variant | undefined;
let group: ConfigurationGroup | undefined;
let option: ConfigurationOption | undefined;
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
      email: `phase5-${runID}@example.test`,
      password: `Phase5-${runID}!`,
      fullName: "مدیر آزمون برش دلان",
      role: "admin",
      active: true,
    },
  }).then((user) => created.users.push(user.id));
  const user = await payload.findByID({ collection: "users", id: created.users[0]! });
  const req = await createLocalReq({ user }, payload);

  const products = await payload.find({
    collection: "products",
    depth: 2,
    limit: 1,
    where: { and: [{ slug: { equals: "delan-sofa" } }, { _status: { equals: "published" } }] },
  });
  product = products.docs[0];
  assert(product, "Run `npm run payload:seed` before Phase 5 verification.");
  assert.equal(product._status, "published");
  assert.equal(product.sourceMetadata.file, "994.xlsx");
  assert.equal(product.sourceMetadata.sheet, "HSS 994");

  const groupIDs = (product.configurationGroups ?? []).map((value) => typeof value === "number" ? value : value.id);
  const [groupsResult, optionsResult, variantsResult] = await Promise.all([
    payload.find({ collection: "configuration-groups", depth: 0, pagination: false, where: { id: { in: groupIDs } } }),
    payload.find({ collection: "configuration-options", depth: 0, pagination: false, limit: 100, where: { group: { in: groupIDs } } }),
    payload.find({ collection: "variants", depth: 2, pagination: false, limit: 100, where: { and: [{ product: { equals: product.id } }, { _status: { equals: "published" } }] } }),
  ]);
  const groups = groupsResult.docs;
  const options = optionsResult.docs;
  const variants = variantsResult.docs;
  assert.equal(groups.length, 2);
  assert(variants.length >= 2);

  const mapped = mapPayloadProduct(product, {
    configurationGroups: groups,
    configurationOptions: options,
    variants,
  });
  assert.equal(mapped.source, "payload");
  assert.equal(mapped.name, "مبل دلان");
  assert(mapped.description?.includes("نئوکلاسیک"));
  assert.equal(mapped.configurationGroups?.length, 2);
  assert(mapped.configurationGroups?.every((item) => item.options.length > 1));
  assert(mapped.variants?.some((item) => item.code === "NHSS94012"));

  variant = variants[0];
  group = groups[0];
  option = options.find((item) => (typeof item.group === "number" ? item.group : item.group.id) === group!.id);
  assert(variant && group && option);
  originalProductTitle = product.title;
  originalVariantCode = variant.nilperCode;
  originalVariantPrice = variant.priceInTMN;
  originalVariantPriceEnabled = variant.priceInTMNEnabled;
  originalGroupTitle = group.title;
  originalOptionTitle = option.title;

  await payload.update({
    collection: "variants",
    id: variant.id,
    data: { priceInTMNEnabled: true, priceInTMN: testPrice },
  });

  const configuration = groups.map((item) => {
    const selected = options.find((candidate) => (typeof candidate.group === "number" ? candidate.group : candidate.group.id) === item.id);
    assert(selected);
    return { groupKey: item.key, option: selected.id };
  });
  const alternateGroup = groups.find((item) => options.filter((candidate) => (typeof candidate.group === "number" ? candidate.group : candidate.group.id) === item.id).length > 1)!;
  const alternateOptions = options.filter((candidate) => (typeof candidate.group === "number" ? candidate.group : candidate.group.id) === alternateGroup.id);
  const alternateConfiguration = configuration.map((selection) => selection.groupKey === alternateGroup.key
    ? { groupKey: selection.groupKey, option: alternateOptions[1]!.id }
    : selection);

  const cart = await payload.create({ collection: "carts", data: { customer: user.id, currency: "TMN", items: [] } });
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
    data: { amount: 1, currency: "TMN", items: [trustedLine], status: "processing" },
  });
  created.orders.push(order.id);
  assert.equal(order.amount, testPrice * 3);

  await payload.update({ collection: "products", id: product.id, data: { title: `نام موقت ${runID}` } });
  await payload.update({ collection: "variants", id: variant.id, data: { nilperCode: `TEMP-${runID}`, priceInTMN: testPrice + 1 } });
  await payload.update({ collection: "configuration-groups", id: group.id, data: { title: `گروه موقت ${runID}` } });
  await payload.update({ collection: "configuration-options", id: option.id, data: { title: `گزینه موقت ${runID}` } });

  const preserved = await payload.update({ collection: "orders", id: order.id, data: { status: "completed" } });
  assert.equal(preserved.amount, testPrice * 3);
  assert.equal(preserved.items?.[0]?.productTitleSnapshot, originalProductTitle);
  assert.equal(preserved.items?.[0]?.variantCodeSnapshot, originalVariantCode);
  assert.equal(preserved.items?.[0]?.unitPriceInTMN, testPrice);
  assert(preserved.items?.[0]?.configuration?.some((selection) => selection.groupLabelFaSnapshot === originalGroupTitle));
  assert(preserved.items?.[0]?.configuration?.some((selection) => selection.labelFaSnapshot === originalOptionTitle));

  payload.logger.info("Phase 5 verification passed: seeded Delan mapping, configuration-aware cart identity/totals, and historical order snapshots.");
} finally {
  for (const id of created.orders.reverse()) await payload.delete({ collection: "orders", id }).catch(() => undefined);
  for (const id of created.carts.reverse()) await payload.delete({ collection: "carts", id }).catch(() => undefined);
  if (product && originalProductTitle) await payload.update({ collection: "products", id: product.id, data: { title: originalProductTitle } }).catch(() => undefined);
  if (variant && originalVariantCode) await payload.update({ collection: "variants", id: variant.id, data: { nilperCode: originalVariantCode, priceInTMNEnabled: originalVariantPriceEnabled, priceInTMN: originalVariantPrice } }).catch(() => undefined);
  if (group && originalGroupTitle) await payload.update({ collection: "configuration-groups", id: group.id, data: { title: originalGroupTitle } }).catch(() => undefined);
  if (option && originalOptionTitle) await payload.update({ collection: "configuration-options", id: option.id, data: { title: originalOptionTitle } }).catch(() => undefined);
  for (const id of created.users.reverse()) await payload.delete({ collection: "users", id }).catch(() => undefined);
  await payload.destroy();
}
