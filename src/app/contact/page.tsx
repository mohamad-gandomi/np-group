import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowUpLeft, Clock3, Mail, MapPin, MessageCircle, Navigation, Phone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import { StoreMap } from "@/features/contact/store-map";
import { storeSchema } from "@/lib/store-schema";

export const metadata: Metadata = {
  title: "تماس با ما",
  description: `آدرس و تماس با گروه ان‌پی در مشهد؛ ${siteConfig.addressLabel}. تلفن ${siteConfig.phoneLabel}. مشاهده نقشه و مسیریابی فروشگاه.`,
  alternates: { canonical: "/contact" },
  openGraph: {
    title: "تماس با گروه ان‌پی",
    description: `${siteConfig.addressLabel} · ${siteConfig.phoneLabel} · نقشه و راه‌های ارتباطی`,
    url: "/contact",
    images: [{ url: "/placeholders/living.jpg", width: 1400, height: 738 }],
  },
};

const faqs = [
  { question: "برای خرید محصول چطور مشاوره بگیرم؟", answer: "از طریق تماس تلفنی یا ایمیل، نام محصول و نیازتان را اعلام کنید تا مشاور مناسب با شما هماهنگ شود." },
  { question: "امکان سفارش رنگ یا ابعاد سفارشی وجود دارد؟", answer: "برای محصولات دارای قابلیت ساخت سفارشی، رنگ، متریال و ابعاد پس از بررسی فنی و تأیید نهایی قابل هماهنگی است." },
  { question: "برای تجهیز کامل پروژه هم خدمات دارید؟", answer: "بله؛ برای فضاهای مسکونی، هتل، رستوران، محیط کار و فضاهای درمانی امکان انتخاب و هماهنگی مجموعه محصولات وجود دارد." },
] as const;

