import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TYPE "public"."enum_variant_types_catalog_filter_presentation" AS ENUM('checkbox', 'swatch');
    CREATE TYPE "public"."enum_variant_types_catalog_filter_placement" AS ENUM('primary', 'more');

    ALTER TABLE "variant_types"
      ADD COLUMN "catalog_filter_enabled" boolean DEFAULT false,
      ADD COLUMN "catalog_filter_label" varchar,
      ADD COLUMN "catalog_filter_presentation" "enum_variant_types_catalog_filter_presentation" DEFAULT 'checkbox',
      ADD COLUMN "catalog_filter_placement" "enum_variant_types_catalog_filter_placement" DEFAULT 'more',
      ADD COLUMN "catalog_filter_order" numeric DEFAULT 0;

    UPDATE "variant_types"
      SET "catalog_filter_enabled" = true,
          "catalog_filter_label" = 'رنگ چوب',
          "catalog_filter_presentation" = 'swatch',
          "catalog_filter_placement" = 'primary',
          "catalog_filter_order" = 10
      WHERE "name" = 'wood-finish';
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "variant_types"
      DROP COLUMN "catalog_filter_enabled",
      DROP COLUMN "catalog_filter_label",
      DROP COLUMN "catalog_filter_presentation",
      DROP COLUMN "catalog_filter_placement",
      DROP COLUMN "catalog_filter_order";

    DROP TYPE "public"."enum_variant_types_catalog_filter_presentation";
    DROP TYPE "public"."enum_variant_types_catalog_filter_placement";
  `)
}
