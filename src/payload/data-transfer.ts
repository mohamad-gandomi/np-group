import { importExportPlugin } from "@payloadcms/plugin-import-export";
import path from "node:path";
import type {
  Access,
  CollectionConfig,
  CollectionSlug,
  Config,
  Endpoint,
  Field,
  PayloadRequest,
  TaskConfig,
} from "payload";

type DataRecord = Record<string, unknown>;
type TransferKind = "export" | "import";

const TRANSFER_RETENTION_DAYS = 7;
const TRANSFER_COLLECTIONS = [
  "brands",
  "categories",
  "product-series",
  "configuration-groups",
  "configuration-options",
  "variantTypes",
  "variantOptions",
  "products",
  "variants",
  "blog-categories",
  "posts",
  "projects",
] as const satisfies readonly CollectionSlug[];

const STABLE_MATCH_FIELDS: Partial<Record<typeof TRANSFER_COLLECTIONS[number], string>> = {
  brands: "slug",
  categories: "slug",
  "product-series": "slug",
  "configuration-groups": "key",
  variantTypes: "name",
  products: "slug",
  variants: "nilperCode",
  "blog-categories": "slug",
  posts: "slug",
  projects: "slug",
};

const isRecord = (value: unknown): value is DataRecord =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

export const isStrictAdminUser = (user: unknown) =>
  isRecord(user) && user.collection === "users" && user.role === "admin";

const strictAdminAccess: Access = ({ req }) => isStrictAdminUser(req.user);
const strictAdminPanelAccess = ({ req }: { req: PayloadRequest }) => isStrictAdminUser(req.user);

const protectEndpoint = (endpoint: Endpoint): Endpoint => ({
  ...endpoint,
  handler: async (req) => {
    if (!isStrictAdminUser(req.user)) {
      return Response.json({ error: "دسترسی به ورود و خروج داده فقط برای مدیر مجاز است." }, { status: 403 });
    }
    return endpoint.handler(req);
  },
});

const fieldLabels: Record<string, string> = {
  collectionSlug: "نوع داده",
  drafts: "شامل پیش‌نویس‌ها",
  fields: "فیلدهای خروجی",
  format: "فرمت فایل",
  importMode: "روش ورود",
  limit: "حداکثر تعداد",
  matchField: "کلید تطبیق",
  name: "نام فایل",
  page: "صفحه",
  sort: "مرتب‌سازی بر اساس",
  sortOrder: "جهت مرتب‌سازی",
  status: "وضعیت",
  summary: "نتیجه ورود",
};

const localizeTransferField = (field: Field): Field => {
  const next = { ...field } as Field;
  if ("name" in next && typeof next.name === "string" && fieldLabels[next.name]) {
    next.label = fieldLabels[next.name];
  }
  if (next.type === "group" || next.type === "row" || next.type === "collapsible" || next.type === "array") {
    next.fields = next.fields.map(localizeTransferField);
  } else if (next.type === "tabs") {
    next.tabs = next.tabs.map((tab) => ({ ...tab, fields: tab.fields.map(localizeTransferField) }));
  }
  if ("name" in next && next.name === "status" && next.type === "select") {
    next.options = [
      { label: "در انتظار", value: "pending" },
      { label: "کامل", value: "completed" },
      { label: "بخشی انجام شد", value: "partial" },
      { label: "ناموفق", value: "failed" },
    ];
  }
  if ("name" in next && next.name === "summary" && next.type === "group") {
    const summaryLabels: Record<string, string> = {
      imported: "ایجادشده",
      issueDetails: "جزئیات خطاها",
      issues: "تعداد خطاها",
      total: "تعداد کل",
      updated: "به‌روزشده",
    };
    next.fields = next.fields.map((child) => {
      if (!("name" in child) || typeof child.name !== "string") return child;
      return { ...child, label: summaryLabels[child.name] ?? child.label } as Field;
    });
  }
  return next;
};

