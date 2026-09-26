import fs from "node:fs/promises";
import path from "node:path";
import { getPayload } from "payload";

import config from "../../payload.config";
import type { Post, Product } from "../payload-types";
import { journalCategories } from "../features/journal/config";
import { journalSeedPosts } from "../features/journal/seed-posts";
import type { ArticleSection, LegacyJournalPost } from "../features/journal/types";
import { brands as showcaseBrands, projects as showcaseProjects } from "../features/showcase/data";
import { manualCatalogProducts } from "./manual-catalog";

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

async function ensureMedia(filename: string, source: string, alt: string, captionFa = "تصویر محصول از بسته رسانه‌ای تأییدشده نیلپر."): Promise<Identified> {
  const existing = await payload.find({ collection: "media", where: { filename: { equals: filename } }, limit: 1 });
  if (existing.docs[0]) return existing.docs[0] as Identified;
  const data = await fs.readFile(path.resolve(process.cwd(), source));
  const extension = path.extname(filename).toLowerCase();
  const mimetype = extension === ".webp" ? "image/webp" : extension === ".png" ? "image/png" : "image/jpeg";
  return await payload.create({
    collection: "media",
    data: { alt, captionFa },
    file: { data, mimetype, name: filename, size: data.length },
  }) as Identified;
}

const textNode = (text: string) => ({ type: "text", text, detail: 0, format: 0, mode: "normal", style: "", version: 1 });
const paragraphNode = (text: string) => ({
  type: "paragraph", direction: "rtl", format: "", indent: 0, textFormat: 0, textStyle: "", version: 1,
  children: [textNode(text)],
});
const headingNode = (text: string) => ({
  type: "heading", tag: "h2", direction: "rtl", format: "", indent: 0, version: 1,
  children: [textNode(text)],
});

function sectionNodes(section: ArticleSection) {
  const nodes: Record<string, unknown>[] = [headingNode(section.title), ...section.paragraphs.map(paragraphNode)];
  if (section.bullets?.length) {
    nodes.push({
      type: "list", listType: "bullet", start: 1, tag: "ul", direction: "rtl", format: "", indent: 0, version: 1,
      children: section.bullets.map((bullet, index) => ({
        type: "listitem", value: index + 1, direction: "rtl", format: "", indent: 0, version: 1,
        children: [textNode(bullet)],
      })),
    });
  }
  if (section.table) {
    const rows = [section.table.headings, ...section.table.rows];
    nodes.push(paragraphNode(section.table.caption));
    nodes.push({
      type: "table", direction: "rtl", format: "", indent: 0, version: 1,
      children: rows.map((row, rowIndex) => ({
        type: "tablerow", direction: "rtl", format: "", indent: 0, version: 1,
        children: row.map((cell) => ({
          type: "tablecell", backgroundColor: null, colSpan: 1, headerState: rowIndex === 0 ? 1 : 0, rowSpan: 1,
          direction: "rtl", format: "", indent: 0, version: 1, children: [paragraphNode(cell)],
        })),
      })),
    });
  }
  if (section.note) {
    nodes.push({ type: "quote", direction: "rtl", format: "", indent: 0, version: 1, children: [textNode(section.note)] });
  }
  return nodes;
}

function journalRichText(post: LegacyJournalPost): Post["content"] {
  return {
    root: {
      type: "root", direction: "rtl", format: "", indent: 0, version: 1,
      children: [paragraphNode(post.introduction), ...post.sections.flatMap(sectionNodes)],
    },
  } as Post["content"];
}

async function ensureBySlug(collection: "brands" | "categories" | "products" | "projects", slug: string, data: Record<string, unknown>): Promise<Identified> {
  const existing = await payload.find({ collection, where: { slug: { equals: slug } }, limit: 1 });
  if (existing.docs[0]) return await payload.update({ collection, id: existing.docs[0].id, data } as never) as unknown as Identified;
  return await payload.create({ collection, data } as never) as unknown as Identified;
}

async function ensureProduct(slug: string, data: Record<string, unknown>): Promise<Identified> {
  const existing = await payload.find({
    collection: "products",
    where: { slug: { equals: slug } },
    limit: 1,
  });
  const productData = { ...data, slug };
  if (existing.docs[0]) return await payload.update({ collection: "products", id: existing.docs[0].id, data: productData } as never) as unknown as Identified;
  return await payload.create({ collection: "products", data: productData } as never) as unknown as Identified;
}

