import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_variants_availability_mode" AS ENUM('orderable', 'in_stock', 'unavailable');
  CREATE TYPE "public"."enum__variants_v_version_availability_mode" AS ENUM('orderable', 'in_stock', 'unavailable');
  CREATE TYPE "public"."enum_products_product_type" AS ENUM('simple', 'variable');
  CREATE TYPE "public"."enum__products_v_version_product_type" AS ENUM('simple', 'variable');
  CREATE TABLE "products_attributes" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "attribute_id" integer,
    "required" boolean DEFAULT false
  );

  CREATE TABLE "_products_v_version_attributes" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" serial PRIMARY KEY NOT NULL,
    "attribute_id" integer,
    "required" boolean DEFAULT false,
    "_uuid" varchar
  );

  ALTER TABLE "variants" ALTER COLUMN "shipping_mode" DROP DEFAULT;
  ALTER TABLE "_variants_v" ALTER COLUMN "version_shipping_mode" DROP DEFAULT;
  ALTER TABLE "products" ALTER COLUMN "sales_mode" SET DEFAULT 'made_to_order';
  ALTER TABLE "products" ALTER COLUMN "availability_mode" SET DEFAULT 'orderable';
  ALTER TABLE "_products_v" ALTER COLUMN "version_sales_mode" SET DEFAULT 'made_to_order';
  ALTER TABLE "_products_v" ALTER COLUMN "version_availability_mode" SET DEFAULT 'orderable';
  ALTER TABLE "variants" ADD COLUMN "combination_key" varchar;
  ALTER TABLE "variants" ADD COLUMN "availability_mode" "enum_variants_availability_mode";
  ALTER TABLE "variants" ADD COLUMN "main_image_id" integer;
  ALTER TABLE "_variants_v" ADD COLUMN "version_combination_key" varchar;
  ALTER TABLE "_variants_v" ADD COLUMN "version_availability_mode" "enum__variants_v_version_availability_mode";
  ALTER TABLE "_variants_v" ADD COLUMN "version_main_image_id" integer;
  ALTER TABLE "variant_types" ADD COLUMN "active" boolean DEFAULT true;
  ALTER TABLE "variant_types" ADD COLUMN "sort_order" numeric DEFAULT 0;
  ALTER TABLE "variant_types" ADD COLUMN "help_text_fa" varchar;
  ALTER TABLE "variant_options" ADD COLUMN "active" boolean DEFAULT true;
  ALTER TABLE "variant_options" ADD COLUMN "sort_order" numeric DEFAULT 0;
  ALTER TABLE "variant_options" ADD COLUMN "code" varchar;
  ALTER TABLE "variant_options" ADD COLUMN "group_label" varchar;
  ALTER TABLE "variant_options" ADD COLUMN "image_id" integer;
  ALTER TABLE "variant_options" ADD COLUMN "color_hex" varchar;
  ALTER TABLE "products" ADD COLUMN "product_type" "enum_products_product_type" DEFAULT 'simple';
  ALTER TABLE "products_rels" ADD COLUMN "variant_options_id" integer;
  ALTER TABLE "_products_v" ADD COLUMN "version_product_type" "enum__products_v_version_product_type" DEFAULT 'simple';
  ALTER TABLE "_products_v_rels" ADD COLUMN "variant_options_id" integer;
  ALTER TABLE "products_attributes" ADD CONSTRAINT "products_attributes_attribute_id_variant_types_id_fk" FOREIGN KEY ("attribute_id") REFERENCES "public"."variant_types"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "products_attributes" ADD CONSTRAINT "products_attributes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_products_v_version_attributes" ADD CONSTRAINT "_products_v_version_attributes_attribute_id_variant_types_id_fk" FOREIGN KEY ("attribute_id") REFERENCES "public"."variant_types"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_products_v_version_attributes" ADD CONSTRAINT "_products_v_version_attributes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_products_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "products_attributes_order_idx" ON "products_attributes" USING btree ("_order");
  CREATE INDEX "products_attributes_parent_id_idx" ON "products_attributes" USING btree ("_parent_id");
  CREATE INDEX "products_attributes_attribute_idx" ON "products_attributes" USING btree ("attribute_id");
  CREATE INDEX "_products_v_version_attributes_order_idx" ON "_products_v_version_attributes" USING btree ("_order");
  CREATE INDEX "_products_v_version_attributes_parent_id_idx" ON "_products_v_version_attributes" USING btree ("_parent_id");
  CREATE INDEX "_products_v_version_attributes_attribute_idx" ON "_products_v_version_attributes" USING btree ("attribute_id");
  ALTER TABLE "variants" ADD CONSTRAINT "variants_main_image_id_media_id_fk" FOREIGN KEY ("main_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_variants_v" ADD CONSTRAINT "_variants_v_version_main_image_id_media_id_fk" FOREIGN KEY ("version_main_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "variant_options" ADD CONSTRAINT "variant_options_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "products_rels" ADD CONSTRAINT "products_rels_variant_options_fk" FOREIGN KEY ("variant_options_id") REFERENCES "public"."variant_options"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_products_v_rels" ADD CONSTRAINT "_products_v_rels_variant_options_fk" FOREIGN KEY ("variant_options_id") REFERENCES "public"."variant_options"("id") ON DELETE cascade ON UPDATE no action;
  CREATE UNIQUE INDEX "variants_combination_key_idx" ON "variants" USING btree ("combination_key");
  CREATE INDEX "variants_main_image_idx" ON "variants" USING btree ("main_image_id");
  CREATE INDEX "_variants_v_version_version_combination_key_idx" ON "_variants_v" USING btree ("version_combination_key");
  CREATE INDEX "_variants_v_version_version_main_image_idx" ON "_variants_v" USING btree ("version_main_image_id");
  CREATE INDEX "variant_options_image_idx" ON "variant_options" USING btree ("image_id");
  CREATE INDEX "products_rels_variant_options_id_idx" ON "products_rels" USING btree ("variant_options_id");
  CREATE INDEX "_products_v_rels_variant_options_id_idx" ON "_products_v_rels" USING btree ("variant_options_id");
  COMMENT ON TABLE "products_attributes" IS 'Unified catalog: explicit product attribute assignments';`)
}

export async function down(_args: MigrateDownArgs): Promise<void> {
  throw new Error('Forward-only catalog expansion: restore the pre-migration backup to roll back safely.');
}
