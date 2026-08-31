"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { RotateCcw, SlidersHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

export function MobileFilters({ children, count, activeCount, clearHref }: { children: ReactNode; count: number; activeCount: number; clearHref: string }) {
  return (
    <Sheet>
      <SheetTrigger asChild><Button variant="outline" className="h-11 flex-1 rounded-full border-black/15 bg-white"><SlidersHorizontal /> فیلترها {activeCount ? <span className="grid size-5 place-items-center rounded-full bg-wine text-[0.65rem] text-white">{new Intl.NumberFormat("fa-IR").format(activeCount)}</span> : null}</Button></SheetTrigger>
      <SheetContent side="right" className="w-full max-w-none overflow-hidden bg-white pe-2 pb-0 pt-5 sm:max-w-md" dir="rtl">
        <div className="filter-scrollbar mr-3 min-h-0 flex-1 overflow-y-auto" dir="ltr">
          <div className="pr-2" dir="rtl">
            <SheetHeader className="border-b px-0 pb-4 text-start"><div className="flex items-start justify-between gap-4"><div><SheetTitle>فیلتر محصولات</SheetTitle><SheetDescription className="mt-1">{new Intl.NumberFormat("fa-IR").format(count)} نتیجه با فیلترهای فعلی</SheetDescription></div>{activeCount ? <Link href={clearHref} aria-label="حذف همه فیلترها" title="حذف همه فیلترها" className="grid size-9 shrink-0 place-items-center rounded-full border border-wine/20 bg-wine/5 text-wine"><RotateCcw className="size-4" /></Link> : null}</div></SheetHeader>
            {children}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
