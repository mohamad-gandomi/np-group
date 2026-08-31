"use client";

import { useId, useState, type ReactNode } from "react";
import { Search, X } from "lucide-react";

type Entry = { id: string; search: string; categories: string[]; card: ReactNode };
const normalize = (value: string) => value.toLocaleLowerCase().normalize("NFD").replace(/[\u0300-\u036f\u064b-\u065f]/g, "").replace(/ي/g, "ی").replace(/ك/g, "ک").replace(/[\u200c\s]+/g, " ").trim();

export function ShowcaseExplorer({ entries, filters, kind }: { entries: Entry[]; filters: { value: string; label: string }[]; kind: "projects" | "brands" }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const id = useId();
  const words = normalize(query).split(" ").filter(Boolean);
  const visible = entries.filter((entry) => (category === "all" || entry.categories.includes(category)) && words.every((word) => normalize(entry.search).includes(word)));
  const reset = () => { setQuery(""); setCategory("all"); };
  return <div className="showcase-explorer">
    <div className="showcase-controls">
      <div className="showcase-filters" role="group" aria-label={kind === "projects" ? "نوع فضا" : "دسته محصولات برند"}>
        {[{ value: "all", label: "همه" }, ...filters].map((filter) => <button key={filter.value} type="button" aria-pressed={category === filter.value} aria-controls={`${id}-results`} onClick={() => setCategory(filter.value)}>{filter.label}</button>)}
      </div>
      <div className="showcase-search"><Search size={17} aria-hidden="true" /><label className="sr-only" htmlFor={`${id}-search`}>{kind === "projects" ? "جست‌وجوی پروژه‌ها" : "جست‌وجوی برندها"}</label><input id={`${id}-search`} type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={kind === "projects" ? "جست‌وجوی فضا یا ایده…" : "نام برند یا نوع محصول…"} aria-controls={`${id}-results`} />{query && <button type="button" aria-label="پاک کردن جست‌وجو" onClick={() => setQuery("")}><X size={16} /></button>}</div>
    </div>
    <p className="showcase-result-count" role="status" aria-live="polite" aria-atomic="true">{new Intl.NumberFormat("fa-IR").format(visible.length)} {kind === "projects" ? "فضا" : "برند"} برای کشف کردن</p>
    <div id={`${id}-results`} className={`showcase-results showcase-results--${kind}`}>
      {visible.map((entry) => <div key={entry.id}>{entry.card}</div>)}
    </div>
    {!visible.length && <div className="showcase-empty"><h3>نتیجه‌ای پیدا نشد.</h3><p>عبارت کوتاه‌تری بنویسید یا دسته دیگری را ببینید.</p><button type="button" className="showcase-button" onClick={reset}>نمایش همه</button></div>}
  </div>;
}
