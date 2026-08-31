import Image from "next/image";
import Link from "next/link";
import { ArrowUpLeft } from "lucide-react";

import { formatJournalDate, journalNumber } from "../format";
import { categoryLabel, readingMinutes } from "../posts";
import type { JournalPost } from "../types";

export function PostCard({ post }: { post: JournalPost }) {
  return (
    <article className="journal-card">
      <Link href={`/blog/${post.slug}`} className="journal-card-link" aria-labelledby={`article-${post.slug}`}>
        <div className="journal-card-image">
          <Image src={post.image} alt={post.imageAlt} fill sizes="(max-width: 700px) calc(100vw - 40px), (max-width: 1100px) 46vw, 580px" />
          <span className="journal-card-arrow" aria-hidden="true"><ArrowUpLeft size={20} /></span>
        </div>
        <div className="journal-meta"><span className="journal-category">{categoryLabel(post.category)}</span><span>{journalNumber.format(readingMinutes(post))} دقیقه مطالعه</span></div>
        <h3 id={`article-${post.slug}`}>{post.title}</h3>
        <p className="journal-card-description">{post.description}</p>
        <time className="journal-card-date" dateTime={post.publishedAt}>{formatJournalDate(post.publishedAt)}</time>
      </Link>
    </article>
  );
}
