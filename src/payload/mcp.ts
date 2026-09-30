import { mcpPlugin, type MCPAccessSettings } from "@payloadcms/plugin-mcp";
import { ValidationError } from "payload";
import type { Access, CollectionConfig, CollectionSlug, Field, FieldAccess, PayloadRequest } from "payload";
import { z } from "zod";

import { isContentAgentUser, isStrictAdminUser } from "./access";

type EntityID = number | string;
type DataRecord = Record<string, unknown>;
type ChangeResult = {
  status: "draft-created" | "existing-found" | "needs-review";
  interpretedStructure?: {
    attributes: number;
    categories: number;
    options: number;
    productFields: string[];
    realVariants: number;
  };
  created: string[];
  reused: string[];
  updated: string[];
  skipped: string[];
  warnings: string[];
  needsReview: string[];
  document?: { collection: string; id: EntityID; slug?: string };
};

const exposedCollections = [
  "products",
  "variants",
  "variantTypes",
  "variantOptions",
  "categories",
  "brands",
  "posts",
  "blog-categories",
  "projects",
  "media",
] as const satisfies readonly CollectionSlug[];

const collectionDescriptions: Record<(typeof exposedCollections)[number], string> = {
  products: "Catalog products. Search by slug or catalogCode before creating. Products must remain drafts.",
  variants: "Real SKU/model variants only. Never create Cartesian products from customer color or fabric choices.",
  variantTypes: "Reusable product attributes. Search and normalize before creating.",
  variantOptions: "Reusable attribute options. Search within the owning variant type before creating.",
  categories: "Catalog taxonomy. Reuse normalized slug/title matches and leave new records unpublished.",
  brands: "Brand profiles. Search by slug/title before creating and leave new records unpublished.",
  posts: "Editorial articles. Check for duplicate topics and keep all changes as drafts.",
  "blog-categories": "Editorial taxonomy. Reuse existing categories and leave new records unpublished.",
  projects: "Showcase projects. Reuse related content and leave new records unpublished.",
  media: "Image library. Prefer existing media; images are optional for content drafts.",
};

const collectionPermissionLabels: Record<string, string> = {
  products: "محصولات",
  variants: "مدل‌های محصول",
  variantTypes: "ویژگی‌ها",
  variantOptions: "گزینه‌های ویژگی",
  categories: "دسته‌بندی‌های محصولات",
  brands: "برندها",
  posts: "مقاله‌ها",
  blogCategories: "دسته‌بندی‌های مجله",
  projects: "پروژه‌ها",
  media: "رسانه‌ها",
};

const operationPermissionLabels: Record<string, string> = {
  find: "مشاهده و جست‌وجو",
};

const toolPermissionLabels: Record<string, string> = {
  catalogFindExisting: "جست‌وجوی محتوای موجود",
  catalogCreateProductDraft: "ساخت پیش‌نویس محصول",
  contentCreateArticleDraft: "ساخت پیش‌نویس مقاله",
  contentCreateProjectDraft: "ساخت پیش‌نویس پروژه",
  contentCreateBrandDraft: "ساخت پیش‌نویس برند",
};

const permissionPaths = [
  ...Object.keys(collectionPermissionLabels).flatMap((collection) => (
    Object.keys(operationPermissionLabels).map((operation) => `${collection}.${operation}`)
  )),
  ...Object.keys(toolPermissionLabels).map((tool) => `payload-mcp-tool.${tool}`),
];

const result = (): ChangeResult => ({
  status: "draft-created",
  created: [],
  reused: [],
  updated: [],
  skipped: [],
  warnings: [],
  needsReview: [],
});

const textResponse = (value: unknown) => ({
  content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }],
});

const relationID = (value: unknown): EntityID | undefined => {
  if (typeof value === "number" || typeof value === "string") return value;
  if (value && typeof value === "object" && "id" in value) return relationID(value.id);
  return undefined;
};

const aliases: Record<string, string> = {
  wenge: "wenge",
  "ونگه": "wenge",
};

export const normalizeContentIdentity = (value: string) => {
  const normalized = value
    .normalize("NFKC")
    .toLocaleLowerCase("fa")
    .replaceAll("ي", "ی")
    .replaceAll("ك", "ک")
    .replace(/[\s\u200c_-]+/g, "")
    .trim();
  return aliases[normalized] ?? normalized;
};

