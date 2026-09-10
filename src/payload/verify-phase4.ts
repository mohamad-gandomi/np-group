import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { addItem } from "@payloadcms/plugin-ecommerce";
import { createLocalReq, getPayload, ValidationError } from "payload";

import config from "../../payload.config";
import type { Cart, Product } from "../payload-types";
import {
  buildConfigurationKey,
  nilperCartItemMatcher,
} from "./cart-configuration";
import { buildNilperSourceKey } from "./source-identity";

const runID = randomUUID();
const shortID = runID.slice(0, 8);
const created: Partial<Record<string, (number | string)[]>> = {};

const remember = (collection: string, id: number | string) => {
  created[collection] = [...(created[collection] ?? []), id];
};

const source = (entity: "product" | "variant", rawIdentity: string) => ({
  sourceKey: buildNilperSourceKey({ workbookKey: `phase4-${shortID}`, sheet: "verification", entity, rawIdentity }),
  sourceMetadata: {
    workbookKey: `phase4-${shortID}`,
    file: "phase4-verification.xlsx",
    sheet: "verification",
    identityRaw: rawIdentity,
    catalogCodeRaw: rawIdentity,
  },
});

const richText = (text: string): Product["descriptionFa"] => ({
  root: {
    type: "root",
    direction: "rtl",
    format: "",
    indent: 0,
    version: 1,
    children: [
      {
        type: "paragraph",
        direction: "rtl",
        format: "",
        indent: 0,
        version: 1,
        children: [{ type: "text", text, detail: 0, format: 0, mode: "normal", style: "", version: 1 }],
      },
    ],
  },
});

const payload = await getPayload({ config });

