import * as migration_20260909_110900_payload_foundation from './20260909_110900_payload_foundation';
import * as migration_20260909_220639_nilper_product_domain from './20260909_220639_nilper_product_domain';
import * as migration_20260910_065423_nilper_cart_configuration from './20260910_065423_nilper_cart_configuration';
import * as migration_20260911_102308_nilper_storefront_cart_persistence from './20260911_102308_nilper_storefront_cart_persistence';
import * as migration_20260911_103938_nilper_payload_orders from './20260911_103938_nilper_payload_orders';
import * as migration_20260912_104215_nilper_customer_auth from './20260912_104215_nilper_customer_auth';
import * as migration_20260912_111822_nilper_payload_account_cutover from './20260912_111822_nilper_payload_account_cutover';

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
    name: '20260911_103938_nilper_payload_orders',
  },
  {
    up: migration_20260912_104215_nilper_customer_auth.up,
    down: migration_20260912_104215_nilper_customer_auth.down,
    name: '20260912_104215_nilper_customer_auth',
  },
  {
    up: migration_20260912_111822_nilper_payload_account_cutover.up,
    down: migration_20260912_111822_nilper_payload_account_cutover.down,
    name: '20260912_111822_nilper_payload_account_cutover'
  },
];
