import "server-only";

import { getPayload } from "payload";
import { cookies, headers } from "next/headers";

import config from "../../../payload.config";
import { CUSTOMER_SESSION_COOKIE, CUSTOMER_SESSION_TTL_SECONDS } from "./customer-session-config";
import { authenticateCustomerSession, revokeCustomerSession } from "./customer-session";

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  priority: "high" as const,
};

export async function setCustomerSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(CUSTOMER_SESSION_COOKIE, token, {
    ...cookieOptions,
    maxAge: CUSTOMER_SESSION_TTL_SECONDS,
  });
}

export async function getPayloadCustomer() {
  const cookieStore = await cookies();
  if (!cookieStore.has(CUSTOMER_SESSION_COOKIE)) return null;
  const payload = await getPayload({ config });
  return authenticateCustomerSession(await headers(), payload);
}

export async function clearCustomerSession() {
  const cookieStore = await cookies();
  if (!cookieStore.has(CUSTOMER_SESSION_COOKIE)) return;
  const payload = await getPayload({ config });
  await revokeCustomerSession(await headers(), payload);
  cookieStore.set(CUSTOMER_SESSION_COOKIE, "", { ...cookieOptions, maxAge: 0 });
}
