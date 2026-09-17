import assert from "node:assert/strict";
import { getPayload } from "payload";

import config from "../../payload.config";
import { journalReadingStats, journalTableOfContents } from "../features/journal/content";
import type { JournalRichText } from "../features/journal/types";

const payload = await getPayload({ config });

try {
  const publicPosts = await payload.find({ collection: "posts", depth: 2, limit: 100, overrideAccess: false });
  assert.equal(publicPosts.docs.length, 4, "the four original articles are publicly available from Payload");

  for (const post of publicPosts.docs) {
    assert.equal(post._status, "published");
    assert.ok(post.publishedAt);
    assert.equal(typeof post.heroImage, "object", "hero media is populated");
    const content = post.content as JournalRichText;
    const stats = journalReadingStats(content);
    assert.equal(post.wordCount, stats.wordCount, "word count is derived from rich text");
    assert.equal(post.readingTimeMinutes, stats.readingTimeMinutes, "reading time is derived from rich text");
    assert.ok(journalTableOfContents(content).length >= 3, "H2 headings produce a table of contents");
  }

  const heroImage = publicPosts.docs[0]?.heroImage;
  const blogCategory = publicPosts.docs[0]?.category;
  assert.ok(heroImage);
  assert.ok(blogCategory);
  const draftSlug = `phase12-private-draft-${Date.now()}`;
  const draft = await payload.create({
    collection: "posts",
    draft: true,
    data: {
      title: "پیش‌نویس بررسی فاز دوازده",
      slug: draftSlug,
      category: typeof blogCategory === "object" ? blogCategory.id : blogCategory,
      description: "این رکورد موقت فقط جداسازی پیش‌نویس از محتوای عمومی را بررسی می‌کند.",
      summary: "این مطلب نباید پیش از انتشار در سایت عمومی نمایش داده شود.",
      content: { root: { type: "root", direction: "rtl", format: "", indent: 0, version: 1, children: [{ type: "heading", tag: "h2", direction: "rtl", format: "", indent: 0, version: 1, children: [{ type: "text", text: "عنوان آزمایشی", detail: 0, format: 0, mode: "normal", style: "", version: 1 }] }, { type: "paragraph", direction: "rtl", format: "", indent: 0, version: 1, children: [{ type: "text", text: "متن آزمایشی برای محاسبه زمان مطالعه", detail: 0, format: 0, mode: "normal", style: "", version: 1 }] }] } },
      takeaway: "پیش‌نویس خصوصی باقی می‌ماند.",
      callToAction: { label: "بازگشت", href: "/blog" },
      authorName: "تحریریه ان‌پی",
      _status: "draft",
    },
  });
  const hiddenDraft = await payload.find({ collection: "posts", overrideAccess: false, where: { slug: { equals: draftSlug } } });
  assert.equal(hiddenDraft.totalDocs, 0, "draft posts are hidden from public readers");
  await payload.delete({ collection: "posts", id: draft.id, overrideAccess: true });

  payload.logger.info("Phase 12 verification passed: dynamic posts, derived reading data, TOC, media, and draft isolation.");
} finally {
  await payload.destroy();
}
