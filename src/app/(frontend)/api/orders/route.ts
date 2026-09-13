import { getCurrentUser } from "@/features/auth/session";
import {
  CheckoutRequestError,
  createStorefrontOrder,
  parseCheckoutContact,
} from "@/features/commerce/payload-orders";
import { ShippingRequestError } from "@/features/shipping/shipping-plan";
import { TapinAPIError, TapinConfigurationError } from "@/features/shipping/tapin/client";

type OrderRequest = { contact?: unknown };

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  let body: OrderRequest;
  try {
    body = await request.json() as OrderRequest;
  } catch {
    return Response.json({ error: "درخواست نامعتبر است." }, { status: 400 });
  }
  try {
    return Response.json(
      await createStorefrontOrder(user, parseCheckoutContact(body.contact, user)),
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof CheckoutRequestError || error instanceof ShippingRequestError) {
      return Response.json({ error: error.message }, { status: 422 });
    }
    if (error instanceof TapinConfigurationError) return Response.json({ error: error.message }, { status: 503 });
    if (error instanceof TapinAPIError) return Response.json({ error: error.message }, { status: 502 });
    return Response.json({ error: "ثبت سفارش انجام نشد." }, { status: 500 });
  }
}
