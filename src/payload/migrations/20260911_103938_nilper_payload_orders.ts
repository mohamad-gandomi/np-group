import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_orders_delivery_method" AS ENUM('advisor');
  CREATE TYPE "public"."enum_orders_payment_method" AS ENUM('gateway', 'invoice');
  ALTER TABLE "orders" ALTER COLUMN "status" SET DATA TYPE text;
  ALTER TABLE "orders" ALTER COLUMN "status" SET DEFAULT 'pending_review'::text;
  UPDATE "orders" SET "status" = CASE
    WHEN "status" = 'completed' THEN 'delivered'
    WHEN "status" = 'cancelled' THEN 'cancelled'
    ELSE 'pending_review'
  END;
  DROP TYPE "public"."enum_orders_status";
  CREATE TYPE "public"."enum_orders_status" AS ENUM('pending_review', 'confirmed', 'in_production', 'ready', 'shipped', 'delivered', 'cancelled');
  ALTER TABLE "orders" ALTER COLUMN "status" SET DEFAULT 'pending_review'::"public"."enum_orders_status";
  ALTER TABLE "orders" ALTER COLUMN "status" SET DATA TYPE "public"."enum_orders_status" USING "status"::"public"."enum_orders_status";
  ALTER TABLE "orders" ADD COLUMN "order_number" varchar;
  ALTER TABLE "orders" ADD COLUMN "source_cart_id" integer;
  ALTER TABLE "orders" ADD COLUMN "contact_name" varchar;
  ALTER TABLE "orders" ADD COLUMN "contact_phone" varchar;
  ALTER TABLE "orders" ADD COLUMN "delivery_method" "enum_orders_delivery_method";
  ALTER TABLE "orders" ADD COLUMN "payment_method" "enum_orders_payment_method";
  ALTER TABLE "orders" ADD COLUMN "storefront_customer_key" varchar;
  UPDATE "orders" SET
    "order_number" = 'NP-MIGRATED-' || "id"::text,
    "contact_name" = 'ثبت قدیمی',
    "contact_phone" = '-',
    "delivery_method" = 'advisor',
    "payment_method" = 'invoice';
  ALTER TABLE "orders" ALTER COLUMN "order_number" SET NOT NULL;
  ALTER TABLE "orders" ALTER COLUMN "contact_name" SET NOT NULL;
  ALTER TABLE "orders" ALTER COLUMN "contact_phone" SET NOT NULL;
  ALTER TABLE "orders" ALTER COLUMN "delivery_method" SET NOT NULL;
  ALTER TABLE "orders" ALTER COLUMN "payment_method" SET NOT NULL;
  ALTER TABLE "orders" ADD CONSTRAINT "orders_source_cart_id_carts_id_fk" FOREIGN KEY ("source_cart_id") REFERENCES "public"."carts"("id") ON DELETE set null ON UPDATE no action;
  CREATE UNIQUE INDEX "orders_order_number_idx" ON "orders" USING btree ("order_number");
  CREATE UNIQUE INDEX "orders_source_cart_idx" ON "orders" USING btree ("source_cart_id");
  CREATE INDEX "orders_storefront_customer_key_idx" ON "orders" USING btree ("storefront_customer_key");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "orders" DROP CONSTRAINT "orders_source_cart_id_carts_id_fk";
  
  ALTER TABLE "orders" ALTER COLUMN "status" SET DATA TYPE text;
  ALTER TABLE "orders" ALTER COLUMN "status" SET DEFAULT 'processing'::text;
  UPDATE "orders" SET "status" = CASE
    WHEN "status" = 'delivered' THEN 'completed'
    WHEN "status" = 'cancelled' THEN 'cancelled'
    ELSE 'processing'
  END;
  DROP TYPE "public"."enum_orders_status";
  CREATE TYPE "public"."enum_orders_status" AS ENUM('processing', 'completed', 'cancelled', 'refunded');
  ALTER TABLE "orders" ALTER COLUMN "status" SET DEFAULT 'processing'::"public"."enum_orders_status";
  ALTER TABLE "orders" ALTER COLUMN "status" SET DATA TYPE "public"."enum_orders_status" USING "status"::"public"."enum_orders_status";
  DROP INDEX "orders_order_number_idx";
  DROP INDEX "orders_source_cart_idx";
  DROP INDEX "orders_storefront_customer_key_idx";
  ALTER TABLE "orders" DROP COLUMN "order_number";
  ALTER TABLE "orders" DROP COLUMN "source_cart_id";
  ALTER TABLE "orders" DROP COLUMN "contact_name";
  ALTER TABLE "orders" DROP COLUMN "contact_phone";
  ALTER TABLE "orders" DROP COLUMN "delivery_method";
  ALTER TABLE "orders" DROP COLUMN "payment_method";
  ALTER TABLE "orders" DROP COLUMN "storefront_customer_key";
  DROP TYPE "public"."enum_orders_delivery_method";
  DROP TYPE "public"."enum_orders_payment_method";`)
}
