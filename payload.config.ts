import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { fa } from "@payloadcms/translations/languages/fa";
import path from "node:path";
import { buildConfig } from "payload";
import sharp from "sharp";

import { ecommerce } from "./src/payload/commerce";
import { collections } from "./src/payload/collections";

const projectRoot = process.cwd();
const databaseURI = process.env.DATABASE_URI;
const payloadSecret = process.env.PAYLOAD_SECRET;

if (!databaseURI) throw new Error("DATABASE_URI is required for Payload.");
if (!payloadSecret) throw new Error("PAYLOAD_SECRET is required for Payload.");

export default buildConfig({
  admin: {
    user: "users",
    importMap: { baseDir: projectRoot },
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
    supportedLanguages: { fa },
  },
  plugins: [ecommerce],
  secret: payloadSecret,
  serverURL: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  sharp,
  typescript: {
    outputFile: path.resolve(projectRoot, "src/payload-types.ts"),
  },
});
