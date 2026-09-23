import { ecommercePlugin } from "@payloadcms/plugin-ecommerce";
import type { CollectionBeforeValidateHook, CollectionConfig, Field, Where } from "payload";
import { randomUUID } from "node:crypto";

import {
  adminOnlyFieldAccess,
  adminOrPublishedStatus,
  isAdmin,
  isAuthenticated,
  isCustomer,
  isDocumentOwner,
} from "./access";
import {
  nilperCartItemMatcher,
  nilperCommerceBeforeOperation,
  nilperCommerceItemsHook,
  withNilperCommerceItemFields,
} from "./cart-configuration";
import { measurementsField, technicalSpecsField } from "./domain-fields";
import { attributeCollection, productAttributeFields, relationID, relationIDs, validateProduct, validateVariant } from "./catalog-domain";
import { NILPER_COMMERCE_CURRENCIES, assertTomanAmount, validateCommerceQuantity, validateTomanAmount } from "./money";
import { withStorefrontRevalidation } from "./storefront-revalidation";
import { zarinpalAdapter } from "@/features/payments/zarinpal/adapter";

const fieldNamed = (field: Field, name: string) => "name" in field && field.name === name;

const findField = (fields: Field[], name: string): Field | undefined => {
  for (const field of fields) {
    if (fieldNamed(field, name)) return field;
    if (field.type === "tabs") {
      for (const tab of field.tabs) {
        const nested = findField(tab.fields, name);
        if (nested) return nested;
      }
    } else if (field.type === "group" || field.type === "row" || field.type === "collapsible" || field.type === "array") {
      const nested = findField(field.fields, name);
      if (nested) return nested;
    }
  }
  return undefined;
};

const requireField = (fields: Field[], name: string): Field => {
  const field = findField(fields, name);
  if (!field) throw new Error(`Payload ecommerce field "${name}" was not found.`);
  return field;
};

const withoutSidebarPosition = (field: Field): Field => ({
  ...field,
  admin: { ...field.admin, position: undefined },
} as Field);

const hiddenAdminField = (field: Field): Field => ({
  ...field,
  admin: { ...field.admin, hidden: true },
} as Field);

const relationshipID = (value: unknown): number | undefined => {
  if (typeof value === "number") return value;
  if (typeof value === "string" && /^\d+$/.test(value)) return Number(value);
  if (value && typeof value === "object" && "id" in value) {
    const id = value.id;
    if (typeof id === "number") return id;
    if (typeof id === "string" && /^\d+$/.test(id)) return Number(id);
  }
  return undefined;
};

type OrderAddressSnapshot = {
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  company?: string | null;
  country?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  postalCode?: string | null;
  state?: string | null;
  title?: string | null;
};

const linkOrderToCustomerAddress: CollectionBeforeValidateHook = async ({ data, originalDoc, req }) => {
  if (!data) return data;

  const customer = relationshipID(data.customer ?? originalDoc?.customer);
  const existingAddress = relationshipID(data.customerAddress ?? originalDoc?.customerAddress);
  const shippingAddress = (data.shippingAddress ?? originalDoc?.shippingAddress) as OrderAddressSnapshot | undefined;

  if (!customer || existingAddress || !shippingAddress?.addressLine1) return data;

  const destinationClause: Where = shippingAddress.postalCode
    ? { postalCode: { equals: shippingAddress.postalCode } }
    : { city: { equals: shippingAddress.city ?? "" } };
  const clauses: Where[] = [
    { customer: { equals: customer } },
    { addressLine1: { equals: shippingAddress.addressLine1 } },
    destinationClause,
  ];
  const matches = await req.payload.find({
    collection: "addresses",
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    req,
    where: { and: clauses },
  });
  const address = matches.docs[0] ?? await req.payload.create({
    collection: "addresses",
    data: {
      ...shippingAddress,
      country: "IR",
      customer,
      title: shippingAddress.title || "آدرس سفارش",
    },
    depth: 0,
    overrideAccess: true,
    req,
  });

  return { ...data, customerAddress: address.id };
};

