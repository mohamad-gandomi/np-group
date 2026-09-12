import "server-only";

import { isSupabaseAdminConfigured } from "./auth-config";
import { toKavenegarReceptor } from "./kavenegar";
import { createAdminClient } from "@/lib/supabase/admin";

export async function resolveLegacySupabaseCustomer(phone: string) {
  if (!isSupabaseAdminConfigured) return null;
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name")
    .in("phone", [phone, toKavenegarReceptor(phone)])
    .limit(1);
  if (error) throw error;
  const profile = data?.[0];
  return profile
    ? { id: String(profile.id), name: typeof profile.full_name === "string" ? profile.full_name : undefined }
    : null;
}
