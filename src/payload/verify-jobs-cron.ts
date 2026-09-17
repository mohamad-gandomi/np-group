import assert from "node:assert/strict";

import { isPayloadJobsCronRequestAuthorized } from "./jobs-access";

const originalSecret = process.env.PAYLOAD_JOBS_CRON_SECRET;
const validSecret = "nilper-cron-verification-secret-2026-very-long";

const request = ({
  authorization,
  cronSecret,
}: {
  authorization?: string;
  cronSecret?: unknown;
}) => ({
  headers: new Headers(authorization ? { authorization } : undefined),
  query: cronSecret === undefined ? {} : { cronSecret },
});

try {
  delete process.env.PAYLOAD_JOBS_CRON_SECRET;
  assert.equal(isPayloadJobsCronRequestAuthorized(request({ cronSecret: validSecret })), false);

  process.env.PAYLOAD_JOBS_CRON_SECRET = "too-short";
  assert.equal(isPayloadJobsCronRequestAuthorized(request({ cronSecret: "too-short" })), false);

  process.env.PAYLOAD_JOBS_CRON_SECRET = validSecret;
  assert.equal(isPayloadJobsCronRequestAuthorized(request({ cronSecret: validSecret })), true);
  assert.equal(isPayloadJobsCronRequestAuthorized(request({ cronSecret: `${validSecret}-wrong` })), false);
  assert.equal(isPayloadJobsCronRequestAuthorized(request({ cronSecret: [validSecret] })), false);
  assert.equal(isPayloadJobsCronRequestAuthorized(request({ authorization: `Bearer ${validSecret}` })), true);
  assert.equal(isPayloadJobsCronRequestAuthorized(request({ authorization: `Basic ${validSecret}` })), false);

  console.info("Payload jobs cron authorization verification passed.");
} finally {
  if (originalSecret === undefined) delete process.env.PAYLOAD_JOBS_CRON_SECRET;
  else process.env.PAYLOAD_JOBS_CRON_SECRET = originalSecret;
}
