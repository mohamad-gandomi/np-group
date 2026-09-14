import { Gutter } from "@payloadcms/ui";
import type { AdminViewServerProps, PayloadRequest, Where } from "payload";
import Link from "next/link";

import type { Order } from "@/payload-types";
import { formatToman } from "@/payload/money";

const TIME_ZONE = "Asia/Tehran";
const TREND_DAYS = 30;

const orderStatusLabels: Record<NonNullable<Order["status"]>, string> = {
  pending_review: "در حال بررسی",
  confirmed: "تأیید شده",
  in_production: "در حال آماده‌سازی",
  ready: "آماده ارسال",
  shipped: "ارسال شده",
  delivered: "تحویل شده",
  cancelled: "لغو شده",
};

const shippingStatusLabels: Record<NonNullable<Order["shippingStatus"]>, string> = {
  manual_coordination: "هماهنگی دستی",
  quoted: "قیمت‌گذاری شده",
  shipment_pending: "در انتظار ارسال",
  creating: "در حال ثبت مرسوله",
  created: "مرسوله ثبت شده",
  in_transit: "در مسیر",
  delivered: "تحویل شده",
  failed: "خطای ارسال",
};

const numberFormatter = new Intl.NumberFormat("fa-IR");
const fullDateFormatter = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: TIME_ZONE,
});
const shortDateFormatter = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
  day: "numeric",
  month: "numeric",
  timeZone: "UTC",
});
const zonedPartsFormatter = new Intl.DateTimeFormat("en-CA", {
  day: "2-digit",
  hour: "2-digit",
  hourCycle: "h23",
  minute: "2-digit",
  month: "2-digit",
  second: "2-digit",
  timeZone: TIME_ZONE,
  year: "numeric",
});

type CalendarDay = {
  date: Date;
  key: string;
};

type DashboardData = {
  active: number;
  cancelled: number;
  customersThisMonth: number;
  fulfilled: number;
  latestOrders: Order[];
  pendingReview: number;
  shippingAttention: number;
  trend: Array<CalendarDay & { count: number }>;
};

function getZonedDateParts(date: Date) {
  const parts = Object.fromEntries(
    zonedPartsFormatter
      .formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, Number(part.value)]),
  );

  return {
    day: parts.day,
    hour: parts.hour,
    minute: parts.minute,
    month: parts.month,
    second: parts.second,
    year: parts.year,
  };
}

function calendarKey(date: Date) {
  const { day, month, year } = getZonedDateParts(date);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function toTimeZoneStart(year: number, month: number, day: number) {
  const desired = Date.UTC(year, month - 1, day);
  let timestamp = desired;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const actual = getZonedDateParts(new Date(timestamp));
    const actualTimestamp = Date.UTC(
      actual.year,
      actual.month - 1,
      actual.day,
      actual.hour,
      actual.minute,
      actual.second,
    );
    timestamp += desired - actualTimestamp;
  }

  return new Date(timestamp);
}

function getTrendDays(now: Date): CalendarDay[] {
  const today = getZonedDateParts(now);
  const logicalToday = new Date(Date.UTC(today.year, today.month - 1, today.day));

  return Array.from({ length: TREND_DAYS }, (_, index) => {
    const date = new Date(logicalToday);
    date.setUTCDate(logicalToday.getUTCDate() - (TREND_DAYS - 1 - index));
    return {
      date,
      key: `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`,
    };
  });
}

function queryOptions(req: PayloadRequest, where?: Where) {
  return {
    overrideAccess: false as const,
    req,
    user: req.user ?? undefined,
    ...(where ? { where } : {}),
  };
}

