import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpLeft,
  Building2,
  Hotel,
  Quote,
  Ruler,
  Sparkles,
} from "lucide-react";

import { SiteHeader } from "@/components/site-header";
import { ProductCard } from "@/components/product-card";
import { SectionHeading } from "@/components/section-heading";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { categories, products, spaces } from "@/data/catalog";

const journal = [
  { category: "راهنمای انتخاب", title: "چطور ابعاد درست مبلمان را برای فضای خود پیدا کنیم؟", image: "/placeholders/sofa.jpg", date: "۱۲ مرداد ۱۴۰۵" },
  { category: "متریال", title: "پارچه‌ای که با زندگی روزمره شما هماهنگ می‌ماند", image: "/placeholders/living.jpg", date: "۰۵ مرداد ۱۴۰۵" },
  { category: "نور و فضا", title: "سه لایه روشنایی برای ساختن یک فضای گرم و آرام", image: "/placeholders/lighting.jpg", date: "۲۹ تیر ۱۴۰۵" },
];

const services = [
  { title: "هتل‌ها", description: "لابی، اتاق‌ها و فضاهای عمومی هتل با یک نگاه یکپارچه.", icon: Hotel },
  { title: "بیمارستان‌ها", description: "تجهیز فضاهای درمانی با توجه به دوام، آرامش و عملکرد.", icon: Building2 },
  { title: "فضاهای کاری", description: "محیط‌های کاری منعطف، حرفه‌ای و هماهنگ با هویت برند.", icon: Ruler },
  { title: "رستوران و تجاری", description: "ساخت تجربه‌ای ماندگار از ورودی تا آخرین جزئیات فضا.", icon: Sparkles },
];

