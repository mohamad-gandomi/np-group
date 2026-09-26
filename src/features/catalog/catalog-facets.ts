import type { CatalogAttributeFacet, Product } from "./catalog-types";

export function buildCatalogAttributeFacets(
  products: readonly Product[],
  category?: string,
): CatalogAttributeFacet[] {
  const facets = new Map<string, {
    definition: Omit<CatalogAttributeFacet, "options">;
    options: Map<string, { label: string; value: string; count: number; swatchColor?: string }>;
  }>();

  for (const product of products) {
    for (const productFacet of product.catalogFacets ?? []) {
      if (productFacet.scope === "categories" && (!category || !productFacet.categorySlugs.includes(category))) continue;
      const facet = facets.get(productFacet.key) ?? {
        definition: {
          key: productFacet.key,
          label: productFacet.label,
          presentation: productFacet.presentation,
          placement: productFacet.placement,
          sortOrder: productFacet.sortOrder,
          scope: productFacet.scope,
          categorySlugs: productFacet.categorySlugs,
        },
        options: new Map(),
      };
      facets.set(productFacet.key, facet);
      for (const option of productFacet.options) {
        const current = facet.options.get(option.value);
        facet.options.set(option.value, {
          label: option.label,
          value: option.value,
          count: (current?.count ?? 0) + 1,
          ...(option.swatchColor ? { swatchColor: option.swatchColor } : {}),
        });
      }
    }
  }

  return [...facets.values()]
    .map(({ definition, options }) => ({
      ...definition,
      options: [...options.values()].sort((left, right) => left.label.localeCompare(right.label, "fa")),
    }))
    .sort((left, right) => left.sortOrder - right.sortOrder || left.label.localeCompare(right.label, "fa"));
}
