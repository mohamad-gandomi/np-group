import type { CollectionBeforeValidateHook, CollectionBeforeDeleteHook, CollectionConfig, Field, PayloadRequest } from 'payload';
import { ValidationError } from 'payload';

export const relationID = (value: unknown): number | undefined => {
  if (value && typeof value === 'object' && 'id' in value) return relationID(value.id);
  const id = typeof value === 'string' ? Number(value) : value;
  return typeof id === 'number' && Number.isSafeInteger(id) && id > 0 ? id : undefined;
};
export const relationIDs = (values: unknown): number[] => Array.isArray(values)
  ? values.map(relationID).filter((id): id is number => id !== undefined) : [];
type RecordData = Record<string, unknown>;
type Assignment = { attribute: unknown; allowedOptions?: unknown; required?: boolean | null };
const assignments = (value: unknown): Assignment[] => Array.isArray(value) ? value : [];
const fail = (req: PayloadRequest, path: string, message: string): never => {
  throw new ValidationError({ req, errors: [{ path, message }] });
};

/** Null override means inherit. An enabled variant price is an explicit override. */
export function resolveCommerce(product: RecordData, variant?: RecordData | null) {
  const ownPrice = variant?.priceInTMNEnabled === true;
  return {
    priceInTMN: ownPrice ? variant.priceInTMN : product.priceInTMN,
    priceInTMNEnabled: ownPrice ? true : product.priceInTMNEnabled,
    availabilityMode: variant?.availabilityMode ?? product.availabilityMode,
    shippingMode: variant?.shippingMode ?? product.shippingMode ?? 'freight',
    parcelWeightInGrams: variant?.parcelWeightInGrams ?? product.parcelWeightInGrams,
    tapinBoxID: variant?.tapinBoxID ?? product.tapinBoxID,
    mainImage: variant?.mainImage ?? product.mainImage,
  };
}

export async function validateVariantDefinition(product: RecordData, options: unknown, req: PayloadRequest) {
  if (product.productType !== 'variable') fail(req, 'product', 'مدل فقط برای محصول متغیر قابل ثبت است.');
  const required = relationIDs(product.variantAttributes);
  const ids = relationIDs(options);
  if (!required.length || ids.length !== required.length || new Set(ids).size !== ids.length) {
    fail(req, 'options', 'از هر ویژگی سازنده مدل دقیقاً یک گزینه انتخاب کنید.');
  }
  const seen = new Set<number>();
  for (const id of ids) {
    const option = await req.payload.findByID({ collection: 'variantOptions', id, depth: 0, req });
    const attributeID = relationID(option.variantType)!;
    const assignment = assignments(product.attributes).find((row) => relationID(row.attribute) === attributeID);
    if (!required.includes(attributeID) || seen.has(attributeID) || !relationIDs(assignment?.allowedOptions).includes(id)) {
      fail(req, 'options', 'گزینه‌های مدل باید مجاز و متعلق به ویژگی‌های سازنده مدل باشند.');
    }
    if (option.active === false) fail(req, 'options', 'گزینه غیرفعال قابل انتخاب نیست.');
    const attribute = await req.payload.findByID({ collection: 'variantTypes', id: attributeID, depth: 0, req });
    if (attribute.active === false) fail(req, 'options', 'ویژگی غیرفعال قابل انتخاب نیست.');
    seen.add(attributeID);
  }
  return ids.sort((a, b) => a - b).join(':');
}

export const validateProduct: CollectionBeforeValidateHook = async ({ data, originalDoc, req }) => {
  if (!data) return data;
  const product = { ...originalDoc, ...data };
  const rows = assignments(product.attributes);
  const ids = rows.map((row) => relationID(row.attribute));
  if (new Set(ids).size !== ids.length || ids.includes(undefined)) fail(req, 'attributes', 'ویژگی تکراری یا نامعتبر است.');
  for (const row of rows) {
    for (const id of relationIDs(row.allowedOptions)) {
      const option = await req.payload.findByID({ collection: 'variantOptions', id, depth: 0, req });
      if (relationID(option.variantType) !== relationID(row.attribute)) fail(req, 'attributes', 'گزینه متعلق به ویژگی انتخاب‌شده نیست.');
    }
  }
  const variantAttributes = relationIDs(product.variantAttributes);
  if (new Set(variantAttributes).size !== variantAttributes.length || variantAttributes.some((id) => !ids.includes(id))) {
    fail(req, 'variantAttributes', 'ویژگی سازنده مدل باید در ویژگی‌های محصول باشد.');
  }
  if (originalDoc?.id) {
    const variants = await req.payload.find({ collection: 'variants', where: { product: { equals: originalDoc.id } }, pagination: false, depth: 0, draft: true, req });
    if (variants.docs.length && product.productType !== 'variable') fail(req, 'productType', 'ابتدا مدل‌های وابسته را به‌روزرسانی یا حذف کنید.');
    for (const variant of variants.docs) {
      if (variant._status === 'draft' && !relationIDs(variant.options).length) continue;
      await validateVariantDefinition(product, variant.options, req);
    }
  }
  if (product.productType === 'simple' && variantAttributes.length) fail(req, 'variantAttributes', 'محصول ساده ویژگی سازنده مدل ندارد.');
  return { ...data, enableVariants: product.productType === 'variable', variantTypes: variantAttributes };
};

