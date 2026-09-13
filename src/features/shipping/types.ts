export type ShippingMode = "parcel" | "freight";
export type ShippingProvider = "tapin" | "manual";
export type TapinServiceID = "custom" | "priority";

export type ShippingDestination = {
  provinceCode: number;
  cityCode: number;
};

export type TapinLocation = {
  code: number;
  title: string;
  cities: { code: number; title: string }[];
};

export type TrustedShippingProduct = {
  count: number;
  title: string;
  unitPriceInToman: number;
  weightInGrams: number;
};

export type TapinQuoteInput = ShippingDestination & {
  boxID: number;
  serviceID: TapinServiceID;
  totalValueInToman: number;
  totalWeightInGrams: number;
};

export type TapinQuote = {
  amountInToman: number;
  provider: "tapin";
  serviceID: TapinServiceID;
  serviceLabel: string;
  providerAmount: number;
  providerAmountUnit: "rial" | "toman";
  totalWeightInGrams: number;
};

export type FreightShippingPlan = {
  amountInToman: 0;
  mode: "freight";
  provider: "manual";
  serviceID: "manual_quote";
  serviceLabel: "هماهنگی باربری پس از ثبت سفارش";
};

export type ParcelShippingPlan = ShippingDestination & {
  amountInToman: number;
  boxID: number;
  mode: "parcel";
  products: TrustedShippingProduct[];
  provider: "tapin";
  serviceID: TapinServiceID;
  serviceLabel: string;
  totalWeightInGrams: number;
};

export type ShippingPlan = FreightShippingPlan | ParcelShippingPlan;

export type TapinShipmentInput = ShippingDestination & {
  address: string;
  boxID: number;
  firstName: string;
  lastName: string;
  manualID: string;
  mobile: string;
  postalCode: string;
  products: TrustedShippingProduct[];
  serviceID: TapinServiceID;
};

export type TapinShipment = {
  providerStatus: number;
  shipmentID: string;
  trackingCode?: string;
};

export type TapinTracking = TapinShipment & {
  status: "created" | "in_transit" | "delivered" | "failed";
};

export interface TapinClient {
  createShipment(input: TapinShipmentInput): Promise<TapinShipment>;
  getLocations(): Promise<TapinLocation[]>;
  quote(input: TapinQuoteInput): Promise<TapinQuote>;
  trackShipment(shipmentID: string): Promise<TapinTracking>;
}

export const TAPIN_SERVICES: Record<TapinServiceID, { label: string; orderType: 0 | 1 }> = {
  custom: { label: "پست سفارشی", orderType: 0 },
  priority: { label: "پست پیشتاز", orderType: 1 },
};
