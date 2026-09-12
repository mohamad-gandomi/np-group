"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getPayload } from "payload";

import config from "../../../../payload.config";
import { CustomerAuthError, requestCustomerOtp, verifyCustomerOtp } from "@/features/auth/customer-otp";
import { setCustomerSessionCookie } from "@/features/auth/customer-session-next";
import { normalizeIranianPhone, toEnglishDigits } from "@/features/auth/phone";

export type OtpActionResult = {
  ok: boolean;
  error?: string;
  phone?: string;
  developmentCode?: string;
  retryAfter?: number;
};

function safeNext(value: string) {
  return value.startsWith("/") && !value.startsWith("//") ? value : "/account";
}

export async function requestOtp(rawPhone: string): Promise<OtpActionResult> {
  const phone = normalizeIranianPhone(rawPhone);
  if (!phone) return { ok: false, error: "شماره موبایل را به‌صورت صحیح وارد کنید." };

  try {
    const requestHeaders = await headers();
    const requestIp = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim()
      ?? requestHeaders.get("x-real-ip")
      ?? "unknown";
    const result = await requestCustomerOtp(await getPayload({ config }), { phone, requestIp });
    return { ok: true, ...result };
  } catch (error) {
    if (error instanceof CustomerAuthError) {
      return { ok: false, error: error.message, retryAfter: error.retryAfter };
    }
    return { ok: false, error: "ارسال کد انجام نشد. کمی بعد دوباره تلاش کنید." };
  }
}

export async function verifyOtp(phoneValue: string, codeValue: string, nextValue: string): Promise<OtpActionResult> {
  const phone = normalizeIranianPhone(phoneValue);
  const code = toEnglishDigits(codeValue).replace(/\D/g, "");
  if (!phone || code.length !== 6) return { ok: false, error: "کد شش‌رقمی را کامل وارد کنید." };

  try {
    const { token } = await verifyCustomerOtp(await getPayload({ config }), { phone, code });
    await setCustomerSessionCookie(token);
  } catch (error) {
    if (error instanceof CustomerAuthError) return { ok: false, error: error.message };
    return { ok: false, error: "کد واردشده صحیح نیست یا منقضی شده است." };
  }

  redirect(safeNext(nextValue));
}
