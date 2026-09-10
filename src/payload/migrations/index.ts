import * as migration_20260909_110900_payload_foundation from './20260909_110900_payload_foundation';
import * as migration_20260909_220639_nilper_product_domain from './20260909_220639_nilper_product_domain';

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
];