const searchableFields: Record<(typeof exposedCollections)[number], readonly string[]> = {
  products: ["slug", "catalogCode", "title"],
  variants: ["nilperCode", "title"],
  variantTypes: ["name", "label"],
  variantOptions: ["value", "label"],
  categories: ["slug", "title"],
  brands: ["slug", "title"],
  posts: ["slug", "title", "seo.primaryTopic"],
  "blog-categories": ["slug", "title"],
  projects: ["slug", "title"],
  media: ["filename", "alt"],
};

const assertAgent = (req: PayloadRequest) => {
  if (!isContentAgentUser(req.user)) {
    throw new ValidationError({
      req,
      errors: [{ path: "mcp", message: "This MCP tool requires a dedicated content-agent identity." }],
    });
  }
};

const findNormalized = async (
  req: PayloadRequest,
  collection: (typeof exposedCollections)[number],
  values: readonly string[],
  fields = searchableFields[collection],
) => {
  const wanted = new Set(values.filter(Boolean).map(normalizeContentIdentity));
  if (wanted.size === 0) return [];
  const found = await req.payload.find({
    collection,
    depth: 1,
    limit: 200,
    overrideAccess: false,
    pagination: false,
    req,
    user: req.user,
  } as never) as unknown as { docs: DataRecord[]; totalDocs: number };
  return found.docs.filter((doc) => fields.some((field) => {
    const value = field.split(".").reduce<unknown>((current, key) => (
      current && typeof current === "object" ? (current as DataRecord)[key] : undefined
    ), doc);
    return typeof value === "string" && wanted.has(normalizeContentIdentity(value));
  }));
};

const entityRefSchema = z.object({
  slug: z.string().min(1).optional(),
  title: z.string().min(1).optional(),
}).refine((value) => value.slug || value.title, "A slug or title is required.");

const resolveSimpleEntity = async ({
  collection,
  createData,
  label,
  output,
  req,
  values,
}: {
  collection: "brands" | "categories" | "blog-categories";
  createData: DataRecord;
  label: string;
  output: ChangeResult;
  req: PayloadRequest;
  values: string[];
}): Promise<EntityID | undefined> => {
  const matches = await findNormalized(req, collection, values);
  if (matches.length === 1) {
    const id = relationID(matches[0].id);
    if (id !== undefined) output.reused.push(`${collection}:${String(matches[0].slug ?? id)}`);
    return id;
  }
  if (matches.length > 1) {
    output.needsReview.push(`${label} matched multiple ${collection} records.`);
    return undefined;
  }
  if (typeof createData.slug !== "string" || typeof createData.title !== "string") {
    output.needsReview.push(`${label} does not exist and needs an explicit slug before it can be created.`);
    return undefined;
  }
  const created = await req.payload.create({
    collection,
    data: { ...createData, published: false },
    depth: 0,
    overrideAccess: false,
    req,
    user: req.user,
  } as never) as unknown as DataRecord;
  const id = relationID(created.id);
  if (id !== undefined) output.created.push(`${collection}:${String(created.slug ?? id)}`);
  return id;
};

const resolveExisting = async (
  req: PayloadRequest,
  collection: "products" | "posts" | "brands",
  reference: z.infer<typeof entityRefSchema>,
  output: ChangeResult,
) => {
  const values = [reference.slug, reference.title].filter((value): value is string => Boolean(value));
  const matches = await findNormalized(req, collection, values);
  if (matches.length !== 1) {
    output.needsReview.push(`${collection} reference "${values.join(" / ")}" ${matches.length ? "is ambiguous" : "was not found"}.`);
    return undefined;
  }
  const id = relationID(matches[0].id);
  if (id !== undefined) output.reused.push(`${collection}:${String(matches[0].slug ?? id)}`);
  return id;
};

const findExistingSchema = z.object({
  collection: z.enum(exposedCollections),
  query: z.string().min(1),
});

