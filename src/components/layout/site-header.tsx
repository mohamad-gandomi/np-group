import Image from "next/image";
import Link from "next/link";
import { CircleUserRound, MapPin, Phone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CartButton } from "@/features/cart/cart-context";
import { SavedButton } from "@/features/saved/saved-context";
import { DesktopNavigation, MobileNavigation } from "./site-navigation";
import { siteConfig } from "@/config/site";

export function SiteHeader() {
  // Public pages must not depend on request cookies. Account routes handle
  // authentication and preserve the return URL through the auth proxy.
  return (
    <header className="sticky top-0 z-50 border-b border-black/10 bg-white/95 backdrop-blur-xl">
      <div className="border-b border-border/70 bg-wine text-primary-foreground"><div className="mx-auto flex max-w-5xl items-center justify-center gap-3 px-4 py-1 text-[0.65rem] leading-5 sm:gap-7 sm:text-xs"><a href={siteConfig.directionsUrl} target="_blank" rel="noopener noreferrer" className="flex min-h-8 min-w-0 items-center gap-2 py-1 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white" aria-label={`مسیریابی: ${siteConfig.addressLabel} (پنجره جدید)`}><MapPin className="size-3.5 shrink-0" aria-hidden="true" /><span>{siteConfig.addressLabel}</span></a><span className="h-4 w-px shrink-0 bg-white/35" aria-hidden="true" /><a href={siteConfig.phoneHref} className="flex min-h-8 shrink-0 items-center gap-2 whitespace-nowrap py-1 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white" aria-label={`تماس با فروشگاه: ${siteConfig.phoneLabel}`}><Phone className="hidden size-3.5 sm:block" aria-hidden="true" /><bdi dir="ltr">{siteConfig.phoneLabel}</bdi></a></div></div>
      <div className="container-shell flex h-20 items-center justify-between gap-4 sm:h-24">
        <Link href="/" className="group flex items-center" aria-label="گروه ان‌پی، صفحه اصلی"><Image src="/logos/np-mark.png" alt="گروه ان‌پی" width={96} height={96} className="size-20 object-contain transition-transform group-hover:scale-105 sm:size-24" priority /></Link>
        <DesktopNavigation />
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center divide-x divide-black/10 border border-black/10 bg-white" dir="ltr">
            <Button asChild variant="ghost" size="icon-lg" className="relative size-11 rounded-none" aria-label="حساب کاربری یا ورود"><Link href="/account" prefetch={false}><CircleUserRound className="size-[1.4rem]" /></Link></Button>
            <SavedButton href="/account/saved" />
            <CartButton />
          </div>
          <Button asChild className="hidden h-11 rounded-none bg-wine px-5 sm:inline-flex"><Link href="/shop">فروشگاه</Link></Button>
          <MobileNavigation />
        </div>
      </div>
    </header>
  );
}
