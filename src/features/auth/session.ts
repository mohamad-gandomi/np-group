import "server-only";

import { createHash } from "node:crypto";
import { redirect } from "next/navigation";

import { isDevelopmentAuth, isSupabaseConfigured } from "./auth-config";
import { getPayloadCustomer } from "./customer-session-next";
import { getDevSession } from "./dev-session";
import { createClient } from "@/lib/supabase/server";

export type AuthUser = { id: string; phone: string; name?: string; payloadCustomerId?: number };

export async function getCurrentUser(): Promise<AuthUser | null> {
  const customer = await getPayloadCustomer();
  if (customer) {
    return {
      id: customer.storefrontIdentity,
      phone: customer.phone,
      name: customer.fullName ?? undefined,
      payloadCustomerId: customer.id,
    };
  }

  if (isSupabaseConfigured) {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user?.phone) return null;
    return { id: user.id, phone: user.phone, name: typeof user.user_metadata.full_name === "string" ? user.user_metadata.full_name : undefined };
  }

  if (isDevelopmentAuth) {
    const session = await getDevSession();
    if (!session) return null;
    return { id: createHash("sha256").update(session.phone).digest("hex").slice(0, 24), phone: session.phone, name: session.name };
  }

  return null;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/account");
  return user;
}
