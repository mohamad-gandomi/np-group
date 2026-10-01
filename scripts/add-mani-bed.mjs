import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { sendMcpRequest } from "./payload-mcp.mjs";

const IMG1_PATH = "C:/Users/Mohamad/.gemini/antigravity/brain/7f5d0ff2-042b-40fa-b3c2-3ccc6c0276b5/.user_uploaded/media_1790836864783.jpg";
const IMG2_PATH = "C:/Users/Mohamad/.gemini/antigravity/brain/7f5d0ff2-042b-40fa-b3c2-3ccc6c0276b5/.user_uploaded/media_1790836864786.jpg";

async function optimizeImage(filePath) {
  const buffer = await fs.readFile(filePath);
  const webpBuffer = await sharp(buffer)
    .resize({ width: 1336, withoutEnlargement: true })
    .webp({ quality: 70 })
    .toBuffer();
  return webpBuffer.toString("base64");
}

async function uploadImage({ base64, alt, productSlug, captionFa }) {
  console.log(`Uploading image for ${productSlug} (${alt})...`);
  const response = await sendMcpRequest({
    jsonrpc: "2.0",
    id: `upload-${Date.now()}`,
    method: "tools/call",
    params: {
      name: "mediaUploadImage",
      arguments: {
        base64,
        alt,
        productSlug,
        captionFa,
        maxWidth: 1336,
        quality: 70,
      },
    },
  });

  if (response.error) {
    throw new Error(`MCP Error: ${JSON.stringify(response.error)}`);
  }

  const resultText = response.result?.content?.[0]?.text;
  console.log("Upload result:", resultText);
  const jsonMatch = resultText?.match(/```json\s*([\s\S]*?)\s*```/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[1]);
  }
  return null;
}

