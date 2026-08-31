import "server-only";

import { products } from "@/features/catalog/catalog-data";
import { brandRegistry } from "./brand-registry";

export type Publication =
  | { status: "demo" }
  | { status: "published"; updatedAt: string; verification: { approvedAt: string; evidence: string } };

export type ShowcaseImage = { src: string; alt: string; caption: string };
export type BrandProfile = {
  slug: string; name: string; title: string; description: string; story: string;
  image: ShowcaseImage; publication: Publication;
};
export type Project = {
  slug: string; title: string; sector: "residential" | "hospitality";
  description: string; brief: string; image: ShowcaseImage;
  approach: { title: string; text: string }[];
  palette: { name: string; color: string }[];
  gallery: ShowcaseImage[]; productIds: string[]; articleSlug: string;
  publication: Publication;
};

const living: ShowcaseImage = { src: "/placeholders/living.jpg", alt: "نشیمن روشن با کاناپه طوسی، میز چوبی و گیاهان کنار پنجره", caption: "تصویر الهام‌بخش؛ عکاسی پروژه اجراشده توسط ان‌پی نیست." };
const lobby: ShowcaseImage = { src: "/placeholders/project.jpg", alt: "لابی با ستون‌های سنگی، لوسترهای برنجی و نشیمن آبی و زرد", caption: "تصویر مرجع برای مطالعه فضا؛ ارتباط اجرایی با ان‌پی ندارد." };
const bright: ShowcaseImage = { src: "/placeholders/dining.jpg", alt: "نشیمن روشن با مبل کرم، میز گرد و تزئینات حصیری دیوار", caption: "تصویر الهام‌بخش برای ترکیب رنگ و بافت؛ نمونه اجرا نیست." };
const sofa: ShowcaseImage = { src: "/placeholders/sofa.jpg", alt: "کاناپه سبز با پایه‌های چوبی مقابل دیوار صورتی روشن", caption: "تصویر نمایشی کاتالوگ؛ تصویر تأییدشده این برند نیست." };

const brandCopy = [
  { title: "جایی برای مکث", description: "کاناپه و صندلی راحتی؛ نگاهی به انتخاب نشیمن در کاتالوگ نمایشی NOMA.", story: "برای انتخاب نشیمن، از اندازه اتاق و نحوه استفاده روزمره شروع کنید. در این مجموعه نمایشی، کاناپه لونا و صندلی آرا کنار هم قرار گرفته‌اند تا مقایسه ابعاد، رنگ و تعداد نشیمن ساده‌تر شود. پیش از سفارش، اندازه‌گیری فضا و بررسی نمونه پارچه را در نظر بگیرید.", image: sofa },
  { title: "نور، در مقیاس زندگی", description: "آویز، چراغ رومیزی و چراغ ایستاده در مجموعه نمایشی LUMIA.", story: "نور یک اتاق می‌تواند از چند منبع تأمین شود: آویز برای روشنایی عمومی، چراغ رومیزی برای یک گوشه و چراغ ایستاده کنار نشیمن. مجموعه نمایشی حاضر این سه نوع را کنار هم می‌گذارد. برای انتخاب نهایی، ابعاد، محل اتصال برق و مشخصات فنی هر چراغ باید بررسی شود.", image: { ...lobby, caption: "تصویر الهام‌بخش نورپردازی؛ محصولات این برند در تصویر تأیید نشده‌اند." } },
  { title: "فرم‌های همراه", description: "صندلی و نیمکت برای بررسی چیدمان در مجموعه نمایشی FORMA.", story: "گاهی یک صندلی یا نیمکت، استفاده از گوشه‌ای از خانه را تغییر می‌دهد. این مجموعه نمایشی روی نشیمن‌های مستقل تمرکز دارد. محصول را با مسیر رفت‌وآمد، ارتفاع میز و کاربرد اتاق مقایسه کنید؛ انتخاب رنگ و روکش، مرحله بعدی این تصمیم است.", image: { ...living, caption: "تصویر الهام‌بخش چیدمان؛ تصویر رسمی برند نیست." } },
  { title: "پیرامون یک میز", description: "میز و کنسول در کاتالوگ نمایشی CASA N؛ نقطه شروعی برای مقایسه ابعاد و متریال.", story: "میز غذاخوری و کنسول، دو نقش متفاوت در خانه دارند: یکی محل جمع شدن و دیگری سطحی برای نظم و نمایش. این مجموعه نمایشی امکان مقایسه این انتخاب‌ها را فراهم می‌کند. پیش از انتخاب، فضای باز شدن صندلی‌ها و فاصله میز از مسیر حرکت را روی پلان بررسی کنید.", image: { ...bright, caption: "تصویر مرجع فضای داخلی؛ نمایش محصول واقعی برند نیست." } },
  { title: "جزئیات، با دقت بیشتر", description: "آینه و میز کنارمبلی در مجموعه نمایشی ATELIER؛ انتخاب‌هایی برای تکمیل فضا.", story: "جزئیات زمانی به فضا کمک می‌کنند که کارکرد مشخصی داشته باشند. یک میز کوچک کنار صندلی یا آینه در ورودی را با توجه به ارتفاع، فاصله و بازتاب نور انتخاب کنید. این مجموعه نمایشی، نقطه شروع مقایسه چند محصول کاتالوگ است و معرفی رسمی سازنده محسوب نمی‌شود.", image: { ...lobby, caption: "تصویر الهام‌بخش جزئیات؛ تصویر رسمی یا محصول تأییدشده برند نیست." } },
  { title: "بافت، زیر پای خانه", description: "فرش در کاتالوگ نمایشی MÉRIDIEN؛ بررسی اندازه و نسبت آن با مبلمان.", story: "فرش محدوده نشیمن را مشخص می‌کند و رنگ و بافت دیگری به اتاق می‌آورد. در این مجموعه نمایشی، فرش راوی برای بررسی مشخصات کاتالوگ قرار گرفته است. اندازه مناسب را با جای پایه‌های مبلمان، باز شدن در و امکان نظافت بسنجید و رنگ را با نمونه واقعی مقایسه کنید.", image: { ...living, caption: "تصویر الهام‌بخش نشیمن؛ تصویر تأییدشده فرش این برند نیست." } },
];

