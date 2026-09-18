import path from "node:path";
import type { Access, CollectionConfig, Field } from "payload";

import { customerSessionStrategy } from "../features/auth/customer-session";
import { Posts } from "./posts";
import { withStorefrontRevalidation } from "./storefront-revalidation";

const rtlText = (name: string, label: string, required = false): Field => ({
  name,
  type: "text",
  label,
  required,
  admin: { rtl: true },
});

const hasEditorialRole = (user: unknown) => {
  if (!user || typeof user !== "object" || !("role" in user)) return false;
  return user.role === "admin" || user.role === "editor";
};

const hasAdminPanelRole = (user: unknown) => {
  if (!user || typeof user !== "object" || !("role" in user)) return false;
  return user.role === "admin" || user.role === "editor" || user.role === "seller";
};

const hasAdminRole = (user: unknown) => {
  if (!user || typeof user !== "object" || !("role" in user)) return false;
  return user.role === "admin";
};

const adminOnly: Access = ({ req }) => hasAdminRole(req.user);
const editorialOnly: Access = ({ req }) => hasEditorialRole(req.user);

const adminOrFirstUser: Access = async ({ req }) => {
  if (hasAdminRole(req.user)) return true;

  const users = await req.payload.find({
    collection: "users",
    depth: 0,
    limit: 0,
    overrideAccess: true,
  });

  return users.totalDocs === 0;
};

const adminOrSelf: Access = ({ req }) => {
  if (hasAdminRole(req.user)) return true;
  if (!req.user?.id) return false;
  return { id: { equals: req.user.id } };
};

const editorialContentAccess: CollectionConfig["access"] = {
  create: editorialOnly,
  delete: editorialOnly,
  read: () => true,
  update: editorialOnly,
};

const publishedContentAccess: CollectionConfig["access"] = {
  ...editorialContentAccess,
  read: ({ req }) => hasEditorialRole(req.user) || { published: { equals: true } },
};

const activeContentAccess: CollectionConfig["access"] = {
  ...editorialContentAccess,
  read: ({ req }) => hasEditorialRole(req.user) || { active: { equals: true } },
};

export const Users: CollectionConfig = {
  slug: "users",
  auth: true,
  access: {
    admin: ({ req }) => hasAdminPanelRole(req.user),
    create: adminOrFirstUser,
    delete: adminOnly,
    read: editorialOnly,
    unlock: adminOnly,
    update: adminOrSelf,
  },
  labels: { singular: "کاربر", plural: "کاربران" },
  admin: {
    group: "مدیریت",
    useAsTitle: "fullName",
    defaultColumns: ["fullName", "email", "role", "active"],
  },
  hooks: withStorefrontRevalidation(undefined, ["sales-contacts"], "always"),
  fields: [
    rtlText("fullName", "نام و نام خانوادگی", true),
    rtlText("phone", "شماره همراه"),
    {
      name: "role",
      type: "select",
      label: "نقش",
      required: true,
      defaultValue: "admin",
      options: [
        { label: "مدیر", value: "admin" },
        { label: "ویرایشگر", value: "editor" },
        { label: "فروشنده", value: "seller" },
      ],
    },
    rtlText("contactTitle", "عنوان ارتباطی"),
    { name: "contactDescription", type: "textarea", label: "توضیح کوتاه برای مشتری", admin: { rtl: true } },
    rtlText("whatsappPhone", "شماره واتساپ"),
    { name: "active", type: "checkbox", label: "فعال", defaultValue: true },
  ],
};

const editorialOrCustomerSelf: Access = ({ req }) => {
  if (hasEditorialRole(req.user)) return true;
  if (req.user?.collection !== "customers" || !req.user.id) return false;
  return { id: { equals: req.user.id } };
};

export const Customers: CollectionConfig = {
  slug: "customers",
  auth: {
    disableLocalStrategy: true,
    strategies: [customerSessionStrategy],
  },
  access: {
    admin: ({ req }) => hasEditorialRole(req.user),
    create: editorialOnly,
    delete: () => false,
    read: editorialOrCustomerSelf,
    update: editorialOrCustomerSelf,
  },
  labels: { singular: "مشتری", plural: "مشتریان" },
  admin: {
    group: "فروشگاه",
    useAsTitle: "fullName",
    defaultColumns: ["fullName", "phone", "active", "updatedAt"],
  },
  fields: [
    {
      type: "tabs",
      tabs: [
        {
          label: "اطلاعات مشتری",
          fields: [
            rtlText("fullName", "نام و نام خانوادگی"),
            {
              name: "phone",
              type: "text",
              label: "شماره همراه تأییدشده",
              required: true,
              unique: true,
              index: true,
              admin: { readOnly: true },
            },
            { name: "active", type: "checkbox", label: "فعال", defaultValue: true },
          ],
        },
        {
          label: "آدرس‌ها",
          fields: [
            {
              name: "addresses",
              type: "join",
              collection: "addresses",
              on: "customer",
              label: "آدرس‌های مشتری",
              defaultSort: "-isDefault",
              admin: {
                defaultColumns: ["title", "firstName", "phone", "city", "isDefault", "updatedAt"],
              },
            },
          ],
        },
        {
          label: "سفارش‌ها",
          fields: [
            {
              name: "orders",
              type: "join",
              collection: "orders",
              on: "customer",
              label: "سفارش‌های مشتری",
              defaultSort: "-createdAt",
              admin: {
                allowCreate: false,
                defaultColumns: ["orderNumber", "status", "amount", "createdAt"],
              },
            },
          ],
        },
      ],
    },
  ],
};

