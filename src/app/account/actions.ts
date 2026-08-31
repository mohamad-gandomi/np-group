"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { isDevelopmentAuth, isSupabaseConfigured } from "@/features/auth/auth-config";
import { clearDevSession, setDevSession } from "@/features/auth/dev-session";
import { normalizeIranianPhone } from "@/features/auth/phone";
import { requireUser } from "@/features/auth/session";
import { createClient } from "@/lib/supabase/server";

export async function logoutAction() {
  if (isSupabaseConfigured) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } else if (isDevelopmentAuth) {
    await clearDevSession();
  }
  redirect("/");
}

export async function updateProfileAction(formData: FormData) {
  const user = await requireUser();
  const name = String(formData.get("name") ?? "").trim().slice(0, 80);
  if (name.length < 2) return;

  if (isSupabaseConfigured) {
    const supabase = await createClient();
    await Promise.all([
      supabase.auth.updateUser({ data: { full_name: name } }),
      supabase.from("profiles").upsert({ id: user.id, phone: user.phone, full_name: name }),
    ]);
  } else if (isDevelopmentAuth) {
    await setDevSession(user.phone, name);
  }
  revalidatePath("/account", "layout");
}

export async function addAddressAction(formData: FormData) {
  const user = await requireUser();
  if (!isSupabaseConfigured) return;
  const phone = normalizeIranianPhone(String(formData.get("phone") ?? ""));
  const values = {
    user_id: user.id,
    title: String(formData.get("title") ?? "آدرس جدید").trim().slice(0, 40),
    recipient: String(formData.get("recipient") ?? "").trim().slice(0, 80),
    phone: phone ?? user.phone,
    province: String(formData.get("province") ?? "").trim().slice(0, 40),
    city: String(formData.get("city") ?? "").trim().slice(0, 40),
    address_line: String(formData.get("address") ?? "").trim().slice(0, 300),
    postal_code: String(formData.get("postalCode") ?? "").replace(/\D/g, "").slice(0, 10),
  };
  if (!values.recipient || !values.city || !values.address_line) return;
  const supabase = await createClient();
  await supabase.from("addresses").insert(values);
  revalidatePath("/account/addresses");
}
