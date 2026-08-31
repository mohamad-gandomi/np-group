"use client";

import Image from "next/image";
import Link from "next/link";
import { Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger } from "@/components/ui/navigation-menu";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const shopGroups = [
  { title: "مبلمان", href: "/shop/furniture", items: ["مبل و کاناپه", "صندلی و نیمکت", "تخت و سرویس خواب"] },
  { title: "روشنایی", href: "/shop/lighting", items: ["لوستر", "چراغ آویز", "آباژور"] },
  { title: "جزئیات", href: "/shop/accessories", items: ["پارچه", "فرش", "اکسسوری"] },
] as const;

export const mainLinks = [["فضاها", "/#spaces"], ["برندها", "/#brands"], ["پروژه‌ها", "/#projects"], ["مجله", "/#journal"], ["درباره ما", "/about"], ["تماس", "/contact"]] as const;

export function DesktopNavigation() {
  return <NavigationMenu className="hidden lg:flex" dir="rtl"><NavigationMenuList className="gap-1"><NavigationMenuItem><NavigationMenuTrigger className="bg-transparent text-[0.82rem] hover:bg-transparent hover:text-wine data-open:bg-transparent">محصولات</NavigationMenuTrigger><NavigationMenuContent className="p-0"><div className="grid w-[42rem] grid-cols-3 gap-8 p-8">{shopGroups.map((group) => <div key={group.title}><Link href={group.href} className="mb-3 block border-b pb-3 text-sm font-semibold text-wine">{group.title}</Link><ul className="space-y-1">{group.items.map((item) => <li key={item}><NavigationMenuLink asChild><Link href={group.href} className="px-0 text-muted-foreground hover:bg-transparent hover:text-foreground">{item}</Link></NavigationMenuLink></li>)}</ul></div>)}</div></NavigationMenuContent></NavigationMenuItem>{mainLinks.map(([label, href]) => <NavigationMenuItem key={label}><NavigationMenuLink asChild><Link href={href} className="px-3 py-2 text-[0.82rem] font-medium hover:bg-transparent hover:text-wine">{label}</Link></NavigationMenuLink></NavigationMenuItem>)}</NavigationMenuList></NavigationMenu>;
}

export function MobileNavigation() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  // Route changes should always dismiss the navigation sheet.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setOpen(false); }, [pathname]);
  return <Sheet open={open} onOpenChange={setOpen}><SheetTrigger asChild><Button variant="ghost" size="icon" className="ms-1 lg:hidden" aria-label="باز کردن منو"><Menu /></Button></SheetTrigger><SheetContent side="right" className="w-[88%] bg-white p-0" dir="rtl"><SheetHeader className="border-b p-6 text-start"><SheetTitle><Link href="/" aria-label="گروه ان‌پی، صفحه اصلی"><Image src="/logos/np-mark.png" alt="گروه ان‌پی" width={80} height={80} className="size-20 object-contain" /></Link></SheetTitle><SheetDescription>مجموعه‌های منتخب برای فضاهای ماندگار</SheetDescription></SheetHeader><nav className="flex flex-col px-6 py-4"><Link href="/shop" className="flex items-center justify-between border-b py-4 text-lg">فروشگاه<span className="text-xs text-wine">۰۱</span></Link>{mainLinks.map(([label, href], index) => <Link key={label} href={href} className="flex items-center justify-between border-b py-4 text-lg">{label}<span className="text-xs text-wine">۰{index + 2}</span></Link>)}</nav></SheetContent></Sheet>;
}
