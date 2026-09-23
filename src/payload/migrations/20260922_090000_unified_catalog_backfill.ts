import { sql, type MigrateUpArgs, type MigrateDownArgs } from '@payloadcms/db-postgres';

/** Runs in Payload's migration transaction. Legacy tables are retained as recovery data. */
export async function up({ db, payload }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS catalog_migration_map (
      source varchar NOT NULL, old_id integer NOT NULL, new_id integer NOT NULL,
      original jsonb NOT NULL, PRIMARY KEY(source, old_id)
    );
    CREATE TABLE IF NOT EXISTS catalog_migration_report (
      kind varchar NOT NULL, record_id integer NOT NULL, details jsonb NOT NULL,
      PRIMARY KEY(kind, record_id)
    );
    INSERT INTO catalog_migration_map SELECT 'variantTypes', id, id, to_jsonb(t) FROM variant_types t ON CONFLICT DO NOTHING;
    INSERT INTO catalog_migration_map SELECT 'variantOptions', id, id, to_jsonb(t) FROM variant_options t ON CONFLICT DO NOTHING;
    UPDATE variant_types SET active = false WHERE deleted_at IS NOT NULL;
    UPDATE variant_options SET active = false WHERE deleted_at IS NOT NULL;
    -- Values are portable within an attribute. Namespace only actual collisions.
    UPDATE variant_options o SET value = 'legacy-option-' || o.id || '-' || o.value
      WHERE o.value IN (SELECT value FROM variant_options GROUP BY value HAVING count(*) > 1);
    DO $$ DECLARE g record; o record; target integer; stable varchar; BEGIN
      FOR g IN SELECT * FROM configuration_groups ORDER BY id LOOP
        SELECT new_id INTO target FROM catalog_migration_map WHERE source='configuration-groups' AND old_id=g.id;
        IF target IS NULL THEN
          stable := g.key;
          IF EXISTS (SELECT 1 FROM variant_types WHERE name=stable) THEN stable := 'choice-' || g.id || '-' || g.key; END IF;
          INSERT INTO variant_types(label,name,active,help_text_fa) VALUES(g.title,stable,g.active,g.help_text_fa) RETURNING id INTO target;
          INSERT INTO catalog_migration_map VALUES('configuration-groups',g.id,target,to_jsonb(g));
        END IF;
      END LOOP;
      FOR o IN SELECT * FROM configuration_options ORDER BY id LOOP
        IF NOT EXISTS(SELECT 1 FROM catalog_migration_map WHERE source='configuration-options' AND old_id=o.id) THEN
          INSERT INTO variant_options(variant_type_id,label,value,code,color_hex,image_id,active,sort_order)
            SELECT new_id,o.title,'choice-option-' || o.id,o.code,o.swatch_color,o.swatch_media_id,o.active,o.sort_order
            FROM catalog_migration_map WHERE source='configuration-groups' AND old_id=o.group_id RETURNING id INTO target;
          INSERT INTO catalog_migration_map VALUES('configuration-options',o.id,target,to_jsonb(o));
        END IF;
      END LOOP;
    END $$;
    INSERT INTO catalog_migration_report
      SELECT 'product-type',p.id,jsonb_build_object('enableVariants',p.enable_variants,'actualVariants',count(v.id))
      FROM products p LEFT JOIN variants v ON v.product_id=p.id GROUP BY p.id
      HAVING coalesce(p.enable_variants,false) <> (count(v.id)>0) ON CONFLICT DO NOTHING;
    UPDATE products p SET product_type = CASE WHEN EXISTS(SELECT 1 FROM variants v WHERE v.product_id=p.id) THEN 'variable' ELSE 'simple' END::enum_products_product_type;
    UPDATE products SET enable_variants=(product_type='variable');
    UPDATE _products_v p SET version_product_type=CASE WHEN EXISTS(SELECT 1 FROM variants v WHERE v.product_id=p.parent_id) THEN 'variable' ELSE 'simple' END::enum__products_v_version_product_type;
    UPDATE _products_v SET version_enable_variants=(version_product_type='variable');
    INSERT INTO catalog_migration_report
      SELECT 'incomplete-draft-variant',v.id,to_jsonb(v) FROM variants v
      WHERE v._status='draft' AND (v.nilper_code IS NULL OR NOT EXISTS(SELECT 1 FROM variants_rels r WHERE r.parent_id=v.id AND r.path='options')) ON CONFLICT DO NOTHING;
    UPDATE variants v SET combination_key = v.product_id || ':' || x.options
      FROM (SELECT parent_id,string_agg(variant_options_id::text,':' ORDER BY variant_options_id) options FROM variants_rels WHERE path='options' GROUP BY parent_id) x
      WHERE v.id=x.parent_id;
    UPDATE _variants_v vv SET version_combination_key=v.combination_key FROM variants v WHERE vv.parent_id=v.id;
  `);

  // Keep each saved product version's own assignments; never replace its text/content.
  for (const version of [false, true]) {
    const parent = version ? '_products_v' : 'products';
    const rels = version ? '_products_v_rels' : 'products_rels';
    const array = version ? '_products_v_version_attributes' : 'products_attributes';
    const prefix = version ? 'version.' : '';
    await db.execute(sql.raw(`
      INSERT INTO ${array} (_order,_parent_id,${version ? '_uuid' : 'id'},attribute_id,required)
      SELECT row_number() OVER(PARTITION BY parent_id ORDER BY attribute_id),parent_id,
        'migrated-' || parent_id || '-' || attribute_id,attribute_id,bool_or(required)
      FROM (
        SELECT r.parent_id,r.variant_types_id attribute_id,false required FROM ${rels} r WHERE r.path='${prefix}variantTypes'
        UNION ALL
        SELECT r.parent_id,m.new_id,coalesce(g.required,false) FROM ${rels} r
          JOIN catalog_migration_map m ON m.source='configuration-groups' AND m.old_id=r.configuration_groups_id
          JOIN configuration_groups g ON g.id=m.old_id WHERE r.path='${prefix}configurationGroups'
        UNION ALL
        SELECT p.id,o.variant_type_id,false FROM ${parent} p JOIN variants v ON v.product_id=p.${version ? 'parent_id' : 'id'}
          JOIN variants_rels r ON r.parent_id=v.id AND r.path='options' JOIN variant_options o ON o.id=r.variant_options_id
      ) a WHERE attribute_id IS NOT NULL GROUP BY parent_id,attribute_id;
      INSERT INTO ${rels} (parent_id,path,variant_options_id,"order")
        SELECT a._parent_id,'${prefix}attributes.' || (a._order-1) || '.allowedOptions',o.id,
          row_number() OVER(PARTITION BY a._parent_id,a.attribute_id ORDER BY o.sort_order,o.id)
        FROM ${array} a JOIN variant_options o ON o.variant_type_id=a.attribute_id;
      INSERT INTO ${rels} (parent_id,path,variant_types_id,"order")
        SELECT parent_id,'${prefix}variantAttributes',attribute_id,row_number() OVER(PARTITION BY parent_id ORDER BY attribute_id)
        FROM (
          SELECT p.id parent_id,o.variant_type_id attribute_id FROM ${parent} p JOIN variants v ON v.product_id=p.${version ? 'parent_id' : 'id'}
            JOIN variants_rels r ON r.parent_id=v.id AND r.path='options' JOIN variant_options o ON o.id=r.variant_options_id
          UNION SELECT parent_id,variant_types_id FROM ${rels} WHERE path='${prefix}variantTypes'
        ) x WHERE attribute_id IS NOT NULL;
    `));
  }

  await db.execute(sql`
    DO $$ DECLARE s record; target integer; parent integer; parents integer[]; candidate varchar; BEGIN
      FOR s IN SELECT * FROM product_series ORDER BY id LOOP
        SELECT array_agg(DISTINCT r.categories_id) INTO parents FROM products p JOIN products_rels r ON r.parent_id=p.id AND r.path='categories' WHERE p.series_id=s.id;
        parent := CASE WHEN array_length(parents,1)=1 THEN parents[1] ELSE NULL END;
        IF parent IS NULL THEN INSERT INTO catalog_migration_report VALUES('ambiguous-category-parent',s.id,jsonb_build_object('categories',parents)) ON CONFLICT DO NOTHING; END IF;
        candidate := s.slug;
        SELECT id INTO target FROM categories WHERE slug=candidate AND title=s.title AND parent_id IS NOT DISTINCT FROM parent AND description_fa IS NOT DISTINCT FROM s.description_fa AND image_id IS NOT DISTINCT FROM s.hero_media_id;
        IF target IS NULL THEN
          IF EXISTS(SELECT 1 FROM categories WHERE slug=candidate) THEN
            candidate := s.slug || '-family-' || s.id;
            INSERT INTO catalog_migration_report VALUES('category-slug-conflict',s.id,jsonb_build_object('slug',s.slug,'newSlug',candidate)) ON CONFLICT DO NOTHING;
          END IF;
          INSERT INTO categories(title,slug,parent_id,image_id,description_fa,published) VALUES(s.title,candidate,parent,s.hero_media_id,s.description_fa,s.published) RETURNING id INTO target;
        END IF;
        INSERT INTO catalog_migration_map VALUES('product-series',s.id,target,to_jsonb(s)) ON CONFLICT DO NOTHING;
        INSERT INTO products_rels(parent_id,path,categories_id,"order") SELECT p.id,'categories',target,1000 FROM products p WHERE p.series_id=s.id AND NOT EXISTS(SELECT 1 FROM products_rels r WHERE r.parent_id=p.id AND r.path='categories' AND r.categories_id=target);
        INSERT INTO _products_v_rels(parent_id,path,categories_id,"order") SELECT p.id,'version.categories',target,1000 FROM _products_v p WHERE p.version_series_id=s.id AND NOT EXISTS(SELECT 1 FROM _products_v_rels r WHERE r.parent_id=p.id AND r.path='version.categories' AND r.categories_id=target);
      END LOOP;
    END $$;
  `);

  for (const kind of ['carts', 'orders', 'transactions']) {
    const table = `${kind}_items_configuration`;
    await db.execute(sql.raw(`
      ALTER TABLE ${table} DROP CONSTRAINT ${table}_group_id_configuration_groups_id_fk;
      ALTER TABLE ${table} DROP CONSTRAINT ${table}_option_id_configuration_options_id_fk;
      UPDATE ${table} s SET group_id=m.new_id FROM catalog_migration_map m WHERE m.source='configuration-groups' AND s.group_id=m.old_id;
      UPDATE ${table} s SET option_id=m.new_id FROM catalog_migration_map m WHERE m.source='configuration-options' AND s.option_id=m.old_id;
      ${kind === 'carts' ? `UPDATE ${table} s SET group_key=t.name FROM variant_types t WHERE s.group_id=t.id;` : ''}
      ALTER TABLE ${table} ADD CONSTRAINT ${table}_group_id_variant_types_id_fk FOREIGN KEY(group_id) REFERENCES variant_types(id) ON DELETE SET NULL;
      ALTER TABLE ${table} ADD CONSTRAINT ${table}_option_id_variant_options_id_fk FOREIGN KEY(option_id) REFERENCES variant_options(id) ON DELETE SET NULL;
    `));
  }
  await db.execute(sql`
    UPDATE carts_items i SET configuration_key=coalesce((SELECT json_agg(json_build_array(group_key,option_id::text) ORDER BY group_key COLLATE "C",option_id::text COLLATE "C")::text FROM carts_items_configuration c WHERE c._parent_id=i.id),'[]');
    CREATE UNIQUE INDEX variant_types_name_idx ON variant_types(name);
    CREATE UNIQUE INDEX variant_options_value_idx ON variant_options(value);
    DO $$ BEGIN
      IF (SELECT count(*) FROM configuration_groups) <> (SELECT count(*) FROM catalog_migration_map WHERE source='configuration-groups') OR
         (SELECT count(*) FROM configuration_options) <> (SELECT count(*) FROM catalog_migration_map WHERE source='configuration-options') OR
         (SELECT count(*) FROM product_series) <> (SELECT count(*) FROM catalog_migration_map WHERE source='product-series') THEN RAISE EXCEPTION 'Incomplete catalog migration mapping'; END IF;
    END $$;
  `);
  payload.logger.info('Unified catalog backfilled. Review catalog_migration_report; legacy source data and original snapshots are retained.');
}

export async function down(_args: MigrateDownArgs): Promise<void> {
  throw new Error('Catalog backfill is forward-only: restore the pre-migration database backup to roll back without losing new catalog data.');
}
