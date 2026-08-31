// Client-safe identities shared with product navigation. These are demo catalog names.
export const brandRegistry = [
  { slug: "noma", name: "NOMA" },
  { slug: "lumia", name: "LUMIA" },
  { slug: "forma", name: "FORMA" },
  { slug: "casa-n", name: "CASA N" },
  { slug: "atelier", name: "ATELIER" },
  { slug: "meridien", name: "MÉRIDIEN" },
] as const;

export function brandPath(name: string) {
  const brand = brandRegistry.find((item) => item.name === name);
  return brand ? `/brands/${brand.slug}` : `/shop?brand=${encodeURIComponent(name)}`;
}
