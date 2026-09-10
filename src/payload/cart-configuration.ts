import type { CartItemMatcher } from "@payloadcms/plugin-ecommerce";
import type {
  CollectionBeforeOperationHook,
  CollectionBeforeValidateHook,
  DefaultDocumentIDType,
  Field,
  PayloadRequest,
} from "payload";
import { ValidationError } from "payload";

import { NILPER_COMMERCE_CURRENCY, assertTomanAmount, validateTomanAmount } from "./money";

type CommerceDocumentKind = "cart" | "order" | "transaction";
type RecordValue = Record<string, unknown>;

const isRecord = (value: unknown): value is RecordValue =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const relationshipID = (value: unknown): DefaultDocumentIDType | undefined => {
  if (typeof value === "number" && Number.isSafeInteger(value)) return value;
  if (typeof value === "string" && /^\d+$/.test(value)) return Number(value);
  if (!isRecord(value)) return undefined;

  const id = value.id;
  if (typeof id === "number" && Number.isSafeInteger(id)) return id;
  return typeof id === "string" && /^\d+$/.test(id) ? Number(id) : undefined;
};

const sameID = (left: DefaultDocumentIDType | undefined, right: DefaultDocumentIDType | undefined) =>
  left !== undefined && right !== undefined && String(left) === String(right);

const itemField = (name: string) => (field: Field) => "name" in field && field.name === name;

const snapshotFieldAdmin = { readOnly: true } as const;

const explicitItemsContextKey = (kind: CommerceDocumentKind) => `nilper:${kind}:explicit-items`;

const nilperItemFields: Field[] = [
  {
    name: "configuration",
    type: "array",
    label: "پیکربندی انتخاب‌شده",
    labels: { singular: "انتخاب", plural: "انتخاب‌ها" },
    admin: {
      description: "ورودی پایدار گروه و گزینه؛ عنوان‌ها و شناسه نهایی در سرور بازنویسی می‌شوند.",
    },
    fields: [
      { name: "groupKey", type: "text", label: "کلید گروه", required: true },
      {
        name: "group",
        type: "relationship",
        relationTo: "configuration-groups",
        label: "گروه",
        admin: snapshotFieldAdmin,
      },
      {
        name: "groupLabelFaSnapshot",
        type: "text",
        label: "عنوان گروه هنگام ثبت",
        required: true,
        admin: snapshotFieldAdmin,
      },
      {
        name: "option",
        type: "relationship",
        relationTo: "configuration-options",
        label: "گزینه",
      },
      {
        name: "optionCodeSnapshot",
        type: "text",
        label: "کد گزینه هنگام ثبت",
        admin: snapshotFieldAdmin,
      },
      {
        name: "labelFaSnapshot",
        type: "text",
        label: "عنوان گزینه هنگام ثبت",
        required: true,
        admin: snapshotFieldAdmin,
      },
    ],
  },
  {
    name: "configurationKey",
    type: "text",
    label: "کلید نرمال پیکربندی",
    required: true,
    admin: { hidden: true, readOnly: true },
  },
  {
    name: "productTitleSnapshot",
    type: "text",
    label: "نام محصول هنگام ثبت",
    required: true,
    admin: snapshotFieldAdmin,
  },
  {
    name: "variantCodeSnapshot",
    type: "text",
    label: "کد ثبت گونه هنگام ثبت",
    admin: snapshotFieldAdmin,
  },
  {
    name: "unitPriceInTMN",
    type: "number",
    label: "قیمت واحد هنگام ثبت (تومان)",
    required: true,
    min: 0,
    validate: validateTomanAmount,
    admin: snapshotFieldAdmin,
  },
];

/** Adds Nilper configuration and trusted snapshot fields to every commerce `items` array. */
export const withNilperCommerceItemFields = (field: Field): Field => {
  if (field.type === "tabs") {
    return {
      ...field,
      tabs: field.tabs.map((tab) => ({ ...tab, fields: tab.fields.map(withNilperCommerceItemFields) })),
    };
  }

  if (field.type === "group" || field.type === "row" || field.type === "collapsible") {
    return { ...field, fields: field.fields.map(withNilperCommerceItemFields) };
  }

  if (field.type === "array") {
    const fields = field.fields.map(withNilperCommerceItemFields);
    return itemField("items")(field) ? { ...field, fields: [...fields, ...nilperItemFields] } : { ...field, fields };
  }

  return field;
};