const setAddressDisplayLabel: CollectionBeforeValidateHook = ({ data, originalDoc }) => {
  if (!data) return data;

  const title = data.title ?? originalDoc?.title ?? "آدرس";
  const city = data.city ?? originalDoc?.city;
  const addressLine = data.addressLine1 ?? originalDoc?.addressLine1;
  const displayLabel = [title, city, addressLine]
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    .map((value) => value.trim())
    .join(" - ");

  return { ...data, displayLabel };
};

const shippingModeField = (): Field => ({
  name: "shippingMode",
  type: "select",
  label: "شیوه ارسال",
  defaultValue: "freight",
  options: [
    { label: "مرسوله پستی (تاپین)", value: "parcel" },
    { label: "باربری / هماهنگی دستی", value: "freight" },
  ],
});

const parcelFields = (): Field[] => [
  {
    name: "parcelWeightInGrams",
    type: "number",
    label: "وزن کالا برای ارسال پستی (گرم)",
    min: 1,
    admin: {
      condition: (_, siblingData) => siblingData?.shippingMode === "parcel",
      description: "وزن واقعی خود کالا؛ وزن بسته‌بندی عمومی از تنظیمات محرمانه تاپین افزوده می‌شود.",
    },
  },
  {
    name: "tapinBoxID",
    type: "number",
    label: "شناسه بسته پستی تاپین",
    min: 1,
    admin: { condition: (_, siblingData) => siblingData?.shippingMode === "parcel" },
  },
];

const shippingSnapshotFields = (includeShipment = false): Field[] => [
  shippingModeField(),
  { name: "shippingAmountInTMN", type: "number", label: "هزینه ارسال (تومان)", min: 0, defaultValue: 0 },
  { name: "shippingProvider", type: "select", label: "ارائه‌دهنده ارسال", defaultValue: "manual", options: [{ label: "تاپین", value: "tapin" }, { label: "هماهنگی دستی", value: "manual" }] },
  { name: "shippingServiceID", type: "text", label: "شناسه سرویس ارسال" },
  { name: "shippingServiceLabel", type: "text", label: "نام سرویس ارسال" },
  { name: "shippingProvinceCode", type: "number", label: "کد استان مقصد" },
  { name: "shippingCityCode", type: "number", label: "کد شهر مقصد" },
  { name: "shippingWeightInGrams", type: "number", label: "وزن کل مرسوله (گرم)", min: 1 },
  { name: "shippingBoxID", type: "number", label: "شناسه بسته پستی تاپین", min: 1 },
  { name: "shippingQuotedAt", type: "date", label: "زمان استعلام ارسال" },
  ...(includeShipment ? [
    { name: "shippingStatus", type: "select", label: "وضعیت ارسال", defaultValue: "manual_coordination", options: [
      { label: "نیازمند هماهنگی دستی", value: "manual_coordination" },
      { label: "قیمت‌گذاری شده", value: "quoted" },
      { label: "در انتظار ساخت مرسوله", value: "shipment_pending" },
      { label: "در حال ساخت مرسوله", value: "creating" },
      { label: "مرسوله ساخته شد", value: "created" },
      { label: "در مسیر", value: "in_transit" },
      { label: "تحویل شد", value: "delivered" },
      { label: "خطا", value: "failed" },
    ] },
    { name: "shippingShipmentID", type: "text", label: "شناسه مرسوله", unique: true, index: true },
    { name: "shippingTrackingCode", type: "text", label: "کد رهگیری", index: true },
    { name: "shippingProviderStatus", type: "text", label: "وضعیت خام ارائه‌دهنده" },
    { name: "shippingFailureMessage", type: "textarea", label: "خطای ارسال" },
    { name: "shipmentCreatedAt", type: "date", label: "زمان ساخت مرسوله" },
  ] satisfies Field[] : []),
];

const NILPER_ORDER_STATUSES = [
  { label: "در حال بررسی", value: "pending_review" },
  { label: "تأیید شده", value: "confirmed" },
  { label: "در حال آماده‌سازی", value: "in_production" },
  { label: "آماده ارسال", value: "ready" },
  { label: "ارسال شده", value: "shipped" },
  { label: "تحویل شده", value: "delivered" },
  { label: "لغو شده", value: "cancelled" },
] as const;

