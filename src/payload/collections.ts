import path from "node:path";
import type { Access, CollectionConfig, Field } from "payload";

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
    admin: ({ req }) => hasEditorialRole(req.user),
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
      ],
    },
    { name: "active", type: "checkbox", label: "فعال", defaultValue: true },
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
  fields: [rtlText("alt", "متن جایگزین فارسی", true), { name: "captionFa", type: "textarea", label: "توضیح تصویر" }],
};

export const Brands: CollectionConfig = {
  slug: "brands",
  access: publishedContentAccess,
  labels: { singular: "برند", plural: "برندها" },
  admin: { group: "کاتالوگ", useAsTitle: "title", defaultColumns: ["title", "slug", "published"] },
  fields: [
    rtlText("title", "نام فارسی برند", true),
    { name: "slug", type: "text", label: "نامک", required: true, unique: true },
    { name: "descriptionFa", type: "textarea", label: "توضیح فارسی" },
    { name: "logo", type: "upload", relationTo: "media", label: "نشان برند" },
    { name: "published", type: "checkbox", label: "منتشرشده", defaultValue: true },
  ],
};

export const Categories: CollectionConfig = {
  slug: "categories",
  access: publishedContentAccess,
  labels: { singular: "دسته‌بندی", plural: "دسته‌بندی‌ها" },
  admin: { group: "کاتالوگ", useAsTitle: "title", defaultColumns: ["title", "parent", "sortOrder", "published"] },
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
  Media,
  Brands,
  Categories,
  ProductSeries,
  ConfigurationGroups,
  ConfigurationOptions,
];
