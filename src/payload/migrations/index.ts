import * as migration_20260926_085827_catalog_facets from './20260926_085827_catalog_facets';
import * as migration_20260926_092507_catalog_filter_categories from './20260926_092507_catalog_filter_categories';

export const migrations = [
  {
    up: migration_20260926_085827_catalog_facets.up,
    down: migration_20260926_085827_catalog_facets.down,
    name: '20260926_085827_catalog_facets',
  },
  {
    up: migration_20260926_092507_catalog_filter_categories.up,
    down: migration_20260926_092507_catalog_filter_categories.down,
    name: '20260926_092507_catalog_filter_categories'
  },
];
