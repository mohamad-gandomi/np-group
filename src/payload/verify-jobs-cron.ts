import assert from "node:assert/strict";

import {
  cleanupEphemeralRecords,
  cleanupEphemeralRecordsTask,
  EPHEMERAL_RETENTION_DAYS,
  ephemeralRetentionCutoffs,
} from "./ephemeral-cleanup";
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

  const now = Date.UTC(2026, 8, 24);
  const cutoffs = ephemeralRetentionCutoffs(now);
  assert.equal(cleanupEphemeralRecordsTask.slug, "cleanupEphemeralRecords");
  assert.equal(cleanupEphemeralRecordsTask.schedule?.length, 1);
  assert.equal(Date.parse(cutoffs.authChallenges), now - EPHEMERAL_RETENTION_DAYS.authChallenges * 86_400_000);
  assert.equal(Date.parse(cutoffs.authSessions), now - EPHEMERAL_RETENTION_DAYS.authSessions * 86_400_000);
  assert.equal(Date.parse(cutoffs.abandonedCarts), now - EPHEMERAL_RETENTION_DAYS.abandonedCarts * 86_400_000);
  const deletes: Array<{ collection: string; where: unknown }> = [];
  const cleanup = await cleanupEphemeralRecords({
    payload: {
      delete: async ({ collection, where }: { collection: string; where: unknown }) => {
        deletes.push({ collection, where });
        return { docs: [{}] };
      },
    },
  } as never, now);
  assert.deepEqual(cleanup, {
    deletedCarts: 1,
    deletedExports: 1,
    deletedImports: 1,
    deletedOtpChallenges: 1,
    deletedSessions: 1,
  });
  assert.deepEqual(deletes.map(({ collection }) => collection).sort(), [
    "carts", "customer-otp-challenges", "customer-sessions", "exports", "imports",
  ]);
  assert.match(JSON.stringify(deletes.find(({ collection }) => collection === "carts")?.where), /purchasedAt/);

  console.info("Payload jobs authorization and cleanup retention verification passed.");
} finally {
  if (originalSecret === undefined) delete process.env.PAYLOAD_JOBS_CRON_SECRET;
  else process.env.PAYLOAD_JOBS_CRON_SECRET = originalSecret;
}