async function loadDashboardData(req: PayloadRequest): Promise<DashboardData> {
  const payload = req.payload;
  const now = new Date();
  const today = getZonedDateParts(now);
  const trendDays = getTrendDays(now);
  const [firstYear, firstMonth, firstDay] = trendDays[0].key.split("-").map(Number);
  const trendStart = toTimeZoneStart(firstYear, firstMonth, firstDay).toISOString();
  const monthStart = toTimeZoneStart(today.year, today.month, 1).toISOString();

  const pendingWhere: Where = { status: { equals: "pending_review" } };
  const activeWhere: Where = { status: { in: ["confirmed", "in_production", "ready"] } };

  const [pending, active, shippingAttention, newCustomers, fulfilled, cancelled, trendOrders, latestOrders] = await Promise.all([
    payload.count({ collection: "orders", ...queryOptions(req, pendingWhere) }),
    payload.count({ collection: "orders", ...queryOptions(req, activeWhere) }),
    payload.count({
      collection: "orders",
      ...queryOptions(req, {
        and: [
          { shippingStatus: { in: ["manual_coordination", "shipment_pending", "failed"] } },
          { status: { not_in: ["cancelled", "delivered"] } },
        ],
      }),
    }),
    payload.count({
      collection: "customers",
      ...queryOptions(req, { createdAt: { greater_than_equal: monthStart } }),
    }),
    payload.count({
      collection: "orders",
      ...queryOptions(req, { status: { in: ["shipped", "delivered"] } }),
    }),
    payload.count({ collection: "orders", ...queryOptions(req, { status: { equals: "cancelled" } }) }),
    payload.find({
      collection: "orders",
      depth: 0,
      pagination: false,
      select: { createdAt: true },
      ...queryOptions(req, { createdAt: { greater_than_equal: trendStart } }),
    }),
    payload.find({
      collection: "orders",
      depth: 0,
      limit: 7,
      sort: "-createdAt",
      select: {
        amount: true,
        contactName: true,
        createdAt: true,
        orderNumber: true,
        shippingStatus: true,
        status: true,
      },
      ...queryOptions(req),
    }),
  ]);

  const counts = new Map(trendDays.map((day) => [day.key, 0]));
  for (const order of trendOrders.docs) {
    const key = calendarKey(new Date(order.createdAt));
    if (counts.has(key)) counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return {
    active: active.totalDocs,
    cancelled: cancelled.totalDocs,
    customersThisMonth: newCustomers.totalDocs,
    fulfilled: fulfilled.totalDocs,
    latestOrders: latestOrders.docs as Order[],
    pendingReview: pending.totalDocs,
    shippingAttention: shippingAttention.totalDocs,
    trend: trendDays.map((day) => ({ ...day, count: counts.get(day.key) ?? 0 })),
  };
}

function SummaryCard({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <article className={`nilper-dashboard__summary nilper-dashboard__summary--${tone}`}>
      <span>{label}</span>
      <strong>{numberFormatter.format(value)}</strong>
    </article>
  );
}

function OrdersTrendChart({ data }: { data: DashboardData["trend"] }) {
  const hasOrders = data.some((day) => day.count > 0);
  if (!hasOrders) {
    return <div className="nilper-dashboard__empty">در ۳۰ روز گذشته سفارشی ثبت نشده است.</div>;
  }

  const width = 720;
  const height = 230;
  const insetX = 34;
  const insetTop = 18;
  const insetBottom = 36;
  const chartHeight = height - insetTop - insetBottom;
  const max = Math.max(...data.map((day) => day.count), 1);
  const x = (index: number) => insetX + (index / (data.length - 1)) * (width - insetX * 2);
  const y = (value: number) => insetTop + chartHeight - (value / max) * chartHeight;
  const path = data.map((day, index) => `${index === 0 ? "M" : "L"} ${x(index)} ${y(day.count)}`).join(" ");
  const tickIndexes = [0, 7, 14, 21, data.length - 1];

  return (
    <div className="nilper-dashboard__trend-chart" dir="ltr">
      <svg role="img" viewBox={`0 0 ${width} ${height}`} aria-labelledby="orders-trend-title orders-trend-description">
        <title id="orders-trend-title">تعداد سفارش‌های روزانه در ۳۰ روز گذشته</title>
        <desc id="orders-trend-description">نمودار خطی تعداد سفارش‌های ثبت شده در هر روز</desc>
        {[0, 0.5, 1].map((ratio) => {
          const gridY = insetTop + chartHeight * ratio;
          const label = Math.round(max * (1 - ratio));
          return (
            <g key={ratio}>
              <line className="nilper-dashboard__grid-line" x1={insetX} x2={width - insetX} y1={gridY} y2={gridY} />
              <text className="nilper-dashboard__axis-label" x={insetX - 9} y={gridY + 4} textAnchor="end">
                {numberFormatter.format(label)}
              </text>
            </g>
          );
        })}
        <path className="nilper-dashboard__trend-line" d={path} />
        {data.map((day, index) => day.count > 0 && (
          <circle key={day.key} className="nilper-dashboard__trend-point" cx={x(index)} cy={y(day.count)} r="3.5" />
        ))}
        {tickIndexes.map((index) => (
          <text key={data[index].key} className="nilper-dashboard__axis-label" x={x(index)} y={height - 10} textAnchor="middle">
            {shortDateFormatter.format(data[index].date)}
          </text>
        ))}
      </svg>
    </div>
  );
}

function StatusOverview({ data }: { data: DashboardData }) {
  const groups = [
    { label: "در انتظار بررسی", value: data.pendingReview, tone: "review" },
    { label: "در جریان", value: data.active, tone: "active" },
    { label: "ارسال و تحویل", value: data.fulfilled, tone: "fulfilled" },
    { label: "لغو شده", value: data.cancelled, tone: "cancelled" },
  ];
  const max = Math.max(...groups.map((group) => group.value));

  if (max === 0) {
    return <div className="nilper-dashboard__empty nilper-dashboard__empty--small">هنوز سفارشی برای نمایش وضعیت وجود ندارد.</div>;
  }

  return (
    <div className="nilper-dashboard__status-chart">
      {groups.map((group) => (
        <div className="nilper-dashboard__status-row" key={group.label}>
          <div className="nilper-dashboard__status-meta">
            <span>{group.label}</span>
            <strong>{numberFormatter.format(group.value)}</strong>
          </div>
          <div className="nilper-dashboard__status-track" aria-hidden="true">
            <span
              className={`nilper-dashboard__status-fill nilper-dashboard__status-fill--${group.tone}`}
              style={{ width: `${Math.max((group.value / max) * 100, group.value > 0 ? 4 : 0)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function StatusBadge({ children, tone }: { children: React.ReactNode; tone?: string | null }) {
  return <span className={`nilper-dashboard__badge nilper-dashboard__badge--${tone ?? "neutral"}`}>{children}</span>;
}

function LatestOrders({ orders }: { orders: Order[] }) {
  if (orders.length === 0) {
    return <div className="nilper-dashboard__empty">هنوز سفارشی ثبت نشده است.</div>;
  }

  return (
    <>
      <div className="nilper-dashboard__table-wrap">
        <table className="nilper-dashboard__table">
          <thead>
            <tr>
              <th>شماره سفارش</th>
              <th>مشتری</th>
              <th>مبلغ</th>
              <th>وضعیت سفارش</th>
              <th>وضعیت ارسال</th>
              <th>تاریخ</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td><Link href={`/admin/collections/orders/${order.id}`}>{order.orderNumber}</Link></td>
                <td>{order.contactName || "بدون نام"}</td>
                <td>{formatToman(order.amount ?? 0)}</td>
                <td><StatusBadge tone={order.status}>{orderStatusLabels[order.status ?? "pending_review"]}</StatusBadge></td>
                <td><StatusBadge tone={order.shippingStatus}>{order.shippingStatus ? shippingStatusLabels[order.shippingStatus] : "ثبت نشده"}</StatusBadge></td>
                <td>{fullDateFormatter.format(new Date(order.createdAt))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="nilper-dashboard__mobile-orders">
        {orders.map((order) => (
          <Link className="nilper-dashboard__mobile-order" href={`/admin/collections/orders/${order.id}`} key={order.id}>
            <div className="nilper-dashboard__mobile-order-head">
              <strong>{order.orderNumber}</strong>
              <span>{fullDateFormatter.format(new Date(order.createdAt))}</span>
            </div>
            <div className="nilper-dashboard__mobile-order-main">
              <span>{order.contactName || "بدون نام"}</span>
              <strong>{formatToman(order.amount ?? 0)}</strong>
            </div>
            <div className="nilper-dashboard__mobile-order-statuses">
              <StatusBadge tone={order.status}>{orderStatusLabels[order.status ?? "pending_review"]}</StatusBadge>
              <StatusBadge tone={order.shippingStatus}>{order.shippingStatus ? shippingStatusLabels[order.shippingStatus] : "ثبت نشده"}</StatusBadge>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}

function DashboardError() {
  return (
    <Gutter className="nilper-dashboard">
      <div className="nilper-dashboard__heading">
        <div>
          <h1>داشبورد مدیریت</h1>
          <p>{fullDateFormatter.format(new Date())}</p>
        </div>
      </div>
      <div className="nilper-dashboard__empty nilper-dashboard__empty--error">
        اطلاعات داشبورد در حال حاضر در دسترس نیست. کمی بعد دوباره تلاش کنید.
      </div>
    </Gutter>
  );
}

export async function AdminDashboard({ initPageResult }: AdminViewServerProps) {
  let data: DashboardData;
  try {
    data = await loadDashboardData(initPageResult.req);
  } catch (error) {
    initPageResult.req.payload.logger.error({ err: error }, "Failed to load Nilper admin dashboard");
    return <DashboardError />;
  }

  return (
    <Gutter className="nilper-dashboard">
      <header className="nilper-dashboard__heading">
        <div>
          <h1>داشبورد مدیریت</h1>
          <p>{fullDateFormatter.format(new Date())}</p>
        </div>
        <Link className="nilper-dashboard__all-orders" href="/admin/collections/orders">همه سفارش‌ها</Link>
      </header>

      <section className="nilper-dashboard__summaries" aria-label="خلاصه فعالیت‌های نیازمند توجه">
        <SummaryCard label="نیازمند بررسی" value={data.pendingReview} tone="review" />
        <SummaryCard label="سفارش‌های فعال" value={data.active} tone="active" />
        <SummaryCard label="نیازمند پیگیری ارسال" value={data.shippingAttention} tone="shipping" />
        <SummaryCard label="مشتریان جدید" value={data.customersThisMonth} tone="customers" />
      </section>

      <div className="nilper-dashboard__charts">
        <section className="nilper-dashboard__section nilper-dashboard__section--trend">
          <div className="nilper-dashboard__section-heading">
            <div>
              <h2>روند سفارش‌ها</h2>
              <p>تعداد سفارش‌های ثبت‌شده در ۳۰ روز اخیر</p>
            </div>
          </div>
          <OrdersTrendChart data={data.trend} />
        </section>

        <section className="nilper-dashboard__section nilper-dashboard__section--status">
          <div className="nilper-dashboard__section-heading">
            <div>
              <h2>نمای کلی وضعیت‌ها</h2>
              <p>گروه‌بندی چرخه سفارش</p>
            </div>
          </div>
          <StatusOverview data={data} />
        </section>
      </div>

      <section className="nilper-dashboard__section nilper-dashboard__latest">
        <div className="nilper-dashboard__section-heading">
          <div>
            <h2>آخرین سفارش‌ها</h2>
            <p>تا ۷ سفارش تازه ثبت‌شده</p>
          </div>
        </div>
        <LatestOrders orders={data.latestOrders} />
      </section>
    </Gutter>
  );
}