const withNilperOrderStatus = (field: Field): Field => {
  if (field.type === "tabs") {
    return { ...field, tabs: field.tabs.map((tab) => ({ ...tab, fields: tab.fields.map(withNilperOrderStatus) })) };
  }
  if (field.type === "group" || field.type === "row" || field.type === "collapsible") {
    return { ...field, fields: field.fields.map(withNilperOrderStatus) };
  }
  if (field.type === "select" && fieldNamed(field, "status")) {
    return {
      ...field,
      label: "وضعیت سفارش",
      defaultValue: "pending_review",
      options: [...NILPER_ORDER_STATUSES],
    };
  }
  return field;
};

const withCommerceValidation = (field: Field): Field => {
  if (field.type === "tabs") {
    return {
      ...field,
      tabs: field.tabs.map((tab) => ({ ...tab, fields: tab.fields.map(withCommerceValidation) })),
    };
  }

  if (field.type === "group" || field.type === "row" || field.type === "collapsible") {
    return { ...field, fields: field.fields.map(withCommerceValidation) };
  }

  if (field.type === "array") {
    return { ...field, fields: field.fields.map(withCommerceValidation) };
  }

  if (field.type === "number" && ["priceInTMN", "unitPriceInTMN", "amount", "subtotal", "shippingAmountInTMN"].some((name) => fieldNamed(field, name))) {
    return { ...field, validate: validateTomanAmount };
  }

  if (field.type === "number" && fieldNamed(field, "quantity")) {
    return { ...field, validate: validateCommerceQuantity };
  }

  return field;
};

const productFields = (defaultCollection: CollectionConfig): Field[] => {
  const defaults = defaultCollection.fields;
  const variantField = (name: string) => defaults.find((field) => fieldNamed(field, name));
  const priceFields = defaults
    .filter((field) => !("name" in field) || !field.name)
    .map(withCommerceValidation);

  return [
    {
      type: "tabs",
      tabs: [
        {
          label: "هویت",
          fields: [
            { name: "title", type: "text", label: "نام فارسی محصول", required: true, admin: { rtl: true } },
            { name: "slug", type: "text", label: "نامک", required: true, unique: true },
            { name: "catalogCode", type: "text", label: "کد کاتالوگ" },
            { name: "productType", type: "select", label: "نوع محصول", required: true, defaultValue: "simple", options: [{ label: "محصول ساده", value: "simple" }, { label: "محصول متغیر", value: "variable" }] },
            { name: "brand", type: "relationship", relationTo: "brands", label: "برند", required: true },
            { name: "categories", type: "relationship", relationTo: "categories", hasMany: true, label: "دسته‌بندی‌ها", required: true },
          ],
        },
        {
          label: "فروش",
          fields: [
            {
              name: "salesMode",
              defaultValue: "made_to_order",
              type: "select",
              label: "روش فروش",
              required: true,
              options: [
                { label: "خرید مستقیم", value: "direct" },
                { label: "نیازمند استعلام", value: "inquiry" },
                { label: "ساخت سفارشی", value: "made_to_order" },
              ],
            },
            {
              name: "availabilityMode",
              defaultValue: "orderable",
              type: "select",
              label: "وضعیت موجودی",
              required: true,
              options: [
                { label: "قابل سفارش", value: "orderable" },
                { label: "موجود", value: "in_stock" },
                { label: "ناموجود", value: "unavailable" },
              ],
            },
            shippingModeField(),
            ...parcelFields(),
            ...priceFields,
          ],
        },
        {
          label: "رسانه",
          fields: [
            { name: "mainImage", type: "upload", relationTo: "media", label: "تصویر اصلی" },
            {
              name: "gallery",
              type: "array",
              label: "گالری",
              labels: { singular: "تصویر", plural: "تصاویر" },
              fields: [
                { name: "image", type: "upload", relationTo: "media", label: "تصویر" },
                { name: "captionFa", type: "text", label: "توضیح فارسی", admin: { rtl: true } },
              ],
            },
          ],
        },
        {
          label: "اطلاعات محصول",
          fields: [
            { name: "descriptionFa", type: "richText", label: "معرفی فارسی محصول", required: true },
            measurementsField("فقط اندازه‌های مشترک همه مدل‌ها؛ اندازه متفاوت هر کد ثبت در خود مدل نگهداری می‌شود."),
            technicalSpecsField(),
            { name: "orderNotesFa", type: "textarea", label: "ملاحظات سفارش‌گیری" },
            { name: "leadTimeFa", type: "text", label: "زمان آماده‌سازی", admin: { rtl: true } },
          ],
        },
        {
          label: "ویژگی‌ها",
          description: "ویژگی‌ها به‌صورت خودکار مدل ایجاد نمی‌کنند.",
          fields: [
            ...productAttributeFields,
            { name: "relatedProducts", type: "relationship", relationTo: "products", hasMany: true, label: "محصولات مرتبط" },
            {
              name: "matchingProducts",
              type: "relationship",
              relationTo: "products",
              hasMany: true,
              label: "محصولات ست / هماهنگ",
              admin: { description: "رابطه صریح برای محصولات یک ست یا خانواده؛ از پیشنهاد عمومی «محصولات مرتبط» جدا است." },
            },
          ],
        },
        {
          label: "مدل‌های محصول",
          admin: { condition: (data) => data?.productType === "variable" },
          fields: [
            { name: "variantAttributes", type: "relationship", relationTo: "variantTypes", hasMany: true, label: "ویژگی‌های سازنده مدل",
              filterOptions: ({ data }) => ({ id: { in: (data?.attributes ?? []).map((row: { attribute: unknown }) => relationID(row.attribute)).filter(Boolean) } }) },
            ...[variantField("enableVariants"), variantField("variantTypes")].filter((field): field is Field => Boolean(field)).map(hiddenAdminField),
            {
              name: "variants",
              type: "join",
              collection: "variants",
              on: "product",
              label: "مدل‌های این محصول",
              admin: {
                allowCreate: true,
                defaultColumns: ["nilperCode", "options", "priceInTMN", "_status"],
                description: "مدل‌های واقعی را همین‌جا ببینید، ویرایش کنید یا با «افزودن مورد جدید» بسازید؛ محصول فعلی خودکار انتخاب می‌شود.",
              },
            },
          ],
        },
      ],
    },
  ];
};

