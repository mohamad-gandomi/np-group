import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "addresses" ADD COLUMN IF NOT EXISTS "display_label" varchar;
  CREATE INDEX IF NOT EXISTS "addresses_display_label_idx" ON "addresses" USING btree ("display_label");

  UPDATE "addresses"
  SET "display_label" = CONCAT_WS(
    ' - ',
    COALESCE(NULLIF(BTRIM("title"), ''), 'آدرس'),
    NULLIF(BTRIM("city"), ''),
    NULLIF(BTRIM("address_line1"), '')
  );`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "addresses_display_label_idx";
  ALTER TABLE "addresses" DROP COLUMN "display_label";`)
}
