import Link from "next/link";

import { siteConfig } from "@/config/site";
import { Separator } from "@/components/ui/separator";

const shopLinks = [
  ["مبلمان", "/shop/furniture"],
  ["روشنایی", "/shop/lighting"],
  ["میز و کنسول", "/shop/tables"],
  ["اکسسوری", "/shop/accessories"],
] as const;

const companyLinks = [
  ["درباره ما", "/about"],
  ["پروژه‌ها", "/#projects"],
  ["مجله", "/#journal"],
  ["تماس با ما", "/contact"],
] as const;

function FooterLinks({ title, links }: { title: string; links: ReadonlyArray<readonly [string, string]> }) {
  return (
    <div>
      <p className="mb-5 text-sm font-semibold text-white">{title}</p>
      <ul className="space-y-3 text-sm text-white/55">
        {links.map(([label, href]) => <li key={href}><Link href={href} className="transition-colors hover:text-white">{label}</Link></li>)}
      </ul>
    </div>
  );
}

export function SiteFooter() {
  return (
    <footer className="bg-ink pb-8 pt-16 text-white sm:pt-20">
      <div className="container-shell">
        <div className="grid gap-12 pb-14 md:grid-cols-2 lg:grid-cols-[1.3fr_0.7fr_0.7fr_0.9fr]">
          <div>
            <p className="text-3xl font-semibold">گروه {siteConfig.nameFa}</p>
            <p className="mt-5 max-w-sm text-sm leading-7 text-white/55">{siteConfig.description}</p>
          </div>
          <FooterLinks title="فروشگاه" links={shopLinks} />
          <FooterLinks title="گروه ان‌پی" links={companyLinks} />
          <div>
            <p className="mb-5 text-sm font-semibold text-white">ارتباط</p>
            <p className="text-sm leading-7 text-white/55">{siteConfig.addressLabel}<br /><a href={siteConfig.phoneHref} dir="ltr">{siteConfig.phoneLabel}</a><br /><a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a></p>
          </div>
        </div>
        <Separator className="bg-white/12" />
        <div className="flex flex-col gap-3 pt-7 text-xs text-white/40 sm:flex-row sm:items-center sm:justify-between">
          <p>© ۱۴۰۵ گروه {siteConfig.nameFa}. همه حقوق محفوظ است.</p>
          <p dir="ltr">{siteConfig.nameEn}</p>
        </div>
      </div>
    </footer>
  );
}
