import type { CollectionConfig, Plugin } from "payload";

export const ADMIN_NAVIGATION_GROUPS = [
  "فروشگاه",
  "محتوا",
  "مجله",
  "مدیریت",
] as const;

export const STORE_NAVIGATION_COLLECTIONS = [
  "products",
  "orders",
  "transactions",
  "customers",
  "categories",
  "brands",
  "variantTypes",
] as const;

const groupRank = new Map<string, number>(
  ADMIN_NAVIGATION_GROUPS.map((group, index) => [group, index]),
);

const storeCollectionRank = new Map<string, number>(
  STORE_NAVIGATION_COLLECTIONS.map((slug, index) => [slug, index]),
);

const collectionGroup = (collection: CollectionConfig): string | undefined => {
  const group = collection.admin?.group;
  return typeof group === "string" ? group : undefined;
};

export const orderAdminNavigationCollections = (
  collections: CollectionConfig[],
): CollectionConfig[] => collections
  .map((collection, index) => ({ collection, index }))
  .sort((left, right) => {
    const leftRank = groupRank.get(collectionGroup(left.collection) ?? "") ?? Number.MAX_SAFE_INTEGER;
    const rightRank = groupRank.get(collectionGroup(right.collection) ?? "") ?? Number.MAX_SAFE_INTEGER;
    if (leftRank !== rightRank) return leftRank - rightRank;

    if (collectionGroup(left.collection) === "فروشگاه") {
      const leftCollectionRank = storeCollectionRank.get(left.collection.slug) ?? Number.MAX_SAFE_INTEGER;
      const rightCollectionRank = storeCollectionRank.get(right.collection.slug) ?? Number.MAX_SAFE_INTEGER;
      if (leftCollectionRank !== rightCollectionRank) return leftCollectionRank - rightCollectionRank;
    }

    return left.index - right.index;
  })
  .map(({ collection }) => collection);

export const adminNavigationOrderPlugin: Plugin = (config) => ({
  ...config,
  collections: orderAdminNavigationCollections(config.collections ?? []),
});

adminNavigationOrderPlugin.order = 100;
adminNavigationOrderPlugin.slug = "nilper-admin-navigation-order";
