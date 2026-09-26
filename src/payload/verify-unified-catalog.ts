import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createLocalReq, getPayload, type CollectionSlug } from 'payload';
import config from '../../payload.config';
import { validateNilperCommerceItems } from './cart-configuration';
import { resolveCommerce } from './catalog-domain';
import { mapPayloadProduct } from '../features/catalog/payload-catalog-mapper';
import { makeExportHook, makeImportHook } from './data-transfer';
import { ADMIN_NAVIGATION_GROUPS, STORE_NAVIGATION_COLLECTIONS } from './admin-navigation';

const payload = await getPayload({ config });
const req = await createLocalReq({ context: { disableStorefrontRevalidation: true } }, payload);
const prefix = `catalog-${randomUUID()}`;
const created: Partial<Record<CollectionSlug, number[]>> = {};
const remember = <T extends { id: number }>(collection: CollectionSlug, doc: T): T => {
  (created[collection] ??= []).push(doc.id); return doc;
};
const findField = (fields: unknown[], name: string): Record<string, unknown> | undefined => {
  for (const value of fields) {
    if (!value || typeof value !== 'object') continue;
    const field = value as Record<string, unknown>;
    if (field.name === name) return field;
    const nested = Array.isArray(field.fields) ? findField(field.fields, name) : undefined;
    if (nested) return nested;
    if (Array.isArray(field.tabs)) {
      for (const tabValue of field.tabs) {
        const tab = tabValue as Record<string, unknown>;
        const found = Array.isArray(tab.fields) ? findField(tab.fields, name) : undefined;
        if (found) return found;
      }
    }
  }
};
const descriptionFa = { root: { type: 'root', children: [{ type: 'paragraph', version: 1, children: [{ type: 'text', text: 'Catalog verification', version: 1, detail: 0, format: 0, mode: 'normal', style: '' }], direction: 'rtl', format: '', indent: 0 }], direction: 'rtl' as const, format: '' as const, indent: 0, version: 1 } };
try {
  assert(!payload.config.collections.some((c) => ['product-series', 'configuration-groups', 'configuration-options'].includes(c.slug)));
  const visibleNavigationGroups = [...new Set(payload.config.collections
    .filter((collection) => collection.admin?.hidden !== true)
    .map((collection) => collection.admin?.group)
    .filter((group): group is string => typeof group === 'string'))];
  assert.deepEqual(visibleNavigationGroups, [...ADMIN_NAVIGATION_GROUPS], 'Payload navigation groups must use the requested order.');
  const visibleStoreCollections = payload.config.collections
    .filter((collection) => collection.admin?.group === 'فروشگاه')
    .map((collection) => collection.slug);
  assert.deepEqual(visibleStoreCollections, [...STORE_NAVIGATION_COLLECTIONS], 'Store navigation collections must use the requested order.');
  const productsConfig = payload.config.collections.find((collection) => collection.slug === 'products');
  const variantsConfig = payload.config.collections.find((collection) => collection.slug === 'variants');
  const attributesConfig = payload.config.collections.find((collection) => collection.slug === 'variantTypes');
  const attributeOptionsConfig = payload.config.collections.find((collection) => collection.slug === 'variantOptions');
  const categoriesConfig = payload.config.collections.find((collection) => collection.slug === 'categories');
  const productModelsJoin = findField(productsConfig?.fields ?? [], 'variants');
  const attributeOptionsJoin = findField(attributesConfig?.fields ?? [], 'options');
  const storefrontCategoryField = findField(categoriesConfig?.fields ?? [], 'showOnStorefront');
  assert.equal((productModelsJoin?.admin as Record<string, unknown>)?.allowCreate, true, 'Models must be creatable inside Product.');
  assert.equal((attributeOptionsJoin?.admin as Record<string, unknown>)?.allowCreate, true, 'Options must be creatable inside Attribute.');
  assert.equal(variantsConfig?.admin?.group, false, 'Models must stay out of the sidebar without disabling their admin routes.');
  assert.equal(attributeOptionsConfig?.admin?.group, false, 'Attribute options must stay out of the sidebar without disabling their admin routes.');
  assert(storefrontCategoryField, 'Categories must expose the homepage/shop selection field.');
  const brand = remember('brands', await payload.create({ collection: 'brands', req, data: { title: prefix, slug: prefix } }));
  const category = remember('categories', await payload.create({ collection: 'categories', req, data: { title: prefix, slug: prefix } }));
  const selectedCategoryCount = await payload.count({ collection: 'categories', req, where: { showOnStorefront: { equals: true } } });
  assert(selectedCategoryCount.totalDocs <= 6, 'At most six storefront categories may be selected.');
  for (let index = selectedCategoryCount.totalDocs; index < 6; index += 1) {
    remember('categories', await payload.create({ collection: 'categories', req, data: {
      title: `${prefix}-${index}`,
      slug: `${prefix}-${index}`,
      showOnStorefront: true,
    } }));
  }
  await assert.rejects(payload.create({ collection: 'categories', req, data: {
    title: `${prefix}-seventh`,
    slug: `${prefix}-seventh`,
    showOnStorefront: true,
  } }), 'A seventh storefront category must be rejected.');
  const makeAttribute = async (name: string) => remember('variantTypes', await payload.create({ collection: 'variantTypes', req, data: { name: `${prefix}-${name}`, label: name } }));
  const size = await makeAttribute('size'); const base = await makeAttribute('base'); const fabric = await makeAttribute('fabric');
  const media = (await payload.find({ collection: 'media', limit: 1, req })).docs[0];
  assert(media, 'Seed the representative database before verification.');
  const makeOption = async (attribute: number, value: string, extras = {}) => remember('variantOptions', await payload.create({ collection: 'variantOptions', req,
    data: { variantType: attribute, value: `${prefix}-${value}`, label: value, ...extras } }));
  const small = await makeOption(size.id, '160'); const large = await makeOption(size.id, '180');
  const fixed = await makeOption(base.id, 'fixed'); const lift = await makeOption(base.id, 'lift');
  const a01 = await makeOption(fabric.id, 'a01', { groupLabel: 'Verona', colorHex: '#123456', image: media.id });
  const a02 = await makeOption(fabric.id, 'a02'); const disallowed = await makeOption(fabric.id, 'not-allowed');
  const common = { brand: brand.id, categories: [category.id], descriptionFa, salesMode: 'direct' as const, priceInTMNEnabled: true, priceInTMN: 12000, availabilityMode: 'in_stock' as const,
    shippingMode: 'parcel' as const, parcelWeightInGrams: 2000, tapinBoxID: 1, mainImage: media.id, _status: 'published' as const };
  const simple = remember('products', await payload.create({ collection: 'products', req, data: {
    ...common, title: 'Simple', slug: `${prefix}-simple`, productType: 'simple', catalogCode: `${prefix}-S`,
    measurements: [{ labelFa: 'عرض', value: 10, unit: 'cm' }], technicalSpecs: [{ labelFa: 'جنس', valueFa: 'چوب', group: 'materials' }],
  } as never }));
  assert(simple.measurements?.[0]?.key); assert.equal(simple.measurements?.[0]?.sortOrder, 0);
  const originalKey = simple.measurements![0].key;
  const renamed = await payload.update({ collection: 'products', id: simple.id, req, data: { measurements: [{ ...simple.measurements![0], labelFa: 'عرض جدید' }] } });
  assert.equal(renamed.measurements![0].key, originalKey);
  await assert.rejects(payload.create({ collection: 'variants', req, data: { product: simple.id, nilperCode: `${prefix}-bad`, options: [small.id], _status: 'published' } }));
  const simpleQuote = await validateNilperCommerceItems([{ product: simple.id, quantity: 2, unitPriceInTMN: 1, variantCodeSnapshot: 'fake' }], req);
  assert.equal(simpleQuote.amount, 24000); assert.equal(simpleQuote.items[0].variantCodeSnapshot, `${prefix}-S`);
  const attributes = [{ attribute: size.id, allowedOptions: [small.id, large.id] }, { attribute: base.id, allowedOptions: [fixed.id, lift.id] }, { attribute: fabric.id, allowedOptions: [a01.id, a02.id], required: true }];
  const product = remember('products', await payload.create({ collection: 'products', req, data: { ...common, title: 'Variable', slug: `${prefix}-variable`, productType: 'variable', attributes, variantAttributes: [size.id, base.id] } }));
  assert.equal((await payload.count({ collection: 'variants', req, where: { product: { equals: product.id } } })).totalDocs, 0, 'Attributes never generate variants.');
  const variant = remember('variants', await payload.create({ collection: 'variants', req, data: { product: product.id, nilperCode: `${prefix}-V1`, options: [small.id, fixed.id], _status: 'published' } }));
  const rawProduct = await payload.findByID({ collection: 'products', id: product.id, depth: 0, req });
  const portable = await makeExportHook('products')({ data: [rawProduct as unknown as Record<string, unknown>], originalData: [rawProduct], req });
  const portableAttributes = portable[0].attributes as { attribute: string; allowedOptions: string[] }[];
  assert.equal(portableAttributes[0].attribute, size.name); assert.equal(portableAttributes[0].allowedOptions[0], small.value);
  assert(!('enableVariants' in portable[0])); assert(!('variantTypes' in portable[0]));
  const imported = await makeImportHook('products')({ data: portable, req });
  assert.deepEqual((imported[0].attributes as { allowedOptions: number[] }[])[0].allowedOptions, [small.id, large.id]);
  const makeInvalid = (options: number[], sku = `${prefix}-${randomUUID()}`) => payload.create({ collection: 'variants', req, data: { product: product.id, nilperCode: sku, options, _status: 'published' } });
  await assert.rejects(makeInvalid([fixed.id, small.id]), 'Duplicate unordered combination.');
  await assert.rejects(makeInvalid([large.id, lift.id], variant.nilperCode), 'Duplicate SKU.');
  await assert.rejects(makeInvalid([small.id, large.id]), 'Two options from one attribute.');
  await assert.rejects(makeInvalid([small.id]), 'Incomplete combination.');
  await assert.rejects(makeInvalid([small.id, a01.id]), 'Customer choice cannot define this variant.');
  await assert.rejects(payload.update({ collection: 'products', id: product.id, req, data: { productType: 'simple', variantAttributes: [] } }));
  await assert.rejects(payload.update({ collection: 'products', id: product.id, req, data: { attributes: attributes.slice(1) } }));
  await assert.rejects(payload.update({ collection: 'products', id: product.id, req, data: { attributes: [{ attribute: size.id, allowedOptions: [large.id] }, ...attributes.slice(1)] } }));
  await assert.rejects(payload.delete({ collection: 'variantTypes', id: fabric.id, req }));
  await assert.rejects(payload.delete({ collection: 'variantOptions', id: a01.id, req }));
  await assert.rejects(payload.update({ collection: 'variantOptions', id: a01.id, req, data: { variantType: size.id } }));
  const line = { product: product.id, variant: variant.id, quantity: 2, configuration: [{ groupKey: fabric.name, option: a01.id }] };
  await assert.rejects(validateNilperCommerceItems([{ ...line, variant: null }], req));
  await assert.rejects(validateNilperCommerceItems([{ ...line, configuration: [{ groupKey: fabric.name, option: disallowed.id }] }], req));
  await payload.update({ collection: 'variantOptions', id: a02.id, req, data: { active: false } });
  await assert.rejects(validateNilperCommerceItems([{ ...line, configuration: [{ groupKey: fabric.name, option: a02.id }] }], req));
  const quote = await validateNilperCommerceItems([line], req);
  assert.equal(quote.amount, 24000); assert.equal(quote.items[0].shippingModeSnapshot, 'parcel'); assert.equal(quote.items[0].parcelWeightInGramsSnapshot, 2000);
  const cart = remember('carts', await payload.create({ collection: 'carts', req, data: { currency: 'TMN', items: [line, { product: simple.id, quantity: 1 }] } as never }));
  assert.equal(cart.subtotal, 36000, 'Plugin cart hook must preserve inherited prices.');
  const order = remember('orders', await payload.create({ collection: 'orders', req, depth: 0, data: { currency: 'TMN', items: cart.items, contactName: 'Test', contactPhone: '09120000000', deliveryMethod: 'advisor', paymentMethod: 'invoice', status: 'pending_review' } as never }));
  assert.equal(order.amount, 36000);
  const snapshots = structuredClone(order.items);
  await payload.update({ collection: 'products', id: product.id, req, data: { title: 'Changed', priceInTMN: 99999 } });
  await payload.update({ collection: 'variantOptions', id: a01.id, req, data: { label: 'Changed option' } });
  const history = await payload.update({ collection: 'orders', id: order.id, req, depth: 0, data: { status: 'confirmed', items: [], amount: 1 } });
  assert.deepEqual(history.items, snapshots); assert.equal(history.amount, 36000);
  const mapped = mapPayloadProduct(product, { attributes: [size, base, fabric], attributeOptions: [a01, a02], variants: [variant] });
  assert.equal(mapped.variants?.length, 1); assert.equal(mapped.variants?.[0].price, 12000);
  assert.equal(mapped.attributes?.length, 1); assert.equal(mapped.attributes?.[0].options[0].groupLabel, 'Verona');
  const inherited = resolveCommerce({ priceInTMNEnabled: true, priceInTMN: 100, availabilityMode: 'in_stock', mainImage: media.id }, { priceInTMNEnabled: false });
  assert.equal(inherited.priceInTMN, 100); assert.equal(inherited.mainImage, media.id);
  await payload.update({ collection: 'variants', id: variant.id, req, data: { priceInTMNEnabled: true, priceInTMN: 25000, shippingMode: 'freight', availabilityMode: 'unavailable' } });
  await assert.rejects(validateNilperCommerceItems([line], req));
  await payload.update({ collection: 'variants', id: variant.id, req, data: { availabilityMode: 'orderable' } });
  const override = await validateNilperCommerceItems([line], req);
  assert.equal(override.amount, 50000); assert.equal(override.items[0].shippingModeSnapshot, 'freight');
  assert.equal((await payload.count({ collection: 'variants', req, where: { product: { equals: product.id } } })).totalDocs, 1);
  console.info('Unified catalog verification passed: simple/variable, manual-only models, inheritance, grouping/media/color, deletion safety, authoritative cart, immutable order history.');
} finally {
  for (const collection of ['orders', 'carts', 'variants', 'products', 'variantOptions', 'variantTypes', 'categories', 'brands'] as CollectionSlug[]) {
    for (const id of (created[collection] ?? []).reverse()) await payload.delete({ collection, id, req });
  }
  await payload.destroy();
}
