import type { Metadata } from "next";

import { siteConfig } from "@/config/site";
import { journalAuthor } from "./config";
import type { JournalPost } from "./types";

export const journalTitle = "مجله ان‌پی؛ راهنمای مبلمان، نور و زندگی";
export const journalDescription = "یادداشت‌هایی برای خانه‌ای که دوستش دارید؛ راهنمای انتخاب مبلمان، شناخت پارچه و متریال، نورپردازی و چیدمان فضا.";
export const absoluteJournalUrl = (path: string) => new URL(path, siteConfig.url).href;

export function journalMetadata(post?: JournalPost): Metadata {
  const title = post?.seo.title || post?.title || journalTitle;
  const description = post?.seo.description || post?.description || journalDescription;
  const path = post ? `/blog/${post.slug}` : "/blog";
  const image = { url: post?.seo.socialImage || post?.image || "/placeholders/living.jpg", alt: post?.imageAlt || journalTitle };
  const index = !post?.seo.noIndex;
  const author = post?.author ?? journalAuthor;
  return {
    title,
    description,
    alternates: { canonical: path },
    authors: [{ name: author.name, url: absoluteJournalUrl(author.url) }],
    openGraph: {
      title,
      description,
      url: path,
      siteName: `گروه ${siteConfig.nameFa}`,
      locale: "fa_IR",
      images: [image],
      ...(post ? { type: "article", publishedTime: post.publishedAt, modifiedTime: post.updatedAt, authors: [absoluteJournalUrl(author.url)], section: post.categoryLabel } : { type: "website" }),
    },
    twitter: { card: "summary_large_image", title, description, images: [image] },
    robots: { index, follow: true, googleBot: { index, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } },
  };
}

export function journalSchema(post: JournalPost): Record<string, unknown>;
export function journalSchema(post: undefined, posts: JournalPost[]): Record<string, unknown>;
export function journalSchema(post?: JournalPost, posts: JournalPost[] = []) {
  const url = absoluteJournalUrl(post ? `/blog/${post.slug}` : "/blog");
  const publisher = {
    "@type": "Organization", "@id": absoluteJournalUrl("/#organization"), name: `گروه ${siteConfig.nameFa}`,
    url: absoluteJournalUrl("/"), logo: { "@type": "ImageObject", url: absoluteJournalUrl("/logos/np-mark.png") },
  };
  const breadcrumbs = [
    { name: "خانه", item: absoluteJournalUrl("/") },
    { name: "مجله ان‌پی", item: absoluteJournalUrl("/blog") },
    ...(post ? [{ name: post.title, item: url }] : []),
  ];
  return {
    "@context": "https://schema.org",
    "@graph": [
      publisher,
      { "@type": "BreadcrumbList", "@id": `${url}#breadcrumbs`, itemListElement: breadcrumbs.map((item, index) => ({ "@type": "ListItem", position: index + 1, ...item })) },
      post ? {
        "@type": "BlogPosting", "@id": `${url}#article`, url,
        mainEntityOfPage: { "@type": "WebPage", "@id": url },
        headline: post.title, description: post.seo.description || post.description, abstract: post.summary,
        image: [absoluteJournalUrl(post.seo.socialImage || post.image)],
        datePublished: post.publishedAt, dateModified: post.updatedAt,
        author: { "@type": "Organization", name: post.author.name, url: absoluteJournalUrl(post.author.url) },
        publisher: { "@id": publisher["@id"] }, articleSection: post.categoryLabel,
        ...(post.seo.primaryTopic ? { about: post.seo.primaryTopic, keywords: post.seo.primaryTopic } : {}),
        wordCount: post.wordCount, timeRequired: `PT${post.readingTimeMinutes}M`, inLanguage: "fa-IR", isAccessibleForFree: true,
      } : {
        "@type": "CollectionPage", "@id": url, url, name: journalTitle, description: journalDescription,
        inLanguage: "fa-IR", publisher: { "@id": publisher["@id"] },
        mainEntity: { "@type": "ItemList", numberOfItems: posts.length, itemListElement: posts.map((item, index) => ({ "@type": "ListItem", position: index + 1, name: item.title, url: absoluteJournalUrl(`/blog/${item.slug}`) })) },
      },
    ],
  };
}
