import fs from "node:fs/promises";
import path from "node:path";
import { getPayload } from "payload";

import config from "../../payload.config";
import type { Product } from "../payload-types";

const richText = (text: string): Product["descriptionFa"] => ({
  root: {
    type: "root",
    direction: "rtl",
    format: "",
    indent: 0,
    version: 1,
    children: text.split("\n").filter(Boolean).map((paragraph) => ({
      type: "paragraph",
      direction: "rtl",
      format: "",
      indent: 0,
      version: 1,
      children: [{ type: "text", text: paragraph, detail: 0, format: 0, mode: "normal", style: "", version: 1 }],
    })),
  },
});

const payload = await getPayload({ config });
type Identified = { id: number };

async function ensureMedia(filename: string, source: string, alt: string): Promise<Identified> {
  const existing = await payload.find({ collection: "media", where: { filename: { equals: filename } }, limit: 1 });
  if (existing.docs[0]) return existing.docs[0] as Identified;
  const data = await fs.readFile(path.resolve(process.cwd(), source));
  return await payload.create({
    collection: "media",
    data: { alt, captionFa: "تصویر نمایشی موقت؛ از فایل اکسل استخراج نشده است." },
    file: { data, mimetype: "image/jpeg", name: filename, size: data.length },
  }) as Identified;
}

async function ensureBySlug(collection: "brands" | "categories" | "product-series" | "products", slug: string, data: Record<string, unknown>): Promise<Identified> {
  const existing = await payload.find({ collection, where: { slug: { equals: slug } }, limit: 1 });
  if (existing.docs[0]) return await payload.update({ collection, id: existing.docs[0].id, data } as never) as unknown as Identified;
  return await payload.create({ collection, data } as never) as unknown as Identified;
}

async function ensureByKey(key: string, data: Record<string, unknown>): Promise<Identified> {
  const existing = await payload.find({ collection: "configuration-groups", where: { key: { equals: key } }, limit: 1 });
  if (existing.docs[0]) return await payload.update({ collection: "configuration-groups", id: existing.docs[0].id, data } as never) as unknown as Identified;
  return await payload.create({ collection: "configuration-groups", data } as never) as unknown as Identified;
}

async function ensureConfigurationOption(group: number, title: string, data: Record<string, unknown>): Promise<Identified> {
  const existing = await payload.find({
    collection: "configuration-options",
    where: { and: [{ group: { equals: group } }, { title: { equals: title } }] },
    limit: 1,
  });
  const optionData = { group, title, active: true, ...data };
  if (existing.docs[0]) return await payload.update({ collection: "configuration-options", id: existing.docs[0].id, data: optionData } as never) as unknown as Identified;
  return await payload.create({ collection: "configuration-options", data: optionData } as never) as unknown as Identified;
}

async function ensureVariantType(): Promise<Identified> {
  const existing = await payload.find({ collection: "variantTypes", where: { name: { equals: "seating-form" } }, limit: 1 });
  if (existing.docs[0]) return existing.docs[0] as Identified;
  return await payload.create({ collection: "variantTypes", data: { label: "فرم نشیمن", name: "seating-form" } }) as Identified;
}

async function ensureVariantOption(variantType: number, value: string, label: string): Promise<Identified> {
  const existing = await payload.find({
    collection: "variantOptions",
    where: { and: [{ variantType: { equals: variantType } }, { value: { equals: value } }] },
    limit: 1,
  });
  if (existing.docs[0]) return existing.docs[0] as Identified;
  return await payload.create({ collection: "variantOptions", data: { variantType, value, label } }) as Identified;
}

async function ensureVariant(nilperCode: string, data: Record<string, unknown>) {
  const existing = await payload.find({ collection: "variants", where: { nilperCode: { equals: nilperCode } }, limit: 1 });
  const variantData = { nilperCode, sourceCodeRaw: nilperCode, _status: "published" as const, ...data };
  if (existing.docs[0]) return payload.update({ collection: "variants", id: existing.docs[0].id, data: variantData } as never);
  return payload.create({ collection: "variants", data: variantData } as never);
}

const [sofaImage, livingImage, tableImage] = await Promise.all([
  ensureMedia("delan-sofa-preview.jpg", "public/placeholders/sofa.jpg", "تصویر نمایشی مبل دلان"),
  ensureMedia("delan-living-preview.jpg", "public/placeholders/living.jpg", "تصویر نمایشی فضای پذیرایی دلان"),
  ensureMedia("delan-table-preview.jpg", "public/placeholders/dining.jpg", "تصویر نمایشی میز هماهنگ دلان"),
]);

