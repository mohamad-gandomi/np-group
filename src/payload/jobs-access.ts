import { createHash, timingSafeEqual } from "node:crypto";
import type { PayloadRequest, RunJobAccess } from "payload";

import { isStrictAdminUser } from "./data-transfer";

const MINIMUM_CRON_SECRET_LENGTH = 32;

const digest = (value: string) => createHash("sha256").update(value, "utf8").digest();

const secretsMatch = (provided: string, expected: string) => (
  timingSafeEqual(digest(provided), digest(expected))
);

const bearerToken = (headers: Headers) => {
  const authorization = headers.get("authorization");
  const match = authorization?.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim();
};

export const isPayloadJobsCronRequestAuthorized = (
  req: Pick<PayloadRequest, "headers" | "query">,
) => {
  const expected = process.env.PAYLOAD_JOBS_CRON_SECRET?.trim();
  if (!expected || expected.length < MINIMUM_CRON_SECRET_LENGTH) return false;

  const querySecret = req.query.cronSecret;
  const provided = bearerToken(req.headers)
    ?? (typeof querySecret === "string" ? querySecret.trim() : undefined);

  return Boolean(provided && secretsMatch(provided, expected));
};

export const canRunPayloadJobs: RunJobAccess = ({ req }) => (
  isStrictAdminUser(req.user) || isPayloadJobsCronRequestAuthorized(req)
);
