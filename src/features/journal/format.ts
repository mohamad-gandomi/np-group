const dateFormatter = new Intl.DateTimeFormat("fa-IR", {
  day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Tehran",
});
export const journalNumber = new Intl.NumberFormat("fa-IR");
export const formatJournalDate = (date: string) => dateFormatter.format(new Date(date));

export function normalizeSearch(text: string) {
  return text.normalize("NFKC").replace(/ي/g, "ی").replace(/ك/g, "ک")
    .replace(/[\u064B-\u065F\u0670]/g, "").replace(/\u200c/g, " ").trim().toLocaleLowerCase("fa");
}
