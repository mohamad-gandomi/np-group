"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  createPayloadAccountAddress,
  updatePayloadCustomerProfile,
} from "@/features/account/payload-account";
import { clearCustomerSession } from "@/features/auth/customer-session-next";
import { normalizeIranianPhone, toEnglishDigits } from "@/features/auth/phone";
import { requireUser } from "@/features/auth/session";

export async function logoutAction() {
  await clearCustomerSession();
  redirect("/");
}

export async function updateProfileAction(formData: FormData) {
  const user = await requireUser();
  const name = String(formData.get("name") ?? "").trim().slice(0, 80);
  if (name.length < 2) return;
  await updatePayloadCustomerProfile(user, name);
  revalidatePath("/account", "layout");
}

export async function addAddressAction(formData: FormData) {
  const user = await requireUser();
  const phone = normalizeIranianPhone(String(formData.get("phone") ?? ""));
  const input = {
    title: String(formData.get("title") ?? "آدرس جدید").trim().slice(0, 40) || "آدرس جدید",
    recipient: String(formData.get("recipient") ?? "").trim().slice(0, 80),
    phone: phone ?? user.phone,
    province: String(formData.get("province") ?? "").trim().slice(0, 40),
    city: String(formData.get("city") ?? "").trim().slice(0, 40),
    address: String(formData.get("address") ?? "").trim().slice(0, 300),
    postalCode: toEnglishDigits(String(formData.get("postalCode") ?? "")).replace(/\D/g, "").slice(0, 10),
  };
  if (!input.recipient || !input.province || !input.city || !input.address) return;
  await createPayloadAccountAddress(user, input);
  revalidatePath("/account");
  revalidatePath("/account/addresses");
}
