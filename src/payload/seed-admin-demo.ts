import { getPayload } from "payload";

import config from "../../payload.config";
import type { Customer, Order, OrderStatus, Product, Transaction } from "../payload-types";

const payload = await getPayload({ config });
const DEMO_ORDER_PREFIX = "DEMO-NP-";
const customerNames = [
  "آرمان محمدی",
  "نیلوفر کریمی",
  "سامان رضایی",
  "ترانه مرادی",
  "کیان احمدی",
  "مهسا حسینی",
  "بردیا اکبری",
  "پریسا رحیمی",
  "امیرحسین صادقی",
  "رها جعفری",
  "ماهان نادری",
  "یلدا کاظمی",
] as const;
const customerCreatedDaysAgo = [1, 2, 3, 5, 6, 8, 10, 12, 45, 58, 72, 95] as const;
const productPrices = [89_500_000, 62_800_000, 41_900_000, 28_600_000, 19_750_000, 14_400_000] as const;
const orderStatuses: NonNullable<OrderStatus>[] = [
  "pending_review", "confirmed", "in_production", "ready", "shipped", "delivered", "cancelled",
];
const shippingStatuses: NonNullable<Order["shippingStatus"]>[] = [
  "manual_coordination", "quoted", "shipment_pending", "failed", "created", "in_transit", "delivered",
];
const transactionStatuses: Transaction["status"][] = [
  "succeeded", "succeeded", "pending", "failed", "succeeded", "refunded", "cancelled", "expired",
];

type DemoProduct = {
  configuration: { groupKey: string; option: number }[];
  id: number;
  price: number;
  title: string;
};

const relationID = (value: unknown): number | undefined => {
  if (typeof value === "number") return value;
  if (value && typeof value === "object" && "id" in value && typeof value.id === "number") return value.id;
  return undefined;
};

const daysAgo = (days: number, hour = 12) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(hour, 15, 0, 0);
  return date.toISOString();
};

const validationDetails = (error: unknown) => {
  if (!error || typeof error !== "object" || !("data" in error)) return undefined;
  return JSON.stringify(error.data);
};

async function ensureCustomers() {
  const customers: Customer[] = [];

  for (const [index, fullName] of customerNames.entries()) {
    const phone = `09120001${String(index + 1).padStart(3, "0")}`;
    const existing = await payload.find({
      collection: "customers",
      depth: 0,
      limit: 1,
      overrideAccess: true,
      where: { phone: { equals: phone } },
    });
    const data = {
      active: index !== customerNames.length - 1,
      createdAt: daysAgo(customerCreatedDaysAgo[index], 10),
      fullName,
      phone,
    };
    const customer = existing.docs[0]
      ? await payload.update({ collection: "customers", id: existing.docs[0].id, data: data as never, overrideAccess: true })
      : await payload.create({ collection: "customers", data: data as never, overrideAccess: true });
    customers.push(customer);
  }

  return customers;
}

async function getConfiguration(product: Product) {
  const selections: DemoProduct["configuration"] = [];

  for (const assignment of product.attributes ?? []) {
    if (!assignment.required) continue;
    const groupID = relationID(assignment.attribute);
    if (!groupID) continue;
    const group = await payload.findByID({
      collection: "variantTypes",
      depth: 0,
      id: groupID,
      overrideAccess: true,
    });
    if (group.active !== true) continue;

    const options = await payload.find({
      collection: "variantOptions",
      depth: 0,
      limit: 1,
      overrideAccess: true,
      sort: "sortOrder",
      where: { and: [{ id: { in: (assignment.allowedOptions ?? []).map(relationID) } }, { active: { equals: true } }] },
    });
    const option = options.docs[0];
    if (!option) throw new Error(`No active configuration option found for demo product ${product.title}.`);
    selections.push({ groupKey: group.name, option: option.id });
  }

  return selections;
}

