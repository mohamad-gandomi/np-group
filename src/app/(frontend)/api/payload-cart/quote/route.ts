import { createLocalReq, getPayload, ValidationError } from "payload";

import config from "../../../../../../payload.config";
import { validateNilperCommerceItems } from "@/payload/cart-configuration";

type QuoteBody = {
  productId?: unknown;
  variantId?: unknown;
  quantity?: unknown;
  configuration?: unknown;
};

export async function POST(request: Request) {
  let body: QuoteBody;
  try {
    body = await request.json() as QuoteBody;
  } catch {
    return Response.json({ error: "درخواست نامعتبر است." }, { status: 400 });
  }

  try {
    const payload = await getPayload({ config });
    const req = await createLocalReq({}, payload);
    const result = await validateNilperCommerceItems([{
      product: body.productId,
      variant: body.variantId,
      quantity: body.quantity,
      configuration: body.configuration,
    }], req);
    return Response.json({ amount: result.amount, item: result.items[0] });
  } catch (error) {
    if (error instanceof ValidationError) {
      return Response.json({ error: error.message }, { status: 422 });
    }
    return Response.json({ error: "اعتبارسنجی سبد خرید انجام نشد." }, { status: 500 });
  }
}