type ComparableSelection = readonly [groupKey: string, optionID: string];

const comparableConfiguration = (value: unknown): ComparableSelection[] | null => {
  if (value === null || value === undefined) return [];
  if (!Array.isArray(value)) return null;

  const selections: ComparableSelection[] = [];
  for (const selection of value) {
    if (!isRecord(selection) || typeof selection.groupKey !== "string") return null;
    const groupKey = selection.groupKey.trim();
    const optionID = relationshipID(selection.option);
    if (!groupKey || optionID === undefined) return null;
    selections.push([groupKey, String(optionID)]);
  }

  return selections.sort(([leftGroup, leftOption], [rightGroup, rightOption]) =>
    leftGroup.localeCompare(rightGroup, "en") || leftOption.localeCompare(rightOption, "en"),
  );
};

export const buildConfigurationKey = (value: unknown): string | null => {
  const normalized = comparableConfiguration(value);
  return normalized ? JSON.stringify(normalized) : null;
};

/** Product + variant + normalized configuration defines one cart line. */
export const nilperCartItemMatcher: CartItemMatcher = ({ existingItem, newItem }) => {
  const productMatches = sameID(relationshipID(existingItem.product), relationshipID(newItem.product));
  const existingVariantID = relationshipID(existingItem.variant);
  const newVariantID = relationshipID(newItem.variant);
  const variantMatches = (existingVariantID === undefined && newVariantID === undefined) ||
    sameID(existingVariantID, newVariantID);
  if (!productMatches || !variantMatches) return false;

  const existingKey = buildConfigurationKey(existingItem.configuration);
  const newKey = buildConfigurationKey(newItem.configuration);
  return existingKey !== null && newKey !== null && existingKey === newKey;
};

/** Records the raw request shape before Payload merges existing array data into updates. */
export const nilperCommerceBeforeOperation = (
  kind: CommerceDocumentKind,
): CollectionBeforeOperationHook => ({ args, operation, req }) => {
  if (operation === "create" || operation === "update") {
    const operationData = "data" in args ? args.data : undefined;
    req.context[explicitItemsContextKey(kind)] = isRecord(operationData) &&
      Object.prototype.hasOwnProperty.call(operationData, "items");
  }
  return args;
};

const validationError = (req: PayloadRequest, message: string, path = "items"): never => {
  throw new ValidationError({ errors: [{ message, path }], req });
};

const findByID = async (
  req: PayloadRequest,
  collection: "configuration-groups" | "configuration-options" | "products" | "variants",
  id: DefaultDocumentIDType,
  path: string,
): Promise<RecordValue> => {
  try {
    return await req.payload.findByID({
      collection,
      id,
      depth: 0,
      draft: collection === "products" || collection === "variants",
      overrideAccess: true,
    }) as unknown as RecordValue;
  } catch {
    return validationError(req, `رکورد معتبر ${collection} یافت نشد.`, path);
  }
};

const requiredString = (value: unknown, req: PayloadRequest, message: string, path: string) => {
  if (typeof value !== "string" || !value.trim()) return validationError(req, message, path);
  return value.trim();
};

const itemIdentityKey = (
  productID: DefaultDocumentIDType,
  variantID: DefaultDocumentIDType | undefined,
  configurationKey: string,
) => JSON.stringify([String(productID), variantID === undefined ? null : String(variantID), configurationKey]);

