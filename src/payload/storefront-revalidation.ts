import { revalidatePath, revalidateTag } from "next/cache";
import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  CollectionConfig,
  PayloadRequest,
} from "payload";

type DataRecord = Record<string, unknown>;
export type StorefrontCacheArea = "catalog" | "journal" | "showcase" | "sales-contacts";
export type StorefrontVisibility = "always" | "status" | "published" | "active";

type RevalidationPath = { path: string; type?: "layout" | "page" };
type RevalidationTarget = { paths: readonly RevalidationPath[]; tags: readonly string[] };

const targets: Record<StorefrontCacheArea, RevalidationTarget> = {
  catalog: {
    tags: ["payload-catalog"],
    paths: [
      { path: "/(frontend)", type: "layout" },
      { path: "/sitemap.xml" },
    ],
  },
  journal: {
    tags: ["payload-journal"],
    paths: [
      { path: "/" },
      { path: "/blog" },
      { path: "/blog/[slug]", type: "page" },
      { path: "/projects/[slug]", type: "page" },
      { path: "/sitemap.xml" },
    ],
  },
  showcase: {
    tags: ["payload-showcase"],
    paths: [
      { path: "/brands" },
      { path: "/brands/[slug]", type: "page" },
      { path: "/projects" },
      { path: "/projects/[slug]", type: "page" },
      { path: "/sitemap.xml" },
    ],
  },
  "sales-contacts": {
    tags: ["payload-sales-contacts"],
    paths: [{ path: "/shop/[category]/[product]", type: "page" }],
  },
};

const isRecord = (value: unknown): value is DataRecord =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

export const isPublicStorefrontRecord = (value: unknown, visibility: StorefrontVisibility) => {
  if (visibility === "always") return true;
  if (!isRecord(value)) return false;
  if (visibility === "status") return value._status === "published";
  return value[visibility] === true;
};

export const shouldRevalidateStorefrontChange = (
  doc: unknown,
  previousDoc: unknown,
  visibility: StorefrontVisibility,
) => isPublicStorefrontRecord(doc, visibility) || isPublicStorefrontRecord(previousDoc, visibility);

export const storefrontRevalidationPlan = (areas: readonly StorefrontCacheArea[]) => {
  const tags = new Set<string>();
  const paths = new Map<string, RevalidationPath>();

  for (const area of areas) {
    for (const tag of targets[area].tags) tags.add(tag);
    for (const target of targets[area].paths) {
      paths.set(`${target.path}:${target.type ?? "path"}`, target);
    }
  }

  return { tags: [...tags], paths: [...paths.values()] };
};

const revalidateStorefront = (
  req: PayloadRequest,
  areas: readonly StorefrontCacheArea[],
) => {
  if (req.context?.disableStorefrontRevalidation === true) return;

  const plan = storefrontRevalidationPlan(areas);
  try {
    for (const tag of plan.tags) revalidateTag(tag, { expire: 0 });
    for (const target of plan.paths) revalidatePath(target.path, target.type);
  } catch (error) {
    // Payload Local API and CLI tasks do not always run inside a Next request.
    // Never fail a successful CMS write solely because that optional context is absent.
    req.payload.logger.warn({ err: error, areas }, "Storefront cache revalidation was skipped outside a Next.js request context.");
  }
};

export const withStorefrontRevalidation = (
  hooks: CollectionConfig["hooks"] | undefined,
  areas: readonly StorefrontCacheArea[],
  visibility: StorefrontVisibility,
): NonNullable<CollectionConfig["hooks"]> => {
  const afterChange: CollectionAfterChangeHook = ({ doc, previousDoc, req }) => {
    if (shouldRevalidateStorefrontChange(doc, previousDoc, visibility)) {
      revalidateStorefront(req, areas);
    }
    return doc;
  };

  const afterDelete: CollectionAfterDeleteHook = ({ doc, req }) => {
    if (isPublicStorefrontRecord(doc, visibility)) revalidateStorefront(req, areas);
    return doc;
  };

  return {
    ...hooks,
    afterChange: [...(hooks?.afterChange ?? []), afterChange],
    afterDelete: [...(hooks?.afterDelete ?? []), afterDelete],
  };
};
