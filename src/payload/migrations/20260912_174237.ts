import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_transactions_payment_method" AS ENUM('zarinpal');
  ALTER TABLE "orders" ALTER COLUMN "payment_method" SET DATA TYPE text;
  DROP TYPE "public"."enum_orders_payment_method";
  CREATE TYPE "public"."enum_orders_payment_method" AS ENUM('zarinpal', 'invoice');
  UPDATE "orders" SET "payment_method" = 'zarinpal' WHERE "payment_method" = 'gateway';
  ALTER TABLE "orders" ALTER COLUMN "payment_method" SET DATA TYPE "public"."enum_orders_payment_method" USING "payment_method"::"public"."enum_orders_payment_method";
  ALTER TABLE "orders" ADD COLUMN "payment_transaction_id" integer;
  ALTER TABLE "transactions" ADD COLUMN "payment_method" "enum_transactions_payment_method";
  ALTER TABLE "transactions" ADD COLUMN "zarinpal_authority" varchar;
  ALTER TABLE "transactions" ADD COLUMN "zarinpal_reference_i_d" varchar;
  ALTER TABLE "transactions" ADD COLUMN "zarinpal_requested_amount_in_rial" numeric;
  ALTER TABLE "transactions" ADD COLUMN "zarinpal_provider_code" numeric;
  ALTER TABLE "transactions" ADD COLUMN "zarinpal_card_p_a_n" varchar;
  ALTER TABLE "transactions" ADD COLUMN "zarinpal_card_hash" varchar;
  ALTER TABLE "transactions" ADD COLUMN "zarinpal_fee_in_rial" numeric;
  ALTER TABLE "transactions" ADD COLUMN "zarinpal_fee_type" varchar;
  ALTER TABLE "transactions" ADD COLUMN "zarinpal_callback_received_at" timestamp(3) with time zone;
  ALTER TABLE "transactions" ADD COLUMN "zarinpal_verified_at" timestamp(3) with time zone;
  ALTER TABLE "transactions" ADD COLUMN "zarinpal_failure_message" varchar;
  ALTER TABLE "orders" ADD CONSTRAINT "orders_payment_transaction_id_transactions_id_fk" FOREIGN KEY ("payment_transaction_id") REFERENCES "public"."transactions"("id") ON DELETE set null ON UPDATE no action;
  CREATE UNIQUE INDEX "orders_payment_transaction_idx" ON "orders" USING btree ("payment_transaction_id");
  CREATE UNIQUE INDEX "transactions_zarinpal_zarinpal_authority_idx" ON "transactions" USING btree ("zarinpal_authority");
  CREATE INDEX "transactions_zarinpal_zarinpal_reference_i_d_idx" ON "transactions" USING btree ("zarinpal_reference_i_d");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "orders" DROP CONSTRAINT "orders_payment_transaction_id_transactions_id_fk";
  
  ALTER TABLE "orders" ALTER COLUMN "payment_method" SET DATA TYPE text;
  DROP TYPE "public"."enum_orders_payment_method";
  CREATE TYPE "public"."enum_orders_payment_method" AS ENUM('gateway', 'invoice');
  UPDATE "orders" SET "payment_method" = 'gateway' WHERE "payment_method" = 'zarinpal';
  ALTER TABLE "orders" ALTER COLUMN "payment_method" SET DATA TYPE "public"."enum_orders_payment_method" USING "payment_method"::"public"."enum_orders_payment_method";
  DROP INDEX "orders_payment_transaction_idx";
  DROP INDEX "transactions_zarinpal_zarinpal_authority_idx";
  DROP INDEX "transactions_zarinpal_zarinpal_reference_i_d_idx";
  ALTER TABLE "orders" DROP COLUMN "payment_transaction_id";
  ALTER TABLE "transactions" DROP COLUMN "payment_method";
  ALTER TABLE "transactions" DROP COLUMN "zarinpal_authority";
  ALTER TABLE "transactions" DROP COLUMN "zarinpal_reference_i_d";
  ALTER TABLE "transactions" DROP COLUMN "zarinpal_requested_amount_in_rial";
  ALTER TABLE "transactions" DROP COLUMN "zarinpal_provider_code";
  ALTER TABLE "transactions" DROP COLUMN "zarinpal_card_p_a_n";
  ALTER TABLE "transactions" DROP COLUMN "zarinpal_card_hash";
  ALTER TABLE "transactions" DROP COLUMN "zarinpal_fee_in_rial";
  ALTER TABLE "transactions" DROP COLUMN "zarinpal_fee_type";
  ALTER TABLE "transactions" DROP COLUMN "zarinpal_callback_received_at";
  ALTER TABLE "transactions" DROP COLUMN "zarinpal_verified_at";
  ALTER TABLE "transactions" DROP COLUMN "zarinpal_failure_message";
  DROP TYPE "public"."enum_transactions_payment_method";`)
}
