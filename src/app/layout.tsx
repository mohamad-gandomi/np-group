import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

const ravi = localFont({
  src: "./fonts/Ravi-VF.ttf",
  variable: "--font-ravi",
  weight: "100 900",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "گروه ام‌پی | مبلمان و روشنایی برای فضاهای ماندگار",
    template: "%s | گروه ام‌پی",
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
    title: "گروه ام‌پی | طراحی برای زندگی بهتر",
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
      <body>{children}</body>
    </html>
  );
}
