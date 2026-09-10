import type {
  Brand,
  Category,
  ConfigurationGroup,
  ConfigurationOption,
  Media,
  Product as PayloadProduct,
  Variant,
  VariantOption,
} from "@/payload-types";

import type {
  Product,
  ProductConfigurationGroup,
  ProductMeasurement,
  ProductVariant,
} from "./catalog-types";

export type PayloadCatalogRelations = {
  configurationGroups: readonly ConfigurationGroup[];
  configurationOptions: readonly ConfigurationOption[];
  variants: readonly Variant[];
};

const isDocument = <T extends { id: number }>(value: number | T | null | undefined): value is T =>
  Boolean(value) && typeof value === "object";

const storefrontCategory = (category: Category | undefined) => {
  if (!category) return "furniture";
  if (category.slug === "home-furniture") return "furniture";
  if (category.slug === "coffee-side-tables" || category.slug === "dining") return "tables";
  return category.slug;
};

const mediaURL = (value: number | Media | null | undefined) => {
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

const mapGroups = ({ configurationGroups, configurationOptions }: PayloadCatalogRelations): ProductConfigurationGroup[] =>
  configurationGroups.map((group) => ({
    id: group.id,
    key: group.key,
    label: group.title,
    inputType: group.inputType,
    required: group.required === true,
    ...(group.helpTextFa ? { helpText: group.helpTextFa } : {}),
    options: configurationOptions
      .filter((option) => (typeof option.group === "number" ? option.group : option.group.id) === group.id)
      .sort((left, right) => (left.sortOrder ?? 0) - (right.sortOrder ?? 0))
      .map((option) => ({
        id: option.id,
        label: option.title,
        ...(option.code ? { code: option.code } : {}),
        ...(option.swatchColor ? { swatchColor: option.swatchColor } : {}),
      })),
  }));

const mapVariants = (variants: readonly Variant[]): ProductVariant[] => variants.map((variant) => {
  const optionLabels = variant.options
    .filter((option): option is VariantOption => isDocument(option))
    .map((option) => option.label);
  return {
    id: variant.id,
    code: variant.nilperCode,
    label: optionLabels.join(" · ") || variant.title || variant.nilperCode,
    price: variant.priceInTMNEnabled === true && typeof variant.priceInTMN === "number" ? variant.priceInTMN : null,
    measurements: mapMeasurements(variant.measurements),
    ...(variant.manufacturingNotesFa ? { manufacturingNotes: variant.manufacturingNotesFa } : {}),
  };
});

export function mapPayloadProduct(product: PayloadProduct, relations: PayloadCatalogRelations): Product {
  const brand = isDocument<Brand>(product.brand) ? product.brand : undefined;
  const category = product.categories.find((value): value is Category => isDocument(value));
  const mainImage = mediaURL(product.mainImage) ?? "/placeholders/sofa.jpg";
  const gallery = [
    mainImage,
    ...(product.gallery ?? []).map((item) => mediaURL(item.image)).filter((url): url is string => Boolean(url)),
  ].filter((url, index, all) => all.indexOf(url) === index);
  const groups = mapGroups(relations);
  const variants = mapVariants(relations.variants);
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
    slug: product.slug,
    name: product.title,
    brand: brand?.title ?? "نیلپر",
    category: storefrontCategory(category),
    room: category?.slug === "home-furniture" ? ["پذیرایی"] : [],
    material,
    colors: groups.find((group) => group.inputType === "swatch")?.options.map((option) => option.label) ?? [],
    price,
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
    configurationGroups: groups,
  };
}