export const validateVariant: CollectionBeforeValidateHook = async ({ data, originalDoc, req }) => {
  if (!data) return data;
  const variant = { ...originalDoc, ...data };
  const productID = relationID(variant.product);
  if (!productID) return fail(req, 'product', 'محصول الزامی است.');
  const product = await req.payload.findByID({ collection: 'products', id: productID, depth: 0, draft: true, req });
  if (product.productType !== 'variable') fail(req, 'product', 'مدل فقط برای محصول متغیر قابل ثبت است.');
  if (variant._status === 'draft' && !relationIDs(variant.options).length) return { ...data, combinationKey: null };
  const key = await validateVariantDefinition(product as unknown as RecordData, variant.options, req);
  const combinationKey = `${productID}:${key}`;
  const duplicate = await req.payload.find({ collection: 'variants', depth: 0, limit: 1, draft: true, req,
    where: { and: [{ combinationKey: { equals: combinationKey } }, ...(originalDoc?.id ? [{ id: { not_equals: originalDoc.id } }] : [])] } });
  if (duplicate.docs.length) fail(req, 'options', 'این ترکیب قبلاً برای محصول ثبت شده است.');
  return { ...data, product: productID, combinationKey };
};

const assertAttributeUnused = async (option: boolean, id: number | string, req: PayloadRequest) => {
  const productMatches = [];
  for (const draft of [false, true]) productMatches.push(await req.payload.find({ collection: 'products', depth: 0, limit: 1, draft, req,
    where: { [option ? 'attributes.allowedOptions' : 'attributes.attribute']: { equals: id } } }));
  const variants = option ? await req.payload.find({ collection: 'variants', depth: 0, limit: 1, draft: true, req,
    where: { options: { equals: id } } }) : await req.payload.find({ collection: 'variantOptions', depth: 0, limit: 1, req,
    where: { variantType: { equals: id } } });
  if (productMatches.some((result) => result.totalDocs) || variants.totalDocs) fail(req, 'id', 'ابتدا ارتباط محصول، مدل یا گزینه‌های وابسته را حذف کنید.');
};
const protectAttribute = (option: boolean): CollectionBeforeDeleteHook => ({ id, req }) => assertAttributeUnused(option, id, req);

export function attributeCollection(collection: CollectionConfig, option: boolean): CollectionConfig {
  const labels: Record<string, string> = { label: 'عنوان', name: 'کلید ویژگی', value: 'کد پایدار گزینه', variantType: 'ویژگی', options: 'گزینه‌های ویژگی' };
  return {
    ...collection,
    trash: false,
    labels: option ? { singular: 'گزینه ویژگی', plural: 'گزینه‌های ویژگی' } : { singular: 'ویژگی', plural: 'ویژگی‌ها' },
    admin: { ...collection.admin, group: 'کاتالوگ', description: 'ویژگی‌ها به‌صورت خودکار مدل ایجاد نمی‌کنند.', defaultColumns: option ? ['label', 'variantType', 'value', 'active'] : ['label', 'name', 'active'] },
    hooks: { ...collection.hooks, beforeDelete: [...(collection.hooks?.beforeDelete ?? []), protectAttribute(option)],
      beforeValidate: [...(collection.hooks?.beforeValidate ?? []), async ({ data, originalDoc, req }) => {
        if (option && originalDoc?.id && data?.variantType !== undefined && relationID(data.variantType) !== relationID(originalDoc.variantType)) {
          await assertAttributeUnused(true, originalDoc.id, req);
        }
        return data;
      }] },
    fields: [
      ...collection.fields.map((field): Field => {
        if (!('name' in field)) return field;
        const isOptionsJoin = !option && field.name === 'options' && field.type === 'join';
        return { ...field, label: isOptionsJoin ? 'گزینه‌های این ویژگی' : labels[field.name] ?? field.label,
          ...(field.name === 'name' || field.name === 'value' ? { unique: true, index: true } : {}),
          admin: {
            ...field.admin,
            readOnly: false,
            ...(isOptionsJoin ? {
              allowCreate: true,
              defaultColumns: ['label', 'value', 'groupLabel', 'active'],
              description: 'گزینه‌های این ویژگی را همین‌جا ببینید، ویرایش کنید یا با «افزودن مورد جدید» بسازید؛ ویژگی فعلی خودکار انتخاب می‌شود.',
            } : { description: undefined }),
          } } as Field;
      }),
      { name: 'active', type: 'checkbox', label: 'فعال', defaultValue: true },
      { name: 'sortOrder', type: 'number', label: 'ترتیب نمایش', defaultValue: 0 },
      ...(option ? [
        { name: 'code', type: 'text', label: 'کد' },
        { name: 'groupLabel', type: 'text', label: 'پالت / خانواده' },
        { name: 'image', type: 'upload', relationTo: 'media', label: 'تصویر نمونه' },
        { name: 'colorHex', type: 'text', label: 'رنگ HEX' },
      ] satisfies Field[] : [{ name: 'helpTextFa', type: 'textarea', label: 'راهنمای انتخاب' }] satisfies Field[]),
    ],
  };
}

export const productAttributeFields: Field[] = [
  { name: 'attributes', type: 'array', label: 'ویژگی‌های محصول', labels: { singular: 'ویژگی', plural: 'ویژگی‌ها' }, fields: [
    { name: 'attribute', type: 'relationship', relationTo: 'variantTypes', required: true, label: 'ویژگی' },
    { name: 'allowedOptions', type: 'relationship', relationTo: 'variantOptions', hasMany: true, label: 'گزینه‌های مجاز',
      filterOptions: ({ siblingData }) => ({ variantType: { equals: relationID((siblingData as { attribute?: unknown })?.attribute) ?? -1 } }) },
    { name: 'required', type: 'checkbox', label: 'انتخاب مشتری الزامی است', defaultValue: false },
  ] },
];