const customizeTransferField = (field: Field, kind: TransferKind): Field => {
  const next = localizeTransferField(field);
  if (next.type === "group" || next.type === "row" || next.type === "collapsible" || next.type === "array") {
    next.fields = next.fields.map((child) => customizeTransferField(child, kind));
  } else if (next.type === "tabs") {
    next.tabs = next.tabs.map((tab) => ({
      ...tab,
      fields: tab.fields.map((child) => customizeTransferField(child, kind)),
    }));
  }
  if (kind === "export" && next.type === "ui" && next.name === "preview") {
    next.admin = {
      ...next.admin,
      components: {
        ...next.admin?.components,
        Field: "./src/components/payload/data-transfer-preview#ExportDataPreview",
      },
    };
  }
  if (kind === "export" && next.type === "text" && next.name === "name") {
    next.admin = {
      ...next.admin,
      components: {
        ...next.admin?.components,
        Cell: "./src/components/payload/data-transfer-actions#ExportNameCell",
      },
    };
  }
  return next;
};

const secureTransferCollection = (collection: CollectionConfig, kind: TransferKind): CollectionConfig => {
  const directory = path.resolve(process.cwd(), "media", "data-transfer", kind === "import" ? "imports" : "exports");
  const upload = typeof collection.upload === "object"
    ? {
        ...collection.upload,
        staticDir: directory,
        ...(kind === "import" ? { mimeTypes: ["application/json"] } : {}),
      }
    : collection.upload;

  return {
    ...collection,
    access: {
      ...collection.access,
      admin: strictAdminPanelAccess,
      create: strictAdminAccess,
      delete: strictAdminAccess,
      read: strictAdminAccess,
      update: () => false,
    },
    admin: {
      ...collection.admin,
      components: kind === "export"
        ? {
            ...collection.admin?.components,
            edit: {
              ...collection.admin?.components?.edit,
              beforeDocumentControls: [
                ...(collection.admin?.components?.edit?.beforeDocumentControls ?? []),
                "./src/components/payload/data-transfer-actions#ExportDownloadControl",
              ],
              Upload: "./src/components/payload/data-transfer-actions#HiddenExportUpload",
            },
          }
        : collection.admin?.components,
      group: "ابزار داده",
      defaultColumns: kind === "import"
        ? ["filename", "collectionSlug", "importMode", "status", "createdAt"]
        : ["name", "collectionSlug", "format", "createdAt"],
      description: kind === "import"
        ? "هر ردیف، سابقه یک عملیات ورود داده و نتیجه یا خطاهای آن است. فایل JSON را برای ایجاد یا به‌روزرسانی گروهی بارگذاری کنید؛ تصاویر باید پیش‌تر در رسانه‌ها باشند. سوابق پس از ۷ روز خودکار حذف می‌شوند."
        : "هر ردیف، سابقه یک عملیات خروجی و فایل قابل دانلود آن است. می‌توانید از رکوردهای انتخاب‌شده، فیلتر فعلی یا همه رکوردهای همان بخش JSON بگیرید؛ سوابق پس از ۷ روز خودکار حذف می‌شوند.",
    },
    endpoints: Array.isArray(collection.endpoints) ? collection.endpoints.map(protectEndpoint) : collection.endpoints,
    fields: collection.fields.map((field) => customizeTransferField(field, kind)),
    hooks: kind === "import"
      ? {
          ...collection.hooks,
          beforeValidate: [
            ...(collection.hooks?.beforeValidate ?? []),
            ({ data }) => {
              if (!data || data.importMode === "create") return data;
              const slug = data.collectionSlug as typeof TRANSFER_COLLECTIONS[number] | undefined;
              const recommended = slug ? STABLE_MATCH_FIELDS[slug] : undefined;
              return recommended && (!data.matchField || data.matchField === "id")
                ? { ...data, matchField: recommended }
                : data;
            },
          ],
        }
      : collection.hooks,
    labels: kind === "import"
      ? { singular: "ورود داده", plural: "سوابق ورود داده" }
      : { singular: "خروجی داده", plural: "سوابق خروجی داده" },
    upload,
  };
};

const omitSystemFields = (row: DataRecord) => {
  const clean = { ...row };
  for (const key of ["id", "createdAt", "updatedAt", "deletedAt"]) delete clean[key];
  return clean;
};

const stableValue = (value: unknown, key: string): unknown => {
  if (isRecord(value) && typeof value[key] === "string") return value[key];
  return value;
};

const stableMany = (value: unknown, key: string): unknown =>
  Array.isArray(value) ? value.map((item) => stableValue(item, key)) : value;

const replaceStable = (
  row: DataRecord,
  original: DataRecord,
  field: string,
  stableKey: string,
  hasMany = false,
) => {
  if (!(field in row)) return;
  row[field] = hasMany
    ? stableMany(original[field], stableKey)
    : stableValue(original[field], stableKey);
};

