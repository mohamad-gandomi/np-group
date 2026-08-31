import Image from "next/image";
import Link from "next/link";
import { CircleUserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CartButton } from "@/features/cart/cart-context";
import { getCurrentUser } from "@/features/auth/session";
import { SavedButton } from "@/features/saved/saved-context";
import { DesktopNavigation, MobileNavigation } from "./site-navigation";

export async function SiteHeader() {
  const user = await getCurrentUser();
  return (
    <header className="sticky top-0 z-50 border-b border-black/10 bg-white/95 backdrop-blur-xl">
      <div className="border-b border-border/70 bg-wine py-2 text-center text-[0.7rem] text-primary-foreground sm:text-xs">مشاوره تخصصی انتخاب و تجهیز فضا · شنبه تا پنجشنبه، ۹ تا ۱۸</div>
      <div className="container-shell flex h-20 items-center justify-between gap-4 sm:h-24">
        <Link href="/" className="group flex items-center" aria-label="گروه ان‌پی، صفحه اصلی"><Image src="/logos/np-mark.png" alt="گروه ان‌پی" width={96} height={96} className="size-20 object-contain transition-transform group-hover:scale-105 sm:size-24" priority /></Link>
        <DesktopNavigation />
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center divide-x divide-black/10 border border-black/10 bg-white" dir="ltr">
            <Button asChild variant="ghost" size="icon-lg" className="relative size-11 rounded-none" aria-label={user ? "حساب کاربری" : "ورود یا ثبت‌نام"}><Link href={user ? "/account" : "/login"}><CircleUserRound className="size-[1.4rem]" />{user ? <span className="absolute end-1 top-1 size-2 rounded-full border border-white bg-wine" /> : null}</Link></Button>
            <SavedButton href={user ? "/account/saved" : "/login?next=/account/saved"} />
            <CartButton />
          </div>
          <Button asChild className="hidden h-11 rounded-none bg-wine px-5 sm:inline-flex"><Link href="/shop">فروشگاه</Link></Button>
          <MobileNavigation />
        </div>
      </div>
    </header>
  );
}
