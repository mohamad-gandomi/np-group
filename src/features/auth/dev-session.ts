import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const DEV_SESSION_COOKIE = "np-dev-session";
const DEV_CHALLENGE_COOKIE = "np-dev-otp";
export const DEVELOPMENT_OTP = "123456";

type DevSession = { phone: string; name?: string; exp: number };
type DevChallenge = { phone: string; exp: number };

function secret() {
  return process.env.AUTH_DEV_SECRET ?? "npgroup-local-development-session-only";
}

function sign(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

function encode(value: DevSession | DevChallenge) {
  const payload = Buffer.from(JSON.stringify(value)).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

function decode<T extends DevSession | DevChallenge>(value?: string) {
  if (!value) return null;
  const [payload, signature] = value.split(".");
  if (!payload || !signature) return null;
  const expected = sign(payload);
  if (signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;

  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString()) as T;
    return parsed.exp > Date.now() ? parsed : null;
  } catch {
    return null;
  }
}

const cookieOptions = { httpOnly: true, sameSite: "lax" as const, secure: false, path: "/" };

export async function setDevChallenge(phone: string) {
  const store = await cookies();
  store.set(DEV_CHALLENGE_COOKIE, encode({ phone, exp: Date.now() + 5 * 60_000 }), { ...cookieOptions, maxAge: 5 * 60 });
}

export async function verifyDevChallenge(phone: string) {
  const store = await cookies();
  const challenge = decode<DevChallenge>(store.get(DEV_CHALLENGE_COOKIE)?.value);
  return challenge?.phone === phone;
}

export async function setDevSession(phone: string, name?: string) {
  const store = await cookies();
  store.set(DEV_SESSION_COOKIE, encode({ phone, name, exp: Date.now() + 7 * 24 * 60 * 60_000 }), { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 });
  store.delete(DEV_CHALLENGE_COOKIE);
}

export async function getDevSession() {
  const store = await cookies();
  return decode<DevSession>(store.get(DEV_SESSION_COOKIE)?.value);
}

export async function clearDevSession() {
  const store = await cookies();
  store.delete(DEV_SESSION_COOKIE);
}