const variantFields = (defaultCollection: CollectionConfig): Field[] => {
  const defaults = defaultCollection.fields;
  const take = (name: string) => defaults.find((field) => fieldNamed(field, name));
  const present = (name: string, label: string, description?: string) => {
    const field = take(name);
    if (!field) return undefined;

    return {
      ...field,
      label,
      admin: {
        ...("admin" in field ? field.admin : undefined),
        ...(description ? { description } : {}),
      },
    } as Field;
  };
  const standardRelationship = (name: "product" | "options", label: string, description?: string) => {
    const field = take(name);
    if (!field || field.type !== "relationship") return undefined;
    const admin = { ...field.admin };
    if ("components" in admin) delete admin.components;

    return {
      ...field,
      label,
      validate: name === "options" ? () => true as const : field.validate,
      filterOptions: name === "options" ? async ({ siblingData, req }: { siblingData: unknown; req: import("payload").PayloadRequest }) => {
        const id = relationID((siblingData as { product?: unknown })?.product);
        if (!id) return false;
        const product = await req.payload.findByID({ collection: "products", id, depth: 0, req });
        const attributes = relationIDs(product.variantAttributes);
        return { id: { in: (product.attributes ?? []).filter((row) => attributes.includes(relationID(row.attribute)!)).flatMap((row) => relationIDs(row.allowedOptions)) } };
      } : field.filterOptions,
      admin: {
        ...admin,
        ...(name === "product" ? { readOnly: false } : {}),
        ...(description ? { description } : {}),
      },
    } as Field;
  };
  const localizePriceField = (field: Field): Field => {
    if (field.type === "group") {
      return {
        ...field,
        admin: { ...field.admin, description: "برای استفاده از قیمت محصول، قیمت اختصاصی مدل را فعال نکنید." },
        fields: field.fields.map(localizePriceField),
      };
    }

    if (field.type === "row") {
      return {
        ...field,
        fields: field.fields.map(localizePriceField),
      };
    }

    if (field.type === "collapsible") {
      return {
        ...field,
        fields: field.fields.map(localizePriceField),
      };
    }

    if (fieldNamed(field, "priceInTMNEnabled")) {
      return { ...field, label: "قیمت اختصاصی مدل (تومان)" } as Field;
    }

    if (fieldNamed(field, "priceInTMN")) {
      return {
        ...field,
        label: "قیمت (تومان)",
        admin: { ...("admin" in field ? field.admin : undefined), description: "مبلغ را به تومان و بدون جداکننده وارد کنید." },
      } as Field;
    }

    return field;
  };
  const priceFields = defaults
    .filter((field) => !("name" in field) || !field.name)
    .map(withCommerceValidation)
    .map(localizePriceField);
  return [
    standardRelationship("product", "محصول", "محصول مادر را پیش از انتخاب گزینه‌های مدل مشخص کنید."),
    { name: "nilperCode", type: "text", label: "کد ثبت نیلپر / SKU", required: true, unique: true },
    present("title", "عنوان مدل", "عنوان داخلی برای مدیریت؛ این متن به مشتری نمایش داده نمی‌شود و به‌صورت خودکار تکمیل می‌شود."),
    standardRelationship("options", "گزینه‌های ویژگی", "از هر ویژگی سازنده مدل یک گزینه انتخاب کنید."),
    { name: "combinationKey", type: "text", unique: true, index: true, admin: { hidden: true } },
    { ...shippingModeField(), defaultValue: undefined, admin: { description: "خالی: استفاده از شیوه ارسال محصول" } } as Field,
    { name: "availabilityMode", type: "select", label: "وضعیت موجودی مدل", options: [{ label: "قابل سفارش", value: "orderable" }, { label: "موجود", value: "in_stock" }, { label: "ناموجود", value: "unavailable" }], admin: { description: "خالی: استفاده از وضعیت محصول" } },
    { name: "mainImage", type: "upload", relationTo: "media", label: "تصویر مدل", admin: { description: "خالی: استفاده از تصویر محصول" } },
    ...parcelFields(),
    ...priceFields,
    measurementsField("فقط اختلاف فیزیکی این کد ثبت، مانند فرم نشیمن، ابعاد، وزن یا متراژ پارچه."),
    { name: "manufacturingNotesFa", type: "textarea", label: "یادداشت ساخت / سفارش" },
  ].filter((field): field is Field => Boolean(field));
};

