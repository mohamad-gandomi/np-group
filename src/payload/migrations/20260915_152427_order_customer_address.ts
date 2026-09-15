import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "customer_address_id" integer;
  DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'orders_customer_address_id_addresses_id_fk'
    ) THEN
      ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_address_id_addresses_id_fk" FOREIGN KEY ("customer_address_id") REFERENCES "public"."addresses"("id") ON DELETE set null ON UPDATE no action;
    END IF;
  END $$;
  CREATE INDEX IF NOT EXISTS "orders_customer_address_idx" ON "orders" USING btree ("customer_address_id");

  INSERT INTO "addresses" (
    "customer_id", "title", "first_name", "last_name", "company", "address_line1",
    "address_line2", "city", "state", "postal_code", "country", "phone",
    "is_default", "updated_at", "created_at"
  )
  SELECT DISTINCT ON (
    "orders"."customer_id",
    "orders"."shipping_address_address_line1",
    COALESCE("orders"."shipping_address_postal_code", '')
  )
    "orders"."customer_id",
    COALESCE(NULLIF("orders"."shipping_address_title", ''), 'آدرس سفارش'),
    "orders"."shipping_address_first_name",
    "orders"."shipping_address_last_name",
    "orders"."shipping_address_company",
    "orders"."shipping_address_address_line1",
    "orders"."shipping_address_address_line2",
    "orders"."shipping_address_city",
    "orders"."shipping_address_state",
    "orders"."shipping_address_postal_code",
    COALESCE(NULLIF("orders"."shipping_address_country", ''), 'IR')::"enum_addresses_country",
    "orders"."shipping_address_phone",
    false,
    NOW(),
    COALESCE("orders"."created_at", NOW())
  FROM "orders"
  WHERE "orders"."customer_id" IS NOT NULL
    AND NULLIF("orders"."shipping_address_address_line1", '') IS NOT NULL
    AND NOT EXISTS (
      SELECT 1
      FROM "addresses"
      WHERE "addresses"."customer_id" = "orders"."customer_id"
        AND "addresses"."address_line1" = "orders"."shipping_address_address_line1"
        AND COALESCE("addresses"."postal_code", '') = COALESCE("orders"."shipping_address_postal_code", '')
    )
  ORDER BY
    "orders"."customer_id",
    "orders"."shipping_address_address_line1",
    COALESCE("orders"."shipping_address_postal_code", ''),
    "orders"."created_at" ASC;

  UPDATE "orders"
  SET "customer_address_id" = (
    SELECT "addresses"."id"
    FROM "addresses"
    WHERE "addresses"."customer_id" = "orders"."customer_id"
      AND "addresses"."address_line1" = "orders"."shipping_address_address_line1"
      AND COALESCE("addresses"."postal_code", '') = COALESCE("orders"."shipping_address_postal_code", '')
    ORDER BY "addresses"."is_default" DESC, "addresses"."created_at" ASC
    LIMIT 1
  )
  WHERE "orders"."customer_id" IS NOT NULL
    AND NULLIF("orders"."shipping_address_address_line1", '') IS NOT NULL;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "orders" DROP CONSTRAINT "orders_customer_address_id_addresses_id_fk";
  
  DROP INDEX "orders_customer_address_idx";
  ALTER TABLE "orders" DROP COLUMN "customer_address_id";`)
}
