import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { AccountNav } from "@/components/account/account-nav";
import { maskPhone } from "@/features/auth/phone";
import { requireUser } from "@/features/auth/session";

export const metadata: Metadata = { title: "حساب کاربری" };

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return <main data-page="account" className="relative min-h-svh overflow-x-hidden bg-secondary/25"><Link href="/" className="absolute start-4 top-4 z-10 inline-flex h-10 items-center gap-2 border border-black/10 bg-white px-4 text-xs font-medium shadow-sm transition-colors hover:border-wine hover:text-wine sm:start-8 sm:top-8"><ArrowRight className="size-4" />بازگشت به سایت</Link><div className="container-shell pb-8 pt-20 sm:pb-12 sm:pt-24"><header className="mb-8 border-b border-black/10 pb-7"><p className="text-xs font-semibold tracking-[0.16em] text-wine">حساب کاربری</p><div className="mt-3 flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><h1 className="text-3xl font-medium sm:text-4xl">{user.name ? `سلام، ${user.name}` : "فضای شخصی شما"}</h1><p className="mt-2 text-sm text-muted-foreground">پیگیری سفارش‌ها و مدیریت اطلاعات تحویل</p></div><p className="text-xs text-muted-foreground" dir="ltr">{maskPhone(user.phone)}</p></div></header><div className="grid min-w-0 gap-8 lg:grid-cols-[15rem_minmax(0,1fr)] lg:items-start"><aside className="min-w-0 lg:sticky lg:top-8"><AccountNav /></aside><div className="min-w-0">{children}</div></div></div></main>;
}
