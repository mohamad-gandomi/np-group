import { MigrateUpArgs, MigrateDownArgs, sql } from "@payloadcms/db-postgres";

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "posts_rels" ADD COLUMN "brands_id" integer;
  ALTER TABLE "_posts_v_rels" ADD COLUMN "brands_id" integer;
  ALTER TABLE "posts_rels" ADD CONSTRAINT "posts_rels_brands_fk" FOREIGN KEY ("brands_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_posts_v_rels" ADD CONSTRAINT "_posts_v_rels_brands_fk" FOREIGN KEY ("brands_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "posts_rels_brands_id_idx" ON "posts_rels" USING btree ("brands_id");
  CREATE INDEX "_posts_v_rels_brands_id_idx" ON "_posts_v_rels" USING btree ("brands_id");`);
}

export async function down({
  db,
  payload,
  req,
}: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "posts_rels" DROP CONSTRAINT "posts_rels_brands_fk";

  ALTER TABLE "_posts_v_rels" DROP CONSTRAINT "_posts_v_rels_brands_fk";

  DROP INDEX "posts_rels_brands_id_idx";
  DROP INDEX "_posts_v_rels_brands_id_idx";
  ALTER TABLE "posts_rels" DROP COLUMN "brands_id";
  ALTER TABLE "_posts_v_rels" DROP COLUMN "brands_id";`);
}
