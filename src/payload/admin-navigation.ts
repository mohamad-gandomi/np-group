import type { CollectionConfig, Plugin } from "payload";

export const ADMIN_NAVIGATION_GROUPS = [
  "فروشگاه",
  "کاتالوگ",
  "محتوا",
  "مجله",
  "مدیریت",
  "ابزار داده",
] as const;

const groupRank = new Map<string, number>(
  ADMIN_NAVIGATION_GROUPS.map((group, index) => [group, index]),
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
    return leftRank - rightRank || left.index - right.index;
  })
  .map(({ collection }) => collection);

export const adminNavigationOrderPlugin: Plugin = (config) => ({
  ...config,
  collections: orderAdminNavigationCollections(config.collections ?? []),
});

adminNavigationOrderPlugin.order = 100;
adminNavigationOrderPlugin.slug = "nilper-admin-navigation-order";
