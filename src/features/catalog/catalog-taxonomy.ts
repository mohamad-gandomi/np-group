type StorefrontTaxonomyEntry = {
  slug: string;
  title: string;
  rooms: readonly string[];
};

const payloadTaxonomy: Record<string, StorefrontTaxonomyEntry> = {
  "home-furniture": { slug: "furniture", title: "مبلمان خانگی", rooms: ["پذیرایی", "نشیمن"] },
  "bedroom-furniture": { slug: "bedroom", title: "سرویس خواب", rooms: ["اتاق خواب"] },
  "dining-seating": { slug: "dining", title: "صندلی ناهارخوری و بار", rooms: ["غذاخوری"] },
  dining: { slug: "dining", title: "ناهارخوری", rooms: ["غذاخوری"] },
  "coffee-side-tables": { slug: "tables", title: "میز جلو مبلی و عسلی", rooms: ["پذیرایی", "نشیمن"] },
};

export function storefrontTaxonomyForPayloadCategory(payloadSlug: string, fallbackTitle: string): StorefrontTaxonomyEntry {
  return payloadTaxonomy[payloadSlug] ?? { slug: payloadSlug, title: fallbackTitle, rooms: [] };
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
