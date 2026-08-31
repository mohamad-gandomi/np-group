"use client";

import Link from "next/link";
import { Bookmark } from "lucide-react";

import { useSaved } from "@/features/saved/saved-context";

const numberFormatter = new Intl.NumberFormat("fa-IR");

export function SavedSummaryCard() {
  const { count } = useSaved();
  return (
    <Link href="/account/saved" className="border border-black/10 bg-white p-5 transition hover:border-wine">
      <Bookmark className="size-5 text-wine" />
      <p className="mt-5 text-2xl font-semibold">{numberFormatter.format(count)}</p>
      <p className="mt-1 text-xs text-muted-foreground">محصول ذخیره‌شده</p>
    </Link>
  );
}
