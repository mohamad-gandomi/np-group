import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { siteConfig } from "@/config/site";
import { CartProvider } from "@/features/cart/cart-context";
import { SavedProvider } from "@/features/saved/saved-context";
import "./globals.css";

const ravi = localFont({
  src: "./fonts/Ravi-VF.ttf",
  variable: "--font-ravi",
  weight: "100 900",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: "گروه ان‌پی | مبلمان و روشنایی برای فضاهای ماندگار",
    template: "%s | گروه ان‌پی",
  },
  description:
    "انتخابی ممتاز از مبلمان، روشنایی، پارچه و اکسسوری برای خانه‌ها، هتل‌ها، رستوران‌ها و فضاهای کاری.",
  keywords: [
    "مبلمان لوکس",
    "روشنایی",
    "لوستر",
    "پارچه مبلی",
    "طراحی داخلی",
    "تجهیز هتل",
  ],
  openGraph: {
    title: "گروه ان‌پی | طراحی برای زندگی بهتر",
    description:
      "مجموعه‌ای از مبلمان، روشنایی و جزئیات انتخاب‌شده برای فضاهای ماندگار.",
    locale: "fa_IR",
    type: "website",
    images: [{ url: "/placeholders/hero.jpg", width: 2000, height: 1500 }],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ff0021",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fa" dir="rtl" className={`${ravi.variable} antialiased`}>
      <body><SavedProvider><CartProvider><SiteHeader />{children}<SiteFooter /></CartProvider></SavedProvider></body>
    </html>
  );
}
