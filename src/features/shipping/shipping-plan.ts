import type { Cart, Order, Transaction } from "@/payload-types";
import { assertTomanAmount } from "@/payload/money";
import { createTapinClient } from "./tapin/client";
import {
  TAPIN_SERVICES,
  type ShippingDestination,
  type ShippingPlan,
  type TapinClient,
  type TapinServiceID,
  type TrustedShippingProduct,
} from "./types";

type CommerceItems = NonNullable<Cart["items"] | Order["items"] | Transaction["items"]>;

export class ShippingRequestError extends Error {}

const positiveInteger = (value: unknown, label: string) => {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) throw new ShippingRequestError(`${label} معتبر نیست.`);
  return parsed;
};

export function parseTapinService(value: unknown): TapinServiceID {
  if (value === "custom" || value === "priority") return value;
  throw new ShippingRequestError("سرویس ارسال تاپین معتبر نیست.");
}

export function parseShippingDestination(value: unknown): ShippingDestination {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new ShippingRequestError("مقصد ارسال معتبر نیست.");
  }
  const destination = value as Record<string, unknown>;
  return {
    provinceCode: positiveInteger(destination.provinceCode, "کد استان مقصد"),
    cityCode: positiveInteger(destination.cityCode, "کد شهر مقصد"),
  };
}

const freightPlan = (): ShippingPlan => ({
  amountInToman: 0,
  mode: "freight",
  provider: "manual",
  serviceID: "manual_quote",
  serviceLabel: "هماهنگی باربری پس از ثبت سفارش",
});

export function cartShippingMode(items: CommerceItems | null | undefined): "parcel" | "freight" {
  if (!items?.length) return "freight";
  return items.every((item) => item.shippingModeSnapshot === "parcel") ? "parcel" : "freight";
}

const parcelProducts = (items: CommerceItems): { boxID: number; products: TrustedShippingProduct[]; totalWeight: number } => {
  const boxIDs = new Set<number>();
  let totalWeight = 0;
  const products = items.map((item, index) => {
    const weight = positiveInteger(item.parcelWeightInGramsSnapshot, `وزن پستی ردیف ${index + 1}`);
    const boxID = positiveInteger(item.tapinBoxIDSnapshot, `شناسه بسته ردیف ${index + 1}`);
    boxIDs.add(boxID);
    const lineWeight = weight * item.quantity;
    if (!Number.isSafeInteger(lineWeight) || !Number.isSafeInteger(totalWeight + lineWeight)) {
      throw new ShippingRequestError("وزن کل مرسوله از محدوده مجاز خارج است.");
    }
    totalWeight += lineWeight;
    return {
      count: item.quantity,
      title: item.productTitleSnapshot,
      unitPriceInToman: assertTomanAmount(item.unitPriceInTMN, "unitPriceInTMN"),
      weightInGrams: weight,
    };
  });
  if (boxIDs.size !== 1) {
    throw new ShippingRequestError("کالاهای پستی این سبد شناسه بسته متفاوت دارند و باید در سفارش‌های جدا ثبت شوند.");
  }
  return { boxID: [...boxIDs][0]!, products, totalWeight };
};

export async function quoteCartShipping(input: {
  client?: TapinClient;
  destination?: ShippingDestination;
  items: CommerceItems;
  serviceID?: TapinServiceID;
  subtotalInToman: number;
}): Promise<ShippingPlan> {
  const subtotalInToman = assertTomanAmount(input.subtotalInToman, "subtotalInToman");
  if (cartShippingMode(input.items) === "freight") return freightPlan();
  if (!input.destination || !input.serviceID) {
    throw new ShippingRequestError("مقصد و سرویس برای مرسوله پستی الزامی است.");
  }
  const parcel = parcelProducts(input.items);
  const quote = await (input.client ?? createTapinClient()).quote({
    ...input.destination,
    boxID: parcel.boxID,
    serviceID: input.serviceID,
    totalValueInToman: subtotalInToman,
    totalWeightInGrams: parcel.totalWeight,
  });
  return {
    ...input.destination,
    amountInToman: quote.amountInToman,
    boxID: parcel.boxID,
    mode: "parcel",
    products: parcel.products,
    provider: "tapin",
    serviceID: input.serviceID,
    serviceLabel: quote.serviceLabel || TAPIN_SERVICES[input.serviceID].label,
    totalWeightInGrams: quote.totalWeightInGrams,
  };
}

export function shippingPlanData(plan: ShippingPlan) {
  if (plan.mode === "freight") {
    return {
      shippingMode: plan.mode,
      shippingAmountInTMN: plan.amountInToman,
      shippingProvider: plan.provider,
      shippingServiceID: plan.serviceID,
      shippingServiceLabel: plan.serviceLabel,
      shippingProvinceCode: null,
      shippingCityCode: null,
      shippingWeightInGrams: null,
      shippingBoxID: null,
      shippingQuotedAt: null,
    } as const;
  }
  return {
    shippingMode: plan.mode,
    shippingAmountInTMN: plan.amountInToman,
    shippingProvider: plan.provider,
    shippingServiceID: plan.serviceID,
    shippingServiceLabel: plan.serviceLabel,
    shippingProvinceCode: plan.provinceCode,
    shippingCityCode: plan.cityCode,
    shippingWeightInGrams: plan.totalWeightInGrams,
    shippingBoxID: plan.boxID,
    shippingQuotedAt: new Date().toISOString(),
  } as const;
}

export function totalWithShipping(subtotalInToman: number, plan: ShippingPlan) {
  return assertTomanAmount(assertTomanAmount(subtotalInToman) + plan.amountInToman, "totalInToman");
}
