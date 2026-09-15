import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  CREATE TABLE "blog_categories" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"description" varchar,
  	"sort_order" numeric DEFAULT 0,
  	"published" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  INSERT INTO "blog_categories" ("title", "slug", "sort_order", "published") VALUES
    ('راهنمای انتخاب', 'planning', 1, true),
    ('بافت و متریال', 'materials', 2, true),
    ('نور و فضا', 'lighting', 3, true),
    ('هنر زندگی', 'living', 4, true);
  
  ALTER TABLE "posts" ADD COLUMN "category_id" integer;
  ALTER TABLE "_posts_v" ADD COLUMN "version_category_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "blog_categories_id" integer;
  UPDATE "posts" AS post
  SET "category_id" = category."id"
  FROM "blog_categories" AS category
  WHERE category."slug" = post."category"::text;
  UPDATE "_posts_v" AS version
  SET "version_category_id" = category."id"
  FROM "blog_categories" AS category
  WHERE category."slug" = version."version_category"::text;
  CREATE UNIQUE INDEX "blog_categories_slug_idx" ON "blog_categories" USING btree ("slug");
  CREATE INDEX "blog_categories_updated_at_idx" ON "blog_categories" USING btree ("updated_at");
  CREATE INDEX "blog_categories_created_at_idx" ON "blog_categories" USING btree ("created_at");
  ALTER TABLE "posts" ADD CONSTRAINT "posts_category_id_blog_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."blog_categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_posts_v" ADD CONSTRAINT "_posts_v_version_category_id_blog_categories_id_fk" FOREIGN KEY ("version_category_id") REFERENCES "public"."blog_categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_blog_categories_fk" FOREIGN KEY ("blog_categories_id") REFERENCES "public"."blog_categories"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "posts_category_idx" ON "posts" USING btree ("category_id");
  CREATE INDEX "_posts_v_version_version_category_idx" ON "_posts_v" USING btree ("version_category_id");
  CREATE INDEX "payload_locked_documents_rels_blog_categories_id_idx" ON "payload_locked_documents_rels" USING btree ("blog_categories_id");
  ALTER TABLE "posts" DROP COLUMN "category";
  ALTER TABLE "_posts_v" DROP COLUMN "version_category";
  DROP TYPE "public"."enum_posts_category";
  DROP TYPE "public"."enum__posts_v_version_category";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_posts_category" AS ENUM('planning', 'materials', 'lighting', 'living');
  CREATE TYPE "public"."enum__posts_v_version_category" AS ENUM('planning', 'materials', 'lighting', 'living');
  ALTER TABLE "posts" ADD COLUMN "category" "enum_posts_category";
  ALTER TABLE "_posts_v" ADD COLUMN "version_category" "enum__posts_v_version_category";
  UPDATE "posts" AS post
  SET "category" = category."slug"::"enum_posts_category"
  FROM "blog_categories" AS category
  WHERE category."id" = post."category_id"
    AND category."slug" IN ('planning', 'materials', 'lighting', 'living');
  UPDATE "_posts_v" AS version
  SET "version_category" = category."slug"::"enum__posts_v_version_category"
  FROM "blog_categories" AS category
  WHERE category."id" = version."version_category_id"
    AND category."slug" IN ('planning', 'materials', 'lighting', 'living');
  ALTER TABLE "posts" DROP CONSTRAINT "posts_category_id_blog_categories_id_fk";
  
  ALTER TABLE "_posts_v" DROP CONSTRAINT "_posts_v_version_category_id_blog_categories_id_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_blog_categories_fk";
  
  DROP INDEX "posts_category_idx";
  DROP INDEX "_posts_v_version_version_category_idx";
  DROP INDEX "payload_locked_documents_rels_blog_categories_id_idx";
  ALTER TABLE "posts" DROP COLUMN "category_id";
  ALTER TABLE "_posts_v" DROP COLUMN "version_category_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "blog_categories_id";
  ALTER TABLE "blog_categories" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "blog_categories" CASCADE;`)
}
