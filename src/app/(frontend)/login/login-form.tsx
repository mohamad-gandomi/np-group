"use client";

import { ArrowLeft, CheckCircle2, Edit3, Loader2, LockKeyhole, Phone } from "lucide-react";
import { useEffect, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { maskPhone, toEnglishDigits } from "@/features/auth/phone";
import { requestOtp, verifyOtp } from "./actions";

export function LoginForm({ next }: { next: string }) {
  const [phase, setPhase] = useState<"phone" | "code">("phone");
  const [phoneInput, setPhoneInput] = useState("");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [developmentCode, setDevelopmentCode] = useState<string>();
  const [seconds, setSeconds] = useState(0);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (seconds <= 0) return;
    const timer = window.setInterval(() => setSeconds((current) => Math.max(0, current - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [seconds]);

  const send = () => startTransition(async () => {
    setError("");
    const result = await requestOtp(phoneInput);
    if (!result.ok || !result.phone) return setError(result.error ?? "خطایی رخ داد.");
    setPhone(result.phone);
    setDevelopmentCode(result.developmentCode);
    setSeconds(60);
    setPhase("code");
  });

  const verify = () => startTransition(async () => {
    setError("");
    const result = await verifyOtp(phone, code, next);
    if (result?.error) setError(result.error);
  });

  return (
    <div className="min-w-0 w-full max-w-md overflow-hidden border border-black/10 bg-white p-5 shadow-[0_24px_80px_rgb(32_27_28/0.08)] sm:p-9">
      <div className="grid size-12 place-items-center rounded-full bg-wine/8 text-wine"><LockKeyhole className="size-5" /></div>
      <h1 className="mt-6 text-3xl font-medium">ورود یا ثبت‌نام</h1>
      <p className="mt-3 text-sm leading-7 text-muted-foreground">با شماره موبایل وارد حساب خود شوید؛ اگر حسابی نداشته باشید، همان لحظه ساخته می‌شود.</p>

      {phase === "phone" ? <div className="mt-8">
        <label htmlFor="mobile" className="text-sm font-medium">شماره موبایل</label>
        <div className="mt-2 flex h-12 items-center border border-black/15 bg-white px-3 focus-within:border-wine">
          <Phone className="size-4 shrink-0 text-wine" />
          <input id="mobile" value={phoneInput} onChange={(event) => setPhoneInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") send(); }} type="tel" inputMode="tel" autoComplete="tel" placeholder="۰۹۱۲۱۲۳۴۵۶۷" dir="ltr" className="h-full min-w-0 flex-1 bg-transparent px-3 text-left text-base outline-none placeholder:text-muted-foreground/55" />
        </div>
        <Button type="button" onClick={send} disabled={pending} className="mt-4 h-12 w-full rounded-none bg-wine hover:bg-ink">{pending ? <Loader2 className="animate-spin" /> : <ArrowLeft />}دریافت کد ورود</Button>
      </div> : <div className="mt-8">
        <div className="flex min-w-0 items-center justify-between gap-2"><div className="min-w-0"><p className="text-sm font-medium">کد تأیید</p><p className="mt-1 text-xs text-muted-foreground" dir="ltr">{maskPhone(phone)}</p></div><Button type="button" variant="ghost" size="sm" className="shrink-0 px-2 sm:px-3" onClick={() => { setPhase("phone"); setCode(""); setError(""); }}><Edit3 />تغییر شماره</Button></div>
        <input value={code} onChange={(event) => setCode(toEnglishDigits(event.target.value).replace(/\D/g, "").slice(0, 6))} onKeyDown={(event) => { if (event.key === "Enter") verify(); }} aria-label="کد تأیید شش‌رقمی" inputMode="numeric" autoComplete="one-time-code" maxLength={6} dir="ltr" className="mt-5 h-14 min-w-0 w-full border border-black/15 bg-white px-2 text-center text-2xl tracking-[0.3em] outline-none focus:border-wine sm:tracking-[0.55em]" />
        {developmentCode ? <p className="mt-3 border border-dashed border-wine/30 bg-wine/5 px-3 py-2 text-center text-xs text-wine">کد ورود محیط توسعه: <span dir="ltr" className="font-semibold">{developmentCode}</span></p> : null}
        <Button type="button" onClick={verify} disabled={pending || code.length !== 6} className="mt-4 h-12 w-full rounded-none bg-wine hover:bg-ink">{pending ? <Loader2 className="animate-spin" /> : <CheckCircle2 />}تأیید و ورود</Button>
        <Button type="button" variant="ghost" disabled={pending || seconds > 0} onClick={send} className="mt-2 w-full text-xs text-muted-foreground">{seconds > 0 ? `ارسال دوباره تا ${new Intl.NumberFormat("fa-IR").format(seconds)} ثانیه` : "ارسال دوباره کد"}</Button>
      </div>}

      {error ? <p role="alert" className="mt-4 border border-destructive/20 bg-destructive/5 px-3 py-2 text-xs leading-6 text-destructive">{error}</p> : null}
      <p className="mt-6 text-center text-[0.68rem] leading-5 text-muted-foreground">با ادامه، قوانین استفاده و حریم خصوصی گروه ان‌پی را می‌پذیرید.</p>
    </div>
  );
}
