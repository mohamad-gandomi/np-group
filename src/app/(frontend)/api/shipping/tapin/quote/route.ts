import { getPayload } from "payload";

import config from "../../../../../../../payload.config";
import { getCurrentUser } from "@/features/auth/session";
import { findActiveStorefrontCart } from "@/features/cart/payload-cart";
import {
  cartShippingMode,
  parseShippingDestination,
  parseTapinService,
  quoteCartShipping,
  ShippingRequestError,
  shippingPlanData,
  totalWithShipping,
} from "@/features/shipping/shipping-plan";
import { TapinAPIError, TapinConfigurationError } from "@/features/shipping/tapin/client";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await request.json() as { destination?: unknown; serviceID?: unknown };
    const payload = await getPayload({ config });
    const cart = await findActiveStorefrontCart(payload, user);
    if (!cart?.items?.length) return Response.json({ error: "سبد خرید خالی است." }, { status: 422 });
    const mode = cartShippingMode(cart.items);
    const plan = await quoteCartShipping({
      ...(mode === "parcel" ? {
        destination: parseShippingDestination(body.destination),
        serviceID: parseTapinService(body.serviceID),
      } : {}),
      items: cart.items,
      subtotalInToman: cart.subtotal ?? 0,
    });
    return Response.json({
      ...shippingPlanData(plan),
      totalInTMN: totalWithShipping(cart.subtotal ?? 0, plan),
    });
  } catch (error) {
    if (error instanceof ShippingRequestError || error instanceof SyntaxError) {
      return Response.json({ error: error instanceof Error ? error.message : "درخواست معتبر نیست." }, { status: 422 });
    }
    if (error instanceof TapinConfigurationError) {
      return Response.json({ error: error.message }, { status: 503 });
    }
    if (error instanceof TapinAPIError) {
      return Response.json({ error: error.message }, { status: 502 });
    }
    return Response.json({ error: "استعلام هزینه ارسال انجام نشد." }, { status: 500 });
  }
}
