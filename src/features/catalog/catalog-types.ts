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
  group: string;
};

export type ProductConfigurationOption = {
  id: number;
  label: string;
  code?: string;
  swatchColor?: string;
};

export type ProductConfigurationGroup = {
  id: number;
  key: string;
  label: string;
  inputType: "swatch" | "select" | "radio";
  required: boolean;
  helpText?: string;
  options: readonly ProductConfigurationOption[];
};

export type ProductVariant = {
  id: number;
  code: string;
  label: string;
  price: number | null;
  measurements: readonly ProductMeasurement[];
  manufacturingNotes?: string;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: string;
  room: readonly string[];
  material: readonly string[];
  colors: readonly string[];
  price: number | null;
  image: string;
  width: number | null;
  seats?: number;
  availability: Availability;
  isNew: boolean;
  isSale: boolean;
  createdAt: string;
  source?: "fixture" | "payload";
  payloadProductId?: number;
  description?: string;
  gallery?: readonly string[];
  leadTime?: string;
  orderNotes?: string;
  measurements?: readonly ProductMeasurement[];
  technicalSpecs?: readonly ProductSpecification[];
  variants?: readonly ProductVariant[];
  configurationGroups?: readonly ProductConfigurationGroup[];
};

export type CatalogCategory = {
  slug: string;
  title: string;
  count: string;
  image: string;
  className: string;
};
