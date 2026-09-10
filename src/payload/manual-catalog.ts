export type ManualMeasurement = {
  key: string;
  labelFa: string;
  value: number;
  unit: "cm" | "kg" | "m" | "unit";
  sortOrder: number;
};

export type ManualTechnicalSpec = {
  key: string;
  labelFa: string;
  valueFa: string;
  group: "identity" | "construction" | "materials" | "comfort" | "finish" | "delivery" | "care" | "other";
  sortOrder: number;
};

type ManualVariantType = {
  name: string;
  label: string;
  options: Array<{ value: string; label: string }>;
};

type ManualVariant = {
  code: string;
  title: string;
  options: string[];
  measurements?: ManualMeasurement[];
  manufacturingNotesFa?: string;
  dataQualityNotes?: string;
};

export type ManualCatalogProduct = {
  workbookKey: string;
  file: string;
  sheet: string;
  identityRaw: string;
  catalogCode: string;
  dataQualityNotes?: string;
  title: string;
  slug: string;
  descriptionFa: string;
  orderNotesFa?: string;
  image: {
    filename: string;
    source: string;
    alt: string;
  };
  category: "bedroom" | "dining-seating" | "home-furniture";
  series: {
    slug: string;
    title: string;
    styleFa: string;
    descriptionFa: string;
  };
  configurationGroupKeys?: Array<"wood-finish" | "upholstery-palette">;
  measurements?: ManualMeasurement[];
  technicalSpecs: ManualTechnicalSpec[];
  variantTypes: ManualVariantType[];
  variants: ManualVariant[];
};

const measurement = (
  key: string,
  labelFa: string,
  value: number,
  unit: ManualMeasurement["unit"],
  sortOrder: number,
): ManualMeasurement => ({ key, labelFa, value, unit, sortOrder });

const spec = (
  key: string,
  labelFa: string,
  valueFa: string,
  group: ManualTechnicalSpec["group"],
  sortOrder: number,
): ManualTechnicalSpec => ({ key, labelFa, valueFa, group, sortOrder });

const bedWidthType: ManualVariantType = {
  name: "bed-width",
  label: "عرض تشک",
  options: [
    { value: "160", label: "عرض ۱۶۰" },
    { value: "180", label: "عرض ۱۸۰" },
  ],
};

const bedBaseType: ManualVariantType = {
  name: "bed-base",
  label: "نوع کفی",
  options: [
    { value: "fixed", label: "کفی ثابت" },
    { value: "lift", label: "کفی جک‌دار" },
  ],
};

const finishClassType: ManualVariantType = {
  name: "finish-class",
  label: "رده پرداخت",
  options: [
    { value: "stained", label: "رنگی" },
    { value: "coated", label: "رنگ پوششی" },
  ],
};

