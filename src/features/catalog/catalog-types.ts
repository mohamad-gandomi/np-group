export type Availability = "in-stock" | "made-to-order";

export type ProductMeasurement = {
  key: string;
  label: string;
  value: number;
  unit: "cm" | "kg" | "m" | "unit";
};

export type ProductSpecification = {
  key: string;
  label: string;
  value: string;
};

export type ProductAttributeOption = {
  id: number;
  label: string;
  code?: string;
  swatchColor?: string;
  groupLabel?: string;
  image?: string;
};

export type ProductAttribute = {
  id: number;
  key: string;
  label: string;
  inputType: "swatch" | "select" | "radio";
  required: boolean;
  helpText?: string;
  options: readonly ProductAttributeOption[];
};

export type ProductVariant = {
  image?: string;
  availability?: "orderable" | "in_stock" | "unavailable";
  id: number;
  code: string;
  label: string;
  price: number | null;
  measurements: readonly ProductMeasurement[];
  manufacturingNotes?: string;
  shippingMode?: "parcel" | "freight";
};

export type Product = {
  productType?: "simple" | "variable";
  id: string;
  slug: string;
  name: string;
  brand: string;
  brandSlug?: string;
  category: string;
  categorySlugs?: readonly string[];
  categoryTitle?: string;
  room: readonly string[];
  colors: readonly string[];
  catalogFacets?: readonly ProductCatalogFacet[];
  price: number | null;
  shippingMode?: "parcel" | "freight";
  image: string;
  width: number | null;
  seats?: number;
  availability: Availability;
  isNew: boolean;
  isSale: boolean;
  createdAt: string;
  payloadProductId?: number;
  payloadCategorySlug?: string;
  description?: string;
  gallery?: readonly string[];
  leadTime?: string;
  orderNotes?: string;
  measurements?: readonly ProductMeasurement[];
  technicalSpecs?: readonly ProductSpecification[];
  variants?: readonly ProductVariant[];
  attributes?: readonly ProductAttribute[];
  relatedPayloadProductIds?: readonly number[];
};

export type CatalogCategory = {
  slug: string;
  title: string;
  description?: string;
  count: string;
  image: string;
  className: string;
};

export type CatalogFilterOption = {
  label: string;
  value: string;
  count?: number;
  swatchColor?: string;
};

export type CatalogFacetPresentation = "checkbox" | "swatch";
export type CatalogFacetPlacement = "primary" | "more";

export type ProductCatalogFacet = {
  key: string;
  label: string;
  presentation: CatalogFacetPresentation;
  placement: CatalogFacetPlacement;
  sortOrder: number;
  scope: "all" | "categories";
  categorySlugs: readonly string[];
  options: readonly CatalogFilterOption[];
};

export type CatalogAttributeFacet = ProductCatalogFacet;

export type CatalogFacets = {
  categories: readonly CatalogCategory[];
  brand: readonly CatalogFilterOption[];
  room: readonly CatalogFilterOption[];
  availability: readonly CatalogFilterOption[];
  attributes: readonly CatalogAttributeFacet[];
  hasPrices: boolean;
};
