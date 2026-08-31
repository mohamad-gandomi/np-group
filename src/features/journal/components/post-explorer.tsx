"use client";

import { Search, X } from "lucide-react";
import { useState, type ReactNode } from "react";

import { journalNumber, normalizeSearch } from "../format";

type Entry = { slug: string; category: string; searchText: string; card: ReactNode };

export function PostExplorer({ entries, categories }: { entries: Entry[]; categories: ReadonlyArray<{ id: string; label: string }> }) {
  const [category, setCategory] = useState("all");
  const [query, setQuery] = useState("");
  const terms = normalizeSearch(query).split(/\s+/).filter(Boolean);
  const filtered = entries.filter((entry) => (category === "all" || entry.category === category) && terms.every((term) => normalizeSearch(entry.searchText).includes(term)));

  function reset() { setCategory("all"); setQuery(""); }

  return (
    <section id="articles" className="journal-library" aria-labelledby="articles-heading">
      <div className="journal-section-heading"><div><p className="journal-eyebrow">برای مکث و خواندن</p><h2 id="articles-heading">تازه‌های مجله</h2></div><span className="journal-result-count" role="status">{journalNumber.format(filtered.length)} مطلب</span></div>
      <div className="journal-explorer-controls">
        <div className="journal-filters" role="group" aria-label="موضوع مطالب">
          {[{ id: "all", label: "همه مطالب" }, ...categories].map((item) => <button type="button" key={item.id} onClick={() => setCategory(item.id)} aria-pressed={category === item.id} className="journal-filter">{item.label}</button>)}
        </div>
        <div className="journal-search"><Search size={18} aria-hidden="true" /><label className="sr-only" htmlFor="journal-search">جست‌وجو در مجله</label><input id="journal-search" type="search" placeholder="دنبال چه ایده‌ای هستید؟" value={query} onChange={(event) => setQuery(event.target.value)} />{query && <button type="button" onClick={() => setQuery("")} aria-label="پاک کردن جست‌وجو"><X size={16} /></button>}</div>
      </div>
      {filtered.length ? <div className="journal-card-grid">{filtered.map((entry) => <div key={entry.slug}>{entry.card}</div>)}</div> : <div className="journal-empty"><Search size={28} aria-hidden="true" /><h3>هنوز مطلبی با این جست‌وجو نداریم.</h3><p>واژه‌ای کوتاه‌تر امتحان کنید یا همه موضوع‌ها را ببینید.</p><button type="button" onClick={reset} className="journal-text-link">نمایش همه مطالب <ArrowReset /></button></div>}
    </section>
  );
}

function ArrowReset() { return <span aria-hidden="true">←</span>; }
