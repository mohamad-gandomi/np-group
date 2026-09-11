import { ValidationError } from "payload";

import { getCurrentUser } from "@/features/auth/session";
import {
  CartRequestError,
  getStorefrontCart,
  mergeStorefrontCart,
  parseCartLineReferences,
  replaceStorefrontCart,
} from "@/features/cart/payload-cart";

const errorResponse = (error: unknown) => {
  if (error instanceof ValidationError) {
    return Response.json({ error: error.message }, { status: 422 });
  }
  if (error instanceof CartRequestError || error instanceof SyntaxError) {
    return Response.json({ error: error instanceof CartRequestError ? error.message : "درخواست نامعتبر است." }, { status: 400 });
  }
  return Response.json({ error: "ذخیره سبد خرید انجام نشد." }, { status: 500 });
};

const requestLines = async (request: Request) => {
  const body = await request.json() as { items?: unknown };
  return parseCartLineReferences(body.items);
};

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    return Response.json(await getStorefrontCart(user));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    return Response.json(await replaceStorefrontCart(user, await requestLines(request)));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    return Response.json(await mergeStorefrontCart(user, await requestLines(request)));
  } catch (error) {
    return errorResponse(error);
  }
}
