export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
export const SUPABASE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
export const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY;

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY);
export const isDevelopmentAuth = process.env.NODE_ENV !== "production" && !isSupabaseConfigured;

export function getSupabaseConfig() {
  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    throw new Error("Supabase authentication is not configured.");
  }

  return { url: SUPABASE_URL, key: SUPABASE_PUBLISHABLE_KEY };
}

export function getSupabaseAdminConfig() {
  if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) throw new Error("Supabase admin access is not configured.");
  return { url: SUPABASE_URL, key: SUPABASE_SECRET_KEY };
}