const productSchema = z.object({
  product: z.object({
    title: z.string().min(1),
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    catalogCode: z.string().min(1).optional(),
    descriptionFa: z.unknown(),
    salesMode: z.enum(["direct", "inquiry", "made_to_order"]).optional().default("made_to_order"),
    availabilityMode: z.enum(["orderable", "in_stock", "unavailable"]).optional().default("orderable"),
    shippingMode: z.enum(["parcel", "freight"]).optional().default("freight"),
    data: z.record(z.string(), z.unknown()).optional(),
  }),
  brand: entityRefSchema,
  categories: z.array(entityRefSchema).min(1),
  attributes: z.array(z.object({
    name: z.string().min(1),
    label: z.string().min(1),
    required: z.boolean().optional(),
    variantDiscriminator: z.boolean().optional().default(false),
    options: z.array(z.object({
      value: z.string().min(1),
      label: z.string().min(1),
      data: z.record(z.string(), z.unknown()).optional(),
    })).min(1),
  })).optional().default([]),
  variants: z.array(z.object({
    nilperCode: z.string().min(1),
    title: z.string().optional(),
    options: z.array(z.object({ attribute: z.string().min(1), value: z.string().min(1) })).min(1),
    data: z.record(z.string(), z.unknown()).optional(),
  })).optional().default([]),
});

const articleSchema = z.object({
  title: z.string().min(1),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  topic: z.string().min(1),
  description: z.string().min(1).max(240),
  summary: z.string().min(1),
  content: z.unknown(),
  takeaway: z.string().min(1),
  category: entityRefSchema,
  seo: z.object({
    title: z.string().max(70).optional(),
    description: z.string().max(170).optional(),
    primaryTopic: z.string().min(1),
    noIndex: z.boolean().optional(),
  }),
  relatedProducts: z.array(entityRefSchema).max(6).optional().default([]),
  relatedPosts: z.array(entityRefSchema).max(3).optional().default([]),
  relatedBrands: z.array(entityRefSchema).max(3).optional().default([]),
  heroImage: z.union([z.string(), z.number()]).optional(),
  heroCaption: z.string().optional(),
  data: z.record(z.string(), z.unknown()).optional(),
});

const projectSchema = z.object({
  title: z.string().min(1),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  sector: z.enum(["residential", "hospitality", "commercial", "workplace", "healthcare"]),
  descriptionFa: z.string().min(1),
  briefFa: z.string().min(1),
  products: z.array(entityRefSchema).optional().default([]),
  article: entityRefSchema.optional(),
  data: z.record(z.string(), z.unknown()).optional(),
});

const brandSchema = z.object({
  title: z.string().min(1),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  data: z.record(z.string(), z.unknown()).optional(),
});

const catalogFindExisting = async (args: Record<string, unknown>, req: PayloadRequest) => {
  assertAgent(req);
  const input = findExistingSchema.parse(args);
  const matches = await findNormalized(req, input.collection, [input.query]);
  return textResponse({
    status: "existing-found",
    collection: input.collection,
    query: input.query,
    matches,
  });
};