const replaceGalleryMedia = (row: DataRecord, original: DataRecord) => {
  if (!Array.isArray(row.gallery) || !Array.isArray(original.gallery)) return;
  row.gallery = row.gallery.map((item, index) => {
    if (!isRecord(item)) return item;
    const originalItem = (original.gallery as unknown[])[index];
    return isRecord(originalItem)
      ? { ...item, image: stableValue(originalItem.image, "filename") }
      : item;
  });
};

const relationshipID = (value: unknown): number | string | undefined => {
  if (typeof value === "number" || typeof value === "string") return value;
  if (isRecord(value) && (typeof value.id === "number" || typeof value.id === "string")) return value.id;
  return undefined;
};

const findDocs = async (
  req: PayloadRequest,
  collection: CollectionSlug,
  where: DataRecord,
  depth = 0,
): Promise<DataRecord[]> => {
  const result = await req.payload.find({
    collection,
    depth,
    limit: 1000,
    overrideAccess: true,
    pagination: false,
    req,
    where,
  } as never) as unknown as { docs: DataRecord[] };
  return result.docs;
};

const makeExportHook = (slug: typeof TRANSFER_COLLECTIONS[number]) => async ({
  data,
  originalData: sourceData,
  req,
}: {
  data: DataRecord[];
  originalData: unknown[];
  req: PayloadRequest;
}) => {
  let variantOptionKeys = new Map<string, string>();
  if (slug === "variants") {
    const originalData = sourceData.map((value) => isRecord(value) ? value : {});
    const ids = originalData
      .flatMap((doc) => Array.isArray(doc.options) ? doc.options : [])
      .map(relationshipID)
      .filter((id): id is number | string => id !== undefined);
    if (ids.length > 0) {
      const options = await findDocs(req, "variantOptions", { id: { in: ids } }, 1);
      variantOptionKeys = new Map(options.flatMap((option) => {
        const typeName = isRecord(option.variantType) ? option.variantType.name : undefined;
        return typeof typeName === "string" && typeof option.value === "string"
          ? [[String(option.id), `${typeName}:${option.value}`]]
          : [];
      }));
    }
  }

  const originalData = sourceData.map((value) => isRecord(value) ? value : {});
  return data.map((item, index) => {
    const row = omitSystemFields(item);
    if ((slug === "configuration-options" || slug === "variantOptions") && item.id !== undefined) {
      row.id = item.id;
    }
    const original = originalData[index] ?? {};

    if (slug === "brands") {
      replaceStable(row, original, "logo", "filename");
      replaceStable(row, original, "heroMedia", "filename");
    } else if (slug === "categories") {
      replaceStable(row, original, "parent", "slug");
      replaceStable(row, original, "image", "filename");
    } else if (slug === "product-series") {
      replaceStable(row, original, "heroMedia", "filename");
    } else if (slug === "configuration-groups") {
      delete row.options;
    } else if (slug === "configuration-options") {
      replaceStable(row, original, "group", "key");
      replaceStable(row, original, "swatchMedia", "filename");
    } else if (slug === "variantOptions") {
      replaceStable(row, original, "variantType", "name");
    } else if (slug === "products") {
      replaceStable(row, original, "brand", "slug");
      replaceStable(row, original, "categories", "slug", true);
      replaceStable(row, original, "series", "slug");
      replaceStable(row, original, "mainImage", "filename");
      replaceStable(row, original, "configurationGroups", "key", true);
      replaceStable(row, original, "relatedProducts", "slug", true);
      replaceStable(row, original, "matchingProducts", "slug", true);
      replaceStable(row, original, "variantTypes", "name", true);
      replaceGalleryMedia(row, original);
      delete row.variants;
    } else if (slug === "variants") {
      replaceStable(row, original, "product", "slug");
      if ("options" in row && Array.isArray(original.options)) {
        row.options = original.options.map((option) => {
          const id = relationshipID(option);
          return id === undefined ? option : variantOptionKeys.get(String(id)) ?? option;
        });
      }
    } else if (slug === "blog-categories") {
      delete row.posts;
    } else if (slug === "posts") {
      replaceStable(row, original, "category", "slug");
      replaceStable(row, original, "heroImage", "filename");
      replaceStable(row, original, "relatedPosts", "slug", true);
      if (isRecord(row.seo) && isRecord(original.seo) && "socialImage" in row.seo) {
        row.seo = { ...row.seo, socialImage: stableValue(original.seo.socialImage, "filename") };
      }
    } else if (slug === "projects") {
      replaceStable(row, original, "heroMedia", "filename");
      replaceStable(row, original, "products", "slug", true);
      replaceStable(row, original, "article", "slug");
      replaceGalleryMedia(row, original);
    }

    return row;
  });
};

