import * as migration_20260926_080000_schema_baseline from './20260926_080000_schema_baseline';
import * as migration_20260926_085827_catalog_facets from './20260926_085827_catalog_facets';
import * as migration_20260926_092507_catalog_filter_categories from './20260926_092507_catalog_filter_categories';
import * as migration_20260926_093933_catalog_filter_data_cleanup from './20260926_093933_catalog_filter_data_cleanup';
import * as migration_20260929_092253_product_measurement_groups_attribute_labels from './20260929_092253_product_measurement_groups_attribute_labels';

export const migrations = [
  {
    up: migration_20260926_080000_schema_baseline.up,
    down: migration_20260926_080000_schema_baseline.down,
    name: '20260926_080000_schema_baseline',
  },
  {
    up: migration_20260926_085827_catalog_facets.up,
    down: migration_20260926_085827_catalog_facets.down,
    name: '20260926_085827_catalog_facets',
  },
  {
    up: migration_20260926_092507_catalog_filter_categories.up,
    down: migration_20260926_092507_catalog_filter_categories.down,
    name: '20260926_092507_catalog_filter_categories',
  },
  {
    up: migration_20260926_093933_catalog_filter_data_cleanup.up,
    down: migration_20260926_093933_catalog_filter_data_cleanup.down,
    name: '20260926_093933_catalog_filter_data_cleanup',
  },
  {
    up: migration_20260929_092253_product_measurement_groups_attribute_labels.up,
    down: migration_20260929_092253_product_measurement_groups_attribute_labels.down,
    name: '20260929_092253_product_measurement_groups_attribute_labels'
  },
];
