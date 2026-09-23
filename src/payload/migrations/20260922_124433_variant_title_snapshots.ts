import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "carts_items" ADD COLUMN "variant_title_snapshot" varchar;
  ALTER TABLE "orders_items" ADD COLUMN "variant_title_snapshot" varchar;
  ALTER TABLE "transactions_items" ADD COLUMN "variant_title_snapshot" varchar;`)
}

export async function down(_args: MigrateDownArgs): Promise<void> {
  throw new Error('Forward-only migration: restoring the pre-migration backup is required to preserve historical item snapshots.')
}
