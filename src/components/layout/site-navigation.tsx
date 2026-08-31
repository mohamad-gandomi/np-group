"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowUpLeft, ChevronDown, MapPin, Menu, Phone, Search, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { siteConfig } from "@/config/site";
import { categories, products } from "@/features/catalog/catalog-data";
import { matchesProductSearch } from "@/features/catalog/catalog-search";
import "./site-navigation.css";

export const mainLinks = [["برندها", "/brands"], ["پروژه‌ها", "/projects"], ["مجله", "/blog"], ["درباره ما", "/about"], ["تماس", "/contact"]] as const;
const number = new Intl.NumberFormat("fa-IR");

function useMenu() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  // Also dismiss on history navigation and when crossing the desktop breakpoint.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const close = () => setOpen(false);
    media.addEventListener("change", close);
    return () => media.removeEventListener("change", close);
  }, []);
  return { open, setOpen, close: () => setOpen(false) };
}

function MenuHeader({ close, mobile = false }: { close: () => void; mobile?: boolean }) {
  return <div className="site-menu-header">
    <Link href="/" onClick={close} aria-label="گروه ان‌پی، صفحه اصلی"><Image src="/logos/np-mark.png" alt="گروه ان‌پی" width={80} height={80} className="site-menu-logo" /></Link>
    <span className="site-menu-header-note">{mobile ? "خانه، روایت شماست." : "مبلمان، نور و جزئیاتِ زندگی"}</span>
    <SheetClose asChild><button type="button" className="site-menu-close" aria-label="بستن منو"><span>بستن</span><X size={20} aria-hidden="true" /></button></SheetClose>
  </div>;
}

function MenuContact({ close }: { close: () => void }) {
  return <div className="site-menu-contact">
    <p>از یک گفت‌وگو شروع کنیم.</p>
    <div><Link href="/contact#visit" onClick={close}><MapPin size={16} aria-hidden="true" /><span>{siteConfig.addressLabel}</span></Link><a href={siteConfig.phoneHref}><Phone size={16} aria-hidden="true" /><bdi dir="ltr">{siteConfig.phoneLabel}</bdi></a></div>
    <span>{siteConfig.hoursLabel}</span>
    <a href={siteConfig.directionsUrl} target="_blank" rel="noopener noreferrer" className="site-menu-directions">مسیریابی فروشگاه <ArrowUpLeft size={15} aria-hidden="true" /><span className="sr-only">(پنجره جدید)</span></a>
  </div>;
}

