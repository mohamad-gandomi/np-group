// One-time recovery for a dev-pushed database whose migration ledger is behind.
// Default is read-only. --apply records ONLY the three verified baseline migrations.
import fs from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
require('@next/env').loadEnvConfig(process.cwd());
const { Client } = require('pg');
const client = new Client({ connectionString: process.env.DATABASE_URI });
await client.connect();
try {
  const expected = JSON.parse(fs.readFileSync('src/payload/migrations/20260917_171851_optional_import_images.json', 'utf8'));
  const columns = (await client.query(`SELECT c.relname table_name,a.attname column_name,format_type(a.atttypid,a.atttypmod) type,a.attnotnull required FROM pg_attribute a JOIN pg_class c ON c.oid=a.attrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND a.attnum>0 AND NOT a.attisdropped`)).rows;
  const indexes = (await client.query(`SELECT c.relname name,i.indisunique unique FROM pg_index i JOIN pg_class c ON c.oid=i.indexrelid`)).rows;
  const constraints = (await client.query(`SELECT conname name FROM pg_constraint`)).rows;
  const enums = (await client.query(`SELECT t.typname name,e.enumlabel value FROM pg_enum e JOIN pg_type t ON t.oid=e.enumtypid ORDER BY e.enumsortorder`)).rows;
  const normalize = (type) => type.replace(/^serial$/, 'integer').replace(/^varchar$/, 'character varying').replace(/^timestamp\(3\) with time zone$/, 'timestamp(3) with time zone');
  const errors = [];
  for (const table of Object.values(expected.tables)) {
    for (const column of Object.values(table.columns)) {
      const live = columns.find((c) => c.table_name === table.name && c.column_name === column.name);
      if (!live || normalize(column.type) !== live.type || column.notNull !== live.required) errors.push(`${table.name}.${column.name}: schema mismatch`);
    }
    for (const index of Object.values(table.indexes)) {
      if (!indexes.some((i) => i.name === index.name && i.unique === index.isUnique)) errors.push(`${index.name}: index mismatch`);
    }
    for (const key of Object.values(table.foreignKeys)) {
      if (!constraints.some((c) => c.name === key.name.slice(0, 63))) errors.push(`${key.name}: missing foreign key`);
    }
  }
  for (const enumeration of Object.values(expected.enums)) {
    const actual = enums.filter((e) => e.name === enumeration.name).map((e) => e.value);
    if (JSON.stringify(actual) !== JSON.stringify(enumeration.values)) errors.push(`${enumeration.name}: enum mismatch`);
  }
  if (errors.length) throw new Error(errors.join('\n'));
  console.log('Baseline columns, nullability, types, indexes, foreign keys, and enum values verified.');
  if (process.argv.includes('--apply')) {
    await client.query('BEGIN');
    const dev = await client.query(`SELECT id FROM payload_migrations WHERE name='dev'`);
    if (!dev.rowCount) throw new Error('No development schema marker; reconciliation is not applicable.');
    for (const name of ['20260916_084808_storefront_showcase_and_sales_contacts', '20260917_101243_nilper_data_transfer', '20260917_171851_optional_import_images']) {
      await client.query(`INSERT INTO payload_migrations(name,batch) SELECT $1::varchar,1 WHERE NOT EXISTS(SELECT 1 FROM payload_migrations WHERE name=$1::varchar)`, [name]);
    }
    // Retain the dev marker as an audit record, outside Payload's special batch -1.
    await client.query(`UPDATE payload_migrations SET name='reconciled_dev_baseline_20260922',batch=1 WHERE name='dev'`);
    await client.query('COMMIT');
    console.log('Recorded verified migrations; retained the development marker as an audit record.');
  }
} catch (error) {
  await client.query('ROLLBACK');
  console.error(error.message);
  process.exitCode = 1;
} finally { await client.end(); }
