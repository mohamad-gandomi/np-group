import type { CurrenciesConfig, Currency } from "@payloadcms/plugin-ecommerce/types";

export const NILPER_COMMERCE_CURRENCY = {
  code: "TMN",
  decimals: 0,
  label: "تومان",
  symbol: "تومان",
  symbolDisplay: "code",
} as const satisfies Currency;

export const NILPER_COMMERCE_CURRENCIES: CurrenciesConfig = {
  defaultCurrency: NILPER_COMMERCE_CURRENCY.code,
  supportedCurrencies: [NILPER_COMMERCE_CURRENCY],
};

export type PaymentGatewayAmountUnit = "rial" | "toman";
export type ExternalAmountUnit = PaymentGatewayAmountUnit;

export function assertTomanAmount(value: number, fieldName = "amount"): number {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error(`${fieldName} must be a non-negative integer Toman amount.`);
  }

  return value;
}

export function validateTomanAmount(value: unknown): true | string {
  if (value === null || value === undefined) return true;
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0
    ? true
    : "مبلغ تومان باید یک عدد صحیح و نامنفی باشد.";
}

export function validateCommerceQuantity(value: unknown): true | string {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0
    ? true
    : "تعداد باید یک عدد صحیح و بزرگ‌تر از صفر باشد.";
}

export function formatToman(value: number, locale = "fa-IR"): string {
  return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(assertTomanAmount(value))} تومان`;
}

/**
 * The only permitted Toman/Rial conversion boundary.
 * Payment adapters must name the unit required by their gateway explicitly.
 */
export function toPaymentGatewayAmount(valueInToman: number, unit: PaymentGatewayAmountUnit): number {
  return tomanToExternalAmount(valueInToman, unit);
}

/** Converts Nilper's canonical integer Toman amount at an explicit provider boundary. */
export function tomanToExternalAmount(valueInToman: number, unit: ExternalAmountUnit): number {
  const amount = assertTomanAmount(valueInToman, "valueInToman");
  const converted = unit === "rial" ? amount * 10 : amount;

  if (!Number.isSafeInteger(converted)) {
    throw new Error("Converted payment amount exceeds JavaScript's safe integer range.");
  }

  return converted;
}

/** Converts a documented external-provider amount into Nilper's canonical integer Toman unit. */
export function externalAmountToToman(value: number, unit: ExternalAmountUnit): number {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error("External amount must be a non-negative safe integer.");
  }
  if (unit === "toman") return value;
  if (value % 10 !== 0) {
    throw new Error("Rial amount cannot be represented as an integer Toman amount.");
  }
  return value / 10;
}
