import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "carts" ADD COLUMN "storefront_customer_key" varchar;
  CREATE INDEX "carts_storefront_customer_key_idx" ON "carts" USING btree ("storefront_customer_key");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "carts_storefront_customer_key_idx";
  ALTER TABLE "carts" DROP COLUMN "storefront_customer_key";`)
}
