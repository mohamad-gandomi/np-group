import { externalAmountToToman, tomanToExternalAmount, type ExternalAmountUnit } from "@/payload/money";
import {
  TAPIN_SERVICES,
  type TapinClient,
  type TapinLocation,
  type TapinQuoteInput,
  type TapinShipmentInput,
  type TapinTracking,
} from "../types";

const PUBLIC_API_ORIGIN = "https://public.api.tapin.ir";
const AUTHENTICATED_API_ORIGIN = "https://api.tapin.ir";
const PUBLIC_QUOTE_PATH = "/api/v1/public/check-price/";
const PUBLIC_LOCATIONS_PATH = "/api/v1/public/state/tree/";
const REGISTER_PATH = "/api/v2/public/order/post/register/";
const TRACK_PATH = "/api/v2/public/order/post/get-status/report/";
const REQUEST_TIMEOUT_MS = 15_000;

type TapinEnvelope<T> = {
  entries?: T;
  returns?: { message?: string; status?: number };
};

type TapinClientConfig = {
  amountUnit: ExternalAmountUnit;
  authorization?: string;
  employeeCode?: number;
  kioskID?: number;
  originCityCode: number;
  originProvinceCode: number;
  packagingWeightInGrams: number;
  registerType?: 0 | 1 | 2;
  shopID?: string;
};

export class TapinAPIError extends Error {
  constructor(message: string, readonly code?: number) {
    super(message);
    this.name = "TapinAPIError";
  }
}

export class TapinConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TapinConfigurationError";
  }
}

const positiveInteger = (value: string | undefined, name: string, allowZero = false) => {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || (allowZero ? parsed < 0 : parsed <= 0)) {
    throw new TapinConfigurationError(`${name} باید یک عدد صحیح ${allowZero ? "نامنفی" : "مثبت"} باشد.`);
  }
  return parsed;
};

const optionalInteger = (value: string | undefined, name: string) => {
  if (!value?.trim()) return undefined;
  return positiveInteger(value, name, true);
};

const optionalSignedInteger = (value: string | undefined, name: string) => {
  if (!value?.trim()) return undefined;
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed)) throw new TapinConfigurationError(`${name} باید یک عدد صحیح باشد.`);
  return parsed;
};

const configFromEnvironment = (): TapinClientConfig => {
  const amountUnit = process.env.TAPIN_AMOUNT_UNIT?.trim().toLowerCase();
  if (amountUnit !== "rial" && amountUnit !== "toman") {
    throw new TapinConfigurationError("واحد مبلغ تاپین باید با TAPIN_AMOUNT_UNIT روی rial یا toman تأیید و تنظیم شود.");
  }
  const registerType = optionalInteger(process.env.TAPIN_REGISTER_TYPE, "TAPIN_REGISTER_TYPE");
  if (registerType !== undefined && registerType !== 0 && registerType !== 1 && registerType !== 2) {
    throw new TapinConfigurationError("TAPIN_REGISTER_TYPE باید 0، 1 یا 2 باشد.");
  }
  return {
    amountUnit,
    authorization: process.env.TAPIN_AUTHORIZATION?.trim() || undefined,
    employeeCode: optionalSignedInteger(process.env.TAPIN_EMPLOYEE_CODE, "TAPIN_EMPLOYEE_CODE"),
    kioskID: optionalInteger(process.env.TAPIN_KIOSK_ID, "TAPIN_KIOSK_ID"),
    originCityCode: positiveInteger(process.env.TAPIN_ORIGIN_CITY_CODE, "TAPIN_ORIGIN_CITY_CODE"),
    originProvinceCode: positiveInteger(process.env.TAPIN_ORIGIN_PROVINCE_CODE, "TAPIN_ORIGIN_PROVINCE_CODE"),
    packagingWeightInGrams: positiveInteger(process.env.TAPIN_PACKAGING_WEIGHT_GRAMS, "TAPIN_PACKAGING_WEIGHT_GRAMS", true),
    registerType: registerType as 0 | 1 | 2 | undefined,
    shopID: process.env.TAPIN_SHOP_ID?.trim() || undefined,
  };
};

const normalizeMobile = (value: string) => {
  const digits = value.replace(/\D/g, "");
  if (digits.startsWith("98") && digits.length === 12) return `0${digits.slice(2)}`;
  if (digits.startsWith("9") && digits.length === 10) return `0${digits}`;
  return digits;
};

const splitName = (firstName: string, lastName: string) => {
  if (lastName.trim()) return { firstName: firstName.trim(), lastName: lastName.trim() };
  const parts = firstName.trim().split(/\s+/);
  return { firstName: parts.shift() || "مشتری", lastName: parts.join(" ") || "نیلپر" };
};

async function tapinRequest<T>(url: string, init: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, { ...init, cache: "no-store", signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
  } catch {
    throw new TapinAPIError("ارتباط با تاپین انجام نشد.");
  }
  const envelope = await response.json().catch(() => ({})) as TapinEnvelope<T>;
  const status = envelope.returns?.status;
  if (!response.ok || (status !== undefined && status !== 200 && status !== 201) || envelope.entries === undefined) {
    throw new TapinAPIError(envelope.returns?.message || "پاسخ تاپین معتبر نبود.", status);
  }
  return envelope.entries;
}

