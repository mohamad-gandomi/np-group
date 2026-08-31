import { Phone, Save, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { maskPhone } from "@/features/auth/phone";
import { requireUser } from "@/features/auth/session";
import { updateProfileAction } from "../actions";

export default async function ProfilePage() {
  const user = await requireUser();
  return <section className="border border-black/10 bg-white p-5 sm:p-8"><p className="text-xs font-semibold text-wine">اطلاعات حساب</p><h2 className="mt-2 text-2xl font-medium">مشخصات فردی</h2><p className="mt-2 text-sm text-muted-foreground">این اطلاعات برای هماهنگی سفارش و تحویل استفاده می‌شود.</p><form action={updateProfileAction} className="mt-8 grid max-w-2xl gap-5"><label className="text-sm font-medium">نام و نام خانوادگی<div className="mt-2 flex h-12 items-center border border-black/15 px-3 focus-within:border-wine"><UserRound className="size-4 text-wine" /><input name="name" required minLength={2} defaultValue={user.name ?? ""} autoComplete="name" className="h-full min-w-0 flex-1 bg-transparent px-3 outline-none" /></div></label><label className="text-sm font-medium">شماره موبایل تأییدشده<div className="mt-2 flex h-12 items-center border border-black/10 bg-secondary/45 px-3"><Phone className="size-4 text-wine" /><span className="px-3 text-sm" dir="ltr">{maskPhone(user.phone)}</span><span className="ms-auto text-[0.65rem] text-muted-foreground">قابل تغییر از طریق پشتیبانی</span></div></label><Button type="submit" className="mt-2 h-11 w-fit rounded-none bg-wine px-6 hover:bg-ink"><Save />ذخیره تغییرات</Button></form></section>;
}
