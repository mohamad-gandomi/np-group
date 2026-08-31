import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowDownLeft, ArrowUpLeft } from "lucide-react";

import { PostCard } from "@/features/journal/components/post-card";
import { PostExplorer } from "@/features/journal/components/post-explorer";
import { formatJournalDate, journalNumber } from "@/features/journal/format";
import { categoryLabel, journalCategories, journalPosts, readingMinutes } from "@/features/journal/posts";
import { journalMetadata, journalSchema } from "@/features/journal/seo";

export const metadata = journalMetadata();

export default function BlogPage() {
  const featured = journalPosts[0];
  return (
    <main id="journal-main" className="journal" tabIndex={-1}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(journalSchema()).replace(/</g, "\\u003c") }} />
      <div className="journal-shell">
        <header className="journal-masthead">
          <div className="journal-masthead-top"><p className="journal-eyebrow"><span className="journal-dot" />مجله ان‌پی</p><p className="journal-english" lang="en" dir="ltr">THE NP JOURNAL</p></div>
          <div className="journal-masthead-main"><h1>برای خانه‌ای که<br /><span>دوستش دارید.</span></h1><div><p>کمی الهام، نگاهی دقیق‌تر.<br />یادداشت‌هایی درباره فضا، متریال و هنر زندگی.</p><a href="#articles" className="journal-text-link">در مجله قدم بزنید <ArrowDownLeft size={18} aria-hidden="true" /></a></div></div>
        </header>
        <section aria-label="مطلب منتخب" className="journal-featured">
          <Link className="journal-featured-image" href={`/blog/${featured.slug}`} aria-label={featured.title}><Image src={featured.image} alt={featured.imageAlt} fill sizes="(max-width: 800px) calc(100vw - 40px), (max-width: 1280px) 58vw, 740px" loading="eager" fetchPriority="high" /><span className="journal-image-label">انتخاب تحریریه <ArrowUpLeft size={16} aria-hidden="true" /></span></Link>
          <div className="journal-featured-copy"><p className="journal-eyebrow">۰۱ / {categoryLabel(featured.category)}</p><h2><Link href={`/blog/${featured.slug}`}>{featured.title}</Link></h2><p className="journal-featured-description">{featured.description}</p><div className="journal-meta"><time dateTime={featured.publishedAt}>{formatJournalDate(featured.publishedAt)}</time><span>{journalNumber.format(readingMinutes(featured))} دقیقه مطالعه</span></div><Link href={`/blog/${featured.slug}`} className="journal-text-link">خواندن این یادداشت <ArrowLeft size={18} aria-hidden="true" /></Link></div>
        </section>
        <PostExplorer categories={journalCategories} entries={journalPosts.map((post) => ({ slug: post.slug, category: post.category, searchText: `${post.title} ${post.description} ${categoryLabel(post.category)}`, card: <PostCard post={post} /> }))} />
        <aside className="journal-editor-note"><span className="journal-editor-mark" aria-hidden="true">ن‌پ</span><div><p className="journal-eyebrow">از تحریریه</p><h2>انتخاب‌های بهتر، از نگاه دقیق‌تر شروع می‌شوند.</h2><p>اینجا درباره چیزهایی می‌نویسیم که یک خانه را به خانه شما تبدیل می‌کنند؛ تناسب یک مبل، لمس یک پارچه و نوری که عصر را دلنشین‌تر می‌کند.</p><Link href="/about" className="journal-text-link">آشنایی با نگاه ان‌پی <ArrowLeft size={18} aria-hidden="true" /></Link></div><p className="journal-english" lang="en" dir="ltr">SPACES.<br />MATERIALS.<br />EVERYDAY LIFE.</p></aside>
      </div>
    </main>
  );
}
