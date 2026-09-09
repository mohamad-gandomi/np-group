import { ecommercePlugin } from "@payloadcms/plugin-ecommerce";
import type { CollectionConfig, Field } from "payload";

import {
  adminOnlyFieldAccess,
  adminOrPublishedStatus,
  isAdmin,
  isAuthenticated,
  isCustomer,
  isDocumentOwner,
} from "./access";

const fieldNamed = (field: Field, name: string) => "name" in field && field.name === name;

const productFields = (defaultCollection: CollectionConfig): Field[] => {
  const defaults = defaultCollection.fields;
  const variantField = (name: string) => defaults.find((field) => fieldNamed(field, name));
  const priceFields = defaults.filter((field) => !("name" in field) || !field.name);

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
            {
              name: "dimensions",
              type: "group",
              label: "ابعاد و اندازه‌ها",
              fields: [
                { name: "summaryFa", type: "textarea", label: "خلاصه ابعاد" },
                { name: "weightKg", type: "number", label: "وزن (کیلوگرم)" },
              ],
            },
            {
              name: "technicalSpecs",
              type: "array",
              label: "مشخصات فنی",
              labels: { singular: "مشخصه", plural: "مشخصات" },
              fields: [
                { name: "key", type: "text", label: "کلید", required: true },
                { name: "labelFa", type: "text", label: "عنوان فارسی", required: true, admin: { rtl: true } },
                { name: "valueFa", type: "textarea", label: "مقدار فارسی", required: true },
                {
                  name: "group",
                  type: "select",
                  label: "گروه",
                  options: [
                    { label: "ساخت", value: "construction" },
                    { label: "راحتی", value: "comfort" },
                    { label: "تحویل", value: "delivery" },
                  ],
                },
                { name: "sortOrder", type: "number", label: "ترتیب", defaultValue: 0 },
              ],
            },
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
            ...[variantField("enableVariants"), variantField("variantTypes"), variantField("variants")].filter((field): field is Field => Boolean(field)),
          ],
        },
        {
          label: "منبع داده",
          fields: [
            {
              name: "sourceMetadata",
              type: "group",
              label: "ردیابی منبع",
              fields: [
                { name: "file", type: "text", label: "فایل منبع", required: true },
                { name: "sheet", type: "text", label: "برگه منبع", required: true },
                { name: "catalogCodeRaw", type: "text", label: "کد خام کاتالوگ" },
                { name: "dataQualityNotes", type: "textarea", label: "یادداشت کیفیت داده" },
              ],
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
  const priceFields = defaults.filter((field) => !("name" in field) || !field.name);
  return [
    take("product")!,
    { name: "nilperCode", type: "text", label: "کد ثبت نیلپر / SKU", required: true, unique: true },
    take("title")!,
    take("options")!,
    ...priceFields,
    {
      name: "dimensions",
      type: "group",
      label: "ابعاد این گونه",
      fields: [
        { name: "seatHeightCm", type: "number", label: "ارتفاع نشیمن (cm)" },
        { name: "seatWidthCm", type: "number", label: "عرض نشیمن هر نفر (cm)" },
        { name: "seatDepthCm", type: "number", label: "عمق نشیمن (cm)" },
        { name: "fabricMeters", type: "number", label: "متراژ پارچه تک‌رنگ بدون کوسن" },
      ],
    },
    { name: "manufacturingNotesFa", type: "textarea", label: "یادداشت ساخت / سفارش" },
    { name: "sourceCodeRaw", type: "text", label: "کد ثبت عیناً از منبع", required: true },
    { name: "dataQualityNotes", type: "textarea", label: "یادداشت کیفیت داده" },
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
    addressesCollectionOverride: ({ defaultCollection }) => ({
      ...defaultCollection,
      admin: { ...defaultCollection.admin, hidden: true },
    }),
  },
  carts: {
    allowGuestCarts: false,
    cartsCollectionOverride: ({ defaultCollection }) => ({
      ...defaultCollection,
      admin: { ...defaultCollection.admin, hidden: true },
    }),
  },
  customers: { slug: "users" },
  currencies: {
    defaultCurrency: "TMN",
    supportedCurrencies: [{ code: "TMN", decimals: 0, label: "تومان (پیش‌نمایش)", symbol: "تومان", symbolDisplay: "symbol" }],
  },
  inventory: false,
  orders: {
    ordersCollectionOverride: ({ defaultCollection }) => ({
      ...defaultCollection,
      admin: { ...defaultCollection.admin, hidden: true },
    }),
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
      admin: { ...defaultCollection.admin, hidden: true },
    }),
  },
});