async function createManiBedDraft(img1Id, img2Id) {
  const payload = {
    sourceAnalysis: {
      sourceType: "Nilper Product Specification Sheet (CSV / Workbook)",
      summary:
        "The workbook specifies the Mani modern bed collection (NBSB 852) with 4 real SKU variants across 2 widths (160, 180) and 2 base types (fixed, lift-up).",
      sections: ["تخت خواب مانی (NBSB 852)"],
      unmapped: [
        "Header text 'اطلاعات محصول جلومبلی و عسلی' is a copy-paste artifact from a living room template and does not apply to the bedroom set.",
        "Total width for width 180 in table is written as '97 cm', which is a recognized typo for 197 cm.",
        "Meaning of name 'مانی (نام روستایی در استان کرمان است)' documented in notes.",
        "English column translations are preserved in analysis but not stored in Persian storefront fields.",
      ],
      ambiguities: [],
    },
    updateExistingDraft: false,
    product: {
      title: "تخت خواب مانی",
      slug: "mani-bed",
      catalogCode: "NBSB 852",
      descriptionFa:
        "تخت خواب مانی با طراحی مدرن و پوششی پارچه‌ای زیبا و متفاوت و همچنین بدنه و تاج تخت مستحکم و راحت، علاوه بر زیبایی چشم‌نواز، محیطی راحت برای استراحت و مطالعه برای کاربر ایجاد می‌کند.",
      measurements: [
        { labelFa: "ارتفاع کلی", value: 95, unit: "cm" },
        { labelFa: "طول کلی", value: 220, unit: "cm" },
      ],
      technicalSpecs: [
        { labelFa: "سبک طراحی", valueFa: "مدرن" },
        { labelFa: "جنس تاج تخت", valueFa: "MDF و چوب چند لایی" },
        { labelFa: "جنس بدنه", valueFa: "MDF با روکش پارچه" },
        { labelFa: "نوع روکش تاج", valueFa: "پارچه" },
        { labelFa: "جنس پایه", valueFa: "چوب راش" },
        { labelFa: "جنس پرکننده", valueFa: "ویسکوز" },
        { labelFa: "جنس اسکلت کفی", valueFa: "آهنی" },
        { labelFa: "فضای انبارش", valueFa: "دارد" },
        { labelFa: "شرایط تحویل محصول", valueFa: "دمونتاژ" },
        {
          labelFa: "سایر متعلقات",
          valueFa: "راهنمای استفاده از محصول، کارت گارانتی",
        },
      ],
      orderNotesFa:
        "وزن تشک در زمان سفارش‌گیری پرسیده شود. در نوع جک تخت خواب مؤثر خواهد بود.",
      salesMode: "made_to_order",
      availabilityMode: "orderable",
      shippingMode: "freight",
      mainImage: img1Id || undefined,
      gallery: [img1Id, img2Id].filter(Boolean),
    },
    brand: { slug: "nilper", title: "نیلپر" },
    categories: [{ slug: "bedroom-furniture", title: "سرویس خواب" }],
    relatedProducts: [],
    matchingProducts: [],
    attributes: [
      {
        name: "bed-width",
        label: "عرض تشک",
        required: true,
        variantDiscriminator: true,
        options: [
          { value: "160", label: "عرض ۱۶۰" },
          { value: "180", label: "عرض ۱۸۰" },
        ],
      },
      {
        name: "bed-base",
        label: "نوع کفی",
        required: true,
        variantDiscriminator: true,
        options: [
          { value: "fixed", label: "کفی ساده" },
          { value: "lift", label: "کفی جک‌دار" },
        ],
      },
    ],
    variants: [
      {
        nilperCode: "NBSB852004",
        title: "تخت خواب مانی عرض ۱۶۰ ساده",
        options: [
          { attribute: "bed-width", value: "160" },
          { attribute: "bed-base", value: "fixed" },
        ],
        measurements: [
          { labelFa: "عرض کلی", value: 177, unit: "cm" },
          { labelFa: "وزن", value: 75, unit: "kg" },
        ],
        mainImage: img1Id || undefined,
      },
      {
        nilperCode: "NBSB852005",
        title: "تخت خواب مانی عرض ۱۶۰ جک‌دار",
        options: [
          { attribute: "bed-width", value: "160" },
          { attribute: "bed-base", value: "lift" },
        ],
        measurements: [
          { labelFa: "عرض کلی", value: 177, unit: "cm" },
          { labelFa: "وزن", value: 75, unit: "kg" },
        ],
        mainImage: img2Id || undefined,
      },
      {
        nilperCode: "NBSB852002",
        title: "تخت خواب مانی عرض ۱۸۰ ساده",
        options: [
          { attribute: "bed-width", value: "180" },
          { attribute: "bed-base", value: "fixed" },
        ],
        measurements: [
          { labelFa: "عرض کلی", value: 197, unit: "cm" },
          { labelFa: "وزن", value: 80, unit: "kg" },
        ],
        mainImage: img1Id || undefined,
      },
      {
        nilperCode: "NBSB852006",
        title: "تخت خواب مانی عرض ۱۸۰ جک‌دار",
        options: [
          { attribute: "bed-width", value: "180" },
          { attribute: "bed-base", value: "lift" },
        ],
        measurements: [
          { labelFa: "عرض کلی", value: 197, unit: "cm" },
          { labelFa: "وزن", value: 80, unit: "kg" },
        ],
        mainImage: img2Id || undefined,
      },
    ],
  };

  console.log("Calling catalogCreateProductDraft for Mani bed...");
  const response = await sendMcpRequest({
    jsonrpc: "2.0",
    id: `create-mani-${Date.now()}`,
    method: "tools/call",
    params: {
      name: "catalogCreateProductDraft",
      arguments: payload,
    },
  });

  if (response.error) {
    throw new Error(`MCP Error: ${JSON.stringify(response.error)}`);
  }

  console.log("Product draft created successfully!");
  console.log(response.result?.content?.[0]?.text);
}

async function main() {
  console.log("Step 1: Optimizing images to WebP Q70...");
  const base64Img1 = await optimizeImage(IMG1_PATH);
  const base64Img2 = await optimizeImage(IMG2_PATH);

  console.log("Step 2: Uploading images to Payload media library...");
  let media1 = await uploadImage({
    base64: base64Img1,
    alt: "تخت خواب مدرن مانی نیلپر با تاج پارچه‌ای",
    productSlug: "mani-bed",
    captionFa: "تخت خواب دو نفره مانی نیلپر با پوشش پارچه‌ای و طراحی مدرن",
  });

  let media2 = await uploadImage({
    base64: base64Img2,
    alt: "تخت خواب جک‌دار مانی نیلپر با فضای انبارش",
    productSlug: "mani-bed",
    captionFa: "تخت خواب جک‌دار مانی نیلپر با کفی بازشو و فضای انبارش زیر تخت",
  });

  console.log("Uploaded Media IDs:", media1?.id, media2?.id);

  console.log("Step 3: Creating Mani Bed product draft with 4 real SKU variants...");
  await createManiBedDraft(media1?.id, media2?.id);
}

main().catch(console.error);
