import { getPayload } from "payload";

import config from "../../../../../../../payload.config";
import { getCurrentUser } from "@/features/auth/session";
import { refreshTapinTracking } from "@/features/shipping/tapin/shipment";
import { TapinAPIError, TapinConfigurationError } from "@/features/shipping/tapin/client";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await request.json() as { orderID?: unknown };
    const orderID = Number(body.orderID);
    if (!Number.isSafeInteger(orderID) || orderID <= 0) {
      return Response.json({ error: "شناسه سفارش معتبر نیست." }, { status: 422 });
    }
    const payload = await getPayload({ config });
    const order = await payload.findByID({ collection: "orders", id: orderID, depth: 0, overrideAccess: true });
    const customerID = typeof order.customer === "number" ? order.customer : order.customer?.id;
    if (customerID !== user.id) return Response.json({ error: "Forbidden" }, { status: 403 });
    const tracking = await refreshTapinTracking(payload, orderID);
    return Response.json({
      shipmentID: tracking.shipmentID,
      trackingCode: tracking.trackingCode,
      status: tracking.status,
    });
  } catch (error) {
    if (error instanceof SyntaxError) return Response.json({ error: "درخواست نامعتبر است." }, { status: 400 });
    if (error instanceof TapinConfigurationError) return Response.json({ error: error.message }, { status: 503 });
    if (error instanceof TapinAPIError) return Response.json({ error: error.message }, { status: 502 });
    return Response.json({ error: error instanceof Error ? error.message : "پیگیری مرسوله انجام نشد." }, { status: 500 });
  }
}
