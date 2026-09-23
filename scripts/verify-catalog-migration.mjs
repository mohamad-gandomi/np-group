import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
const require = createRequire(import.meta.url);
require('@next/env').loadEnvConfig(process.cwd());
const { Client } = require('pg');
const database = process.argv[2];
if (!/^nilper_catalog_migration_verify_[a-z0-9_]+$/.test(database ?? '')) throw new Error('Pass an isolated pre-refactor restore named nilper_catalog_migration_verify_<suffix>.');
const uri = new URL(process.env.DATABASE_URI);
assert.notEqual(uri.pathname, `/${database}`, 'Never run against the application database.');
uri.pathname = `/${database}`;
const env = { ...process.env, DATABASE_URI: uri.toString() };
const client = new Client({ connectionString: uri.toString() });
await client.connect();
const history = async () => {
  const result = {};
  for (const kind of ['orders', 'transactions']) {
    result[kind] = (await client.query(`SELECT to_jsonb(t) value FROM ${kind} t ORDER BY id`)).rows;
    result[`${kind}-items`] = (await client.query(`SELECT to_jsonb(t)-'variant_title_snapshot' value FROM ${kind}_items t ORDER BY id`)).rows;
    result[`${kind}-choices`] = (await client.query(`SELECT to_jsonb(t)-'group_id'-'option_id' value FROM ${kind}_items_configuration t ORDER BY id`)).rows;
  }
  return result;
};
try {
  assert.equal((await client.query(`SELECT to_regclass('public.products_attributes') name`)).rows[0].name, null, 'Restore a pre-refactor database first.');
  const before = await history();
  const counts = (await client.query(`SELECT (SELECT count(*) FROM products) products,(SELECT count(*) FROM variants) variants,(SELECT count(*) FROM product_series) families`)).rows[0];
  const originalSKUs = (await client.query(`SELECT id,nilper_code FROM variants ORDER BY id`)).rows;
  // Exercise live cart ID conversion even when the restored database has no carts.
  const cart = (await client.query(`INSERT INTO carts(currency,subtotal) VALUES('TMN',0) RETURNING id`)).rows[0].id;
  await client.query(`INSERT INTO carts_items(_order,_parent_id,id,product_id,variant_id,quantity,configuration_key,product_title_snapshot,unit_price_in_t_m_n)
    SELECT 1,$1,'migration-live-cart',p.id,v.id,1,'[]',p.title,0 FROM products p JOIN variants v ON v.product_id=p.id WHERE p.slug='delan-sofa' AND v.nilper_code IS NOT NULL LIMIT 1`, [cart]);
  await client.query(`INSERT INTO carts_items_configuration(_order,_parent_id,id,group_key,group_id,group_label_fa_snapshot,option_id,label_fa_snapshot)
    SELECT 1,'migration-live-cart','migration-choice',g.key,g.id,g.title,o.id,o.title FROM configuration_groups g JOIN configuration_options o ON o.group_id=g.id WHERE g.key='wood-finish' ORDER BY o.id LIMIT 1`);
  const choice = (await client.query(`SELECT option_id FROM carts_items_configuration WHERE id='migration-choice'`)).rows[0];
  assert(choice);
  execFileSync(process.execPath, ['scripts/reconcile-catalog-baseline.mjs', '--apply'], { env, stdio: 'inherit' });
  execFileSync(process.execPath, ['node_modules/payload/bin.js', 'migrate'], { env, stdio: 'inherit' });
  assert.deepEqual(await history(), before, 'Every historical header, price, SKU snapshot, and choice label must survive unchanged.');
  assert.deepEqual((await client.query(`SELECT id,nilper_code FROM variants ORDER BY id`)).rows, originalSKUs);
  const after = (await client.query(`SELECT (SELECT count(*) FROM products) products,(SELECT count(*) FROM variants) variants,(SELECT count(*) FROM catalog_migration_map WHERE source='product-series') families`)).rows[0];
  assert.deepEqual(after, counts);
  const mapped = (await client.query(`SELECT new_id FROM catalog_migration_map WHERE source='configuration-options' AND old_id=$1`, [choice.option_id])).rows[0];
  assert.equal((await client.query(`SELECT option_id FROM carts_items_configuration WHERE id='migration-choice'`)).rows[0].option_id, mapped.new_id);
  const missing = (await client.query(`SELECT count(*) n FROM catalog_legacy.product_references p JOIN catalog_migration_map m ON m.source='product-series' AND m.old_id=p.series_id WHERE NOT EXISTS(SELECT 1 FROM products_rels r WHERE r.parent_id=p.id AND r.path='categories' AND r.categories_id=m.new_id)`)).rows[0];
  assert.equal(missing.n, '0');
  assert.equal((await client.query(`SELECT count(*) n FROM categories WHERE parent_id IS NOT NULL`)).rows[0].n === '0', false);
  execFileSync(process.execPath, ['node_modules/payload/bin.js', 'migrate'], { env, stdio: 'inherit' });
  assert.deepEqual(await history(), before, 'Rerunning migrations must not mutate historical data.');
  console.log(`Migration verification passed on ${database}: ${counts.products} products, ${counts.variants} variants, ${counts.families} families, historical snapshots, and live cart relationships preserved.`);
} finally { await client.end(); }