const resolveStable = async (
  req: PayloadRequest,
  collection: CollectionSlug,
  field: string,
  value: unknown,
  cache: Map<string, unknown>,
) => {
  if (value === null || value === undefined || typeof value === "number") return value;
  if (isRecord(value) && value.id !== undefined) return value.id;
  if (typeof value !== "string" || /^\d+$/.test(value)) return value;

  const cacheKey = `${collection}:${field}:${value}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey);
  const docs = await findDocs(req, collection, { [field]: { equals: value } });
  const resolved = docs.length === 1 ? docs[0]?.id : value;
  cache.set(cacheKey, resolved);
  return resolved;
};

const resolveMany = async (
  req: PayloadRequest,
  collection: CollectionSlug,
  field: string,
  value: unknown,
  cache: Map<string, unknown>,
) => Array.isArray(value)
  ? Promise.all(value.map((item) => resolveStable(req, collection, field, item, cache)))
  : value;

const resolveVariantOption = async (req: PayloadRequest, value: unknown, cache: Map<string, unknown>) => {
  if (typeof value !== "string" || !value.includes(":")) {
    return resolveStable(req, "variantOptions", "id", value, cache);
  }
  const separator = value.indexOf(":");
  const typeName = value.slice(0, separator);
  const optionValue = value.slice(separator + 1);
  const cacheKey = `variantOption:${value}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey);
  const typeID = await resolveStable(req, "variantTypes", "name", typeName, cache);
  const docs = await findDocs(req, "variantOptions", {
    and: [
      { variantType: { equals: typeID } },
      { value: { equals: optionValue } },
    ],
  });
  const resolved = docs.length === 1 ? docs[0]?.id : value;
  cache.set(cacheKey, resolved);
  return resolved;
};

const makeImportHook = (slug: typeof TRANSFER_COLLECTIONS[number]) => async ({
  data: sourceData,
  req,
}: {
  data: unknown[];
  req: PayloadRequest;
}) => {
  const cache = new Map<string, unknown>();

  const data = sourceData.map((value) => isRecord(value) ? value : {});
  return Promise.all(data.map(async (item) => {
    const row = omitSystemFields(item);
    if ((slug === "configuration-options" || slug === "variantOptions") && item.id !== undefined) {
      row.id = item.id;
    }

    if (slug === "brands") {
      row.logo = await resolveStable(req, "media", "filename", row.logo, cache);
      row.heroMedia = await resolveStable(req, "media", "filename", row.heroMedia, cache);
    } else if (slug === "categories") {
      row.parent = await resolveStable(req, "categories", "slug", row.parent, cache);
      row.image = await resolveStable(req, "media", "filename", row.image, cache);
    } else if (slug === "product-series") {
      row.heroMedia = await resolveStable(req, "media", "filename", row.heroMedia, cache);
    } else if (slug === "configuration-groups") {
      delete row.options;
    } else if (slug === "configuration-options") {
      row.group = await resolveStable(req, "configuration-groups", "key", row.group, cache);
      row.swatchMedia = await resolveStable(req, "media", "filename", row.swatchMedia, cache);
    } else if (slug === "variantOptions") {
      row.variantType = await resolveStable(req, "variantTypes", "name", row.variantType, cache);
    } else if (slug === "products") {
      row.brand = await resolveStable(req, "brands", "slug", row.brand, cache);
      row.categories = await resolveMany(req, "categories", "slug", row.categories, cache);
      row.series = await resolveStable(req, "product-series", "slug", row.series, cache);
      row.mainImage = await resolveStable(req, "media", "filename", row.mainImage, cache);
      row.configurationGroups = await resolveMany(req, "configuration-groups", "key", row.configurationGroups, cache);
      row.relatedProducts = await resolveMany(req, "products", "slug", row.relatedProducts, cache);
      row.matchingProducts = await resolveMany(req, "products", "slug", row.matchingProducts, cache);
      row.variantTypes = await resolveMany(req, "variantTypes", "name", row.variantTypes, cache);
      if (Array.isArray(row.gallery)) {
        row.gallery = await Promise.all(row.gallery.map(async (item) => isRecord(item)
          ? { ...item, image: await resolveStable(req, "media", "filename", item.image, cache) }
          : item));
      }
      delete row.variants;
    } else if (slug === "variants") {
      row.product = await resolveStable(req, "products", "slug", row.product, cache);
      if (Array.isArray(row.options)) {
        row.options = await Promise.all(row.options.map((option) => resolveVariantOption(req, option, cache)));
      }
    } else if (slug === "blog-categories") {
      delete row.posts;
    } else if (slug === "posts") {
      row.category = await resolveStable(req, "blog-categories", "slug", row.category, cache);
      row.heroImage = await resolveStable(req, "media", "filename", row.heroImage, cache);
      row.relatedPosts = await resolveMany(req, "posts", "slug", row.relatedPosts, cache);
      if (isRecord(row.seo)) {
        row.seo = {
          ...row.seo,
          socialImage: await resolveStable(req, "media", "filename", row.seo.socialImage, cache),
        };
      }
    } else if (slug === "projects") {
      row.heroMedia = await resolveStable(req, "media", "filename", row.heroMedia, cache);
      row.products = await resolveMany(req, "products", "slug", row.products, cache);
      row.article = await resolveStable(req, "posts", "slug", row.article, cache);
      if (Array.isArray(row.gallery)) {
        row.gallery = await Promise.all(row.gallery.map(async (item) => isRecord(item)
          ? { ...item, image: await resolveStable(req, "media", "filename", item.image, cache) }
          : item));
      }
    }

    return row;
  }));
};

