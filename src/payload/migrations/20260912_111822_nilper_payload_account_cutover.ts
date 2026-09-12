import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "addresses" ALTER COLUMN "country" SET DATA TYPE text;
  UPDATE "addresses" SET "country" = 'IR';
  ALTER TABLE "addresses" ALTER COLUMN "country" SET DEFAULT 'IR'::text;
  DROP TYPE "public"."enum_addresses_country";
  CREATE TYPE "public"."enum_addresses_country" AS ENUM('IR');
  ALTER TABLE "addresses" ALTER COLUMN "country" SET DEFAULT 'IR'::"public"."enum_addresses_country";
  ALTER TABLE "addresses" ALTER COLUMN "country" SET DATA TYPE "public"."enum_addresses_country" USING "country"::"public"."enum_addresses_country";
  DROP INDEX IF EXISTS "customers_storefront_identity_idx";
  DROP INDEX IF EXISTS "customers_legacy_supabase_user_id_idx";
  DROP INDEX IF EXISTS "carts_storefront_customer_key_idx";
  DROP INDEX IF EXISTS "orders_storefront_customer_key_idx";
  ALTER TABLE "addresses" ADD COLUMN IF NOT EXISTS "is_default" boolean DEFAULT false;
  ALTER TABLE "customers" DROP COLUMN IF EXISTS "storefront_identity";
  ALTER TABLE "customers" DROP COLUMN IF EXISTS "legacy_supabase_user_id";
  ALTER TABLE "carts" DROP COLUMN IF EXISTS "storefront_customer_key";
  ALTER TABLE "orders" DROP COLUMN IF EXISTS "storefront_customer_key";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "addresses" ALTER COLUMN "country" SET DATA TYPE text;
  UPDATE "addresses" SET "country" = 'US';
  DROP TYPE "public"."enum_addresses_country";
  CREATE TYPE "public"."enum_addresses_country" AS ENUM('US', 'GB', 'CA', 'AU', 'AT', 'BE', 'BR', 'BG', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HK', 'HU', 'IN', 'IE', 'IT', 'JP', 'LV', 'LT', 'LU', 'MY', 'MT', 'MX', 'NL', 'NZ', 'NO', 'PL', 'PT', 'RO', 'SG', 'SK', 'SI', 'ES', 'SE', 'CH');
  ALTER TABLE "addresses" ALTER COLUMN "country" SET DATA TYPE "public"."enum_addresses_country" USING "country"::"public"."enum_addresses_country";
  ALTER TABLE "addresses" ALTER COLUMN "country" DROP DEFAULT;
  ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "storefront_identity" varchar;
  ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "legacy_supabase_user_id" varchar;
  ALTER TABLE "carts" ADD COLUMN IF NOT EXISTS "storefront_customer_key" varchar;
  ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "storefront_customer_key" varchar;
  UPDATE "customers" SET "storefront_identity" = 'rollback-' || "id"::text;
  ALTER TABLE "customers" ALTER COLUMN "storefront_identity" SET NOT NULL;
  CREATE UNIQUE INDEX IF NOT EXISTS "customers_storefront_identity_idx" ON "customers" USING btree ("storefront_identity");
  CREATE UNIQUE INDEX IF NOT EXISTS "customers_legacy_supabase_user_id_idx" ON "customers" USING btree ("legacy_supabase_user_id");
  CREATE INDEX IF NOT EXISTS "carts_storefront_customer_key_idx" ON "carts" USING btree ("storefront_customer_key");
  CREATE INDEX IF NOT EXISTS "orders_storefront_customer_key_idx" ON "orders" USING btree ("storefront_customer_key");
  ALTER TABLE "addresses" DROP COLUMN IF EXISTS "is_default";`)
}
