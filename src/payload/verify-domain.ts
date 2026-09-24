import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { EcommerceProvider, useCurrency } from "@payloadcms/plugin-ecommerce/client/react";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { getPayload } from "payload";

import config from "../../payload.config";
import type { Product } from "../payload-types";
import {
  NILPER_COMMERCE_CURRENCIES,
  formatToman,
  toPaymentGatewayAmount,
} from "./money";

const runID = randomUUID();
const shortID = runID.slice(0, 8);
const created: Partial<Record<string, (number | string)[]>> = {};

const remember = (collection: string, id: number | string) => {
  created[collection] = [...(created[collection] ?? []), id];
};

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

function CurrencyProbe() {
  const { currency, formatCurrency } = useCurrency();
  const formatted = formatCurrency(1_234_567, { locale: "fa-IR" });
  return createElement("span", { "data-currency": currency.code, "data-formatted": formatted }, formatted);
}

const providerMarkup = renderToStaticMarkup(
  createElement(
    EcommerceProvider,
    { currenciesConfig: NILPER_COMMERCE_CURRENCIES, syncLocalStorage: false },
    createElement(CurrencyProbe),
  ),
);

assert.match(providerMarkup, /data-currency="TMN"/, "EcommerceProvider must select TMN.");
assert.match(providerMarkup, /data-formatted="[^"]*TMN/, "EcommerceProvider must format a TMN amount without throwing.");
assert.equal(formatToman(1_234_567), "۱٬۲۳۴٬۵۶۷ تومان");
assert.equal(toPaymentGatewayAmount(1_234_567, "toman"), 1_234_567);
assert.equal(toPaymentGatewayAmount(1_234_567, "rial"), 12_345_670);
const payload = await getPayload({ config });

