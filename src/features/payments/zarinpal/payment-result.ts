import { getPayload } from "payload";

import config from "../../../../payload.config";
import type { AuthUser } from "@/features/auth/session";

const relationID = (value: unknown) => {
  if (typeof value === "number") return value;
  if (value && typeof value === "object" && "id" in value && typeof value.id === "number") return value.id;
  return null;
};

export type ZarinpalPaymentResult = {
  amount: number;
  orderNumber?: string;
  referenceID?: string;
  status: "pending" | "succeeded" | "failed" | "cancelled" | "unavailable";
};

export async function getZarinpalPaymentResult(user: AuthUser, transactionID: number): Promise<ZarinpalPaymentResult> {
  if (!Number.isSafeInteger(transactionID) || transactionID <= 0) {
    return { amount: 0, status: "unavailable" };
  }
  const payload = await getPayload({ config });
  const transaction = await payload.findByID({
    collection: "transactions",
    id: transactionID,
    depth: 1,
    overrideAccess: true,
  }).catch(() => null);
  if (!transaction || transaction.paymentMethod !== "zarinpal" || relationID(transaction.customer) !== user.id) {
    return { amount: 0, status: "unavailable" };
  }
  const order = typeof transaction.order === "object" ? transaction.order : null;
  const status = transaction.status === "succeeded"
    ? "succeeded"
    : transaction.status === "cancelled"
      ? "cancelled"
      : transaction.status === "failed"
        ? "failed"
        : "pending";
  return {
    amount: transaction.amount ?? 0,
    status,
    ...(order?.orderNumber ? { orderNumber: order.orderNumber } : {}),
    ...(transaction.zarinpal?.referenceID ? { referenceID: transaction.zarinpal.referenceID } : {}),
  };
}