export function DesktopNavigation() {
  const menu = useMenu();
  const pathname = usePathname();
  const [category, setCategory] = useState("all");
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const shelfRef = useRef<HTMLDivElement>(null);
  const selected = categories.find((item) => item.slug === category);
  const matching = products.filter((product) => (category === "all" || product.category === category) && matchesProductSearch(product, query));
  const visible = matching.slice(0, 6);
  const catalogParams = new URLSearchParams();
  if (query.trim()) catalogParams.set("q", query.trim());
  const catalogPath = `${selected ? `/shop/${selected.slug}` : "/shop"}${catalogParams.size ? `?${catalogParams}` : ""}`;
  const reset = () => { setCategory("all"); setQuery(""); };
  return <nav className="site-desktop-nav" aria-label="منوی اصلی">
    <Sheet open={menu.open} onOpenChange={(open) => { menu.setOpen(open); if (open) reset(); }}>
      <SheetTrigger asChild><button type="button" className="site-products-trigger">محصولات <ChevronDown size={13} aria-hidden="true" /></button></SheetTrigger>
      <SheetContent side="top" showCloseButton={false} className="site-menu site-menu--desktop" dir="rtl" onOpenAutoFocus={(event) => { event.preventDefault(); searchRef.current?.focus(); }}>
        <MenuHeader close={menu.close} />
        <div className="site-product-browser">
          <aside className="site-product-sidebar">
            <p className="site-menu-eyebrow">انتخاب از مجموعه</p>
            <SheetTitle className="site-menu-title">برای هر گوشه،<br />یک انتخاب.</SheetTitle>
            <SheetDescription className="site-menu-description">با دسته‌بندی شروع کنید، یا محصول دلخواهتان را پیدا کنید.</SheetDescription>
            <div className="site-menu-categories" role="group" aria-label="دسته‌بندی محصولات">
              {[{ slug: "all", title: "همه محصولات" }, ...categories].map((item) => <button key={item.slug} type="button" aria-pressed={category === item.slug} aria-controls="desktop-menu-products" onClick={() => { setCategory(item.slug); shelfRef.current?.scrollTo({ top: 0 }); }}><span>{item.title}</span><span className="site-menu-category-count">{number.format(item.slug === "all" ? products.length : products.filter((product) => product.category === item.slug).length)}</span><ArrowUpLeft size={18} aria-hidden="true" /></button>)}
            </div>
            <Link className="site-menu-advice" href="/contact" onClick={menu.close}>برای انتخاب همراهتان هستیم <ArrowLeft size={16} aria-hidden="true" /></Link>
          </aside>
          <div className="site-product-shelf" ref={shelfRef}>
            <div className="site-menu-search"><Search size={19} aria-hidden="true" /><label className="sr-only" htmlFor="desktop-menu-search">جست‌وجوی محصولات</label><input ref={searchRef} id="desktop-menu-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="نام محصول، برند یا دسته‌بندی…" aria-controls="desktop-menu-products" />{query && <button type="button" onClick={() => { setQuery(""); searchRef.current?.focus(); }} aria-label="پاک کردن جست‌وجو"><X size={17} aria-hidden="true" /></button>}</div>
            <div className="site-menu-results-heading"><div><h3>{selected?.title ?? "منتخب مجموعه"}</h3><p role="status" aria-live="polite" aria-atomic="true">{number.format(matching.length)} محصول{matching.length > visible.length ? ` · نمایش ${number.format(visible.length)} انتخاب` : ""}</p></div><Link href={catalogPath} onClick={menu.close}>مشاهده در فروشگاه <ArrowLeft size={16} aria-hidden="true" /></Link></div>
            <div id="desktop-menu-products" className="site-menu-product-grid">{visible.map((product) => <Link key={product.id} href={`/shop/${product.category}/${product.slug}`} onClick={menu.close} className="site-menu-product"><div className="site-menu-product-image"><Image src={product.image} alt={product.name} fill sizes="(max-width: 1280px) 27vw, 23vw" className="object-cover" /><span><ArrowUpLeft size={18} aria-hidden="true" /></span></div><div className="site-menu-product-caption"><h4>{product.name}</h4><span dir="ltr">{product.brand}</span></div></Link>)}</div>
            {!matching.length && <div className="site-menu-empty"><h3>محصولی پیدا نشد.</h3><p>نام کوتاه‌تری بنویسید یا همه دسته‌ها را ببینید.</p><button type="button" onClick={() => { reset(); searchRef.current?.focus(); }}>نمایش همه محصولات <ArrowLeft size={16} aria-hidden="true" /></button></div>}
          </div>
        </div>
        <footer className="site-menu-desktop-footer"><span>انتخاب دقیق، برای فضاهای ماندگار.</span><nav aria-label="کشف بیشتر"><Link href="/brands" onClick={menu.close}>برندها</Link><Link href="/projects" onClick={menu.close}>پروژه‌ها</Link><Link href="/blog" onClick={menu.close}>مجله ان‌پی</Link></nav><a href={siteConfig.phoneHref}><Phone size={14} aria-hidden="true" /><bdi>{siteConfig.phoneLabel}</bdi></a></footer>
      </SheetContent>
    </Sheet>
    {mainLinks.map(([label, href]) => <Link key={href} href={href} aria-current={pathname === href || pathname.startsWith(`${href}/`) ? "page" : undefined}>{label}</Link>)}
  </nav>;
}

export function MobileNavigation() {
  const menu = useMenu();
  const pathname = usePathname();
  return <Sheet open={menu.open} onOpenChange={menu.setOpen}>
    <SheetTrigger asChild><Button variant="ghost" size="icon" className="ms-1 lg:hidden" aria-label="باز کردن منو"><Menu /></Button></SheetTrigger>
    <SheetContent side="right" showCloseButton={false} className="site-menu site-menu--mobile" dir="rtl">
      <MenuHeader close={menu.close} mobile />
      <div className="site-mobile-menu-scroll">
        <div className="site-mobile-intro"><SheetTitle className="site-menu-eyebrow">جهان ان‌پی</SheetTitle><SheetDescription className="sr-only">فروشگاه، مجموعه‌ها و راه‌های ارتباطی گروه ان‌پی</SheetDescription></div>
        <Link href="/shop" onClick={menu.close} className="site-mobile-shop"><div><span>مبلمان، روشنایی و جزئیات</span><strong>کشف محصولات</strong></div><ArrowUpLeft size={29} aria-hidden="true" /></Link>
        <nav className="site-mobile-categories" aria-label="دسته‌بندی محصولات">{categories.map((category) => <Link key={category.slug} href={`/shop/${category.slug}`} onClick={menu.close}>{category.title}</Link>)}</nav>
        <nav className="site-mobile-main-links" aria-label="منوی اصلی">{mainLinks.map(([label, href], index) => <Link key={href} href={href} onClick={menu.close} aria-current={pathname === href || pathname.startsWith(`${href}/`) ? "page" : undefined}><span className="site-mobile-link-number">{number.format(index + 1).padStart(2, "۰")}</span><span>{label}</span><ArrowUpLeft size={20} aria-hidden="true" /></Link>)}</nav>
        <MenuContact close={menu.close} />
      </div>
    </SheetContent>
  </Sheet>;
}