async function prepareProducts() {
  const products = await payload.find({
    collection: "products",
    depth: 0,
    limit: productPrices.length,
    overrideAccess: true,
    sort: "title",
    where: {
      and: [
        { _status: { equals: "published" } },
        { availabilityMode: { not_equals: "unavailable" } },
      ],
    },
  });

  if (products.docs.length < productPrices.length) {
    throw new Error("Admin demo seed needs at least six published products. Run `npm run payload:seed` first.");
  }

  const demoProducts: DemoProduct[] = [];
  for (const [index, product] of products.docs.entries()) {
    const price = productPrices[index];
    const updated = await payload.update({
      collection: "products",
      id: product.id,
      data: {
        _status: "published",
        availabilityMode: "orderable",
        priceInTMN: price,
        priceInTMNEnabled: true,
        shippingMode: "freight",
      },
      depth: 0,
      draft: false,
      overrideAccess: true,
    });
    demoProducts.push({
      configuration: await getConfiguration(updated),
      id: updated.id,
      price,
      title: updated.title,
    });
  }

  return demoProducts;
}

function orderStatus(index: number): NonNullable<OrderStatus> {
  if (index < 6) return "pending_review";
  if (index < 12) return "confirmed";
  if (index < 18) return "in_production";
  if (index < 22) return "ready";
  if (index < 26) return "shipped";
  if (index < 31) return "delivered";
  return "cancelled";
}

function shippingStatus(index: number, status: NonNullable<OrderStatus>): NonNullable<Order["shippingStatus"]> {
  if (status === "shipped") return "in_transit";
  if (status === "delivered") return "delivered";
  if (status === "ready") return index % 2 === 0 ? "shipment_pending" : "created";
  if (status === "cancelled") return index % 2 === 0 ? "failed" : "manual_coordination";
  return shippingStatuses[index % 4];
}

function rawItems(products: DemoProduct[], index: number) {
  const primary = products[index % products.length];
  const items = [{
    configuration: primary.configuration.map((selection) => ({ ...selection })),
    product: primary.id,
    quantity: index % 5 === 0 ? 2 : 1,
  }];

  if (index % 4 === 0) {
    const secondary = products[(index + 2) % products.length];
    items.push({
      configuration: secondary.configuration.map((selection) => ({ ...selection })),
      product: secondary.id,
      quantity: 1,
    });
  }
  return items;
}

async function ensureOrders(customers: Customer[], products: DemoProduct[]) {
  const orders: Array<{ document: Order; items: ReturnType<typeof rawItems> }> = [];

  for (let index = 0; index < 34; index += 1) {
    const sequence = String(index + 1).padStart(4, "0");
    const orderNumber = `${DEMO_ORDER_PREFIX}${sequence}`;
    const customer = customers[index % customers.length];
    const status = orderStatus(index);
    const shipment = shippingStatus(index, status);
    const items = rawItems(products, index);
    const createdAt = daysAgo(index % 30, 9 + (index % 8));
    const shippingAmountInTMN = 650_000 + (index % 5) * 175_000;
    const hasShipment = ["created", "in_transit", "delivered"].includes(shipment);
    const existing = await payload.find({
      collection: "orders",
      depth: 0,
      limit: 1,
      overrideAccess: true,
      where: { orderNumber: { equals: orderNumber } },
    });
    const data = {
      contactName: customer.fullName ?? `مشتری نمونه ${sequence}`,
      contactPhone: customer.phone,
      createdAt,
      currency: "TMN",
      customer: customer.id,
      customerEmail: `customer.${String(customer.id)}@demo.npgroup.test`,
      deliveryMethod: "advisor",
      items,
      orderNumber,
      paymentMethod: index % 3 === 0 ? "zarinpal" : "invoice",
      shippingAddress: {
        addressLine1: `خیابان نمونه، کوچه ${index + 1}، پلاک ${10 + index}`,
        city: index % 3 === 0 ? "کرج" : "تهران",
        country: "IR",
        firstName: customer.fullName,
        phone: customer.phone,
        postalCode: `14${String(10000000 + index).padStart(8, "0")}`,
        state: index % 3 === 0 ? "البرز" : "تهران",
        title: "منزل",
      },
      shippingAmountInTMN,
      shippingFailureMessage: shipment === "failed" ? "عدم دریافت پاسخ از سرویس حمل؛ نیازمند پیگیری دستی" : null,
      shippingMode: "freight",
      shippingProvider: "manual",
      shippingProviderStatus: shipment === "delivered" ? "تحویل نهایی" : null,
      shippingShipmentID: hasShipment ? `DEMO-SHIP-${sequence}` : null,
      shippingStatus: shipment,
      shippingTrackingCode: hasShipment ? `9900${sequence}` : null,
      shipmentCreatedAt: hasShipment ? createdAt : null,
      status,
    };
    let document: Order;
    try {
      document = existing.docs[0]
        ? await payload.update({ collection: "orders", id: existing.docs[0].id, data: data as never, depth: 0, overrideAccess: true })
        : await payload.create({ collection: "orders", data: data as never, depth: 0, overrideAccess: true });
    } catch (error) {
      const details = validationDetails(error);
      throw new Error(`Could not seed ${orderNumber}${details ? `: ${details}` : "."}`, { cause: error });
    }
    orders.push({ document, items });
  }

  return orders;
}

