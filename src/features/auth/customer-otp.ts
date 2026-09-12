import { createHmac, randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import { commitTransaction, createLocalReq, initTransaction, killTransaction } from "payload";
import type { Customer, CustomerOtpChallenge } from "@/payload-types";
import type { Payload } from "payload";

import { createCustomerSession } from "./customer-session";
import { isKavenegarConfigured, sendKavenegarOtp } from "./kavenegar";
import { normalizeIranianPhone } from "./phone";

const OTP_TTL_MS = 5 * 60_000;
const RESEND_COOLDOWN_MS = 60_000;
const RATE_WINDOW_MS = 15 * 60_000;
const MAX_PHONE_SENDS = 5;
const MAX_IP_SENDS = 20;
const MAX_ATTEMPTS = 5;
export const DEVELOPMENT_OTP = "123456";

type DeliveryResult = { messageId: string; developmentCode?: string };
type DeliverOtp = (phone: string, code: string) => Promise<DeliveryResult>;

export class CustomerAuthError extends Error {
  constructor(message: string, readonly retryAfter?: number) {
    super(message);
  }
}

function otpSecret() {
  const secret = process.env.PAYLOAD_SECRET;
  if (!secret) throw new Error("PAYLOAD_SECRET is required for customer OTP authentication.");
  return createHmac("sha256", secret).update("nilper-customer-otp-v1").digest();
}

function keyedHash(value: string) {
  return createHmac("sha256", otpSecret()).update(value).digest("hex");
}

function codeHash(phone: string, salt: string, code: string) {
  return keyedHash(`${phone}:${salt}:${code}`);
}

function hashesMatch(left: string, right: string) {
  const leftBuffer = Buffer.from(left, "hex");
  const rightBuffer = Buffer.from(right, "hex");
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

async function defaultDelivery(phone: string, code: string): Promise<DeliveryResult> {
  if (isKavenegarConfigured()) return sendKavenegarOtp(phone, code);
  if (process.env.NODE_ENV !== "production") {
    return { messageId: "development", developmentCode: code };
  }
  throw new CustomerAuthError("ورود پیامکی هنوز برای محیط اصلی پیکربندی نشده است.");
}

export async function requestCustomerOtp(
  payload: Payload,
  input: { phone: string; requestIp: string; deliverOtp?: DeliverOtp },
) {
  const phone = normalizeIranianPhone(input.phone);
  if (!phone) throw new CustomerAuthError("شماره موبایل را به‌صورت صحیح وارد کنید.");

  const now = Date.now();
  const phoneKey = keyedHash(`phone:${phone}`);
  const requestIpKey = keyedHash(`ip:${(input.requestIp || "unknown").slice(0, 128)}`);
  const windowStart = new Date(now - RATE_WINDOW_MS).toISOString();
  const [latest, phoneCount, ipCount] = await Promise.all([
    payload.find({
      collection: "customer-otp-challenges",
      where: { phoneKey: { equals: phoneKey } },
      sort: "-createdAt",
      limit: 1,
      depth: 0,
      overrideAccess: true,
    }),
    payload.count({
      collection: "customer-otp-challenges",
      where: { and: [{ phoneKey: { equals: phoneKey } }, { createdAt: { greater_than_equal: windowStart } }] },
      overrideAccess: true,
    }),
    payload.count({
      collection: "customer-otp-challenges",
      where: { and: [{ requestIpKey: { equals: requestIpKey } }, { createdAt: { greater_than_equal: windowStart } }] },
      overrideAccess: true,
    }),
  ]);

  const lastSentAt = latest.docs[0]?.createdAt ? new Date(latest.docs[0].createdAt).getTime() : 0;
  if (lastSentAt && now - lastSentAt < RESEND_COOLDOWN_MS) {
    const retryAfter = Math.ceil((RESEND_COOLDOWN_MS - (now - lastSentAt)) / 1000);
    throw new CustomerAuthError("برای ارسال دوباره کمی صبر کنید.", retryAfter);
  }
  if (phoneCount.totalDocs >= MAX_PHONE_SENDS || ipCount.totalDocs >= MAX_IP_SENDS) {
    throw new CustomerAuthError("تعداد درخواست‌ها زیاد است. کمی بعد دوباره تلاش کنید.", Math.ceil(RATE_WINDOW_MS / 1000));
  }

  const code = (input.deliverOtp || isKavenegarConfigured())
    ? String(randomInt(100000, 1_000_000))
    : DEVELOPMENT_OTP;
  const salt = randomBytes(16).toString("base64url");
  const challenge = await payload.create({
    collection: "customer-otp-challenges",
    data: {
      phoneKey,
      requestIpKey,
      codeHash: codeHash(phone, salt, code),
      codeSalt: salt,
      expiresAt: new Date(now + OTP_TTL_MS).toISOString(),
      attempts: 0,
      deliveryState: "pending",
    },
    depth: 0,
    overrideAccess: true,
  });

  try {
    const delivery = await (input.deliverOtp ?? defaultDelivery)(phone, code);
    await payload.update({
      collection: "customer-otp-challenges",
      id: challenge.id,
      data: { deliveryState: "delivered", providerMessageId: delivery.messageId },
      depth: 0,
      overrideAccess: true,
    });
    return { phone, retryAfter: RESEND_COOLDOWN_MS / 1000, developmentCode: delivery.developmentCode };
  } catch (error) {
    await payload.update({
      collection: "customer-otp-challenges",
      id: challenge.id,
      data: { deliveryState: "failed" },
      depth: 0,
      overrideAccess: true,
    });
    if (error instanceof CustomerAuthError) throw error;
    payload.logger.error({ err: error }, "Kavenegar OTP delivery failed.");
    throw new CustomerAuthError("ارسال کد انجام نشد. کمی بعد دوباره تلاش کنید.");
  }
}

async function findOrCreateCustomer(
  payload: Payload,
  phone: string,
  req?: Awaited<ReturnType<typeof createLocalReq>>,
): Promise<Customer> {
  const existing = await payload.find({
    collection: "customers",
    where: { phone: { equals: phone } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
    req,
  });
  if (existing.docs[0]) return existing.docs[0];

  return payload.create({
    collection: "customers",
    data: {
      phone,
      active: true,
    },
    depth: 0,
    overrideAccess: true,
    req,
  });
}

function assertUsableChallenge(challenge: CustomerOtpChallenge | undefined) {
  if (
    !challenge ||
    challenge.deliveryState !== "delivered" ||
    challenge.consumedAt ||
    new Date(challenge.expiresAt).getTime() <= Date.now() ||
    challenge.attempts >= MAX_ATTEMPTS
  ) {
    throw new CustomerAuthError("کد واردشده صحیح نیست یا منقضی شده است.");
  }
  return challenge;
}

export async function verifyCustomerOtp(
  payload: Payload,
  input: {
    phone: string;
    code: string;
  },
) {
  const phone = normalizeIranianPhone(input.phone);
  const code = input.code.replace(/\D/g, "");
  if (!phone || code.length !== 6) throw new CustomerAuthError("کد شش‌رقمی را کامل وارد کنید.");
  const phoneKey = keyedHash(`phone:${phone}`);
  const result = await payload.find({
    collection: "customer-otp-challenges",
    where: { phoneKey: { equals: phoneKey } },
    sort: "-createdAt",
    limit: 1,
    depth: 0,
    overrideAccess: true,
  });
  const challenge = assertUsableChallenge(result.docs[0]);
  const valid = hashesMatch(challenge.codeHash, codeHash(phone, challenge.codeSalt, code));
  if (!valid) {
    await payload.update({
      collection: "customer-otp-challenges",
      id: challenge.id,
      data: { attempts: Math.min(MAX_ATTEMPTS, challenge.attempts + 1) },
      depth: 0,
      overrideAccess: true,
    });
    throw new CustomerAuthError("کد واردشده صحیح نیست یا منقضی شده است.");
  }

  const req = await createLocalReq({}, payload);
  const transactionStarted = await initTransaction(req);
  try {
    const fresh = assertUsableChallenge(await payload.findByID({
      collection: "customer-otp-challenges",
      id: challenge.id,
      depth: 0,
      overrideAccess: true,
      req,
    }));
    if (!hashesMatch(fresh.codeHash, codeHash(phone, fresh.codeSalt, code))) {
      throw new CustomerAuthError("کد واردشده صحیح نیست یا منقضی شده است.");
    }
    const customer = await findOrCreateCustomer(payload, phone, req);
    if (customer.active === false) throw new CustomerAuthError("این حساب غیرفعال است. با پشتیبانی تماس بگیرید.");
    const token = await createCustomerSession(payload, customer.id, String(fresh.id), req);
    await payload.update({
      collection: "customer-otp-challenges",
      id: fresh.id,
      data: { consumedAt: new Date().toISOString() },
      depth: 0,
      overrideAccess: true,
      req,
    });
    if (transactionStarted) await commitTransaction(req);
    return { customer, token };
  } catch (error) {
    if (transactionStarted) await killTransaction(req);
    throw error;
  }
}
