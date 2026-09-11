import type { Metadata } from "next";
import localFont from "next/font/local";

import { NotFoundPage } from "@/components/not-found-page";
import "./(frontend)/globals.css";

const ravi = localFont({
  src: "./(frontend)/fonts/Ravi-VF.ttf",
  variable: "--font-ravi",
  weight: "100 900",
  display: "swap",
});

export const metadata: Metadata = {
  title: "صفحه پیدا نشد | گروه ان‌پی",
  description: "نشانی درخواستی در وب‌سایت گروه ان‌پی پیدا نشد.",
};

export default function GlobalNotFound() {
  return <html lang="fa" dir="rtl" className={`${ravi.variable} antialiased`}><body><NotFoundPage /></body></html>;
}
