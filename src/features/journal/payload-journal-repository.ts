import "server-only";

import { unstable_cache } from "next/cache";
import { cache } from "react";
import { getPayload } from "payload";

import config from "../../../payload.config";
import type { Media, Post as PayloadPost } from "@/payload-types";
import { journalAuthor } from "./config";
import { journalTableOfContents } from "./content";
import type { JournalCategory, JournalPost, JournalRichText } from "./types";

const JOURNAL_REVALIDATE_SECONDS = 300;
const getJournalPayload = cache(() => getPayload({ config }));

function mediaPath(media: number | Media | null | undefined) {
  if (!media || typeof media === "number") return null;
  if (media.filename) return `/api/media/file/${encodeURIComponent(media.filename)}`;
  if (!media.url) return null;
  try {
    return new URL(media.url).pathname;
  } catch {
    return media.url;
  }
}

function mediaRecord(media: number | Media | null | undefined) {
  return media && typeof media === "object" ? media : null;
}

function relationshipSlug(value: number | PayloadPost) {
  return typeof value === "object" ? value.slug : null;
}

function mapPost(post: PayloadPost): JournalPost | null {
  const hero = mediaRecord(post.heroImage);
  const image = mediaPath(post.heroImage);
  if (!image || !hero || !post.publishedAt || !post.content) return null;

  const socialImage = mediaPath(post.seo?.socialImage);
  const content = post.content as JournalRichText;
  return {
    id: post.id,
    slug: post.slug,
    category: post.category as JournalCategory,
    title: post.title,
    description: post.description,
    image,
    imageAlt: hero.alt,
    imageCaption: post.heroCaption || hero.captionFa || "",
    publishedAt: post.publishedAt,
    updatedAt: post.updatedAt,
    summary: post.summary,
    content,
    takeaway: post.takeaway,
    relatedSlugs: (post.relatedPosts ?? []).map(relationshipSlug).filter((slug): slug is string => Boolean(slug)),
    collection: {
      label: post.callToAction?.label || "دیدن محصولات",
      href: post.callToAction?.href || "/shop",
    },
    author: {
      name: post.authorName || journalAuthor.name,
      description: post.authorBio || journalAuthor.description,
      url: post.authorUrl || journalAuthor.url,
    },
    readingTimeMinutes: Math.max(1, post.readingTimeMinutes || 1),
    wordCount: Math.max(0, post.wordCount || 0),
    toc: journalTableOfContents(content),
    featured: Boolean(post.featured),
    seo: {
      title: post.seo?.title || undefined,
      description: post.seo?.description || undefined,
      socialImage: socialImage || undefined,
      noIndex: Boolean(post.seo?.noIndex),
      primaryTopic: post.seo?.primaryTopic || undefined,
    },
  };
}

async function findJournalPosts() {
  const payload = await getJournalPayload();
  const result = await payload.find({
    collection: "posts",
    depth: 2,
    limit: 100,
    overrideAccess: false,
    pagination: false,
    sort: ["-featured", "-sortOrder", "-publishedAt"],
  });
  return result.docs.map(mapPost).filter((post): post is JournalPost => Boolean(post));
}

const getCachedJournalPosts = unstable_cache(
  findJournalPosts,
  ["nilper-payload-journal-posts"],
  { revalidate: JOURNAL_REVALIDATE_SECONDS, tags: ["payload-journal"] },
);

export const getJournalPosts = cache(() => getCachedJournalPosts());

export const getJournalPost = cache(async (slug: string) =>
  (await getJournalPosts()).find((post) => post.slug === slug) ?? null,
);
