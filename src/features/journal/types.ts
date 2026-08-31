export type JournalCategory = "planning" | "materials" | "lighting" | "living";

export type ArticleSection = {
  id: string;
  title: string;
  paragraphs: string[];
  bullets?: string[];
  note?: string;
  table?: { caption: string; headings: string[]; rows: string[][] };
};

export type JournalPost = {
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
