import { createHash } from "node:crypto";

import { createLocalReq, getPayload } from "payload";
import type { Payload, PayloadRequest } from "payload";

import config from "../../../payload.config";
import type { AuthUser } from "@/features/auth/session";
import { mapPayloadProduct } from "@/features/catalog/payload-catalog-mapper";
import type { Cart, Product as PayloadProduct, Variant } from "@/payload-types";
import { validateNilperCommerceItems } from "@/payload/cart-configuration";
import { NILPER_COMMERCE_CURRENCY } from "@/payload/money";

import type { CartItem, CartLineReference, CartResponse } from "./cart-types";

const MAX_CART_LINES = 50;
const MAX_ITEM_QUANTITY = 20;

export class CartRequestError extends Error {}

const relationID = (value: unknown): number | undefined => {
  if (typeof value === "number" && Number.isSafeInteger(value) && value > 0) return value;
  if (!value || typeof value !== "object" || !("id" in value)) return undefined;
  return relationID(value.id);
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const configurationIdentity = (configuration: CartLineReference["configuration"]) =>
  [...configuration]
    .sort((left, right) => left.groupKey.localeCompare(right.groupKey, "en"))
    .map(({ groupKey, optionId }) => [groupKey, optionId]);

const lineIdentity = (line: CartLineReference) =>
  JSON.stringify([line.productId, line.variantId ?? null, configurationIdentity(line.configuration)]);

export function parseCartLineReferences(value: unknown): CartLineReference[] {
  if (!Array.isArray(value) || value.length > MAX_CART_LINES) {
    throw new CartRequestError("سبد خرید معتبر نیست.");
  }

  const normalized: CartLineReference[] = [];
  for (const rawLine of value) {
    if (!isRecord(rawLine)) throw new CartRequestError("ردیف سبد خرید معتبر نیست.");
    const productId = relationID(rawLine.productId);
    const variantId = rawLine.variantId == null ? undefined : relationID(rawLine.variantId);
    const quantity = rawLine.quantity;
    const rawConfiguration = rawLine.configuration ?? [];

    if (!productId || (rawLine.variantId != null && !variantId)) {
      throw new CartRequestError("شناسه محصول یا گونه معتبر نیست.");
    }
    if (typeof quantity !== "number" || !Number.isSafeInteger(quantity) || quantity < 1 || quantity > MAX_ITEM_QUANTITY) {
      throw new CartRequestError(`تعداد هر کالا باید بین ۱ تا ${MAX_ITEM_QUANTITY} باشد.`);
    }
    if (!Array.isArray(rawConfiguration) || rawConfiguration.length > 20) {
      throw new CartRequestError("پیکربندی کالا معتبر نیست.");
    }

    const configuration = rawConfiguration.map((rawSelection) => {
      if (!isRecord(rawSelection) || typeof rawSelection.groupKey !== "string") {
        throw new CartRequestError("انتخاب پیکربندی معتبر نیست.");
      }
      const groupKey = rawSelection.groupKey.trim();
      const optionId = relationID(rawSelection.optionId);
      if (!groupKey || !optionId) throw new CartRequestError("انتخاب پیکربندی معتبر نیست.");
      return { groupKey, optionId };
    });

    normalized.push({
      productId,
      ...(variantId ? { variantId } : {}),
      quantity,
      configuration,
    });
  }

  return normalized;
}

export function cartItemsToReferences(items: CartItem[]): CartLineReference[] {
  return items.flatMap((item) => {
    const productId = item.product.payloadProductId;
    if (!productId) return [];
    return [{
      productId,
      ...(item.variantId ? { variantId: item.variantId } : {}),
      quantity: item.quantity,
      configuration: (item.configuration ?? []).map(({ groupKey, optionId }) => ({ groupKey, optionId })),
    }];
  });
}

export function mergeCartLineReferences(
  current: CartLineReference[],
  incoming: CartLineReference[],
): CartLineReference[] {
  const merged = new Map(current.map((line) => [lineIdentity(line), { ...line }]));
  for (const line of incoming) {
    const key = lineIdentity(line);
    const existing = merged.get(key);
    if (!existing) {
      merged.set(key, { ...line });
      continue;
    }
    const quantity = existing.quantity + line.quantity;
    if (quantity > MAX_ITEM_QUANTITY) throw new CartRequestError(`تعداد هر کالا نمی‌تواند بیشتر از ${MAX_ITEM_QUANTITY} باشد.`);
    merged.set(key, { ...existing, quantity });
  }
  return [...merged.values()];
}

export function getStorefrontCustomerKey(user: AuthUser) {
  const secret = process.env.PAYLOAD_SECRET;
  if (!secret) throw new Error("PAYLOAD_SECRET is required for storefront carts.");
  return createHash("sha256").update(`nilper-storefront-cart:${user.id}:${secret}`).digest("hex");
}

export async function findActiveStorefrontCart(
  payload: Payload,
  user: AuthUser,
  req?: PayloadRequest,
): Promise<Cart | null> {
  const result = await payload.find({
    collection: "carts",
    depth: 2,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    ...(req ? { req } : {}),
    sort: "-updatedAt",
    where: {
      and: [
        { storefrontCustomerKey: { equals: getStorefrontCustomerKey(user) } },
        { purchasedAt: { exists: false } },
      ],
    },
  });
  return result.docs[0] ?? null;
}

const payloadItems = (references: CartLineReference[]) => references.map((line) => ({
  product: line.productId,
  ...(line.variantId ? { variant: line.variantId } : {}),
  quantity: line.quantity,
  configuration: line.configuration.map(({ groupKey, optionId }) => ({ groupKey, option: optionId })),
}));

async function cartResponse(
  payload: Payload,
  cart: Pick<Cart, "id" | "items" | "subtotal"> | null,
  authenticated: boolean,
): Promise<CartResponse> {
  if (!cart?.items?.length) {
    return {
      authenticated,
      ...(cart ? { cartId: cart.id } : {}),
      items: [],
      subtotal: 0,
    };
  }

  const productIDs = [...new Set(cart.items.map((item) => relationID(item.product)).filter((id): id is number => Boolean(id)))];
  const products = await payload.find({
    collection: "products",
    depth: 2,
    limit: productIDs.length,
    overrideAccess: true,
    pagination: false,
    where: { id: { in: productIDs } },
  });
  const productsByID = new Map(products.docs.map((product) => [product.id, product as PayloadProduct]));

  const items = cart.items.flatMap((item): CartItem[] => {
    const productID = relationID(item.product);
    const payloadProduct = productID ? productsByID.get(productID) : undefined;
    if (!payloadProduct) return [];
    const product = mapPayloadProduct(payloadProduct, {
      configurationGroups: [],
      configurationOptions: [],
      variants: [],
    });
    const variant = typeof item.variant === "object" ? item.variant as Variant : undefined;
    const configuration = (item.configuration ?? []).flatMap((selection) => {
      const optionId = relationID(selection.option);
      if (!optionId) return [];
      return [{
        groupKey: selection.groupKey,
        groupLabel: selection.groupLabelFaSnapshot,
        optionId,
        optionLabel: selection.labelFaSnapshot,
        ...(selection.optionCodeSnapshot ? { optionCode: selection.optionCodeSnapshot } : {}),
      }];
    });
    const key = lineIdentity({
      productId: payloadProduct.id,
      ...(relationID(item.variant) ? { variantId: relationID(item.variant) } : {}),
      quantity: item.quantity,
      configuration: configuration.map(({ groupKey, optionId }) => ({ groupKey, optionId })),
    });

    return [{
      key,
      product: {
        id: product.id,
        payloadProductId: payloadProduct.id,
        source: "payload",
        slug: product.slug,
        name: item.productTitleSnapshot,
        brand: product.brand,
        category: product.category,
        price: item.unitPriceInTMN,
        image: product.image,
        availability: product.availability,
      },
      color: configuration.find((selection) => selection.groupKey === "wood-finish")?.optionLabel ?? "سفارشی",
      ...(relationID(item.variant) ? {
        variantId: relationID(item.variant),
        variantLabel: variant?.title ?? item.variantCodeSnapshot ?? undefined,
        variantCode: item.variantCodeSnapshot ?? variant?.nilperCode ?? undefined,
      } : {}),
      configuration,
      quantity: item.quantity,
    }];
  });

  return {
    authenticated,
    ...(cart.id ? { cartId: cart.id } : {}),
    items,
    subtotal: cart.subtotal ?? items.reduce((sum, item) => sum + (item.product.price ?? 0) * item.quantity, 0),
  };
}

export async function resolveCart(references: CartLineReference[], authenticated = false): Promise<CartResponse> {
  const payload = await getPayload({ config });
  const req = await createLocalReq({}, payload);
  const validated = await validateNilperCommerceItems(payloadItems(references), req);
  return cartResponse(payload, { id: 0, items: validated.items as Cart["items"], subtotal: validated.amount }, authenticated);
}

export async function getStorefrontCart(user: AuthUser): Promise<CartResponse> {
  const payload = await getPayload({ config });
  return cartResponse(payload, await findActiveStorefrontCart(payload, user), true);
}

export async function replaceStorefrontCart(user: AuthUser, references: CartLineReference[]): Promise<CartResponse> {
  const payload = await getPayload({ config });
  const activeCart = await findActiveStorefrontCart(payload, user);
  const data: Pick<Cart, "currency" | "items" | "storefrontCustomerKey"> = {
    // Snapshot fields are required in generated document types, but the cart hook
    // derives them from these untrusted references before validation completes.
    items: payloadItems(references) as unknown as Cart["items"],
    currency: NILPER_COMMERCE_CURRENCY.code,
    storefrontCustomerKey: getStorefrontCustomerKey(user),
  };
  const cart = activeCart
    ? await payload.update({ collection: "carts", id: activeCart.id, data, depth: 2, overrideAccess: true })
    : await payload.create({ collection: "carts", data, depth: 2, overrideAccess: true });
  return cartResponse(payload, cart, true);
}

export async function mergeStorefrontCart(user: AuthUser, incoming: CartLineReference[]): Promise<CartResponse> {
  const current = await getStorefrontCart(user);
  return replaceStorefrontCart(user, mergeCartLineReferences(cartItemsToReferences(current.items), incoming));
}