async function ensureTransactions(orders: Array<{ document: Order; items: ReturnType<typeof rawItems> }>) {
  for (const [index, { document: order, items }] of orders.slice(0, 24).entries()) {
    const sequence = String(index + 1).padStart(4, "0");
    const markerEmail = `transaction.${sequence}@demo.npgroup.test`;
    const status = transactionStatuses[index % transactionStatuses.length];
    const customerID = relationID(order.customer);
    const existing = await payload.find({
      collection: "transactions",
      depth: 0,
      limit: 1,
      overrideAccess: true,
      where: { customerEmail: { equals: markerEmail } },
    });
    const data = {
      billingAddress: order.shippingAddress,
      createdAt: order.createdAt,
      currency: "TMN",
      customer: customerID,
      customerEmail: markerEmail,
      items,
      order: order.id,
      paymentMethod: "zarinpal",
      shippingAmountInTMN: order.shippingAmountInTMN ?? 0,
      shippingMode: "freight",
      shippingProvider: "manual",
      status,
      zarinpal: {
        authority: `DEMO-AUTHORITY-${sequence}`,
        failureMessage: status === "failed" ? "پرداخت توسط درگاه تأیید نشد" : null,
        referenceID: status === "succeeded" ? `7842${sequence}` : null,
        verifiedAt: status === "succeeded" ? order.createdAt : null,
      },
    };
    const transaction = existing.docs[0]
      ? await payload.update({ collection: "transactions", id: existing.docs[0].id, data: data as never, depth: 0, overrideAccess: true })
      : await payload.create({ collection: "transactions", data: data as never, depth: 0, overrideAccess: true });

    await payload.update({
      collection: "orders",
      id: order.id,
      data: { paymentTransaction: transaction.id, transactions: [transaction.id] },
      depth: 0,
      overrideAccess: true,
    });
  }
}

try {
  const products = await prepareProducts();
  const customers = await ensureCustomers();
  const orders = await ensureOrders(customers, products);
  await ensureTransactions(orders);

  const statusCounts = Object.fromEntries(await Promise.all(orderStatuses.map(async (status) => {
    const result = await payload.count({
      collection: "orders",
      overrideAccess: true,
      where: { and: [{ orderNumber: { like: `${DEMO_ORDER_PREFIX}%` } }, { status: { equals: status } }] },
    });
    return [status, result.totalDocs];
  })));

  payload.logger.info({
    customers: customers.length,
    orders: orders.length,
    products: products.length,
    statusCounts,
    transactions: 24,
  }, "Payload admin demo data is ready.");
} finally {
  await payload.destroy();
}