try {
  const user = await payload.create({
    collection: "users",
    data: {
      email: `phase4-${shortID}@example.test`,
      password: `Phase4-${runID}!`,
      fullName: `مدیر آزمون ${shortID}`,
      role: "admin",
      active: true,
    },
  });
  remember("users", user.id);
  const req = await createLocalReq({ user }, payload);

  const brand = await payload.create({
    collection: "brands",
    data: { title: `برند آزمون ${shortID}`, slug: `phase4-brand-${shortID}`, published: true },
  });
  remember("brands", brand.id);

  const category = await payload.create({
    collection: "categories",
    data: { title: `دسته آزمون ${shortID}`, slug: `phase4-category-${shortID}`, published: true },
  });
  remember("categories", category.id);

  const variantType = await payload.create({
    collection: "variantTypes",
    data: { label: `فرم آزمون ${shortID}`, name: `phase4-form-${shortID}` },
  });
  remember("variantTypes", variantType.id);

  const variantOption = await payload.create({
    collection: "variantOptions",
    data: { label: "فرم اصلی", value: `main-${shortID}`, variantType: variantType.id },
  });
  remember("variantOptions", variantOption.id);

  const woodGroup = await payload.create({
    collection: "configuration-groups",
    data: { title: "رنگ چوب", key: `wood-${shortID}`, inputType: "swatch", required: true, active: true },
  });
  remember("configuration-groups", woodGroup.id);

  const fabricGroup = await payload.create({
    collection: "configuration-groups",
    data: { title: "پارچه", key: `fabric-${shortID}`, inputType: "select", required: true, active: true },
  });
  remember("configuration-groups", fabricGroup.id);

  const unauthorizedGroup = await payload.create({
    collection: "configuration-groups",
    data: { title: "گروه غیرمجاز", key: `other-${shortID}`, inputType: "select", required: false, active: true },
  });
  remember("configuration-groups", unauthorizedGroup.id);

  const walnut = await payload.create({
    collection: "configuration-options",
    data: { group: woodGroup.id, title: "گردویی", code: "WALNUT", active: true },
  });
  remember("configuration-options", walnut.id);

  const oak = await payload.create({
    collection: "configuration-options",
    data: { group: woodGroup.id, title: "بلوطی", code: "OAK", active: true },
  });
  remember("configuration-options", oak.id);

  const lavender = await payload.create({
    collection: "configuration-options",
    data: { group: fabricGroup.id, title: "LAVENDAR", code: "LAVENDAR", active: true },
  });
  remember("configuration-options", lavender.id);

  const inactiveFabric = await payload.create({
    collection: "configuration-options",
    data: { group: fabricGroup.id, title: "پارچه غیرفعال", code: "INACTIVE", active: false },
  });
  remember("configuration-options", inactiveFabric.id);

  const unauthorizedOption = await payload.create({
    collection: "configuration-options",
    data: { group: unauthorizedGroup.id, title: "گزینه غیرمجاز", code: "OTHER", active: true },
  });
  remember("configuration-options", unauthorizedOption.id);

  const product = await payload.create({
    collection: "products",
    data: {
      title: `محصول پیکربندی ${shortID}`,
      slug: `phase4-product-${shortID}`,
      brand: brand.id,
      categories: [category.id],
      salesMode: "direct",
      availabilityMode: "in_stock",
      priceInTMNEnabled: false,
      descriptionFa: richText("محصول آزمون پیکربندی سبد."),
      configurationGroups: [woodGroup.id, fabricGroup.id],
      enableVariants: true,
      variantTypes: [variantType.id],
      ...source("product", `PRODUCT-${shortID}`),
      _status: "published",
    },
  });
  remember("products", product.id);

  const otherProduct = await payload.create({
    collection: "products",
    data: {
      title: `محصول دیگر ${shortID}`,
      slug: `phase4-other-${shortID}`,
      brand: brand.id,
      categories: [category.id],
      salesMode: "direct",
      availabilityMode: "in_stock",
      priceInTMNEnabled: false,
      descriptionFa: richText("محصول دیگر برای آزمون تعلق گونه."),
      enableVariants: true,
      variantTypes: [variantType.id],
      ...source("product", `OTHER-${shortID}`),
      _status: "published",
    },
  });
  remember("products", otherProduct.id);

  const hiddenProduct = await payload.create({
    collection: "products",
    data: {
      title: `محصول پیش‌نویس ${shortID}`,
      slug: `phase4-hidden-${shortID}`,
      brand: brand.id,
      categories: [category.id],
      salesMode: "direct",
      availabilityMode: "in_stock",
      priceInTMNEnabled: true,
      priceInTMN: 100_000,
      descriptionFa: richText("محصول منتشرنشده."),
      enableVariants: false,
      ...source("product", `HIDDEN-${shortID}`),
      _status: "draft",
    },
    draft: true,
  });
  remember("products", hiddenProduct.id);

  const variant = await payload.create({
    collection: "variants",
    data: {
      product: product.id,
      nilperCode: `PHASE4-${shortID}`,
      options: [variantOption.id],
      priceInTMNEnabled: true,
      priceInTMN: 250_000,
      ...source("variant", `VARIANT-${shortID}`),
      _status: "published",
    },
  });
  remember("variants", variant.id);

  const otherVariant = await payload.create({
    collection: "variants",
    data: {
      product: otherProduct.id,
      nilperCode: `PHASE4-OTHER-${shortID}`,
      options: [variantOption.id],
      priceInTMNEnabled: true,
      priceInTMN: 300_000,
      ...source("variant", `OTHER-VARIANT-${shortID}`),
      _status: "published",
    },
  });
  remember("variants", otherVariant.id);

  const cart = await payload.create({
    collection: "carts",
    data: { customer: user.id, currency: "TMN", subtotal: 1, items: [] },
  });
  remember("carts", cart.id);
  assert.equal(cart.subtotal, 0, "An empty cart subtotal must be server-owned.");

  const walnutFabric = [
    { groupKey: woodGroup.key, option: walnut.id, labelFaSnapshot: "spoofed" },
    { groupKey: fabricGroup.key, option: lavender.id, labelFaSnapshot: "spoofed" },
  ];
  const firstAdd = await addItem({
    payload,
    cartsSlug: "carts",
    cartID: cart.id,
    req,
    cartItemMatcher: nilperCartItemMatcher,
    item: {
      product: product.id,
      variant: variant.id,
      configuration: walnutFabric,
      configurationKey: "spoofed",
      productTitleSnapshot: "spoofed",
      unitPriceInTMN: 1,
    },
  });
  assert.equal(firstAdd.success, true);
  const firstCart = firstAdd.cart as Cart;
  assert.equal(firstCart.items?.length, 1);
  assert.equal(firstCart.items?.[0]?.productTitleSnapshot, product.title);
  assert.equal(firstCart.items?.[0]?.variantCodeSnapshot, variant.nilperCode);
  assert.equal(firstCart.items?.[0]?.unitPriceInTMN, 250_000);
  assert.equal(firstCart.items?.[0]?.configuration?.[0]?.labelFaSnapshot, "LAVENDAR");
  assert.equal(firstCart.items?.[0]?.configuration?.[1]?.labelFaSnapshot, "گردویی");
  assert.equal(firstCart.subtotal, 250_000);
  assert.equal(firstCart.items?.[0]?.configurationKey, buildConfigurationKey(walnutFabric));

  const sameConfigurationReordered = [...walnutFabric].reverse();
  const combined = await addItem({
    payload,
    cartsSlug: "carts",
    cartID: cart.id,
    req,
    cartItemMatcher: nilperCartItemMatcher,
    item: { product: product.id, variant: variant.id, configuration: sameConfigurationReordered },
    quantity: 2,
  });
  const combinedCart = combined.cart as Cart;
  assert.equal(combinedCart.items?.length, 1, "Configuration order must not split a cart line.");
  assert.equal(combinedCart.items?.[0]?.quantity, 3);

  const oakFabric = [
    { groupKey: woodGroup.key, option: oak.id },
    { groupKey: fabricGroup.key, option: lavender.id },
  ];
  const separate = await addItem({
    payload,
    cartsSlug: "carts",
    cartID: cart.id,
    req,
    cartItemMatcher: nilperCartItemMatcher,
    item: { product: product.id, variant: variant.id, configuration: oakFabric },
  });
  const separateCart = separate.cart as Cart;
  assert.equal(separateCart.items?.length, 2, "Different configuration must create a separate cart line.");
  assert.equal(separateCart.subtotal, 1_000_000);

  const subtotalSpoof = await payload.update({
    collection: "carts",
    id: cart.id,
    data: { subtotal: 1 },
  });
  assert.equal(subtotalSpoof.subtotal, 1_000_000, "Partial cart updates must not overwrite or reset the server subtotal.");

  const expectInvalidItem = async (item: Record<string, unknown>) => {
    await assert.rejects(
      addItem({
        payload,
        cartsSlug: "carts",
        cartID: cart.id,
        req,
        cartItemMatcher: nilperCartItemMatcher,
        item: item as never,
      }),
      (error: unknown) => error instanceof ValidationError,
    );
  };

  await expectInvalidItem({
    product: product.id,
    variant: variant.id,
    configuration: [{ groupKey: woodGroup.key, option: walnut.id }],
  });
  await expectInvalidItem({
    product: product.id,
    variant: variant.id,
    configuration: [
      { groupKey: woodGroup.key, option: walnut.id },
      { groupKey: fabricGroup.key, option: inactiveFabric.id },
    ],
  });
  await expectInvalidItem({
    product: product.id,
    variant: variant.id,
    configuration: [
      { groupKey: woodGroup.key, option: walnut.id },
      { groupKey: fabricGroup.key, option: unauthorizedOption.id },
    ],
  });
  await expectInvalidItem({
    product: product.id,
    variant: variant.id,
    configuration: [
      { groupKey: woodGroup.key, option: walnut.id },
      { groupKey: fabricGroup.key, option: lavender.id },
      { groupKey: unauthorizedGroup.key, option: unauthorizedOption.id },
    ],
  });
  await expectInvalidItem({
    product: product.id,
    variant: otherVariant.id,
    configuration: walnutFabric,
  });
  await expectInvalidItem({ product: hiddenProduct.id, configuration: [] });

  const currentCart = await payload.findByID({ collection: "carts", id: cart.id, depth: 0 });
  const order = await payload.create({
    collection: "orders",
    data: {
      amount: 1,
      currency: "TMN",
      items: [currentCart.items![0]!],
      status: "processing",
    },
  });
  remember("orders", order.id);
  assert.equal(order.amount, 750_000, "Order amount must be recalculated from the trusted item price.");

  const transaction = await payload.create({
    collection: "transactions",
    data: {
      amount: 1,
      currency: "TMN",
      items: [currentCart.items![0]!],
      order: order.id,
      cart: cart.id,
      status: "succeeded",
    },
  });
  remember("transactions", transaction.id);
  assert.equal(transaction.amount, 750_000, "Transaction amount must be recalculated from trusted records.");

  await payload.update({ collection: "products", id: product.id, data: { title: `نام جدید ${shortID}` } });
  await payload.update({ collection: "variants", id: variant.id, data: { nilperCode: `UPDATED-${shortID}`, priceInTMN: 999_999 } });
  await payload.update({ collection: "configuration-groups", id: woodGroup.id, data: { title: "عنوان جدید چوب" } });
  await payload.update({ collection: "configuration-options", id: walnut.id, data: { title: "عنوان جدید گردویی" } });

  const preservedOrder = await payload.update({
    collection: "orders",
    id: order.id,
    data: { amount: 1, status: "completed" },
  });
  assert.equal(preservedOrder.amount, 750_000);
  assert.equal(preservedOrder.items?.[0]?.productTitleSnapshot, product.title);
  assert.equal(preservedOrder.items?.[0]?.variantCodeSnapshot, variant.nilperCode);
  assert.equal(preservedOrder.items?.[0]?.unitPriceInTMN, 250_000);
  assert.equal(preservedOrder.items?.[0]?.configuration?.find((selection) => selection.groupKey === woodGroup.key)?.labelFaSnapshot, "گردویی");

  payload.logger.info("Phase 4 verification passed: trusted configuration, normalized matching, server validation, totals, and snapshots.");
} finally {
  for (const collection of [
    "transactions",
    "orders",
    "carts",
    "variants",
    "products",
    "configuration-options",
    "configuration-groups",
    "variantOptions",
    "variantTypes",
    "categories",
    "brands",
    "users",
  ]) {
    for (const id of [...(created[collection] ?? [])].reverse()) {
      await payload.delete({ collection: collection as never, id }).catch(() => undefined);
    }
  }
  await payload.destroy();
}
