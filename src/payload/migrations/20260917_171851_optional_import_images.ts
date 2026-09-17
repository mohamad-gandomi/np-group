import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "projects_gallery" ALTER COLUMN "image_id" DROP NOT NULL;
  ALTER TABLE "projects_gallery" ALTER COLUMN "alt" DROP NOT NULL;
  ALTER TABLE "projects" ALTER COLUMN "hero_media_id" DROP NOT NULL;
  ALTER TABLE "projects" ALTER COLUMN "hero_alt" DROP NOT NULL;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "projects_gallery" ALTER COLUMN "image_id" SET NOT NULL;
  ALTER TABLE "projects_gallery" ALTER COLUMN "alt" SET NOT NULL;
  ALTER TABLE "projects" ALTER COLUMN "hero_media_id" SET NOT NULL;
  ALTER TABLE "projects" ALTER COLUMN "hero_alt" SET NOT NULL;`)
}
