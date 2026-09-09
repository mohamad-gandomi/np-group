import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Eye, Handshake, Ruler, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import { storeSchema } from "@/lib/store-schema";

export const metadata: Metadata = {
  title: "درباره ما",
  description: "با نگاه، روش انتخاب و خدمات گروه ان‌پی در زمینه مبلمان، روشنایی و تجهیز فضاهای مسکونی و تجاری آشنا شوید.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "درباره گروه ان‌پی",
    description: "انتخاب دقیق مبلمان، روشنایی و جزئیات برای فضاهایی که ماندگار می‌شوند.",
    url: "/about",
    images: [{ url: "/placeholders/project.jpg", width: 2000, height: 1289 }],
  },
};

const principles = [
  { title: "دیدن کل فضا", description: "محصول را جدا از نور، مقیاس، بافت و سبک زندگی شما انتخاب نمی‌کنیم.", icon: Eye },
  { title: "انتخاب دقیق", description: "به‌جای گزینه‌های زیاد، انتخاب‌های سنجیده و متناسب با نیاز واقعی پیشنهاد می‌دهیم.", icon: Ruler },
  { title: "همراهی تا نتیجه", description: "از اولین گفت‌وگو تا هماهنگی سفارش، تحویل و خدمات پس از آن کنار شما هستیم.", icon: Handshake },
] as const;

const steps = ["شناخت فضا و نیاز شما", "پیشنهاد محصول و متریال مناسب", "هماهنگی سفارش، تحویل و نصب"] as const;
const numberFormatter = new Intl.NumberFormat("fa-IR");

export default function AboutPage() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: "درباره گروه ان‌پی",
    url: `${siteConfig.url}/about`,
    description: "آشنایی با نگاه و روش گروه ان‌پی در انتخاب مبلمان، روشنایی و تجهیز فضا.",
    mainEntity: {
      "@type": "Organization",
      name: `گروه ${siteConfig.nameFa}`,
      alternateName: siteConfig.nameEn,
      url: siteConfig.url,
      email: siteConfig.email,
      telephone: siteConfig.phoneNumber,
      location: storeSchema,
    },
  };

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

      <section className="border-b border-black/10 bg-secondary/25">
        <div className="container-shell grid min-h-[34rem] lg:grid-cols-[0.9fr_1.1fr] lg:items-stretch">
          <div className="flex flex-col justify-center py-14 lg:pe-14 lg:py-20">
            <nav aria-label="مسیر صفحه" className="text-xs text-muted-foreground"><Link href="/" className="hover:text-wine">خانه</Link><span className="px-2">/</span><span>درباره ما</span></nav>
            <p className="mt-10 text-xs font-semibold tracking-[0.18em] text-wine">درباره گروه ان‌پی</p>
            <h1 className="mt-4 text-balance text-4xl font-medium leading-[1.3] sm:text-5xl lg:text-6xl">کمتر انتخاب کنید؛ <span className="text-wine">درست‌تر انتخاب کنید.</span></h1>
            <p className="mt-7 max-w-xl text-sm leading-8 text-muted-foreground sm:text-base">ما در گروه ان‌پی مبلمان، روشنایی و جزئیات فضا را با یک نگاه یکپارچه انتخاب می‌کنیم؛ تا نتیجه فقط زیبا نباشد، بلکه برای زندگی و استفاده روزمره درست کار کند.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild className="h-12 rounded-none bg-wine px-6 hover:bg-ink"><Link href="/shop">مشاهده محصولات <ArrowLeft /></Link></Button>
              <Button asChild variant="outline" className="h-12 rounded-none px-6"><Link href="/contact">گفت‌وگو با ما</Link></Button>
            </div>
          </div>
          <div className="relative min-h-80 overflow-hidden lg:min-h-full">
            <Image src="/placeholders/project.jpg" alt="پروژه طراحی و تجهیز فضای داخلی توسط گروه ان‌پی" fill priority sizes="(max-width: 1024px) 100vw, 55vw" className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/35 to-transparent" />
          </div>
        </div>
      </section>

      <section className="py-18 sm:py-24 lg:py-28">
        <div className="container-shell">
          <div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:gap-16">
            <div><p className="text-xs font-semibold tracking-[0.16em] text-wine">نگاه ما</p><h2 className="mt-3 text-3xl font-medium leading-[1.45]">زیبایی زمانی ماندگار است که با نیاز واقعی هماهنگ باشد.</h2></div>
            <div className="grid border-t border-black/10 sm:grid-cols-3">
              {principles.map(({ title, description, icon: Icon }) => <article key={title} className="border-b border-black/10 py-7 sm:border-s sm:px-6"><Icon className="size-6 text-wine" /><h3 className="mt-6 text-lg font-medium">{title}</h3><p className="mt-3 text-sm leading-7 text-muted-foreground">{description}</p></article>)}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-ink py-16 text-white sm:py-20">
        <div className="container-shell grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-center">
          <div><p className="text-xs font-semibold tracking-[0.16em] text-wine">مسیر همکاری</p><h2 className="mt-4 text-3xl font-medium leading-[1.45] sm:text-4xl">از یک انتخاب تا تجهیز کامل پروژه، مسیر را ساده نگه می‌داریم.</h2><p className="mt-5 max-w-xl text-sm leading-8 text-white/65">فرایند همکاری شفاف است و در هر مرحله می‌دانید چه چیزی انتخاب شده، زمان آماده‌سازی چقدر است و قدم بعدی چیست.</p></div>
          <ol className="border-t border-white/20">
            {steps.map((step, index) => <li key={step} className="flex items-center gap-4 border-b border-white/20 py-5"><span className="grid size-8 shrink-0 place-items-center rounded-full bg-wine text-xs">{numberFormatter.format(index + 1)}</span><span className="flex-1 text-sm sm:text-base">{step}</span><CheckCircle2 className="size-5 text-white/45" /></li>)}
          </ol>
          <div className="flex flex-wrap items-center gap-4 border-t border-white/20 pt-7 lg:col-span-2"><ShieldCheck className="size-6 text-wine" /><p className="flex-1 text-sm text-white/70">برای انتخاب محصول، سفارش سفارشی یا تجهیز پروژه آماده گفت‌وگو هستیم.</p><Button asChild className="h-11 rounded-none bg-white px-5 text-ink hover:bg-white/90"><Link href="/contact">تماس با گروه ان‌پی <ArrowLeft /></Link></Button></div>
        </div>
      </section>
    </main>
  );
}
