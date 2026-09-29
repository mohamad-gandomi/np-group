import { Check, Hammer, Ruler, ShieldCheck, Sparkles, type LucideIcon } from "lucide-react";

import type { Product, ProductMeasurement } from "@/features/catalog/catalog-types";

type Props = { product: Product; warranty: string; assembly: string; care: string };

const numberFormatter = new Intl.NumberFormat("fa-IR");
const measurementUnitLabels = { cm: "سانتی‌متر", kg: "کیلوگرم", m: "متر", unit: "عدد" } as const;

const groupMeasurements = (measurements: readonly ProductMeasurement[]) => {
  const groups = new Map<string, ProductMeasurement[]>();
  for (const measurement of measurements) {
    const label = measurement.groupLabel?.trim() || "";
    const group = groups.get(label) ?? [];
    group.push(measurement);
    groups.set(label, group);
  }
  return [...groups.entries()].map(([label, items]) => ({ label, items }));
};

function PanelHeading({ icon: Icon, title, description }: { icon: LucideIcon; title: string; description: string }) {
  return (
    <header className="flex items-center gap-3">
      <span className="grid size-9 shrink-0 place-items-center border border-wine/15 bg-wine/5 text-wine">
        <Icon className="size-4" strokeWidth={1.8} />
      </span>
      <div>
        <h2 className="text-sm font-semibold sm:text-base">{title}</h2>
        <p className="mt-0.5 text-[11px] leading-5 text-muted-foreground">{description}</p>
      </div>
    </header>
  );
}

function MeasurementValue({ measurement, compact = false }: { measurement: ProductMeasurement; compact?: boolean }) {
  return (
    <div className={compact ? "flex min-w-0 items-center justify-between gap-4 border-t border-black/8 px-1 py-3" : "min-w-0 bg-secondary/30 px-4 py-3.5 text-right"}>
      <dt className="text-[11px] leading-5 text-muted-foreground">{measurement.label}</dt>
      <dd className={`flex shrink-0 items-baseline gap-1 text-foreground ${compact ? "" : "mt-1"}`}>
        <span className={compact ? "text-sm font-semibold" : "text-lg font-semibold tabular-nums sm:text-xl"}>
          {numberFormatter.format(measurement.value)}
        </span>
        <span className="text-[10px] text-muted-foreground">{measurementUnitLabels[measurement.unit]}</span>
      </dd>
    </div>
  );
}

export function ProductSpecifications({ product, warranty, assembly, care }: Props) {
  const measurementGroups = groupMeasurements(product.measurements ?? []);
  const specifications = product.technicalSpecs ?? [];
  const serviceItems = [`مدت ضمانت: ${warranty}`, assembly, "کنترل کیفیت پیش از ارسال"];

  return (
    <div className="grid gap-4" dir="rtl">
      <section className="border border-black/10 bg-white">
        <div className="grid lg:grid-cols-[15rem_minmax(0,1fr)]">
          <div className="border-b border-black/8 bg-secondary/20 p-5 sm:p-6 lg:border-b-0 lg:border-e">
            <PanelHeading icon={Ruler} title="مشخصات و ابعاد" description="اندازه‌ها و مقادیر فیزیکی محصول" />
            <p className="mt-4 text-xs leading-6 text-muted-foreground">
              اندازه‌ها برای مقایسه سریع و انتخاب دقیق‌تر، به تفکیک هر بخش نمایش داده شده‌اند.
            </p>
          </div>

          <div className="p-4 sm:p-6">
            {measurementGroups.length ? (
              <div className="grid gap-5">
                {measurementGroups.map((group) => {
                  const primaryItems = group.items.slice(0, 4);
                  const extraItems = group.items.slice(4);

                  return (
                    <div key={group.label || "measurements"}>
                      {group.label ? <h3 className="mb-2.5 text-xs font-medium text-foreground">{group.label}</h3> : null}
                      <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                        {primaryItems.map((measurement) => <MeasurementValue key={measurement.key} measurement={measurement} />)}
                      </dl>
                      {extraItems.length ? (
                        <dl className="mt-2 grid gap-x-6 sm:grid-cols-2">
                          {extraItems.map((measurement) => <MeasurementValue key={measurement.key} measurement={measurement} compact />)}
                        </dl>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="border border-dashed border-black/15 bg-secondary/20 px-5 py-7 text-center text-sm text-muted-foreground">
                ابعاد دقیق با انتخاب مدل مشخص می‌شود.
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(19rem,0.6fr)]">
        <section className="border border-black/10 bg-white p-5 sm:p-6">
          <PanelHeading icon={Hammer} title="ساخت و متریال" description="جنس و جزئیات ساخت محصول" />
          {specifications.length ? (
            <dl className="mt-5 grid gap-x-8 sm:grid-cols-2">
              {specifications.map((item) => (
                <div key={item.key} className="grid grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)] gap-3 border-t border-black/8 py-3 first:border-t-0 first:pt-0 sm:[&:nth-child(-n+2)]:border-t-0 sm:[&:nth-child(-n+2)]:pt-0">
                  <dt className="text-xs leading-6 text-muted-foreground">{item.label}</dt>
                  <dd className="text-xs font-medium leading-6 text-foreground">{item.value}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="mt-5 text-sm leading-7 text-muted-foreground">جزئیات ساخت پس از انتخاب مدل اعلام می‌شود.</p>
          )}
        </section>

        <div className="grid gap-4">
          <section className="border border-black/10 bg-white p-5 sm:p-6">
            <PanelHeading icon={Sparkles} title="نکات ثبت سفارش" description="موارد مهم پیش از نهایی‌کردن سفارش" />
            <p className="mt-5 border-s-2 border-wine bg-secondary/20 px-4 py-3 text-sm leading-7 text-muted-foreground">
              {product.orderNotes ?? care}
            </p>
          </section>

          <section className="border border-black/10 bg-white p-5 sm:p-6">
            <PanelHeading icon={ShieldCheck} title="ضمانت و خدمات" description="پشتیبانی از سفارش تا تحویل" />
            <ul className="mt-5 grid gap-3">
              {serviceItems.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm leading-6 text-muted-foreground">
                  <span className="mt-1 grid size-4 shrink-0 place-items-center bg-wine/10 text-wine">
                    <Check className="size-3" strokeWidth={2} />
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
