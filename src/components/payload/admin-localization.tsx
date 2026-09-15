"use client";

import { useEffect } from "react";

const TIME_ZONE = "Asia/Tehran";

const persianDateTimeFormatter = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
  day: "numeric",
  hour: "2-digit",
  hour12: false,
  minute: "2-digit",
  month: "long",
  timeZone: TIME_ZONE,
  year: "numeric",
});

const gregorianMonths = new Map([
  ["ژانویه", 1],
  ["فوریه", 2],
  ["مارس", 3],
  ["آوریل", 4],
  ["مه", 5],
  ["ژوئن", 6],
  ["ژوئیه", 7],
  ["اوت", 8],
  ["آگوست", 8],
  ["سپتامبر", 9],
  ["اکتبر", 10],
  ["نوامبر", 11],
  ["دسامبر", 12],
]);

const lexicalLabels = new Map([
  ["[SKIPPED] H2", "تیتر ۲"],
  ["[SKIPPED] H3", "تیتر ۳"],
  ["[SKIPPED] H4", "تیتر ۴"],
  ["[SKIPPED]", "تیتر"],
  ["H2", "۲"],
  ["H3", "۳"],
  ["H4", "۴"],
  ["Horizontal Rule", "خط افقی"],
  ["قاعده افقی", "خط افقی"],
  ["Table", "جدول"],
  ["Rows", "سطرها"],
  ["Row", "سطر"],
  ["Columns", "ستون‌ها"],
  ["Column", "ستون"],
  ["Insert row above", "افزودن سطر در بالا"],
  ["Insert row below", "افزودن سطر در پایین"],
  ["Insert column left", "افزودن ستون در چپ"],
  ["Insert column right", "افزودن ستون در راست"],
  ["Delete row", "حذف سطر"],
  ["Delete column", "حذف ستون"],
  ["Delete table", "حذف جدول"],
  ["Merge cells", "ادغام خانه‌ها"],
  ["Unmerge cells", "جداسازی خانه‌ها"],
  ["Add row header", "افزودن سرستون سطر"],
  ["Remove row header", "حذف سرستون سطر"],
  ["Add column header", "افزودن سرستون ستون"],
  ["Remove column header", "حذف سرستون ستون"],
  ["add dropdown", "افزودن محتوا"],
  ["text dropdown", "قالب متن"],
  ["align dropdown", "تراز متن"],
  ["Drag to move", "جابه‌جایی"],
  ["Add block", "افزودن بلوک"],
  ["Edit link", "ویرایش پیوند"],
  ["Remove link", "حذف پیوند"],
  ["Insert Paragraph", "افزودن پاراگراف"],
]);

const toLatinDigits = (value: string) => value
  .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
  .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)));

function parsePayloadDate(value: string) {
  const normalized = toLatinDigits(value).replace(/\u200c/g, " ").trim();
  const match = normalized.match(
    /^(ژانویه|فوریه|مارس|آوریل|مه|ژوئن|ژوئیه|اوت|آگوست|سپتامبر|اکتبر|نوامبر|دسامبر)\s+(\d{1,2})\s+(\d{4})(?:،|,)?\s*(?:(\d{1,2}):(\d{2})\s*(ق\.?\s*ظ\.?|ب\.?\s*ظ\.?)?)?$/,
  );

  if (!match) return null;

  const [, monthName, dayText, yearText, hourText = "0", minuteText = "0", period] = match;
  const month = gregorianMonths.get(monthName);
  if (!month) return null;

  let hour = Number(hourText);
  if (period?.startsWith("ب") && hour < 12) hour += 12;
  if (period?.startsWith("ق") && hour === 12) hour = 0;

  const iso = `${yearText}-${String(month).padStart(2, "0")}-${dayText.padStart(2, "0")}T${String(hour).padStart(2, "0")}:${minuteText}:00+03:30`;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date;
}

function localizeTextNode(node: Text) {
  const parent = node.parentElement;
  if (!parent || parent.closest("input, textarea, [contenteditable='true']")) return;

  const rawValue = node.nodeValue ?? "";
  const value = rawValue.trim();
  if (!value) return;

  if (/^[2-4]$/.test(value) && parent.closest("button")?.textContent?.trim().startsWith("تیتر")) {
    node.nodeValue = rawValue.replace(value, "۲۳۴"[Number(value) - 2]);
    return;
  }

  const lexicalLabel = lexicalLabels.get(value);
  if (lexicalLabel) {
    node.nodeValue = rawValue.replace(value, lexicalLabel);
    return;
  }

  if (!parent.closest(".doc-controls__value, [class*='cell-']")) return;

  const date = parsePayloadDate(value);
  if (!date) return;
  node.nodeValue = rawValue.replace(value, persianDateTimeFormatter.format(date));
}

function localizeElement(element: Element) {
  for (const attribute of ["aria-label", "title"]) {
    const value = element.getAttribute(attribute)?.trim();
    if (!value) continue;

    let localized = lexicalLabels.get(value);
    const headingLevel = value.match(/^تیتر ([2-4])$/)?.[1];
    if (headingLevel) localized = `تیتر ${"۲۳۴"[Number(headingLevel) - 2]}`;
    if (value === "[SKIPPED]") {
      const level = element.textContent?.match(/H([2-4])/)?.[1];
      if (level) localized = `تیتر ${"۲۳۴"[Number(level) - 2]}`;
    }

    if (!localized && element.closest(".doc-controls__value, [class*='cell-']")) {
      const date = parsePayloadDate(value);
      if (date) localized = persianDateTimeFormatter.format(date);
    }

    if (localized) element.setAttribute(attribute, localized);
  }
}

function localizeTree(root: Node) {
  if (root.nodeType === Node.TEXT_NODE) {
    localizeTextNode(root as Text);
    return;
  }

  if (root instanceof Element) {
    localizeElement(root);
    root.querySelectorAll("[aria-label], [title]").forEach(localizeElement);
  }

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();
  while (node) {
    localizeTextNode(node as Text);
    node = walker.nextNode();
  }
}

export function AdminPresentationLocalizer() {
  useEffect(() => {
    localizeTree(document.body);

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === "characterData") {
          localizeTextNode(mutation.target as Text);
          continue;
        }

        mutation.addedNodes.forEach(localizeTree);
      }
    });

    observer.observe(document.body, { characterData: true, childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return null;
}