const authenticatedHeaders = (config: TapinClientConfig) => {
  if (!config.authorization) {
    throw new TapinConfigurationError("مقدار کامل هدر Authorization تاپین در TAPIN_AUTHORIZATION تنظیم نشده است.");
  }
  return { Accept: "application/json", Authorization: config.authorization, "Content-Type": "application/json" };
};

const authenticatedConfig = (config: TapinClientConfig) => {
  if (!config.shopID || config.employeeCode === undefined || config.kioskID === undefined || config.registerType === undefined) {
    throw new TapinConfigurationError("تنظیمات ثبت مرسوله تاپین (فروشگاه، کارمند، کیوسک و نوع ثبت) کامل نیست.");
  }
  return {
    employeeCode: config.employeeCode,
    kioskID: config.kioskID,
    registerType: config.registerType,
    shopID: config.shopID,
  };
};

const mapProviderStatus = (status: number): TapinTracking["status"] => {
  if (status === 7) return "delivered";
  if ([5, 13, 14, 15, 16, 17, 18, 50].includes(status)) return "in_transit";
  if ([6, 9, 10, 11, 12, 80, 81, 82, 83, 102].includes(status)) return "failed";
  return "created";
};

export function createTapinClient(overrides: Partial<TapinClientConfig> = {}): TapinClient {
  const config = { ...configFromEnvironment(), ...overrides };
  return {
    async getLocations() {
      return getTapinPublicLocations();
    },
    async quote(input: TapinQuoteInput) {
      const service = TAPIN_SERVICES[input.serviceID];
      const totalWeightInGrams = input.totalWeightInGrams + config.packagingWeightInGrams;
      const entries = await tapinRequest<{ total: number }>(`${PUBLIC_API_ORIGIN}${PUBLIC_QUOTE_PATH}`, {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({
          rate_type: "tapin",
          price: tomanToExternalAmount(input.totalValueInToman, config.amountUnit),
          weight: totalWeightInGrams,
          order_type: service.orderType,
          pay_type: 1,
          to_province: input.provinceCode,
          from_province: config.originProvinceCode,
          to_city: input.cityCode,
          from_city: config.originCityCode,
          box_id: input.boxID,
        }),
      });
      const providerAmount = Number(entries.total);
      return {
        amountInToman: externalAmountToToman(providerAmount, config.amountUnit),
        provider: "tapin",
        providerAmount,
        providerAmountUnit: config.amountUnit,
        serviceID: input.serviceID,
        serviceLabel: service.label,
        totalWeightInGrams,
      };
    },
    async createShipment(input: TapinShipmentInput) {
      const account = authenticatedConfig(config);
      const name = splitName(input.firstName, input.lastName);
      const entries = await tapinRequest<{ barcode?: string; order_id: number; status: number }>(`${AUTHENTICATED_API_ORIGIN}${REGISTER_PATH}`, {
        method: "POST",
        headers: authenticatedHeaders(config),
        body: JSON.stringify({
          register_type: account.registerType,
          shop_id: account.shopID,
          address: input.address,
          city_code: input.cityCode,
          province_code: input.provinceCode,
          description: null,
          email: null,
          employee_code: account.employeeCode,
          first_name: name.firstName,
          last_name: name.lastName,
          mobile: normalizeMobile(input.mobile),
          phone: null,
          postal_code: input.postalCode,
          pay_type: 1,
          order_type: TAPIN_SERVICES[input.serviceID].orderType,
          box_id: input.boxID,
          kiosk_id: account.kioskID,
          pre_paid_price: 0,
          package_weight: config.packagingWeightInGrams,
          manual_id: input.manualID,
          has_insurance: true,
          content_type: 1,
          products: input.products.map((product) => ({
            count: product.count,
            discount: 0,
            price: tomanToExternalAmount(product.unitPriceInToman, config.amountUnit),
            title: product.title,
            weight: product.weightInGrams,
            product_id: null,
          })),
        }),
      });
      return {
        shipmentID: String(entries.order_id),
        ...(entries.barcode ? { trackingCode: entries.barcode } : {}),
        providerStatus: entries.status,
      };
    },
    async trackShipment(shipmentID: string) {
      const orderID = Number(shipmentID);
      if (!Number.isSafeInteger(orderID) || orderID <= 0) throw new TapinAPIError("شناسه مرسوله تاپین معتبر نیست.");
      const entries = await tapinRequest<{ list?: Array<{ barcode?: string; order_id: number; status: number }> }>(`${AUTHENTICATED_API_ORIGIN}${TRACK_PATH}`, {
        method: "POST",
        headers: authenticatedHeaders(config),
        body: JSON.stringify({ orders_id: [orderID] }),
      });
      const shipment = entries.list?.find((candidate) => Number(candidate.order_id) === orderID);
      if (!shipment) throw new TapinAPIError("وضعیت مرسوله در پاسخ تاپین پیدا نشد.");
      return {
        shipmentID,
        ...(shipment.barcode ? { trackingCode: shipment.barcode } : {}),
        providerStatus: shipment.status,
        status: mapProviderStatus(shipment.status),
      };
    },
  };
}

export async function getTapinPublicLocations(): Promise<TapinLocation[]> {
  const entries = await tapinRequest<TapinLocation[]>(`${PUBLIC_API_ORIGIN}${PUBLIC_LOCATIONS_PATH}`, {
    method: "GET",
    headers: { Accept: "application/json" },
  });
  return entries.map((province) => ({
    code: Number(province.code),
    title: String(province.title).trim(),
    cities: province.cities.map((city) => ({ code: Number(city.code), title: String(city.title).trim() })),
  }));
}