export default function ContactPage() {
  const emailHref = `mailto:${siteConfig.email}?subject=${encodeURIComponent("درخواست مشاوره از گروه ان‌پی")}`;
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ContactPage",
        name: "تماس با گروه ان‌پی",
        url: `${siteConfig.url}/contact`,
        description: "راه‌های تماس برای مشاوره خرید، سفارش سفارشی و تجهیز پروژه.",
        mainEntity: { "@id": storeSchema["@id"] },
      },
      {
        "@type": "Organization",
        name: `گروه ${siteConfig.nameFa}`,
        alternateName: siteConfig.nameEn,
        url: siteConfig.url,
        email: siteConfig.email,
        telephone: siteConfig.phoneNumber,
        location: { "@id": storeSchema["@id"] },
        contactPoint: { "@type": "ContactPoint", telephone: siteConfig.phoneNumber, contactType: "customer service", availableLanguage: "Persian" },
      },
      storeSchema,
      {
        "@type": "FAQPage",
        mainEntity: faqs.map((item) => ({ "@type": "Question", name: item.question, acceptedAnswer: { "@type": "Answer", text: item.answer } })),
      },
    ],
  };

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />

      <section className="border-b border-black/10">
        <div className="container-shell grid lg:grid-cols-[1fr_0.8fr] lg:items-stretch">
          <div className="flex min-h-[31rem] flex-col justify-center py-14 lg:pe-16 lg:py-20">
            <nav aria-label="مسیر صفحه" className="text-xs text-muted-foreground"><Link href="/" className="hover:text-wine">خانه</Link><span className="px-2">/</span><span>تماس با ما</span></nav>
            <p className="mt-10 text-xs font-semibold tracking-[0.18em] text-wine">ارتباط با گروه ان‌پی</p>
            <h1 className="mt-4 text-balance text-4xl font-medium leading-[1.3] sm:text-5xl lg:text-6xl">از یک گفت‌وگوی کوتاه شروع کنیم.</h1>
            <p className="mt-6 max-w-xl text-sm leading-8 text-muted-foreground sm:text-base">برای انتخاب محصول، بررسی سفارش سفارشی یا شروع یک پروژه، سریع‌ترین راه تماس مستقیم با تیم ماست.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild className="h-12 rounded-none bg-wine px-6 hover:bg-ink"><a href={siteConfig.phoneHref}><Phone className="size-4" />تماس با مشاور</a></Button>
              <Button asChild variant="outline" className="h-12 rounded-none px-6"><a href={emailHref}><Mail className="size-4" />ارسال ایمیل</a></Button>
              <Button asChild variant="outline" className="h-12 rounded-none px-6"><a href="#visit"><MapPin className="size-4" />آدرس و مسیریابی</a></Button>
            </div>
          </div>
          <div className="relative min-h-72 overflow-hidden lg:min-h-full">
            <Image src="/placeholders/living.jpg" alt="فضای نشیمن با مبلمان منتخب گروه ان‌پی" fill priority sizes="(max-width: 1024px) 100vw, 45vw" className="object-cover" />
          </div>
        </div>
      </section>

      <section className="bg-secondary/25 py-16 sm:py-20">
        <div className="container-shell">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <a href={siteConfig.phoneHref} className="group border border-black/10 bg-white p-5 transition-colors hover:border-wine"><Phone className="size-5 text-wine" /><p className="mt-6 text-xs text-muted-foreground">شماره تماس</p><p className="mt-2 font-medium group-hover:text-wine" dir="ltr">{siteConfig.phoneLabel}</p></a>
            <a href={emailHref} className="group min-w-0 border border-black/10 bg-white p-5 transition-colors hover:border-wine"><Mail className="size-5 text-wine" /><p className="mt-6 text-xs text-muted-foreground">ایمیل</p><p className="mt-2 truncate font-medium group-hover:text-wine" dir="ltr">{siteConfig.email}</p></a>
            <a href={siteConfig.directionsUrl} target="_blank" rel="noopener noreferrer" className="group border border-black/10 bg-white p-5 transition-colors hover:border-wine"><MapPin className="size-5 text-wine" /><p className="mt-6 text-xs text-muted-foreground">آدرس فروشگاه</p><p className="mt-2 text-sm font-medium leading-7 group-hover:text-wine">{siteConfig.addressLabel}</p><span className="mt-3 inline-flex items-center gap-2 text-xs text-wine">مسیریابی <ArrowUpLeft size={14} aria-hidden="true" /><span className="sr-only">(پنجره جدید)</span></span></a>
            <div className="border border-black/10 bg-white p-5"><Clock3 className="size-5 text-wine" /><p className="mt-6 text-xs text-muted-foreground">ساعات کاری فروشگاه</p><p className="mt-2 font-medium">{siteConfig.hoursLabel}</p></div>
          </div>
          <div className="mt-5 flex flex-col gap-4 border border-wine/20 bg-wine p-6 text-white sm:flex-row sm:items-center sm:justify-between"><div className="flex items-start gap-3"><MessageCircle className="mt-1 size-5 shrink-0" /><div><h2 className="font-medium">برای شروع پروژه آماده‌اید؟</h2><p className="mt-1 text-sm leading-7 text-white/75">نوع فضا، متراژ تقریبی و زمان موردنظرتان را برای ما ارسال کنید.</p></div></div><Button asChild className="h-11 shrink-0 rounded-none bg-white px-5 text-ink hover:bg-white/90"><a href={emailHref}>ارسال مشخصات پروژه <ArrowLeft /></a></Button></div>
        </div>
      </section>

      <section id="visit" className="scroll-mt-40 border-b border-black/10 bg-[#f6f5f0] py-16 sm:py-20" aria-labelledby="visit-title">
        <div className="container-shell grid items-center gap-9 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <div><p className="text-xs font-medium text-wine">برای دیدن، لمس کردن و انتخاب</p><h2 id="visit-title" className="mt-4 text-3xl font-medium leading-relaxed sm:text-4xl">در فروشگاه ملاقات کنیم.</h2><p className="mt-5 text-base font-medium">{siteConfig.storeName}</p><address className="mt-4 max-w-md text-base not-italic leading-8 text-muted-foreground">{siteConfig.addressLabel}</address>
            <div className="mt-6 flex flex-wrap items-center gap-x-7 gap-y-3 border-y border-black/10 py-5 text-sm"><span className="inline-flex items-center gap-2"><Clock3 size={16} aria-hidden="true" />{siteConfig.hoursLabel}</span><a className="inline-flex min-h-9 items-center gap-2 text-wine" href={siteConfig.phoneHref}><Phone size={16} aria-hidden="true" /><bdi dir="ltr">{siteConfig.phoneLabel}</bdi></a></div>
            <p className="mt-4 max-w-md text-xs leading-7 text-muted-foreground">{siteConfig.hoursNote}</p>
            <div className="mt-7 flex flex-wrap gap-3"><Button asChild className="h-12 rounded-none bg-wine px-5 hover:bg-ink"><a href={siteConfig.directionsUrl} target="_blank" rel="noopener noreferrer"><Navigation size={17} aria-hidden="true" />مسیریابی تا فروشگاه<span className="sr-only">(پنجره جدید)</span></a></Button><Button asChild variant="outline" className="h-12 rounded-none px-5"><a href={siteConfig.mapsUrl} target="_blank" rel="noopener noreferrer">مشاهده در گوگل مپ<ArrowUpLeft size={17} aria-hidden="true" /><span className="sr-only">(پنجره جدید)</span></a></Button></div>
            <p className="mt-4 text-[0.68rem] leading-6 text-muted-foreground">اگر نقشه بارگذاری نشد، از لینک مسیریابی یا تماس تلفنی استفاده کنید.</p>
          </div>
          <StoreMap />
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="container-shell grid gap-8 lg:grid-cols-[0.65fr_1.35fr] lg:gap-16">
          <div><p className="text-xs font-semibold tracking-[0.16em] text-wine">پرسش‌های پرتکرار</p><h2 className="mt-3 text-3xl font-medium leading-[1.45]">پیش از تماس شاید پاسخ شما اینجا باشد.</h2></div>
          <div className="border-t border-black/10">
            {faqs.map((item) => <details key={item.question} className="group border-b border-black/10"><summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 font-medium [&::-webkit-details-marker]:hidden"><span>{item.question}</span><span className="text-xl font-light text-wine transition-transform group-open:rotate-45">+</span></summary><p className="max-w-2xl pb-6 text-sm leading-8 text-muted-foreground">{item.answer}</p></details>)}
          </div>
        </div>
      </section>
    </main>
  );
}
