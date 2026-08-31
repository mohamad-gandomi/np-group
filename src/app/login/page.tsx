import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/features/auth/session";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "ورود یا ثبت‌نام" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const [user, params] = await Promise.all([getCurrentUser(), searchParams]);
  if (user) redirect("/account");
  const next = params.next?.startsWith("/") && !params.next.startsWith("//") ? params.next : "/account";

  return (
    <main data-page="login" className="relative min-h-svh w-full overflow-x-hidden bg-secondary/30">
      <Link
        href="/"
        className="absolute start-4 top-4 z-20 inline-flex h-10 items-center gap-2 border border-black/10 bg-white/90 px-4 text-xs font-medium shadow-sm backdrop-blur transition-colors hover:border-wine hover:text-wine sm:start-8 sm:top-8"
      >
        <ArrowRight className="size-4" />
        بازگشت به خانه
      </Link>

      <div className="grid min-h-svh w-full min-w-0 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
        <div className="flex min-w-0 items-center justify-center px-4 pb-10 pt-20 sm:px-8 sm:pb-14 sm:pt-24 lg:px-12 lg:py-16">
          <LoginForm next={next} />
        </div>

        <section className="relative hidden min-h-svh overflow-hidden lg:block">
          <Image
            src="/placeholders/project.jpg"
            alt="فضای داخلی طراحی‌شده توسط گروه ان‌پی"
            fill
            priority
            sizes="54vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/20 to-ink/5" />
          <div className="absolute inset-x-0 bottom-0 p-10 text-white xl:p-14">
            <p className="text-xs font-semibold tracking-[0.16em] text-white/70">حساب کاربری NPGroup</p>
            <h2 className="mt-4 max-w-xl text-3xl font-medium leading-[1.45] xl:text-4xl">
              سفارش‌ها، آدرس‌ها و هماهنگی‌های شما در یک فضای آرام و شفاف.
            </h2>
            <div className="mt-8 grid gap-4 text-sm text-white/80">
              <p className="flex items-center gap-3"><CheckCircle2 className="size-5 text-white" />پیگیری مرحله‌به‌مرحله وضعیت سفارش</p>
              <p className="flex items-center gap-3"><CheckCircle2 className="size-5 text-white" />دسترسی سریع به آدرس‌ها و اطلاعات تماس</p>
              <p className="flex items-center gap-3"><CheckCircle2 className="size-5 text-white" />ورود امن و بدون نیاز به رمز عبور</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
