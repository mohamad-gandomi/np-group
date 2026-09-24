import assert from "node:assert/strict";
import { randomInt, randomUUID } from "node:crypto";
import { getPayload } from "payload";

import config from "../../payload.config";
import {
  createPayloadAccountAddress,
  getPayloadAccountAddresses,
  updatePayloadCustomerProfile,
} from "../features/account/payload-account";
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
import { getPayloadAccountOrders } from "../features/commerce/payload-orders";

const payload = await getPayload({ config });
const runId = randomUUID();
const phone = (offset: number) => `091${String(randomInt(100_000_000, 899_999_999) + offset).slice(0, 8)}`;
const challengeIds: number[] = [];
const addressIds: number[] = [];
const customerIds: number[] = [];
const sessionIds: number[] = [];

async function rememberCreatedRecords() {
  const [challenges, sessions] = await Promise.all([
    payload.find({ collection: "customer-otp-challenges", where: { providerMessageId: { contains: runId } }, limit: 100, depth: 0, overrideAccess: true }),
    payload.find({ collection: "customer-sessions", where: { challengeKey: { exists: true } }, limit: 1000, depth: 0, overrideAccess: true }),
  ]);
  challengeIds.push(...challenges.docs.map((doc) => doc.id));
  sessionIds.push(...sessions.docs.filter((doc) => challengeIds.includes(Number(doc.challengeKey))).map((doc) => doc.id));
}

try {
  assert.equal(normalizeIranianPhone("۰۹۱۲ ۱۲۳ ۴۵۶۷"), "+989121234567");

  const lockedPhone = phone(1);
  let lockedCode = "";
  const lockedRequest = await requestCustomerOtp(payload, {
    phone: lockedPhone,
    requestIp: `auth-lock-${runId}`,
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
      requestIp: `auth-lock-${runId}`,
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
    requestIp: `auth-success-${runId}`,
    deliverOtp: async (_normalizedPhone, code) => {
      successCode = code;
      return { messageId: `${runId}-success` };
    },
  });
  const verified = await verifyCustomerOtp(payload, { phone: successPhone, code: successCode });
  customerIds.push(verified.customer.id);
  assert.equal(verified.customer.phone, normalizeIranianPhone(successPhone));

  const authUser = { id: verified.customer.id, phone: verified.customer.phone };
  const updatedCustomer = await updatePayloadCustomerProfile(authUser, "مشتری آزمون فاز ۹");
  assert.equal(updatedCustomer.fullName, "مشتری آزمون فاز ۹");
  const firstAddress = await createPayloadAccountAddress(authUser, {
    title: "خانه",
    recipient: "مشتری آزمون فاز ۹",
    phone: verified.customer.phone,
    province: "خراسان رضوی",
    city: "مشهد",
    address: "بلوار وکیل‌آباد",
    postalCode: "9180000000",
  });
  addressIds.push(firstAddress.id);
  const secondAddress = await createPayloadAccountAddress(authUser, {
    title: "محل کار",
    recipient: "مشتری آزمون فاز ۹",
    phone: verified.customer.phone,
    province: "خراسان رضوی",
    city: "مشهد",
    address: "بلوار سجاد",
    postalCode: "9181000000",
  });
  addressIds.push(secondAddress.id);
  assert.equal(firstAddress.isDefault, true);
  assert.equal(secondAddress.isDefault, false);
  const updatedAuthUser = { ...authUser, name: updatedCustomer.fullName ?? undefined };
  const [addresses, orders] = await Promise.all([
    getPayloadAccountAddresses(updatedAuthUser),
    getPayloadAccountOrders(updatedAuthUser),
  ]);
  assert.equal(addresses.length, 2);
  assert.equal(addresses[0]?.title, "خانه");
  assert.equal(addresses[0]?.address, "بلوار وکیل‌آباد");
  assert.equal(orders.length, 0);

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

  const sharedIp = `auth-rate-${runId}`;
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

  payload.logger.info("Authentication verification passed: OTP security, customer sessions, profiles, addresses, account queries, and revocation work in Payload.");
} finally {
  await rememberCreatedRecords();
  for (const id of [...new Set(sessionIds)].reverse()) await payload.delete({ collection: "customer-sessions", id, overrideAccess: true }).catch(() => undefined);
  for (const id of [...new Set(challengeIds)].reverse()) await payload.delete({ collection: "customer-otp-challenges", id, overrideAccess: true }).catch(() => undefined);
  for (const id of [...new Set(addressIds)].reverse()) await payload.delete({ collection: "addresses", id, overrideAccess: true }).catch(() => undefined);
  for (const id of [...new Set(customerIds)].reverse()) await payload.delete({ collection: "customers", id, overrideAccess: true }).catch(() => undefined);
  await payload.destroy();
}
