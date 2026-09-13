import { toPaymentGatewayAmount } from "@/payload/money";

const REQUEST_PATH = "/pg/v4/payment/request.json";
const VERIFY_PATH = "/pg/v4/payment/verify.json";
const START_PAY_PATH = "/pg/StartPay/";
const REQUEST_TIMEOUT_MS = 15_000;

type ZarinpalEnvelope<T> = {
  data?: T;
  errors?: Array<{ code?: number; message?: string }> | Record<string, unknown>;
};

export type ZarinpalRequestResult = {
  authority: string;
  code: number;
  fee?: number;
  feeType?: string;
};

export type ZarinpalVerifyResult = {
  cardHash?: string;
  cardPan?: string;
  code: number;
  fee?: number;
  feeType?: string;
  referenceID?: number;
};

export interface ZarinpalClient {
  getRedirectURL(authority: string): string;
  requestPayment(input: {
    amountInToman: number;
    callbackURL: string;
    description: string;
    mobile?: string;
  }): Promise<ZarinpalRequestResult>;
  verifyPayment(input: { amountInToman: number; authority: string }): Promise<ZarinpalVerifyResult>;
}

export class ZarinpalGatewayError extends Error {
  constructor(message: string, readonly code?: number) {
    super(message);
    this.name = "ZarinpalGatewayError";
  }
}

const zarinpalConfig = () => {
  const merchantID = process.env.ZARINPAL_MERCHANT_ID?.trim();
  if (!merchantID) throw new ZarinpalGatewayError("شناسه پذیرنده زرین‌پال تنظیم نشده است.");

  const sandboxValue = process.env.ZARINPAL_SANDBOX?.trim().toLowerCase();
  if (sandboxValue !== "true" && sandboxValue !== "false") {
    throw new ZarinpalGatewayError("مقدار ZARINPAL_SANDBOX باید true یا false باشد.");
  }

  const sandbox = sandboxValue === "true";
  return {
    merchantID,
    apiOrigin: sandbox ? "https://sandbox.zarinpal.com" : "https://payment.zarinpal.com",
  };
};

const errorFromEnvelope = (envelope: ZarinpalEnvelope<unknown>, fallback: string) => {
  if (Array.isArray(envelope.errors) && envelope.errors.length) {
    const first = envelope.errors[0];
    return new ZarinpalGatewayError(first?.message || fallback, first?.code);
  }
  if (envelope.errors && Object.keys(envelope.errors).length) {
    const error = envelope.errors as { code?: number; message?: string };
    return new ZarinpalGatewayError(error.message || fallback, error.code);
  }
  return new ZarinpalGatewayError(fallback);
};

async function postZarinpal<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const { apiOrigin } = zarinpalConfig();
  const response = await fetch(`${apiOrigin}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    cache: "no-store",
  });
  const envelope = await response.json().catch(() => ({})) as ZarinpalEnvelope<T>;
  if (!response.ok || !envelope.data) {
    throw errorFromEnvelope(envelope, "ارتباط با زرین‌پال انجام نشد.");
  }
  return envelope.data;
}

export function createZarinpalClient(): ZarinpalClient {
  return {
    getRedirectURL(authority) {
      const { apiOrigin } = zarinpalConfig();
      return `${apiOrigin}${START_PAY_PATH}${encodeURIComponent(authority)}`;
    },
    async requestPayment({ amountInToman, callbackURL, description, mobile }) {
      const { merchantID } = zarinpalConfig();
      const amount = toPaymentGatewayAmount(amountInToman, "rial");
      if (amount < 10_000) throw new ZarinpalGatewayError("حداقل مبلغ پرداخت زرین‌پال ۱۰٬۰۰۰ ریال است.");
      const data = await postZarinpal<{
        authority?: string;
        code?: number;
        fee?: number;
        fee_type?: string;
      }>(REQUEST_PATH, {
        merchant_id: merchantID,
        amount,
        callback_url: callbackURL,
        description,
        currency: "IRR",
        metadata: mobile ? { mobile } : {},
      });
      if (data.code !== 100 || !data.authority) {
        throw new ZarinpalGatewayError("زرین‌پال درخواست پرداخت را نپذیرفت.", data.code);
      }
      return { authority: data.authority, code: data.code, fee: data.fee, feeType: data.fee_type };
    },
    async verifyPayment({ amountInToman, authority }) {
      const { merchantID } = zarinpalConfig();
      const data = await postZarinpal<{
        card_hash?: string;
        card_pan?: string;
        code?: number;
        fee?: number;
        fee_type?: string;
        ref_id?: number;
      }>(VERIFY_PATH, {
        merchant_id: merchantID,
        amount: toPaymentGatewayAmount(amountInToman, "rial"),
        authority,
      });
      if (data.code !== 100 && data.code !== 101) {
        throw new ZarinpalGatewayError("تأیید پرداخت زرین‌پال ناموفق بود.", data.code);
      }
      return {
        code: data.code,
        referenceID: data.ref_id,
        cardHash: data.card_hash,
        cardPan: data.card_pan,
        fee: data.fee,
        feeType: data.fee_type,
      };
    },
  };
}
