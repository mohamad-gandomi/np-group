import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  CREATE TYPE "public"."enum_projects_sector" AS ENUM('residential', 'hospitality', 'commercial', 'workplace', 'healthcare');
  ALTER TYPE "public"."enum_users_role" ADD VALUE 'seller';
  CREATE TABLE "projects_gallery" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "image_id" integer NOT NULL,
    "alt" varchar NOT NULL,
    "caption" varchar
  );

  CREATE TABLE "projects_approach" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "title" varchar NOT NULL,
    "text" varchar NOT NULL
  );

  CREATE TABLE "projects_palette" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "name" varchar NOT NULL,
    "color" varchar NOT NULL
  );

  CREATE TABLE "projects" (
    "id" serial PRIMARY KEY NOT NULL,
    "title" varchar NOT NULL,
    "slug" varchar NOT NULL,
    "sector" "enum_projects_sector" NOT NULL,
    "description_fa" varchar NOT NULL,
    "brief_fa" varchar NOT NULL,
    "hero_media_id" integer NOT NULL,
    "hero_alt" varchar NOT NULL,
    "hero_caption" varchar,
    "article_id" integer,
    "featured" boolean DEFAULT false,
    "sort_order" numeric DEFAULT 0,
    "published" boolean DEFAULT true,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE "projects_rels" (
    "id" serial PRIMARY KEY NOT NULL,
    "order" integer,
    "parent_id" integer NOT NULL,
    "path" varchar NOT NULL,
    "products_id" integer
  );

  ALTER TABLE "users" ADD COLUMN "contact_title" varchar;
  ALTER TABLE "users" ADD COLUMN "contact_description" varchar;
  ALTER TABLE "users" ADD COLUMN "whatsapp_phone" varchar;
  ALTER TABLE "brands" ADD COLUMN "tagline_fa" varchar;
  ALTER TABLE "brands" ADD COLUMN "story_fa" varchar;
  ALTER TABLE "brands" ADD COLUMN "hero_media_id" integer;
  ALTER TABLE "brands" ADD COLUMN "hero_alt" varchar;
  ALTER TABLE "brands" ADD COLUMN "hero_caption" varchar;
  ALTER TABLE "brands" ADD COLUMN "featured" boolean DEFAULT false;
  ALTER TABLE "brands" ADD COLUMN "sort_order" numeric DEFAULT 0;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "projects_id" integer;
  ALTER TABLE "projects_gallery" ADD CONSTRAINT "projects_gallery_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "projects_gallery" ADD CONSTRAINT "projects_gallery_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_approach" ADD CONSTRAINT "projects_approach_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_palette" ADD CONSTRAINT "projects_palette_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects" ADD CONSTRAINT "projects_hero_media_id_media_id_fk" FOREIGN KEY ("hero_media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "projects" ADD CONSTRAINT "projects_article_id_posts_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."posts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "projects_rels" ADD CONSTRAINT "projects_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_rels" ADD CONSTRAINT "projects_rels_products_fk" FOREIGN KEY ("products_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "projects_gallery_order_idx" ON "projects_gallery" USING btree ("_order");
  CREATE INDEX "projects_gallery_parent_id_idx" ON "projects_gallery" USING btree ("_parent_id");
  CREATE INDEX "projects_gallery_image_idx" ON "projects_gallery" USING btree ("image_id");
  CREATE INDEX "projects_approach_order_idx" ON "projects_approach" USING btree ("_order");
  CREATE INDEX "projects_approach_parent_id_idx" ON "projects_approach" USING btree ("_parent_id");
  CREATE INDEX "projects_palette_order_idx" ON "projects_palette" USING btree ("_order");
  CREATE INDEX "projects_palette_parent_id_idx" ON "projects_palette" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "projects_slug_idx" ON "projects" USING btree ("slug");
  CREATE INDEX "projects_hero_media_idx" ON "projects" USING btree ("hero_media_id");
  CREATE INDEX "projects_article_idx" ON "projects" USING btree ("article_id");
  CREATE INDEX "projects_updated_at_idx" ON "projects" USING btree ("updated_at");
  CREATE INDEX "projects_created_at_idx" ON "projects" USING btree ("created_at");
  CREATE INDEX "projects_rels_order_idx" ON "projects_rels" USING btree ("order");
  CREATE INDEX "projects_rels_parent_idx" ON "projects_rels" USING btree ("parent_id");
  CREATE INDEX "projects_rels_path_idx" ON "projects_rels" USING btree ("path");
  CREATE INDEX "projects_rels_products_id_idx" ON "projects_rels" USING btree ("products_id");
  ALTER TABLE "brands" ADD CONSTRAINT "brands_hero_media_id_media_id_fk" FOREIGN KEY ("hero_media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_projects_fk" FOREIGN KEY ("projects_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "brands_hero_media_idx" ON "brands" USING btree ("hero_media_id");
  CREATE INDEX "payload_locked_documents_rels_projects_id_idx" ON "payload_locked_documents_rels" USING btree ("projects_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "projects_gallery" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "projects_approach" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "projects_palette" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "projects" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "projects_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "projects_gallery" CASCADE;
  DROP TABLE "projects_approach" CASCADE;
  DROP TABLE "projects_palette" CASCADE;
  DROP TABLE "projects" CASCADE;
  DROP TABLE "projects_rels" CASCADE;
  ALTER TABLE "brands" DROP CONSTRAINT "brands_hero_media_id_media_id_fk";

  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_projects_fk";

  ALTER TABLE "users" ALTER COLUMN "role" SET DATA TYPE text;
  ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'admin'::text;
  DROP TYPE "public"."enum_users_role";
  CREATE TYPE "public"."enum_users_role" AS ENUM('admin', 'editor');
  ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'admin'::"public"."enum_users_role";
  ALTER TABLE "users" ALTER COLUMN "role" SET DATA TYPE "public"."enum_users_role" USING "role"::"public"."enum_users_role";
  DROP INDEX "brands_hero_media_idx";
  DROP INDEX "payload_locked_documents_rels_projects_id_idx";
  ALTER TABLE "users" DROP COLUMN "contact_title";
  ALTER TABLE "users" DROP COLUMN "contact_description";
  ALTER TABLE "users" DROP COLUMN "whatsapp_phone";
  ALTER TABLE "brands" DROP COLUMN "tagline_fa";
  ALTER TABLE "brands" DROP COLUMN "story_fa";
  ALTER TABLE "brands" DROP COLUMN "hero_media_id";
  ALTER TABLE "brands" DROP COLUMN "hero_alt";
  ALTER TABLE "brands" DROP COLUMN "hero_caption";
  ALTER TABLE "brands" DROP COLUMN "featured";
  ALTER TABLE "brands" DROP COLUMN "sort_order";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "projects_id";
  DROP TYPE "public"."enum_projects_sector";`)
}
