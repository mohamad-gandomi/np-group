import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { shopHref, type RawSearchParams } from "../catalog-query";

export function CatalogPagination({ page, pageCount, params, path }: { page: number; pageCount: number; params: RawSearchParams; path: string }) {
  if (pageCount <= 1) return null;
  return (
    <nav className="mt-14 flex items-center justify-center gap-2" aria-label="صفحه‌بندی محصولات">
      {page > 1 ? <Link href={shopHref(path, params, { page: String(page - 1) })} className="grid size-10 place-items-center border" aria-label="صفحه قبل"><ArrowRight className="size-4" /></Link> : null}
      {Array.from({ length: pageCount }, (_, index) => index + 1).map((number) => <Link key={number} href={shopHref(path, params, { page: String(number) })} aria-current={number === page ? "page" : undefined} className={`grid size-10 place-items-center border text-sm ${number === page ? "border-wine bg-wine text-white" : "bg-white"}`}>{new Intl.NumberFormat("fa-IR").format(number)}</Link>)}
      {page < pageCount ? <Link href={shopHref(path, params, { page: String(page + 1) })} className="grid size-10 place-items-center border" aria-label="صفحه بعد"><ArrowLeft className="size-4" /></Link> : null}
    </nav>
  );
}
