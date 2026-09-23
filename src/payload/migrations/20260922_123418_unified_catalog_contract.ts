import { sql, type MigrateUpArgs, type MigrateDownArgs } from '@payloadcms/db-postgres';

// Contract the active schema only after backfill verification. Source tables remain recoverable.
export async function up({ db, payload }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      IF EXISTS(SELECT 1 FROM configuration_groups g LEFT JOIN catalog_migration_map m ON m.source='configuration-groups' AND m.old_id=g.id LEFT JOIN variant_types a ON a.id=m.new_id WHERE a.id IS NULL)
        OR EXISTS(SELECT 1 FROM configuration_options o LEFT JOIN catalog_migration_map m ON m.source='configuration-options' AND m.old_id=o.id LEFT JOIN variant_options a ON a.id=m.new_id WHERE a.id IS NULL)
        OR EXISTS(SELECT 1 FROM product_series s LEFT JOIN catalog_migration_map m ON m.source='product-series' AND m.old_id=s.id LEFT JOIN categories c ON c.id=m.new_id WHERE c.id IS NULL)
      THEN RAISE EXCEPTION 'Catalog backfill must be complete before contraction'; END IF;
      IF EXISTS(SELECT 1 FROM variants v JOIN products p ON p.id=v.product_id
        WHERE coalesce((SELECT pv.version_product_type::text FROM _products_v pv WHERE pv.parent_id=p.id AND pv.latest=true ORDER BY pv.id DESC LIMIT 1),p.product_type::text) <> 'variable')
      THEN RAISE EXCEPTION 'A product with variants is not variable'; END IF;
      IF EXISTS(SELECT 1 FROM variants v WHERE v._status='published' AND v.combination_key IS NULL)
      THEN RAISE EXCEPTION 'Published variant without a combination'; END IF;
    END $$;
    CREATE SCHEMA IF NOT EXISTS catalog_legacy;
    CREATE TABLE catalog_legacy.product_references AS SELECT id,series_id FROM products;
    CREATE TABLE catalog_legacy.product_version_references AS SELECT id,parent_id,version_series_id FROM _products_v;
    CREATE TABLE catalog_legacy.product_attribute_references AS SELECT * FROM products_rels WHERE path='configurationGroups';
    CREATE TABLE catalog_legacy.product_version_attribute_references AS SELECT * FROM _products_v_rels WHERE path='version.configurationGroups';
    ALTER TABLE product_series SET SCHEMA catalog_legacy;
    ALTER TABLE configuration_groups SET SCHEMA catalog_legacy;
    ALTER TABLE configuration_options SET SCHEMA catalog_legacy;
    ALTER TYPE enum_configuration_groups_input_type SET SCHEMA catalog_legacy;
    ALTER TABLE products DROP COLUMN series_id;
    ALTER TABLE _products_v DROP COLUMN version_series_id;
    DELETE FROM products_rels WHERE path='configurationGroups';
    DELETE FROM _products_v_rels WHERE path='version.configurationGroups';
    ALTER TABLE products_rels DROP COLUMN configuration_groups_id;
    ALTER TABLE _products_v_rels DROP COLUMN configuration_groups_id;
    ALTER TABLE payload_locked_documents_rels DROP COLUMN product_series_id;
    ALTER TABLE payload_locked_documents_rels DROP COLUMN configuration_groups_id;
    ALTER TABLE payload_locked_documents_rels DROP COLUMN configuration_options_id;
    ALTER TABLE variant_types DROP COLUMN deleted_at;
    ALTER TABLE variant_options DROP COLUMN deleted_at;
  `);
  payload.logger.info('Legacy editor collections retired. Recovery data remains in catalog_legacy and catalog_migration_map.');
}

export async function down(_args: MigrateDownArgs): Promise<void> {
  throw new Error('Forward-only catalog contract: restore the pre-migration backup for a complete rollback.');
}
