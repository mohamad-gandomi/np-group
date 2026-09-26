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
import { relationIDs, resolveCommerce, validateVariantDefinitionRecords } from "./catalog-domain";

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
const trustedItemsContextKey = (kind: CommerceDocumentKind) => `nilper:${kind}:trusted-items`;

export const setNilperTrustedCommerceItems = (
  req: PayloadRequest,
  kind: CommerceDocumentKind,
  trusted: boolean,
) => {
  req.context[trustedItemsContextKey(kind)] = trusted;
};

const nilperItemFields: Field[] = [
  {
    name: "configuration",
    type: "array",
    label: "ویژگی‌های انتخاب‌شده",
    labels: { singular: "انتخاب", plural: "انتخاب‌ها" },
    admin: {
      description: "ورودی پایدار ویژگی و گزینه؛ عنوان‌ها و شناسه نهایی در سرور بازنویسی می‌شوند.",
    },
    fields: [
      { name: "groupKey", type: "text", label: "کلید ویژگی", required: true },
      {
        name: "group",
        type: "relationship",
        relationTo: "variantTypes",
        label: "ویژگی",
        admin: snapshotFieldAdmin,
      },
      {
        name: "groupLabelFaSnapshot",
        type: "text",
        label: "عنوان ویژگی هنگام ثبت",
        required: true,
        admin: snapshotFieldAdmin,
      },
      {
        name: "option",
        type: "relationship",
        relationTo: "variantOptions",
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
    label: "کلید نرمال انتخاب ویژگی‌ها",
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
    label: "کد ثبت مدل هنگام ثبت",
    admin: snapshotFieldAdmin,
  },
  {
    name: "variantTitleSnapshot",
    type: "text",
    label: "عنوان مدل هنگام ثبت",
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
  {
    name: "shippingModeSnapshot",
    type: "select",
    label: "شیوه ارسال هنگام ثبت",
    defaultValue: "freight",
    options: [
      { label: "مرسوله پستی", value: "parcel" },
      { label: "باربری / هماهنگی دستی", value: "freight" },
    ],
    admin: snapshotFieldAdmin,
  },
  {
    name: "parcelWeightInGramsSnapshot",
    type: "number",
    label: "وزن پستی هنگام ثبت (گرم)",
    min: 1,
    admin: snapshotFieldAdmin,
  },
  {
    name: "tapinBoxIDSnapshot",
    type: "number",
    label: "شناسه بسته تاپین هنگام ثبت",
    min: 1,
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

const requiredString = (value: unknown, req: PayloadRequest, message: string, path: string) => {
  if (typeof value !== "string" || !value.trim()) return validationError(req, message, path);
  return value.trim();
};

const itemIdentityKey = (
  productID: DefaultDocumentIDType,
  variantID: DefaultDocumentIDType | undefined,
  configurationKey: string,
) => JSON.stringify([String(productID), variantID === undefined ? null : String(variantID), configurationKey]);

export const validateNilperCommerceItems = async (items: unknown[], req: PayloadRequest) => {
  const productIDs = [...new Set(items.map((item) => isRecord(item) ? relationshipID(item.product) : undefined)
    .filter((id): id is DefaultDocumentIDType => id !== undefined))];
  const variantIDs = [...new Set(items.map((item) => isRecord(item) ? relationshipID(item.variant) : undefined)
    .filter((id): id is DefaultDocumentIDType => id !== undefined))];
  // These hooks run inside Payload transactions; avoid concurrent use of one pg client.
  const productResult = productIDs.length ? await req.payload.find({
      collection: "products", depth: 0, draft: false, overrideAccess: true, pagination: false, req,
      where: { id: { in: productIDs } },
    }) : { docs: [] };
  const variantResult = variantIDs.length ? await req.payload.find({
      collection: "variants", depth: 0, draft: false, overrideAccess: true, pagination: false, req,
      where: { id: { in: variantIDs } },
    }) : { docs: [] };
  const productsByID = new Map(productResult.docs.map((product) => [String(product.id), product as unknown as RecordValue]));
  const variantsByID = new Map(variantResult.docs.map((variant) => [String(variant.id), variant as unknown as RecordValue]));
  const groupIDs = [...new Set(productResult.docs.flatMap((product) =>
    (Array.isArray(product.attributes) ? product.attributes : [])
      .map((row) => relationshipID(row.attribute))
      .filter((id): id is DefaultDocumentIDType => id !== undefined)))];
  const requestedOptionIDs = items.flatMap((item) => isRecord(item) && Array.isArray(item.configuration)
    ? item.configuration.map((selection) => isRecord(selection) ? relationshipID(selection.option) : undefined)
    : []).filter((id): id is DefaultDocumentIDType => id !== undefined);
  const optionIDs = [...new Set([
    ...variantResult.docs.flatMap((variant) => relationIDs(variant.options)),
    ...requestedOptionIDs,
  ])];
  const groupResult = groupIDs.length ? await req.payload.find({
      collection: "variantTypes", depth: 0, overrideAccess: true, pagination: false, req,
      where: { id: { in: groupIDs } },
    }) : { docs: [] };
  const optionResult = optionIDs.length ? await req.payload.find({
      collection: "variantOptions", depth: 0, overrideAccess: true, pagination: false, req,
      where: { id: { in: optionIDs } },
    }) : { docs: [] };
  const groupsByID = new Map(groupResult.docs.map((group) => [String(group.id), group as unknown as RecordValue]));
  const optionsByID = new Map(optionResult.docs.map((option) => [String(option.id), option as unknown as RecordValue]));
  const variantRelations = {
    attributesByID: new Map(groupResult.docs.map((group) => [Number(group.id), group as unknown as RecordValue])),
    optionsByID: new Map(optionResult.docs.map((option) => [Number(option.id), option as unknown as RecordValue])),
  };
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

    const product = productsByID.get(String(productID)) ??
      validationError(req, "رکورد معتبر products یافت نشد.", `${path}.product`);
    if (product._status !== "published") {
      validationError(req, "محصول باید منتشرشده باشد.", `${path}.product`);
    }

    const productTitle = requiredString(product.title, req, "نام محصول معتبر نیست.", `${path}.product`);
    const variantID = relationshipID(item.variant);
    let variantCode: string | undefined = typeof product.catalogCode === 'string' ? product.catalogCode : undefined;
    let variantTitle: string | undefined;
    let resolved = resolveCommerce(product);
    if (product.productType === 'variable' && variantID === undefined) validationError(req, 'انتخاب مدل محصول الزامی است.', `${path}.variant`);
    if (product.productType === 'simple' && variantID !== undefined) validationError(req, 'محصول ساده مدل ندارد.', `${path}.variant`);

    if (variantID !== undefined) {
      const variant = variantsByID.get(String(variantID)) ??
        validationError(req, "رکورد معتبر variants یافت نشد.", `${path}.variant`);
      if (variant._status !== "published") {
        validationError(req, "مدل باید منتشرشده باشد.", `${path}.variant`);
      }
      if (!sameID(relationshipID(variant.product), productID)) {
        validationError(req, "مدل انتخاب‌شده متعلق به این محصول نیست.", `${path}.variant`);
      }

      variantCode = requiredString(variant.nilperCode, req, "کد ثبت مدل معتبر نیست.", `${path}.variant`);
      variantTitle = typeof variant.title === 'string' ? variant.title : variantCode;
      validateVariantDefinitionRecords(product, variant.options, variantRelations, req);
      resolved = resolveCommerce(product, variant);
    }
    const { priceInTMN: unitPrice, priceInTMNEnabled: priceEnabled, shippingMode, parcelWeightInGrams, tapinBoxID } = resolved;
    if (resolved.availabilityMode === 'unavailable') validationError(req, 'محصول در حال حاضر قابل سفارش نیست.', `${path}.product`);

    if (shippingMode === "parcel") {
      if (typeof parcelWeightInGrams !== "number" || !Number.isSafeInteger(parcelWeightInGrams) || parcelWeightInGrams <= 0) {
        validationError(req, "وزن معتبر برای ارسال پستی ثبت نشده است.", path);
      }
      if (typeof tapinBoxID !== "number" || !Number.isSafeInteger(tapinBoxID) || tapinBoxID <= 0) {
        validationError(req, "شناسه بسته تاپین برای ارسال پستی ثبت نشده است.", path);
      }
    }

    if (priceEnabled !== true || typeof unitPrice !== "number") {
      validationError(req, "قیمت قابل فروش برای محصول یا مدل ثبت نشده است.", path);
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

    const variantAttributes = relationIDs(product.variantAttributes);
    const assignments = (Array.isArray(product.attributes) ? product.attributes : []) as RecordValue[];
    const customerAssignments = assignments.filter((row) => !variantAttributes.includes(Number(relationshipID(row.attribute))));
    const allowedGroupIDs = customerAssignments.map((row) => relationshipID(row.attribute)).filter((id): id is DefaultDocumentIDType => id !== undefined);
    const allowedGroups = allowedGroupIDs.map((id) => groupsByID.get(String(id)) ??
      validationError(req, "رکورد معتبر variantTypes یافت نشد.", `${path}.configuration`));
    const allowedGroupsByKey = new Map(
      allowedGroups.map((group) => [requiredString(group.name, req, "کلید ویژگی معتبر نیست.", `${path}.configuration`), group]),
    );

    const requestedConfigurationValue = item.configuration ?? [];
    const requestedConfiguration = Array.isArray(requestedConfigurationValue)
      ? requestedConfigurationValue
      : validationError(req, "انتخاب ویژگی‌ها باید یک فهرست باشد.", `${path}.configuration`);

    const seenGroups = new Set<string>();
    const configuration: RecordValue[] = [];
    for (const [selectionIndex, rawSelection] of requestedConfiguration.entries()) {
      const selectionPath = `${path}.configuration.${selectionIndex}`;
      if (!isRecord(rawSelection)) validationError(req, "انتخاب ویژگی معتبر نیست.", selectionPath);

      const requestedGroupKey = requiredString(
        rawSelection.groupKey,
        req,
        "کلید ویژگی الزامی است.",
        `${selectionPath}.groupKey`,
      );
      if (seenGroups.has(requestedGroupKey)) {
        validationError(req, "از هر ویژگی فقط یک گزینه قابل انتخاب است.", selectionPath);
      }

      const group = allowedGroupsByKey.get(requestedGroupKey) ??
        validationError(req, "این ویژگی برای محصول مجاز نیست.", `${selectionPath}.groupKey`);
      if (group.active !== true) {
        validationError(req, "ویژگی غیرفعال است.", `${selectionPath}.groupKey`);
      }

      const optionID = relationshipID(rawSelection.option) ??
        validationError(req, "گزینه ویژگی الزامی است.", `${selectionPath}.option`);
      const option = optionsByID.get(String(optionID)) ??
        validationError(req, "رکورد معتبر variantOptions یافت نشد.", `${selectionPath}.option`);
      const assignment = customerAssignments.find((row) => sameID(relationshipID(row.attribute), relationshipID(group)));
      if (!relationIDs(assignment?.allowedOptions).includes(Number(optionID))) validationError(req, 'گزینه برای این محصول مجاز نیست.', selectionPath);
      if (!sameID(relationshipID(option.variantType), relationshipID(group))) {
        validationError(req, "گزینه انتخاب‌شده متعلق به این ویژگی نیست.", `${selectionPath}.option`);
      }
      if (option.active !== true) {
        validationError(req, "گزینه ویژگی غیرفعال است.", `${selectionPath}.option`);
      }

      seenGroups.add(requestedGroupKey);
      configuration.push({
        ...(typeof rawSelection.id === "string" ? { id: rawSelection.id } : {}),
        groupKey: requestedGroupKey,
        group: relationshipID(group),
        groupLabelFaSnapshot: requiredString(group.label, req, "عنوان ویژگی معتبر نیست.", selectionPath),
        option: optionID,
        ...(typeof option.code === "string" && option.code.trim() ? { optionCodeSnapshot: option.code.trim() } : {}),
        labelFaSnapshot: requiredString(option.label, req, "عنوان گزینه معتبر نیست.", selectionPath),
      });
    }

    for (const group of allowedGroups) {
      const assignment = customerAssignments.find((row) => sameID(relationshipID(row.attribute), relationshipID(group)));
      if (group.active === true && assignment?.required === true && !seenGroups.has(String(group.name))) {
        validationError(req, `انتخاب ویژگی «${String(group.label)}» الزامی است.`, `${path}.configuration`);
      }
    }

    configuration.sort((left, right) =>
      String(left.groupKey).localeCompare(String(right.groupKey), "en") ||
      String(relationshipID(left.option)).localeCompare(String(relationshipID(right.option)), "en"),
    );
    const configurationKey = buildConfigurationKey(configuration) ??
      validationError(req, "کلید انتخاب ویژگی‌ها قابل محاسبه نیست.", `${path}.configuration`);

    const identityKey = itemIdentityKey(productID, variantID, configurationKey);
    if (itemKeys.has(identityKey)) {
      validationError(req, "ردیف تکراری با محصول، مدل و ویژگی‌های یکسان مجاز نیست.", path);
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
      variantTitleSnapshot: variantTitle ?? null,
      unitPriceInTMN: trustedUnitPrice,
      shippingModeSnapshot: shippingMode,
      ...(shippingMode === "parcel"
        ? {
            parcelWeightInGramsSnapshot: parcelWeightInGrams,
            tapinBoxIDSnapshot: tapinBoxID,
          }
        : {
            parcelWeightInGramsSnapshot: null,
            tapinBoxIDSnapshot: null,
          }),
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
  // A persisted order/transaction's line snapshots are immutable, even on explicit item updates.
  if (kind !== 'cart' && operation === 'update' && isRecord(originalDoc)) {
    data.items = originalDoc.items;
    data[amountField] = originalDoc[amountField];
    return data;
  }
  if (req.context[trustedItemsContextKey(kind)] === true) {
    const trustedItems = Array.isArray(data.items)
      ? data.items
      : validationError(req, "ردیف‌های قابل اعتماد خرید باید به صورت فهرست ارسال شوند.");
    if (kind !== "cart" && trustedItems.length === 0) {
      validationError(req, "سفارش یا تراکنش باید حداقل یک ردیف داشته باشد.");
    }
    let trustedAmount = 0;
    for (const [index, item] of trustedItems.entries()) {
      if (
        !isRecord(item) ||
        typeof item.quantity !== "number" ||
        !Number.isSafeInteger(item.quantity) ||
        item.quantity <= 0 ||
        typeof item.unitPriceInTMN !== "number"
      ) {
        validationError(req, "snapshot ردیف خرید معتبر نیست.", `items.${index}`);
      }
      try {
        const lineAmount = assertTomanAmount(item.unitPriceInTMN, "unitPriceInTMN") * item.quantity;
        trustedAmount = assertTomanAmount(trustedAmount + lineAmount, "amountInTMN");
      } catch {
        validationError(req, "snapshot مبلغ ردیف خرید معتبر نیست.", `items.${index}`);
      }
    }
    const shippingAmount = kind === "cart" ? 0 : data.shippingAmountInTMN ?? 0;
    try {
      data[amountField] = assertTomanAmount(trustedAmount + assertTomanAmount(shippingAmount as number, "shippingAmountInTMN"));
    } catch {
      validationError(req, "هزینه ارسال باید عدد صحیح و نامنفی تومان باشد.", "shippingAmountInTMN");
    }
    return data;
  }
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

  const hydrated = await validateNilperCommerceItems(items, req);
  data.items = hydrated.items;
  const shippingAmount = kind === "cart" ? 0 : data.shippingAmountInTMN ?? 0;
  try {
    assertTomanAmount(shippingAmount as number, "shippingAmountInTMN");
    assertTomanAmount(hydrated.amount + Number(shippingAmount), "amountInTMN");
  } catch {
    validationError(req, "هزینه ارسال باید عدد صحیح و نامنفی تومان باشد.", "shippingAmountInTMN");
  }
  data[amountField] = hydrated.amount + Number(shippingAmount);
  return data;
};