export const ecommerce = ecommercePlugin({
  access: {
    adminOnlyFieldAccess,
    adminOrPublishedStatus,
    isAdmin,
    isAuthenticated,
    isCustomer,
    isDocumentOwner,
  },
  addresses: {
    supportedCountries: [{ label: "ایران", value: "IR" }],
    addressesCollectionOverride: ({ defaultCollection }) => ({
      ...defaultCollection,
      labels: { singular: "آدرس", plural: "آدرس‌ها" },
      admin: {
        ...defaultCollection.admin,
        hidden: true,
        useAsTitle: "displayLabel",
        defaultColumns: ["title", "firstName", "phone", "city", "isDefault", "updatedAt"],
      },
      fields: [
        ...defaultCollection.fields,
        { name: "displayLabel", type: "text", label: "عنوان نمایشی", index: true, admin: { hidden: true } },
        { name: "isDefault", type: "checkbox", label: "آدرس پیش‌فرض", defaultValue: false },
      ],
      hooks: {
        ...defaultCollection.hooks,
        beforeValidate: [
          ...(defaultCollection.hooks?.beforeValidate ?? []),
          setAddressDisplayLabel,
        ],
      },
    }),
  },
  carts: {
    allowGuestCarts: false,
    cartItemMatcher: nilperCartItemMatcher,
    cartsCollectionOverride: ({ defaultCollection }) => ({
      ...defaultCollection,
      admin: { ...defaultCollection.admin, hidden: true },
      fields: [
        ...defaultCollection.fields.map(withNilperCommerceItemFields).map(withCommerceValidation),
      ],
      hooks: {
        ...defaultCollection.hooks,
        beforeOperation: [
          ...(defaultCollection.hooks?.beforeOperation ?? []),
          nilperCommerceBeforeOperation("cart"),
        ],
        beforeValidate: [
          ...(defaultCollection.hooks?.beforeValidate ?? []),
          nilperCommerceItemsHook("cart"),
        ],
        beforeChange: [
          ...(defaultCollection.hooks?.beforeChange ?? []),
          ({ data }) => ({ ...data, subtotal: assertTomanAmount((data.items ?? []).reduce(
            (sum: number, item: { unitPriceInTMN: number; quantity: number }) => sum + item.unitPriceInTMN * item.quantity, 0,
          )) }),
        ],
      },
    }),
  },
  customers: { slug: "customers" },
  currencies: {
    ...NILPER_COMMERCE_CURRENCIES,
  },
  // The supplied Nilper sheets contain orderability, not stock counts. Do not invent inventory.
  inventory: false,
  orders: {
    ordersCollectionOverride: ({ defaultCollection }) => {
      const defaultFields = defaultCollection.fields
        .map(withNilperCommerceItemFields)
        .map(withCommerceValidation)
        .map(withNilperOrderStatus);
      const customerEmail = hiddenAdminField(requireField(defaultFields, "customerEmail"));
      const transactionHistory = hiddenAdminField(requireField(defaultFields, "transactions"));

      return {
        ...defaultCollection,
        labels: { singular: "سفارش", plural: "سفارش‌ها" },
        admin: {
          ...defaultCollection.admin,
          hidden: false,
          group: "فروشگاه",
          useAsTitle: "orderNumber",
          defaultColumns: ["orderNumber", "contactName", "contactPhone", "status", "amount", "createdAt"],
        },
        fields: [
          {
            type: "tabs",
            tabs: [
              {
                label: "اقلام سفارش",
                description: "محصولات، تعداد و مشخصات ثبت‌شده در زمان سفارش.",
                fields: [requireField(defaultFields, "items")],
              },
              {
                label: "مشتری و تحویل",
                fields: [
                  withoutSidebarPosition(requireField(defaultFields, "customer")),
                  {
                    type: "row",
                    fields: [
                      { name: "contactName", type: "text", label: "نام گیرنده", required: true, admin: { rtl: true, width: "50%" } },
                      { name: "contactPhone", type: "text", label: "شماره موبایل گیرنده", required: true, admin: { width: "50%" } },
                    ],
                  },
                  {
                    name: "customerAddress",
                    type: "relationship",
                    relationTo: "addresses",
                    label: "آدرس ذخیره‌شده مشتری",
                    admin: {
                      components: {
                        Field: "./src/components/payload/order-customer-address-field#OrderCustomerAddressField",
                      },
                      description: "این ارتباط خودکار است؛ جزئیات ثبت‌شده پایین، تصویر ثابت آدرس در زمان سفارش است.",
                    },
                    filterOptions: ({ siblingData }) => {
                      const customer = relationshipID((siblingData as { customer?: unknown })?.customer);
                      return customer ? { customer: { equals: customer } } : false;
                    },
                  },
                  requireField(defaultFields, "shippingAddress"),
                  {
                    name: "deliveryMethod",
                    type: "select",
                    label: "روش تحویل",
                    required: true,
                    options: [{ label: "هماهنگی تحویل و نصب توسط NPGroup", value: "advisor" }],
                  },
                ],
              },
              {
                label: "ارسال و پیگیری",
                fields: shippingSnapshotFields(true),
              },
              {
                label: "پرداخت",
                fields: [
                  {
                    type: "row",
                    fields: [
                      withoutSidebarPosition(requireField(defaultFields, "amount")),
                      withoutSidebarPosition(requireField(defaultFields, "currency")),
                    ],
                  },
                  {
                    name: "paymentMethod",
                    type: "select",
                    label: "روش پرداخت درخواستی",
                    required: true,
                    options: [
                      { label: "زرین‌پال", value: "zarinpal" },
                      { label: "فاکتور و پرداخت مرحله‌ای", value: "invoice" },
                    ],
                  },
                  {
                    name: "paymentTransaction",
                    type: "relationship",
                    relationTo: "transactions",
                    label: "تراکنش مرجع پرداخت",
                    unique: true,
                    admin: { readOnly: true },
                    access: { create: () => false, update: () => false },
                  },
                ],
              },
            ],
          },
          customerEmail,
          transactionHistory,
          requireField(defaultFields, "status"),
          {
            name: "orderNumber",
            type: "text",
            label: "شماره سفارش",
            required: true,
            unique: true,
            index: true,
            defaultValue: () => `NP-${randomUUID().replaceAll("-", "").slice(0, 10).toUpperCase()}`,
            admin: { position: "sidebar", readOnly: true },
          },
          {
            name: "sourceCart",
            type: "relationship",
            relationTo: "carts",
            label: "سبد مبدأ",
            unique: true,
            admin: { position: "sidebar", readOnly: true },
            access: { create: () => false, update: () => false },
          },
        ],
        hooks: {
          ...defaultCollection.hooks,
          beforeOperation: [
            ...(defaultCollection.hooks?.beforeOperation ?? []),
            nilperCommerceBeforeOperation("order"),
          ],
          beforeValidate: [
            ...(defaultCollection.hooks?.beforeValidate ?? []),
            linkOrderToCustomerAddress,
            nilperCommerceItemsHook("order"),
          ],
        },
      };
    },
  },
  payments: {
    paymentMethods: [zarinpalAdapter()],
  },
  products: {
    productsCollectionOverride: ({ defaultCollection }) => ({
      ...defaultCollection,
      labels: { singular: "محصول", plural: "محصولات" },
      hooks: withStorefrontRevalidation({ ...defaultCollection.hooks, beforeValidate: [...(defaultCollection.hooks?.beforeValidate ?? []), validateProduct] }, ["catalog"], "status"),
      admin: {
        ...defaultCollection.admin,
        group: "فروشگاه",
        useAsTitle: "title",
        defaultColumns: ["title", "catalogCode", "salesMode", "availabilityMode", "updatedAt"],
        description: "محصول ساده یا متغیر، ویژگی‌های قابل انتخاب و مدل‌های دستی.",
      },
      fields: productFields(defaultCollection),
    }),
    variants: {
      variantsCollectionOverride: ({ defaultCollection }) => ({
        ...defaultCollection,
        labels: { singular: "مدل محصول", plural: "مدل‌های محصول" },
        hooks: withStorefrontRevalidation({ ...defaultCollection.hooks, beforeValidate: [...(defaultCollection.hooks?.beforeValidate ?? []), validateVariant] }, ["catalog"], "status"),
        admin: {
          ...defaultCollection.admin,
          group: "فروشگاه",
          useAsTitle: "nilperCode",
          defaultColumns: ["nilperCode", "title", "product", "priceInTMN", "_status"],
          description: "هر مدل باید یک کد ثبت، قیمت یا تفاوت عملیاتی واقعی داشته باشد.",
        },
        fields: variantFields(defaultCollection),
      }),
      variantOptionsCollectionOverride: ({ defaultCollection }) => ({
        ...attributeCollection({ ...defaultCollection, hooks: withStorefrontRevalidation(defaultCollection.hooks, ["catalog"], "always") }, true),
      }),
      variantTypesCollectionOverride: ({ defaultCollection }) => ({
        ...attributeCollection({ ...defaultCollection, hooks: withStorefrontRevalidation(defaultCollection.hooks, ["catalog"], "always") }, false),
      }),
    },
  },
  transactions: {
    transactionsCollectionOverride: ({ defaultCollection }) => ({
      ...defaultCollection,
      labels: { singular: "تراکنش", plural: "تراکنش‌ها" },
      admin: {
        ...defaultCollection.admin,
        hidden: false,
        group: "فروشگاه",
        defaultColumns: ["id", "paymentMethod", "status", "amount", "customer", "createdAt"],
      },
      fields: [
        ...defaultCollection.fields.map(withNilperCommerceItemFields).map(withCommerceValidation),
        ...shippingSnapshotFields(),
      ],
      hooks: {
        ...defaultCollection.hooks,
        beforeOperation: [
          ...(defaultCollection.hooks?.beforeOperation ?? []),
          nilperCommerceBeforeOperation("transaction"),
        ],
        beforeValidate: [
          ...(defaultCollection.hooks?.beforeValidate ?? []),
          nilperCommerceItemsHook("transaction"),
        ],
      },
    }),
  },
});
