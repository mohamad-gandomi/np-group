import type { Payload } from "payload";

import type { Order, Transaction } from "@/payload-types";
import { createTapinClient } from "./client";
import { parseTapinService } from "../shipping-plan";
import type { TapinClient, TapinShipmentInput } from "../types";

const inFlightShipments = new Map<number, Promise<ShipmentCreationResult>>();

export type ShipmentCreationResult = {
  created: boolean;
  shipmentID?: string;
  trackingCode?: string;
};

const relationID = (value: unknown) => {
  if (typeof value === "number" && Number.isSafeInteger(value) && value > 0) return value;
  if (value && typeof value === "object" && "id" in value) return relationID(value.id);
  return undefined;
};

const transactionSucceeded = async (payload: Payload, order: Order) => {
  const transactionID = relationID(order.paymentTransaction);
  if (!transactionID) return false;
  const transaction = await payload.findByID({
    collection: "transactions",
    id: transactionID,
    depth: 0,
    overrideAccess: true,
  }) as Transaction;
  return transaction.status === "succeeded" && relationID(transaction.order) === order.id;
};

const buildShipmentInput = (order: Order): TapinShipmentInput => {
  if (order.shippingMode !== "parcel" || order.shippingProvider !== "tapin") {
    throw new Error("این سفارش مرسوله پستی تاپین نیست.");
  }
  if (!order.shippingAddress?.addressLine1 || !order.shippingAddress.phone || !order.shippingAddress.postalCode) {
    throw new Error("نشانی سفارش برای ساخت مرسوله کامل نیست.");
  }
  if (!order.shippingProvinceCode || !order.shippingCityCode || !order.shippingBoxID) {
    throw new Error("اطلاعات مقصد یا بسته تاپین کامل نیست.");
  }
  const serviceID = parseTapinService(order.shippingServiceID);
  const products = (order.items ?? []).map((item) => {
    if (!item.parcelWeightInGramsSnapshot) throw new Error("وزن ردیف سفارش برای ساخت مرسوله ثبت نشده است.");
    return {
      count: item.quantity,
      title: item.productTitleSnapshot,
      unitPriceInToman: item.unitPriceInTMN,
      weightInGrams: item.parcelWeightInGramsSnapshot,
    };
  });
  return {
    address: order.shippingAddress.addressLine1,
    boxID: order.shippingBoxID,
    cityCode: order.shippingCityCode,
    firstName: order.shippingAddress.firstName || order.contactName,
    lastName: order.shippingAddress.lastName || "",
    manualID: order.orderNumber,
    mobile: order.shippingAddress.phone,
    postalCode: order.shippingAddress.postalCode,
    products,
    provinceCode: order.shippingProvinceCode,
    serviceID,
  };
};

async function createOnce(payload: Payload, orderID: number, client?: TapinClient): Promise<ShipmentCreationResult> {
  const order = await payload.findByID({ collection: "orders", id: orderID, depth: 0, overrideAccess: true }) as Order;
  if (order.shippingMode !== "parcel") return { created: false };
  if (order.shippingShipmentID) {
    return { created: false, shipmentID: order.shippingShipmentID, ...(order.shippingTrackingCode ? { trackingCode: order.shippingTrackingCode } : {}) };
  }
  if (order.paymentMethod !== "zarinpal" || !await transactionSucceeded(payload, order)) {
    throw new Error("مرسوله فقط پس از تأیید قطعی پرداخت زرین‌پال ساخته می‌شود.");
  }
  if (order.shippingStatus === "creating") return { created: false };

  await payload.update({
    collection: "orders",
    id: orderID,
    data: { shippingStatus: "creating", shippingFailureMessage: null },
    depth: 0,
    overrideAccess: true,
  });
  try {
    const shipment = await (client ?? createTapinClient()).createShipment(buildShipmentInput(order));
    await payload.update({
      collection: "orders",
      id: orderID,
      data: {
        shippingStatus: "created",
        shippingShipmentID: shipment.shipmentID,
        shippingTrackingCode: shipment.trackingCode,
        shippingProviderStatus: String(shipment.providerStatus),
        shipmentCreatedAt: new Date().toISOString(),
        shippingFailureMessage: null,
      },
      depth: 0,
      overrideAccess: true,
    });
    return { created: true, shipmentID: shipment.shipmentID, ...(shipment.trackingCode ? { trackingCode: shipment.trackingCode } : {}) };
  } catch (error) {
    await payload.update({
      collection: "orders",
      id: orderID,
      data: {
        shippingStatus: "failed",
        shippingFailureMessage: error instanceof Error ? error.message : "ساخت مرسوله تاپین ناموفق بود.",
      },
      depth: 0,
      overrideAccess: true,
    }).catch(() => undefined);
    throw error;
  }
}

export async function ensureTapinShipmentForOrder(
  payload: Payload,
  orderID: number,
  client?: TapinClient,
): Promise<ShipmentCreationResult> {
  const existing = inFlightShipments.get(orderID);
  if (existing) return existing;
  const promise = createOnce(payload, orderID, client).finally(() => inFlightShipments.delete(orderID));
  inFlightShipments.set(orderID, promise);
  return promise;
}

export async function refreshTapinTracking(payload: Payload, orderID: number, client?: TapinClient) {
  const order = await payload.findByID({ collection: "orders", id: orderID, depth: 0, overrideAccess: true }) as Order;
  if (order.shippingMode !== "parcel" || order.shippingProvider !== "tapin" || !order.shippingShipmentID) {
    throw new Error("مرسوله تاپین برای این سفارش ثبت نشده است.");
  }
  const tracking = await (client ?? createTapinClient()).trackShipment(order.shippingShipmentID);
  await payload.update({
    collection: "orders",
    id: order.id,
    data: {
      shippingStatus: tracking.status,
      shippingTrackingCode: tracking.trackingCode || order.shippingTrackingCode,
      shippingProviderStatus: String(tracking.providerStatus),
      shippingFailureMessage: null,
    },
    depth: 0,
    overrideAccess: true,
  });
  return tracking;
}