const privateAuthCollectionAccess: CollectionConfig["access"] = {
  admin: () => false,
  create: adminOnly,
  delete: adminOnly,
  read: adminOnly,
  update: adminOnly,
};

export const CustomerOtpChallenges: CollectionConfig = {
  slug: "customer-otp-challenges",
  access: privateAuthCollectionAccess,
  admin: { hidden: true },
  fields: [
    { name: "phoneKey", type: "text", required: true, index: true },
    { name: "requestIpKey", type: "text", required: true, index: true },
    { name: "codeHash", type: "text", required: true, admin: { hidden: true } },
    { name: "codeSalt", type: "text", required: true, admin: { hidden: true } },
    { name: "expiresAt", type: "date", required: true, index: true },
    { name: "attempts", type: "number", required: true, defaultValue: 0, min: 0, max: 5 },
    {
      name: "deliveryState",
      type: "select",
      required: true,
      options: ["pending", "delivered", "failed"],
    },
    { name: "providerMessageId", type: "text" },
    { name: "consumedAt", type: "date", index: true },
  ],
};

export const CustomerSessions: CollectionConfig = {
  slug: "customer-sessions",
  access: privateAuthCollectionAccess,
  admin: { hidden: true },
  fields: [
    { name: "customer", type: "relationship", relationTo: "customers", required: true, index: true },
    { name: "tokenHash", type: "text", required: true, unique: true, index: true, admin: { hidden: true } },
    { name: "challengeKey", type: "text", required: true, unique: true, index: true, admin: { hidden: true } },
    { name: "expiresAt", type: "date", required: true, index: true },
    { name: "revokedAt", type: "date", index: true },
  ],
};

export const Media: CollectionConfig = {
  slug: "media",
  upload: {
    staticDir: path.resolve(process.cwd(), "media"),
    mimeTypes: ["image/*"],
    imageSizes: [
      { name: "adminThumbnail", width: 320, height: 240, fit: "cover" },
    ],
    adminThumbnail: "adminThumbnail",
  },
  access: editorialContentAccess,
  labels: { singular: "رسانه", plural: "رسانه‌ها" },
  admin: { group: "محتوا", useAsTitle: "alt", defaultColumns: ["alt", "filename", "updatedAt"] },
  hooks: withStorefrontRevalidation(undefined, ["catalog", "journal", "showcase"], "always"),
  fields: [rtlText("alt", "متن جایگزین فارسی", true), { name: "captionFa", type: "textarea", label: "توضیح تصویر" }],
};

export const BlogCategories: CollectionConfig = {
  slug: "blog-categories",
  access: publishedContentAccess,
  labels: { singular: "دسته‌بندی مجله", plural: "دسته‌بندی‌های مجله" },
  admin: {
    group: "مجله",
    useAsTitle: "title",
    defaultColumns: ["title", "slug", "sortOrder", "published", "updatedAt"],
    description: "دسته‌بندی‌های تحریریه برای گروه‌بندی و فیلتر مطالب مجله.",
  },
  defaultSort: "sortOrder",
  hooks: withStorefrontRevalidation(undefined, ["journal"], "published"),
  fields: [
    rtlText("title", "عنوان دسته‌بندی", true),
    {
      name: "slug",
      type: "text",
      label: "نامک انگلیسی",
      required: true,
      unique: true,
      index: true,
      validate: (value: unknown) => typeof value === "string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)
        ? true
        : "نامک فقط با حروف کوچک انگلیسی، عدد و خط تیره نوشته شود.",
    },
    { name: "description", type: "textarea", label: "توضیح کوتاه", admin: { rtl: true } },
    { name: "sortOrder", type: "number", label: "ترتیب نمایش", defaultValue: 0 },
    { name: "published", type: "checkbox", label: "فعال", defaultValue: true },
    {
      name: "posts",
      type: "join",
      collection: "posts",
      on: "category",
      label: "مطالب این دسته‌بندی",
      defaultSort: "-publishedAt",
      admin: {
        allowCreate: false,
        defaultColumns: ["title", "_status", "publishedAt", "updatedAt"],
      },
    },
  ],
};

