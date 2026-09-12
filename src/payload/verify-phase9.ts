import assert from "node:assert/strict";
import { randomInt, randomUUID } from "node:crypto";
import { getPayload } from "payload";

import config from "../../payload.config";
import {
  CustomerAuthError,
  requestCustomerOtp,
  verifyCustomerOtp,
} from "../features/auth/customer-otp";
import {
  authenticateCustomerSession,
  revokeCustomerSession,
} from "../features/auth/customer-session";
import { CUSTOMER_SESSION_COOKIE } from "../features/auth/customer-session-config";
import { normalizeIranianPhone } from "../features/auth/phone";

const payload = await getPayload({ config });
const runId = randomUUID();
const phone = (offset: number) => `091${String(randomInt(100_000_000, 899_999_999) + offset).slice(0, 8)}`;
const challengeIds: number[] = [];
const customerIds: number[] = [];
const sessionIds: number[] = [];

async function rememberCreatedRecords() {
  const [challenges, customers, sessions] = await Promise.all([
    payload.find({ collection: "customer-otp-challenges", where: { providerMessageId: { contains: runId } }, limit: 100, depth: 0, overrideAccess: true }),
    payload.find({ collection: "customers", where: { storefrontIdentity: { contains: runId } }, limit: 100, depth: 0, overrideAccess: true }),
    payload.find({ collection: "customer-sessions", where: { challengeKey: { exists: true } }, limit: 1000, depth: 0, overrideAccess: true }),
  ]);
  challengeIds.push(...challenges.docs.map((doc) => doc.id));
  customerIds.push(...customers.docs.map((doc) => doc.id));
  sessionIds.push(...sessions.docs.filter((doc) => challengeIds.includes(Number(doc.challengeKey))).map((doc) => doc.id));
}

try {
  assert.equal(normalizeIranianPhone("۰۹۱۲ ۱۲۳ ۴۵۶۷"), "+989121234567");

  const lockedPhone = phone(1);
  let lockedCode = "";
  const lockedRequest = await requestCustomerOtp(payload, {
    phone: lockedPhone,
    requestIp: `phase9-lock-${runId}`,
    deliverOtp: async (_normalizedPhone, code) => {
      lockedCode = code;
      return { messageId: `${runId}-locked` };
    },
  });
  assert.equal(lockedRequest.phone, normalizeIranianPhone(lockedPhone));
  assert.equal(lockedCode.length, 6);

  await assert.rejects(
    requestCustomerOtp(payload, {
      phone: lockedPhone,
      requestIp: `phase9-lock-${runId}`,
      deliverOtp: async () => ({ messageId: `${runId}-unexpected` }),
    }),
    (error: unknown) => error instanceof CustomerAuthError && Boolean(error.retryAfter),
  );

  const wrongCode = lockedCode === "000000" ? "111111" : "000000";
  for (let attempt = 0; attempt < 5; attempt += 1) {
    await assert.rejects(
      verifyCustomerOtp(payload, { phone: lockedPhone, code: wrongCode }),
      CustomerAuthError,
    );
  }
  await assert.rejects(
    verifyCustomerOtp(payload, { phone: lockedPhone, code: lockedCode }),
    CustomerAuthError,
  );

  const successPhone = phone(2);
  let successCode = "";
  await requestCustomerOtp(payload, {
    phone: successPhone,
    requestIp: `phase9-success-${runId}`,
    deliverOtp: async (_normalizedPhone, code) => {
      successCode = code;
      return { messageId: `${runId}-success` };
    },
  });
  const verified = await verifyCustomerOtp(payload, {
    phone: successPhone,
    code: successCode,
    resolveLegacyCustomer: async () => ({ id: `phase9-legacy-${runId}`, name: "مشتری آزمون فاز ۹" }),
  });
  assert.equal(verified.customer.phone, normalizeIranianPhone(successPhone));
  assert.equal(verified.customer.storefrontIdentity, `phase9-legacy-${runId}`);
  assert.equal(verified.customer.fullName, "مشتری آزمون فاز ۹");

  const sessionHeaders = new Headers({ cookie: `${CUSTOMER_SESSION_COOKIE}=${verified.token}` });
  const authenticated = await authenticateCustomerSession(sessionHeaders, payload);
  assert.equal(authenticated?.id, verified.customer.id);
  assert.equal(authenticated?.phone, normalizeIranianPhone(successPhone));
  await assert.rejects(
    verifyCustomerOtp(payload, { phone: successPhone, code: successCode }),
    CustomerAuthError,
  );

  const rawChallenge = await payload.find({
    collection: "customer-otp-challenges",
    where: { providerMessageId: { equals: `${runId}-success` } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  });
  assert(rawChallenge.docs[0]);
  assert.notEqual(rawChallenge.docs[0].codeHash, successCode);
  assert(!rawChallenge.docs[0].phoneKey.includes(successPhone));
  const rawSession = await payload.find({
    collection: "customer-sessions",
    where: { customer: { equals: verified.customer.id } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  });
  assert(rawSession.docs[0]);
  assert.notEqual(rawSession.docs[0].tokenHash, verified.token);

  await revokeCustomerSession(sessionHeaders, payload);
  assert.equal(await authenticateCustomerSession(sessionHeaders, payload), null);

  const sharedIp = `phase9-rate-${runId}`;
  for (let index = 0; index < 20; index += 1) {
    await requestCustomerOtp(payload, {
      phone: `0935${String(index).padStart(7, "0")}`,
      requestIp: sharedIp,
      deliverOtp: async () => ({ messageId: `${runId}-rate-${index}` }),
    });
  }
  await assert.rejects(
    requestCustomerOtp(payload, {
      phone: "09359999999",
      requestIp: sharedIp,
      deliverOtp: async () => ({ messageId: `${runId}-rate-overflow` }),
    }),
    (error: unknown) => error instanceof CustomerAuthError && Boolean(error.retryAfter),
  );

  payload.logger.info("Phase 9 auth verification passed: hashed OTPs, limits, one-time use, customer creation, session auth, and revocation work.");
} finally {
  await rememberCreatedRecords();
  for (const id of [...new Set(sessionIds)].reverse()) await payload.delete({ collection: "customer-sessions", id, overrideAccess: true }).catch(() => undefined);
  for (const id of [...new Set(challengeIds)].reverse()) await payload.delete({ collection: "customer-otp-challenges", id, overrideAccess: true }).catch(() => undefined);
  for (const id of [...new Set(customerIds)].reverse()) await payload.delete({ collection: "customers", id, overrideAccess: true }).catch(() => undefined);
  await payload.destroy();
}
