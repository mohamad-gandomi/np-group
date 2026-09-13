import {
  EXPERIMENTAL_TableFeature,
  FixedToolbarFeature,
  HeadingFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from "@payloadcms/richtext-lexical";
import type { CollectionBeforeChangeHook, CollectionConfig } from "payload";

import { adminOrPublishedStatus, isAdmin } from "./access";
import { journalReadingStats } from "../features/journal/content";
import type { JournalRichText } from "../features/journal/types";

const calculateReadingStats: CollectionBeforeChangeHook = ({ data, originalDoc }) => {
  const content = (data.content ?? originalDoc?.content) as JournalRichText | undefined;
  const stats = journalReadingStats(content);
  const publishing = data._status === "published";

  return {
    ...data,
    ...stats,
    publishedAt: publishing && !data.publishedAt && !originalDoc?.publishedAt
      ? new Date().toISOString()
      : data.publishedAt,
  };
};

export const Posts: CollectionConfig = {
  slug: "posts",
  labels: { singular: "مطلب", plural: "مطالب مجله" },
  access: {
    create: isAdmin,
    delete: isAdmin,
    read: adminOrPublishedStatus,
    update: isAdmin,
  },
  admin: {
    group: "محتوا",
    useAsTitle: "title",
    defaultColumns: ["title", "category", "_status", "publishedAt", "updatedAt"],
    description: "عنوان صفحه از فیلد «عنوان» می‌آید؛ داخل متن از تیتر ۲ تا ۴ استفاده کنید. فهرست مطلب و زمان مطالعه خودکار ساخته می‌شوند.",
  },
  defaultSort: "-publishedAt",
  hooks: { beforeChange: [calculateReadingStats] },
  versions: {
    drafts: { autosave: true },
    maxPerDoc: 30,
  },
  fields: [
    {
      type: "tabs",
      tabs: [
        {
          label: "محتوا",
          fields: [
            { name: "title", type: "text", label: "عنوان اصلی (H1)", required: true, admin: { rtl: true } },
            {
              name: "slug",
              type: "text",
              label: "نامک انگلیسی URL",
              required: true,
              unique: true,
              index: true,
              admin: { description: "مثال: choosing-sofa-dimensions — بعد از انتشار تغییر ندهید." },
              validate: (value: unknown) => typeof value === "string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)
                ? true
                : "نامک فقط با حروف کوچک انگلیسی، عدد و خط تیره نوشته شود.",
            },
            {
              name: "category",
              type: "select",
              label: "موضوع",
              required: true,
              options: [
                { label: "راهنمای انتخاب", value: "planning" },
                { label: "بافت و متریال", value: "materials" },
                { label: "نور و فضا", value: "lighting" },
                { label: "هنر زندگی", value: "living" },
              ],
            },
            { name: "description", type: "textarea", label: "خلاصه کارت و مقدمه نتایج", required: true, maxLength: 240, admin: { rtl: true } },
            { name: "summary", type: "textarea", label: "پاسخ سریع یک‌دقیقه‌ای", required: true, admin: { rtl: true, description: "پاسخ مستقیم و مستقل به پرسش اصلی مطلب؛ در صفحه نیز دیده می‌شود." } },
            { name: "heroImage", type: "upload", relationTo: "media", label: "تصویر شاخص", required: true },
            { name: "heroCaption", type: "textarea", label: "توضیح زیر تصویر شاخص", admin: { rtl: true } },
            {
              name: "content",
              type: "richText",
              label: "متن مطلب",
              required: true,
              admin: { description: "برای بخش‌های اصلی H2 بگذارید؛ فهرست خودکار از H2ها ساخته می‌شود. H3 و H4 برای زیربخش‌ها هستند." },
              editor: lexicalEditor({
                features: ({ defaultFeatures }) => [
                  ...defaultFeatures.filter((feature) => feature.key !== "heading" && feature.key !== "fixedToolbar" && feature.key !== "inlineToolbar"),
                  HeadingFeature({ enabledHeadingSizes: ["h2", "h3", "h4"] }),
                  EXPERIMENTAL_TableFeature(),
                  FixedToolbarFeature(),
                  InlineToolbarFeature(),
                ],
              }),
            },
            { name: "takeaway", type: "textarea", label: "جمع‌بندی پایانی", required: true, admin: { rtl: true } },
            {
              name: "callToAction",
              type: "group",
              label: "دعوت به اقدام",
              fields: [
                { name: "label", type: "text", label: "متن دکمه", required: true, defaultValue: "دیدن محصولات", admin: { rtl: true } },
                { name: "href", type: "text", label: "نشانی داخلی", required: true, defaultValue: "/shop", admin: { description: "مثال: /shop یا /contact" } },
              ],
            },
            { name: "relatedPosts", type: "relationship", relationTo: "posts", label: "مطالب مرتبط", hasMany: true, maxRows: 3 },
          ],
        },
        {
          label: "اعتماد و SEO",
          fields: [
            {
              type: "row",
              fields: [
                { name: "authorName", type: "text", label: "نام نویسنده", required: true, defaultValue: "تحریریه ان‌پی", admin: { rtl: true, width: "50%" } },
                { name: "authorUrl", type: "text", label: "صفحه نویسنده", defaultValue: "/about", admin: { width: "50%" } },
              ],
            },
            { name: "authorBio", type: "textarea", label: "معرفی کوتاه نویسنده", admin: { rtl: true } },
            {
              name: "seo",
              type: "group",
              label: "نمایش در جست‌وجو و شبکه‌های اجتماعی",
              fields: [
                { name: "title", type: "text", label: "عنوان SEO (اختیاری)", maxLength: 70, admin: { rtl: true, description: "اگر خالی باشد، عنوان اصلی استفاده می‌شود." } },
                { name: "description", type: "textarea", label: "توضیح SEO (اختیاری)", maxLength: 170, admin: { rtl: true, description: "اگر خالی باشد، خلاصه کارت استفاده می‌شود." } },
                { name: "socialImage", type: "upload", relationTo: "media", label: "تصویر اشتراک‌گذاری (اختیاری)" },
                { name: "primaryTopic", type: "text", label: "موضوع/پرسش اصلی مطلب", admin: { rtl: true, description: "برای تمرکز تحریریه است؛ به‌عنوان meta keywords منتشر نمی‌شود." } },
                { name: "noIndex", type: "checkbox", label: "جلوگیری از ایندکس", defaultValue: false, admin: { description: "فقط برای مطالبی که نباید در نتایج جست‌وجو دیده شوند." } },
              ],
            },
          ],
        },
        {
          label: "انتشار",
          fields: [
            { name: "publishedAt", type: "date", label: "زمان انتشار", index: true, admin: { date: { pickerAppearance: "dayAndTime" }, description: "در اولین انتشار، اگر خالی باشد خودکار ثبت می‌شود." } },
            { name: "featured", type: "checkbox", label: "مطلب منتخب مجله", defaultValue: false },
            { name: "sortOrder", type: "number", label: "اولویت نمایش", defaultValue: 0 },
            {
              type: "row",
              fields: [
                { name: "wordCount", type: "number", label: "تعداد کلمات (خودکار)", defaultValue: 0, admin: { readOnly: true, width: "50%" } },
                { name: "readingTimeMinutes", type: "number", label: "زمان مطالعه، دقیقه (خودکار)", defaultValue: 1, admin: { readOnly: true, width: "50%" } },
              ],
            },
          ],
        },
      ],
    },
  ],
};