export const Brands: CollectionConfig = {
  slug: "brands",
  access: publishedContentAccess,
  labels: { singular: "برند", plural: "برندها" },
  admin: { group: "کاتالوگ", useAsTitle: "title", defaultColumns: ["title", "slug", "published"] },
  hooks: withStorefrontRevalidation(undefined, ["catalog", "showcase"], "published"),
  fields: [
    rtlText("title", "نام فارسی برند", true),
    { name: "slug", type: "text", label: "نامک", required: true, unique: true },
    { name: "descriptionFa", type: "textarea", label: "توضیح فارسی" },
    rtlText("taglineFa", "تیتر معرفی"),
    { name: "storyFa", type: "textarea", label: "داستان و معرفی کامل", admin: { rtl: true } },
    { name: "logo", type: "upload", relationTo: "media", label: "نشان برند" },
    { name: "heroMedia", type: "upload", relationTo: "media", label: "تصویر اصلی صفحه برند" },
    rtlText("heroAlt", "متن جایگزین تصویر"),
    rtlText("heroCaption", "توضیح زیر تصویر"),
    { name: "featured", type: "checkbox", label: "برند منتخب", defaultValue: false },
    { name: "sortOrder", type: "number", label: "ترتیب نمایش", defaultValue: 0 },
    { name: "published", type: "checkbox", label: "منتشرشده", defaultValue: true },
  ],
};

export const Projects: CollectionConfig = {
  slug: "projects",
  access: publishedContentAccess,
  labels: { singular: "پروژه", plural: "پروژه‌ها" },
  admin: {
    group: "محتوا",
    useAsTitle: "title",
    defaultColumns: ["title", "sector", "featured", "published", "updatedAt"],
  },
  hooks: withStorefrontRevalidation(undefined, ["showcase"], "published"),
  fields: [
    {
      type: "tabs",
      tabs: [
        {
          label: "معرفی",
          fields: [
            rtlText("title", "عنوان پروژه", true),
            { name: "slug", type: "text", label: "نامک", required: true, unique: true, index: true },
            {
              name: "sector",
              type: "select",
              label: "نوع فضا",
              required: true,
              options: [
                { label: "مسکونی", value: "residential" },
                { label: "هتلداری", value: "hospitality" },
                { label: "تجاری و رستوران", value: "commercial" },
                { label: "فضای کاری", value: "workplace" },
                { label: "درمانی", value: "healthcare" },
              ],
            },
            { name: "descriptionFa", type: "textarea", label: "توضیح کوتاه", required: true, admin: { rtl: true } },
            { name: "briefFa", type: "textarea", label: "شرح پروژه", required: true, admin: { rtl: true } },
          ],
        },
        {
          label: "تصاویر",
          fields: [
            { name: "heroMedia", type: "upload", relationTo: "media", label: "تصویر اصلی" },
            rtlText("heroAlt", "متن جایگزین تصویر اصلی"),
            rtlText("heroCaption", "توضیح تصویر اصلی"),
            {
              name: "gallery",
              type: "array",
              label: "گالری",
              labels: { singular: "تصویر", plural: "تصاویر" },
              fields: [
                { name: "image", type: "upload", relationTo: "media", label: "تصویر" },
                rtlText("alt", "متن جایگزین"),
                rtlText("caption", "توضیح تصویر"),
              ],
            },
          ],
        },
        {
          label: "رویکرد و پالت",
          fields: [
            {
              name: "approach",
              type: "array",
              label: "مراحل و رویکرد",
              fields: [
                rtlText("title", "عنوان", true),
                { name: "text", type: "textarea", label: "توضیح", required: true, admin: { rtl: true } },
              ],
            },
            {
              name: "palette",
              type: "array",
              label: "پالت رنگ و متریال",
              fields: [
                rtlText("name", "نام", true),
                { name: "color", type: "text", label: "رنگ HEX", required: true },
              ],
            },
          ],
        },
        {
          label: "ارتباط‌ها و انتشار",
          fields: [
            { name: "products", type: "relationship", relationTo: "products", hasMany: true, label: "محصولات پیشنهادی" },
            { name: "article", type: "relationship", relationTo: "posts", label: "مطلب مرتبط" },
            { name: "featured", type: "checkbox", label: "پروژه منتخب", defaultValue: false },
            { name: "sortOrder", type: "number", label: "ترتیب نمایش", defaultValue: 0 },
            { name: "published", type: "checkbox", label: "منتشرشده", defaultValue: true },
          ],
        },
      ],
    },
  ],
};