const catalogCreateProductDraft = async (args: Record<string, unknown>, req: PayloadRequest) => {
  assertAgent(req);
  const input = productSchema.parse(args);
  const output = result();
  output.interpretedStructure = {
    attributes: input.attributes.length,
    categories: input.categories.length,
    options: input.attributes.reduce((total, attribute) => total + attribute.options.length, 0),
    productFields: [
      "title",
      "slug",
      "descriptionFa",
      "salesMode",
      "availabilityMode",
      "shippingMode",
      ...Object.keys(input.product.data ?? {}),
    ],
    realVariants: input.variants.length,
  };
  const existing = await findNormalized(
    req,
    "products",
    [input.product.slug, input.product.catalogCode ?? ""],
    ["slug", "catalogCode"],
  );
  if (existing.length) {
    output.status = existing.length === 1 ? "existing-found" : "needs-review";
    output.skipped.push(`product:${input.product.slug}`);
    output.needsReview.push(`Product slug/catalog code already matched ${existing.length} record(s); no product was created.`);
    return textResponse(output);
  }

  const brandID = await resolveSimpleEntity({
    collection: "brands",
    createData: { title: input.brand.title ?? input.brand.slug, slug: input.brand.slug },
    label: "Brand",
    output,
    req,
    values: [input.brand.slug, input.brand.title].filter((value): value is string => Boolean(value)),
  });
  const categoryIDs: EntityID[] = [];
  for (const category of input.categories) {
    const id = await resolveSimpleEntity({
      collection: "categories",
      createData: { title: category.title ?? category.slug, slug: category.slug },
      label: "Category",
      output,
      req,
      values: [category.slug, category.title].filter((value): value is string => Boolean(value)),
    });
    if (id !== undefined) categoryIDs.push(id);
  }
  if (brandID === undefined || categoryIDs.length !== input.categories.length) {
    output.status = "needs-review";
    output.skipped.push(`product:${input.product.slug}`);
    return textResponse(output);
  }

  const assignments: DataRecord[] = [];
  const discriminatorIDs: EntityID[] = [];
  const optionIDs = new Map<string, EntityID>();
  for (const attribute of input.attributes) {
    const typeMatches = await findNormalized(req, "variantTypes", [attribute.name, attribute.label]);
    let typeID: EntityID | undefined;
    if (typeMatches.length === 1) {
      typeID = relationID(typeMatches[0].id);
      output.reused.push(`variantTypes:${String(typeMatches[0].name ?? typeID)}`);
    } else if (typeMatches.length > 1) {
      output.needsReview.push(`Attribute "${attribute.label}" matched multiple variant types.`);
    } else {
      const created = await req.payload.create({
        collection: "variantTypes",
        data: { name: attribute.name, label: attribute.label, active: true },
        depth: 0,
        overrideAccess: false,
        req,
        user: req.user,
      } as never) as unknown as DataRecord;
      typeID = relationID(created.id);
      output.created.push(`variantTypes:${attribute.name}`);
    }
    if (typeID === undefined) continue;
    const allowedOptions: EntityID[] = [];
    for (const option of attribute.options) {
      const matches = (await findNormalized(req, "variantOptions", [option.value, option.label]))
        .filter((candidate) => relationID(candidate.variantType) === typeID);
      let optionID: EntityID | undefined;
      if (matches.length === 1) {
        optionID = relationID(matches[0].id);
        output.reused.push(`variantOptions:${attribute.name}:${String(matches[0].value ?? optionID)}`);
      } else if (matches.length > 1) {
        output.needsReview.push(`Option "${option.label}" is ambiguous within attribute "${attribute.label}".`);
      } else {
        const created = await req.payload.create({
          collection: "variantOptions",
          data: { ...option.data, variantType: typeID, value: option.value, label: option.label, active: true },
          depth: 0,
          overrideAccess: false,
          req,
          user: req.user,
        } as never) as unknown as DataRecord;
        optionID = relationID(created.id);
        output.created.push(`variantOptions:${attribute.name}:${option.value}`);
      }
      if (optionID !== undefined) {
        allowedOptions.push(optionID);
        optionIDs.set(`${normalizeContentIdentity(attribute.name)}:${normalizeContentIdentity(option.value)}`, optionID);
        optionIDs.set(`${normalizeContentIdentity(attribute.label)}:${normalizeContentIdentity(option.label)}`, optionID);
      }
    }
    assignments.push({ attribute: typeID, allowedOptions, required: attribute.required ?? false });
    if (attribute.variantDiscriminator) discriminatorIDs.push(typeID);
  }
  if (output.needsReview.length) {
    output.status = "needs-review";
    output.skipped.push(`product:${input.product.slug}`);
    return textResponse(output);
  }
  if (input.variants.length > 0 && discriminatorIDs.length === 0) {
    output.status = "needs-review";
    output.skipped.push(`product:${input.product.slug}`);
    output.needsReview.push("Variants were supplied without any explicit variantDiscriminator attribute.");
    return textResponse(output);
  }

  const product = await req.payload.create({
    collection: "products",
    data: {
      ...input.product.data,
      title: input.product.title,
      slug: input.product.slug,
      catalogCode: input.product.catalogCode,
      descriptionFa: input.product.descriptionFa,
      salesMode: input.product.salesMode,
      availabilityMode: input.product.availabilityMode,
      shippingMode: input.product.shippingMode,
      brand: brandID,
      categories: categoryIDs,
      productType: input.variants.length ? "variable" : "simple",
      attributes: assignments,
      variantAttributes: discriminatorIDs,
      _status: "draft",
    },
    depth: 0,
    draft: true,
    overrideAccess: false,
    req,
    user: req.user,
  } as never) as unknown as DataRecord;
  const productID = relationID(product.id)!;
  output.created.push(`product:${input.product.slug}`);
  output.document = { collection: "products", id: productID, slug: input.product.slug };

  for (const variant of input.variants) {
    const existingVariant = await findNormalized(req, "variants", [variant.nilperCode], ["nilperCode"]);
    if (existingVariant.length) {
      output.skipped.push(`variant:${variant.nilperCode}`);
      output.needsReview.push(`Variant SKU "${variant.nilperCode}" already exists; it was not created.`);
      continue;
    }
    const selectedOptions = variant.options.map(({ attribute, value }) => (
      optionIDs.get(`${normalizeContentIdentity(attribute)}:${normalizeContentIdentity(value)}`)
    ));
    if (selectedOptions.some((id) => id === undefined)) {
      output.skipped.push(`variant:${variant.nilperCode}`);
      output.needsReview.push(`Variant "${variant.nilperCode}" references an unresolved attribute option.`);
      continue;
    }
    await req.payload.create({
      collection: "variants",
      data: {
        ...variant.data,
        product: productID,
        nilperCode: variant.nilperCode,
        title: variant.title,
        options: selectedOptions,
        _status: "draft",
      },
      depth: 0,
      draft: true,
      overrideAccess: false,
      req,
      user: req.user,
    } as never);
    output.created.push(`variant:${variant.nilperCode}`);
  }
  if (output.needsReview.length) output.warnings.push("The product draft was created, but one or more variants require review.");
  return textResponse(output);
};