export default function Home() {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "گروه ام‌پی",
    alternateName: "MP Group",
    description: "عرضه مبلمان، روشنایی، پارچه و اکسسوری و تجهیز فضاهای مسکونی و تجاری",
    areaServed: "IR",
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }} />
      <div id="top" />
      <SiteHeader />

      <main>
        <section className="relative min-h-[calc(100svh-104px)] overflow-hidden bg-ink text-white">
          <video
            className="absolute inset-0 size-full object-cover"
            src="/videos/hero.mp4"
            poster="/placeholders/hero.jpg"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            aria-hidden="true"
          />
          <div className="image-wash absolute inset-0" />
          <div className="container-shell relative flex min-h-[calc(100svh-104px)] items-end pb-12 pt-24 sm:pb-16 lg:pb-20">
            <div className="grid w-full items-end gap-10 lg:grid-cols-[1fr_22rem]">
              <div>
                <p className="mb-5 flex items-center gap-3 text-xs tracking-[0.18em] text-white/75">
                  <Sparkles className="size-4 text-white" /> مجموعه تازه · پاییز ۱۴۰۵
                </p>
                <h1 className="text-balance max-w-4xl text-[clamp(3.2rem,9vw,8.5rem)] font-medium leading-[0.98] tracking-[-0.045em]">
                  خانه، روایتِ <span className="text-wine">شماست.</span>
                </h1>
              </div>
              <div className="border-t border-white/30 pt-6 lg:border-t-0 lg:border-r lg:pe-8 lg:pt-0">
                <p className="max-w-md text-sm leading-7 text-white/76 sm:text-base">
                  مجموعه‌ای از مبلمان، نور و جزئیات که برای ماندن انتخاب شده‌اند؛ برای خانه و هر فضایی که باید معنا داشته باشد.
                </p>
                <div className="mt-7 flex flex-wrap gap-3">
                  <Button asChild size="lg" className="h-11 rounded-none bg-white px-5 text-ink hover:bg-white">
                    <Link href="#categories">دیدن مجموعه <ArrowLeft /></Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="h-11 rounded-none border-white/50 bg-transparent px-5 text-white hover:bg-white/10 hover:text-white">
                    <Link href="#projects">برای پروژه‌ها</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
          <div className="absolute bottom-0 start-0 hidden w-44 border-t border-e border-white/20 p-4 text-[0.62rem] tracking-[0.2em] text-white/55 lg:block" dir="ltr">
            SCROLL TO DISCOVER
          </div>
        </section>

        <section id="categories" className="editorial-section py-20 sm:py-28 lg:py-36">
          <div className="container-shell">
            <SectionHeading eyebrow="انتخاب بر اساس دسته‌بندی" title="هر آنچه یک فضا را کامل می‌کند" link="همه محصولات" />
            <div className="grid gap-3 md:grid-cols-12 md:grid-rows-2 lg:gap-5">
              {categories.map((category) => (
                <Link key={category.title} href="/shop#products" className={`group relative min-h-80 overflow-hidden md:min-h-72 ${category.className}`}>
                  <Image src={category.image} alt={`دسته‌بندی ${category.title}`} fill sizes="(max-width: 768px) 100vw, 58vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />
                  <div className="image-wash absolute inset-0" />
                  <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-6 text-white sm:p-8">
                    <div><p className="mb-2 text-xs text-white/65">{category.count}</p><h3 className="text-2xl font-medium sm:text-3xl">{category.title}</h3></div>
                    <span className="grid size-11 place-items-center border border-white/40 transition-colors group-hover:bg-white group-hover:text-ink"><ArrowUpLeft /></span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="editorial-section border-y bg-card py-20 sm:py-28">
          <div className="container-shell">
            <SectionHeading eyebrow="منتخب این ماه" title="طراحی‌هایی برای امروز، کیفیتی برای سال‌ها" link="مشاهده همه" />
            <div className="grid auto-cols-[82%] grid-flow-col gap-4 overflow-x-auto pb-4 [scrollbar-width:none] md:grid-flow-row md:grid-cols-4 md:overflow-visible md:pb-0 lg:gap-6">
              {products.map((product) => <ProductCard key={product.name} product={product} />)}
            </div>
          </div>
        </section>

        <section id="spaces" className="editorial-section py-20 sm:py-28 lg:py-36">
          <div className="container-shell">
            <div className="mb-10 grid gap-6 lg:grid-cols-2 lg:items-end">
              <SectionHeading eyebrow="انتخاب بر اساس فضا" title="از یک اتاق شروع کنید" />
              <p className="max-w-xl text-sm leading-7 text-muted-foreground lg:justify-self-end lg:pb-3 sm:text-base">
                با دیدن محصولات در فضای واقعی، تناسب فرم، رنگ و نور را ساده‌تر انتخاب کنید. هر مجموعه برای ساختن یک حس کامل کنار هم قرار گرفته است.
              </p>
            </div>
            <div className="grid gap-5 md:grid-cols-3">
              {spaces.map((space, index) => (
                <Link key={space.title} href="#" className={`group relative overflow-hidden ${index === 1 ? "md:mt-14" : ""}`}>
                  <div className="relative aspect-[3/4] overflow-hidden">
                    <Image src={space.image} alt={`محصولات مناسب ${space.title}`} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.04]" />
                    <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/65 via-transparent to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 z-20 flex items-center justify-between p-5 text-white sm:p-6">
                      <h3 className="text-xl font-semibold drop-shadow-sm sm:text-2xl">{space.title}</h3>
                      <ArrowLeft className="size-5 shrink-0 drop-shadow-sm transition-transform group-hover:-translate-x-1" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section id="projects" className="editorial-section bg-wine-deep py-5 text-white sm:py-8">
          <div className="container-shell grid overflow-hidden bg-wine lg:grid-cols-[1.2fr_0.8fr]">
              <div className="relative min-h-[28rem] lg:min-h-[44rem]">
              <Image src="/placeholders/project.jpg" alt="پروژه تجهیز لابی هتل" fill sizes="(max-width: 1024px) 100vw, 60vw" className="object-cover" />
              <div className="absolute start-5 top-5 border border-white bg-transparent px-3 py-2 text-xs text-white">پروژه منتخب · ۱۴۰۵</div>
            </div>
            <div className="flex flex-col justify-between p-7 sm:p-10 lg:p-14">
              <div>
                <p className="mb-5 text-xs font-bold tracking-[0.16em] text-white">پروژه‌های ام‌پی</p>
                <h2 className="text-balance text-4xl font-bold leading-[1.25] text-white sm:text-5xl">فضاهایی که فقط دیده نمی‌شوند؛ تجربه می‌شوند.</h2>
                <p className="mt-7 text-sm font-medium leading-8 text-white sm:text-base">
                  از انتخاب محصول تا هماهنگی متریال و تحویل نهایی؛ برای هتل‌ها، رستوران‌ها، بیمارستان‌ها و فضاهای کاری در کنار شما هستیم.
                </p>
              </div>
              <div className="mt-12">
                <div className="grid grid-cols-2 border-y border-white py-6 text-sm text-white">
                  <span className="flex items-center gap-2"><Hotel className="size-4 text-white" /> هتلداری</span>
                  <span className="flex items-center gap-2"><Building2 className="size-4 text-white" /> فضای کار</span>
                </div>
                <Button asChild className="mt-7 h-11 rounded-none bg-white px-5 text-ink hover:bg-white/90">
                  <Link href="#contact">شروع یک پروژه <ArrowLeft className="text-black" /></Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section id="services" className="editorial-section bg-ink py-20 text-white sm:py-28 lg:py-36">
          <div className="container-shell">
            <div className="mb-12 grid gap-8 lg:grid-cols-[0.75fr_1.25fr] lg:items-end">
              <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.16em] text-white">
                <span className="h-px w-8 bg-wine" />تجهیز پروژه
              </p>
              <div>
                <h2 className="text-balance max-w-4xl text-3xl font-semibold leading-[1.35] sm:text-5xl">برای فضاهایی که باید درست کار کنند و خوب دیده شوند.</h2>
                <p className="mt-5 max-w-2xl text-sm leading-8 text-white/70 sm:text-base">از انتخاب محصول تا هماهنگی متریال و اجرای نهایی، کنار پروژه‌های شما هستیم.</p>
              </div>
            </div>
            <div className="grid border-y border-white/20 sm:grid-cols-2 lg:grid-cols-4">
              {services.map(({ title, description, icon: Icon }, index) => (
                <div key={title} className={`group border-b border-white/20 p-6 last:border-b-0 sm:p-8 lg:border-b-0 lg:border-e lg:last:border-e-0 ${index >= 2 ? "sm:border-b-0" : ""}`}>
                  <div className="mb-12 grid size-12 place-items-center bg-wine text-white transition-colors group-hover:bg-white group-hover:text-ink">
                    <Icon className="size-5" />
                  </div>
                  <h3 className="text-xl font-semibold">{title}</h3>
                  <p className="mt-3 text-sm leading-7 text-white/60">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="brands" className="editorial-section border-b py-18 sm:py-24">
          <div className="container-shell">
            <p className="mb-8 text-center text-xs tracking-[0.16em] text-muted-foreground">برندهای منتخب در مجموعه ام‌پی</p>
            <div className="grid grid-cols-2 border-y sm:grid-cols-3 lg:grid-cols-6">
              {["NOMA", "LUMIA", "FORMA", "CASA N", "ATELIER", "MÉRIDIEN"].map((brand) => (
                <Link key={brand} href="/shop#products" className="grid h-24 place-items-center border-b border-s text-sm font-semibold tracking-[0.16em] transition-colors hover:bg-wine hover:text-white sm:border-b-0 lg:h-28" dir="ltr">
                  {brand}
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section id="about" className="editorial-section py-20 sm:py-28 lg:py-36">
          <div className="container-shell grid gap-10 lg:grid-cols-[0.75fr_1.25fr] lg:gap-20">
            <div>
              <p className="flex items-center gap-2 text-xs tracking-[0.16em] text-wine"><Quote className="size-4" /> نگاه ما</p>
            </div>
            <div>
              <h2 className="text-balance text-3xl font-medium leading-[1.55] tracking-tight sm:text-4xl lg:text-5xl">
                لوکس بودن برای ما یعنی <span className="text-wine">انتخاب دقیق</span>؛ نه شلوغی. چیزی که امروز زیباست و فردا هم درست به نظر می‌رسد.
              </h2>
              <div className="mt-10 grid gap-6 border-t pt-8 text-sm leading-7 text-muted-foreground sm:grid-cols-2">
                <p>ما محصول را جدا از فضا نمی‌بینیم. مقیاس، بافت، نور و شیوه زندگی شما، بخشی از هر پیشنهاد ماست.</p>
                <p>از یک صندلی خاص تا تجهیز کامل یک پروژه، مسیر انتخاب را شفاف، ساده و شخصی نگه می‌داریم.</p>
              </div>
            </div>
          </div>
        </section>

        <section id="journal" className="editorial-section bg-card py-20 sm:py-28">
          <div className="container-shell">
            <SectionHeading eyebrow="مجله ام‌پی" title="ایده، متریال و راهنمای انتخاب" link="همه مطالب" />
            <div className="grid gap-8 md:grid-cols-3">
              {journal.map((post) => (
                <article key={post.title} className="group">
                  <Link href="#">
                    <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                      <Image src={post.image} alt={post.title} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />
                    </div>
                    <div className="flex items-center justify-between pt-5 text-xs text-muted-foreground"><span className="text-wine">{post.category}</span><time>{post.date}</time></div>
                    <h3 className="mt-3 text-xl font-medium leading-8 transition-colors group-hover:text-wine">{post.title}</h3>
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="contact" className="editorial-section overflow-hidden bg-white py-20 sm:py-28">
          <div className="container-shell relative">
            <Ruler className="absolute -start-12 -top-10 size-56 text-wine/8 sm:size-80" strokeWidth={0.6} />
            <div className="relative grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
              <div>
                <p className="mb-4 text-xs font-semibold tracking-[0.16em] text-wine">مشاوره پروژه</p>
                <h2 className="text-balance max-w-4xl text-4xl font-medium leading-[1.25] text-ink sm:text-6xl lg:text-7xl">برای فضایی که در ذهن دارید، از یک گفت‌وگو شروع کنیم.</h2>
              </div>
              <Button asChild size="lg" className="h-14 w-fit rounded-none bg-wine px-7 text-base hover:bg-wine-deep">
                <Link href="tel:+982100000000">درخواست مشاوره <ArrowLeft /></Link>
              </Button>
            </div>
          </div>
        </section>

      </main>

      <footer className="bg-ink pb-8 pt-16 text-white sm:pt-20">
        <div className="container-shell">
          <div className="grid gap-12 pb-14 md:grid-cols-2 lg:grid-cols-[1.3fr_0.7fr_0.7fr_0.9fr]">
            <div>
              <p className="text-3xl font-semibold">گروه ام‌پی</p>
              <p className="mt-5 max-w-sm text-sm leading-7 text-white/55">مبلمان، روشنایی و جزئیات انتخاب‌شده برای خانه‌ها و پروژه‌های ماندگار.</p>
            </div>
            <div><p className="mb-5 text-sm font-semibold text-white">مجموعه‌ها</p><ul className="space-y-3 text-sm text-white/55"><li><Link href="#categories">مبلمان</Link></li><li><Link href="#categories">روشنایی</Link></li><li><Link href="#categories">پارچه</Link></li><li><Link href="#categories">اکسسوری</Link></li></ul></div>
            <div><p className="mb-5 text-sm font-semibold text-white">ام‌پی</p><ul className="space-y-3 text-sm text-white/55"><li><Link href="#about">درباره ما</Link></li><li><Link href="#projects">پروژه‌ها</Link></li><li><Link href="#journal">مجله</Link></li><li><Link href="#contact">تماس با ما</Link></li></ul></div>
            <div><p className="mb-5 text-sm font-semibold text-white">ارتباط</p><p className="text-sm leading-7 text-white/55">تهران، خیابان نمونه، گالری ام‌پی<br /><a href="tel:+982100000000" dir="ltr">۰۲۱ — ۰۰۰۰ ۰۰۰۰</a><br /><a href="mailto:hello@mpgroup.ir">hello@mpgroup.ir</a></p></div>
          </div>
          <Separator className="bg-white/12" />
          <div className="flex flex-col gap-3 pt-7 text-xs text-white/40 sm:flex-row sm:items-center sm:justify-between">
            <p>© ۱۴۰۵ گروه ام‌پی. همه حقوق محفوظ است.</p>
            <div className="flex gap-5"><Link href="#">اینستاگرام</Link><Link href="#">لینکدین</Link><Link href="#">حریم خصوصی</Link></div>
          </div>
        </div>
      </footer>
    </>
  );
}
