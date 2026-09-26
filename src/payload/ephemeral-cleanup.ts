import type { CollectionSlug, PayloadRequest, TaskConfig } from "payload";

const DAY_MS = 24 * 60 * 60 * 1000;

export const EPHEMERAL_RETENTION_DAYS = {
  abandonedCarts: 90,
  authChallenges: 1,
  authSessions: 7,
  dataTransfers: 7,
} as const;

export const ephemeralRetentionCutoffs = (now = Date.now()) => ({
  abandonedCarts: new Date(now - EPHEMERAL_RETENTION_DAYS.abandonedCarts * DAY_MS).toISOString(),
  authChallenges: new Date(now - EPHEMERAL_RETENTION_DAYS.authChallenges * DAY_MS).toISOString(),
  authSessions: new Date(now - EPHEMERAL_RETENTION_DAYS.authSessions * DAY_MS).toISOString(),
  dataTransfers: new Date(now - EPHEMERAL_RETENTION_DAYS.dataTransfers * DAY_MS).toISOString(),
});

type CleanupOutput = {
  deletedCarts: number;
  deletedExports: number;
  deletedImports: number;
  deletedOtpChallenges: number;
  deletedSessions: number;
};

type CleanupTask = { input: Record<string, never>; output: CleanupOutput };

const deleteMatching = async (
  req: PayloadRequest,
  collection: CollectionSlug,
  where: Record<string, unknown>,
) => {
  const result = await req.payload.delete({
    collection,
    overrideAccess: true,
    req,
    where,
  } as never) as unknown as { docs?: unknown[] };
  return result.docs?.length ?? 0;
};

export async function cleanupEphemeralRecords(
  req: PayloadRequest,
  now = Date.now(),
): Promise<CleanupOutput> {
  const cutoff = ephemeralRetentionCutoffs(now);
  const deletedCarts = await deleteMatching(req, "carts", {
    and: [
      { purchasedAt: { exists: false } },
      { updatedAt: { less_than: cutoff.abandonedCarts } },
    ],
  });
  const deletedExports = await deleteMatching(req, "exports", { createdAt: { less_than: cutoff.dataTransfers } });
  const deletedImports = await deleteMatching(req, "imports", { createdAt: { less_than: cutoff.dataTransfers } });
  const deletedOtpChallenges = await deleteMatching(req, "customer-otp-challenges", { expiresAt: { less_than: cutoff.authChallenges } });
  const deletedSessions = await deleteMatching(req, "customer-sessions", {
    or: [
      { expiresAt: { less_than: cutoff.authSessions } },
      { revokedAt: { less_than: cutoff.authSessions } },
    ],
  });
  return { deletedCarts, deletedExports, deletedImports, deletedOtpChallenges, deletedSessions };
}

export const cleanupEphemeralRecordsTask: TaskConfig<CleanupTask> = {
  slug: "cleanupEphemeralRecords",
  inputSchema: [],
  outputSchema: [
    { name: "deletedCarts", type: "number", required: true },
    { name: "deletedExports", type: "number", required: true },
    { name: "deletedImports", type: "number", required: true },
    { name: "deletedOtpChallenges", type: "number", required: true },
    { name: "deletedSessions", type: "number", required: true },
  ],
  schedule: [{ cron: "15 3 * * *", queue: "default" }],
  handler: async ({ req }) => ({ output: await cleanupEphemeralRecords(req) }),
};
