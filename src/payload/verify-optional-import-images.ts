import assert from "node:assert/strict";
import type { Field } from "payload";

import config from "../../payload.config";
import { normalizeMediaImportValue } from "./data-transfer";

const transferCollections = new Set([
  "brands",
  "categories",
  "variantOptions",
  "products",
  "posts",
  "projects",
]);

const visitFields = (fields: Field[], collection: string, path: string[] = []) => {
  for (const field of fields) {
    const name = "name" in field && typeof field.name === "string" ? field.name : field.type;
    const fieldPath = [...path, name];

    if (field.type === "upload") {
      assert.notEqual(
        field.required,
        true,
        `${collection}.${fieldPath.join(".")} must allow an empty imported image`,
      );
    }

    if (
      field.type === "group" ||
      field.type === "row" ||
      field.type === "collapsible" ||
      field.type === "array"
    ) {
      visitFields(field.fields, collection, fieldPath);
    } else if (field.type === "tabs") {
      for (const tab of field.tabs) {
        visitFields(tab.fields, collection, [...fieldPath, "label" in tab ? String(tab.label) : "tab"]);
      }
    }
  }
};

const resolvedConfig = await config;

for (const collection of resolvedConfig.collections ?? []) {
  if (transferCollections.has(collection.slug)) {
    visitFields(collection.fields, collection.slug);
  }
}

assert.equal(normalizeMediaImportValue(""), null);
assert.equal(normalizeMediaImportValue("   "), null);
assert.equal(normalizeMediaImportValue(null), null);
assert.equal(normalizeMediaImportValue(undefined), undefined);
assert.equal(normalizeMediaImportValue("existing-image.webp"), "existing-image.webp");
assert.equal(normalizeMediaImportValue(42), 42);

console.info("Optional import image verification passed.");
