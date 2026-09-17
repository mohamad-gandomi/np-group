import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { fa } from "@payloadcms/translations/languages/fa";
import path from "node:path";
import { buildConfig } from "payload";
import sharp from "sharp";

import { ecommerce } from "./src/payload/commerce";
import { collections } from "./src/payload/collections";
import {
  cleanupDataTransferFilesTask,
  dataTransferPlugin,
  isStrictAdminUser,
} from "./src/payload/data-transfer";
import { canRunPayloadJobs } from "./src/payload/jobs-access";

const nilperFa = {
  ...fa,
  translations: {
    ...fa.translations,
    general: {
      ...fa.translations.general,
      column: "ستون",
      columns: "ستون‌ها",
      row: "سطر",
      rows: "سطرها",
    },
    "plugin-import-export": {
      allLocales: "همه زبان‌ها",
      collectionRequired: "برای نمایش پیش‌نمایش، نوع داده را انتخاب کنید.",
      documentsToExport: "{{count}} رکورد برای خروجی",
      documentsToImport: "{{count}} رکورد برای ورود",
      exportDocumentLabel: "خروجی {{label}}",
      exportOptions: "تنظیمات خروجی",
      "field-collectionSlug-label": "نوع داده",
      "field-depth-label": "عمق",
      "field-drafts-label": "شامل پیش‌نویس‌ها",
      "field-fields-label": "فیلدها",
      "field-format-label": "فرمت خروجی",
      "field-importMode-create-label": "فقط ایجاد رکوردهای جدید",
      "field-importMode-label": "روش ورود",
      "field-importMode-update-label": "فقط به‌روزرسانی رکوردهای موجود",
      "field-importMode-upsert-label": "ایجاد یا به‌روزرسانی",
      "field-limit-label": "حداکثر تعداد",
      "field-locale-label": "زبان",
      "field-matchField-description": "فیلد پایدار برای پیدا کردن رکورد موجود؛ مانند slug یا nilperCode.",
      "field-matchField-label": "کلید تطبیق",
      "field-name-label": "نام فایل",
      "field-page-label": "صفحه",
      "field-selectionToUse-label": "محدوده خروجی",
      "field-sort-label": "مرتب‌سازی بر اساس",
      "field-sort-order-label": "جهت مرتب‌سازی",
      "field-status-label": "وضعیت",
      "field-summary-label": "نتیجه ورود",
      importDocumentLabel: "ورود {{label}}",
      importResults: "نتیجه ورود",
      limitCapped: "حداکثر مجاز {{limit}} رکورد است.",
      limitExceededExport: "خروجی به {{limit}} رکورد محدود شد.",
      limitExceededImport: "فایل {{count}} رکورد دارد، اما حداکثر مجاز {{limit}} است.",
      matchBy: "تطبیق با",
      mode: "روش",
      noDataToPreview: "داده‌ای برای پیش‌نمایش وجود ندارد.",
      previewPageInfo: "{{start}} تا {{end}} از {{total}}",
      "selectionToUse-allDocuments": "همه رکوردها",
      "selectionToUse-currentFilters": "نتیجه فیلتر فعلی",
      "selectionToUse-currentSelection": "رکوردهای انتخاب‌شده",
      startImport: "شروع ورود",
      totalDocumentsCount: "مجموع {{count}} رکورد",
      uploadFileToSeePreview: "برای دیدن پیش‌نمایش، فایل JSON را بارگذاری کنید.",
    },
  },
};

const projectRoot = process.cwd();
const databaseURI = process.env.DATABASE_URI;
const payloadSecret = process.env.PAYLOAD_SECRET;

if (!databaseURI) throw new Error("DATABASE_URI is required for Payload.");
if (!payloadSecret) throw new Error("PAYLOAD_SECRET is required for Payload.");

export default buildConfig({
  admin: {
    user: "users",
    theme: "dark",
    avatar: {
      Component: "./src/components/payload/admin-shell#AdminAvatar",
    },
    importMap: { baseDir: projectRoot },
    components: {
      actions: ["./src/components/payload/admin-shell#AdminHeaderAction"],
      graphics: {
        Icon: "./src/components/payload/admin-shell#AdminBrandIcon",
        Logo: "./src/components/payload/admin-shell#AdminBrandLogo",
      },
      views: {
        dashboard: {
          Component: "./src/components/payload/admin-dashboard#AdminDashboard",
        },
      },
    },
    meta: {
      titleSuffix: " | مدیریت نیلپر",
    },
    timezones: {
      defaultTimezone: "Asia/Tehran",
    },
  },
  collections,
  cors: [process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"],
  db: postgresAdapter({
    migrationDir: path.resolve(projectRoot, "src/payload/migrations"),
    pool: { connectionString: databaseURI },
  }),
  editor: lexicalEditor(),
  i18n: {
    fallbackLanguage: "fa",
    supportedLanguages: { fa: nilperFa },
  },
  jobs: {
    access: {
      cancel: ({ req }) => isStrictAdminUser(req.user),
      queue: ({ req }) => isStrictAdminUser(req.user),
      run: canRunPayloadJobs,
    },
    tasks: [cleanupDataTransferFilesTask],
  },
  plugins: [ecommerce, dataTransferPlugin],
  secret: payloadSecret,
  serverURL: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  sharp,
  typescript: {
    outputFile: path.resolve(projectRoot, "src/payload-types.ts"),
  },
});
