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
import {
  nilperCartItemMatcher,
  nilperCommerceBeforeOperation,
  nilperCommerceItemsHook,
  withNilperCommerceItemFields,
} from "./cart-configuration";
import { measurementsField, sourceFields, technicalSpecsField } from "./domain-fields";
import { NILPER_COMMERCE_CURRENCIES, validateCommerceQuantity, validateTomanAmount } from "./money";

const fieldNamed = (field: Field, name: string) => "name" in field && field.name === name;

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

  if (field.type === "number" && ["priceInTMN", "unitPriceInTMN", "amount", "subtotal"].some((name) => fieldNamed(field, name))) {
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
    addressesCollectionOverride: ({ defaultCollection }) => ({
      ...defaultCollection,
      admin: { ...defaultCollection.admin, hidden: true },
    }),
  },
  carts: {
    allowGuestCarts: false,
    cartItemMatcher: nilperCartItemMatcher,
    cartsCollectionOverride: ({ defaultCollection }) => ({
      ...defaultCollection,
      admin: { ...defaultCollection.admin, hidden: true },
      fields: defaultCollection.fields.map(withNilperCommerceItemFields).map(withCommerceValidation),
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
  customers: { slug: "users" },
  currencies: {
    ...NILPER_COMMERCE_CURRENCIES,
  },
  // The supplied Nilper sheets contain orderability, not stock counts. Do not invent inventory.
  inventory: false,
  orders: {
    ordersCollectionOverride: ({ defaultCollection }) => ({
      ...defaultCollection,
      admin: { ...defaultCollection.admin, hidden: true },
      fields: defaultCollection.fields.map(withNilperCommerceItemFields).map(withCommerceValidation),
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
      fields: defaultCollection.fields.map(withNilperCommerceItemFields).map(withCommerceValidation),
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