const contentCreateArticleDraft = async (args: Record<string, unknown>, req: PayloadRequest) => {
  assertAgent(req);
  const input = articleSchema.parse(args);
  const output = result();
  const duplicates = await findNormalized(req, "posts", [input.slug, input.title, input.topic]);
  if (duplicates.length) {
    output.status = duplicates.length === 1 ? "existing-found" : "needs-review";
    output.needsReview.push(`A post with the same slug, title, or normalized topic already exists; no article was created.`);
    return textResponse(output);
  }
  const categoryID = await resolveSimpleEntity({
    collection: "blog-categories",
    createData: { title: input.category.title ?? input.category.slug, slug: input.category.slug },
    label: "Article category",
    output,
    req,
    values: [input.category.slug, input.category.title].filter((value): value is string => Boolean(value)),
  });
  if (categoryID === undefined) {
    output.status = "needs-review";
    return textResponse(output);
  }
  const relatedProducts = (await Promise.all(input.relatedProducts.map((ref) => resolveExisting(req, "products", ref, output))))
    .filter((id): id is EntityID => id !== undefined);
  const relatedPosts = (await Promise.all(input.relatedPosts.map((ref) => resolveExisting(req, "posts", ref, output))))
    .filter((id): id is EntityID => id !== undefined);
  const relatedBrands = (await Promise.all(input.relatedBrands.map((ref) => resolveExisting(req, "brands", ref, output))))
    .filter((id): id is EntityID => id !== undefined);
  const article = await req.payload.create({
    collection: "posts",
    data: {
      ...input.data,
      title: input.title,
      slug: input.slug,
      category: categoryID,
      description: input.description,
      summary: input.summary,
      content: input.content,
      takeaway: input.takeaway,
      seo: input.seo,
      relatedProducts,
      relatedPosts,
      relatedBrands,
      heroImage: input.heroImage,
      heroCaption: input.heroCaption,
      _status: "draft",
    },
    depth: 0,
    draft: true,
    overrideAccess: false,
    req,
    user: req.user,
  } as never) as unknown as DataRecord;
  output.created.push(`post:${input.slug}`);
  output.document = { collection: "posts", id: relationID(article.id)!, slug: input.slug };
  return textResponse(output);
};

const contentCreateProjectDraft = async (args: Record<string, unknown>, req: PayloadRequest) => {
  assertAgent(req);
  const input = projectSchema.parse(args);
  const output = result();
  const existing = await findNormalized(req, "projects", [input.slug, input.title]);
  if (existing.length) {
    output.status = existing.length === 1 ? "existing-found" : "needs-review";
    output.needsReview.push("A project with the same slug or normalized title already exists; no project was created.");
    return textResponse(output);
  }
  const products = (await Promise.all(input.products.map((ref) => resolveExisting(req, "products", ref, output))))
    .filter((id): id is EntityID => id !== undefined);
  const article = input.article ? await resolveExisting(req, "posts", input.article, output) : undefined;
  const project = await req.payload.create({
    collection: "projects",
    data: {
      ...input.data,
      title: input.title,
      slug: input.slug,
      sector: input.sector,
      descriptionFa: input.descriptionFa,
      briefFa: input.briefFa,
      products,
      article,
      published: false,
    },
    depth: 0,
    overrideAccess: false,
    req,
    user: req.user,
  } as never) as unknown as DataRecord;
  output.created.push(`project:${input.slug}`);
  output.document = { collection: "projects", id: relationID(project.id)!, slug: input.slug };
  return textResponse(output);
};

