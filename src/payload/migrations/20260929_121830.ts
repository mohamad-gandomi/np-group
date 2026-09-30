import { MigrateUpArgs, MigrateDownArgs, sql } from "@payloadcms/db-postgres";

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_users_role" ADD VALUE 'content-agent';
  CREATE TABLE "payload_mcp_api_keys" (
    "id" serial PRIMARY KEY NOT NULL,
    "user_id" integer NOT NULL,
    "label" varchar,
    "description" varchar,
    "products_find" boolean DEFAULT false,
    "products_create" boolean DEFAULT false,
    "products_update" boolean DEFAULT false,
    "variants_find" boolean DEFAULT false,
    "variants_create" boolean DEFAULT false,
    "variants_update" boolean DEFAULT false,
    "variant_types_find" boolean DEFAULT false,
    "variant_types_create" boolean DEFAULT false,
    "variant_types_update" boolean DEFAULT false,
    "variant_options_find" boolean DEFAULT false,
    "variant_options_create" boolean DEFAULT false,
    "variant_options_update" boolean DEFAULT false,
    "categories_find" boolean DEFAULT false,
    "categories_create" boolean DEFAULT false,
    "categories_update" boolean DEFAULT false,
    "brands_find" boolean DEFAULT false,
    "brands_create" boolean DEFAULT false,
    "brands_update" boolean DEFAULT false,
    "posts_find" boolean DEFAULT false,
    "posts_create" boolean DEFAULT false,
    "posts_update" boolean DEFAULT false,
    "blog_categories_find" boolean DEFAULT false,
    "blog_categories_create" boolean DEFAULT false,
    "blog_categories_update" boolean DEFAULT false,
    "projects_find" boolean DEFAULT false,
    "projects_create" boolean DEFAULT false,
    "projects_update" boolean DEFAULT false,
    "media_find" boolean DEFAULT false,
    "media_create" boolean DEFAULT false,
    "media_update" boolean DEFAULT false,
    "payload_mcp_tool_catalog_find_existing" boolean DEFAULT true,
    "payload_mcp_tool_catalog_create_product_draft" boolean DEFAULT true,
    "payload_mcp_tool_content_create_article_draft" boolean DEFAULT true,
    "payload_mcp_tool_content_create_project_draft" boolean DEFAULT true,
    "payload_mcp_tool_content_create_brand_draft" boolean DEFAULT true,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "enable_a_p_i_key" boolean,
    "api_key" varchar,
    "api_key_index" varchar
  );

  ALTER TABLE "categories" ALTER COLUMN "published" SET DEFAULT false;
  ALTER TABLE "brands" ALTER COLUMN "published" SET DEFAULT false;
  ALTER TABLE "projects" ALTER COLUMN "published" SET DEFAULT false;
  ALTER TABLE "blog_categories" ALTER COLUMN "published" SET DEFAULT false;
  ALTER TABLE "posts_rels" ADD COLUMN "products_id" integer;
  ALTER TABLE "_posts_v_rels" ADD COLUMN "products_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "payload_mcp_api_keys_id" integer;
  ALTER TABLE "payload_preferences_rels" ADD COLUMN "payload_mcp_api_keys_id" integer;
  ALTER TABLE "payload_mcp_api_keys" ADD CONSTRAINT "payload_mcp_api_keys_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "payload_mcp_api_keys_user_idx" ON "payload_mcp_api_keys" USING btree ("user_id");
  CREATE INDEX "payload_mcp_api_keys_updated_at_idx" ON "payload_mcp_api_keys" USING btree ("updated_at");
  CREATE INDEX "payload_mcp_api_keys_created_at_idx" ON "payload_mcp_api_keys" USING btree ("created_at");
  ALTER TABLE "posts_rels" ADD CONSTRAINT "posts_rels_products_fk" FOREIGN KEY ("products_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_posts_v_rels" ADD CONSTRAINT "_posts_v_rels_products_fk" FOREIGN KEY ("products_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_payload_mcp_api_keys_fk" FOREIGN KEY ("payload_mcp_api_keys_id") REFERENCES "public"."payload_mcp_api_keys"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_payload_mcp_api_keys_fk" FOREIGN KEY ("payload_mcp_api_keys_id") REFERENCES "public"."payload_mcp_api_keys"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "posts_rels_products_id_idx" ON "posts_rels" USING btree ("products_id");
  CREATE INDEX "_posts_v_rels_products_id_idx" ON "_posts_v_rels" USING btree ("products_id");
  CREATE INDEX "payload_locked_documents_rels_payload_mcp_api_keys_id_idx" ON "payload_locked_documents_rels" USING btree ("payload_mcp_api_keys_id");
  CREATE INDEX "payload_preferences_rels_payload_mcp_api_keys_id_idx" ON "payload_preferences_rels" USING btree ("payload_mcp_api_keys_id");`);
}

export async function down({
  db,
  payload,
  req,
}: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload_mcp_api_keys" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "payload_mcp_api_keys" CASCADE;
  ALTER TABLE "posts_rels" DROP CONSTRAINT "posts_rels_products_fk";

  ALTER TABLE "_posts_v_rels" DROP CONSTRAINT "_posts_v_rels_products_fk";

  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_payload_mcp_api_keys_fk";

  ALTER TABLE "payload_preferences_rels" DROP CONSTRAINT "payload_preferences_rels_payload_mcp_api_keys_fk";

  ALTER TABLE "users" ALTER COLUMN "role" SET DATA TYPE text;
  ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'admin'::text;
  DROP TYPE "public"."enum_users_role";
  CREATE TYPE "public"."enum_users_role" AS ENUM('admin', 'editor', 'seller');
  ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'admin'::"public"."enum_users_role";
  ALTER TABLE "users" ALTER COLUMN "role" SET DATA TYPE "public"."enum_users_role" USING "role"::"public"."enum_users_role";
  DROP INDEX "posts_rels_products_id_idx";
  DROP INDEX "_posts_v_rels_products_id_idx";
  DROP INDEX "payload_locked_documents_rels_payload_mcp_api_keys_id_idx";
  DROP INDEX "payload_preferences_rels_payload_mcp_api_keys_id_idx";
  ALTER TABLE "categories" ALTER COLUMN "published" SET DEFAULT true;
  ALTER TABLE "brands" ALTER COLUMN "published" SET DEFAULT true;
  ALTER TABLE "projects" ALTER COLUMN "published" SET DEFAULT true;
  ALTER TABLE "blog_categories" ALTER COLUMN "published" SET DEFAULT true;
  ALTER TABLE "posts_rels" DROP COLUMN "products_id";
  ALTER TABLE "_posts_v_rels" DROP COLUMN "products_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "payload_mcp_api_keys_id";
  ALTER TABLE "payload_preferences_rels" DROP COLUMN "payload_mcp_api_keys_id";`);
}
