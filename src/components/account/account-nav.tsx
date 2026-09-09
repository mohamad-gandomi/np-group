"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bookmark, LayoutDashboard, LogOut, MapPin, Package, UserRound } from "lucide-react";

import { logoutAction } from "@/app/(frontend)/account/actions";

const links = [
  { href: "/account", label: "نمای کلی", icon: LayoutDashboard },
  { href: "/account/orders", label: "سفارش‌ها", icon: Package },
  { href: "/account/addresses", label: "آدرس‌ها", icon: MapPin },
  { href: "/account/saved", label: "ذخیره‌شده‌ها", icon: Bookmark },
  { href: "/account/profile", label: "اطلاعات حساب", icon: UserRound },
];

export function AccountNav() {
  const pathname = usePathname();
  return <nav aria-label="حساب کاربری" className="flex w-full max-w-full gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">{links.map(({ href, label, icon: Icon }) => { const active = pathname === href || (href !== "/account" && pathname.startsWith(`${href}/`)); return <Link key={href} href={href} aria-current={active ? "page" : undefined} className={`flex h-11 shrink-0 items-center gap-3 border px-4 text-sm transition ${active ? "border-wine bg-wine text-white" : "border-black/10 bg-white hover:border-wine hover:text-wine"}`}><Icon className="size-4" />{label}</Link>; })}<form action={logoutAction} className="shrink-0"><button type="submit" className="flex h-11 w-full items-center gap-3 border border-black/10 bg-white px-4 text-sm text-muted-foreground transition hover:border-wine hover:text-wine"><LogOut className="size-4" />خروج از حساب</button></form></nav>;
}
