import type {
  Brand,
  Category,
  VariantType,
  Media,
  Product as PayloadProduct,
  Variant,
  VariantOption,
} from "@/payload-types";

import type {
  Product,
  ProductAttribute,
  ProductMeasurement,
  ProductVariant,
} from "./catalog-types";
import { storefrontTaxonomyForPayloadCategory } from "./catalog-taxonomy";
import { relationID, relationIDs, resolveCommerce } from "@/payload/catalog-domain";

export type PayloadCatalogRelations = {
  attributes: readonly VariantType[];
  attributeOptions: readonly VariantOption[];
  variants: readonly Variant[];
};

const isDocument = <T extends { id: number }>(value: number | T | null | undefined): value is T =>
  Boolean(value) && typeof value === "object";

const relationshipIDs = <T extends { id: number }>(values: Array<number | T> | null | undefined) =>
  (values ?? []).map((value) => typeof value === "number" ? value : value.id);

export const payloadMediaURL = (value: number | Media | null | undefined) => {
  if (!isDocument(value)) return undefined;
  if (value.filename) return `/api/media/file/${encodeURIComponent(value.filename)}`;
  if (!value.url) return undefined;
  try {
    const url = new URL(value.url);
    return url.pathname.startsWith("/api/media/file/") ? `${url.pathname}${url.search}` : undefined;
  } catch {
    return value.url.startsWith("/") ? value.url : undefined;
  }
};

const lexicalText = (value: unknown): string => {
  const parts: string[] = [];
  const visit = (node: unknown) => {
    if (!node || typeof node !== "object") return;
    const record = node as Record<string, unknown>;
    if (typeof record.text === "string") parts.push(record.text);
    if (record.root) visit(record.root);
    if (Array.isArray(record.children)) {
      const before = parts.length;
      record.children.forEach(visit);
      if (record.type === "paragraph" && parts.length > before) parts.push("\n");
    }
  };
  visit(value);
  return parts.join(" ").replace(/\s*\n\s*/g, "\n").trim();
};

const mapMeasurements = (measurements: PayloadProduct["measurements"] | Variant["measurements"]): ProductMeasurement[] =>
  (measurements ?? [])
    .map((measurement) => ({
      key: measurement.key,
      label: measurement.labelFa,
      value: measurement.value,
      unit: measurement.unit,
    }))
    .sort((left, right) => left.label.localeCompare(right.label, "fa"));

const mapGroups = (product: PayloadProduct, { attributes, attributeOptions }: PayloadCatalogRelations): ProductAttribute[] =>
  attributes.filter((group) => group.active !== false && !relationIDs(product.variantAttributes).includes(group.id)).map((group) => ({
    id: group.id,
    key: group.name,
    label: group.label,
    inputType: attributeOptions.some((option) => relationID(option.variantType) === group.id && option.colorHex) ? 'swatch' : 'select',
    required: product.attributes?.find((row) => relationID(row.attribute) === group.id)?.required === true,
    ...(group.helpTextFa ? { helpText: group.helpTextFa } : {}),
    options: attributeOptions
      .filter((option) => option.active !== false && relationID(option.variantType) === group.id && relationIDs(product.attributes?.find((row) => relationID(row.attribute) === group.id)?.allowedOptions).includes(option.id))
      .sort((left, right) => (left.sortOrder ?? 0) - (right.sortOrder ?? 0))
      .map((option) => ({
        id: option.id,
        label: option.label,
        ...(option.code ? { code: option.code } : {}),
        ...(option.colorHex ? { swatchColor: option.colorHex } : {}),
        ...(option.groupLabel ? { groupLabel: option.groupLabel } : {}),
        ...(payloadMediaURL(option.image) ? { image: payloadMediaURL(option.image) } : {}),
      })),
  }));

