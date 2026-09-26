import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_variant_types_catalog_filter_scope" AS ENUM('all', 'categories');
  CREATE TABLE "variant_types_rels" (
    "id" serial PRIMARY KEY NOT NULL,
    "order" integer,
    "parent_id" integer NOT NULL,
    "path" varchar NOT NULL,
    "categories_id" integer
  );

  ALTER TABLE "variant_types" ADD COLUMN "catalog_filter_scope" "enum_variant_types_catalog_filter_scope" DEFAULT 'all';
  ALTER TABLE "variant_types_rels" ADD CONSTRAINT "variant_types_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."variant_types"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "variant_types_rels" ADD CONSTRAINT "variant_types_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "variant_types_rels_order_idx" ON "variant_types_rels" USING btree ("order");
  CREATE INDEX "variant_types_rels_parent_idx" ON "variant_types_rels" USING btree ("parent_id");
  CREATE INDEX "variant_types_rels_path_idx" ON "variant_types_rels" USING btree ("path");
  CREATE INDEX "variant_types_rels_categories_id_idx" ON "variant_types_rels" USING btree ("categories_id");
  ALTER TABLE "products_technical_specs" DROP COLUMN "group";
  ALTER TABLE "_products_v_version_technical_specs" DROP COLUMN "group";
  DROP TYPE "public"."enum_products_technical_specs_group";
  DROP TYPE "public"."enum__products_v_version_technical_specs_group";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_products_technical_specs_group" AS ENUM('identity', 'construction', 'materials', 'comfort', 'finish', 'delivery', 'care', 'other');
  CREATE TYPE "public"."enum__products_v_version_technical_specs_group" AS ENUM('identity', 'construction', 'materials', 'comfort', 'finish', 'delivery', 'care', 'other');
  DROP TABLE "variant_types_rels" CASCADE;
  ALTER TABLE "products_technical_specs" ADD COLUMN "group" "enum_products_technical_specs_group";
  ALTER TABLE "_products_v_version_technical_specs" ADD COLUMN "group" "enum__products_v_version_technical_specs_group";
  ALTER TABLE "variant_types" DROP COLUMN "catalog_filter_scope";
  DROP TYPE "public"."enum_variant_types_catalog_filter_scope";`)
}
