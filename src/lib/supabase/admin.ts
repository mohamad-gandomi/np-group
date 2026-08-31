import "server-only";

import { createClient } from "@supabase/supabase-js";

import { getSupabaseAdminConfig } from "@/features/auth/auth-config";

export function createAdminClient() {
  const { url, key } = getSupabaseAdminConfig();
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
