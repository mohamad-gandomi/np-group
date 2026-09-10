import * as migration_20260909_110900_payload_foundation from './20260909_110900_payload_foundation';
import * as migration_20260909_220639_nilper_product_domain from './20260909_220639_nilper_product_domain';
import * as migration_20260910_065423_nilper_cart_configuration from './20260910_065423_nilper_cart_configuration';

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
];
