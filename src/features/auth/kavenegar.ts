import { normalizeIranianPhone } from "./phone";

type KavenegarResponse = {
  return?: { status?: number; message?: string };
  entries?: Array<{ messageid?: number | string }>;
};

export class KavenegarDeliveryError extends Error {
  constructor(message: string, readonly providerStatus?: number) {
    super(message);
  }
}

export function isKavenegarConfigured() {
  return Boolean(process.env.KAVENEGAR_API_KEY && process.env.KAVENEGAR_OTP_TEMPLATE);
}

export function toKavenegarReceptor(phone: string) {
  const normalized = normalizeIranianPhone(phone);
  if (!normalized) throw new KavenegarDeliveryError("Invalid Iranian mobile number.");
  return `0${normalized.slice(3)}`;
}

export async function sendKavenegarOtp(phone: string, code: string) {
  const apiKey = process.env.KAVENEGAR_API_KEY;
  const template = process.env.KAVENEGAR_OTP_TEMPLATE;
  if (!apiKey || !template) throw new KavenegarDeliveryError("Kavenegar is not configured.");

  const endpoint = `https://api.kavenegar.com/v1/${encodeURIComponent(apiKey)}/verify/lookup.json`;
  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        receptor: toKavenegarReceptor(phone),
        token: code,
        template,
        type: "sms",
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    throw new KavenegarDeliveryError("Kavenegar request failed.");
  }

  let body: KavenegarResponse;
  try {
    body = (await response.json()) as KavenegarResponse;
  } catch {
    throw new KavenegarDeliveryError("Kavenegar returned an invalid response.", response.status);
  }

  const providerStatus = body.return?.status ?? response.status;
  const messageId = body.entries?.[0]?.messageid;
  if (!response.ok || providerStatus !== 200 || messageId === undefined) {
    throw new KavenegarDeliveryError(body.return?.message ?? "Kavenegar rejected the request.", providerStatus);
  }

  return { messageId: String(messageId) };
}
