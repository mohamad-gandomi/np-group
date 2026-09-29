import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "products_measurements" ADD COLUMN "group_label_fa" varchar;
  ALTER TABLE "products_attributes" ADD COLUMN "key" varchar;
  ALTER TABLE "products_attributes" ADD COLUMN "display_label_fa" varchar;
  ALTER TABLE "_products_v_version_measurements" ADD COLUMN "group_label_fa" varchar;
  ALTER TABLE "_products_v_version_attributes" ADD COLUMN "key" varchar;
  ALTER TABLE "_products_v_version_attributes" ADD COLUMN "display_label_fa" varchar;
  ALTER TABLE "variants_measurements" ADD COLUMN "group_label_fa" varchar;
  ALTER TABLE "_variants_v_version_measurements" ADD COLUMN "group_label_fa" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "products_measurements" DROP COLUMN "group_label_fa";
  ALTER TABLE "products_attributes" DROP COLUMN "key";
  ALTER TABLE "products_attributes" DROP COLUMN "display_label_fa";
  ALTER TABLE "_products_v_version_measurements" DROP COLUMN "group_label_fa";
  ALTER TABLE "_products_v_version_attributes" DROP COLUMN "key";
  ALTER TABLE "_products_v_version_attributes" DROP COLUMN "display_label_fa";
  ALTER TABLE "variants_measurements" DROP COLUMN "group_label_fa";
  ALTER TABLE "_variants_v_version_measurements" DROP COLUMN "group_label_fa";`)
}
