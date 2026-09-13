import { ecommercePlugin } from "@payloadcms/plugin-ecommerce";
import type { CollectionConfig, Field } from "payload";
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
import { measurementsField, sourceFields, technicalSpecsField } from "./domain-fields";
import { NILPER_COMMERCE_CURRENCIES, validateCommerceQuantity, validateTomanAmount } from "./money";
import { zarinpalAdapter } from "@/features/payments/zarinpal/adapter";

const fieldNamed = (field: Field, name: string) => "name" in field && field.name === name;

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
            { name: "brand", type: "relationship", relationTo: "brands", label: "برند", required: true },
            { name: "categories", type: "relationship", relationTo: "categories", hasMany: true, label: "دسته‌بندی‌ها", required: true },
            { name: "series", type: "relationship", relationTo: "product-series", label: "سری محصول" },
          ],
        },
        {
          label: "فروش",
          fields: [
            {
              name: "salesMode",
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
                { name: "image", type: "upload", relationTo: "media", label: "تصویر", required: true },
                { name: "captionFa", type: "text", label: "توضیح فارسی", admin: { rtl: true } },
              ],
            },
          ],
        },
        {
          label: "اطلاعات محصول",
          fields: [
            { name: "descriptionFa", type: "richText", label: "معرفی فارسی محصول", required: true },
            measurementsField("فقط اندازه‌های مشترک همه گونه‌ها؛ اندازه متفاوت هر کد ثبت در خود گونه نگهداری می‌شود."),
            technicalSpecsField(),
            { name: "orderNotesFa", type: "textarea", label: "ملاحظات سفارش‌گیری" },
            { name: "leadTimeFa", type: "text", label: "زمان آماده‌سازی", admin: { rtl: true } },
          ],
        },
        {
          label: "گونه‌ها و پیکربندی",
          description: "گونه فقط برای کد ثبت/شناسه عملیاتی است؛ رنگ چوب و پارچه در پیکربندی نگهداری می‌شوند.",
          fields: [
            { name: "configurationGroups", type: "relationship", relationTo: "configuration-groups", hasMany: true, label: "گروه‌های پیکربندی" },
            { name: "relatedProducts", type: "relationship", relationTo: "products", hasMany: true, label: "محصولات مرتبط" },
            {
              name: "matchingProducts",
              type: "relationship",
              relationTo: "products",
              hasMany: true,
              label: "محصولات ست / هماهنگ",
              admin: { description: "رابطه صریح درج‌شده در منبع؛ از پیشنهاد عمومی «محصولات مرتبط» جدا است." },
            },
            ...[variantField("enableVariants"), variantField("variantTypes"), variantField("variants")].filter((field): field is Field => Boolean(field)),
          ],
        },
        {
          label: "منبع داده",
          fields: sourceFields(),
        },
      ],
    },
  ];
};

const variantFields = (defaultCollection: CollectionConfig): Field[] => {
  const defaults = defaultCollection.fields;
  const take = (name: string) => defaults.find((field) => fieldNamed(field, name));
  const priceFields = defaults
    .filter((field) => !("name" in field) || !field.name)
    .map(withCommerceValidation);
  return [
    take("product")!,
    { name: "nilperCode", type: "text", label: "کد ثبت نیلپر / SKU", required: true, unique: true },
    take("title")!,
    take("options")!,
    shippingModeField(),
    ...parcelFields(),
    ...priceFields,
    measurementsField("فقط اختلاف فیزیکی این کد ثبت، مانند فرم نشیمن، ابعاد، وزن یا متراژ پارچه."),
    { name: "manufacturingNotesFa", type: "textarea", label: "یادداشت ساخت / سفارش" },
    ...sourceFields(),
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
        hidden: false,
        group: "فروشگاه",
        defaultColumns: ["title", "firstName", "phone", "city", "isDefault", "updatedAt"],
      },
      fields: [
        ...defaultCollection.fields,
        { name: "isDefault", type: "checkbox", label: "آدرس پیش‌فرض", defaultValue: false },
      ],
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
    ordersCollectionOverride: ({ defaultCollection }) => ({
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
        ...defaultCollection.fields
          .map(withNilperCommerceItemFields)
          .map(withCommerceValidation)
          .map(withNilperOrderStatus),
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
        {
          name: "paymentTransaction",
          type: "relationship",
          relationTo: "transactions",
          label: "تراکنش پرداخت",
          unique: true,
          admin: { position: "sidebar", readOnly: true },
          access: { create: () => false, update: () => false },
        },
        { name: "contactName", type: "text", label: "نام مشتری", required: true, admin: { rtl: true } },
        { name: "contactPhone", type: "text", label: "شماره موبایل", required: true, admin: { position: "sidebar" } },
        {
          name: "deliveryMethod",
          type: "select",
          label: "روش تحویل",
          required: true,
          options: [{ label: "هماهنگی تحویل و نصب توسط NPGroup", value: "advisor" }],
        },
        ...shippingSnapshotFields(true),
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
      ],
      hooks: {
        ...defaultCollection.hooks,
        beforeOperation: [
          ...(defaultCollection.hooks?.beforeOperation ?? []),
          nilperCommerceBeforeOperation("order"),
        ],
        beforeValidate: [
          ...(defaultCollection.hooks?.beforeValidate ?? []),
          nilperCommerceItemsHook("order"),
        ],
      },
    }),
  },
  payments: {
    paymentMethods: [zarinpalAdapter()],
  },
  products: {
    productsCollectionOverride: ({ defaultCollection }) => ({
      ...defaultCollection,
      labels: { singular: "محصول", plural: "محصولات" },
      admin: {
        ...defaultCollection.admin,
        group: "فروشگاه",
        useAsTitle: "title",
        defaultColumns: ["title", "catalogCode", "salesMode", "availabilityMode", "updatedAt"],
        description: "پیش‌نمایش مدیریت محصول نیلپر؛ گونه‌های SKU از انتخاب‌های پارچه و رنگ چوب جدا هستند.",
      },
      fields: productFields(defaultCollection),
    }),
    variants: {
      variantsCollectionOverride: ({ defaultCollection }) => ({
        ...defaultCollection,
        labels: { singular: "گونه / کد ثبت", plural: "گونه‌ها / کدهای ثبت" },
        admin: {
          ...defaultCollection.admin,
          group: "فروشگاه",
          useAsTitle: "nilperCode",
          defaultColumns: ["nilperCode", "title", "product", "priceInTMN", "_status"],
          description: "هر گونه باید یک کد ثبت، قیمت یا تفاوت عملیاتی واقعی داشته باشد.",
        },
        fields: variantFields(defaultCollection),
      }),
      variantOptionsCollectionOverride: ({ defaultCollection }) => ({
        ...defaultCollection,
        labels: { singular: "گزینه گونه", plural: "گزینه‌های گونه" },
      }),
      variantTypesCollectionOverride: ({ defaultCollection }) => ({
        ...defaultCollection,
        labels: { singular: "نوع گونه", plural: "انواع گونه" },
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
