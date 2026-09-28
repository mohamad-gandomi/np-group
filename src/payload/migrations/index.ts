import * as migration_20260926_085827_catalog_facets from './20260926_085827_catalog_facets';
import * as migration_20260926_092507_catalog_filter_categories from './20260926_092507_catalog_filter_categories';
import * as migration_20260926_093933_catalog_filter_data_cleanup from './20260926_093933_catalog_filter_data_cleanup';

export const migrations = [
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
    name: '20260926_093933_catalog_filter_data_cleanup'
  },
];
