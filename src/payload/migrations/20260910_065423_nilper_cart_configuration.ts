import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  CREATE TABLE "carts_items_configuration" (
    "_order" integer NOT NULL,
    "_parent_id" varchar NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "group_key" varchar NOT NULL,
    "group_id" integer,
    "group_label_fa_snapshot" varchar NOT NULL,
    "option_id" integer,
    "option_code_snapshot" varchar,
    "label_fa_snapshot" varchar NOT NULL
  );

  CREATE TABLE "orders_items_configuration" (
    "_order" integer NOT NULL,
    "_parent_id" varchar NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "group_key" varchar NOT NULL,
    "group_id" integer,
    "group_label_fa_snapshot" varchar NOT NULL,
    "option_id" integer,
    "option_code_snapshot" varchar,
    "label_fa_snapshot" varchar NOT NULL
  );

  CREATE TABLE "transactions_items_configuration" (
    "_order" integer NOT NULL,
    "_parent_id" varchar NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "group_key" varchar NOT NULL,
    "group_id" integer,
    "group_label_fa_snapshot" varchar NOT NULL,
    "option_id" integer,
    "option_code_snapshot" varchar,
    "label_fa_snapshot" varchar NOT NULL
  );

  ALTER TABLE "carts_items" ADD COLUMN "configuration_key" varchar;
  ALTER TABLE "carts_items" ADD COLUMN "product_title_snapshot" varchar;
  ALTER TABLE "carts_items" ADD COLUMN "variant_code_snapshot" varchar;
  ALTER TABLE "carts_items" ADD COLUMN "unit_price_in_t_m_n" numeric;
  ALTER TABLE "orders_items" ADD COLUMN "configuration_key" varchar;
  ALTER TABLE "orders_items" ADD COLUMN "product_title_snapshot" varchar;
  ALTER TABLE "orders_items" ADD COLUMN "variant_code_snapshot" varchar;
  ALTER TABLE "orders_items" ADD COLUMN "unit_price_in_t_m_n" numeric;
  ALTER TABLE "transactions_items" ADD COLUMN "configuration_key" varchar;
  ALTER TABLE "transactions_items" ADD COLUMN "product_title_snapshot" varchar;
  ALTER TABLE "transactions_items" ADD COLUMN "variant_code_snapshot" varchar;
  ALTER TABLE "transactions_items" ADD COLUMN "unit_price_in_t_m_n" numeric;
  UPDATE "carts_items" AS item SET
    "configuration_key" = '[]',
    "product_title_snapshot" = COALESCE((SELECT "title" FROM "products" WHERE "id" = item."product_id"), concat('محصول #', item."product_id")),
    "variant_code_snapshot" = (SELECT "nilper_code" FROM "variants" WHERE "id" = item."variant_id"),
    "unit_price_in_t_m_n" = COALESCE(
      (SELECT "price_in_t_m_n" FROM "variants" WHERE "id" = item."variant_id"),
      (SELECT "price_in_t_m_n" FROM "products" WHERE "id" = item."product_id"),
      0
    );
  UPDATE "orders_items" AS item SET
    "configuration_key" = '[]',
    "product_title_snapshot" = COALESCE((SELECT "title" FROM "products" WHERE "id" = item."product_id"), concat('محصول #', item."product_id")),
    "variant_code_snapshot" = (SELECT "nilper_code" FROM "variants" WHERE "id" = item."variant_id"),
    "unit_price_in_t_m_n" = COALESCE(
      (SELECT "price_in_t_m_n" FROM "variants" WHERE "id" = item."variant_id"),
      (SELECT "price_in_t_m_n" FROM "products" WHERE "id" = item."product_id"),
      0
    );
  UPDATE "transactions_items" AS item SET
    "configuration_key" = '[]',
    "product_title_snapshot" = COALESCE((SELECT "title" FROM "products" WHERE "id" = item."product_id"), concat('محصول #', item."product_id")),
    "variant_code_snapshot" = (SELECT "nilper_code" FROM "variants" WHERE "id" = item."variant_id"),
    "unit_price_in_t_m_n" = COALESCE(
      (SELECT "price_in_t_m_n" FROM "variants" WHERE "id" = item."variant_id"),
      (SELECT "price_in_t_m_n" FROM "products" WHERE "id" = item."product_id"),
      0
    );
  ALTER TABLE "carts_items" ALTER COLUMN "configuration_key" SET NOT NULL;
  ALTER TABLE "carts_items" ALTER COLUMN "product_title_snapshot" SET NOT NULL;
  ALTER TABLE "carts_items" ALTER COLUMN "unit_price_in_t_m_n" SET NOT NULL;
  ALTER TABLE "orders_items" ALTER COLUMN "configuration_key" SET NOT NULL;
  ALTER TABLE "orders_items" ALTER COLUMN "product_title_snapshot" SET NOT NULL;
  ALTER TABLE "orders_items" ALTER COLUMN "unit_price_in_t_m_n" SET NOT NULL;
  ALTER TABLE "transactions_items" ALTER COLUMN "configuration_key" SET NOT NULL;
  ALTER TABLE "transactions_items" ALTER COLUMN "product_title_snapshot" SET NOT NULL;
  ALTER TABLE "transactions_items" ALTER COLUMN "unit_price_in_t_m_n" SET NOT NULL;
  ALTER TABLE "carts_items_configuration" ADD CONSTRAINT "carts_items_configuration_group_id_configuration_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."configuration_groups"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "carts_items_configuration" ADD CONSTRAINT "carts_items_configuration_option_id_configuration_options_id_fk" FOREIGN KEY ("option_id") REFERENCES "public"."configuration_options"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "carts_items_configuration" ADD CONSTRAINT "carts_items_configuration_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."carts_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "orders_items_configuration" ADD CONSTRAINT "orders_items_configuration_group_id_configuration_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."configuration_groups"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "orders_items_configuration" ADD CONSTRAINT "orders_items_configuration_option_id_configuration_options_id_fk" FOREIGN KEY ("option_id") REFERENCES "public"."configuration_options"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "orders_items_configuration" ADD CONSTRAINT "orders_items_configuration_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."orders_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "transactions_items_configuration" ADD CONSTRAINT "transactions_items_configuration_group_id_configuration_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."configuration_groups"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "transactions_items_configuration" ADD CONSTRAINT "transactions_items_configuration_option_id_configuration_options_id_fk" FOREIGN KEY ("option_id") REFERENCES "public"."configuration_options"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "transactions_items_configuration" ADD CONSTRAINT "transactions_items_configuration_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."transactions_items"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "carts_items_configuration_order_idx" ON "carts_items_configuration" USING btree ("_order");
  CREATE INDEX "carts_items_configuration_parent_id_idx" ON "carts_items_configuration" USING btree ("_parent_id");
  CREATE INDEX "carts_items_configuration_group_idx" ON "carts_items_configuration" USING btree ("group_id");
  CREATE INDEX "carts_items_configuration_option_idx" ON "carts_items_configuration" USING btree ("option_id");
  CREATE INDEX "orders_items_configuration_order_idx" ON "orders_items_configuration" USING btree ("_order");
  CREATE INDEX "orders_items_configuration_parent_id_idx" ON "orders_items_configuration" USING btree ("_parent_id");
  CREATE INDEX "orders_items_configuration_group_idx" ON "orders_items_configuration" USING btree ("group_id");
  CREATE INDEX "orders_items_configuration_option_idx" ON "orders_items_configuration" USING btree ("option_id");
  CREATE INDEX "transactions_items_configuration_order_idx" ON "transactions_items_configuration" USING btree ("_order");
  CREATE INDEX "transactions_items_configuration_parent_id_idx" ON "transactions_items_configuration" USING btree ("_parent_id");
  CREATE INDEX "transactions_items_configuration_group_idx" ON "transactions_items_configuration" USING btree ("group_id");
  CREATE INDEX "transactions_items_configuration_option_idx" ON "transactions_items_configuration" USING btree ("option_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "carts_items_configuration" CASCADE;
  DROP TABLE "orders_items_configuration" CASCADE;
  DROP TABLE "transactions_items_configuration" CASCADE;
  ALTER TABLE "carts_items" DROP COLUMN "configuration_key";
  ALTER TABLE "carts_items" DROP COLUMN "product_title_snapshot";
  ALTER TABLE "carts_items" DROP COLUMN "variant_code_snapshot";
  ALTER TABLE "carts_items" DROP COLUMN "unit_price_in_t_m_n";
  ALTER TABLE "orders_items" DROP COLUMN "configuration_key";
  ALTER TABLE "orders_items" DROP COLUMN "product_title_snapshot";
  ALTER TABLE "orders_items" DROP COLUMN "variant_code_snapshot";
  ALTER TABLE "orders_items" DROP COLUMN "unit_price_in_t_m_n";
  ALTER TABLE "transactions_items" DROP COLUMN "configuration_key";
  ALTER TABLE "transactions_items" DROP COLUMN "product_title_snapshot";
  ALTER TABLE "transactions_items" DROP COLUMN "variant_code_snapshot";
  ALTER TABLE "transactions_items" DROP COLUMN "unit_price_in_t_m_n";`)
}
