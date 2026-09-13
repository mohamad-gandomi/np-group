import type { JournalRichText, JournalRichTextNode, JournalTocItem } from "./types";

function textFromNode(node: JournalRichTextNode): string {
  if (typeof node.text === "string") return node.text;
  return (node.children ?? []).map(textFromNode).join(" ");
}

export function journalPlainText(content: JournalRichText | null | undefined) {
  return content?.root?.children?.map(textFromNode).join(" ").replace(/\s+/gu, " ").trim() ?? "";
}

export function journalReadingStats(content: JournalRichText | null | undefined) {
  const text = journalPlainText(content);
  const wordCount = text.match(/[\p{L}\p{N}]+(?:[‌'-][\p{L}\p{N}]+)*/gu)?.length ?? 0;
  return { wordCount, readingTimeMinutes: Math.max(1, Math.ceil(wordCount / 180)) };
}

export function headingId(title: string, counts = new Map<string, number>()) {
  const base = title
    .normalize("NFKC")
    .toLocaleLowerCase("fa")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "") || "section";
  const count = (counts.get(base) ?? 0) + 1;
  counts.set(base, count);
  return count === 1 ? base : `${base}-${count}`;
}

export function journalTableOfContents(content: JournalRichText | null | undefined): JournalTocItem[] {
  const counts = new Map<string, number>();
  return (content?.root?.children ?? []).flatMap((node) => {
    if (node.type !== "heading" || node.tag !== "h2") return [];
    const title = textFromNode(node).replace(/\s+/gu, " ").trim();
    return title ? [{ id: headingId(title, counts), title }] : [];
  });
}
