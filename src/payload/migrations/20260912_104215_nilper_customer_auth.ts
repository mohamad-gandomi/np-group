import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_customer_otp_challenges_delivery_state" AS ENUM('pending', 'delivered', 'failed');
  CREATE TABLE "customers" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"full_name" varchar,
  	"phone" varchar NOT NULL,
  	"storefront_identity" varchar NOT NULL,
  	"legacy_supabase_user_id" varchar,
  	"active" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "customer_otp_challenges" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"phone_key" varchar NOT NULL,
  	"request_ip_key" varchar NOT NULL,
  	"code_hash" varchar NOT NULL,
  	"code_salt" varchar NOT NULL,
  	"expires_at" timestamp(3) with time zone NOT NULL,
  	"attempts" numeric DEFAULT 0 NOT NULL,
  	"delivery_state" "enum_customer_otp_challenges_delivery_state" NOT NULL,
  	"provider_message_id" varchar,
  	"consumed_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "customer_sessions" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"customer_id" integer NOT NULL,
  	"token_hash" varchar NOT NULL,
  	"challenge_key" varchar NOT NULL,
  	"expires_at" timestamp(3) with time zone NOT NULL,
  	"revoked_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "addresses" DROP CONSTRAINT "addresses_customer_id_users_id_fk";
  
  ALTER TABLE "carts" DROP CONSTRAINT "carts_customer_id_users_id_fk";
  
  ALTER TABLE "orders" DROP CONSTRAINT "orders_customer_id_users_id_fk";
  
  ALTER TABLE "transactions" DROP CONSTRAINT "transactions_customer_id_users_id_fk";

  UPDATE "addresses" SET "customer_id" = NULL WHERE "customer_id" IS NOT NULL;
  UPDATE "carts" SET "customer_id" = NULL WHERE "customer_id" IS NOT NULL;
  UPDATE "orders" SET "customer_id" = NULL WHERE "customer_id" IS NOT NULL;
  UPDATE "transactions" SET "customer_id" = NULL WHERE "customer_id" IS NOT NULL;
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "customers_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "customer_otp_challenges_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "customer_sessions_id" integer;
  ALTER TABLE "payload_preferences_rels" ADD COLUMN "customers_id" integer;
  ALTER TABLE "customer_sessions" ADD CONSTRAINT "customer_sessions_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;
  CREATE UNIQUE INDEX "customers_phone_idx" ON "customers" USING btree ("phone");
  CREATE UNIQUE INDEX "customers_storefront_identity_idx" ON "customers" USING btree ("storefront_identity");
  CREATE UNIQUE INDEX "customers_legacy_supabase_user_id_idx" ON "customers" USING btree ("legacy_supabase_user_id");
  CREATE INDEX "customers_updated_at_idx" ON "customers" USING btree ("updated_at");
  CREATE INDEX "customers_created_at_idx" ON "customers" USING btree ("created_at");
  CREATE INDEX "customer_otp_challenges_phone_key_idx" ON "customer_otp_challenges" USING btree ("phone_key");
  CREATE INDEX "customer_otp_challenges_request_ip_key_idx" ON "customer_otp_challenges" USING btree ("request_ip_key");
  CREATE INDEX "customer_otp_challenges_expires_at_idx" ON "customer_otp_challenges" USING btree ("expires_at");
  CREATE INDEX "customer_otp_challenges_consumed_at_idx" ON "customer_otp_challenges" USING btree ("consumed_at");
  CREATE INDEX "customer_otp_challenges_updated_at_idx" ON "customer_otp_challenges" USING btree ("updated_at");
  CREATE INDEX "customer_otp_challenges_created_at_idx" ON "customer_otp_challenges" USING btree ("created_at");
  CREATE INDEX "customer_sessions_customer_idx" ON "customer_sessions" USING btree ("customer_id");
  CREATE UNIQUE INDEX "customer_sessions_token_hash_idx" ON "customer_sessions" USING btree ("token_hash");
  CREATE UNIQUE INDEX "customer_sessions_challenge_key_idx" ON "customer_sessions" USING btree ("challenge_key");
  CREATE INDEX "customer_sessions_expires_at_idx" ON "customer_sessions" USING btree ("expires_at");
  CREATE INDEX "customer_sessions_revoked_at_idx" ON "customer_sessions" USING btree ("revoked_at");
  CREATE INDEX "customer_sessions_updated_at_idx" ON "customer_sessions" USING btree ("updated_at");
  CREATE INDEX "customer_sessions_created_at_idx" ON "customer_sessions" USING btree ("created_at");
  ALTER TABLE "addresses" ADD CONSTRAINT "addresses_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "carts" ADD CONSTRAINT "carts_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "transactions" ADD CONSTRAINT "transactions_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_customers_fk" FOREIGN KEY ("customers_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_customer_otp_challenges_fk" FOREIGN KEY ("customer_otp_challenges_id") REFERENCES "public"."customer_otp_challenges"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_customer_sessions_fk" FOREIGN KEY ("customer_sessions_id") REFERENCES "public"."customer_sessions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_customers_fk" FOREIGN KEY ("customers_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_customers_id_idx" ON "payload_locked_documents_rels" USING btree ("customers_id");
  CREATE INDEX "payload_locked_documents_rels_customer_otp_challenges_id_idx" ON "payload_locked_documents_rels" USING btree ("customer_otp_challenges_id");
  CREATE INDEX "payload_locked_documents_rels_customer_sessions_id_idx" ON "payload_locked_documents_rels" USING btree ("customer_sessions_id");
  CREATE INDEX "payload_preferences_rels_customers_id_idx" ON "payload_preferences_rels" USING btree ("customers_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "addresses" DROP CONSTRAINT "addresses_customer_id_customers_id_fk";
  ALTER TABLE "carts" DROP CONSTRAINT "carts_customer_id_customers_id_fk";
  ALTER TABLE "orders" DROP CONSTRAINT "orders_customer_id_customers_id_fk";
  ALTER TABLE "transactions" DROP CONSTRAINT "transactions_customer_id_customers_id_fk";
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_customers_fk";
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_customer_otp_challenges_fk";
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_customer_sessions_fk";
  ALTER TABLE "payload_preferences_rels" DROP CONSTRAINT "payload_preferences_rels_customers_fk";
  DROP INDEX "payload_locked_documents_rels_customers_id_idx";
  DROP INDEX "payload_locked_documents_rels_customer_otp_challenges_id_idx";
  DROP INDEX "payload_locked_documents_rels_customer_sessions_id_idx";
  DROP INDEX "payload_preferences_rels_customers_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "customers_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "customer_otp_challenges_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "customer_sessions_id";
  ALTER TABLE "payload_preferences_rels" DROP COLUMN "customers_id";
  UPDATE "addresses" SET "customer_id" = NULL WHERE "customer_id" IS NOT NULL;
  UPDATE "carts" SET "customer_id" = NULL WHERE "customer_id" IS NOT NULL;
  UPDATE "orders" SET "customer_id" = NULL WHERE "customer_id" IS NOT NULL;
  UPDATE "transactions" SET "customer_id" = NULL WHERE "customer_id" IS NOT NULL;
  ALTER TABLE "addresses" ADD CONSTRAINT "addresses_customer_id_users_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "carts" ADD CONSTRAINT "carts_customer_id_users_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_users_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "transactions" ADD CONSTRAINT "transactions_customer_id_users_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "customers" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "customer_otp_challenges" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "customer_sessions" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "customer_sessions" CASCADE;
  DROP TABLE "customer_otp_challenges" CASCADE;
  DROP TABLE "customers" CASCADE;
  DROP TYPE "public"."enum_customer_otp_challenges_delivery_state";`)
}
