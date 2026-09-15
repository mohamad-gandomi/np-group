"use client";

import { useEffect, useState } from "react";

const TIME_ZONE = "Asia/Tehran";

const dateFormatter = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
  day: "numeric",
  month: "long",
  timeZone: TIME_ZONE,
  weekday: "long",
  year: "numeric",
});

const timeFormatter = new Intl.DateTimeFormat("fa-IR", {
  hour: "2-digit",
  hour12: false,
  minute: "2-digit",
  timeZone: TIME_ZONE,
});

function formatPersianDate(date: Date) {
  const parts = Object.fromEntries(
    dateFormatter
      .formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );

  return `${parts.weekday} ${parts.day} ${parts.month} ${parts.year}`;
}

export function AdminDateTime() {
  const [date, setDate] = useState<Date | null>(null);

  useEffect(() => {
    const updateTime = () => setDate(new Date());
    updateTime();

    const interval = window.setInterval(updateTime, 30_000);
    return () => window.clearInterval(interval);
  }, []);

  if (!date) {
    return <span className="nilper-admin-datetime nilper-admin-datetime--loading" aria-hidden="true" />;
  }

  return (
    <time className="nilper-admin-datetime" dateTime={date.toISOString()}>
      <span className="nilper-admin-datetime__date">{formatPersianDate(date)}</span>
      <span className="nilper-admin-datetime__time">{timeFormatter.format(date)}</span>
    </time>
  );
}
