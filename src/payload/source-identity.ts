export type NilperSourceEntity = "product" | "variant";

type SourceIdentityInput = {
  workbookKey: string;
  sheet: string;
  entity: NilperSourceEntity;
  rawIdentity: string;
};

function normalizeSourceKeyPart(value: string): string {
  const normalized = value
    .normalize("NFKC")
    .trim()
    .toLocaleLowerCase("en-US")
    .replace(/\s+/g, "-");

  if (!normalized) throw new Error("Source identity parts cannot be empty.");
  return encodeURIComponent(normalized);
}

/**
 * Stable importer identity. It deliberately excludes row numbers, display titles,
 * and the local filename so worksheet formatting or file renames do not duplicate records.
 */
export function buildNilperSourceKey({ workbookKey, sheet, entity, rawIdentity }: SourceIdentityInput): string {
  return ["nilper", "xlsx", workbookKey, sheet, entity, rawIdentity]
    .map(normalizeSourceKeyPart)
    .join(":");
}

export function isNilperSourceKey(value: unknown): value is string {
  return typeof value === "string" && /^nilper:xlsx:[^:]+:[^:]+:(product|variant):[^:]+$/.test(value);
}
