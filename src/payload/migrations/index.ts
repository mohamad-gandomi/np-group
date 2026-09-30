import * as migration_20260926_080000_schema_baseline from './20260926_080000_schema_baseline';
import * as migration_20260926_085827_catalog_facets from './20260926_085827_catalog_facets';
import * as migration_20260926_092507_catalog_filter_categories from './20260926_092507_catalog_filter_categories';
import * as migration_20260926_093933_catalog_filter_data_cleanup from './20260926_093933_catalog_filter_data_cleanup';
import * as migration_20260929_092253_product_measurement_groups_attribute_labels from './20260929_092253_product_measurement_groups_attribute_labels';
import * as migration_20260929_121830 from './20260929_121830';
import * as migration_20260930_084031 from './20260930_084031';

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
    name: '20260929_092253_product_measurement_groups_attribute_labels',
  },
  {
    up: migration_20260929_121830.up,
    down: migration_20260929_121830.down,
    name: '20260929_121830',
  },
  {
    up: migration_20260930_084031.up,
    down: migration_20260930_084031.down,
    name: '20260930_084031'
  },
];
