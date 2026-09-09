"use server";

import { redirect } from "next/navigation";

import { isDevelopmentAuth, isSupabaseConfigured } from "@/features/auth/auth-config";
import { DEVELOPMENT_OTP, setDevChallenge, setDevSession, verifyDevChallenge } from "@/features/auth/dev-session";
import { normalizeIranianPhone, toEnglishDigits } from "@/features/auth/phone";
import { createClient } from "@/lib/supabase/server";

export type OtpActionResult = { ok: boolean; error?: string; phone?: string; developmentCode?: string };

function safeNext(value: string) {
  return value.startsWith("/") && !value.startsWith("//") ? value : "/account";
}

export async function requestOtp(rawPhone: string): Promise<OtpActionResult> {
  const phone = normalizeIranianPhone(rawPhone);
  if (!phone) return { ok: false, error: "شماره موبایل را به‌صورت صحیح وارد کنید." };

  if (isSupabaseConfigured) {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithOtp({ phone });
    if (error) return { ok: false, error: "ارسال کد انجام نشد. کمی بعد دوباره تلاش کنید." };
    return { ok: true, phone };
  }

  if (isDevelopmentAuth) {
    await setDevChallenge(phone);
    return { ok: true, phone, developmentCode: DEVELOPMENT_OTP };
  }

  return { ok: false, error: "ورود پیامکی هنوز برای محیط اصلی پیکربندی نشده است." };
}

export async function verifyOtp(phoneValue: string, codeValue: string, nextValue: string): Promise<OtpActionResult> {
  const phone = normalizeIranianPhone(phoneValue);
  const code = toEnglishDigits(codeValue).replace(/\D/g, "");
  if (!phone || code.length !== 6) return { ok: false, error: "کد شش‌رقمی را کامل وارد کنید." };

  if (isSupabaseConfigured) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ phone, token: code, type: "sms" });
    if (error) return { ok: false, error: "کد واردشده صحیح نیست یا منقضی شده است." };
  } else if (isDevelopmentAuth) {
    const validChallenge = await verifyDevChallenge(phone);
    if (!validChallenge || code !== DEVELOPMENT_OTP) return { ok: false, error: "کد واردشده صحیح نیست یا منقضی شده است." };
    await setDevSession(phone);
  } else {
    return { ok: false, error: "ورود پیامکی هنوز برای محیط اصلی پیکربندی نشده است." };
  }

  redirect(safeNext(nextValue));
}
