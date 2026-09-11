import type { Metadata } from "next";

import { NotFoundPage } from "@/components/not-found-page";

export const metadata: Metadata = { title: "صفحه پیدا نشد", robots: { index: false, follow: true } };

export default function NotFound() {
  return <NotFoundPage />;
}