const hydrateCommerceItems = async (items: unknown[], req: PayloadRequest) => {
  const hydratedItems: RecordValue[] = [];
  const itemKeys = new Set<string>();
  let amount = 0;

  for (const [itemIndex, rawItem] of items.entries()) {
    const path = `items.${itemIndex}`;
    const item = isRecord(rawItem)
      ? rawItem
      : validationError(req, "ساختار ردیف سبد خرید معتبر نیست.", path);

    const productID = relationshipID(item.product) ??
      validationError(req, "محصول الزامی است.", `${path}.product`);

    const product = await findByID(req, "products", productID, `${path}.product`);
    if (product._status !== "published") {
      validationError(req, "محصول باید منتشرشده باشد.", `${path}.product`);
    }
    if (product.availabilityMode === "unavailable") {
      validationError(req, "محصول در حال حاضر قابل سفارش نیست.", `${path}.product`);
    }

    const productTitle = requiredString(product.title, req, "نام محصول معتبر نیست.", `${path}.product`);
    const variantID = relationshipID(item.variant);
    let variantCode: string | undefined;
    let unitPrice = product.priceInTMN;
    let priceEnabled = product.priceInTMNEnabled;

    if (variantID !== undefined) {
      const variant = await findByID(req, "variants", variantID, `${path}.variant`);
      if (variant._status !== "published") {
        validationError(req, "گونه باید منتشرشده باشد.", `${path}.variant`);
      }
      if (!sameID(relationshipID(variant.product), productID)) {
        validationError(req, "گونه انتخاب‌شده متعلق به این محصول نیست.", `${path}.variant`);
      }

      variantCode = requiredString(variant.nilperCode, req, "کد ثبت گونه معتبر نیست.", `${path}.variant`);
      unitPrice = variant.priceInTMN;
      priceEnabled = variant.priceInTMNEnabled;
    }

    if (priceEnabled !== true || typeof unitPrice !== "number") {
      validationError(req, "قیمت قابل فروش برای محصول یا گونه ثبت نشده است.", path);
    }
    const trustedUnitPrice = unitPrice as number;

    try {
      assertTomanAmount(trustedUnitPrice, "unitPriceInTMN");
    } catch {
      validationError(req, "قیمت تومان باید عدد صحیح و نامنفی باشد.", path);
    }

    const quantity = item.quantity;
    if (typeof quantity !== "number" || !Number.isSafeInteger(quantity) || quantity <= 0) {
      validationError(req, "تعداد باید عدد صحیح و بزرگ‌تر از صفر باشد.", `${path}.quantity`);
    }
    const trustedQuantity = quantity as number;

    const allowedGroupIDs = Array.isArray(product.configurationGroups)
      ? product.configurationGroups.map(relationshipID).filter((id): id is DefaultDocumentIDType => id !== undefined)
      : [];
    const allowedGroups = await Promise.all(
      allowedGroupIDs.map((id) => findByID(req, "configuration-groups", id, `${path}.configuration`)),
    );
    const allowedGroupsByKey = new Map(
      allowedGroups.map((group) => [requiredString(group.key, req, "کلید گروه معتبر نیست.", `${path}.configuration`), group]),
    );

    const requestedConfigurationValue = item.configuration ?? [];
    const requestedConfiguration = Array.isArray(requestedConfigurationValue)
      ? requestedConfigurationValue
      : validationError(req, "پیکربندی باید یک فهرست باشد.", `${path}.configuration`);

    const seenGroups = new Set<string>();
    const configuration: RecordValue[] = [];
    for (const [selectionIndex, rawSelection] of requestedConfiguration.entries()) {
      const selectionPath = `${path}.configuration.${selectionIndex}`;
      if (!isRecord(rawSelection)) validationError(req, "انتخاب پیکربندی معتبر نیست.", selectionPath);

      const requestedGroupKey = requiredString(
        rawSelection.groupKey,
        req,
        "کلید گروه پیکربندی الزامی است.",
        `${selectionPath}.groupKey`,
      );
      if (seenGroups.has(requestedGroupKey)) {
        validationError(req, "از هر گروه پیکربندی فقط یک گزینه قابل انتخاب است.", selectionPath);
      }

      const group = allowedGroupsByKey.get(requestedGroupKey) ??
        validationError(req, "گروه پیکربندی برای این محصول مجاز نیست.", `${selectionPath}.groupKey`);
      if (group.active !== true) {
        validationError(req, "گروه پیکربندی غیرفعال است.", `${selectionPath}.groupKey`);
      }

      const optionID = relationshipID(rawSelection.option) ??
        validationError(req, "گزینه پیکربندی الزامی است.", `${selectionPath}.option`);
      const option = await findByID(req, "configuration-options", optionID, `${selectionPath}.option`);
      if (!sameID(relationshipID(option.group), relationshipID(group))) {
        validationError(req, "گزینه انتخاب‌شده متعلق به این گروه نیست.", `${selectionPath}.option`);
      }
      if (option.active !== true) {
        validationError(req, "گزینه پیکربندی غیرفعال است.", `${selectionPath}.option`);
      }

      seenGroups.add(requestedGroupKey);
      configuration.push({
        ...(typeof rawSelection.id === "string" ? { id: rawSelection.id } : {}),
        groupKey: requestedGroupKey,
        group: relationshipID(group),
        groupLabelFaSnapshot: requiredString(group.title, req, "عنوان گروه معتبر نیست.", selectionPath),
        option: optionID,
        ...(typeof option.code === "string" && option.code.trim() ? { optionCodeSnapshot: option.code.trim() } : {}),
        labelFaSnapshot: requiredString(option.title, req, "عنوان گزینه معتبر نیست.", selectionPath),
      });
    }

    for (const group of allowedGroups) {
      if (group.active === true && group.required === true && !seenGroups.has(String(group.key))) {
        validationError(req, `انتخاب گروه «${String(group.title)}» الزامی است.`, `${path}.configuration`);
      }
    }

    configuration.sort((left, right) =>
      String(left.groupKey).localeCompare(String(right.groupKey), "en") ||
      String(relationshipID(left.option)).localeCompare(String(relationshipID(right.option)), "en"),
    );
    const configurationKey = buildConfigurationKey(configuration) ??
      validationError(req, "کلید پیکربندی قابل محاسبه نیست.", `${path}.configuration`);

    const identityKey = itemIdentityKey(productID, variantID, configurationKey);
    if (itemKeys.has(identityKey)) {
      validationError(req, "ردیف تکراری با محصول، گونه و پیکربندی یکسان مجاز نیست.", path);
    }
    itemKeys.add(identityKey);

    const lineAmount = trustedUnitPrice * trustedQuantity;
    try {
      assertTomanAmount(lineAmount, "lineAmountInTMN");
      assertTomanAmount(amount + lineAmount, "amountInTMN");
    } catch {
      validationError(req, "مبلغ نهایی از محدوده عدد صحیح امن خارج است.", path);
    }
    amount += lineAmount;

    hydratedItems.push({
      ...item,
      product: productID,
      ...(variantID === undefined ? { variant: null } : { variant: variantID }),
      quantity: trustedQuantity,
      configuration,
      configurationKey,
      productTitleSnapshot: productTitle,
      ...(variantCode ? { variantCodeSnapshot: variantCode } : { variantCodeSnapshot: null }),
      unitPriceInTMN: trustedUnitPrice,
    });
  }

  return { amount, items: hydratedItems };
};