const brand = await ensureBySlug("brands", "nilper", {
  title: "نیلپر",
  slug: "nilper",
  descriptionFa: "برند نمونه برای ارزیابی داشبورد مدیریت محصولات نیلپر.",
  published: true,
  logo: sofaImage.id,
});

const furniture = await ensureBySlug("categories", "home-furniture", {
  title: "مبلمان خانگی",
  slug: "home-furniture",
  descriptionFa: "مبلمان مناسب فضای نشیمن و پذیرایی.",
  image: livingImage.id,
  sortOrder: 10,
  published: true,
});
const tables = await ensureBySlug("categories", "coffee-side-tables", {
  title: "جلومبلی و عسلی",
  slug: "coffee-side-tables",
  descriptionFa: "میزهای جلومبلی و عسلی هماهنگ با سری‌های مبلمان.",
  image: tableImage.id,
  sortOrder: 20,
  published: true,
});
await ensureBySlug("categories", "dining", {
  title: "میز و صندلی ناهارخوری",
  slug: "dining",
  descriptionFa: "محصولات ناهارخوری هماهنگ با خانواده‌های نیلپر.",
  image: tableImage.id,
  sortOrder: 30,
  published: true,
});

const series = await ensureBySlug("product-series", "delan", {
  title: "دلان",
  slug: "delan",
  styleFa: "نئوکلاسیک",
  descriptionFa: "سری دلان شامل مبل، جلومبلی، عسلی و ست ناهارخوری هماهنگ است.",
  heroMedia: livingImage.id,
});

const woodGroup = await ensureByKey("wood-finish", {
  title: "رنگ چوب پایه و بدنه",
  key: "wood-finish",
  inputType: "swatch",
  required: true,
  helpTextFa: "این انتخاب پیکربندی است و به‌تنهایی گونه / SKU جدید تولید نمی‌کند.",
});
const fabricGroup = await ensureByKey("upholstery-palette", {
  title: "کالیته پارچه و روکش",
  key: "upholstery-palette",
  inputType: "select",
  required: true,
  helpTextFa: "نام کالیته‌ها عیناً از بخش فارسی برگه HSS 994 نگهداری شده‌اند.",
});

await Promise.all([
  ["ونگه", "#3d2b24"],
  ["گردویی", "#76513c"],
  ["عسلی", "#b5793e"],
  ["خود رنگ", "#c9a777"],
  ["فندقی", "#7b4e2e"],
  ["رنگ پوششی سفید/طوسی", "#d7d5d1"],
].map(([title, swatchColor], index) => ensureConfigurationOption(woodGroup.id, title, { swatchColor, sortOrder: index + 1 })));

await Promise.all(
  ["LAVENDAR", "LEROY", "MONALISA", "TANGO", "ROMA", "MILAN"].map((title, index) =>
    ensureConfigurationOption(fabricGroup.id, title, { code: title, sortOrder: index + 1 }),
  ),
);

const variantType = await ensureVariantType();
const singleSeat = await ensureVariantOption(variantType.id, "single-seat", "تک نفره");
const threeSeat = await ensureVariantOption(variantType.id, "three-seat", "سه نفره");

const relatedTable = await ensureBySlug("products", "delan-coffee-side-table", {
  title: "جلومبلی و عسلی دلان",
  slug: "delan-coffee-side-table",
  catalogCode: "HFC 594 / HFS 394",
  brand: brand.id,
  categories: [tables.id],
  series: series.id,
  salesMode: "inquiry",
  availabilityMode: "orderable",
  priceInTMNEnabled: false,
  mainImage: tableImage.id,
  gallery: [{ image: tableImage.id, captionFa: "تصویر نمایشی موقت" }],
  descriptionFa: richText("جلومبلی و عسلی دلان، با کیفیت ساخت بالا، طراحی زیبا و دقت در جزئیات ساخت، به همراه پایه‌های سم‌آهویی ساخته‌شده از چوب راش، انتخابی مناسب برای فضای پذیرایی است."),
  dimensions: { summaryFa: "ابعاد دقیق جلومبلی و عسلی در برگه منبع ثبت شده است." },
  technicalSpecs: [
    { key: "table-top", labelFa: "جنس صفحه بالایی", valueFa: "MDF با روکش چوب راش", group: "construction", sortOrder: 10 },
    { key: "leg", labelFa: "جنس پایه", valueFa: "چوب راش", group: "construction", sortOrder: 20 },
  ],
  orderNotesFa: "رکورد سبک برای ارزیابی رابطه محصول؛ مدل‌سازی کامل این محصول عمداً به مرحله بعد موکول شده است.",
  configurationGroups: [woodGroup.id],
  enableVariants: false,
  sourceMetadata: {
    file: "994.xlsx",
    sheet: "HFC 594-HFS 394",
    catalogCodeRaw: "جلومبلی HFC 594-عسلی HFS 394",
    dataQualityNotes: "رکورد رابطه‌ای پیش‌نمایش؛ هنوز واردات کامل انجام نشده است.",
  },
  _status: "published",
});