export const brands: BrandProfile[] = brandRegistry.map((brand, index) => ({ ...brand, ...brandCopy[index], publication: { status: "demo" } }));
export const projects: Project[] = [
  {
    slug: "a-welcoming-lobby", title: "اولین مکث، اولین حس", sector: "hospitality",
    description: "مطالعه‌ای نمایشی برای یک لابی مهمان‌پذیر؛ تعادل میان شکوه فضا، مسیر حرکت و گوشه‌های گفت‌وگو.",
    brief: "در این کانسپت، لابی فقط محل عبور نیست. ایده، ساختن چند محدوده نشستن است که مهمان بتواند در آن منتظر بماند، گفت‌وگو کند یا برای لحظه‌ای از رفت‌وآمد فاصله بگیرد. تصاویر، مرجع بصری این مطالعه‌اند و گزارشی از یک پروژه اجراشده توسط ان‌پی نیستند.",
    image: lobby,
    approach: [
      { title: "ورودی خوانا، حرکت آزاد", text: "چیدمان اولیه را از مسیر ورود تا پذیرش شروع می‌کنیم. گروه‌های نشیمن باید از مسیر اصلی فاصله داشته باشند؛ تعداد و ابعاد واقعی آن‌ها با پلان، ظرفیت فضا و ضوابط دسترسی تعیین می‌شود." },
      { title: "چند مقیاس برای نشستن", text: "ترکیب کاناپه و صندلی مستقل، امکان انتظار کوتاه یا گفت‌وگوی چند نفره را فراهم می‌کند. در این مطالعه، میزهای کوچک نقش رابط را دارند؛ محصول نهایی باید از نظر دوام و نگهداری برای کاربرد عمومی بررسی شود." },
      { title: "نور و بافت در کنار هم", text: "در کنار روشنایی کلی، نور موضعی می‌تواند محدوده هر نشیمن را مشخص کند. رنگ‌های گرم در کنار سطوح سنگی، پیشنهاد بصری این کانسپت‌اند؛ برای اجرا، نمونه متریال و محاسبات نور لازم است." },
    ],
    palette: [{ name: "سنگ روشن", color: "#ccc5b9" }, { name: "آبی عمیق", color: "#374e59" }, { name: "برنج", color: "#ac8950" }],
    gallery: [living, bright], productIds: ["luna", "vera", "linea", "dora"], articleSlug: "layered-lighting-at-home", publication: { status: "demo" },
  },
  {
    slug: "a-room-to-slow-down", title: "خانه، با ریتم آرام‌تر", sector: "residential",
    description: "کانسپت نمایشی یک نشیمن روزمره؛ بافت‌های گرم، نور طبیعی و فضایی برای کنار هم بودن.",
    brief: "این مطالعه از یک پرسش ساده آغاز می‌شود: نشیمن چطور می‌تواند هم محل استراحت باشد و هم فضای دیدار؟ پاسخ پیشنهادی، یک چیدمان جمع‌وجور با مبلمان مستقل و مسیرهای روشن است. این صفحه، تمرین انتخاب و ترکیب محصولات است؛ نه معرفی خانه یک مشتری.",
    image: living,
    approach: [
      { title: "اول، نسبت‌ها", text: "پیش از انتخاب رنگ، اندازه مبلمان را با اتاق مقایسه می‌کنیم. جای باز شدن در، مسیر پنجره و محل نشستن روزمره باید روی یک پلان ساده مشخص شوند تا کاناپه از نظر بصری و کاربردی متناسب باشد." },
      { title: "بافت‌های نزدیک، فرم‌های متفاوت", text: "چوب و پارچه می‌توانند حس مشترکی بسازند، بدون آنکه همه قطعات یک‌شکل باشند. پیشنهاد این مطالعه، تکرار محدود رنگ‌ها و تفاوت در اندازه و فرم صندلی و میز است." },
      { title: "گوشه‌ای برای خواندن", text: "یک صندلی مستقل کنار منبع نور، کاربرد دیگری به نشیمن می‌دهد. فاصله چراغ از چشم، محل قرار گرفتن کتاب و دسترسی به میز کوچک را هم‌زمان با زیبایی چیدمان بررسی می‌کنیم." },
    ],
    palette: [{ name: "کرم گرم", color: "#ded3bf" }, { name: "چوب طبیعی", color: "#917053" }, { name: "سبز ملایم", color: "#788070" }],
    gallery: [bright, { ...sofa, caption: "مرجع رنگ و فرم نشیمن؛ محصول نصب‌شده در این فضا نیست." }], productIds: ["luna", "ara", "dora", "ravi"], articleSlug: "choosing-sofa-dimensions", publication: { status: "demo" },
  },
  {
    slug: "light-and-texture", title: "روشن، ساده، نزدیک", sector: "residential",
    description: "یک مطالعه نمایشی درباره نشیمن روشن؛ لایه‌های رنگ خنثی، فرم‌های نرم و جزئیات کاربردی.",
    brief: "در این کانسپت، هدف از سادگی خالی کردن اتاق نیست؛ هر قطعه باید دلیل روشنی برای حضور داشته باشد. یک محدوده نشستن، سطحی در دسترس برای وسایل روزمره و نور قابل تنظیم، پایه این پیشنهادند. تصاویر برای الهام انتخاب شده‌اند و نمونه اجرای ان‌پی نیستند.",
    image: bright,
    approach: [
      { title: "رنگ کم، تنوع بافت", text: "در یک طیف روشن، تفاوت میان سطح چوب، بافت پارچه و جزئیات فلزی بیشتر دیده می‌شود. نمونه‌ها را کنار هم و زیر نور واقعی اتاق بررسی می‌کنیم؛ عکس به تنهایی معیار دقیقی برای رنگ نیست." },
      { title: "میز در دسترس", text: "میز کنارمبلی باید با ارتفاع نشیمن و نحوه استفاده تناسب داشته باشد. در این مطالعه، از سطوح کوچک و مستقل برای انعطاف در چیدمان استفاده می‌شود؛ فاصله‌ها پس از اندازه‌گیری واقعی تعیین می‌شوند." },
      { title: "اتاقی برای زندگی روزمره", text: "سهولت نظافت، دسترسی به پنجره و مسیر حرکت به اندازه تصویر نهایی اهمیت دارند. پیش از نهایی کردن چیدمان، یک روز معمولی در این فضا را مرور می‌کنیم و جای وسایل پرکاربرد را مشخص می‌کنیم." },
    ],
    palette: [{ name: "شیری", color: "#e9e3d7" }, { name: "حصیری", color: "#b99c77" }, { name: "ذغالی", color: "#484743" }],
    gallery: [living, { ...sofa, caption: "مطالعه تضاد رنگ پارچه؛ تصویر محصول اجراشده در این فضا نیست." }], productIds: ["vera", "aura", "arta", "ravi"], articleSlug: "living-room-with-room-to-breathe", publication: { status: "demo" },
  },
];

export const sectorLabels = { residential: "مسکونی", hospitality: "هتلداری" };
export const getBrand = (slug: string) => brands.find((brand) => brand.slug === slug);
export const getProject = (slug: string) => projects.find((project) => project.slug === slug);
export const brandProducts = (brand: BrandProfile) => products.filter((product) => product.brand === brand.name);
export const projectProducts = (project: Project) => project.productIds.map((id) => products.find((product) => product.id === id)).filter((product) => product !== undefined);
export function directoryRecords<T extends { publication: Publication }>(records: T[]): T[] {
  const published = records.filter((record) => record.publication.status === "published");
  return published.length ? published : records;
}