async function ensureByKey(key: string, data: Record<string, unknown>): Promise<Identified> {
  const existing = await payload.find({ collection: "variantTypes", where: { name: { equals: key } }, limit: 1 });
  if (existing.docs[0]) return await payload.update({ collection: "variantTypes", id: existing.docs[0].id, data } as never) as unknown as Identified;
  return await payload.create({ collection: "variantTypes", data: { ...data, name: key } } as never) as unknown as Identified;
}

async function ensureConfigurationOption(group: number, title: string, data: Record<string, unknown>): Promise<Identified> {
  const existing = await payload.find({
    collection: "variantOptions",
    where: { and: [{ variantType: { equals: group } }, { label: { equals: title } }] },
    limit: 1,
  });
  const attribute = await payload.findByID({ collection: 'variantTypes', id: group });
  const optionData = { variantType: group, label: title, value: existing.docs[0]?.value ?? `${attribute.name}-${String(data.code ?? title)}`, active: true, ...data };
  if (existing.docs[0]) return await payload.update({ collection: "variantOptions", id: existing.docs[0].id, data: optionData } as never) as unknown as Identified;
  return await payload.create({ collection: "variantOptions", data: optionData } as never) as unknown as Identified;
}

async function attributeAssignments(ids: number[], required = false) {
  return Promise.all(ids.map(async (attribute) => ({ attribute, required,
    allowedOptions: (await payload.find({ collection: 'variantOptions', where: { variantType: { equals: attribute } }, pagination: false, depth: 0 })).docs.map((option) => option.id),
  })));
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

async function ensureVariant(nilperCode: string, data: Record<string, unknown>) {
  const existing = await payload.find({
    collection: "variants",
    where: { nilperCode: { equals: nilperCode } },
    limit: 1,
  });
  const variantData = { nilperCode, _status: "published" as const, ...data };
  if (existing.docs[0]) return payload.update({ collection: "variants", id: existing.docs[0].id, data: variantData } as never);
  return payload.create({ collection: "variants", data: variantData } as never);
}

const [sofaImage, livingImage, tableImage, accessoryImage] = await Promise.all([
  ensureMedia("delan-sofa.webp", "src/payload/seed-assets/catalog/delan-sofa.webp", "مبل دلان"),
  ensureMedia("delan-living-preview.jpg", "public/placeholders/living.jpg", "تصویر نمایشی فضای پذیرایی دلان"),
  ensureMedia("delan-table-preview.jpg", "public/placeholders/dining.jpg", "تصویر نمایشی میز هماهنگ دلان"),
  ensureMedia("accessories-preview.jpg", "public/placeholders/project.jpg", "اکسسوری و جزئیات دکوراسیون"),
]);

const brand = await ensureBySlug("brands", "nilper", {
  title: "نیلپر",
  slug: "nilper",
  descriptionFa: "برند نمونه برای ارزیابی داشبورد مدیریت محصولات نیلپر.",
  taglineFa: "طراحی برای زندگی روزمره",
  storyFa: "مجموعه نیلپر با تمرکز بر راحتی، دوام و انتخاب آگاهانه برای خانه و محیط کار شکل گرفته است.",
  published: true,
  logo: sofaImage.id,
  heroMedia: sofaImage.id,
  heroAlt: "مبلمان نیلپر در فضای داخلی",
  heroCaption: "مجموعه محصولات نیلپر",
  featured: true,
  sortOrder: 0,
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
const dining = await ensureBySlug("categories", "dining", {
  title: "میز و صندلی ناهارخوری",
  slug: "dining",
  descriptionFa: "محصولات ناهارخوری هماهنگ با خانواده‌های نیلپر.",
  image: tableImage.id,
  sortOrder: 30,
  published: true,
});
const accessories = await ensureBySlug("categories", "accessories", {
  title: "اکسسوری",
  slug: "accessories",
  descriptionFa: "جزئیات و اکسسوری‌های تکمیل‌کننده فضای خانه.",
  image: accessoryImage.id,
  sortOrder: 40,
  published: true,
});

const familyCategory = await ensureBySlug("categories", "delan", {
  title: "دلان",
  slug: "delan",
  descriptionFa: "سری دلان شامل مبل، جلومبلی، عسلی و ست ناهارخوری هماهنگ است.",
  image: livingImage.id,
  published: true,
});

const woodGroup = await ensureByKey("wood-finish", {
  label: "رنگ چوب پایه و بدنه",
  active: true,
  helpTextFa: "این انتخاب مشتری است و به‌تنهایی مدل / SKU جدید تولید نمی‌کند.",
  catalogFilterEnabled: true,
  catalogFilterLabel: "رنگ چوب",
  catalogFilterPresentation: "swatch",
  catalogFilterPlacement: "primary",
  catalogFilterOrder: 10,
  catalogFilterScope: "all",
});
const fabricGroup = await ensureByKey("upholstery-palette", {
  label: "کالیته پارچه و روکش",
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
].map(([title, colorHex], index) => ensureConfigurationOption(woodGroup.id, title, { colorHex, sortOrder: index + 1 })));

await Promise.all(
  ["LAVENDAR", "LEROY", "MONALISA", "TANGO", "ROMA", "MILAN"].map((title, index) =>
    ensureConfigurationOption(fabricGroup.id, title, { code: title, sortOrder: index + 1 }),
  ),
);

const variantType = await ensureVariantType("seating-form", "فرم نشیمن");
const singleSeat = await ensureVariantOption(variantType.id, "single-seat", "تک نفره");
const threeSeat = await ensureVariantOption(variantType.id, "three-seat", "سه نفره");

const relatedTable = await ensureProduct("delan-coffee-side-table", {
  title: "جلومبلی و عسلی دلان",
  slug: "delan-coffee-side-table",
  catalogCode: "HFC 594 / HFS 394",
  brand: brand.id,
  categories: [tables.id, familyCategory.id],
  salesMode: "inquiry",
  availabilityMode: "orderable",
  priceInTMNEnabled: false,
  mainImage: tableImage.id,
  gallery: [{ image: tableImage.id, captionFa: "تصویر نمایشی موقت" }],
  descriptionFa: richText("جلومبلی و عسلی دلان، با کیفیت ساخت بالا، طراحی زیبا و دقت در جزئیات ساخت، به همراه پایه‌های سم‌آهویی ساخته‌شده از چوب راش، انتخابی مناسب برای فضای پذیرایی است."),
  technicalSpecs: [
    { key: "table-top", labelFa: "جنس صفحه بالایی", valueFa: "MDF با روکش چوب راش", sortOrder: 10 },
    { key: "leg", labelFa: "جنس پایه", valueFa: "چوب راش", sortOrder: 20 },
  ],
  orderNotesFa: "رکورد سبک برای ارزیابی رابطه محصول؛ مدل‌سازی کامل این محصول عمداً به مرحله بعد موکول شده است.",
  attributes: await attributeAssignments([woodGroup.id], true),
  productType: "simple",
  _status: "published",
});

const delan = await ensureProduct("delan-sofa", {
  title: "مبل دلان",
  slug: "delan-sofa",
  catalogCode: "NHSS 994",
  brand: brand.id,
  categories: [furniture.id, familyCategory.id],
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
    { key: "frame", labelFa: "جنس اسکلت بدنه و دسته", valueFa: "چوبی - از جنس چوب راش", sortOrder: 10 },
    { key: "suspension", labelFa: "نوع تعلیق", valueFa: "تسمه‌کشی", sortOrder: 20 },
    { key: "leg", labelFa: "جنس پایه", valueFa: "چوبی - از جنس چوب راش گرجستان", sortOrder: 30 },
    { key: "backrest", labelFa: "نوع پشتی", valueFa: "یکپارچه با بدنه", sortOrder: 40 },
    { key: "seat", labelFa: "نوع نشیمن", valueFa: "مجزا از بدنه", sortOrder: 50 },
    { key: "foam", labelFa: "جنس تشک پشتی و نشیمن", valueFa: "اسفنج ۳۵ کیلویی", sortOrder: 60 },
    { key: "delivery", labelFa: "شرایط تحویل محصول", valueFa: "مونتاژ شده", sortOrder: 70 },
  ],
  orderNotesFa: "با توجه به عمق نشیمن باید با کوسن استفاده شود. نوع پارچه مناسب: مخمل، شنل، ساده.",
  attributes: [...await attributeAssignments([woodGroup.id, fabricGroup.id], true), ...await attributeAssignments([variantType.id])],
  matchingProducts: [relatedTable.id],
  productType: "variable",
  variantAttributes: [variantType.id],
  _status: "published",
});

await ensureVariant("NHSS94012", {
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
});
await ensureVariant("NHSS94015", {
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

const storefrontCategoryIDs = new Set([
  furniture.id,
  tables.id,
  dining.id,
  accessories.id,
  bedroom.id,
  diningSeating.id,
]);
const previouslySelectedCategories = await payload.find({
  collection: "categories",
  depth: 0,
  pagination: false,
  where: { showOnStorefront: { equals: true } },
});
for (const category of previouslySelectedCategories.docs) {
  if (!storefrontCategoryIDs.has(category.id)) {
    await payload.update({ collection: "categories", id: category.id, data: { showOnStorefront: false } });
  }
}
for (const categoryID of storefrontCategoryIDs) {
  await payload.update({ collection: "categories", id: categoryID, data: { showOnStorefront: true } });
}

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
  const productCategory = await ensureBySlug("categories", sourceProduct.familyCategory.slug, {
    title: sourceProduct.familyCategory.title,
    slug: sourceProduct.familyCategory.slug,
    descriptionFa: sourceProduct.familyCategory.descriptionFa,
    image: image.id,
    parent: categoryIDs[sourceProduct.category],
    published: true,
  });

  const optionIDs = new Map<string, number>();
  const variantTypeIDs: number[] = [];
  for (const type of sourceProduct.variantAttributes) {
    const ensuredType = await ensureVariantType(type.name, type.label);
    variantTypeIDs.push(ensuredType.id);
    for (const option of type.options) {
      const ensuredOption = await ensureVariantOption(ensuredType.id, option.value, option.label);
      optionIDs.set(`${type.name}:${option.value}`, ensuredOption.id);
    }
  }

  const catalogProduct = await ensureProduct(sourceProduct.slug, {
    title: sourceProduct.title,
    catalogCode: sourceProduct.catalogCode,
    brand: brand.id,
    categories: [categoryIDs[sourceProduct.category], productCategory.id],
    salesMode: "made_to_order",
    availabilityMode: "orderable",
    priceInTMNEnabled: false,
    mainImage: image.id,
    gallery: [{ image: image.id, captionFa: sourceProduct.image.alt }],
    descriptionFa: richText(sourceProduct.descriptionFa),
    measurements: sourceProduct.measurements ?? [],
    technicalSpecs: sourceProduct.technicalSpecs,
    orderNotesFa: sourceProduct.orderNotesFa,
    attributes: [...await attributeAssignments((sourceProduct.customerAttributeKeys ?? []).map((key) => configurationGroupIDs[key]), true), ...await attributeAssignments(variantTypeIDs)],
    productType: sourceProduct.variants.length > 0 ? "variable" : "simple",
    variantAttributes: variantTypeIDs,
    _status: "published",
  });

  for (const sourceVariant of sourceProduct.variants) {
    const options = sourceVariant.options.map((key) => {
      const optionID = optionIDs.get(key);
      if (!optionID) throw new Error(`Missing manual variant option ${key} for ${sourceProduct.slug}.`);
      return optionID;
    });
    await ensureVariant(sourceVariant.code, {
      product: catalogProduct.id,
      title: sourceVariant.title,
      options,
      priceInTMNEnabled: false,
      measurements: sourceVariant.measurements ?? [],
      manufacturingNotesFa: sourceVariant.manufacturingNotesFa,
    });
  }
}

const journalCategoryIDs = new Map<string, number>();
for (const [index, category] of journalCategories.entries()) {
  const existing = await payload.find({ collection: "blog-categories", where: { slug: { equals: category.id } }, limit: 1 });
  const record = existing.docs[0] ?? await payload.create({
    collection: "blog-categories",
    data: {
      title: category.label,
      slug: category.id,
      sortOrder: index + 1,
      published: true,
    },
  });
  journalCategoryIDs.set(category.id, record.id as number);
}

const journalMedia = new Map<string, Identified>();
for (const post of journalSeedPosts) {
  const source = `public${post.image}`;
  const filename = `journal-${path.basename(post.image)}`;
  journalMedia.set(post.slug, await ensureMedia(filename, source, post.imageAlt, post.imageCaption));
}

const journalPostIDs = new Map<string, number>();
const createdJournalSlugs = new Set<string>();
for (const [index, post] of journalSeedPosts.entries()) {
  const categoryID = journalCategoryIDs.get(post.category);
  if (!categoryID) throw new Error(`Missing journal category ${post.category}.`);
  const existing = await payload.find({ collection: "posts", where: { slug: { equals: post.slug } }, limit: 1 });
  if (existing.docs[0]) {
    journalPostIDs.set(post.slug, existing.docs[0].id as number);
    const currentCategoryID = typeof existing.docs[0].category === "object" ? existing.docs[0].category.id : existing.docs[0].category;
    if (currentCategoryID !== categoryID) {
      await payload.update({ collection: "posts", id: existing.docs[0].id, data: { category: categoryID } });
    }
    continue;
  }
  const heroImage = journalMedia.get(post.slug);
  if (!heroImage) throw new Error(`Missing journal media for ${post.slug}.`);
  const created = await payload.create({
    collection: "posts",
    draft: false,
    data: {
      title: post.title,
      slug: post.slug,
      category: categoryID,
      description: post.description,
      summary: post.summary,
      heroImage: heroImage.id,
      heroCaption: post.imageCaption,
      content: journalRichText(post),
      takeaway: post.takeaway,
      callToAction: post.collection,
      authorName: "تحریریه ان‌پی",
      authorUrl: "/about",
      authorBio: "یادداشت‌های گروه ان‌پی درباره انتخاب مبلمان، شناخت متریال و ساختن فضاهایی برای زندگی روزمره.",
      seo: { noIndex: false, primaryTopic: post.title },
      publishedAt: post.publishedAt,
      featured: index === 0,
      sortOrder: journalSeedPosts.length - index,
      _status: "published",
    },
  });
  journalPostIDs.set(post.slug, created.id as number);
  createdJournalSlugs.add(post.slug);
}

for (const post of journalSeedPosts) {
  if (!createdJournalSlugs.has(post.slug)) continue;
  const id = journalPostIDs.get(post.slug);
  if (!id) continue;
  await payload.update({
    collection: "posts",
    id,
    data: { relatedPosts: post.relatedSlugs.map((slug) => journalPostIDs.get(slug)).filter((value): value is number => Boolean(value)) },
  });
}

for (const [index, brandProfile] of showcaseBrands.entries()) {
  const source = `public${brandProfile.image.src}`;
  const hero = await ensureMedia(
    `showcase-brand-${brandProfile.slug}-${path.basename(brandProfile.image.src)}`,
    source,
    brandProfile.image.alt,
    brandProfile.image.caption,
  );
  await ensureBySlug("brands", brandProfile.slug, {
    title: brandProfile.name,
    slug: brandProfile.slug,
    descriptionFa: brandProfile.description,
    taglineFa: brandProfile.title,
    storyFa: brandProfile.story,
    heroMedia: hero.id,
    heroAlt: brandProfile.image.alt,
    heroCaption: brandProfile.image.caption,
    featured: index === 0,
    sortOrder: index + 10,
    published: true,
  });
}

const showcaseCatalog = await payload.find({
  collection: "products",
  depth: 0,
  limit: 100,
  pagination: false,
  sort: "createdAt",
});
const showcaseProductIDs = showcaseCatalog.docs.map((product) => product.id as number);

for (const [index, project] of showcaseProjects.entries()) {
  const hero = await ensureMedia(
    `showcase-project-${project.slug}-${path.basename(project.image.src)}`,
    `public${project.image.src}`,
    project.image.alt,
    project.image.caption,
  );
  const gallery = [];
  for (const [galleryIndex, image] of project.gallery.entries()) {
    const media = await ensureMedia(
      `showcase-project-${project.slug}-${galleryIndex + 1}-${path.basename(image.src)}`,
      `public${image.src}`,
      image.alt,
      image.caption,
    );
    gallery.push({ image: media.id, alt: image.alt, caption: image.caption });
  }
  const projectProducts = showcaseProductIDs.length
    ? Array.from({ length: Math.min(4, showcaseProductIDs.length) }, (_, offset) =>
        showcaseProductIDs[(index * 3 + offset) % showcaseProductIDs.length])
    : [];
  await ensureBySlug("projects", project.slug, {
    title: project.title,
    slug: project.slug,
    sector: project.sector,
    descriptionFa: project.description,
    briefFa: project.brief,
    heroMedia: hero.id,
    heroAlt: project.image.alt,
    heroCaption: project.image.caption,
    approach: project.approach,
    palette: project.palette,
    gallery,
    products: projectProducts,
    article: journalPostIDs.get(project.articleSlug),
    featured: index === 0,
    sortOrder: index + 1,
    published: true,
  });
}

payload.logger.info(`Nilper Payload seed is ready: ${manualCatalogProducts.length + 2} curated products, ${journalPostIDs.size} journal posts, ${showcaseBrands.length + 1} brands, and ${showcaseProjects.length} projects.`);
await payload.destroy();