export const manualCatalogProducts: ManualCatalogProduct[] = [
  {
    workbookKey: "886",
    file: "886.xlsx",
    sheet: "NBSB886",
    identityRaw: "تخت خواب سری86 (NBSB 886)",
    catalogCode: "NBSB 886",
    title: "تخت خواب داران",
    slug: "daran-bed",
    descriptionFa: "تخت داران به صورت ترکیبی از چوب و پارچه، با تاج بلند لمسه‌کوبی و دکمه‌دار در سبک نئوکلاسیک طراحی شده است. بدنه MDF با روکش طبیعی چوب راش و تاج نرم، فضایی راحت برای استراحت و مطالعه فراهم می‌کند.",
    orderNotesFa: "پایه‌ها قابل سفارش در کالیته رنگ چوب نیلپر هستند.",
    image: {
      filename: "daran-bed.webp",
      source: "src/payload/seed-assets/catalog/daran-bed.webp",
      alt: "تخت خواب داران",
    },
    category: "bedroom",
    series: {
      slug: "daran",
      title: "داران",
      styleFa: "نئوکلاسیک",
      descriptionFa: "سری خواب داران شامل تخت، دراور و آینه، پاتختی و استول هماهنگ است.",
    },
    configurationGroupKeys: ["wood-finish"],
    measurements: [
      measurement("height", "ارتفاع کلی", 123, "cm", 10),
      measurement("width", "عرض کلی", 173, "cm", 20),
      measurement("length", "طول کلی", 225, "cm", 30),
      measurement("weight", "وزن", 80, "kg", 40),
    ],
    technicalSpecs: [
      spec("headboard-frame", "جنس تاج تخت", "MDF و چوب چندلایی", "construction", 10),
      spec("body", "جنس بدنه", "MDF با روکش طبیعی چوب راش", "materials", 20),
      spec("headboard-cover", "نوع روکش تاج", "پارچه", "materials", 30),
      spec("leg", "جنس پایه", "چوب راش", "construction", 40),
      spec("filling", "جنس پرکننده", "ورق اسفنجی برش‌خورده", "comfort", 50),
      spec("base-frame", "جنس اسکلت کفی", "آهنی", "construction", 60),
      spec("storage", "فضای انبارش", "ندارد", "other", 70),
      spec("delivery", "شرایط تحویل", "دمونتاژ", "delivery", 80),
    ],
    variantTypes: [{
      name: "bed-rail-finish",
      label: "نوع قید تخت",
      options: [
        { value: "upholstered", label: "قیدهای روکش‌شده" },
        { value: "plain", label: "قیدهای بدون روکش" },
      ],
    }],
    variants: [
      { code: "NBSB886001", title: "قیدهای روکش‌شده", options: ["bed-rail-finish:upholstered"] },
      { code: "NBSB886005", title: "قیدهای بدون روکش", options: ["bed-rail-finish:plain"] },
    ],
  },
  {
    workbookKey: "850",
    file: "850.xlsx",
    sheet: "تخت 850",
    identityRaw: "تخت خواب (NBSB 850)",
    catalogCode: "NBSB 850",
    dataQualityNotes: "منبع برای عرض ۱۸۰ ابعاد دارد اما در همین برگه فقط کدهای ثبت عرض ۱۶۰ درج شده‌اند؛ گونه عرض ۱۸۰ ساخته نشده است.",
    title: "تخت خواب ژیوار",
    slug: "zhivar-bed",
    descriptionFa: "تخت نئوکلاسیک ژیوار ترکیبی از پارچه و چوب ابزارخورده است. لمسه‌کوبی سرتخت امکان هماهنگی با منسوجات اتاق خواب را فراهم می‌کند و فرم آن برای چیدمان‌های کلاسیک و نئوکلاسیک مناسب است.",
    orderNotesFa: "وزن تشک هنگام سفارش پرسیده شود؛ این مقدار در انتخاب نوع جک تخت مؤثر است.",
    image: {
      filename: "zhivar-bed.webp",
      source: "src/payload/seed-assets/catalog/zhivar-bed.webp",
      alt: "تخت خواب ژیوار",
    },
    category: "bedroom",
    series: {
      slug: "zhivar",
      title: "ژیوار",
      styleFa: "نئوکلاسیک",
      descriptionFa: "سری خواب ژیوار با جزئیات چوبی و فرم نئوکلاسیک طراحی شده است.",
    },
    configurationGroupKeys: ["wood-finish"],
    measurements: [
      measurement("height", "ارتفاع کلی", 119, "cm", 10),
      measurement("length", "طول کلی", 222, "cm", 20),
    ],
    technicalSpecs: [
      spec("headboard-frame", "جنس تاج تخت", "چوب راش", "construction", 10),
      spec("body", "جنس بدنه", "چوب راش", "materials", 20),
      spec("headboard-cover", "نوع روکش تاج", "پارچه و چوب راش", "materials", 30),
      spec("leg", "جنس پایه", "چوب راش", "construction", 40),
      spec("filling", "جنس پرکننده", "ورق اسفنجی", "comfort", 50),
      spec("base-frame", "جنس اسکلت کفی", "آهنی", "construction", 60),
      spec("storage", "فضای انبارش", "ندارد", "other", 70),
      spec("delivery", "شرایط تحویل", "دمونتاژ؛ مونتاژ در محل مشتری توسط نیلپر", "delivery", 80),
    ],
    variantTypes: [bedWidthType, bedBaseType],
    variants: [
      {
        code: "NBSB850001",
        title: "عرض ۱۶۰ با کفی ثابت",
        options: ["bed-width:160", "bed-base:fixed"],
        measurements: [measurement("width", "عرض کلی", 179, "cm", 10), measurement("weight", "وزن", 85, "kg", 20)],
      },
      {
        code: "NBSB850002",
        title: "عرض ۱۶۰ با کفی جک‌دار",
        options: ["bed-width:160", "bed-base:lift"],
        measurements: [measurement("width", "عرض کلی", 179, "cm", 10), measurement("weight", "وزن", 85, "kg", 20)],
      },
    ],
  },
  {
    workbookKey: "853",
    file: "853.xlsx",
    sheet: "تخت 853",
    identityRaw: "تخت خواب (NBSB 853)",
    catalogCode: "NBSB 853",
    title: "تخت خواب اورامان",
    slug: "uraman-bed",
    descriptionFa: "تخت خواب اورامان در سبک پست‌مدرن و با ترکیبی از پارچه، فوم و چوب طراحی شده است. خطوط خمیده و دوخت‌های موازی، در کنار تاج نرم، راحتی و ظرافت را هم‌زمان به اتاق خواب می‌آورند.",
    orderNotesFa: "وزن تشک هنگام سفارش پرسیده شود؛ این مقدار در انتخاب نوع جک تخت مؤثر است.",
    image: {
      filename: "uraman-bed.webp",
      source: "src/payload/seed-assets/catalog/uraman-bed.webp",
      alt: "تخت خواب اورامان",
    },
    category: "bedroom",
    series: {
      slug: "uraman",
      title: "اورامان",
      styleFa: "پست‌مدرن",
      descriptionFa: "سری خواب اورامان با خطوط منحنی، سطوح نرم و فرم پست‌مدرن طراحی شده است.",
    },
    measurements: [measurement("height", "ارتفاع کلی", 120, "cm", 10), measurement("length", "طول کلی", 208, "cm", 20)],
    technicalSpecs: [
      spec("headboard-frame", "جنس تاج تخت", "MDF با روکش ملامینه", "construction", 10),
      spec("body", "جنس بدنه", "MDF با روکش ملامینه", "materials", 20),
      spec("headboard-cover", "نوع روکش تاج", "پارچه و روکش ملامینه", "materials", 30),
      spec("leg", "جنس پایه", "بدون پایه", "construction", 40),
      spec("filling", "جنس پرکننده", "ورق اسفنجی", "comfort", 50),
      spec("base-frame", "جنس اسکلت کفی", "آهنی", "construction", 60),
      spec("storage", "فضای انبارش", "ندارد", "other", 70),
      spec("delivery", "شرایط تحویل", "دمونتاژ؛ مونتاژ در محل مشتری توسط نیلپر", "delivery", 80),
    ],
    variantTypes: [bedWidthType, bedBaseType],
    variants: [
      { code: "NBSB853001", title: "عرض ۱۶۰ با کفی ثابت", options: ["bed-width:160", "bed-base:fixed"], measurements: [measurement("width", "عرض کلی", 168, "cm", 10), measurement("weight", "وزن", 160, "kg", 20)] },
      { code: "NBSB853005", title: "عرض ۱۶۰ با کفی جک‌دار", options: ["bed-width:160", "bed-base:lift"], measurements: [measurement("width", "عرض کلی", 168, "cm", 10), measurement("weight", "وزن", 160, "kg", 20)] },
      { code: "NBSB853003", title: "عرض ۱۸۰ با کفی ثابت", options: ["bed-width:180", "bed-base:fixed"], measurements: [measurement("width", "عرض کلی", 188, "cm", 10), measurement("weight", "وزن", 175, "kg", 20)] },
      { code: "NBSB853004", title: "عرض ۱۸۰ با کفی جک‌دار", options: ["bed-width:180", "bed-base:lift"], measurements: [measurement("width", "عرض کلی", 188, "cm", 10), measurement("weight", "وزن", 175, "kg", 20)] },
    ],
  },
  {
    workbookKey: "852",
    file: "852.xlsx",
    sheet: "NBSB886",
    identityRaw: "تخت خواب (NBSB 852)",
    catalogCode: "NBSB 852",
    dataQualityNotes: "نام برگه NBSB886 است، در حالی که محتوای آن محصول NBSB 852 را معرفی می‌کند. عرض گونه ۱۸۰ در سلول E25 برابر 97 cm ثبت شده و به علت مشکوک بودن، به عنوان اندازه تأییدشده نمایش داده نشده است.",
    title: "تخت خواب مانی",
    slug: "mani-bed",
    descriptionFa: "تخت خواب مانی با طراحی مدرن، پوشش پارچه‌ای و بدنه و تاج مستحکم، فضایی راحت برای استراحت و مطالعه ایجاد می‌کند. فضای انبارش زیر تخت نیز در منبع برای این مدل تأیید شده است.",
    orderNotesFa: "وزن تشک هنگام سفارش پرسیده شود؛ این مقدار در انتخاب نوع جک تخت مؤثر است.",
    image: {
      filename: "mani-bed.webp",
      source: "src/payload/seed-assets/catalog/mani-bed.webp",
      alt: "تخت خواب مانی",
    },
    category: "bedroom",
    series: {
      slug: "mani",
      title: "مانی",
      styleFa: "مدرن",
      descriptionFa: "سری خواب مانی با بدنه پارچه‌ای، تاج نرم و فضای انبارش طراحی شده است.",
    },
    measurements: [measurement("height", "ارتفاع کلی", 95, "cm", 10), measurement("length", "طول کلی", 220, "cm", 20)],
    technicalSpecs: [
      spec("headboard-frame", "جنس تاج تخت", "MDF و چوب چندلایی", "construction", 10),
      spec("body", "جنس بدنه", "MDF با روکش پارچه", "materials", 20),
      spec("headboard-cover", "نوع روکش تاج", "پارچه", "materials", 30),
      spec("leg", "جنس پایه", "چوب راش", "construction", 40),
      spec("filling", "جنس پرکننده", "ویسکوز", "comfort", 50),
      spec("base-frame", "جنس اسکلت کفی", "آهنی", "construction", 60),
      spec("storage", "فضای انبارش", "دارد", "other", 70),
      spec("delivery", "شرایط تحویل", "دمونتاژ", "delivery", 80),
    ],
    variantTypes: [bedWidthType, bedBaseType],
    variants: [
      { code: "NBSB852004", title: "عرض ۱۶۰ ساده", options: ["bed-width:160", "bed-base:fixed"], measurements: [measurement("width", "عرض کلی", 177, "cm", 10), measurement("weight", "وزن", 75, "kg", 20)] },
      { code: "NBSB852005", title: "عرض ۱۶۰ جک‌دار", options: ["bed-width:160", "bed-base:lift"], measurements: [measurement("width", "عرض کلی", 177, "cm", 10), measurement("weight", "وزن", 75, "kg", 20)] },
      { code: "NBSB852002", title: "عرض ۱۸۰ ساده", options: ["bed-width:180", "bed-base:fixed"], measurements: [measurement("weight", "وزن", 80, "kg", 20)], dataQualityNotes: "عرض 97 cm عیناً در سلول E25 منبع ثبت شده اما تا تأیید نیلپر به عنوان اندازه ساختاریافته استفاده نشده است." },
      { code: "NBSB852006", title: "عرض ۱۸۰ جک‌دار", options: ["bed-width:180", "bed-base:lift"], measurements: [measurement("weight", "وزن", 80, "kg", 20)], dataQualityNotes: "عرض 97 cm عیناً در سلول E25 منبع ثبت شده اما تا تأیید نیلپر به عنوان اندازه ساختاریافته استفاده نشده است." },
    ],
  },
  {
    workbookKey: "506",
    file: "506.xlsx",
    sheet: "NDTN506",
    identityRaw: "NDTN506",
    catalogCode: "NDTN506",
    dataQualityNotes: "کدهای ثبت NDTN507003 و NDTN507004 با شماره کاتالوگ و نام برگه 506 هم‌خوان نیستند؛ عیناً و بدون اصلاح نگهداری شده‌اند.",
    title: "صندلی بار ویونا",
    slug: "viona-bar-chair",
    descriptionFa: "صندلی بار ویونا با پایه‌های چوبی ظریف، پشتی و نشیمن حجیم و راحت و طراحی ارگونومیک، برای هماهنگی با فضاهای متنوع داخلی طراحی شده است.",
    image: {
      filename: "viona-bar-chair.webp",
      source: "src/payload/seed-assets/catalog/viona-bar-chair.webp",
      alt: "صندلی بار ویونا",
    },
    category: "dining-seating",
    series: {
      slug: "viona",
      title: "ویونا",
      styleFa: "مدرن",
      descriptionFa: "سری ویونا با فرم مدرن، پایه چوبی و نشیمن ارگونومیک طراحی شده است.",
    },
    configurationGroupKeys: ["wood-finish"],
    measurements: [
      measurement("seat-height", "ارتفاع نشیمن", 70, "cm", 10),
      measurement("seat-width", "عرض نشیمن", 51, "cm", 20),
      measurement("seat-depth", "عمق نشیمن", 43, "cm", 30),
      measurement("height", "ارتفاع کلی", 97, "cm", 40),
      measurement("fabric", "متراژ پارچه", 1.5, "m", 50),
    ],
    technicalSpecs: [
      spec("frame", "جنس اسکلت", "چوب چندلایی", "construction", 10),
      spec("leg", "جنس پایه", "چوب راش", "construction", 20),
      spec("back", "جنس پشتی", "ابر اسفنجی", "comfort", 30),
      spec("back-type", "نوع پشتی", "یکپارچه با بدنه", "comfort", 40),
      spec("seat", "جنس نشیمن", "چوب چندلایی", "construction", 50),
      spec("seat-type", "نوع نشیمن", "یکپارچه با بدنه", "comfort", 60),
      spec("seat-cushion", "تشک نشیمن", "ابر اسفنجی", "comfort", 70),
      spec("delivery", "شرایط تحویل", "مونتاژ", "delivery", 80),
    ],
    variantTypes: [finishClassType],
    variants: [
      { code: "NDTN507003", title: "رنگی", options: ["finish-class:stained"], dataQualityNotes: "اختلاف 507/506 نیازمند تأیید نیلپر است." },
      { code: "NDTN507004", title: "رنگ پوششی", options: ["finish-class:coated"], dataQualityNotes: "اختلاف 507/506 نیازمند تأیید نیلپر است." },
    ],
  },
  {
    workbookKey: "885",
    file: "885.xlsx",
    sheet: "NBSB885",
    identityRaw: "تخت خواب سری 85 (NBSB 885)",
    catalogCode: "NBSB 885",
    title: "تخت خواب لاوان",
    slug: "lavan-bed",
    descriptionFa: "تخت لاوان با بدنه تمام‌پارچه، تاج بلند و لمسه‌کوبی لوزی‌شکل بدون دکمه در سبک نئوکلاسیک طراحی شده است. تاج نرم، فضای مناسبی برای استراحت و مطالعه فراهم می‌کند.",
    orderNotesFa: "پایه‌ها قابل سفارش در کالیته رنگ چوب نیلپر هستند.",
    image: {
      filename: "lavan-bed.webp",
      source: "src/payload/seed-assets/catalog/lavan-bed.webp",
      alt: "تخت خواب لاوان",
    },
    category: "bedroom",
    series: {
      slug: "lavan",
      title: "لاوان",
      styleFa: "نئوکلاسیک",
      descriptionFa: "سری خواب لاوان شامل تخت، دراور، پاتختی، استول و آینه قاب‌دار هماهنگ است.",
    },
    configurationGroupKeys: ["wood-finish"],
    measurements: [
      measurement("height", "ارتفاع کلی", 120, "cm", 10),
      measurement("width", "عرض کلی", 169, "cm", 20),
      measurement("length", "طول کلی", 218, "cm", 30),
      measurement("weight", "وزن", 80, "kg", 40),
    ],
    technicalSpecs: [
      spec("frame", "جنس اسکلت بدنه", "MDF و چوب چندلایی روکش‌شده با پارچه", "construction", 10),
      spec("cover", "نوع روکش", "پارچه", "materials", 20),
      spec("leg", "جنس پایه", "چوب راش", "construction", 30),
      spec("filling", "جنس پرکننده", "ورق اسفنجی برش‌خورده", "comfort", 40),
      spec("base-frame", "جنس اسکلت کفی", "آهنی", "construction", 50),
      spec("storage", "فضای انبارش", "ندارد", "other", 60),
      spec("delivery", "شرایط تحویل", "دمونتاژ", "delivery", 70),
    ],
    variantTypes: [{ name: "bed-form", label: "فرم تخت", options: [{ value: "standard", label: "استاندارد" }] }],
    variants: [{ code: "NBSB885001", title: "تخت خواب", options: ["bed-form:standard"] }],
  },
  {
    workbookKey: "851",
    file: "851.xlsx",
    sheet: "تخت 851",
    identityRaw: "تخت خواب (NBSB 851)",
    catalogCode: "NBSB 851",
    title: "تخت خواب ماهور",
    slug: "mahoor-bed",
    descriptionFa: "تخت ماهور در سبک پست‌مدرن با استفاده از چوب فرم‌دار طراحی شده است. لبه‌های متمایل به داخل و فرم نرم پایه‌ها، ظاهر ساده و در عین حال متمایزی به محصول می‌دهند.",
    orderNotesFa: "وزن تشک هنگام سفارش پرسیده شود؛ این مقدار در انتخاب نوع جک تخت مؤثر است.",
    image: {
      filename: "mahoor-bed.webp",
      source: "src/payload/seed-assets/catalog/mahoor-bed.webp",
      alt: "تخت خواب ماهور",
    },
    category: "bedroom",
    series: {
      slug: "mahoor",
      title: "ماهور",
      styleFa: "پست‌مدرن",
      descriptionFa: "سری خواب ماهور با پایه‌های مورب چوبی و فرم‌های ساده و نرم طراحی شده است.",
    },
    configurationGroupKeys: ["wood-finish"],
    measurements: [measurement("height", "ارتفاع کلی", 105, "cm", 10), measurement("length", "طول کلی", 210, "cm", 20)],
    technicalSpecs: [
      spec("headboard-frame", "جنس تاج تخت", "چوب راش و MDF", "construction", 10),
      spec("body", "جنس بدنه", "چوب راش و MDF", "materials", 20),
      spec("headboard-cover", "نوع روکش تاج", "چوب راش و MDF", "materials", 30),
      spec("leg", "جنس پایه", "چوب راش", "construction", 40),
      spec("base-frame", "جنس اسکلت کفی", "فلز و MDF", "construction", 50),
      spec("storage", "فضای انبارش", "ندارد", "other", 60),
      spec("delivery", "شرایط تحویل", "دمونتاژ؛ مونتاژ در محل مشتری توسط نیلپر", "delivery", 70),
    ],
    variantTypes: [bedWidthType, finishClassType],
    variants: [
      { code: "NBSB851004", title: "عرض ۱۶۰ رنگی", options: ["bed-width:160", "finish-class:stained"], measurements: [measurement("width", "عرض کلی", 168, "cm", 10), measurement("weight", "وزن", 74, "kg", 20)] },
      { code: "NBSB851003", title: "عرض ۱۶۰ رنگ پوششی", options: ["bed-width:160", "finish-class:coated"], measurements: [measurement("width", "عرض کلی", 168, "cm", 10), measurement("weight", "وزن", 74, "kg", 20)] },
      { code: "NBSB851002", title: "عرض ۱۸۰ رنگی", options: ["bed-width:180", "finish-class:stained"], measurements: [measurement("width", "عرض کلی", 188, "cm", 10), measurement("weight", "وزن", 82, "kg", 20)] },
      { code: "NBSB851001", title: "عرض ۱۸۰ رنگ پوششی", options: ["bed-width:180", "finish-class:coated"], measurements: [measurement("width", "عرض کلی", 188, "cm", 10), measurement("weight", "وزن", 82, "kg", 20)] },
    ],
  },
  {
    workbookKey: "871",
    file: "871.xlsx",
    sheet: "HSS 871",
    identityRaw: "مبل خانگی NHSS871",
    catalogCode: "NHSS871",
    dataQualityNotes: "کد NHSS871002 برای گونه چندرنگ تک‌نفره و سه‌نفره تکرار شده است. برای جلوگیری از ساخت دو SKU یکسان، فقط ثبت تک‌نفره نگهداری شده و گونه سه‌نفره چندرنگ تا تأیید نیلپر ایجاد نشده است.",
    title: "مبل دایان",
    slug: "dayan-sofa",
    descriptionFa: "مبل دایان با پشتی منحنی، دسته‌های رول‌شده رو به بیرون، لمسه‌دوزی پشتی و جزئیات تزئینی دست‌ساز در سبک نئوکلاسیک طراحی شده است و فضایی لوکس و مناسب گفت‌وگوهای صمیمی ایجاد می‌کند.",
    orderNotesFa: "با توجه به عمق نشیمن باید با کوسن استفاده شود. پارچه مناسب: مخمل، شنل یا ساده.",
    image: {
      filename: "dayan-sofa.webp",
      source: "src/payload/seed-assets/catalog/dayan-sofa.webp",
      alt: "مبل دایان",
    },
    category: "home-furniture",
    series: {
      slug: "dayan",
      title: "دایان",
      styleFa: "نئوکلاسیک",
      descriptionFa: "سری دایان شامل مبل، میزهای هماهنگ و محصولات ناهارخوری است.",
    },
    configurationGroupKeys: ["wood-finish", "upholstery-palette"],
    technicalSpecs: [
      spec("frame", "جنس اسکلت بدنه و دسته", "چوب چندلایی", "construction", 10),
      spec("suspension", "نوع تعلیق", "تسمه‌کشی", "comfort", 20),
      spec("leg", "جنس پایه", "چوب راش گرجستان", "construction", 30),
      spec("backrest", "نوع پشتی", "یکپارچه با بدنه", "comfort", 40),
      spec("seat", "نوع نشیمن", "مجزا و متصل به بدنه", "comfort", 50),
      spec("back-cushion", "جنس تشک پشتی", "اسفنج ۳۵ کیلویی", "comfort", 60),
      spec("seat-cushion", "جنس تشک نشیمن", "فوم تزریقی پلی‌اورتان", "comfort", 70),
      spec("delivery", "شرایط تحویل", "مونتاژشده", "delivery", 80),
    ],
    variantTypes: [
      {
        name: "seating-form",
        label: "فرم نشیمن",
        options: [
          { value: "single-seat", label: "تک نفره" },
          { value: "three-seat", label: "سه نفره" },
        ],
      },
      {
        name: "upholstery-layout",
        label: "چیدمان رنگ پارچه",
        options: [
          { value: "monochrome", label: "تک‌رنگ" },
          { value: "polychrome", label: "چندرنگ" },
        ],
      },
    ],
    variants: [
      {
        code: "NHSS871003",
        title: "تک نفره تک‌رنگ",
        options: ["seating-form:single-seat", "upholstery-layout:monochrome"],
        measurements: [measurement("seat-height", "ارتفاع نشیمن", 46, "cm", 10), measurement("seat-depth", "عمق نشیمن", 53, "cm", 20), measurement("fabric", "متراژ پارچه بدون کوسن", 4.6, "m", 30)],
      },
      {
        code: "NHSS871002",
        title: "تک نفره چندرنگ",
        options: ["seating-form:single-seat", "upholstery-layout:polychrome"],
        measurements: [measurement("seat-height", "ارتفاع نشیمن", 46, "cm", 10), measurement("seat-depth", "عمق نشیمن", 53, "cm", 20), measurement("fabric", "متراژ پارچه بدون کوسن", 4.6, "m", 30)],
        dataQualityNotes: "همین کد در ردیف سه‌نفره چندرنگ نیز تکرار شده است.",
      },
      {
        code: "NHSS871007",
        title: "سه نفره تک‌رنگ",
        options: ["seating-form:three-seat", "upholstery-layout:monochrome"],
        measurements: [measurement("seat-height", "ارتفاع نشیمن", 46, "cm", 10), measurement("seat-depth", "عمق نشیمن", 60, "cm", 20), measurement("fabric", "متراژ پارچه بدون کوسن", 10.3, "m", 30)],
      },
    ],
  },
];