const contentCreateBrandDraft = async (args: Record<string, unknown>, req: PayloadRequest) => {
  assertAgent(req);
  const input = brandSchema.parse(args);
  const output = result();
  const matches = await findNormalized(req, "brands", [input.slug, input.title]);
  if (matches.length) {
    output.status = matches.length === 1 ? "existing-found" : "needs-review";
    output.reused.push(...matches.map((match) => `brand:${String(match.slug ?? match.id)}`));
    if (matches.length > 1) output.needsReview.push("The brand reference matched multiple existing records.");
    return textResponse(output);
  }
  const brand = await req.payload.create({
    collection: "brands",
    data: { ...input.data, title: input.title, slug: input.slug, published: false },
    depth: 0,
    overrideAccess: false,
    req,
    user: req.user,
  } as never) as unknown as DataRecord;
  output.created.push(`brand:${input.slug}`);
  output.document = { collection: "brands", id: relationID(brand.id)!, slug: input.slug };
  return textResponse(output);
};

const adminOnly: Access = ({ req }) => isStrictAdminUser(req.user);
const adminOnlyField: FieldAccess = ({ req }) => isStrictAdminUser(req.user);

const localizePermissionField = (field: Field): Field => {
  if (field.type !== "collapsible") return field;
  const group = field.fields.find((candidate) => candidate.type === "group" && "name" in candidate);
  if (!group || group.type !== "group" || !("name" in group) || typeof group.name !== "string") return field;

  const isToolGroup = group.name === "payload-mcp-tool";
  const entityLabel = collectionPermissionLabels[group.name];
  if (!isToolGroup && !entityLabel) return field;

  const localizedGroup = {
    ...group,
    label: false,
    fields: group.fields.map((permission): Field => {
      if (permission.type !== "checkbox" || !("name" in permission)) return permission;
      const label = isToolGroup
        ? toolPermissionLabels[permission.name]
        : operationPermissionLabels[permission.name];
      if (!label) return permission;
      return {
        ...permission,
        label,
        admin: {
          ...permission.admin,
          description: isToolGroup
            ? `اجازه «${label}» به عامل محتوایی.`
            : `اجازه ${label} در بخش ${entityLabel}.`,
        },
      };
    }),
  } as Field;

  return {
    ...field,
    admin: {
      ...field.admin,
      description: isToolGroup
        ? "ابزارهای سطح بالایی که این کلید اجازه اجرای آن‌ها را دارد."
        : `دسترسی این کلید به ${entityLabel}.`,
    },
    fields: field.fields.map((candidate) => candidate === group ? localizedGroup : candidate),
    label: isToolGroup ? "ابزارهای گردش کار" : entityLabel,
  } as Field;
};

const restrictApiKeyCollection = (collection: CollectionConfig): CollectionConfig => ({
  ...collection,
  access: {
    ...collection.access,
    create: adminOnly,
    delete: adminOnly,
    read: adminOnly,
    unlock: adminOnly,
    update: adminOnly,
  },
  admin: {
    ...collection.admin,
    description: "کلیدهای اختصاصی اتصال عامل هوش مصنوعی به محتوای Payload و سطح دسترسی هر کلید.",
    defaultColumns: ["label", "user", "updatedAt"],
    group: "مدیریت",
    useAsTitle: "label",
  },
  fields: [
    {
      name: "mcpPermissionBulkActions",
      type: "ui",
      admin: {
        components: {
          Field: "./src/components/payload/mcp-permission-bulk-actions#McpPermissionBulkActions",
        },
        custom: { permissionPaths },
        position: "sidebar",
      },
    },
    ...collection.fields.map((field): Field => {
      if ("name" in field && field.name === "user") {
        return {
          ...field,
          access: { create: adminOnlyField, update: adminOnlyField },
          admin: { ...field.admin, description: "کاربر اختصاصی با نقش عامل محتوای هوش مصنوعی." },
          filterOptions: { role: { equals: "content-agent" } },
          label: "عامل محتوایی",
        } as Field;
      }
      if ("name" in field && field.name === "label") {
        return { ...field, label: "عنوان کلید", admin: { ...field.admin, description: "نامی روشن برای شناسایی این کلید." } } as Field;
      }
      if ("name" in field && field.name === "description") {
        return { ...field, label: "توضیحات", admin: { ...field.admin, description: "هدف و محل استفاده از این کلید." } } as Field;
      }
      return localizePermissionField(field);
    }),
  ],
  labels: { plural: "کلیدهای دسترسی MCP", singular: "کلید دسترسی MCP" },
});