const officialDataTransferPlugin = importExportPlugin({
  batchSize: 50,
  collections: TRANSFER_COLLECTIONS.map((slug) => ({
    slug,
    export: { format: "json" as const, hooks: { before: makeExportHook(slug) } },
    import: { defaultVersionStatus: "published" as const, hooks: { before: makeImportHook(slug) } },
  })),
  defaultVersionStatus: "published",
  exportLimit: 5000,
  importLimit: 5000,
  overrideExportCollection: ({ collection }) => secureTransferCollection(collection, "export"),
  overrideImportCollection: ({ collection }) => secureTransferCollection(collection, "import"),
});

export const dataTransferPlugin = async (config: Config) => {
  const configured = await officialDataTransferPlugin(config);
  for (const collection of configured.collections ?? []) {
    const items = collection.admin?.components?.listMenuItems;
    if (!Array.isArray(items)) continue;
    collection.admin!.components!.listMenuItems = items.map((item) => {
      if (!isRecord(item) || typeof item.path !== "string") return item;
      if (item.path.includes("#ImportListMenuItem")) {
        return { ...item, path: "./src/components/payload/data-transfer-menu#AdminOnlyImportListMenuItem" };
      }
      if (item.path.includes("#ExportListMenuItem")) {
        return { ...item, path: "./src/components/payload/data-transfer-menu#AdminOnlyExportListMenuItem" };
      }
      return item;
    });
  }
  return configured;
};

type CleanupTransferTask = {
  input: Record<string, never>;
  output: { deletedExports: number; deletedImports: number };
};

const deleteExpiredTransfers = async (req: PayloadRequest, collection: "exports" | "imports") => {
  const cutoff = new Date(Date.now() - TRANSFER_RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const result = await req.payload.delete({
    collection: collection as CollectionSlug,
    overrideAccess: true,
    req,
    where: { createdAt: { less_than: cutoff } },
  } as never) as unknown as { docs?: unknown[] };
  return result.docs?.length ?? 0;
};

export const cleanupDataTransferFilesTask: TaskConfig<CleanupTransferTask> = {
  slug: "cleanupDataTransferFiles",
  inputSchema: [],
  outputSchema: [
    { name: "deletedImports", type: "number", required: true },
    { name: "deletedExports", type: "number", required: true },
  ],
  schedule: [{ cron: "15 3 * * *", queue: "default" }],
  handler: async ({ req }) => ({
    output: {
      deletedExports: await deleteExpiredTransfers(req, "exports"),
      deletedImports: await deleteExpiredTransfers(req, "imports"),
    },
  }),
};