export const Categories: CollectionConfig = {
  slug: "categories",
  access: publishedContentAccess,
  labels: { singular: "دسته‌بندی", plural: "دسته‌بندی‌ها" },
  admin: { group: "کاتالوگ", useAsTitle: "title", defaultColumns: ["title", "parent", "sortOrder", "published"] },
  hooks: withStorefrontRevalidation(undefined, ["catalog"], "published"),
  fields: [
    rtlText("title", "عنوان فارسی", true),
    { name: "slug", type: "text", label: "نامک", required: true, unique: true },
    { name: "parent", type: "relationship", relationTo: "categories", label: "دسته والد" },
    { name: "image", type: "upload", relationTo: "media", label: "تصویر" },
    { name: "descriptionFa", type: "textarea", label: "توضیح فارسی" },
    { name: "sortOrder", type: "number", label: "ترتیب نمایش", defaultValue: 0 },
    { name: "published", type: "checkbox", label: "منتشرشده", defaultValue: true },
  ],
};

export const ProductSeries: CollectionConfig = {
  slug: "product-series",
  access: publishedContentAccess,
  labels: { singular: "سری محصول", plural: "سری‌های محصول" },
  admin: { group: "کاتالوگ", useAsTitle: "title", defaultColumns: ["title", "styleFa", "slug"] },
  hooks: withStorefrontRevalidation(undefined, ["catalog"], "published"),
  fields: [
    rtlText("title", "نام فارسی سری", true),
    { name: "slug", type: "text", label: "نامک", required: true, unique: true },
    rtlText("styleFa", "سبک طراحی"),
    { name: "descriptionFa", type: "textarea", label: "توضیح فارسی" },
    { name: "heroMedia", type: "upload", relationTo: "media", label: "تصویر اصلی" },
    { name: "published", type: "checkbox", label: "منتشرشده", defaultValue: true },
  ],
};

export const ConfigurationGroups: CollectionConfig = {
  slug: "configuration-groups",
  access: activeContentAccess,
  labels: { singular: "گروه پیکربندی", plural: "گروه‌های پیکربندی" },
  admin: { group: "پیکربندی محصول", useAsTitle: "title", defaultColumns: ["title", "key", "inputType", "required"] },
  hooks: withStorefrontRevalidation(undefined, ["catalog"], "active"),
  fields: [
    rtlText("title", "عنوان فارسی", true),
    { name: "key", type: "text", label: "کلید پایدار", required: true, unique: true },
    {
      name: "inputType",
      type: "select",
      label: "نوع کنترل",
      required: true,
      options: [
        { label: "نمونه رنگ", value: "swatch" },
        { label: "فهرست انتخاب", value: "select" },
        { label: "گزینه‌ای", value: "radio" },
      ],
    },
    { name: "required", type: "checkbox", label: "انتخاب اجباری", defaultValue: true },
    { name: "active", type: "checkbox", label: "فعال", defaultValue: true },
    { name: "helpTextFa", type: "textarea", label: "راهنمای فارسی" },
    {
      name: "options",
      type: "join",
      collection: "configuration-options",
      on: "group",
      label: "گزینه‌ها",
      orderable: true,
    },
  ],
};

export const ConfigurationOptions: CollectionConfig = {
  slug: "configuration-options",
  access: activeContentAccess,
  labels: { singular: "گزینه پیکربندی", plural: "گزینه‌های پیکربندی" },
  admin: { group: "پیکربندی محصول", useAsTitle: "title", defaultColumns: ["title", "group", "code", "active", "sortOrder"] },
  hooks: withStorefrontRevalidation(undefined, ["catalog"], "active"),
  fields: [
    { name: "group", type: "relationship", relationTo: "configuration-groups", label: "گروه", required: true },
    rtlText("title", "عنوان فارسی / نام کالیته", true),
    { name: "code", type: "text", label: "کد داخلی" },
    { name: "swatchColor", type: "text", label: "رنگ نمونه (HEX)" },
    { name: "swatchMedia", type: "upload", relationTo: "media", label: "تصویر نمونه" },
    { name: "active", type: "checkbox", label: "فعال", defaultValue: true },
    { name: "sortOrder", type: "number", label: "ترتیب نمایش", defaultValue: 0 },
  ],
};

export const collections: CollectionConfig[] = [
  Users,
  Customers,
  CustomerOtpChallenges,
  CustomerSessions,
  Media,
  BlogCategories,
  Posts,
  Brands,
  Projects,
  Categories,
  ProductSeries,
  ConfigurationGroups,
  ConfigurationOptions,
];
