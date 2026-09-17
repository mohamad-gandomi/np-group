import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_exports_format" AS ENUM('csv', 'json');
  CREATE TYPE "public"."enum_exports_sort_order" AS ENUM('asc', 'desc');
  CREATE TYPE "public"."enum_exports_drafts" AS ENUM('yes', 'no');
  CREATE TYPE "public"."enum_imports_import_mode" AS ENUM('create', 'update', 'upsert');
  CREATE TYPE "public"."enum_imports_status" AS ENUM('pending', 'completed', 'partial', 'failed');
  CREATE TYPE "public"."enum_payload_jobs_log_task_slug" AS ENUM('inline', 'cleanupDataTransferFiles', 'createCollectionExport', 'createCollectionImport');
  CREATE TYPE "public"."enum_payload_jobs_log_state" AS ENUM('failed', 'succeeded');
  CREATE TYPE "public"."enum_payload_jobs_task_slug" AS ENUM('inline', 'cleanupDataTransferFiles', 'createCollectionExport', 'createCollectionImport');
  CREATE TABLE "exports" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar,
	"format" "enum_exports_format" DEFAULT 'csv' NOT NULL,
	"limit" numeric,
	"page" numeric DEFAULT 1,
	"sort" varchar,
	"sort_order" "enum_exports_sort_order",
	"drafts" "enum_exports_drafts" DEFAULT 'yes',
	"collection_slug" varchar DEFAULT 'brands' NOT NULL,
	"where" jsonb DEFAULT '{}'::jsonb,
	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"url" varchar,
	"thumbnail_u_r_l" varchar,
	"filename" varchar,
	"mime_type" varchar,
	"filesize" numeric,
	"width" numeric,
	"height" numeric,
	"focal_x" numeric,
	"focal_y" numeric
  );

  CREATE TABLE "exports_texts" (
	"id" serial PRIMARY KEY NOT NULL,
	"order" integer NOT NULL,
	"parent_id" integer NOT NULL,
	"path" varchar NOT NULL,
	"text" varchar
  );

  CREATE TABLE "imports" (
	"id" serial PRIMARY KEY NOT NULL,
	"collection_slug" varchar DEFAULT 'brands' NOT NULL,
	"import_mode" "enum_imports_import_mode",
	"match_field" varchar DEFAULT 'id',
	"status" "enum_imports_status" DEFAULT 'pending',
	"summary_imported" numeric,
	"summary_updated" numeric,
	"summary_total" numeric,
	"summary_issues" numeric,
	"summary_issue_details" jsonb,
	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"url" varchar,
	"thumbnail_u_r_l" varchar,
	"filename" varchar,
	"mime_type" varchar,
	"filesize" numeric,
	"width" numeric,
	"height" numeric,
	"focal_x" numeric,
	"focal_y" numeric
  );

  CREATE TABLE "payload_jobs_log" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"executed_at" timestamp(3) with time zone NOT NULL,
	"completed_at" timestamp(3) with time zone NOT NULL,
	"task_slug" "enum_payload_jobs_log_task_slug" NOT NULL,
	"task_i_d" varchar NOT NULL,
	"input" jsonb,
	"output" jsonb,
	"state" "enum_payload_jobs_log_state" NOT NULL,
	"error" jsonb
  );

  CREATE TABLE "payload_jobs" (
	"id" serial PRIMARY KEY NOT NULL,
	"input" jsonb,
	"completed_at" timestamp(3) with time zone,
	"total_tried" numeric DEFAULT 0,
	"has_error" boolean DEFAULT false,
	"error" jsonb,
	"task_slug" "enum_payload_jobs_task_slug",
	"queue" varchar DEFAULT 'default',
	"wait_until" timestamp(3) with time zone,
	"processing" boolean DEFAULT false,
	"meta" jsonb,
	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE "payload_jobs_stats" (
	"id" serial PRIMARY KEY NOT NULL,
	"stats" jsonb,
	"updated_at" timestamp(3) with time zone,
	"created_at" timestamp(3) with time zone
  );

  DROP INDEX "variants_source_key_idx";
  DROP INDEX "_variants_v_version_version_source_key_idx";
  DROP INDEX "products_source_key_idx";
  DROP INDEX "_products_v_version_version_source_key_idx";
  ALTER TABLE "exports_texts" ADD CONSTRAINT "exports_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."exports"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_jobs_log" ADD CONSTRAINT "payload_jobs_log_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."payload_jobs"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "exports_updated_at_idx" ON "exports" USING btree ("updated_at");
  CREATE INDEX "exports_created_at_idx" ON "exports" USING btree ("created_at");
  CREATE UNIQUE INDEX "exports_filename_idx" ON "exports" USING btree ("filename");
  CREATE INDEX "exports_texts_order_parent" ON "exports_texts" USING btree ("order","parent_id");
  CREATE INDEX "imports_updated_at_idx" ON "imports" USING btree ("updated_at");
  CREATE INDEX "imports_created_at_idx" ON "imports" USING btree ("created_at");
  CREATE UNIQUE INDEX "imports_filename_idx" ON "imports" USING btree ("filename");
  CREATE INDEX "payload_jobs_log_order_idx" ON "payload_jobs_log" USING btree ("_order");
  CREATE INDEX "payload_jobs_log_parent_id_idx" ON "payload_jobs_log" USING btree ("_parent_id");
  CREATE INDEX "payload_jobs_completed_at_idx" ON "payload_jobs" USING btree ("completed_at");
  CREATE INDEX "payload_jobs_total_tried_idx" ON "payload_jobs" USING btree ("total_tried");
  CREATE INDEX "payload_jobs_has_error_idx" ON "payload_jobs" USING btree ("has_error");
  CREATE INDEX "payload_jobs_task_slug_idx" ON "payload_jobs" USING btree ("task_slug");
  CREATE INDEX "payload_jobs_queue_idx" ON "payload_jobs" USING btree ("queue");
  CREATE INDEX "payload_jobs_wait_until_idx" ON "payload_jobs" USING btree ("wait_until");
  CREATE INDEX "payload_jobs_processing_idx" ON "payload_jobs" USING btree ("processing");
  CREATE INDEX "payload_jobs_updated_at_idx" ON "payload_jobs" USING btree ("updated_at");
  CREATE INDEX "payload_jobs_created_at_idx" ON "payload_jobs" USING btree ("created_at");
  ALTER TABLE "variants" DROP COLUMN "source_key";
  ALTER TABLE "variants" DROP COLUMN "source_metadata_workbook_key";
  ALTER TABLE "variants" DROP COLUMN "source_metadata_file";
  ALTER TABLE "variants" DROP COLUMN "source_metadata_sheet";
  ALTER TABLE "variants" DROP COLUMN "source_metadata_identity_raw";
  ALTER TABLE "variants" DROP COLUMN "source_metadata_catalog_code_raw";
  ALTER TABLE "variants" DROP COLUMN "source_metadata_data_quality_notes";
  ALTER TABLE "_variants_v" DROP COLUMN "version_source_key";
  ALTER TABLE "_variants_v" DROP COLUMN "version_source_metadata_workbook_key";
  ALTER TABLE "_variants_v" DROP COLUMN "version_source_metadata_file";
  ALTER TABLE "_variants_v" DROP COLUMN "version_source_metadata_sheet";
  ALTER TABLE "_variants_v" DROP COLUMN "version_source_metadata_identity_raw";
  ALTER TABLE "_variants_v" DROP COLUMN "version_source_metadata_catalog_code_raw";
  ALTER TABLE "_variants_v" DROP COLUMN "version_source_metadata_data_quality_notes";
  ALTER TABLE "products" DROP COLUMN "source_key";
  ALTER TABLE "products" DROP COLUMN "source_metadata_workbook_key";
  ALTER TABLE "products" DROP COLUMN "source_metadata_file";
  ALTER TABLE "products" DROP COLUMN "source_metadata_sheet";
  ALTER TABLE "products" DROP COLUMN "source_metadata_identity_raw";
  ALTER TABLE "products" DROP COLUMN "source_metadata_catalog_code_raw";
  ALTER TABLE "products" DROP COLUMN "source_metadata_data_quality_notes";
  ALTER TABLE "_products_v" DROP COLUMN "version_source_key";
  ALTER TABLE "_products_v" DROP COLUMN "version_source_metadata_workbook_key";
  ALTER TABLE "_products_v" DROP COLUMN "version_source_metadata_file";
  ALTER TABLE "_products_v" DROP COLUMN "version_source_metadata_sheet";
  ALTER TABLE "_products_v" DROP COLUMN "version_source_metadata_identity_raw";
  ALTER TABLE "_products_v" DROP COLUMN "version_source_metadata_catalog_code_raw";
  ALTER TABLE "_products_v" DROP COLUMN "version_source_metadata_data_quality_notes";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "exports" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "exports_texts" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "imports" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload_jobs_log" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload_jobs" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload_jobs_stats" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "exports" CASCADE;
  DROP TABLE "exports_texts" CASCADE;
  DROP TABLE "imports" CASCADE;
  DROP TABLE "payload_jobs_log" CASCADE;
  DROP TABLE "payload_jobs" CASCADE;
  DROP TABLE "payload_jobs_stats" CASCADE;
  ALTER TABLE "variants" ADD COLUMN "source_key" varchar;
  ALTER TABLE "variants" ADD COLUMN "source_metadata_workbook_key" varchar;
  ALTER TABLE "variants" ADD COLUMN "source_metadata_file" varchar;
  ALTER TABLE "variants" ADD COLUMN "source_metadata_sheet" varchar;
  ALTER TABLE "variants" ADD COLUMN "source_metadata_identity_raw" varchar;
  ALTER TABLE "variants" ADD COLUMN "source_metadata_catalog_code_raw" varchar;
  ALTER TABLE "variants" ADD COLUMN "source_metadata_data_quality_notes" varchar;
  ALTER TABLE "_variants_v" ADD COLUMN "version_source_key" varchar;
  ALTER TABLE "_variants_v" ADD COLUMN "version_source_metadata_workbook_key" varchar;
  ALTER TABLE "_variants_v" ADD COLUMN "version_source_metadata_file" varchar;
  ALTER TABLE "_variants_v" ADD COLUMN "version_source_metadata_sheet" varchar;
  ALTER TABLE "_variants_v" ADD COLUMN "version_source_metadata_identity_raw" varchar;
  ALTER TABLE "_variants_v" ADD COLUMN "version_source_metadata_catalog_code_raw" varchar;
  ALTER TABLE "_variants_v" ADD COLUMN "version_source_metadata_data_quality_notes" varchar;
  ALTER TABLE "products" ADD COLUMN "source_key" varchar;
  ALTER TABLE "products" ADD COLUMN "source_metadata_workbook_key" varchar;
  ALTER TABLE "products" ADD COLUMN "source_metadata_file" varchar;
  ALTER TABLE "products" ADD COLUMN "source_metadata_sheet" varchar;
  ALTER TABLE "products" ADD COLUMN "source_metadata_identity_raw" varchar;
  ALTER TABLE "products" ADD COLUMN "source_metadata_catalog_code_raw" varchar;
  ALTER TABLE "products" ADD COLUMN "source_metadata_data_quality_notes" varchar;
  ALTER TABLE "_products_v" ADD COLUMN "version_source_key" varchar;
  ALTER TABLE "_products_v" ADD COLUMN "version_source_metadata_workbook_key" varchar;
  ALTER TABLE "_products_v" ADD COLUMN "version_source_metadata_file" varchar;
  ALTER TABLE "_products_v" ADD COLUMN "version_source_metadata_sheet" varchar;
  ALTER TABLE "_products_v" ADD COLUMN "version_source_metadata_identity_raw" varchar;
  ALTER TABLE "_products_v" ADD COLUMN "version_source_metadata_catalog_code_raw" varchar;
  ALTER TABLE "_products_v" ADD COLUMN "version_source_metadata_data_quality_notes" varchar;
  CREATE UNIQUE INDEX "variants_source_key_idx" ON "variants" USING btree ("source_key");
  CREATE INDEX "_variants_v_version_version_source_key_idx" ON "_variants_v" USING btree ("version_source_key");
  CREATE UNIQUE INDEX "products_source_key_idx" ON "products" USING btree ("source_key");
  CREATE INDEX "_products_v_version_version_source_key_idx" ON "_products_v" USING btree ("version_source_key");
  DROP TYPE "public"."enum_exports_format";
  DROP TYPE "public"."enum_exports_sort_order";
  DROP TYPE "public"."enum_exports_drafts";
  DROP TYPE "public"."enum_imports_import_mode";
  DROP TYPE "public"."enum_imports_status";
  DROP TYPE "public"."enum_payload_jobs_log_task_slug";
  DROP TYPE "public"."enum_payload_jobs_log_state";
  DROP TYPE "public"."enum_payload_jobs_task_slug";`)
}
