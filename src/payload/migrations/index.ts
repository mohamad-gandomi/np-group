import * as migration_20260909_110900_payload_foundation from './20260909_110900_payload_foundation';
import * as migration_20260909_220639_nilper_product_domain from './20260909_220639_nilper_product_domain';
import * as migration_20260910_065423_nilper_cart_configuration from './20260910_065423_nilper_cart_configuration';
import * as migration_20260911_102308_nilper_storefront_cart_persistence from './20260911_102308_nilper_storefront_cart_persistence';
import * as migration_20260911_103938_nilper_payload_orders from './20260911_103938_nilper_payload_orders';

export const migrations = [
  {
    up: migration_20260909_110900_payload_foundation.up,
    down: migration_20260909_110900_payload_foundation.down,
    name: '20260909_110900_payload_foundation',
  },
  {
    up: migration_20260909_220639_nilper_product_domain.up,
    down: migration_20260909_220639_nilper_product_domain.down,
    name: '20260909_220639_nilper_product_domain',
  },
  {
    up: migration_20260910_065423_nilper_cart_configuration.up,
    down: migration_20260910_065423_nilper_cart_configuration.down,
    name: '20260910_065423_nilper_cart_configuration',
  },
  {
    up: migration_20260911_102308_nilper_storefront_cart_persistence.up,
    down: migration_20260911_102308_nilper_storefront_cart_persistence.down,
    name: '20260911_102308_nilper_storefront_cart_persistence',
  },
  {
    up: migration_20260911_103938_nilper_payload_orders.up,
    down: migration_20260911_103938_nilper_payload_orders.down,
    name: '20260911_103938_nilper_payload_orders'
  },
];
