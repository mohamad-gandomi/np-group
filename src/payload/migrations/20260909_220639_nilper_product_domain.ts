import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_variants_measurements_unit" AS ENUM('cm', 'kg', 'm', 'unit');
  CREATE TYPE "public"."enum__variants_v_version_measurements_unit" AS ENUM('cm', 'kg', 'm', 'unit');
  CREATE TYPE "public"."enum_products_measurements_unit" AS ENUM('cm', 'kg', 'm', 'unit');
  CREATE TYPE "public"."enum__products_v_version_measurements_unit" AS ENUM('cm', 'kg', 'm', 'unit');
  ALTER TYPE "public"."enum_products_technical_specs_group" ADD VALUE 'identity' BEFORE 'construction';
  ALTER TYPE "public"."enum_products_technical_specs_group" ADD VALUE 'materials' BEFORE 'comfort';
  ALTER TYPE "public"."enum_products_technical_specs_group" ADD VALUE 'finish' BEFORE 'delivery';
  ALTER TYPE "public"."enum_products_technical_specs_group" ADD VALUE 'care';
  ALTER TYPE "public"."enum_products_technical_specs_group" ADD VALUE 'other';
  ALTER TYPE "public"."enum__products_v_version_technical_specs_group" ADD VALUE 'identity' BEFORE 'construction';
  ALTER TYPE "public"."enum__products_v_version_technical_specs_group" ADD VALUE 'materials' BEFORE 'comfort';
  ALTER TYPE "public"."enum__products_v_version_technical_specs_group" ADD VALUE 'finish' BEFORE 'delivery';
  ALTER TYPE "public"."enum__products_v_version_technical_specs_group" ADD VALUE 'care';
  ALTER TYPE "public"."enum__products_v_version_technical_specs_group" ADD VALUE 'other';
  CREATE TABLE "variants_measurements" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "key" varchar,
    "label_fa" varchar,
    "value" numeric,
    "unit" "enum_variants_measurements_unit",
    "sort_order" numeric DEFAULT 0
  );

  CREATE TABLE "_variants_v_version_measurements" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" serial PRIMARY KEY NOT NULL,
    "key" varchar,
    "label_fa" varchar,
    "value" numeric,
    "unit" "enum__variants_v_version_measurements_unit",
    "sort_order" numeric DEFAULT 0,
    "_uuid" varchar
  );

  CREATE TABLE "products_measurements" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "key" varchar,
    "label_fa" varchar,
    "value" numeric,
    "unit" "enum_products_measurements_unit",
    "sort_order" numeric DEFAULT 0
  );

  CREATE TABLE "_products_v_version_measurements" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" serial PRIMARY KEY NOT NULL,
    "key" varchar,
    "label_fa" varchar,
    "value" numeric,
    "unit" "enum__products_v_version_measurements_unit",
    "sort_order" numeric DEFAULT 0,
    "_uuid" varchar
  );

  ALTER TABLE "variants" RENAME COLUMN "source_code_raw" TO "source_metadata_identity_raw";
  ALTER TABLE "variants" RENAME COLUMN "data_quality_notes" TO "source_metadata_data_quality_notes";
  ALTER TABLE "_variants_v" RENAME COLUMN "version_source_code_raw" TO "version_source_metadata_identity_raw";
  ALTER TABLE "_variants_v" RENAME COLUMN "version_data_quality_notes" TO "version_source_metadata_data_quality_notes";
  ALTER TABLE "product_series" ADD COLUMN "published" boolean DEFAULT true;
  ALTER TABLE "configuration_groups" ADD COLUMN "active" boolean DEFAULT true;
  ALTER TABLE "variants" ADD COLUMN "source_key" varchar;
  ALTER TABLE "variants" ADD COLUMN "source_metadata_workbook_key" varchar;
  ALTER TABLE "variants" ADD COLUMN "source_metadata_file" varchar;
  ALTER TABLE "variants" ADD COLUMN "source_metadata_sheet" varchar;
  ALTER TABLE "variants" ADD COLUMN "source_metadata_catalog_code_raw" varchar;
  ALTER TABLE "_variants_v" ADD COLUMN "version_source_key" varchar;
  ALTER TABLE "_variants_v" ADD COLUMN "version_source_metadata_workbook_key" varchar;
  ALTER TABLE "_variants_v" ADD COLUMN "version_source_metadata_file" varchar;
  ALTER TABLE "_variants_v" ADD COLUMN "version_source_metadata_sheet" varchar;
  ALTER TABLE "_variants_v" ADD COLUMN "version_source_metadata_catalog_code_raw" varchar;
  ALTER TABLE "products" ADD COLUMN "source_key" varchar;
  ALTER TABLE "products" ADD COLUMN "source_metadata_workbook_key" varchar;
  ALTER TABLE "products" ADD COLUMN "source_metadata_identity_raw" varchar;
  ALTER TABLE "_products_v" ADD COLUMN "version_source_key" varchar;
  ALTER TABLE "_products_v" ADD COLUMN "version_source_metadata_workbook_key" varchar;
  ALTER TABLE "_products_v" ADD COLUMN "version_source_metadata_identity_raw" varchar;
  UPDATE "products"
  SET
    "source_metadata_workbook_key" = COALESCE(NULLIF(regexp_replace("source_metadata_file", '[^0-9]', '', 'g'), ''), 'legacy'),
    "source_metadata_identity_raw" = COALESCE("source_metadata_catalog_code_raw", "catalog_code", "slug", "id"::varchar);
  UPDATE "products"
  SET "source_key" = concat(
    'nilper:xlsx:', "source_metadata_workbook_key", ':',
    lower(regexp_replace(trim(COALESCE("source_metadata_sheet", 'unknown')), '[[:space:]]+', '-', 'g')), ':product:',
    lower(regexp_replace(trim("source_metadata_identity_raw"), '[[:space:]:]+', '-', 'g'))
  );
  UPDATE "variants" AS variant
  SET
    "source_metadata_workbook_key" = product."source_metadata_workbook_key",
    "source_metadata_file" = product."source_metadata_file",
    "source_metadata_sheet" = product."source_metadata_sheet",
    "source_metadata_catalog_code_raw" = product."source_metadata_catalog_code_raw"
  FROM "products" AS product
  WHERE variant."product_id" = product."id";
  UPDATE "variants"
  SET
    "source_metadata_workbook_key" = COALESCE("source_metadata_workbook_key", 'legacy'),
    "source_metadata_file" = COALESCE("source_metadata_file", 'legacy.xlsx'),
    "source_metadata_sheet" = COALESCE("source_metadata_sheet", 'unknown'),
    "source_metadata_identity_raw" = COALESCE("source_metadata_identity_raw", "nilper_code", "id"::varchar);
  UPDATE "variants"
  SET "source_key" = concat(
    'nilper:xlsx:', "source_metadata_workbook_key", ':',
    lower(regexp_replace(trim("source_metadata_sheet"), '[[:space:]]+', '-', 'g')), ':variant:',
    lower(regexp_replace(trim("source_metadata_identity_raw"), '[[:space:]:]+', '-', 'g'))
  );
  UPDATE "_products_v"
  SET
    "version_source_metadata_workbook_key" = COALESCE(NULLIF(regexp_replace("version_source_metadata_file", '[^0-9]', '', 'g'), ''), 'legacy'),
    "version_source_metadata_identity_raw" = COALESCE("version_source_metadata_catalog_code_raw", "version_catalog_code", "version_slug", "id"::varchar);
  UPDATE "_products_v"
  SET "version_source_key" = concat('nilper:xlsx:', "version_source_metadata_workbook_key", ':product-version:product:', "id"::varchar);
  UPDATE "_variants_v"
  SET
    "version_source_metadata_workbook_key" = 'legacy',
    "version_source_metadata_file" = COALESCE("version_source_metadata_file", 'legacy.xlsx'),
    "version_source_metadata_sheet" = COALESCE("version_source_metadata_sheet", 'variant-version'),
    "version_source_metadata_identity_raw" = COALESCE("version_source_metadata_identity_raw", "version_nilper_code", "id"::varchar),
    "version_source_key" = concat('nilper:xlsx:legacy:variant-version:variant:', "id"::varchar);
  INSERT INTO "variants_measurements" ("_order", "_parent_id", "id", "key", "label_fa", "value", "unit", "sort_order")
  SELECT 0, "id", concat('migrated-seat-height-', "id"), 'seat-height', 'ارتفاع نشیمن', "dimensions_seat_height_cm", 'cm', 10
  FROM "variants" WHERE "dimensions_seat_height_cm" IS NOT NULL;
  INSERT INTO "variants_measurements" ("_order", "_parent_id", "id", "key", "label_fa", "value", "unit", "sort_order")
  SELECT 1, "id", concat('migrated-seat-width-', "id"), 'seat-width-per-person', 'عرض نشیمن به ازای هر نفر', "dimensions_seat_width_cm", 'cm', 20
  FROM "variants" WHERE "dimensions_seat_width_cm" IS NOT NULL;
  INSERT INTO "variants_measurements" ("_order", "_parent_id", "id", "key", "label_fa", "value", "unit", "sort_order")
  SELECT 2, "id", concat('migrated-seat-depth-', "id"), 'seat-depth', 'عمق نشیمن', "dimensions_seat_depth_cm", 'cm', 30
  FROM "variants" WHERE "dimensions_seat_depth_cm" IS NOT NULL;
  INSERT INTO "variants_measurements" ("_order", "_parent_id", "id", "key", "label_fa", "value", "unit", "sort_order")
  SELECT 3, "id", concat('migrated-fabric-', "id"), 'fabric-single-color', 'متراژ پارچه تک‌رنگ بدون کوسن', "dimensions_fabric_meters", 'm', 40
  FROM "variants" WHERE "dimensions_fabric_meters" IS NOT NULL;
  INSERT INTO "products_measurements" ("_order", "_parent_id", "id", "key", "label_fa", "value", "unit", "sort_order")
  SELECT 0, "id", concat('migrated-weight-', "id"), 'weight', 'وزن', "dimensions_weight_kg", 'kg', 10
  FROM "products" WHERE "dimensions_weight_kg" IS NOT NULL;
  INSERT INTO "products_technical_specs" ("_order", "_parent_id", "id", "key", "label_fa", "value_fa", "group", "sort_order")
  SELECT 999, "id", concat('migrated-dimensions-summary-', "id"), 'dimensions-summary', 'خلاصه ابعاد پیشین', "dimensions_summary_fa", 'delivery', 999
  FROM "products" WHERE "dimensions_summary_fa" IS NOT NULL;
  INSERT INTO "_variants_v_version_measurements" ("_order", "_parent_id", "key", "label_fa", "value", "unit", "sort_order", "_uuid")
  SELECT 0, "id", 'seat-height', 'ارتفاع نشیمن', "version_dimensions_seat_height_cm", 'cm', 10, concat('migrated-seat-height-', "id")
  FROM "_variants_v" WHERE "version_dimensions_seat_height_cm" IS NOT NULL;
  INSERT INTO "_variants_v_version_measurements" ("_order", "_parent_id", "key", "label_fa", "value", "unit", "sort_order", "_uuid")
  SELECT 1, "id", 'seat-width-per-person', 'عرض نشیمن به ازای هر نفر', "version_dimensions_seat_width_cm", 'cm', 20, concat('migrated-seat-width-', "id")
  FROM "_variants_v" WHERE "version_dimensions_seat_width_cm" IS NOT NULL;
  INSERT INTO "_variants_v_version_measurements" ("_order", "_parent_id", "key", "label_fa", "value", "unit", "sort_order", "_uuid")
  SELECT 2, "id", 'seat-depth', 'عمق نشیمن', "version_dimensions_seat_depth_cm", 'cm', 30, concat('migrated-seat-depth-', "id")
  FROM "_variants_v" WHERE "version_dimensions_seat_depth_cm" IS NOT NULL;
  INSERT INTO "_variants_v_version_measurements" ("_order", "_parent_id", "key", "label_fa", "value", "unit", "sort_order", "_uuid")
  SELECT 3, "id", 'fabric-single-color', 'متراژ پارچه تک‌رنگ بدون کوسن', "version_dimensions_fabric_meters", 'm', 40, concat('migrated-fabric-', "id")
  FROM "_variants_v" WHERE "version_dimensions_fabric_meters" IS NOT NULL;
  INSERT INTO "_products_v_version_measurements" ("_order", "_parent_id", "key", "label_fa", "value", "unit", "sort_order", "_uuid")
  SELECT 0, "id", 'weight', 'وزن', "version_dimensions_weight_kg", 'kg', 10, concat('migrated-weight-', "id")
  FROM "_products_v" WHERE "version_dimensions_weight_kg" IS NOT NULL;
  INSERT INTO "_products_v_version_technical_specs" ("_order", "_parent_id", "key", "label_fa", "value_fa", "group", "sort_order", "_uuid")
  SELECT 999, "id", 'dimensions-summary', 'خلاصه ابعاد پیشین', "version_dimensions_summary_fa", 'delivery', 999, concat('migrated-dimensions-summary-', "id")
  FROM "_products_v" WHERE "version_dimensions_summary_fa" IS NOT NULL;
  ALTER TABLE "variants_measurements" ADD CONSTRAINT "variants_measurements_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."variants"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_variants_v_version_measurements" ADD CONSTRAINT "_variants_v_version_measurements_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_variants_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "products_measurements" ADD CONSTRAINT "products_measurements_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_products_v_version_measurements" ADD CONSTRAINT "_products_v_version_measurements_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_products_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "variants_measurements_order_idx" ON "variants_measurements" USING btree ("_order");
  CREATE INDEX "variants_measurements_parent_id_idx" ON "variants_measurements" USING btree ("_parent_id");
  CREATE INDEX "_variants_v_version_measurements_order_idx" ON "_variants_v_version_measurements" USING btree ("_order");
  CREATE INDEX "_variants_v_version_measurements_parent_id_idx" ON "_variants_v_version_measurements" USING btree ("_parent_id");
  CREATE INDEX "products_measurements_order_idx" ON "products_measurements" USING btree ("_order");
  CREATE INDEX "products_measurements_parent_id_idx" ON "products_measurements" USING btree ("_parent_id");
  CREATE INDEX "_products_v_version_measurements_order_idx" ON "_products_v_version_measurements" USING btree ("_order");
  CREATE INDEX "_products_v_version_measurements_parent_id_idx" ON "_products_v_version_measurements" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "variants_source_key_idx" ON "variants" USING btree ("source_key");
  CREATE INDEX "_variants_v_version_version_source_key_idx" ON "_variants_v" USING btree ("version_source_key");
  CREATE UNIQUE INDEX "products_source_key_idx" ON "products" USING btree ("source_key");
  CREATE INDEX "_products_v_version_version_source_key_idx" ON "_products_v" USING btree ("version_source_key");
  ALTER TABLE "variants" DROP COLUMN "dimensions_seat_height_cm";
  ALTER TABLE "variants" DROP COLUMN "dimensions_seat_width_cm";
  ALTER TABLE "variants" DROP COLUMN "dimensions_seat_depth_cm";
  ALTER TABLE "variants" DROP COLUMN "dimensions_fabric_meters";
  ALTER TABLE "_variants_v" DROP COLUMN "version_dimensions_seat_height_cm";
  ALTER TABLE "_variants_v" DROP COLUMN "version_dimensions_seat_width_cm";
  ALTER TABLE "_variants_v" DROP COLUMN "version_dimensions_seat_depth_cm";
  ALTER TABLE "_variants_v" DROP COLUMN "version_dimensions_fabric_meters";
  ALTER TABLE "products" DROP COLUMN "dimensions_summary_fa";
  ALTER TABLE "products" DROP COLUMN "dimensions_weight_kg";
  ALTER TABLE "_products_v" DROP COLUMN "version_dimensions_summary_fa";
  ALTER TABLE "_products_v" DROP COLUMN "version_dimensions_weight_kg";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "variants" ADD COLUMN "dimensions_seat_height_cm" numeric;
  ALTER TABLE "variants" ADD COLUMN "dimensions_seat_width_cm" numeric;
  ALTER TABLE "variants" ADD COLUMN "dimensions_seat_depth_cm" numeric;
  ALTER TABLE "variants" ADD COLUMN "dimensions_fabric_meters" numeric;
  ALTER TABLE "_variants_v" ADD COLUMN "version_dimensions_seat_height_cm" numeric;
  ALTER TABLE "_variants_v" ADD COLUMN "version_dimensions_seat_width_cm" numeric;
  ALTER TABLE "_variants_v" ADD COLUMN "version_dimensions_seat_depth_cm" numeric;
  ALTER TABLE "_variants_v" ADD COLUMN "version_dimensions_fabric_meters" numeric;
  ALTER TABLE "products" ADD COLUMN "dimensions_summary_fa" varchar;
  ALTER TABLE "products" ADD COLUMN "dimensions_weight_kg" numeric;
  ALTER TABLE "_products_v" ADD COLUMN "version_dimensions_summary_fa" varchar;
  ALTER TABLE "_products_v" ADD COLUMN "version_dimensions_weight_kg" numeric;
  UPDATE "variants" SET
    "dimensions_seat_height_cm" = (SELECT "value" FROM "variants_measurements" WHERE "_parent_id" = "variants"."id" AND "key" = 'seat-height' LIMIT 1),
    "dimensions_seat_width_cm" = (SELECT "value" FROM "variants_measurements" WHERE "_parent_id" = "variants"."id" AND "key" = 'seat-width-per-person' LIMIT 1),
    "dimensions_seat_depth_cm" = (SELECT "value" FROM "variants_measurements" WHERE "_parent_id" = "variants"."id" AND "key" = 'seat-depth' LIMIT 1),
    "dimensions_fabric_meters" = (SELECT "value" FROM "variants_measurements" WHERE "_parent_id" = "variants"."id" AND "key" = 'fabric-single-color' LIMIT 1);
  UPDATE "_variants_v" SET
    "version_dimensions_seat_height_cm" = (SELECT "value" FROM "_variants_v_version_measurements" WHERE "_parent_id" = "_variants_v"."id" AND "key" = 'seat-height' LIMIT 1),
    "version_dimensions_seat_width_cm" = (SELECT "value" FROM "_variants_v_version_measurements" WHERE "_parent_id" = "_variants_v"."id" AND "key" = 'seat-width-per-person' LIMIT 1),
    "version_dimensions_seat_depth_cm" = (SELECT "value" FROM "_variants_v_version_measurements" WHERE "_parent_id" = "_variants_v"."id" AND "key" = 'seat-depth' LIMIT 1),
    "version_dimensions_fabric_meters" = (SELECT "value" FROM "_variants_v_version_measurements" WHERE "_parent_id" = "_variants_v"."id" AND "key" = 'fabric-single-color' LIMIT 1);
  UPDATE "products" SET
    "dimensions_summary_fa" = (SELECT "value_fa" FROM "products_technical_specs" WHERE "_parent_id" = "products"."id" AND "key" = 'dimensions-summary' LIMIT 1),
    "dimensions_weight_kg" = (SELECT "value" FROM "products_measurements" WHERE "_parent_id" = "products"."id" AND "key" = 'weight' LIMIT 1);
  UPDATE "_products_v" SET
    "version_dimensions_summary_fa" = (SELECT "value_fa" FROM "_products_v_version_technical_specs" WHERE "_parent_id" = "_products_v"."id" AND "key" = 'dimensions-summary' LIMIT 1),
    "version_dimensions_weight_kg" = (SELECT "value" FROM "_products_v_version_measurements" WHERE "_parent_id" = "_products_v"."id" AND "key" = 'weight' LIMIT 1);
  DELETE FROM "products_technical_specs" WHERE "key" = 'dimensions-summary';
  DELETE FROM "_products_v_version_technical_specs" WHERE "key" = 'dimensions-summary';
  ALTER TABLE "variants_measurements" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_variants_v_version_measurements" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "products_measurements" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_products_v_version_measurements" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "variants_measurements" CASCADE;
  DROP TABLE "_variants_v_version_measurements" CASCADE;
  DROP TABLE "products_measurements" CASCADE;
  DROP TABLE "_products_v_version_measurements" CASCADE;
  ALTER TABLE "variants" RENAME COLUMN "source_metadata_identity_raw" TO "source_code_raw";
  ALTER TABLE "variants" RENAME COLUMN "source_metadata_data_quality_notes" TO "data_quality_notes";
  ALTER TABLE "_variants_v" RENAME COLUMN "version_source_metadata_identity_raw" TO "version_source_code_raw";
  ALTER TABLE "_variants_v" RENAME COLUMN "version_source_metadata_data_quality_notes" TO "version_data_quality_notes";
  UPDATE "products_technical_specs" SET "group" = 'construction' WHERE "group"::text IN ('identity', 'materials', 'finish', 'care', 'other');
  UPDATE "_products_v_version_technical_specs" SET "group" = 'construction' WHERE "group"::text IN ('identity', 'materials', 'finish', 'care', 'other');
  ALTER TABLE "products_technical_specs" ALTER COLUMN "group" SET DATA TYPE text;
  DROP TYPE "public"."enum_products_technical_specs_group";
  CREATE TYPE "public"."enum_products_technical_specs_group" AS ENUM('construction', 'comfort', 'delivery');
  ALTER TABLE "products_technical_specs" ALTER COLUMN "group" SET DATA TYPE "public"."enum_products_technical_specs_group" USING "group"::"public"."enum_products_technical_specs_group";
  ALTER TABLE "_products_v_version_technical_specs" ALTER COLUMN "group" SET DATA TYPE text;
  DROP TYPE "public"."enum__products_v_version_technical_specs_group";
  CREATE TYPE "public"."enum__products_v_version_technical_specs_group" AS ENUM('construction', 'comfort', 'delivery');
  ALTER TABLE "_products_v_version_technical_specs" ALTER COLUMN "group" SET DATA TYPE "public"."enum__products_v_version_technical_specs_group" USING "group"::"public"."enum__products_v_version_technical_specs_group";
  DROP INDEX "variants_source_key_idx";
  DROP INDEX "_variants_v_version_version_source_key_idx";
  DROP INDEX "products_source_key_idx";
  DROP INDEX "_products_v_version_version_source_key_idx";
  ALTER TABLE "product_series" DROP COLUMN "published";
  ALTER TABLE "configuration_groups" DROP COLUMN "active";
  ALTER TABLE "variants" DROP COLUMN "source_key";
  ALTER TABLE "variants" DROP COLUMN "source_metadata_workbook_key";
  ALTER TABLE "variants" DROP COLUMN "source_metadata_file";
  ALTER TABLE "variants" DROP COLUMN "source_metadata_sheet";
  ALTER TABLE "variants" DROP COLUMN "source_metadata_catalog_code_raw";
  ALTER TABLE "_variants_v" DROP COLUMN "version_source_key";
  ALTER TABLE "_variants_v" DROP COLUMN "version_source_metadata_workbook_key";
  ALTER TABLE "_variants_v" DROP COLUMN "version_source_metadata_file";
  ALTER TABLE "_variants_v" DROP COLUMN "version_source_metadata_sheet";
  ALTER TABLE "_variants_v" DROP COLUMN "version_source_metadata_catalog_code_raw";
  ALTER TABLE "products" DROP COLUMN "source_key";
  ALTER TABLE "products" DROP COLUMN "source_metadata_workbook_key";
  ALTER TABLE "products" DROP COLUMN "source_metadata_identity_raw";
  ALTER TABLE "_products_v" DROP COLUMN "version_source_key";
  ALTER TABLE "_products_v" DROP COLUMN "version_source_metadata_workbook_key";
  ALTER TABLE "_products_v" DROP COLUMN "version_source_metadata_identity_raw";
  DROP TYPE "public"."enum_variants_measurements_unit";
  DROP TYPE "public"."enum__variants_v_version_measurements_unit";
  DROP TYPE "public"."enum_products_measurements_unit";
  DROP TYPE "public"."enum__products_v_version_measurements_unit";`)
}
