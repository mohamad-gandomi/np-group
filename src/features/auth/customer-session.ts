import { createHmac, randomBytes } from "node:crypto";
import type { AuthStrategy, Payload, PayloadRequest } from "payload";

import type { Customer } from "@/payload-types";
import { CUSTOMER_SESSION_COOKIE, CUSTOMER_SESSION_TTL_SECONDS } from "./customer-session-config";

function sessionSecret() {
  const secret = process.env.PAYLOAD_SECRET;
  if (!secret) throw new Error("PAYLOAD_SECRET is required for customer sessions.");
  return createHmac("sha256", secret).update("nilper-customer-session-v1").digest();
}

function hashToken(token: string) {
  return createHmac("sha256", sessionSecret()).update(token).digest("hex");
}

function readCookie(headers: Headers, name: string) {
  const cookieHeader = headers.get("cookie");
  if (!cookieHeader) return null;

  for (const pair of cookieHeader.split(/;\s*/)) {
    const separator = pair.indexOf("=");
    if (separator < 0 || pair.slice(0, separator) !== name) continue;
    try {
      return decodeURIComponent(pair.slice(separator + 1));
    } catch {
      return null;
    }
  }
  return null;
}

function isSafeSessionToken(value: string | null): value is string {
  if (!value || !/^[A-Za-z0-9_-]{43}$/.test(value)) return false;
  const expectedLength = 32;
  try {
    const decoded = Buffer.from(value, "base64url");
    return decoded.length === expectedLength;
  } catch {
    return false;
  }
}

export async function createCustomerSession(
  payload: Payload,
  customerId: Customer["id"],
  challengeKey: string,
  req?: PayloadRequest,
) {
  const token = randomBytes(32).toString("base64url");
  await payload.create({
    collection: "customer-sessions",
    data: {
      customer: customerId,
      tokenHash: hashToken(token),
      challengeKey,
      expiresAt: new Date(Date.now() + CUSTOMER_SESSION_TTL_SECONDS * 1000).toISOString(),
    },
    depth: 0,
    overrideAccess: true,
    req,
  });
  return token;
}

export async function authenticateCustomerSession(headers: Headers, payload: Payload): Promise<Customer | null> {
  const token = readCookie(headers, CUSTOMER_SESSION_COOKIE);
  if (!isSafeSessionToken(token)) return null;

  try {
    const sessions = await payload.find({
      collection: "customer-sessions",
      where: {
        and: [
          { tokenHash: { equals: hashToken(token) } },
          { revokedAt: { exists: false } },
          { expiresAt: { greater_than: new Date().toISOString() } },
        ],
      },
      depth: 0,
      limit: 1,
      overrideAccess: true,
    });
    const session = sessions.docs[0];
    if (!session) return null;
    const customerId = typeof session.customer === "object" ? session.customer.id : session.customer;
    const customer = await payload.findByID({
      collection: "customers",
      id: customerId,
      depth: 0,
      overrideAccess: true,
    });
    return customer.active === false ? null : customer;
  } catch {
    return null;
  }
}

export async function revokeCustomerSession(headers: Headers, payload: Payload) {
  const token = readCookie(headers, CUSTOMER_SESSION_COOKIE);
  if (!isSafeSessionToken(token)) return;
  const sessions = await payload.find({
    collection: "customer-sessions",
    where: {
      and: [
        { tokenHash: { equals: hashToken(token) } },
        { revokedAt: { exists: false } },
      ],
    },
    depth: 0,
    limit: 1,
    overrideAccess: true,
  });
  const session = sessions.docs[0];
  if (!session) return;
  await payload.update({
    collection: "customer-sessions",
    id: session.id,
    data: { revokedAt: new Date().toISOString() },
    depth: 0,
    overrideAccess: true,
  });
}

export const customerSessionStrategy: AuthStrategy = {
  name: "nilper-customer-session",
  authenticate: async ({ headers, payload }) => {
    const customer = await authenticateCustomerSession(headers, payload);
    return {
      user: customer
        ? { ...customer, collection: "customers", _strategy: "nilper-customer-session" }
        : null,
    };
  },
};
