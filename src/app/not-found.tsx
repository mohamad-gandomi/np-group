import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = { title: "صفحه پیدا نشد", robots: { index: false, follow: true } };

export default function NotFound() {
  return <main className="bg-[#f5f3ee] px-6 py-24 text-center sm:py-32">
    <p className="text-sm text-wine">۴۰۴ · مسیر تازه‌ای پیدا کنیم</p>
    <h1 className="mt-6 text-4xl font-medium leading-relaxed sm:text-5xl">این صفحه پیدا نشد.</h1>
    <p className="mx-auto mt-5 max-w-lg text-sm leading-8 text-muted-foreground">ممکن است نشانی تغییر کرده باشد یا این محتوا هنوز منتشر نشده باشد. از مجموعه‌ها یا مجله، انتخاب دیگری را کشف کنید.</p>
    <nav className="mx-auto mt-9 flex max-w-xl flex-wrap justify-center gap-3" aria-label="مسیرهای پیشنهادی">
      {[["پروژه‌ها", "/projects"], ["برندها", "/brands"], ["مجله ان‌پی", "/blog"]].map(([label, href]) => <Link key={href} href={href} className="inline-flex min-h-12 items-center gap-5 border border-black/20 bg-white px-6 py-3 text-sm transition-colors hover:border-wine hover:text-wine focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-wine">{label}<ArrowLeft size={16} aria-hidden="true" /></Link>)}
    </nav>
    <Link href="/" className="mt-8 inline-block py-3 text-sm text-wine underline underline-offset-8">بازگشت به صفحه اصلی</Link>
  </main>;
}
