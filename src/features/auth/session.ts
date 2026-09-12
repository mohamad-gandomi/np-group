import "server-only";

import { redirect } from "next/navigation";

import { getPayloadCustomer } from "./customer-session-next";

export type AuthUser = { id: number; phone: string; name?: string };

export async function getCurrentUser(): Promise<AuthUser | null> {
  const customer = await getPayloadCustomer();
  if (customer) {
    return {
      id: customer.id,
      phone: customer.phone,
      name: customer.fullName ?? undefined,
    };
  }

  return null;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/account");
  return user;
}
