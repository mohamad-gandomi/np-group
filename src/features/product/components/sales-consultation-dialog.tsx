"use client";

import { Clock3, Mail, MapPin, MessageCircle, Phone, Store, X } from "lucide-react";
import { Dialog } from "radix-ui";

import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import type { SalesContact } from "../payload-sales-contacts";

const latinDigits = (value: string) => value
  .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
  .replace(/[^\d+]/g, "");

const telHref = (value: string) => `tel:${latinDigits(value)}`;

const whatsappHref = (value: string) => {
  const digits = latinDigits(value).replace(/^\+/, "");
  const international = digits.startsWith("0") ? `98${digits.slice(1)}` : digits;
  return `https://wa.me/${international}`;
};

export function SalesConsultationDialog({ contacts }: { contacts: readonly SalesContact[] }) {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <Button variant="outline" className="mt-3 h-11 w-full rounded-none border-black/15 bg-white hover:border-wine hover:text-wine">
          <Phone className="size-4" />گفت‌وگو با مشاور
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-[2px] data-[state=closed]:animate-out data-[state=open]:animate-in" />
        <Dialog.Content dir="rtl" className="fixed inset-x-3 top-1/2 z-[100] max-h-[88svh] -translate-y-1/2 overflow-y-auto border border-black/10 bg-[#f7f5f0] p-0 shadow-2xl outline-none sm:inset-x-auto sm:left-1/2 sm:w-[min(46rem,calc(100vw-3rem))] sm:-translate-x-1/2">
          <div className="sticky top-0 z-10 flex items-start justify-between gap-6 border-b border-black/10 bg-[#f7f5f0]/95 px-5 py-5 backdrop-blur sm:px-7">
            <div>
              <p className="text-xs font-semibold text-wine">مشاوره انتخاب و سفارش</p>
              <Dialog.Title className="mt-2 text-2xl font-semibold sm:text-3xl">از یک گفت‌وگوی کوتاه شروع کنیم</Dialog.Title>
              <Dialog.Description className="mt-2 max-w-xl text-sm leading-7 text-muted-foreground">
                برای بررسی موجودی، پارچه، رنگ، ابعاد یا زمان ساخت، با فروشگاه یا یکی از مشاوران فروش تماس بگیرید.
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button type="button" className="grid size-10 shrink-0 place-items-center border border-black/10 bg-white transition hover:border-wine hover:text-wine" aria-label="بستن پنجره">
                <X className="size-5" />
              </button>
            </Dialog.Close>
          </div>

          <div className="p-5 sm:p-7">
            <section className="border border-black/10 bg-ink p-5 text-white sm:p-6" aria-labelledby="main-store-title">
              <div className="flex items-start gap-4">
                <span className="grid size-11 shrink-0 place-items-center bg-wine"><Store className="size-5" /></span>
                <div className="min-w-0 flex-1">
                  <h3 id="main-store-title" className="text-lg font-semibold">{siteConfig.storeName}</h3>
                  <p className="mt-2 text-sm leading-7 text-white/65">پاسخ‌گویی عمومی فروشگاه، هماهنگی مراجعه و پیگیری سفارش‌ها</p>
                </div>
              </div>
              <div className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
                <div className="grid gap-2">
                  {siteConfig.phones.map((phone) => <a key={phone.number} href={phone.href} className="flex min-h-11 items-center gap-3 border border-white/15 px-4 transition hover:border-white/45 hover:bg-white/5"><Phone className="size-4 text-wine" /><bdi dir="ltr">{phone.label}</bdi></a>)}
                </div>
                <a href={`mailto:${siteConfig.email}`} className="flex min-h-11 items-center gap-3 border border-white/15 px-4 transition hover:border-white/45 hover:bg-white/5"><Mail className="size-4 text-wine" /><bdi dir="ltr">{siteConfig.email}</bdi></a>
              </div>
              <div className="mt-4 grid gap-3 border-t border-white/12 pt-4 text-xs leading-6 text-white/65 sm:grid-cols-2">
                <a href={siteConfig.directionsUrl} target="_blank" rel="noopener noreferrer" className="flex items-start gap-2 hover:text-white"><MapPin className="mt-1 size-4 shrink-0 text-wine" />{siteConfig.addressLabel}</a>
                <p className="flex items-start gap-2"><Clock3 className="mt-1 size-4 shrink-0 text-wine" />{siteConfig.hoursLabel}</p>
              </div>
            </section>

            <div className="mb-4 mt-7 flex items-end justify-between gap-4">
              <div><p className="text-xs font-semibold text-wine">مشاوران فروش</p><h3 className="mt-1 text-xl font-semibold">انتخاب مشاور</h3></div>
              <span className="text-xs text-muted-foreground">{new Intl.NumberFormat("fa-IR").format(contacts.length)} نفر</span>
            </div>

            {contacts.length ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {contacts.map((contact) => (
                  <article key={contact.id} className="flex h-full flex-col border border-black/10 bg-white p-4">
                    <div className="flex items-center gap-3">
                      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-wine/10 font-semibold text-wine">{contact.name.trim().charAt(0)}</span>
                      <div><h4 className="font-semibold">{contact.name}</h4><p className="mt-1 text-xs text-muted-foreground">{contact.title}</p></div>
                    </div>
                    <p className="mt-4 flex-1 text-xs leading-6 text-muted-foreground">{contact.description}</p>
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <a href={telHref(contact.phone)} className="flex min-h-10 items-center justify-center gap-2 bg-ink px-3 text-xs text-white transition hover:bg-wine"><Phone className="size-3.5" />تماس</a>
                      {contact.whatsappPhone ? <a href={whatsappHref(contact.whatsappPhone)} target="_blank" rel="noopener noreferrer" className="flex min-h-10 items-center justify-center gap-2 border border-black/10 px-3 text-xs transition hover:border-wine hover:text-wine"><MessageCircle className="size-3.5" />واتساپ</a> : <a href={contact.email ? `mailto:${contact.email}` : telHref(contact.phone)} className="flex min-h-10 items-center justify-center gap-2 border border-black/10 px-3 text-xs transition hover:border-wine hover:text-wine">{contact.email ? <Mail className="size-3.5" /> : <MessageCircle className="size-3.5" />}{contact.email ? "ایمیل" : "گفت‌وگو"}</a>}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="border border-dashed border-black/15 bg-white px-5 py-7 text-center">
                <p className="text-sm font-medium">مشاور مستقیمی برای نمایش ثبت نشده است.</p>
                <p className="mt-2 text-xs leading-6 text-muted-foreground">برای دریافت راهنمایی با شماره اصلی فروشگاه تماس بگیرید.</p>
              </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
