import * as migration_20260909_110900_payload_foundation from './20260909_110900_payload_foundation';

export const migrations = [
  {
    up: migration_20260909_110900_payload_foundation.up,
    down: migration_20260909_110900_payload_foundation.down,
    name: '20260909_110900_payload_foundation'
  },
];
