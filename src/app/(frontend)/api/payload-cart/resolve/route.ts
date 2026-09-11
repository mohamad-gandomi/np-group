import { ValidationError } from "payload";

import { CartRequestError, parseCartLineReferences, resolveCart } from "@/features/cart/payload-cart";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { items?: unknown };
    return Response.json(await resolveCart(parseCartLineReferences(body.items)));
  } catch (error) {
    if (error instanceof ValidationError) {
      return Response.json({ error: error.message }, { status: 422 });
    }
    if (error instanceof CartRequestError || error instanceof SyntaxError) {
      return Response.json({ error: error instanceof CartRequestError ? error.message : "درخواست نامعتبر است." }, { status: 400 });
    }
    return Response.json({ error: "بازیابی سبد خرید انجام نشد." }, { status: 500 });
  }
}