try {
  const brand = await payload.create({
    collection: "brands",
    data: { title: `برند آزمون ${shortID}`, slug: `domain-brand-${shortID}`, published: true },
  });
  remember("brands", brand.id);

  const hiddenBrand = await payload.create({
    collection: "brands",
    data: { title: `برند پنهان ${shortID}`, slug: `domain-hidden-brand-${shortID}`, published: false },
  });
  remember("brands", hiddenBrand.id);

  const publicBrands = await payload.find({
    collection: "brands",
    overrideAccess: false,
    where: { id: { in: [brand.id, hiddenBrand.id] } },
  });
  assert.deepEqual(publicBrands.docs.map((doc) => doc.id), [brand.id], "Public access must exclude unpublished content.");

  const category = await payload.create({
    collection: "categories",
    data: { title: `دسته آزمون ${shortID}`, slug: `domain-category-${shortID}`, published: true },
  });
  remember("categories", category.id);

  const series = await payload.create({
    collection: "categories",
    data: { title: `خانواده آزمون ${shortID}`, slug: `domain-family-${shortID}`, parent: category.id, published: true },
  });
  remember("categories", series.id);

  const companion = await payload.create({
    collection: "products",
    data: {
      title: `محصول هماهنگ ${shortID}`,
      slug: `domain-companion-${shortID}`,
      brand: brand.id,
      categories: [category.id, series.id],
      salesMode: "inquiry",
      availabilityMode: "orderable",
      priceInTMNEnabled: false,
      descriptionFa: richText("محصول هماهنگ برای آزمون رابطه صریح."),
      productType: "simple",
      _status: "published",
    },
  });
  remember("products", companion.id);

  const variantType = await payload.create({
    collection: "variantTypes",
    data: { label: `فرم آزمون ${shortID}`, name: `domain-form-${shortID}` },
  });
  remember("variantTypes", variantType.id);

  const variantOption = await payload.create({
    collection: "variantOptions",
    data: { label: "تک نفره", value: `single-${shortID}`, variantType: variantType.id },
  });
  remember("variantOptions", variantOption.id);

  const product = await payload.create({
    collection: "products",
    data: {
      title: `محصول آزمون ${shortID}`,
      slug: `domain-product-${shortID}`,
      brand: brand.id,
      categories: [category.id, series.id],
      salesMode: "direct",
      availabilityMode: "in_stock",
      priceInTMNEnabled: true,
      priceInTMN: 1_234_567,
      descriptionFa: richText("محصول آزمون مدل دامنه نیلپر."),
      measurements: [{ key: "total-height", labelFa: "ارتفاع کلی", value: 90, unit: "cm", sortOrder: 10 }],
      technicalSpecs: [{ key: "frame", labelFa: "جنس اسکلت", valueFa: "چوب راش", group: "construction", sortOrder: 10 }],
      matchingProducts: [companion.id],
      productType: "variable",
      attributes: [{ attribute: variantType.id, allowedOptions: [variantOption.id] }],
      variantAttributes: [variantType.id],
      _status: "published",
    },
  });
  remember("products", product.id);

  await assert.rejects(
    payload.update({ collection: "products", id: product.id, data: { priceInTMN: 1.5 } }),
    "Fractional Toman prices must be rejected.",
  );

  const variant = await payload.create({
    collection: "variants",
    data: {
      product: product.id,
      nilperCode: `PHASE3-${shortID}`,
      options: [variantOption.id],
      priceInTMNEnabled: true,
      priceInTMN: 2_345_678,
      measurements: [
        { key: "seat-width", labelFa: "عرض نشیمن", value: 62, unit: "cm", sortOrder: 10 },
        { key: "fabric", labelFa: "متراژ پارچه", value: 4.5, unit: "m", sortOrder: 20 },
      ],
      _status: "published",
    },
  });
  remember("variants", variant.id);

  const item = {
    product: product.id,
    variant: variant.id,
    quantity: 2,
    configuration: [],
    configurationKey: "[]",
    productTitleSnapshot: product.title,
    variantCodeSnapshot: variant.nilperCode,
    unitPriceInTMN: variant.priceInTMN!,
  };
  const expectedAmount = 4_691_356;

  const cart = await payload.create({ collection: "carts", data: { currency: "TMN", items: [item] } });
  remember("carts", cart.id);
  assert.equal(cart.subtotal, expectedAmount, "Cart subtotal must use the TMN variant price without scaling.");
  await assert.rejects(
    payload.update({ collection: "carts", id: cart.id, data: { items: [{ ...item, quantity: 1.5 }] } }),
    "Fractional cart quantities must be rejected.",
  );

  const order = await payload.create({
    collection: "orders",
    data: {
      amount: expectedAmount,
      currency: "TMN",
      items: [item],
      status: "pending_review",
      orderNumber: `NP-P3-${shortID}`,
      contactName: "مشتری آزمون",
      contactPhone: "09120000000",
      deliveryMethod: "advisor",
      paymentMethod: "invoice",
    },
  });
  remember("orders", order.id);
  assert.equal(order.amount, expectedAmount);
  assert.equal(order.currency, "TMN");
  const protectedOrder = await payload.update({ collection: "orders", id: order.id, data: { amount: 1.5 } });
  assert.equal(protectedOrder.amount, expectedAmount, "Order amount updates without items must be ignored.");

  const transaction = await payload.create({
    collection: "transactions",
    data: { amount: expectedAmount, currency: "TMN", items: [item], order: order.id, cart: cart.id, status: "succeeded" },
  });
  remember("transactions", transaction.id);
  assert.equal(transaction.amount, expectedAmount);
  assert.equal(transaction.currency, "TMN");
  const protectedTransaction = await payload.update({ collection: "transactions", id: transaction.id, data: { amount: 1.5 } });
  assert.equal(protectedTransaction.amount, expectedAmount, "Transaction amount updates without items must be ignored.");

  const apiProduct = await payload.findByID({ collection: "products", id: product.id, depth: 0 });
  const apiVariant = await payload.findByID({ collection: "variants", id: variant.id, depth: 0 });
  assert.equal(apiProduct.priceInTMN, 1_234_567);
  assert.equal(apiVariant.priceInTMN, 2_345_678);
  assert.equal(apiProduct.measurements?.[0]?.key, "total-height");
  assert.equal(apiVariant.measurements?.[1]?.key, "fabric");
  assert.deepEqual(apiProduct.matchingProducts, [companion.id]);

  payload.logger.info("Domain verification passed: schema, access, stable catalog identifiers, TMN flow, and payment boundary.");
} finally {
  for (const collection of ["transactions", "orders", "carts", "variants", "products", "variantOptions", "variantTypes", "categories", "brands"]) {
    for (const id of [...(created[collection] ?? [])].reverse()) {
      await payload.delete({ collection: collection as never, id }).catch(() => undefined);
    }
  }
  await payload.destroy();
}
