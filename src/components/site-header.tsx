"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, Menu, Search, ShoppingBag } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const shopGroups = [
  { title: "مبلمان", items: ["مبل و کاناپه", "صندلی و نیمکت", "میز", "تخت و سرویس خواب"] },
  { title: "روشنایی", items: ["لوستر", "چراغ آویز", "آباژور", "چراغ دیواری"] },
  { title: "جزئیات", items: ["پارچه", "فرش", "کوسن", "اکسسوری"] },
];

const mobileLinks = ["محصولات", "فضاها", "برندها", "پروژه‌ها", "مجله", "درباره ما"];
const mobileTargets = ["categories", "spaces", "brands", "projects", "journal", "about"];

function BrandMark() {
  return (
    <Link href="/" className="group flex items-center gap-2" aria-label="گروه ان‌پی، صفحه اصلی">
      <Image src="/logos/np-mark.png" alt="گروه ان‌پی" width={96} height={96} className="size-24 object-contain transition-transform group-hover:scale-105" priority />
    </Link>
  );
}

export function SiteHeader() {
  return (
  <header className="sticky top-0 z-50 border-b border-black/10 bg-white/95 backdrop-blur-xl">
      <div className="border-b border-border/70 bg-wine py-2 text-center text-[0.7rem] text-primary-foreground sm:text-xs">
        مشاوره تخصصی انتخاب و تجهیز فضا · شنبه تا پنجشنبه، ۹ تا ۱۸
      </div>
      <div className="container-shell flex h-24 items-center justify-between gap-4">
        <BrandMark />

        <NavigationMenu className="hidden lg:flex" dir="rtl">
          <NavigationMenuList className="gap-1">
            <NavigationMenuItem>
              <NavigationMenuTrigger className="bg-transparent text-[0.82rem] hover:bg-transparent hover:text-wine data-open:bg-transparent">
                محصولات
              </NavigationMenuTrigger>
              <NavigationMenuContent className="p-0">
                <div className="grid w-[44rem] grid-cols-3 gap-8 p-8">
                  {shopGroups.map((group) => (
                    <div key={group.title}>
                      <p className="mb-3 border-b pb-3 text-sm font-semibold text-wine">{group.title}</p>
                      <ul className="space-y-1">
                        {group.items.map((item) => (
                          <li key={item}>
                            <NavigationMenuLink asChild>
                              <Link href="/shop#products" className="px-0 text-muted-foreground hover:bg-transparent hover:text-foreground">
                                {item}
                              </Link>
                            </NavigationMenuLink>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </NavigationMenuContent>
            </NavigationMenuItem>
            {[["فضاها", "#spaces"], ["برندها", "#brands"], ["پروژه‌ها", "#projects"], ["مجله", "#journal"], ["درباره ما", "#about"]].map(([label, href]) => (
              <NavigationMenuItem key={label}>
                <NavigationMenuLink asChild>
                  <Link href={href} className="px-3 py-2 text-[0.82rem] font-medium hover:bg-transparent hover:text-wine">
                    {label}
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>

        <div className="flex items-center gap-0.5">
          <Button variant="ghost" size="icon" aria-label="جستجو" className="hover:bg-secondary"><Search /></Button>
          <Button variant="ghost" size="icon" aria-label="علاقه‌مندی‌ها" className="hidden hover:bg-secondary sm:inline-flex"><Heart /></Button>
          <Button variant="ghost" size="icon" aria-label="سبد خرید" className="relative hover:bg-secondary">
            <ShoppingBag />
            <span className="absolute end-0 top-0 grid size-4 place-items-center rounded-full bg-wine text-[0.55rem] text-white">۰</span>
          </Button>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="ms-1 lg:hidden" aria-label="باز کردن منو"><Menu /></Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[86%] bg-white p-0" dir="rtl">
              <SheetHeader className="border-b p-6 text-start">
                <SheetTitle><BrandMark /></SheetTitle>
                <SheetDescription>مجموعه‌های منتخب برای فضاهای ماندگار</SheetDescription>
              </SheetHeader>
              <nav className="flex flex-col px-6 py-4">
                {mobileLinks.map((item, index) => (
                  <Link key={item} href={index === 0 ? "/shop" : `/#${mobileTargets[index]}`} className="flex items-center justify-between border-b py-4 text-lg">
                    {item}<span className="text-xs text-wine">۰{index + 1}</span>
                  </Link>
                ))}
              </nav>
              <div className="mt-auto bg-wine p-6 text-primary-foreground">
                <p className="text-sm text-white/70">برای پروژه خود با ما صحبت کنید</p>
                <a href="tel:+982100000000" className="mt-2 block text-xl" dir="ltr">۰۲۱ — ۰۰۰۰ ۰۰۰۰</a>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
