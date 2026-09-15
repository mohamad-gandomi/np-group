export type JournalCategory = "planning" | "materials" | "lighting" | "living";

export type JournalRichTextNode = {
  type?: string;
  tag?: string;
  text?: string;
  children?: JournalRichTextNode[];
  [key: string]: unknown;
};

export type JournalRichText = {
  root: JournalRichTextNode & { children: JournalRichTextNode[] };
};

export type JournalTocItem = { id: string; title: string };

export type JournalPost = {
  id: number | string;
  slug: string;
  category: string;
  categoryLabel: string;
  title: string;
  description: string;
  image: string;
  imageAlt: string;
  imageCaption: string;
  publishedAt: string;
  updatedAt: string;
  summary: string;
  content: JournalRichText;
  takeaway: string;
  relatedSlugs: string[];
  collection: { label: string; href: string };
  author: { name: string; description: string; url: string };
  readingTimeMinutes: number;
  wordCount: number;
  toc: JournalTocItem[];
  featured: boolean;
  seo: {
    title?: string;
    description?: string;
    socialImage?: string;
    noIndex: boolean;
    primaryTopic?: string;
  };
};

export type ArticleSection = {
  id: string;
  title: string;
  paragraphs: string[];
  bullets?: string[];
  note?: string;
  table?: { caption: string; headings: string[]; rows: string[][] };
};

export type LegacyJournalPost = {
  slug: string;
  category: JournalCategory;
  title: string;
  description: string;
  image: string;
  imageAlt: string;
  imageCaption: string;
  publishedAt: string;
  updatedAt: string;
  summary: string;
  introduction: string;
  sections: ArticleSection[];
  takeaway: string;
  relatedSlugs: string[];
  collection: { label: string; href: string };
};