const mapVariants = (product: PayloadProduct, variants: readonly Variant[]): ProductVariant[] => variants.map((variant) => {
  const resolved = resolveCommerce(product as unknown as Record<string, unknown>, variant as unknown as Record<string, unknown>);
  const optionLabels = variant.options
    .filter((option): option is VariantOption => isDocument(option))
    .map((option) => option.label);
  return {
    id: variant.id,
    image: payloadMediaURL(resolved.mainImage as number | Media | null | undefined),
    availability: resolved.availabilityMode as ProductVariant['availability'],
    code: variant.nilperCode,
    label: optionLabels.join(" · ") || variant.title || variant.nilperCode,
    price: resolved.availabilityMode !== 'unavailable' && resolved.priceInTMNEnabled === true && typeof resolved.priceInTMN === "number" ? resolved.priceInTMN : null,
    shippingMode: resolved.shippingMode === "parcel" ? "parcel" : "freight",
    measurements: mapMeasurements(variant.measurements),
    ...(variant.manufacturingNotesFa ? { manufacturingNotes: variant.manufacturingNotesFa } : {}),
  };
});

export function mapPayloadProduct(product: PayloadProduct, relations: PayloadCatalogRelations): Product {
  const brand = isDocument<Brand>(product.brand) ? product.brand : undefined;
  const category = product.categories.find((value): value is Category => isDocument(value));
  const taxonomy = storefrontTaxonomyForPayloadCategory(category?.slug ?? "furniture", category?.title ?? "مبلمان خانگی");
  const mainImage = payloadMediaURL(product.mainImage) ?? "";
  const gallery = [
    mainImage,
    ...(product.gallery ?? []).map((item) => payloadMediaURL(item.image)).filter((url): url is string => Boolean(url)),
  ].filter((url, index, all) => Boolean(url) && all.indexOf(url) === index);
  const groups = mapGroups(product, relations);
  const variants = product.productType === 'variable' ? mapVariants(product, relations.variants) : [];
  const productPrice = product.priceInTMNEnabled === true && typeof product.priceInTMN === "number"
    ? product.priceInTMN
    : null;
  const price = variants.find((variant) => variant.price !== null)?.price ?? productPrice;
  const measurements = mapMeasurements(product.measurements);
  const width = measurements.find((measurement) => measurement.key === "width")?.value ?? null;
  const technicalSpecs = (product.technicalSpecs ?? []).map((specification) => ({
    key: specification.key,
    label: specification.labelFa,
    value: specification.valueFa,
    group: specification.group,
  }));
  const material = [...new Set(technicalSpecs
    .filter((specification) => specification.group === "materials" || specification.group === "construction")
    .map((specification) => specification.value))];

  return {
    id: `payload-${product.id}`,
    payloadProductId: product.id,
    source: "payload",
    productType: product.productType,
    ...(category?.slug ? { payloadCategorySlug: category.slug } : {}),
    slug: product.slug,
    name: product.title,
    brand: brand?.title ?? "نیلپر",
    ...(brand?.slug ? { brandSlug: brand.slug } : {}),
    category: taxonomy.slug,
    categorySlugs: product.categories.filter((value): value is Category => isDocument(value)).map((value) => storefrontTaxonomyForPayloadCategory(value.slug, value.title).slug),
    categoryTitle: taxonomy.title,
    room: taxonomy.rooms,
    material,
    colors: groups.find((group) => group.inputType === "swatch")?.options.map((option) => option.label) ?? [],
    price,
    shippingMode: product.shippingMode === "parcel" ? "parcel" : "freight",
    image: mainImage,
    gallery,
    width,
    availability: product.availabilityMode === "in_stock" ? "in-stock" : "made-to-order",
    isNew: false,
    isSale: false,
    createdAt: product.createdAt,
    description: lexicalText(product.descriptionFa),
    ...(product.leadTimeFa ? { leadTime: product.leadTimeFa } : {}),
    ...(product.orderNotesFa ? { orderNotes: product.orderNotesFa } : {}),
    measurements,
    technicalSpecs,
    variants,
    attributes: groups,
    relatedPayloadProductIds: [...new Set([
      ...relationshipIDs(product.matchingProducts),
      ...relationshipIDs(product.relatedProducts),
    ])],
  };
}