export const mcpRawOperationAccess = { find: true, create: false, update: false, delete: false } as const;

export const payloadMcp = mcpPlugin({
  userCollection: "users",
  collections: Object.fromEntries(exposedCollections.map((slug) => [slug, {
    description: collectionDescriptions[slug],
    enabled: mcpRawOperationAccess,
  }])) as never,
  overrideApiKeyCollection: restrictApiKeyCollection,
  overrideAuth: async (req, getDefaultMcpAccessSettings) => {
    const settings = await getDefaultMcpAccessSettings();
    if (!isContentAgentUser(settings.user)) throw new Error("MCP keys must belong to a content-agent user.");
    req.user = settings.user;
    const safe = { ...settings, user: settings.user } as MCPAccessSettings;
    for (const slug of exposedCollections) {
      const key = slug.replace(/[-_\s]+(.)?/g, (_, letter: string | undefined) => letter?.toUpperCase() ?? "");
      const requested = settings[key] as typeof mcpRawOperationAccess | undefined;
      safe[key] = {
        find: mcpRawOperationAccess.find && requested?.find === true,
        create: false,
        update: false,
        delete: false,
      };
    }
    return safe;
  },
  mcp: {
    serverOptions: {
      instructions: [
        "For product input from Excel, CSV, text, Word, PDF, JSON, or any other source, first understand the source's structure and meaning; never assume a fixed format.",
        "Map only understood data to the existing Payload product, brand, category, attribute, option, measurement, technical specification, SKU, variant, media, and relationship fields.",
        "Search Payload before every create or update and reuse normalized existing entities. Treat colors, fabrics, finishes, and wood choices as attributes by default.",
        "Create a variant only for a real SKU/model identity backed by catalog code, dimensions, price, inventory, shipping, or manufacturing differences; never generate Cartesian combinations.",
        "Do not guess when data is ambiguous. Put unresolved items in needsReview and skipped. Use only MCP tools, keep new content draft or unpublished, and never delete or publish.",
        "Raw collection tools are read-only. All content and catalog writes must use the high-level domain tools so validation, reuse, duplicate checks, draft enforcement, and ambiguity reporting cannot be skipped.",
        "Return a short report containing interpretedStructure, created, reused, updated, skipped, and needsReview.",
      ].join(" "),
      serverInfo: { name: "NPGroup Payload Content MCP", version: "1.0.0" },
    },
    tools: [
      {
        name: "catalogFindExisting",
        description: "Search existing catalog or content records using normalized identities before any create operation.",
        parameters: findExistingSchema.shape,
        handler: catalogFindExisting,
      },
      {
        name: "catalogCreateProductDraft",
        description: "After the agent interprets and normalizes any source format, search and reuse catalog taxonomy, then create one product draft and only explicitly supplied real SKU variants. Returns interpreted structure and change reporting; never publishes.",
        parameters: productSchema.shape,
        handler: catalogCreateProductDraft,
      },
      {
        name: "contentCreateArticleDraft",
        description: "Create a fully written SEO article draft after duplicate checks. The agent must supply valid Lexical content and may link existing products/posts.",
        parameters: articleSchema.shape,
        handler: contentCreateArticleDraft,
      },
      {
        name: "contentCreateProjectDraft",
        description: "Create an unpublished project draft and reuse existing product/article relationships.",
        parameters: projectSchema.shape,
        handler: contentCreateProjectDraft,
      },
      {
        name: "contentCreateBrandDraft",
        description: "Search first, then create an unpublished brand profile only when no normalized match exists.",
        parameters: brandSchema.shape,
        handler: contentCreateBrandDraft,
      },
    ],
  },
});

export const mcpExposedCollections = exposedCollections;