const delan = await ensureBySlug("products", "delan-sofa", {
  title: "مبل دلان",
  slug: "delan-sofa",
  catalogCode: "NHSS 994",
  brand: brand.id,
  categories: [furniture.id],
  series: series.id,
  salesMode: "made_to_order",
  availabilityMode: "orderable",
  priceInTMNEnabled: false,
  mainImage: sofaImage.id,
  gallery: [
    { image: sofaImage.id, captionFa: "تصویر نمایشی مبل" },
    { image: livingImage.id, captionFa: "تصویر نمایشی فضای پذیرایی" },
  ],
  descriptionFa: richText("مبل دلان در سبک نئوکلاسیک و کاملاً دست‌ساز تولید شده است.\nاستفاده از چوب‌های منحنی با جزئیات متوسط در نما و فرم‌های هارمونیک و ریتمیک روی بدنه چوبی، در کنار پارچه‌های گران‌بها، حس خوشایند مبلمان پذیرایی و راحتی را منتقل می‌کند. مبلمان دلان شامل ست کاملی از مبل، جلومبلی و عسلی و ناهارخوری است."),
  dimensions: { summaryFa: "گونه‌های تک‌نفره و سه‌نفره؛ اندازه‌های نشیمن در هر گونه ثبت شده‌اند." },
  technicalSpecs: [
    { key: "frame", labelFa: "جنس اسکلت بدنه و دسته", valueFa: "چوبی - از جنس چوب راش", group: "construction", sortOrder: 10 },
    { key: "suspension", labelFa: "نوع تعلیق", valueFa: "تسمه‌کشی", group: "comfort", sortOrder: 20 },
    { key: "leg", labelFa: "جنس پایه", valueFa: "چوبی - از جنس چوب راش گرجستان", group: "construction", sortOrder: 30 },
    { key: "backrest", labelFa: "نوع پشتی", valueFa: "یکپارچه با بدنه", group: "comfort", sortOrder: 40 },
    { key: "seat", labelFa: "نوع نشیمن", valueFa: "مجزا از بدنه", group: "comfort", sortOrder: 50 },
    { key: "foam", labelFa: "جنس تشک پشتی و نشیمن", valueFa: "اسفنج ۳۵ کیلویی", group: "comfort", sortOrder: 60 },
    { key: "delivery", labelFa: "شرایط تحویل محصول", valueFa: "مونتاژ شده", group: "delivery", sortOrder: 70 },
  ],
  orderNotesFa: "با توجه به عمق نشیمن باید با کوسن استفاده شود. نوع پارچه مناسب: مخمل، شنل، ساده.",
  configurationGroups: [woodGroup.id, fabricGroup.id],
  relatedProducts: [relatedTable.id],
  enableVariants: true,
  variantTypes: [variantType.id],
  sourceMetadata: {
    file: "994.xlsx",
    sheet: "HSS 994",
    catalogCodeRaw: "مبل خانگی NHSS 994",
    dataQualityNotes: "کدهای ثبت تک‌رنگ در منبع با NHSS940 آغاز می‌شوند و با شماره کاتالوگ 994 هم‌خوان نیستند؛ عیناً و بدون اصلاح ثبت شده‌اند.",
  },
  _status: "published",
});

await ensureVariant("NHSS94012", {
  product: delan.id,
  options: [singleSeat.id],
  priceInTMNEnabled: false,
  dimensions: { seatHeightCm: 45.5, seatWidthCm: 62, seatDepthCm: 56, fabricMeters: 4.5 },
  manufacturingNotesFa: "تک نفره، تک‌رنگ، بدون محاسبه پارچه کوسن.",
  dataQualityNotes: "کد عیناً از HSS 994 سلول D40 ثبت شده است؛ اختلاف 940/994 نیازمند تأیید نیلپر است.",
});
await ensureVariant("NHSS94015", {
  product: delan.id,
  options: [threeSeat.id],
  priceInTMNEnabled: false,
  dimensions: { seatHeightCm: 45.5, seatWidthCm: 66, seatDepthCm: 57.5, fabricMeters: 10.5 },
  manufacturingNotesFa: "سه نفره، تک‌رنگ، بدون محاسبه پارچه کوسن.",
  dataQualityNotes: "کد عیناً از HSS 994 سلول D42 ثبت شده است؛ اختلاف 940/994 نیازمند تأیید نیلپر است.",
});

payload.logger.info("Nilper Payload dashboard preview seed is ready: open محصول «مبل دلان».");
await payload.destroy();
