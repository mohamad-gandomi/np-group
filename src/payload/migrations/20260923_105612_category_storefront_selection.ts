import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "categories" ADD COLUMN "show_on_storefront" boolean DEFAULT false;
  CREATE INDEX "categories_show_on_storefront_idx" ON "categories" USING btree ("show_on_storefront");

  WITH "selected_categories" AS (
    SELECT "id"
    FROM "categories"
    WHERE "published" = true
    ORDER BY "sort_order" ASC NULLS LAST, "id" ASC
    LIMIT 6
  )
  UPDATE "categories"
  SET "show_on_storefront" = true
  WHERE "id" IN (SELECT "id" FROM "selected_categories");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "categories_show_on_storefront_idx";
  ALTER TABLE "categories" DROP COLUMN "show_on_storefront";`)
}
