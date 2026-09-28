import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  const existingSchema = await db.execute(
    sql`SELECT to_regclass('public.variant_types') AS "exists";`,
  )

  if (existingSchema.rows[0]?.exists) {
    return
  }

  await db.execute(sql`
   CREATE TYPE "public"."enum_products_measurements_unit" AS ENUM('cm', 'kg', 'm', 'unit');
  CREATE TYPE "public"."enum_products_product_type" AS ENUM('simple', 'variable');
  CREATE TYPE "public"."enum_products_sales_mode" AS ENUM('direct', 'inquiry', 'made_to_order');
  CREATE TYPE "public"."enum_products_availability_mode" AS ENUM('orderable', 'in_stock', 'unavailable');
  CREATE TYPE "public"."enum_products_shipping_mode" AS ENUM('parcel', 'freight');
  CREATE TYPE "public"."enum_products_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__products_v_version_measurements_unit" AS ENUM('cm', 'kg', 'm', 'unit');
  CREATE TYPE "public"."enum__products_v_version_product_type" AS ENUM('simple', 'variable');
  CREATE TYPE "public"."enum__products_v_version_sales_mode" AS ENUM('direct', 'inquiry', 'made_to_order');
  CREATE TYPE "public"."enum__products_v_version_availability_mode" AS ENUM('orderable', 'in_stock', 'unavailable');
  CREATE TYPE "public"."enum__products_v_version_shipping_mode" AS ENUM('parcel', 'freight');
  CREATE TYPE "public"."enum__products_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_orders_items_shipping_mode_snapshot" AS ENUM('parcel', 'freight');
  CREATE TYPE "public"."enum_orders_delivery_method" AS ENUM('advisor');
  CREATE TYPE "public"."enum_orders_shipping_mode" AS ENUM('parcel', 'freight');
  CREATE TYPE "public"."enum_orders_shipping_provider" AS ENUM('tapin', 'manual');
  CREATE TYPE "public"."enum_orders_shipping_status" AS ENUM('manual_coordination', 'quoted', 'shipment_pending', 'creating', 'created', 'in_transit', 'delivered', 'failed');
  CREATE TYPE "public"."enum_orders_currency" AS ENUM('TMN');
  CREATE TYPE "public"."enum_orders_payment_method" AS ENUM('zarinpal', 'invoice');
  CREATE TYPE "public"."enum_orders_status" AS ENUM('pending_review', 'confirmed', 'in_production', 'ready', 'shipped', 'delivered', 'cancelled');
  CREATE TYPE "public"."enum_transactions_items_shipping_mode_snapshot" AS ENUM('parcel', 'freight');
  CREATE TYPE "public"."enum_transactions_payment_method" AS ENUM('zarinpal');
  CREATE TYPE "public"."enum_transactions_status" AS ENUM('pending', 'succeeded', 'failed', 'cancelled', 'expired', 'refunded');
  CREATE TYPE "public"."enum_transactions_currency" AS ENUM('TMN');
  CREATE TYPE "public"."enum_transactions_shipping_mode" AS ENUM('parcel', 'freight');
  CREATE TYPE "public"."enum_transactions_shipping_provider" AS ENUM('tapin', 'manual');
  CREATE TYPE "public"."enum_variant_types_catalog_filter_presentation" AS ENUM('checkbox', 'swatch');
  CREATE TYPE "public"."enum_variant_types_catalog_filter_placement" AS ENUM('primary', 'more');
  CREATE TYPE "public"."enum_variant_types_catalog_filter_scope" AS ENUM('all', 'categories');
  CREATE TYPE "public"."enum_projects_sector" AS ENUM('residential', 'hospitality', 'commercial', 'workplace', 'healthcare');
  CREATE TYPE "public"."enum_posts_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__posts_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_users_role" AS ENUM('admin', 'editor', 'seller');
  CREATE TYPE "public"."enum_exports_format" AS ENUM('csv', 'json');
  CREATE TYPE "public"."enum_exports_sort_order" AS ENUM('asc', 'desc');
  CREATE TYPE "public"."enum_exports_drafts" AS ENUM('yes', 'no');
  CREATE TYPE "public"."enum_imports_import_mode" AS ENUM('create', 'update', 'upsert');
  CREATE TYPE "public"."enum_imports_status" AS ENUM('pending', 'completed', 'partial', 'failed');
  CREATE TYPE "public"."enum_customer_otp_challenges_delivery_state" AS ENUM('pending', 'delivered', 'failed');
  CREATE TYPE "public"."enum_addresses_country" AS ENUM('IR');
  CREATE TYPE "public"."enum_variants_measurements_unit" AS ENUM('cm', 'kg', 'm', 'unit');
  CREATE TYPE "public"."enum_variants_shipping_mode" AS ENUM('parcel', 'freight');
  CREATE TYPE "public"."enum_variants_availability_mode" AS ENUM('orderable', 'in_stock', 'unavailable');
  CREATE TYPE "public"."enum_variants_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__variants_v_version_measurements_unit" AS ENUM('cm', 'kg', 'm', 'unit');
  CREATE TYPE "public"."enum__variants_v_version_shipping_mode" AS ENUM('parcel', 'freight');
  CREATE TYPE "public"."enum__variants_v_version_availability_mode" AS ENUM('orderable', 'in_stock', 'unavailable');
  CREATE TYPE "public"."enum__variants_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_carts_items_shipping_mode_snapshot" AS ENUM('parcel', 'freight');
  CREATE TYPE "public"."enum_carts_currency" AS ENUM('TMN');
  CREATE TYPE "public"."enum_payload_jobs_log_task_slug" AS ENUM('inline', 'cleanupEphemeralRecords', 'createCollectionExport', 'createCollectionImport');
  CREATE TYPE "public"."enum_payload_jobs_log_state" AS ENUM('failed', 'succeeded');
  CREATE TYPE "public"."enum_payload_jobs_task_slug" AS ENUM('inline', 'cleanupEphemeralRecords', 'createCollectionExport', 'createCollectionImport');
  CREATE TABLE "products_gallery" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "image_id" integer,
    "caption_fa" varchar
  );

  CREATE TABLE "products_measurements" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "key" varchar,
    "label_fa" varchar,
    "value" numeric,
    "unit" "enum_products_measurements_unit",
    "sort_order" numeric DEFAULT 0
  );

  CREATE TABLE "products_technical_specs" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "key" varchar,
    "label_fa" varchar,
    "value_fa" varchar,
    "sort_order" numeric DEFAULT 0
  );

  CREATE TABLE "products_attributes" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "attribute_id" integer,
    "required" boolean DEFAULT false
  );

  CREATE TABLE "products" (
    "id" serial PRIMARY KEY NOT NULL,
    "title" varchar,
    "slug" varchar,
    "catalog_code" varchar,
    "product_type" "enum_products_product_type" DEFAULT 'simple',
    "brand_id" integer,
    "sales_mode" "enum_products_sales_mode" DEFAULT 'made_to_order',
    "availability_mode" "enum_products_availability_mode" DEFAULT 'orderable',
    "shipping_mode" "enum_products_shipping_mode" DEFAULT 'freight',
    "parcel_weight_in_grams" numeric,
    "tapin_box_i_d" numeric,
    "price_in_t_m_n_enabled" boolean,
    "price_in_t_m_n" numeric,
    "main_image_id" integer,
    "description_fa" jsonb,
    "order_notes_fa" varchar,
    "lead_time_fa" varchar,
    "enable_variants" boolean,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "deleted_at" timestamp(3) with time zone,
    "_status" "enum_products_status" DEFAULT 'draft'
  );

  CREATE TABLE "products_rels" (
    "id" serial PRIMARY KEY NOT NULL,
    "order" integer,
    "parent_id" integer NOT NULL,
    "path" varchar NOT NULL,
    "categories_id" integer,
    "variant_options_id" integer,
    "products_id" integer,
    "variant_types_id" integer
  );

  CREATE TABLE "_products_v_version_gallery" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" serial PRIMARY KEY NOT NULL,
    "image_id" integer,
    "caption_fa" varchar,
    "_uuid" varchar
  );

  CREATE TABLE "_products_v_version_measurements" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" serial PRIMARY KEY NOT NULL,
    "key" varchar,
    "label_fa" varchar,
    "value" numeric,
    "unit" "enum__products_v_version_measurements_unit",
    "sort_order" numeric DEFAULT 0,
    "_uuid" varchar
  );

  CREATE TABLE "_products_v_version_technical_specs" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" serial PRIMARY KEY NOT NULL,
    "key" varchar,
    "label_fa" varchar,
    "value_fa" varchar,
    "sort_order" numeric DEFAULT 0,
    "_uuid" varchar
  );

  CREATE TABLE "_products_v_version_attributes" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" serial PRIMARY KEY NOT NULL,
    "attribute_id" integer,
    "required" boolean DEFAULT false,
    "_uuid" varchar
  );

  CREATE TABLE "_products_v" (
    "id" serial PRIMARY KEY NOT NULL,
    "parent_id" integer,
    "version_title" varchar,
    "version_slug" varchar,
    "version_catalog_code" varchar,
    "version_product_type" "enum__products_v_version_product_type" DEFAULT 'simple',
    "version_brand_id" integer,
    "version_sales_mode" "enum__products_v_version_sales_mode" DEFAULT 'made_to_order',
    "version_availability_mode" "enum__products_v_version_availability_mode" DEFAULT 'orderable',
    "version_shipping_mode" "enum__products_v_version_shipping_mode" DEFAULT 'freight',
    "version_parcel_weight_in_grams" numeric,
    "version_tapin_box_i_d" numeric,
    "version_price_in_t_m_n_enabled" boolean,
    "version_price_in_t_m_n" numeric,
    "version_main_image_id" integer,
    "version_description_fa" jsonb,
    "version_order_notes_fa" varchar,
    "version_lead_time_fa" varchar,
    "version_enable_variants" boolean,
    "version_updated_at" timestamp(3) with time zone,
    "version_created_at" timestamp(3) with time zone,
    "version_deleted_at" timestamp(3) with time zone,
    "version__status" "enum__products_v_version_status" DEFAULT 'draft',
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "latest" boolean,
    "autosave" boolean
  );

  CREATE TABLE "_products_v_rels" (
    "id" serial PRIMARY KEY NOT NULL,
    "order" integer,
    "parent_id" integer NOT NULL,
    "path" varchar NOT NULL,
    "categories_id" integer,
    "variant_options_id" integer,
    "products_id" integer,
    "variant_types_id" integer
  );

  CREATE TABLE "orders_items_configuration" (
    "_order" integer NOT NULL,
    "_parent_id" varchar NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "group_key" varchar NOT NULL,
    "group_id" integer,
    "group_label_fa_snapshot" varchar NOT NULL,
    "option_id" integer,
    "option_code_snapshot" varchar,
    "label_fa_snapshot" varchar NOT NULL
  );

  CREATE TABLE "orders_items" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "product_id" integer,
    "variant_id" integer,
    "quantity" numeric DEFAULT 1 NOT NULL,
    "configuration_key" varchar NOT NULL,
    "product_title_snapshot" varchar NOT NULL,
    "variant_code_snapshot" varchar,
    "variant_title_snapshot" varchar,
    "unit_price_in_t_m_n" numeric NOT NULL,
    "shipping_mode_snapshot" "enum_orders_items_shipping_mode_snapshot" DEFAULT 'freight',
    "parcel_weight_in_grams_snapshot" numeric,
    "tapin_box_i_d_snapshot" numeric
  );

  CREATE TABLE "orders" (
    "id" serial PRIMARY KEY NOT NULL,
    "customer_id" integer,
    "contact_name" varchar NOT NULL,
    "contact_phone" varchar NOT NULL,
    "customer_address_id" integer,
    "shipping_address_title" varchar,
    "shipping_address_first_name" varchar,
    "shipping_address_last_name" varchar,
    "shipping_address_company" varchar,
    "shipping_address_address_line1" varchar,
    "shipping_address_address_line2" varchar,
    "shipping_address_city" varchar,
    "shipping_address_state" varchar,
    "shipping_address_postal_code" varchar,
    "shipping_address_country" varchar,
    "shipping_address_phone" varchar,
    "delivery_method" "enum_orders_delivery_method" NOT NULL,
    "shipping_mode" "enum_orders_shipping_mode" DEFAULT 'freight',
    "shipping_amount_in_t_m_n" numeric DEFAULT 0,
    "shipping_provider" "enum_orders_shipping_provider" DEFAULT 'manual',
    "shipping_service_i_d" varchar,
    "shipping_service_label" varchar,
    "shipping_province_code" numeric,
    "shipping_city_code" numeric,
    "shipping_weight_in_grams" numeric,
    "shipping_box_i_d" numeric,
    "shipping_quoted_at" timestamp(3) with time zone,
    "shipping_status" "enum_orders_shipping_status" DEFAULT 'manual_coordination',
    "shipping_shipment_i_d" varchar,
    "shipping_tracking_code" varchar,
    "shipping_provider_status" varchar,
    "shipping_failure_message" varchar,
    "shipment_created_at" timestamp(3) with time zone,
    "amount" numeric,
    "currency" "enum_orders_currency" DEFAULT 'TMN',
    "payment_method" "enum_orders_payment_method" NOT NULL,
    "payment_transaction_id" integer,
    "customer_email" varchar,
    "status" "enum_orders_status" DEFAULT 'pending_review',
    "order_number" varchar NOT NULL,
    "source_cart_id" integer,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE "orders_rels" (
    "id" serial PRIMARY KEY NOT NULL,
    "order" integer,
    "parent_id" integer NOT NULL,
    "path" varchar NOT NULL,
    "transactions_id" integer
  );

  CREATE TABLE "transactions_items_configuration" (
    "_order" integer NOT NULL,
    "_parent_id" varchar NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "group_key" varchar NOT NULL,
    "group_id" integer,
    "group_label_fa_snapshot" varchar NOT NULL,
    "option_id" integer,
    "option_code_snapshot" varchar,
    "label_fa_snapshot" varchar NOT NULL
  );

  CREATE TABLE "transactions_items" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "product_id" integer,
    "variant_id" integer,
    "quantity" numeric DEFAULT 1 NOT NULL,
    "configuration_key" varchar NOT NULL,
    "product_title_snapshot" varchar NOT NULL,
    "variant_code_snapshot" varchar,
    "variant_title_snapshot" varchar,
    "unit_price_in_t_m_n" numeric NOT NULL,
    "shipping_mode_snapshot" "enum_transactions_items_shipping_mode_snapshot" DEFAULT 'freight',
    "parcel_weight_in_grams_snapshot" numeric,
    "tapin_box_i_d_snapshot" numeric
  );

  CREATE TABLE "transactions" (
    "id" serial PRIMARY KEY NOT NULL,
    "payment_method" "enum_transactions_payment_method",
    "zarinpal_authority" varchar,
    "zarinpal_reference_i_d" varchar,
    "zarinpal_requested_amount_in_rial" numeric,
    "zarinpal_provider_code" numeric,
    "zarinpal_card_p_a_n" varchar,
    "zarinpal_card_hash" varchar,
    "zarinpal_fee_in_rial" numeric,
    "zarinpal_fee_type" varchar,
    "zarinpal_callback_received_at" timestamp(3) with time zone,
    "zarinpal_verified_at" timestamp(3) with time zone,
    "zarinpal_failure_message" varchar,
    "billing_address_title" varchar,
    "billing_address_first_name" varchar,
    "billing_address_last_name" varchar,
    "billing_address_company" varchar,
    "billing_address_address_line1" varchar,
    "billing_address_address_line2" varchar,
    "billing_address_city" varchar,
    "billing_address_state" varchar,
    "billing_address_postal_code" varchar,
    "billing_address_country" varchar,
    "billing_address_phone" varchar,
    "status" "enum_transactions_status" DEFAULT 'pending' NOT NULL,
    "customer_id" integer,
    "customer_email" varchar,
    "order_id" integer,
    "cart_id" integer,
    "amount" numeric,
    "currency" "enum_transactions_currency" DEFAULT 'TMN',
    "shipping_mode" "enum_transactions_shipping_mode" DEFAULT 'freight',
    "shipping_amount_in_t_m_n" numeric DEFAULT 0,
    "shipping_provider" "enum_transactions_shipping_provider" DEFAULT 'manual',
    "shipping_service_i_d" varchar,
    "shipping_service_label" varchar,
    "shipping_province_code" numeric,
    "shipping_city_code" numeric,
    "shipping_weight_in_grams" numeric,
    "shipping_box_i_d" numeric,
    "shipping_quoted_at" timestamp(3) with time zone,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE "customers" (
    "id" serial PRIMARY KEY NOT NULL,
    "full_name" varchar,
    "phone" varchar NOT NULL,
    "active" boolean DEFAULT true,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE "categories" (
    "id" serial PRIMARY KEY NOT NULL,
    "title" varchar NOT NULL,
    "slug" varchar NOT NULL,
    "parent_id" integer,
    "image_id" integer,
    "description_fa" varchar,
    "show_on_storefront" boolean DEFAULT false,
    "sort_order" numeric DEFAULT 0,
    "published" boolean DEFAULT true,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE "brands" (
    "id" serial PRIMARY KEY NOT NULL,
    "title" varchar NOT NULL,
    "slug" varchar NOT NULL,
    "description_fa" varchar,
    "tagline_fa" varchar,
    "story_fa" varchar,
    "logo_id" integer,
    "hero_media_id" integer,
    "hero_alt" varchar,
    "hero_caption" varchar,
    "featured" boolean DEFAULT false,
    "sort_order" numeric DEFAULT 0,
    "published" boolean DEFAULT true,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE "variant_types" (
    "id" serial PRIMARY KEY NOT NULL,
    "label" varchar NOT NULL,
    "name" varchar NOT NULL,
    "active" boolean DEFAULT true,
    "sort_order" numeric DEFAULT 0,
    "help_text_fa" varchar,
    "catalog_filter_enabled" boolean DEFAULT false,
    "catalog_filter_label" varchar,
    "catalog_filter_presentation" "enum_variant_types_catalog_filter_presentation" DEFAULT 'checkbox',
    "catalog_filter_placement" "enum_variant_types_catalog_filter_placement" DEFAULT 'more',
    "catalog_filter_order" numeric DEFAULT 0,
    "catalog_filter_scope" "enum_variant_types_catalog_filter_scope" DEFAULT 'all',
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE "variant_types_rels" (
    "id" serial PRIMARY KEY NOT NULL,
    "order" integer,
    "parent_id" integer NOT NULL,
    "path" varchar NOT NULL,
    "categories_id" integer
  );

  CREATE TABLE "media" (
    "id" serial PRIMARY KEY NOT NULL,
    "alt" varchar NOT NULL,
    "caption_fa" varchar,
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
    "focal_y" numeric,
    "sizes_admin_thumbnail_url" varchar,
    "sizes_admin_thumbnail_width" numeric,
    "sizes_admin_thumbnail_height" numeric,
    "sizes_admin_thumbnail_mime_type" varchar,
    "sizes_admin_thumbnail_filesize" numeric,
    "sizes_admin_thumbnail_filename" varchar
  );

  CREATE TABLE "projects_gallery" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "image_id" integer,
    "alt" varchar,
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
    "hero_media_id" integer,
    "hero_alt" varchar,
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

  CREATE TABLE "posts" (
    "id" serial PRIMARY KEY NOT NULL,
    "title" varchar,
    "slug" varchar,
    "category_id" integer,
    "description" varchar,
    "summary" varchar,
    "hero_image_id" integer,
    "hero_caption" varchar,
    "content" jsonb,
    "takeaway" varchar,
    "call_to_action_label" varchar DEFAULT 'دیدن محصولات',
    "call_to_action_href" varchar DEFAULT '/shop',
    "author_name" varchar DEFAULT 'تحریریه ان‌پی',
    "author_url" varchar DEFAULT '/about',
    "author_bio" varchar,
    "seo_title" varchar,
    "seo_description" varchar,
    "seo_social_image_id" integer,
    "seo_primary_topic" varchar,
    "seo_no_index" boolean DEFAULT false,
    "published_at" timestamp(3) with time zone,
    "featured" boolean DEFAULT false,
    "sort_order" numeric DEFAULT 0,
    "word_count" numeric DEFAULT 0,
    "reading_time_minutes" numeric DEFAULT 1,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "_status" "enum_posts_status" DEFAULT 'draft'
  );

  CREATE TABLE "posts_rels" (
    "id" serial PRIMARY KEY NOT NULL,
    "order" integer,
    "parent_id" integer NOT NULL,
    "path" varchar NOT NULL,
    "posts_id" integer
  );

  CREATE TABLE "_posts_v" (
    "id" serial PRIMARY KEY NOT NULL,
    "parent_id" integer,
    "version_title" varchar,
    "version_slug" varchar,
    "version_category_id" integer,
    "version_description" varchar,
    "version_summary" varchar,
    "version_hero_image_id" integer,
    "version_hero_caption" varchar,
    "version_content" jsonb,
    "version_takeaway" varchar,
    "version_call_to_action_label" varchar DEFAULT 'دیدن محصولات',
    "version_call_to_action_href" varchar DEFAULT '/shop',
    "version_author_name" varchar DEFAULT 'تحریریه ان‌پی',
    "version_author_url" varchar DEFAULT '/about',
    "version_author_bio" varchar,
    "version_seo_title" varchar,
    "version_seo_description" varchar,
    "version_seo_social_image_id" integer,
    "version_seo_primary_topic" varchar,
    "version_seo_no_index" boolean DEFAULT false,
    "version_published_at" timestamp(3) with time zone,
    "version_featured" boolean DEFAULT false,
    "version_sort_order" numeric DEFAULT 0,
    "version_word_count" numeric DEFAULT 0,
    "version_reading_time_minutes" numeric DEFAULT 1,
    "version_updated_at" timestamp(3) with time zone,
    "version_created_at" timestamp(3) with time zone,
    "version__status" "enum__posts_v_version_status" DEFAULT 'draft',
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "latest" boolean,
    "autosave" boolean
  );

  CREATE TABLE "_posts_v_rels" (
    "id" serial PRIMARY KEY NOT NULL,
    "order" integer,
    "parent_id" integer NOT NULL,
    "path" varchar NOT NULL,
    "posts_id" integer
  );

  CREATE TABLE "users_sessions" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "created_at" timestamp(3) with time zone,
    "expires_at" timestamp(3) with time zone NOT NULL
  );

  CREATE TABLE "users" (
    "id" serial PRIMARY KEY NOT NULL,
    "full_name" varchar NOT NULL,
    "phone" varchar,
    "role" "enum_users_role" DEFAULT 'admin' NOT NULL,
    "contact_title" varchar,
    "contact_description" varchar,
    "whatsapp_phone" varchar,
    "active" boolean DEFAULT true,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "email" varchar NOT NULL,
    "reset_password_token" varchar,
    "reset_password_expiration" timestamp(3) with time zone,
    "salt" varchar,
    "hash" varchar,
    "login_attempts" numeric DEFAULT 0,
    "lock_until" timestamp(3) with time zone
  );

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

  CREATE TABLE "addresses" (
    "id" serial PRIMARY KEY NOT NULL,
    "customer_id" integer,
    "title" varchar,
    "first_name" varchar,
    "last_name" varchar,
    "company" varchar,
    "address_line1" varchar,
    "address_line2" varchar,
    "city" varchar,
    "state" varchar,
    "postal_code" varchar,
    "country" "enum_addresses_country" DEFAULT 'IR' NOT NULL,
    "phone" varchar,
    "display_label" varchar,
    "is_default" boolean DEFAULT false,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE "variants_measurements" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "key" varchar,
    "label_fa" varchar,
    "value" numeric,
    "unit" "enum_variants_measurements_unit",
    "sort_order" numeric DEFAULT 0
  );

  CREATE TABLE "variants" (
    "id" serial PRIMARY KEY NOT NULL,
    "product_id" integer,
    "nilper_code" varchar,
    "title" varchar,
    "combination_key" varchar,
    "shipping_mode" "enum_variants_shipping_mode",
    "availability_mode" "enum_variants_availability_mode",
    "main_image_id" integer,
    "parcel_weight_in_grams" numeric,
    "tapin_box_i_d" numeric,
    "price_in_t_m_n_enabled" boolean,
    "price_in_t_m_n" numeric,
    "manufacturing_notes_fa" varchar,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "deleted_at" timestamp(3) with time zone,
    "_status" "enum_variants_status" DEFAULT 'draft'
  );

  CREATE TABLE "variants_rels" (
    "id" serial PRIMARY KEY NOT NULL,
    "order" integer,
    "parent_id" integer NOT NULL,
    "path" varchar NOT NULL,
    "variant_options_id" integer
  );

  CREATE TABLE "_variants_v_version_measurements" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" serial PRIMARY KEY NOT NULL,
    "key" varchar,
    "label_fa" varchar,
    "value" numeric,
    "unit" "enum__variants_v_version_measurements_unit",
    "sort_order" numeric DEFAULT 0,
    "_uuid" varchar
  );

  CREATE TABLE "_variants_v" (
    "id" serial PRIMARY KEY NOT NULL,
    "parent_id" integer,
    "version_product_id" integer,
    "version_nilper_code" varchar,
    "version_title" varchar,
    "version_combination_key" varchar,
    "version_shipping_mode" "enum__variants_v_version_shipping_mode",
    "version_availability_mode" "enum__variants_v_version_availability_mode",
    "version_main_image_id" integer,
    "version_parcel_weight_in_grams" numeric,
    "version_tapin_box_i_d" numeric,
    "version_price_in_t_m_n_enabled" boolean,
    "version_price_in_t_m_n" numeric,
    "version_manufacturing_notes_fa" varchar,
    "version_updated_at" timestamp(3) with time zone,
    "version_created_at" timestamp(3) with time zone,
    "version_deleted_at" timestamp(3) with time zone,
    "version__status" "enum__variants_v_version_status" DEFAULT 'draft',
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "latest" boolean,
    "autosave" boolean
  );

  CREATE TABLE "_variants_v_rels" (
    "id" serial PRIMARY KEY NOT NULL,
    "order" integer,
    "parent_id" integer NOT NULL,
    "path" varchar NOT NULL,
    "variant_options_id" integer
  );

  CREATE TABLE "variant_options" (
    "id" serial PRIMARY KEY NOT NULL,
    "_variantoptions_options_order" varchar,
    "variant_type_id" integer NOT NULL,
    "label" varchar NOT NULL,
    "value" varchar NOT NULL,
    "active" boolean DEFAULT true,
    "sort_order" numeric DEFAULT 0,
    "code" varchar,
    "group_label" varchar,
    "image_id" integer,
    "color_hex" varchar,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE "carts_items_configuration" (
    "_order" integer NOT NULL,
    "_parent_id" varchar NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "group_key" varchar NOT NULL,
    "group_id" integer,
    "group_label_fa_snapshot" varchar NOT NULL,
    "option_id" integer,
    "option_code_snapshot" varchar,
    "label_fa_snapshot" varchar NOT NULL
  );

  CREATE TABLE "carts_items" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "product_id" integer,
    "variant_id" integer,
    "quantity" numeric DEFAULT 1 NOT NULL,
    "configuration_key" varchar NOT NULL,
    "product_title_snapshot" varchar NOT NULL,
    "variant_code_snapshot" varchar,
    "variant_title_snapshot" varchar,
    "unit_price_in_t_m_n" numeric NOT NULL,
    "shipping_mode_snapshot" "enum_carts_items_shipping_mode_snapshot" DEFAULT 'freight',
    "parcel_weight_in_grams_snapshot" numeric,
    "tapin_box_i_d_snapshot" numeric
  );

  CREATE TABLE "carts" (
    "id" serial PRIMARY KEY NOT NULL,
    "secret" varchar,
    "customer_id" integer,
    "purchased_at" timestamp(3) with time zone,
    "subtotal" numeric,
    "currency" "enum_carts_currency" DEFAULT 'TMN',
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE "payload_kv" (
    "id" serial PRIMARY KEY NOT NULL,
    "key" varchar NOT NULL,
    "data" jsonb NOT NULL
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

  CREATE TABLE "payload_locked_documents" (
    "id" serial PRIMARY KEY NOT NULL,
    "global_slug" varchar,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE "payload_locked_documents_rels" (
    "id" serial PRIMARY KEY NOT NULL,
    "order" integer,
    "parent_id" integer NOT NULL,
    "path" varchar NOT NULL,
    "products_id" integer,
    "orders_id" integer,
    "transactions_id" integer,
    "customers_id" integer,
    "categories_id" integer,
    "brands_id" integer,
    "variant_types_id" integer,
    "media_id" integer,
    "projects_id" integer,
    "blog_categories_id" integer,
    "posts_id" integer,
    "users_id" integer,
    "customer_otp_challenges_id" integer,
    "customer_sessions_id" integer,
    "addresses_id" integer,
    "variants_id" integer,
    "variant_options_id" integer,
    "carts_id" integer
  );

  CREATE TABLE "payload_preferences" (
    "id" serial PRIMARY KEY NOT NULL,
    "key" varchar,
    "value" jsonb,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE "payload_preferences_rels" (
    "id" serial PRIMARY KEY NOT NULL,
    "order" integer,
    "parent_id" integer NOT NULL,
    "path" varchar NOT NULL,
    "customers_id" integer,
    "users_id" integer
  );

  CREATE TABLE "payload_migrations" (
    "id" serial PRIMARY KEY NOT NULL,
    "name" varchar,
    "batch" numeric,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE "payload_jobs_stats" (
    "id" serial PRIMARY KEY NOT NULL,
    "stats" jsonb,
    "updated_at" timestamp(3) with time zone,
    "created_at" timestamp(3) with time zone
  );

  ALTER TABLE "products_gallery" ADD CONSTRAINT "products_gallery_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "products_gallery" ADD CONSTRAINT "products_gallery_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "products_measurements" ADD CONSTRAINT "products_measurements_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "products_technical_specs" ADD CONSTRAINT "products_technical_specs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "products_attributes" ADD CONSTRAINT "products_attributes_attribute_id_variant_types_id_fk" FOREIGN KEY ("attribute_id") REFERENCES "public"."variant_types"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "products_attributes" ADD CONSTRAINT "products_attributes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "products" ADD CONSTRAINT "products_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "products" ADD CONSTRAINT "products_main_image_id_media_id_fk" FOREIGN KEY ("main_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "products_rels" ADD CONSTRAINT "products_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "products_rels" ADD CONSTRAINT "products_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "products_rels" ADD CONSTRAINT "products_rels_variant_options_fk" FOREIGN KEY ("variant_options_id") REFERENCES "public"."variant_options"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "products_rels" ADD CONSTRAINT "products_rels_products_fk" FOREIGN KEY ("products_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "products_rels" ADD CONSTRAINT "products_rels_variant_types_fk" FOREIGN KEY ("variant_types_id") REFERENCES "public"."variant_types"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_products_v_version_gallery" ADD CONSTRAINT "_products_v_version_gallery_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_products_v_version_gallery" ADD CONSTRAINT "_products_v_version_gallery_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_products_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_products_v_version_measurements" ADD CONSTRAINT "_products_v_version_measurements_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_products_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_products_v_version_technical_specs" ADD CONSTRAINT "_products_v_version_technical_specs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_products_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_products_v_version_attributes" ADD CONSTRAINT "_products_v_version_attributes_attribute_id_variant_types_id_fk" FOREIGN KEY ("attribute_id") REFERENCES "public"."variant_types"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_products_v_version_attributes" ADD CONSTRAINT "_products_v_version_attributes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_products_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_products_v" ADD CONSTRAINT "_products_v_parent_id_products_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_products_v" ADD CONSTRAINT "_products_v_version_brand_id_brands_id_fk" FOREIGN KEY ("version_brand_id") REFERENCES "public"."brands"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_products_v" ADD CONSTRAINT "_products_v_version_main_image_id_media_id_fk" FOREIGN KEY ("version_main_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_products_v_rels" ADD CONSTRAINT "_products_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_products_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_products_v_rels" ADD CONSTRAINT "_products_v_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_products_v_rels" ADD CONSTRAINT "_products_v_rels_variant_options_fk" FOREIGN KEY ("variant_options_id") REFERENCES "public"."variant_options"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_products_v_rels" ADD CONSTRAINT "_products_v_rels_products_fk" FOREIGN KEY ("products_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_products_v_rels" ADD CONSTRAINT "_products_v_rels_variant_types_fk" FOREIGN KEY ("variant_types_id") REFERENCES "public"."variant_types"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "orders_items_configuration" ADD CONSTRAINT "orders_items_configuration_group_id_variant_types_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."variant_types"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "orders_items_configuration" ADD CONSTRAINT "orders_items_configuration_option_id_variant_options_id_fk" FOREIGN KEY ("option_id") REFERENCES "public"."variant_options"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "orders_items_configuration" ADD CONSTRAINT "orders_items_configuration_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."orders_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "orders_items" ADD CONSTRAINT "orders_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "orders_items" ADD CONSTRAINT "orders_items_variant_id_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."variants"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "orders_items" ADD CONSTRAINT "orders_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_address_id_addresses_id_fk" FOREIGN KEY ("customer_address_id") REFERENCES "public"."addresses"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "orders" ADD CONSTRAINT "orders_payment_transaction_id_transactions_id_fk" FOREIGN KEY ("payment_transaction_id") REFERENCES "public"."transactions"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "orders" ADD CONSTRAINT "orders_source_cart_id_carts_id_fk" FOREIGN KEY ("source_cart_id") REFERENCES "public"."carts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "orders_rels" ADD CONSTRAINT "orders_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "orders_rels" ADD CONSTRAINT "orders_rels_transactions_fk" FOREIGN KEY ("transactions_id") REFERENCES "public"."transactions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "transactions_items_configuration" ADD CONSTRAINT "transactions_items_configuration_group_id_variant_types_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."variant_types"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "transactions_items_configuration" ADD CONSTRAINT "transactions_items_configuration_option_id_variant_options_id_fk" FOREIGN KEY ("option_id") REFERENCES "public"."variant_options"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "transactions_items_configuration" ADD CONSTRAINT "transactions_items_configuration_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."transactions_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "transactions_items" ADD CONSTRAINT "transactions_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "transactions_items" ADD CONSTRAINT "transactions_items_variant_id_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."variants"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "transactions_items" ADD CONSTRAINT "transactions_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."transactions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "transactions" ADD CONSTRAINT "transactions_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "transactions" ADD CONSTRAINT "transactions_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "transactions" ADD CONSTRAINT "transactions_cart_id_carts_id_fk" FOREIGN KEY ("cart_id") REFERENCES "public"."carts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_categories_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "categories" ADD CONSTRAINT "categories_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "brands" ADD CONSTRAINT "brands_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "brands" ADD CONSTRAINT "brands_hero_media_id_media_id_fk" FOREIGN KEY ("hero_media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "variant_types_rels" ADD CONSTRAINT "variant_types_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."variant_types"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "variant_types_rels" ADD CONSTRAINT "variant_types_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_gallery" ADD CONSTRAINT "projects_gallery_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "projects_gallery" ADD CONSTRAINT "projects_gallery_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_approach" ADD CONSTRAINT "projects_approach_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_palette" ADD CONSTRAINT "projects_palette_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects" ADD CONSTRAINT "projects_hero_media_id_media_id_fk" FOREIGN KEY ("hero_media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "projects" ADD CONSTRAINT "projects_article_id_posts_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."posts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "projects_rels" ADD CONSTRAINT "projects_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_rels" ADD CONSTRAINT "projects_rels_products_fk" FOREIGN KEY ("products_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "posts" ADD CONSTRAINT "posts_category_id_blog_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."blog_categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "posts" ADD CONSTRAINT "posts_hero_image_id_media_id_fk" FOREIGN KEY ("hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "posts" ADD CONSTRAINT "posts_seo_social_image_id_media_id_fk" FOREIGN KEY ("seo_social_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "posts_rels" ADD CONSTRAINT "posts_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "posts_rels" ADD CONSTRAINT "posts_rels_posts_fk" FOREIGN KEY ("posts_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_posts_v" ADD CONSTRAINT "_posts_v_parent_id_posts_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."posts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_posts_v" ADD CONSTRAINT "_posts_v_version_category_id_blog_categories_id_fk" FOREIGN KEY ("version_category_id") REFERENCES "public"."blog_categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_posts_v" ADD CONSTRAINT "_posts_v_version_hero_image_id_media_id_fk" FOREIGN KEY ("version_hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_posts_v" ADD CONSTRAINT "_posts_v_version_seo_social_image_id_media_id_fk" FOREIGN KEY ("version_seo_social_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_posts_v_rels" ADD CONSTRAINT "_posts_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_posts_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_posts_v_rels" ADD CONSTRAINT "_posts_v_rels_posts_fk" FOREIGN KEY ("posts_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "exports_texts" ADD CONSTRAINT "exports_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."exports"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "customer_sessions" ADD CONSTRAINT "customer_sessions_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "addresses" ADD CONSTRAINT "addresses_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "variants_measurements" ADD CONSTRAINT "variants_measurements_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."variants"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "variants" ADD CONSTRAINT "variants_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "variants" ADD CONSTRAINT "variants_main_image_id_media_id_fk" FOREIGN KEY ("main_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "variants_rels" ADD CONSTRAINT "variants_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."variants"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "variants_rels" ADD CONSTRAINT "variants_rels_variant_options_fk" FOREIGN KEY ("variant_options_id") REFERENCES "public"."variant_options"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_variants_v_version_measurements" ADD CONSTRAINT "_variants_v_version_measurements_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_variants_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_variants_v" ADD CONSTRAINT "_variants_v_parent_id_variants_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."variants"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_variants_v" ADD CONSTRAINT "_variants_v_version_product_id_products_id_fk" FOREIGN KEY ("version_product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_variants_v" ADD CONSTRAINT "_variants_v_version_main_image_id_media_id_fk" FOREIGN KEY ("version_main_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_variants_v_rels" ADD CONSTRAINT "_variants_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_variants_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_variants_v_rels" ADD CONSTRAINT "_variants_v_rels_variant_options_fk" FOREIGN KEY ("variant_options_id") REFERENCES "public"."variant_options"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "variant_options" ADD CONSTRAINT "variant_options_variant_type_id_variant_types_id_fk" FOREIGN KEY ("variant_type_id") REFERENCES "public"."variant_types"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "variant_options" ADD CONSTRAINT "variant_options_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "carts_items_configuration" ADD CONSTRAINT "carts_items_configuration_group_id_variant_types_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."variant_types"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "carts_items_configuration" ADD CONSTRAINT "carts_items_configuration_option_id_variant_options_id_fk" FOREIGN KEY ("option_id") REFERENCES "public"."variant_options"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "carts_items_configuration" ADD CONSTRAINT "carts_items_configuration_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."carts_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "carts_items" ADD CONSTRAINT "carts_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "carts_items" ADD CONSTRAINT "carts_items_variant_id_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."variants"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "carts_items" ADD CONSTRAINT "carts_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."carts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "carts" ADD CONSTRAINT "carts_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_jobs_log" ADD CONSTRAINT "payload_jobs_log_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."payload_jobs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_products_fk" FOREIGN KEY ("products_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_orders_fk" FOREIGN KEY ("orders_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_transactions_fk" FOREIGN KEY ("transactions_id") REFERENCES "public"."transactions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_customers_fk" FOREIGN KEY ("customers_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_brands_fk" FOREIGN KEY ("brands_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_variant_types_fk" FOREIGN KEY ("variant_types_id") REFERENCES "public"."variant_types"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_projects_fk" FOREIGN KEY ("projects_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_blog_categories_fk" FOREIGN KEY ("blog_categories_id") REFERENCES "public"."blog_categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_posts_fk" FOREIGN KEY ("posts_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_customer_otp_challenges_fk" FOREIGN KEY ("customer_otp_challenges_id") REFERENCES "public"."customer_otp_challenges"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_customer_sessions_fk" FOREIGN KEY ("customer_sessions_id") REFERENCES "public"."customer_sessions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_addresses_fk" FOREIGN KEY ("addresses_id") REFERENCES "public"."addresses"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_variants_fk" FOREIGN KEY ("variants_id") REFERENCES "public"."variants"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_variant_options_fk" FOREIGN KEY ("variant_options_id") REFERENCES "public"."variant_options"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_carts_fk" FOREIGN KEY ("carts_id") REFERENCES "public"."carts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_customers_fk" FOREIGN KEY ("customers_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "products_gallery_order_idx" ON "products_gallery" USING btree ("_order");
  CREATE INDEX "products_gallery_parent_id_idx" ON "products_gallery" USING btree ("_parent_id");
  CREATE INDEX "products_gallery_image_idx" ON "products_gallery" USING btree ("image_id");
  CREATE INDEX "products_measurements_order_idx" ON "products_measurements" USING btree ("_order");
  CREATE INDEX "products_measurements_parent_id_idx" ON "products_measurements" USING btree ("_parent_id");
  CREATE INDEX "products_technical_specs_order_idx" ON "products_technical_specs" USING btree ("_order");
  CREATE INDEX "products_technical_specs_parent_id_idx" ON "products_technical_specs" USING btree ("_parent_id");
  CREATE INDEX "products_technical_specs_value_fa_idx" ON "products_technical_specs" USING btree ("value_fa");
  CREATE INDEX "products_attributes_order_idx" ON "products_attributes" USING btree ("_order");
  CREATE INDEX "products_attributes_parent_id_idx" ON "products_attributes" USING btree ("_parent_id");
  CREATE INDEX "products_attributes_attribute_idx" ON "products_attributes" USING btree ("attribute_id");
  CREATE UNIQUE INDEX "products_slug_idx" ON "products" USING btree ("slug");
  CREATE INDEX "products_brand_idx" ON "products" USING btree ("brand_id");
  CREATE INDEX "products_availability_mode_idx" ON "products" USING btree ("availability_mode");
  CREATE INDEX "products_price_in_t_m_n_idx" ON "products" USING btree ("price_in_t_m_n");
  CREATE INDEX "products_main_image_idx" ON "products" USING btree ("main_image_id");
  CREATE INDEX "products_updated_at_idx" ON "products" USING btree ("updated_at");
  CREATE INDEX "products_created_at_idx" ON "products" USING btree ("created_at");
  CREATE INDEX "products_deleted_at_idx" ON "products" USING btree ("deleted_at");
  CREATE INDEX "products__status_idx" ON "products" USING btree ("_status");
  CREATE INDEX "products_rels_order_idx" ON "products_rels" USING btree ("order");
  CREATE INDEX "products_rels_parent_idx" ON "products_rels" USING btree ("parent_id");
  CREATE INDEX "products_rels_path_idx" ON "products_rels" USING btree ("path");
  CREATE INDEX "products_rels_categories_id_idx" ON "products_rels" USING btree ("categories_id");
  CREATE INDEX "products_rels_variant_options_id_idx" ON "products_rels" USING btree ("variant_options_id");
  CREATE INDEX "products_rels_products_id_idx" ON "products_rels" USING btree ("products_id");
  CREATE INDEX "products_rels_variant_types_id_idx" ON "products_rels" USING btree ("variant_types_id");
  CREATE INDEX "_products_v_version_gallery_order_idx" ON "_products_v_version_gallery" USING btree ("_order");
  CREATE INDEX "_products_v_version_gallery_parent_id_idx" ON "_products_v_version_gallery" USING btree ("_parent_id");
  CREATE INDEX "_products_v_version_gallery_image_idx" ON "_products_v_version_gallery" USING btree ("image_id");
  CREATE INDEX "_products_v_version_measurements_order_idx" ON "_products_v_version_measurements" USING btree ("_order");
  CREATE INDEX "_products_v_version_measurements_parent_id_idx" ON "_products_v_version_measurements" USING btree ("_parent_id");
  CREATE INDEX "_products_v_version_technical_specs_order_idx" ON "_products_v_version_technical_specs" USING btree ("_order");
  CREATE INDEX "_products_v_version_technical_specs_parent_id_idx" ON "_products_v_version_technical_specs" USING btree ("_parent_id");
  CREATE INDEX "_products_v_version_technical_specs_value_fa_idx" ON "_products_v_version_technical_specs" USING btree ("value_fa");
  CREATE INDEX "_products_v_version_attributes_order_idx" ON "_products_v_version_attributes" USING btree ("_order");
  CREATE INDEX "_products_v_version_attributes_parent_id_idx" ON "_products_v_version_attributes" USING btree ("_parent_id");
  CREATE INDEX "_products_v_version_attributes_attribute_idx" ON "_products_v_version_attributes" USING btree ("attribute_id");
  CREATE INDEX "_products_v_parent_idx" ON "_products_v" USING btree ("parent_id");
  CREATE INDEX "_products_v_version_version_slug_idx" ON "_products_v" USING btree ("version_slug");
  CREATE INDEX "_products_v_version_version_brand_idx" ON "_products_v" USING btree ("version_brand_id");
  CREATE INDEX "_products_v_version_version_availability_mode_idx" ON "_products_v" USING btree ("version_availability_mode");
  CREATE INDEX "_products_v_version_version_price_in_t_m_n_idx" ON "_products_v" USING btree ("version_price_in_t_m_n");
  CREATE INDEX "_products_v_version_version_main_image_idx" ON "_products_v" USING btree ("version_main_image_id");
  CREATE INDEX "_products_v_version_version_updated_at_idx" ON "_products_v" USING btree ("version_updated_at");
  CREATE INDEX "_products_v_version_version_created_at_idx" ON "_products_v" USING btree ("version_created_at");
  CREATE INDEX "_products_v_version_version_deleted_at_idx" ON "_products_v" USING btree ("version_deleted_at");
  CREATE INDEX "_products_v_version_version__status_idx" ON "_products_v" USING btree ("version__status");
  CREATE INDEX "_products_v_created_at_idx" ON "_products_v" USING btree ("created_at");
  CREATE INDEX "_products_v_updated_at_idx" ON "_products_v" USING btree ("updated_at");
  CREATE INDEX "_products_v_latest_idx" ON "_products_v" USING btree ("latest");
  CREATE INDEX "_products_v_autosave_idx" ON "_products_v" USING btree ("autosave");
  CREATE INDEX "_products_v_rels_order_idx" ON "_products_v_rels" USING btree ("order");
  CREATE INDEX "_products_v_rels_parent_idx" ON "_products_v_rels" USING btree ("parent_id");
  CREATE INDEX "_products_v_rels_path_idx" ON "_products_v_rels" USING btree ("path");
  CREATE INDEX "_products_v_rels_categories_id_idx" ON "_products_v_rels" USING btree ("categories_id");
  CREATE INDEX "_products_v_rels_variant_options_id_idx" ON "_products_v_rels" USING btree ("variant_options_id");
  CREATE INDEX "_products_v_rels_products_id_idx" ON "_products_v_rels" USING btree ("products_id");
  CREATE INDEX "_products_v_rels_variant_types_id_idx" ON "_products_v_rels" USING btree ("variant_types_id");
  CREATE INDEX "orders_items_configuration_order_idx" ON "orders_items_configuration" USING btree ("_order");
  CREATE INDEX "orders_items_configuration_parent_id_idx" ON "orders_items_configuration" USING btree ("_parent_id");
  CREATE INDEX "orders_items_configuration_group_idx" ON "orders_items_configuration" USING btree ("group_id");
  CREATE INDEX "orders_items_configuration_option_idx" ON "orders_items_configuration" USING btree ("option_id");
  CREATE INDEX "orders_items_order_idx" ON "orders_items" USING btree ("_order");
  CREATE INDEX "orders_items_parent_id_idx" ON "orders_items" USING btree ("_parent_id");
  CREATE INDEX "orders_items_product_idx" ON "orders_items" USING btree ("product_id");
  CREATE INDEX "orders_items_variant_idx" ON "orders_items" USING btree ("variant_id");
  CREATE INDEX "orders_customer_idx" ON "orders" USING btree ("customer_id");
  CREATE INDEX "orders_customer_address_idx" ON "orders" USING btree ("customer_address_id");
  CREATE UNIQUE INDEX "orders_shipping_shipment_i_d_idx" ON "orders" USING btree ("shipping_shipment_i_d");
  CREATE INDEX "orders_shipping_tracking_code_idx" ON "orders" USING btree ("shipping_tracking_code");
  CREATE UNIQUE INDEX "orders_payment_transaction_idx" ON "orders" USING btree ("payment_transaction_id");
  CREATE UNIQUE INDEX "orders_order_number_idx" ON "orders" USING btree ("order_number");
  CREATE UNIQUE INDEX "orders_source_cart_idx" ON "orders" USING btree ("source_cart_id");
  CREATE INDEX "orders_updated_at_idx" ON "orders" USING btree ("updated_at");
  CREATE INDEX "orders_created_at_idx" ON "orders" USING btree ("created_at");
  CREATE INDEX "orders_rels_order_idx" ON "orders_rels" USING btree ("order");
  CREATE INDEX "orders_rels_parent_idx" ON "orders_rels" USING btree ("parent_id");
  CREATE INDEX "orders_rels_path_idx" ON "orders_rels" USING btree ("path");
  CREATE INDEX "orders_rels_transactions_id_idx" ON "orders_rels" USING btree ("transactions_id");
  CREATE INDEX "transactions_items_configuration_order_idx" ON "transactions_items_configuration" USING btree ("_order");
  CREATE INDEX "transactions_items_configuration_parent_id_idx" ON "transactions_items_configuration" USING btree ("_parent_id");
  CREATE INDEX "transactions_items_configuration_group_idx" ON "transactions_items_configuration" USING btree ("group_id");
  CREATE INDEX "transactions_items_configuration_option_idx" ON "transactions_items_configuration" USING btree ("option_id");
  CREATE INDEX "transactions_items_order_idx" ON "transactions_items" USING btree ("_order");
  CREATE INDEX "transactions_items_parent_id_idx" ON "transactions_items" USING btree ("_parent_id");
  CREATE INDEX "transactions_items_product_idx" ON "transactions_items" USING btree ("product_id");
  CREATE INDEX "transactions_items_variant_idx" ON "transactions_items" USING btree ("variant_id");
  CREATE UNIQUE INDEX "transactions_zarinpal_zarinpal_authority_idx" ON "transactions" USING btree ("zarinpal_authority");
  CREATE INDEX "transactions_zarinpal_zarinpal_reference_i_d_idx" ON "transactions" USING btree ("zarinpal_reference_i_d");
  CREATE INDEX "transactions_customer_idx" ON "transactions" USING btree ("customer_id");
  CREATE INDEX "transactions_order_idx" ON "transactions" USING btree ("order_id");
  CREATE INDEX "transactions_cart_idx" ON "transactions" USING btree ("cart_id");
  CREATE INDEX "transactions_updated_at_idx" ON "transactions" USING btree ("updated_at");
  CREATE INDEX "transactions_created_at_idx" ON "transactions" USING btree ("created_at");
  CREATE UNIQUE INDEX "customers_phone_idx" ON "customers" USING btree ("phone");
  CREATE INDEX "customers_updated_at_idx" ON "customers" USING btree ("updated_at");
  CREATE INDEX "customers_created_at_idx" ON "customers" USING btree ("created_at");
  CREATE UNIQUE INDEX "categories_slug_idx" ON "categories" USING btree ("slug");
  CREATE INDEX "categories_parent_idx" ON "categories" USING btree ("parent_id");
  CREATE INDEX "categories_image_idx" ON "categories" USING btree ("image_id");
  CREATE INDEX "categories_show_on_storefront_idx" ON "categories" USING btree ("show_on_storefront");
  CREATE INDEX "categories_updated_at_idx" ON "categories" USING btree ("updated_at");
  CREATE INDEX "categories_created_at_idx" ON "categories" USING btree ("created_at");
  CREATE UNIQUE INDEX "brands_slug_idx" ON "brands" USING btree ("slug");
  CREATE INDEX "brands_logo_idx" ON "brands" USING btree ("logo_id");
  CREATE INDEX "brands_hero_media_idx" ON "brands" USING btree ("hero_media_id");
  CREATE INDEX "brands_updated_at_idx" ON "brands" USING btree ("updated_at");
  CREATE INDEX "brands_created_at_idx" ON "brands" USING btree ("created_at");
  CREATE UNIQUE INDEX "variant_types_name_idx" ON "variant_types" USING btree ("name");
  CREATE INDEX "variant_types_updated_at_idx" ON "variant_types" USING btree ("updated_at");
  CREATE INDEX "variant_types_created_at_idx" ON "variant_types" USING btree ("created_at");
  CREATE INDEX "variant_types_rels_order_idx" ON "variant_types_rels" USING btree ("order");
  CREATE INDEX "variant_types_rels_parent_idx" ON "variant_types_rels" USING btree ("parent_id");
  CREATE INDEX "variant_types_rels_path_idx" ON "variant_types_rels" USING btree ("path");
  CREATE INDEX "variant_types_rels_categories_id_idx" ON "variant_types_rels" USING btree ("categories_id");
  CREATE INDEX "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "media" USING btree ("filename");
  CREATE INDEX "media_sizes_admin_thumbnail_sizes_admin_thumbnail_filena_idx" ON "media" USING btree ("sizes_admin_thumbnail_filename");
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
  CREATE UNIQUE INDEX "blog_categories_slug_idx" ON "blog_categories" USING btree ("slug");
  CREATE INDEX "blog_categories_updated_at_idx" ON "blog_categories" USING btree ("updated_at");
  CREATE INDEX "blog_categories_created_at_idx" ON "blog_categories" USING btree ("created_at");
  CREATE UNIQUE INDEX "posts_slug_idx" ON "posts" USING btree ("slug");
  CREATE INDEX "posts_category_idx" ON "posts" USING btree ("category_id");
  CREATE INDEX "posts_hero_image_idx" ON "posts" USING btree ("hero_image_id");
  CREATE INDEX "posts_seo_seo_social_image_idx" ON "posts" USING btree ("seo_social_image_id");
  CREATE INDEX "posts_published_at_idx" ON "posts" USING btree ("published_at");
  CREATE INDEX "posts_updated_at_idx" ON "posts" USING btree ("updated_at");
  CREATE INDEX "posts_created_at_idx" ON "posts" USING btree ("created_at");
  CREATE INDEX "posts__status_idx" ON "posts" USING btree ("_status");
  CREATE INDEX "posts_rels_order_idx" ON "posts_rels" USING btree ("order");
  CREATE INDEX "posts_rels_parent_idx" ON "posts_rels" USING btree ("parent_id");
  CREATE INDEX "posts_rels_path_idx" ON "posts_rels" USING btree ("path");
  CREATE INDEX "posts_rels_posts_id_idx" ON "posts_rels" USING btree ("posts_id");
  CREATE INDEX "_posts_v_parent_idx" ON "_posts_v" USING btree ("parent_id");
  CREATE INDEX "_posts_v_version_version_slug_idx" ON "_posts_v" USING btree ("version_slug");
  CREATE INDEX "_posts_v_version_version_category_idx" ON "_posts_v" USING btree ("version_category_id");
  CREATE INDEX "_posts_v_version_version_hero_image_idx" ON "_posts_v" USING btree ("version_hero_image_id");
  CREATE INDEX "_posts_v_version_seo_version_seo_social_image_idx" ON "_posts_v" USING btree ("version_seo_social_image_id");
  CREATE INDEX "_posts_v_version_version_published_at_idx" ON "_posts_v" USING btree ("version_published_at");
  CREATE INDEX "_posts_v_version_version_updated_at_idx" ON "_posts_v" USING btree ("version_updated_at");
  CREATE INDEX "_posts_v_version_version_created_at_idx" ON "_posts_v" USING btree ("version_created_at");
  CREATE INDEX "_posts_v_version_version__status_idx" ON "_posts_v" USING btree ("version__status");
  CREATE INDEX "_posts_v_created_at_idx" ON "_posts_v" USING btree ("created_at");
  CREATE INDEX "_posts_v_updated_at_idx" ON "_posts_v" USING btree ("updated_at");
  CREATE INDEX "_posts_v_latest_idx" ON "_posts_v" USING btree ("latest");
  CREATE INDEX "_posts_v_autosave_idx" ON "_posts_v" USING btree ("autosave");
  CREATE INDEX "_posts_v_rels_order_idx" ON "_posts_v_rels" USING btree ("order");
  CREATE INDEX "_posts_v_rels_parent_idx" ON "_posts_v_rels" USING btree ("parent_id");
  CREATE INDEX "_posts_v_rels_path_idx" ON "_posts_v_rels" USING btree ("path");
  CREATE INDEX "_posts_v_rels_posts_id_idx" ON "_posts_v_rels" USING btree ("posts_id");
  CREATE INDEX "users_sessions_order_idx" ON "users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");
  CREATE INDEX "exports_updated_at_idx" ON "exports" USING btree ("updated_at");
  CREATE INDEX "exports_created_at_idx" ON "exports" USING btree ("created_at");
  CREATE UNIQUE INDEX "exports_filename_idx" ON "exports" USING btree ("filename");
  CREATE INDEX "exports_texts_order_parent" ON "exports_texts" USING btree ("order","parent_id");
  CREATE INDEX "imports_updated_at_idx" ON "imports" USING btree ("updated_at");
  CREATE INDEX "imports_created_at_idx" ON "imports" USING btree ("created_at");
  CREATE UNIQUE INDEX "imports_filename_idx" ON "imports" USING btree ("filename");
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
  CREATE INDEX "addresses_customer_idx" ON "addresses" USING btree ("customer_id");
  CREATE INDEX "addresses_display_label_idx" ON "addresses" USING btree ("display_label");
  CREATE INDEX "addresses_updated_at_idx" ON "addresses" USING btree ("updated_at");
  CREATE INDEX "addresses_created_at_idx" ON "addresses" USING btree ("created_at");
  CREATE INDEX "variants_measurements_order_idx" ON "variants_measurements" USING btree ("_order");
  CREATE INDEX "variants_measurements_parent_id_idx" ON "variants_measurements" USING btree ("_parent_id");
  CREATE INDEX "variants_product_idx" ON "variants" USING btree ("product_id");
  CREATE UNIQUE INDEX "variants_nilper_code_idx" ON "variants" USING btree ("nilper_code");
  CREATE UNIQUE INDEX "variants_combination_key_idx" ON "variants" USING btree ("combination_key");
  CREATE INDEX "variants_main_image_idx" ON "variants" USING btree ("main_image_id");
  CREATE INDEX "variants_updated_at_idx" ON "variants" USING btree ("updated_at");
  CREATE INDEX "variants_created_at_idx" ON "variants" USING btree ("created_at");
  CREATE INDEX "variants_deleted_at_idx" ON "variants" USING btree ("deleted_at");
  CREATE INDEX "variants__status_idx" ON "variants" USING btree ("_status");
  CREATE INDEX "variants_rels_order_idx" ON "variants_rels" USING btree ("order");
  CREATE INDEX "variants_rels_parent_idx" ON "variants_rels" USING btree ("parent_id");
  CREATE INDEX "variants_rels_path_idx" ON "variants_rels" USING btree ("path");
  CREATE INDEX "variants_rels_variant_options_id_idx" ON "variants_rels" USING btree ("variant_options_id");
  CREATE INDEX "_variants_v_version_measurements_order_idx" ON "_variants_v_version_measurements" USING btree ("_order");
  CREATE INDEX "_variants_v_version_measurements_parent_id_idx" ON "_variants_v_version_measurements" USING btree ("_parent_id");
  CREATE INDEX "_variants_v_parent_idx" ON "_variants_v" USING btree ("parent_id");
  CREATE INDEX "_variants_v_version_version_product_idx" ON "_variants_v" USING btree ("version_product_id");
  CREATE INDEX "_variants_v_version_version_nilper_code_idx" ON "_variants_v" USING btree ("version_nilper_code");
  CREATE INDEX "_variants_v_version_version_combination_key_idx" ON "_variants_v" USING btree ("version_combination_key");
  CREATE INDEX "_variants_v_version_version_main_image_idx" ON "_variants_v" USING btree ("version_main_image_id");
  CREATE INDEX "_variants_v_version_version_updated_at_idx" ON "_variants_v" USING btree ("version_updated_at");
  CREATE INDEX "_variants_v_version_version_created_at_idx" ON "_variants_v" USING btree ("version_created_at");
  CREATE INDEX "_variants_v_version_version_deleted_at_idx" ON "_variants_v" USING btree ("version_deleted_at");
  CREATE INDEX "_variants_v_version_version__status_idx" ON "_variants_v" USING btree ("version__status");
  CREATE INDEX "_variants_v_created_at_idx" ON "_variants_v" USING btree ("created_at");
  CREATE INDEX "_variants_v_updated_at_idx" ON "_variants_v" USING btree ("updated_at");
  CREATE INDEX "_variants_v_latest_idx" ON "_variants_v" USING btree ("latest");
  CREATE INDEX "_variants_v_autosave_idx" ON "_variants_v" USING btree ("autosave");
  CREATE INDEX "_variants_v_rels_order_idx" ON "_variants_v_rels" USING btree ("order");
  CREATE INDEX "_variants_v_rels_parent_idx" ON "_variants_v_rels" USING btree ("parent_id");
  CREATE INDEX "_variants_v_rels_path_idx" ON "_variants_v_rels" USING btree ("path");
  CREATE INDEX "_variants_v_rels_variant_options_id_idx" ON "_variants_v_rels" USING btree ("variant_options_id");
  CREATE INDEX "variant_options__variantoptions_options_order_idx" ON "variant_options" USING btree ("_variantoptions_options_order");
  CREATE INDEX "variant_options_variant_type_idx" ON "variant_options" USING btree ("variant_type_id");
  CREATE UNIQUE INDEX "variant_options_value_idx" ON "variant_options" USING btree ("value");
  CREATE INDEX "variant_options_image_idx" ON "variant_options" USING btree ("image_id");
  CREATE INDEX "variant_options_updated_at_idx" ON "variant_options" USING btree ("updated_at");
  CREATE INDEX "variant_options_created_at_idx" ON "variant_options" USING btree ("created_at");
  CREATE INDEX "carts_items_configuration_order_idx" ON "carts_items_configuration" USING btree ("_order");
  CREATE INDEX "carts_items_configuration_parent_id_idx" ON "carts_items_configuration" USING btree ("_parent_id");
  CREATE INDEX "carts_items_configuration_group_idx" ON "carts_items_configuration" USING btree ("group_id");
  CREATE INDEX "carts_items_configuration_option_idx" ON "carts_items_configuration" USING btree ("option_id");
  CREATE INDEX "carts_items_order_idx" ON "carts_items" USING btree ("_order");
  CREATE INDEX "carts_items_parent_id_idx" ON "carts_items" USING btree ("_parent_id");
  CREATE INDEX "carts_items_product_idx" ON "carts_items" USING btree ("product_id");
  CREATE INDEX "carts_items_variant_idx" ON "carts_items" USING btree ("variant_id");
  CREATE INDEX "carts_secret_idx" ON "carts" USING btree ("secret");
  CREATE INDEX "carts_customer_idx" ON "carts" USING btree ("customer_id");
  CREATE INDEX "carts_purchased_at_idx" ON "carts" USING btree ("purchased_at");
  CREATE INDEX "carts_updated_at_idx" ON "carts" USING btree ("updated_at");
  CREATE INDEX "carts_created_at_idx" ON "carts" USING btree ("created_at");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
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
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_products_id_idx" ON "payload_locked_documents_rels" USING btree ("products_id");
  CREATE INDEX "payload_locked_documents_rels_orders_id_idx" ON "payload_locked_documents_rels" USING btree ("orders_id");
  CREATE INDEX "payload_locked_documents_rels_transactions_id_idx" ON "payload_locked_documents_rels" USING btree ("transactions_id");
  CREATE INDEX "payload_locked_documents_rels_customers_id_idx" ON "payload_locked_documents_rels" USING btree ("customers_id");
  CREATE INDEX "payload_locked_documents_rels_categories_id_idx" ON "payload_locked_documents_rels" USING btree ("categories_id");
  CREATE INDEX "payload_locked_documents_rels_brands_id_idx" ON "payload_locked_documents_rels" USING btree ("brands_id");
  CREATE INDEX "payload_locked_documents_rels_variant_types_id_idx" ON "payload_locked_documents_rels" USING btree ("variant_types_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_projects_id_idx" ON "payload_locked_documents_rels" USING btree ("projects_id");
  CREATE INDEX "payload_locked_documents_rels_blog_categories_id_idx" ON "payload_locked_documents_rels" USING btree ("blog_categories_id");
  CREATE INDEX "payload_locked_documents_rels_posts_id_idx" ON "payload_locked_documents_rels" USING btree ("posts_id");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_locked_documents_rels_customer_otp_challenges_id_idx" ON "payload_locked_documents_rels" USING btree ("customer_otp_challenges_id");
  CREATE INDEX "payload_locked_documents_rels_customer_sessions_id_idx" ON "payload_locked_documents_rels" USING btree ("customer_sessions_id");
  CREATE INDEX "payload_locked_documents_rels_addresses_id_idx" ON "payload_locked_documents_rels" USING btree ("addresses_id");
  CREATE INDEX "payload_locked_documents_rels_variants_id_idx" ON "payload_locked_documents_rels" USING btree ("variants_id");
  CREATE INDEX "payload_locked_documents_rels_variant_options_id_idx" ON "payload_locked_documents_rels" USING btree ("variant_options_id");
  CREATE INDEX "payload_locked_documents_rels_carts_id_idx" ON "payload_locked_documents_rels" USING btree ("carts_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_customers_id_idx" ON "payload_preferences_rels" USING btree ("customers_id");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");`)

  await db.execute(sql`
    CREATE TABLE "_npgroup_schema_baseline" (
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  const baselineMarker = await db.execute(
    sql`SELECT to_regclass('public._npgroup_schema_baseline') AS "exists";`,
  )

  if (!baselineMarker.rows[0]?.exists) {
    return
  }

  await db.execute(sql`
   DROP TABLE "products_gallery" CASCADE;
  DROP TABLE "products_measurements" CASCADE;
  DROP TABLE "products_technical_specs" CASCADE;
  DROP TABLE "products_attributes" CASCADE;
  DROP TABLE "products" CASCADE;
  DROP TABLE "products_rels" CASCADE;
  DROP TABLE "_products_v_version_gallery" CASCADE;
  DROP TABLE "_products_v_version_measurements" CASCADE;
  DROP TABLE "_products_v_version_technical_specs" CASCADE;
  DROP TABLE "_products_v_version_attributes" CASCADE;
  DROP TABLE "_products_v" CASCADE;
  DROP TABLE "_products_v_rels" CASCADE;
  DROP TABLE "orders_items_configuration" CASCADE;
  DROP TABLE "orders_items" CASCADE;
  DROP TABLE "orders" CASCADE;
  DROP TABLE "orders_rels" CASCADE;
  DROP TABLE "transactions_items_configuration" CASCADE;
  DROP TABLE "transactions_items" CASCADE;
  DROP TABLE "transactions" CASCADE;
  DROP TABLE "customers" CASCADE;
  DROP TABLE "categories" CASCADE;
  DROP TABLE "brands" CASCADE;
  DROP TABLE "variant_types" CASCADE;
  DROP TABLE "variant_types_rels" CASCADE;
  DROP TABLE "media" CASCADE;
  DROP TABLE "projects_gallery" CASCADE;
  DROP TABLE "projects_approach" CASCADE;
  DROP TABLE "projects_palette" CASCADE;
  DROP TABLE "projects" CASCADE;
  DROP TABLE "projects_rels" CASCADE;
  DROP TABLE "blog_categories" CASCADE;
  DROP TABLE "posts" CASCADE;
  DROP TABLE "posts_rels" CASCADE;
  DROP TABLE "_posts_v" CASCADE;
  DROP TABLE "_posts_v_rels" CASCADE;
  DROP TABLE "users_sessions" CASCADE;
  DROP TABLE "users" CASCADE;
  DROP TABLE "exports" CASCADE;
  DROP TABLE "exports_texts" CASCADE;
  DROP TABLE "imports" CASCADE;
  DROP TABLE "customer_otp_challenges" CASCADE;
  DROP TABLE "customer_sessions" CASCADE;
  DROP TABLE "addresses" CASCADE;
  DROP TABLE "variants_measurements" CASCADE;
  DROP TABLE "variants" CASCADE;
  DROP TABLE "variants_rels" CASCADE;
  DROP TABLE "_variants_v_version_measurements" CASCADE;
  DROP TABLE "_variants_v" CASCADE;
  DROP TABLE "_variants_v_rels" CASCADE;
  DROP TABLE "variant_options" CASCADE;
  DROP TABLE "carts_items_configuration" CASCADE;
  DROP TABLE "carts_items" CASCADE;
  DROP TABLE "carts" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_jobs_log" CASCADE;
  DROP TABLE "payload_jobs" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TABLE "payload_jobs_stats" CASCADE;
  DROP TYPE "public"."enum_products_measurements_unit";
  DROP TYPE "public"."enum_products_product_type";
  DROP TYPE "public"."enum_products_sales_mode";
  DROP TYPE "public"."enum_products_availability_mode";
  DROP TYPE "public"."enum_products_shipping_mode";
  DROP TYPE "public"."enum_products_status";
  DROP TYPE "public"."enum__products_v_version_measurements_unit";
  DROP TYPE "public"."enum__products_v_version_product_type";
  DROP TYPE "public"."enum__products_v_version_sales_mode";
  DROP TYPE "public"."enum__products_v_version_availability_mode";
  DROP TYPE "public"."enum__products_v_version_shipping_mode";
  DROP TYPE "public"."enum__products_v_version_status";
  DROP TYPE "public"."enum_orders_items_shipping_mode_snapshot";
  DROP TYPE "public"."enum_orders_delivery_method";
  DROP TYPE "public"."enum_orders_shipping_mode";
  DROP TYPE "public"."enum_orders_shipping_provider";
  DROP TYPE "public"."enum_orders_shipping_status";
  DROP TYPE "public"."enum_orders_currency";
  DROP TYPE "public"."enum_orders_payment_method";
  DROP TYPE "public"."enum_orders_status";
  DROP TYPE "public"."enum_transactions_items_shipping_mode_snapshot";
  DROP TYPE "public"."enum_transactions_payment_method";
  DROP TYPE "public"."enum_transactions_status";
  DROP TYPE "public"."enum_transactions_currency";
  DROP TYPE "public"."enum_transactions_shipping_mode";
  DROP TYPE "public"."enum_transactions_shipping_provider";
  DROP TYPE "public"."enum_variant_types_catalog_filter_presentation";
  DROP TYPE "public"."enum_variant_types_catalog_filter_placement";
  DROP TYPE "public"."enum_variant_types_catalog_filter_scope";
  DROP TYPE "public"."enum_projects_sector";
  DROP TYPE "public"."enum_posts_status";
  DROP TYPE "public"."enum__posts_v_version_status";
  DROP TYPE "public"."enum_users_role";
  DROP TYPE "public"."enum_exports_format";
  DROP TYPE "public"."enum_exports_sort_order";
  DROP TYPE "public"."enum_exports_drafts";
  DROP TYPE "public"."enum_imports_import_mode";
  DROP TYPE "public"."enum_imports_status";
  DROP TYPE "public"."enum_customer_otp_challenges_delivery_state";
  DROP TYPE "public"."enum_addresses_country";
  DROP TYPE "public"."enum_variants_measurements_unit";
  DROP TYPE "public"."enum_variants_shipping_mode";
  DROP TYPE "public"."enum_variants_availability_mode";
  DROP TYPE "public"."enum_variants_status";
  DROP TYPE "public"."enum__variants_v_version_measurements_unit";
  DROP TYPE "public"."enum__variants_v_version_shipping_mode";
  DROP TYPE "public"."enum__variants_v_version_availability_mode";
  DROP TYPE "public"."enum__variants_v_version_status";
  DROP TYPE "public"."enum_carts_items_shipping_mode_snapshot";
  DROP TYPE "public"."enum_carts_currency";
  DROP TYPE "public"."enum_payload_jobs_log_task_slug";
  DROP TYPE "public"."enum_payload_jobs_log_state";
  DROP TYPE "public"."enum_payload_jobs_task_slug";`)

  await db.execute(sql`DROP TABLE "_npgroup_schema_baseline";`)
}
