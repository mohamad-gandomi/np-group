import fs from "node:fs/promises";
import path from "node:path";
import { getPayload } from "payload";

import config from "../../payload.config";
import type { Product } from "../payload-types";
import { manualCatalogProducts } from "./manual-catalog";
import { buildNilperSourceKey } from "./source-identity";

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
  const extension = path.extname(filename).toLowerCase();
  const mimetype = extension === ".webp" ? "image/webp" : extension === ".png" ? "image/png" : "image/jpeg";
  return await payload.create({
    collection: "media",
    data: { alt, captionFa: "تصویر محصول از بسته رسانه‌ای تأییدشده نیلپر." },
    file: { data, mimetype, name: filename, size: data.length },
  }) as Identified;
}

async function ensureBySlug(collection: "brands" | "categories" | "product-series" | "products", slug: string, data: Record<string, unknown>): Promise<Identified> {
  const existing = await payload.find({ collection, where: { slug: { equals: slug } }, limit: 1 });
  if (existing.docs[0]) return await payload.update({ collection, id: existing.docs[0].id, data } as never) as unknown as Identified;
  return await payload.create({ collection, data } as never) as unknown as Identified;
}

async function ensureProduct(sourceKey: string, slug: string, data: Record<string, unknown>): Promise<Identified> {
  const existing = await payload.find({
    collection: "products",
    where: { or: [{ sourceKey: { equals: sourceKey } }, { slug: { equals: slug } }] },
    limit: 1,
  });
  const productData = { ...data, sourceKey, slug };
  if (existing.docs[0]) return await payload.update({ collection: "products", id: existing.docs[0].id, data: productData } as never) as unknown as Identified;
  return await payload.create({ collection: "products", data: productData } as never) as unknown as Identified;
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

async function ensureVariantType(name: string, label: string): Promise<Identified> {
  const existing = await payload.find({ collection: "variantTypes", where: { name: { equals: name } }, limit: 1 });
  if (existing.docs[0]) return existing.docs[0] as Identified;
  return await payload.create({ collection: "variantTypes", data: { label, name } }) as Identified;
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

async function ensureVariant(sourceKey: string, nilperCode: string, data: Record<string, unknown>) {
  const existing = await payload.find({
    collection: "variants",
    where: { or: [{ sourceKey: { equals: sourceKey } }, { nilperCode: { equals: nilperCode } }] },
    limit: 1,
  });
  const variantData = { nilperCode, sourceKey, _status: "published" as const, ...data };
  if (existing.docs[0]) return payload.update({ collection: "variants", id: existing.docs[0].id, data: variantData } as never);
  return payload.create({ collection: "variants", data: variantData } as never);
}

const [sofaImage, livingImage, tableImage] = await Promise.all([
  ensureMedia("delan-sofa.webp", "src/payload/seed-assets/catalog/delan-sofa.webp", "مبل دلان"),
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
  published: true,
});

const woodGroup = await ensureByKey("wood-finish", {
  title: "رنگ چوب پایه و بدنه",
  key: "wood-finish",
  inputType: "swatch",
  required: true,
  active: true,
  helpTextFa: "این انتخاب پیکربندی است و به‌تنهایی گونه / SKU جدید تولید نمی‌کند.",
});
const fabricGroup = await ensureByKey("upholstery-palette", {
  title: "کالیته پارچه و روکش",
  key: "upholstery-palette",
  inputType: "select",
  required: true,
  active: true,
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

const variantType = await ensureVariantType("seating-form", "فرم نشیمن");
const singleSeat = await ensureVariantOption(variantType.id, "single-seat", "تک نفره");
const threeSeat = await ensureVariantOption(variantType.id, "three-seat", "سه نفره");

const relatedTableSourceKey = buildNilperSourceKey({
  workbookKey: "994",
  sheet: "HFC 594-HFS 394",
  entity: "product",
  rawIdentity: "جلومبلی HFC 594-عسلی HFS 394",
});
const relatedTable = await ensureProduct(relatedTableSourceKey, "delan-coffee-side-table", {
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
  technicalSpecs: [
    { key: "table-top", labelFa: "جنس صفحه بالایی", valueFa: "MDF با روکش چوب راش", group: "construction", sortOrder: 10 },
    { key: "leg", labelFa: "جنس پایه", valueFa: "چوب راش", group: "construction", sortOrder: 20 },
  ],
  orderNotesFa: "رکورد سبک برای ارزیابی رابطه محصول؛ مدل‌سازی کامل این محصول عمداً به مرحله بعد موکول شده است.",
  configurationGroups: [woodGroup.id],
  enableVariants: false,
  sourceMetadata: {
    workbookKey: "994",
    file: "994.xlsx",
    sheet: "HFC 594-HFS 394",
    identityRaw: "جلومبلی HFC 594-عسلی HFS 394",
    catalogCodeRaw: "جلومبلی HFC 594-عسلی HFS 394",
    dataQualityNotes: "رکورد رابطه‌ای پیش‌نمایش؛ هنوز واردات کامل انجام نشده است.",
  },
  _status: "published",
});

const delanSourceKey = buildNilperSourceKey({
  workbookKey: "994",
  sheet: "HSS 994",
  entity: "product",
  rawIdentity: "مبل خانگی NHSS 994",
});
const delan = await ensureProduct(delanSourceKey, "delan-sofa", {
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
  matchingProducts: [relatedTable.id],
  enableVariants: true,
  variantTypes: [variantType.id],
  sourceMetadata: {
    workbookKey: "994",
    file: "994.xlsx",
    sheet: "HSS 994",
    identityRaw: "مبل خانگی NHSS 994",
    catalogCodeRaw: "مبل خانگی NHSS 994",
    dataQualityNotes: "کدهای ثبت تک‌رنگ در منبع با NHSS940 آغاز می‌شوند و با شماره کاتالوگ 994 هم‌خوان نیستند؛ عیناً و بدون اصلاح ثبت شده‌اند.",
  },
  _status: "published",
});

await ensureVariant(buildNilperSourceKey({ workbookKey: "994", sheet: "HSS 994", entity: "variant", rawIdentity: "NHSS94012" }), "NHSS94012", {
  product: delan.id,
  options: [singleSeat.id],
  priceInTMNEnabled: false,
  measurements: [
    { key: "seat-height", labelFa: "ارتفاع نشیمن", value: 45.5, unit: "cm", sortOrder: 10 },
    { key: "seat-width-per-person", labelFa: "عرض نشیمن به ازای هر نفر", value: 62, unit: "cm", sortOrder: 20 },
    { key: "seat-depth", labelFa: "عمق نشیمن", value: 56, unit: "cm", sortOrder: 30 },
    { key: "fabric-single-color", labelFa: "متراژ پارچه تک‌رنگ بدون کوسن", value: 4.5, unit: "m", sortOrder: 40 },
  ],
  manufacturingNotesFa: "تک نفره، تک‌رنگ، بدون محاسبه پارچه کوسن.",
  sourceMetadata: {
    workbookKey: "994",
    file: "994.xlsx",
    sheet: "HSS 994",
    identityRaw: "NHSS94012",
    catalogCodeRaw: "مبل خانگی NHSS 994",
    dataQualityNotes: "کد عیناً از HSS 994 سلول D40 ثبت شده است؛ اختلاف 940/994 نیازمند تأیید نیلپر است.",
  },
});
await ensureVariant(buildNilperSourceKey({ workbookKey: "994", sheet: "HSS 994", entity: "variant", rawIdentity: "NHSS94015" }), "NHSS94015", {
  product: delan.id,
  options: [threeSeat.id],
  priceInTMNEnabled: false,
  measurements: [
    { key: "seat-height", labelFa: "ارتفاع نشیمن", value: 45.5, unit: "cm", sortOrder: 10 },
    { key: "seat-width-per-person", labelFa: "عرض نشیمن به ازای هر نفر", value: 66, unit: "cm", sortOrder: 20 },
    { key: "seat-depth", labelFa: "عمق نشیمن", value: 57.5, unit: "cm", sortOrder: 30 },
    { key: "fabric-single-color", labelFa: "متراژ پارچه تک‌رنگ بدون کوسن", value: 10.5, unit: "m", sortOrder: 40 },
  ],
  manufacturingNotesFa: "سه نفره، تک‌رنگ، بدون محاسبه پارچه کوسن.",
  sourceMetadata: {
    workbookKey: "994",
    file: "994.xlsx",
    sheet: "HSS 994",
    identityRaw: "NHSS94015",
    catalogCodeRaw: "مبل خانگی NHSS 994",
    dataQualityNotes: "کد عیناً از HSS 994 سلول D42 ثبت شده است؛ اختلاف 940/994 نیازمند تأیید نیلپر است.",
  },
});

const bedroom = await ensureBySlug("categories", "bedroom-furniture", {
  title: "سرویس خواب",
  slug: "bedroom-furniture",
  descriptionFa: "تخت خواب و اجزای هماهنگ سرویس خواب.",
  sortOrder: 40,
  published: true,
});
const diningSeating = await ensureBySlug("categories", "dining-seating", {
  title: "صندلی ناهارخوری و بار",
  slug: "dining-seating",
  descriptionFa: "صندلی‌های ناهارخوری، کانتر و بار.",
  sortOrder: 50,
  published: true,
});

const categoryIDs = {
  bedroom: bedroom.id,
  "dining-seating": diningSeating.id,
  "home-furniture": furniture.id,
};
const configurationGroupIDs = {
  "wood-finish": woodGroup.id,
  "upholstery-palette": fabricGroup.id,
};

for (const sourceProduct of manualCatalogProducts) {
  const image = await ensureMedia(sourceProduct.image.filename, sourceProduct.image.source, sourceProduct.image.alt);
  const productSeries = await ensureBySlug("product-series", sourceProduct.series.slug, {
    title: sourceProduct.series.title,
    slug: sourceProduct.series.slug,
    styleFa: sourceProduct.series.styleFa,
    descriptionFa: sourceProduct.series.descriptionFa,
    heroMedia: image.id,
    published: true,
  });

  const optionIDs = new Map<string, number>();
  const variantTypeIDs: number[] = [];
  for (const type of sourceProduct.variantTypes) {
    const ensuredType = await ensureVariantType(type.name, type.label);
    variantTypeIDs.push(ensuredType.id);
    for (const option of type.options) {
      const ensuredOption = await ensureVariantOption(ensuredType.id, option.value, option.label);
      optionIDs.set(`${type.name}:${option.value}`, ensuredOption.id);
    }
  }

  const sourceKey = buildNilperSourceKey({
    workbookKey: sourceProduct.workbookKey,
    sheet: sourceProduct.sheet,
    entity: "product",
    rawIdentity: sourceProduct.identityRaw,
  });
  const catalogProduct = await ensureProduct(sourceKey, sourceProduct.slug, {
    title: sourceProduct.title,
    catalogCode: sourceProduct.catalogCode,
    brand: brand.id,
    categories: [categoryIDs[sourceProduct.category]],
    series: productSeries.id,
    salesMode: "made_to_order",
    availabilityMode: "orderable",
    priceInTMNEnabled: false,
    mainImage: image.id,
    gallery: [{ image: image.id, captionFa: sourceProduct.image.alt }],
    descriptionFa: richText(sourceProduct.descriptionFa),
    measurements: sourceProduct.measurements ?? [],
    technicalSpecs: sourceProduct.technicalSpecs,
    orderNotesFa: sourceProduct.orderNotesFa,
    configurationGroups: (sourceProduct.configurationGroupKeys ?? []).map((key) => configurationGroupIDs[key]),
    enableVariants: sourceProduct.variants.length > 0,
    variantTypes: variantTypeIDs,
    sourceMetadata: {
      workbookKey: sourceProduct.workbookKey,
      file: sourceProduct.file,
      sheet: sourceProduct.sheet,
      identityRaw: sourceProduct.identityRaw,
      catalogCodeRaw: sourceProduct.identityRaw,
      dataQualityNotes: sourceProduct.dataQualityNotes,
    },
    _status: "published",
  });

  for (const sourceVariant of sourceProduct.variants) {
    const options = sourceVariant.options.map((key) => {
      const optionID = optionIDs.get(key);
      if (!optionID) throw new Error(`Missing manual variant option ${key} for ${sourceProduct.slug}.`);
      return optionID;
    });
    await ensureVariant(buildNilperSourceKey({
      workbookKey: sourceProduct.workbookKey,
      sheet: sourceProduct.sheet,
      entity: "variant",
      rawIdentity: sourceVariant.code,
    }), sourceVariant.code, {
      product: catalogProduct.id,
      title: sourceVariant.title,
      options,
      priceInTMNEnabled: false,
      measurements: sourceVariant.measurements ?? [],
      manufacturingNotesFa: sourceVariant.manufacturingNotesFa,
      sourceMetadata: {
        workbookKey: sourceProduct.workbookKey,
        file: sourceProduct.file,
        sheet: sourceProduct.sheet,
        identityRaw: sourceVariant.code,
        catalogCodeRaw: sourceProduct.identityRaw,
        dataQualityNotes: sourceVariant.dataQualityNotes,
      },
    });
  }
}

payload.logger.info(`Nilper Payload catalog seed is ready: ${manualCatalogProducts.length + 2} curated products.`);
await payload.destroy();
