import type { ArrayField, Field } from "payload";

import { isNilperSourceKey } from "./source-identity";

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
    type: "array",
    label: "اندازه‌ها و مقادیر فیزیکی",
    labels: { singular: "اندازه", plural: "اندازه‌ها" },
    admin: { description },
    fields: [
      { name: "key", type: "text", label: "کلید پایدار", required: true },
      { name: "labelFa", type: "text", label: "عنوان فارسی", required: true, admin: { rtl: true } },
      { name: "value", type: "number", label: "مقدار", required: true, min: 0 },
      { name: "unit", type: "select", label: "واحد", required: true, options: [...measurementUnitOptions] },
      { name: "sortOrder", type: "number", label: "ترتیب", defaultValue: 0 },
    ],
  };
}

export function technicalSpecsField(): ArrayField {
  return {
    name: "technicalSpecs",
    type: "array",
    label: "مشخصات فنی مشترک",
    labels: { singular: "مشخصه", plural: "مشخصات" },
    admin: { description: "مشخصاتی که برای همه گونه‌های این محصول یکسان‌اند." },
    fields: [
      { name: "key", type: "text", label: "کلید پایدار", required: true },
      { name: "labelFa", type: "text", label: "عنوان فارسی", required: true, admin: { rtl: true } },
      { name: "valueFa", type: "textarea", label: "مقدار فارسی", required: true },
      { name: "group", type: "select", label: "گروه", required: true, options: [...technicalSpecGroupOptions] },
      { name: "sortOrder", type: "number", label: "ترتیب", defaultValue: 0 },
    ],
  };
}

export function sourceFields(): Field[] {
  return [
    {
      name: "sourceKey",
      type: "text",
      label: "شناسه پایدار منبع",
      required: true,
      unique: true,
      index: true,
      admin: {
        description: "برای واردات تکرارپذیر؛ از شماره ردیف، عنوان فارسی یا نام محلی فایل ساخته نمی‌شود.",
      },
      validate: (value: unknown) => isNilperSourceKey(value) || "شناسه منبع باید با قالب پایدار nilper:xlsx:… ساخته شود.",
    },
    {
      name: "sourceMetadata",
      type: "group",
      label: "ردیابی منبع",
      fields: [
        { name: "workbookKey", type: "text", label: "کلید دفترکار", required: true },
        { name: "file", type: "text", label: "نام فایل مشاهده‌شده", required: true },
        { name: "sheet", type: "text", label: "برگه منبع", required: true },
        { name: "identityRaw", type: "text", label: "هویت خام رکورد", required: true },
        { name: "catalogCodeRaw", type: "text", label: "کد خام کاتالوگ" },
        { name: "dataQualityNotes", type: "textarea", label: "یادداشت کیفیت داده" },
      ],
    },
  ];
}