/**
 * Validates every item against current server records and replaces client-provided
 * labels, identity keys, and prices with trusted snapshots.
 */
export const nilperCommerceItemsHook = (
  kind: CommerceDocumentKind,
): CollectionBeforeValidateHook => async ({ data, operation, originalDoc, req }) => {
  if (!isRecord(data)) return data;

  const amountField = kind === "cart" ? "subtotal" : "amount";
  const hasExplicitItems = req.context[explicitItemsContextKey(kind)] === true;
  if (!hasExplicitItems) {
    if (kind === "cart") {
      data.items = operation === "update" && isRecord(originalDoc) && Array.isArray(originalDoc.items)
        ? originalDoc.items
        : [];
    } else if (operation === "create") {
      validationError(req, "سفارش یا تراکنش باید حداقل یک ردیف داشته باشد.");
    } else if (Object.prototype.hasOwnProperty.call(data, amountField) && isRecord(originalDoc)) {
      data[amountField] = originalDoc[amountField];
    }
    if (kind !== "cart") return data;
  }

  const itemsValue = data.items === null ? [] : data.items;
  const items = Array.isArray(itemsValue)
    ? itemsValue
    : validationError(req, "ردیف‌های خرید باید به صورت فهرست ارسال شوند.");
  if (kind !== "cart" && items.length === 0) {
    validationError(req, "سفارش یا تراکنش باید حداقل یک ردیف داشته باشد.");
  }

  const currency = data.currency ?? (isRecord(originalDoc) ? originalDoc.currency : undefined) ?? NILPER_COMMERCE_CURRENCY.code;
  if (currency !== NILPER_COMMERCE_CURRENCY.code) {
    validationError(req, "واحد پول این مسیر باید تومان (TMN) باشد.", "currency");
  }

  const hydrated = await hydrateCommerceItems(items, req);
  data.items = hydrated.items;
  data[amountField] = hydrated.amount;
  return data;
};
