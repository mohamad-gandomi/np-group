import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    UPDATE "variant_types"
    SET "catalog_filter_enabled" = true,
        "catalog_filter_label" = 'رنگ چوب',
        "catalog_filter_presentation" = 'swatch',
        "catalog_filter_placement" = 'primary',
        "catalog_filter_order" = 10,
        "catalog_filter_scope" = 'all'
    WHERE "name" = 'wood-finish';

    UPDATE "variant_types"
    SET "catalog_filter_scope" = 'categories'
    WHERE "name" = 'bed-width'
      AND "catalog_filter_enabled" = true
      AND EXISTS (SELECT 1 FROM "categories" WHERE "slug" = 'bedroom-furniture');

    DELETE FROM "variant_types_rels" AS relation
    USING "variant_types" AS attribute
    WHERE relation."parent_id" = attribute."id"
      AND relation."path" = 'catalogFilterCategories'
      AND (attribute."catalog_filter_enabled" IS DISTINCT FROM true
        OR attribute."catalog_filter_scope" IS DISTINCT FROM 'categories');

    INSERT INTO "variant_types_rels" ("order", "parent_id", "path", "categories_id")
    SELECT 0, attribute."id", 'catalogFilterCategories', category."id"
    FROM "variant_types" AS attribute
    CROSS JOIN "categories" AS category
    WHERE attribute."name" = 'bed-width'
      AND attribute."catalog_filter_enabled" = true
      AND category."slug" = 'bedroom-furniture'
      AND NOT EXISTS (
        SELECT 1
        FROM "variant_types_rels" AS existing
        WHERE existing."parent_id" = attribute."id"
          AND existing."path" = 'catalogFilterCategories'
          AND existing."categories_id" = category."id"
      );
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DELETE FROM "variant_types_rels" AS relation
    USING "variant_types" AS attribute, "categories" AS category
    WHERE relation."parent_id" = attribute."id"
      AND relation."categories_id" = category."id"
      AND relation."path" = 'catalogFilterCategories'
      AND attribute."name" = 'bed-width'
      AND category."slug" = 'bedroom-furniture';

    UPDATE "variant_types"
    SET "catalog_filter_scope" = 'all'
    WHERE "name" = 'bed-width';
  `)
}
