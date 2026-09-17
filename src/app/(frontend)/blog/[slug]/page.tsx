import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ChevronDown, ChevronLeft, Clock3 } from "lucide-react";

import { ArticleTools } from "@/features/journal/components/article-tools";
import { JournalRichText } from "@/features/journal/components/journal-rich-text";
import { PostCard } from "@/features/journal/components/post-card";
import { formatJournalDate, journalNumber } from "@/features/journal/format";
import { getJournalPost, getJournalPosts } from "@/features/journal/payload-journal-repository";
import { journalMetadata, journalSchema } from "@/features/journal/seo";

type Props = { params: Promise<{ slug: string }> };
export const dynamicParams = true;
export const revalidate = 300;
export async function generateStaticParams() { return (await getJournalPosts()).map((post) => ({ slug: post.slug })); }
export async function generateMetadata({ params }: Props) {
  const post = await getJournalPost((await params).slug);
  if (!post) return { title: "یادداشت پیدا نشد", robots: { index: false, follow: true } };
  return journalMetadata(post);
}

export default async function ArticlePage({ params }: Props) {
  const post = await getJournalPost((await params).slug);
  if (!post) notFound();
  const posts = await getJournalPosts();
  const related = post.relatedSlugs.map((slug) => posts.find((item) => item.slug === slug)).filter((item) => item !== undefined).slice(0, 2);
  const contents = <ol>{post.toc.map((item, index) => <li key={item.id}><a href={`#${item.id}`}><span>{journalNumber.format(index + 1).padStart(2, "۰")}</span>{item.title}</a></li>)}<li><a href="#takeaway"><span aria-hidden="true">←</span>یادداشت آخر</a></li></ol>;

  return (
    <main id="journal-main" className="journal journal-article" tabIndex={-1}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(journalSchema(post)).replace(/</g, "\\u003c") }} />
      <div className="journal-shell">
        <nav className="journal-breadcrumbs" aria-label="مسیر صفحه"><Link href="/">خانه</Link><ChevronLeft size={12} aria-hidden="true" /><Link href="/blog">مجله ان‌پی</Link><ChevronLeft size={12} aria-hidden="true" /><span aria-current="page">{post.title}</span></nav>
        <article>
          <header className="journal-article-header"><Link href="/blog#articles" className="journal-eyebrow">{post.categoryLabel}</Link><h1>{post.title}</h1><p className="journal-article-deck">{post.description}</p><div className="journal-byline"><Link href={post.author.url} className="journal-author-link"><span aria-hidden="true" className="journal-author-avatar">ن‌پ</span>{post.author.name}</Link><span className="journal-byline-date">انتشار <time dateTime={post.publishedAt}>{formatJournalDate(post.publishedAt)}</time></span><span className="journal-reading-time"><Clock3 size={15} aria-hidden="true" />{journalNumber.format(post.readingTimeMinutes)} دقیقه مطالعه</span></div>{post.updatedAt !== post.publishedAt && <p className="journal-updated">آخرین بازبینی: <time dateTime={post.updatedAt}>{formatJournalDate(post.updatedAt)}</time></p>}</header>
          <figure className="journal-cover"><div>{post.image ? <Image src={post.image} alt={post.imageAlt} fill sizes="(max-width: 1280px) calc(100vw - 40px), 1240px" loading="eager" fetchPriority="high" /> : null}</div>{post.image && post.imageCaption ? <figcaption>{post.imageCaption}</figcaption> : null}</figure>
          <div className="journal-reading-layout">
            <aside className="journal-sidebar"><nav aria-label="فهرست این مطلب"><p className="journal-eyebrow">در این یادداشت</p>{contents}</nav><Link href="/blog" className="journal-back-link">بازگشت به مجله <ArrowLeft size={16} aria-hidden="true" /></Link></aside>
            <div className="journal-reading-column">
              <details className="journal-mobile-contents"><summary>در این یادداشت <ChevronDown size={18} aria-hidden="true" /></summary><nav aria-label="فهرست مطلب در موبایل">{contents}</nav></details>
              <section className="journal-quick-answer" aria-labelledby="quick-answer"><p className="journal-eyebrow" id="quick-answer">اگر فقط یک دقیقه وقت دارید</p><p>{post.summary}</p></section>
              <div className="journal-prose"><JournalRichText content={post.content} /></div>
              <section id="takeaway" className="journal-takeaway"><p className="journal-eyebrow">یادداشت آخر</p><h2>{post.takeaway}</h2><Link href={post.collection.href} className="journal-text-link">{post.collection.label} <ArrowLeft size={18} aria-hidden="true" /></Link></section>
              <footer className="journal-article-footer"><div className="journal-author-bio"><span className="journal-author-avatar" aria-hidden="true">ن‌پ</span><div><Link href={post.author.url}>{post.author.name}</Link><p>{post.author.description}</p></div></div><ArticleTools key={post.slug} title={post.title} /></footer>
            </div>
            <div className="journal-margin-note" aria-hidden="true"><span lang="en" dir="ltr">THE ART OF LIVING WELL</span></div>
          </div>
        </article>
        {related.length ? <section className="journal-related" aria-labelledby="related-heading"><div className="journal-section-heading"><div><p className="journal-eyebrow">ادامه این مسیر</p><h2 id="related-heading">شاید این‌ها را هم دوست داشته باشید</h2></div><Link href="/blog" className="journal-text-link">همه مطالب <ArrowLeft size={18} aria-hidden="true" /></Link></div><div className="journal-card-grid">{related.map((item) => <PostCard key={item.slug} post={item} />)}</div></section> : null}
      </div>
    </main>
  );
}
