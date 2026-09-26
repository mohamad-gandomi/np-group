import type { ArrayField, FieldHook } from "payload";
import { randomUUID } from "node:crypto";

const normalizeRows: FieldHook = ({ value }) => Array.isArray(value)
  ? value.map((row, index) => ({ ...row, key: row.key || row.id || randomUUID(), sortOrder: index }))
  : value;

export const technicalSpecGroupOptions = [
  { label: "هویت و کاربرد", value: "identity" },
  { label: "ساخت", value: "construction" },
  { label: "متریال و روکش", value: "materials" },
  { label: "راحتی", value: "comfort" },
  { label: "پرداخت و رنگ", value: "finish" },
  { label: "بسته‌بندی و تحویل", value: "delivery" },
  { label: "نگهداری و متعلقات", value: "care" },
  { label: "سایر", value: "other" },
] as const;

export const measurementUnitOptions = [
  { label: "سانتی‌متر", value: "cm" },
  { label: "کیلوگرم", value: "kg" },
  { label: "متر", value: "m" },
  { label: "عدد", value: "unit" },
] as const;

export function measurementsField(description: string): ArrayField {
  return {
    name: "measurements",
    hooks: { beforeValidate: [normalizeRows] },
    type: "array",
    label: "اندازه‌ها و مقادیر فیزیکی",
    labels: { singular: "اندازه", plural: "اندازه‌ها" },
    admin: { description },
    fields: [
      { name: "key", type: "text", required: true, admin: { hidden: true } },
      { name: "labelFa", type: "text", label: "عنوان فارسی", required: true, admin: { rtl: true } },
      { name: "value", type: "number", label: "مقدار", required: true, min: 0 },
      { name: "unit", type: "select", label: "واحد", required: true, options: [...measurementUnitOptions] },
      { name: "sortOrder", type: "number", defaultValue: 0, admin: { hidden: true } },
    ],
  };
}

export function technicalSpecsField(): ArrayField {
  return {
    name: "technicalSpecs",
    hooks: { beforeValidate: [normalizeRows] },
    type: "array",
    label: "مشخصات فنی مشترک",
    labels: { singular: "مشخصه", plural: "مشخصات" },
    admin: { description: "مشخصاتی که برای همه مدل‌های این محصول یکسان‌اند." },
    fields: [
      { name: "key", type: "text", required: true, admin: { hidden: true } },
      { name: "labelFa", type: "text", label: "عنوان فارسی", required: true, admin: { rtl: true } },
      { name: "valueFa", type: "textarea", label: "مقدار فارسی", required: true, index: true },
      { name: "group", type: "select", label: "گروه", required: true, options: [...technicalSpecGroupOptions] },
      { name: "sortOrder", type: "number", defaultValue: 0, admin: { hidden: true } },
    ],
  };
}
