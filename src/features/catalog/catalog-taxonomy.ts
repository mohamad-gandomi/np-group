type StorefrontTaxonomyEntry = {
  slug: string;
  title: string;
  rooms: readonly string[];
};

const payloadTaxonomy: Record<string, Omit<StorefrontTaxonomyEntry, "title">> = {
  "home-furniture": { slug: "furniture", rooms: ["پذیرایی", "نشیمن"] },
  "bedroom-furniture": { slug: "bedroom", rooms: ["اتاق خواب"] },
  "dining-seating": { slug: "dining", rooms: ["غذاخوری"] },
  dining: { slug: "dining", rooms: ["غذاخوری"] },
  "coffee-side-tables": { slug: "tables", rooms: ["پذیرایی", "نشیمن"] },
};

export function storefrontTaxonomyForPayloadCategory(payloadSlug: string, fallbackTitle: string): StorefrontTaxonomyEntry {
  const mapped = payloadTaxonomy[payloadSlug];
  return mapped
    ? { ...mapped, title: fallbackTitle }
    : { slug: payloadSlug, title: fallbackTitle, rooms: [] };
}

export function payloadCategorySlugsForStorefront(storefrontSlug: string): string[] {
  const matches = Object.entries(payloadTaxonomy)
    .filter(([, entry]) => entry.slug === storefrontSlug)
    .map(([payloadSlug]) => payloadSlug);
  return matches.length ? matches : [storefrontSlug];
}

export function payloadCategorySlugsForRooms(rooms: readonly string[]): string[] {
  return Object.entries(payloadTaxonomy)
    .filter(([, entry]) => rooms.some((room) => entry.rooms.includes(room)))
    .map(([payloadSlug]) => payloadSlug);
}
